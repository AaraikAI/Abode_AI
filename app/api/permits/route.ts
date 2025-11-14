/**
 * Permit Applications API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PermitSystemService } from '@/lib/services/permit-system'

const permitService = new PermitSystemService()

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'create') {
      const jurisdiction = await permitService.findJurisdiction(body.property.address)
      if (!jurisdiction) {
        return NextResponse.json({ error: 'Jurisdiction not found for address' }, { status: 404 })
      }

      const application = await permitService.createApplication({
        projectId: body.projectId,
        userId: user.id,
        jurisdictionId: jurisdiction.id,
        permitType: body.permitType,
        applicant: body.applicant,
        property: body.property,
        projectDetails: body.projectDetails
      })

      await supabase.from('permit_applications').insert({
        id: application.id,
        project_id: application.projectId,
        user_id: user.id,
        jurisdiction_id: application.jurisdictionId,
        permit_type: application.permitType,
        status: application.status,
        applicant: application.applicant,
        property: application.property,
        project_details: application.projectDetails,
        fees: application.fees
      })

      return NextResponse.json({ success: true, application })
    } else if (action === 'compliance-check') {
      const checks = await permitService.runComplianceChecks(body.applicationId)
      return NextResponse.json({ success: true, checks })
    } else if (action === 'submit') {
      const result = await permitService.submitApplication(body.applicationId)
      return NextResponse.json({ success: result.success, ...result })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const applications = await permitService.getUserApplications(user.id)
    return NextResponse.json({ success: true, applications })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
