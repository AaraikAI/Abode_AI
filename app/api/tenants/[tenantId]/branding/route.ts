/**
 * Tenant Branding Configuration API Endpoint
 *
 * Manages white-label branding per tenant
 * Supports GET (get branding), PUT (update branding)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface TenantBranding {
  id: string
  tenant_id: string
  logo_url: string | null
  logo_url_dark: string | null
  favicon_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family: string
  custom_css: string | null
  custom_domain: string | null
  created_at: string
  updated_at: string
}

interface UpdateBrandingRequest {
  logoUrl?: string | null
  logoUrlDark?: string | null
  faviconUrl?: string | null
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  fontFamily?: string
  customCss?: string | null
  customDomain?: string | null
}

/**
 * Verify user has access to tenant
 */
async function verifyTenantAccess(
  supabase: any,
  userId: string,
  tenantId: string
): Promise<{ hasAccess: boolean; isOwner: boolean; error?: string }> {
  // Check if tenant exists
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, owner_id, status')
    .eq('id', tenantId)
    .single()

  if (!tenant) {
    return { hasAccess: false, isOwner: false, error: 'Tenant not found' }
  }

  if (tenant.status !== 'active') {
    return { hasAccess: false, isOwner: false, error: 'Tenant is not active' }
  }

  // Check if user is owner
  if (tenant.owner_id === userId) {
    return { hasAccess: true, isOwner: true }
  }

  // Check if user is admin member
  const { data: membership } = await supabase
    .from('tenant_users')
    .select('role, status')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single()

  if (!membership || membership.status !== 'active') {
    return { hasAccess: false, isOwner: false, error: 'Access denied' }
  }

  const hasAdminRole = membership.role === 'admin' || membership.role === 'owner'
  return { hasAccess: hasAdminRole, isOwner: false }
}

/**
 * Validate hex color format
 */
function isValidHexColor(color: string): boolean {
  return /^#([0-9A-F]{3}){1,2}$/i.test(color)
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * GET - Get tenant branding configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const supabase = createClient()
    const { tenantId } = params

    // Verify authentication (allow public access to branding for display purposes)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Public access: anyone can view branding
    // Private data like custom_css might be restricted

    // Verify tenant exists
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, name, slug, status')
      .eq('id', tenantId)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Get branding configuration
    const { data: branding, error } = await supabase
      .from('tenant_branding')
      .select('*')
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      console.error('Failed to fetch branding:', error)

      // If branding doesn't exist, create default
      if (error.code === 'PGRST116') {
        const { data: newBranding } = await supabase
          .from('tenant_branding')
          .insert({
            tenant_id: tenantId,
            logo_url: null,
            logo_url_dark: null,
            favicon_url: null,
            primary_color: '#3b82f6',
            secondary_color: '#10b981',
            accent_color: '#f59e0b',
            font_family: 'Inter, sans-serif',
            custom_css: null,
            custom_domain: null,
          })
          .select()
          .single()

        return NextResponse.json({
          branding: newBranding as TenantBranding,
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
          },
        })
      }

      return NextResponse.json({ error: 'Failed to fetch branding' }, { status: 500 })
    }

    // Filter sensitive data for non-authenticated requests
    let brandingData = branding as TenantBranding
    if (!user) {
      // Public users don't get custom_css (may contain sensitive info)
      brandingData = { ...branding, custom_css: null }
    } else {
      // Verify user access for full data
      const { hasAccess } = await verifyTenantAccess(supabase, user.id, tenantId)
      if (!hasAccess) {
        brandingData = { ...branding, custom_css: null }
      }
    }

    return NextResponse.json({
      branding: brandingData,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    })
  } catch (error) {
    console.error('Tenant Branding API GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT - Update tenant branding configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const supabase = createClient()
    const { tenantId } = params

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify tenant access
    const { hasAccess, error: accessError } = await verifyTenantAccess(
      supabase,
      user.id,
      tenantId
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: accessError || 'Access denied. Admin permissions required.' },
        { status: 403 }
      )
    }

    const body = (await request.json()) as UpdateBrandingRequest

    // Validate at least one field is provided
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'At least one branding field must be provided' },
        { status: 400 }
      )
    }

    // Validate color formats
    if (body.primaryColor && !isValidHexColor(body.primaryColor)) {
      return NextResponse.json({ error: 'Invalid primaryColor format. Use hex color (e.g., #3b82f6)' }, { status: 400 })
    }

    if (body.secondaryColor && !isValidHexColor(body.secondaryColor)) {
      return NextResponse.json({ error: 'Invalid secondaryColor format. Use hex color (e.g., #10b981)' }, { status: 400 })
    }

    if (body.accentColor && !isValidHexColor(body.accentColor)) {
      return NextResponse.json({ error: 'Invalid accentColor format. Use hex color (e.g., #f59e0b)' }, { status: 400 })
    }

    // Validate URLs
    if (body.logoUrl && body.logoUrl !== null && !isValidUrl(body.logoUrl)) {
      return NextResponse.json({ error: 'Invalid logoUrl format' }, { status: 400 })
    }

    if (body.logoUrlDark && body.logoUrlDark !== null && !isValidUrl(body.logoUrlDark)) {
      return NextResponse.json({ error: 'Invalid logoUrlDark format' }, { status: 400 })
    }

    if (body.faviconUrl && body.faviconUrl !== null && !isValidUrl(body.faviconUrl)) {
      return NextResponse.json({ error: 'Invalid faviconUrl format' }, { status: 400 })
    }

    // Validate custom domain
    if (body.customDomain && body.customDomain !== null) {
      const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i
      if (!domainRegex.test(body.customDomain)) {
        return NextResponse.json({ error: 'Invalid custom domain format' }, { status: 400 })
      }

      // Check if domain is already in use
      const { data: existingDomain } = await supabase
        .from('tenant_branding')
        .select('tenant_id')
        .eq('custom_domain', body.customDomain)
        .neq('tenant_id', tenantId)
        .single()

      if (existingDomain) {
        return NextResponse.json({ error: 'Custom domain already in use' }, { status: 409 })
      }
    }

    // Validate font family (basic validation)
    if (body.fontFamily) {
      if (body.fontFamily.length > 200) {
        return NextResponse.json({ error: 'Font family string too long' }, { status: 400 })
      }
    }

    // Validate custom CSS length
    if (body.customCss && body.customCss.length > 50000) {
      return NextResponse.json({ error: 'Custom CSS too large (max 50KB)' }, { status: 400 })
    }

    // Build update object
    const updateData: any = {}
    if (body.logoUrl !== undefined) updateData.logo_url = body.logoUrl
    if (body.logoUrlDark !== undefined) updateData.logo_url_dark = body.logoUrlDark
    if (body.faviconUrl !== undefined) updateData.favicon_url = body.faviconUrl
    if (body.primaryColor) updateData.primary_color = body.primaryColor
    if (body.secondaryColor) updateData.secondary_color = body.secondaryColor
    if (body.accentColor) updateData.accent_color = body.accentColor
    if (body.fontFamily) updateData.font_family = body.fontFamily
    if (body.customCss !== undefined) updateData.custom_css = body.customCss
    if (body.customDomain !== undefined) updateData.custom_domain = body.customDomain

    // Update branding
    const { data: branding, error } = await supabase
      .from('tenant_branding')
      .update(updateData)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update branding:', error)

      // If branding doesn't exist, create it
      if (error.code === 'PGRST116') {
        const { data: newBranding, error: insertError } = await supabase
          .from('tenant_branding')
          .insert({
            tenant_id: tenantId,
            logo_url: body.logoUrl ?? null,
            logo_url_dark: body.logoUrlDark ?? null,
            favicon_url: body.faviconUrl ?? null,
            primary_color: body.primaryColor ?? '#3b82f6',
            secondary_color: body.secondaryColor ?? '#10b981',
            accent_color: body.accentColor ?? '#f59e0b',
            font_family: body.fontFamily ?? 'Inter, sans-serif',
            custom_css: body.customCss ?? null,
            custom_domain: body.customDomain ?? null,
          })
          .select()
          .single()

        if (insertError) {
          console.error('Failed to create branding:', insertError)
          return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 })
        }

        // Record activity
        await supabase.from('activities').insert({
          user_id: user.id,
          action: 'tenant_branding_created',
          metadata: {
            tenant_id: tenantId,
            changes: updateData,
          },
        })

        return NextResponse.json({
          success: true,
          branding: newBranding as TenantBranding,
        })
      }

      return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 })
    }

    // Record activity
    await supabase.from('activities').insert({
      user_id: user.id,
      action: 'tenant_branding_updated',
      metadata: {
        tenant_id: tenantId,
        changes: updateData,
      },
    })

    return NextResponse.json({
      success: true,
      branding: branding as TenantBranding,
    })
  } catch (error) {
    console.error('Tenant Branding API PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
