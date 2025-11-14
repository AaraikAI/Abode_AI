/**
 * User-Generated Content Marketplace
 *
 * Platform for sharing and monetizing 3D models, materials, and templates
 * Includes NFT-like IP protection and community ratings
 */

export interface MarketplaceAsset {
  id: string
  creatorId: string
  creatorName: string
  type: 'model' | 'material' | 'template' | 'scene' | 'hdri' | 'texture'
  title: string
  description: string
  tags: string[]
  category: string
  subcategory?: string

  // Pricing
  pricing: {
    type: 'free' | 'paid' | 'pay-what-you-want'
    amount?: number // USD cents
    currency: string
    revenueSplit: {
      creator: number // percentage (e.g., 70)
      platform: number // percentage (e.g., 30)
    }
  }

  // Files
  files: {
    preview: string[] // Image URLs
    thumbnail: string
    downloadUrl: string
    fileSize: number // bytes
    format: string // e.g., 'glb', 'fbx', 'obj'
  }

  // Metadata
  metadata: {
    polygonCount?: number
    dimensions?: { width: number; height: number; depth: number }
    textureResolution?: string
    compatibleWith?: string[] // Software/engine compatibility
    license: 'CC0' | 'CC-BY' | 'CC-BY-SA' | 'Commercial' | 'Custom'
    version: string
  }

  // Stats
  stats: {
    downloads: number
    views: number
    likes: number
    rating: number // 0-5
    ratingCount: number
    revenue?: number // Total revenue generated
  }

  // IP Protection (NFT-like)
  ipProtection?: {
    blockchainHash: string // Hash on blockchain for provenance
    mintedAt: Date
    ownershipProof: string
  }

  // Status
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'removed'
  rejectionReason?: string

  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}

export interface AssetReview {
  id: string
  assetId: string
  userId: string
  userName: string
  rating: number // 1-5
  title?: string
  comment?: string
  helpful: number // Number of users who found this helpful
  verified: boolean // Verified purchase
  createdAt: Date
}

export interface AssetPurchase {
  id: string
  assetId: string
  userId: string
  amount: number // USD cents
  paymentMethod: string
  stripePaymentIntentId: string
  downloadCount: number
  maxDownloads: number // -1 for unlimited
  purchasedAt: Date
  expiresAt?: Date // For time-limited licenses
}

export interface CreatorProfile {
  userId: string
  displayName: string
  bio?: string
  website?: string
  social?: {
    twitter?: string
    instagram?: string
    artstation?: string
  }
  stats: {
    totalAssets: number
    totalSales: number
    totalRevenue: number
    totalDownloads: number
    averageRating: number
  }
  badges: Array<{
    type: 'top_seller' | 'verified' | 'pro' | 'early_adopter'
    earnedAt: Date
  }>
}

export interface MarketplaceSearchParams {
  query?: string
  type?: MarketplaceAsset['type']
  category?: string
  tags?: string[]
  priceMin?: number
  priceMax?: number
  rating?: number
  sortBy?: 'popular' | 'recent' | 'rating' | 'downloads' | 'price_low' | 'price_high'
  page?: number
  limit?: number
}

export class MarketplaceService {
  /**
   * Submit asset to marketplace
   */
  async submitAsset(
    asset: Omit<MarketplaceAsset, 'id' | 'stats' | 'status' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<MarketplaceAsset> {
    // Validate asset
    this.validateAsset(asset)

    // Upload files to S3 (in production)
    const uploadedFiles = await this.uploadAssetFiles(asset.files)

    // Generate blockchain hash for IP protection
    const ipProtection = await this.mintAssetNFT(asset, userId)

    const fullAsset: MarketplaceAsset = {
      id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...asset,
      creatorId: userId,
      files: uploadedFiles,
      stats: {
        downloads: 0,
        views: 0,
        likes: 0,
        rating: 0,
        ratingCount: 0
      },
      status: 'pending_review',
      ipProtection,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Store in database
    console.log('Asset submitted for review:', fullAsset.id)

    // Notify review team
    await this.notifyReviewTeam(fullAsset)

    return fullAsset
  }

  /**
   * Validate asset before submission
   */
  private validateAsset(asset: Partial<MarketplaceAsset>): void {
    if (!asset.title || asset.title.length < 5) {
      throw new Error('Title must be at least 5 characters')
    }

    if (!asset.description || asset.description.length < 20) {
      throw new Error('Description must be at least 20 characters')
    }

    if (!asset.tags || asset.tags.length === 0) {
      throw new Error('At least one tag is required')
    }

    if (!asset.category) {
      throw new Error('Category is required')
    }

    if (asset.pricing?.type === 'paid' && (!asset.pricing.amount || asset.pricing.amount < 99)) {
      throw new Error('Paid assets must be priced at least $0.99')
    }

    if (!asset.files?.preview || asset.files.preview.length === 0) {
      throw new Error('At least one preview image is required')
    }

    if (!asset.metadata?.license) {
      throw new Error('License type is required')
    }
  }

  /**
   * Upload asset files to storage
   */
  private async uploadAssetFiles(files: MarketplaceAsset['files']): Promise<MarketplaceAsset['files']> {
    // In production, upload to S3 or similar
    console.log('Uploading asset files...')
    return files
  }

  /**
   * Mint asset NFT for IP protection
   */
  private async mintAssetNFT(asset: Partial<MarketplaceAsset>, userId: string): Promise<MarketplaceAsset['ipProtection']> {
    // In production, integrate with blockchain (Ethereum, Polygon, etc.)
    const assetData = JSON.stringify({
      title: asset.title,
      creator: userId,
      timestamp: Date.now(),
      fileHash: 'sha256_hash_of_file' // Would be actual file hash
    })

    const blockchainHash = Buffer.from(assetData).toString('base64')

    return {
      blockchainHash,
      mintedAt: new Date(),
      ownershipProof: `proof_${userId}_${Date.now()}`
    }
  }

  /**
   * Notify review team
   */
  private async notifyReviewTeam(asset: MarketplaceAsset): Promise<void> {
    // Send notification to review team
    console.log(`New asset pending review: ${asset.title} by ${asset.creatorName}`)
  }

  /**
   * Search marketplace assets
   */
  async searchAssets(params: MarketplaceSearchParams): Promise<{
    assets: MarketplaceAsset[]
    total: number
    page: number
    pages: number
  }> {
    const page = params.page || 1
    const limit = params.limit || 24

    // In production, query from database with filters
    const mockAssets: MarketplaceAsset[] = []

    return {
      assets: mockAssets,
      total: 0,
      page,
      pages: 0
    }
  }

  /**
   * Purchase asset
   */
  async purchaseAsset(
    assetId: string,
    userId: string,
    paymentMethodId: string
  ): Promise<AssetPurchase> {
    // Get asset
    const asset = await this.getAsset(assetId)
    if (!asset) {
      throw new Error('Asset not found')
    }

    if (asset.pricing.type === 'free') {
      // Free asset - just record download
      return this.recordFreeDownload(assetId, userId)
    }

    // Create Stripe payment intent
    const paymentIntent = await this.createStripePayment(
      asset.pricing.amount!,
      paymentMethodId,
      {
        assetId,
        userId,
        creatorId: asset.creatorId
      }
    )

    // Record purchase
    const purchase: AssetPurchase = {
      id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assetId,
      userId,
      amount: asset.pricing.amount!,
      paymentMethod: paymentMethodId,
      stripePaymentIntentId: paymentIntent.id,
      downloadCount: 0,
      maxDownloads: -1, // Unlimited
      purchasedAt: new Date()
    }

    // Store in database
    console.log('Purchase recorded:', purchase.id)

    // Update asset stats
    await this.updateAssetStats(assetId, {
      downloads: 1,
      revenue: asset.pricing.amount!
    })

    // Distribute revenue to creator
    await this.distributeRevenue(asset, purchase)

    return purchase
  }

  /**
   * Record free download
   */
  private async recordFreeDownload(assetId: string, userId: string): Promise<AssetPurchase> {
    const purchase: AssetPurchase = {
      id: `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assetId,
      userId,
      amount: 0,
      paymentMethod: 'free',
      stripePaymentIntentId: '',
      downloadCount: 0,
      maxDownloads: -1,
      purchasedAt: new Date()
    }

    // Update asset stats
    await this.updateAssetStats(assetId, { downloads: 1 })

    return purchase
  }

  /**
   * Create Stripe payment
   */
  private async createStripePayment(
    amount: number,
    paymentMethodId: string,
    metadata: Record<string, string>
  ): Promise<{ id: string }> {
    // In production, use Stripe SDK
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount,
    //   currency: 'usd',
    //   payment_method: paymentMethodId,
    //   confirm: true,
    //   metadata
    // })

    return { id: `pi_${Date.now()}` }
  }

  /**
   * Distribute revenue to creator
   */
  private async distributeRevenue(asset: MarketplaceAsset, purchase: AssetPurchase): Promise<void> {
    const creatorAmount = Math.floor(purchase.amount * asset.pricing.revenueSplit.creator / 100)
    const platformAmount = purchase.amount - creatorAmount

    console.log(`Revenue distribution: Creator: $${creatorAmount/100}, Platform: $${platformAmount/100}`)

    // In production, create Stripe transfer to creator's connected account
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    // await stripe.transfers.create({
    //   amount: creatorAmount,
    //   currency: 'usd',
    //   destination: creatorStripeAccountId,
    //   metadata: { purchaseId: purchase.id }
    // })
  }

  /**
   * Submit review for asset
   */
  async submitReview(
    assetId: string,
    userId: string,
    userName: string,
    rating: number,
    comment?: string,
    title?: string
  ): Promise<AssetReview> {
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    // Check if user has purchased asset
    const hasPurchased = await this.hasUserPurchased(assetId, userId)

    const review: AssetReview = {
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assetId,
      userId,
      userName,
      rating,
      title,
      comment,
      helpful: 0,
      verified: hasPurchased,
      createdAt: new Date()
    }

    // Store in database
    console.log('Review submitted:', review.id)

    // Update asset rating
    await this.updateAssetRating(assetId)

    return review
  }

  /**
   * Check if user has purchased asset
   */
  private async hasUserPurchased(assetId: string, userId: string): Promise<boolean> {
    // In production, query database
    return false
  }

  /**
   * Update asset rating
   */
  private async updateAssetRating(assetId: string): Promise<void> {
    // Recalculate average rating from all reviews
    console.log('Updating asset rating:', assetId)
  }

  /**
   * Get asset details
   */
  async getAsset(assetId: string): Promise<MarketplaceAsset | null> {
    // In production, query database
    return null
  }

  /**
   * Update asset stats
   */
  private async updateAssetStats(assetId: string, updates: Partial<MarketplaceAsset['stats']>): Promise<void> {
    // Increment stats in database
    console.log('Updating asset stats:', assetId, updates)
  }

  /**
   * Like/unlike asset
   */
  async toggleLike(assetId: string, userId: string): Promise<{ liked: boolean; totalLikes: number }> {
    // Check if already liked
    const isLiked = await this.isAssetLiked(assetId, userId)

    if (isLiked) {
      // Unlike
      await this.updateAssetStats(assetId, { likes: -1 })
      return { liked: false, totalLikes: 0 } // Would return actual count
    } else {
      // Like
      await this.updateAssetStats(assetId, { likes: 1 })
      return { liked: true, totalLikes: 1 } // Would return actual count
    }
  }

  /**
   * Check if asset is liked by user
   */
  private async isAssetLiked(assetId: string, userId: string): Promise<boolean> {
    // In production, query database
    return false
  }

  /**
   * Get creator profile
   */
  async getCreatorProfile(userId: string): Promise<CreatorProfile | null> {
    // In production, query database and calculate stats
    return null
  }

  /**
   * Get user's purchases
   */
  async getUserPurchases(userId: string): Promise<AssetPurchase[]> {
    // In production, query database
    return []
  }

  /**
   * Generate download link for purchased asset
   */
  async generateDownloadLink(purchaseId: string, userId: string): Promise<{ url: string; expiresAt: Date }> {
    // Verify purchase ownership
    // Generate signed URL (S3 presigned URL in production)

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    return {
      url: `https://downloads.abodeai.com/assets/${purchaseId}?expires=${expiresAt.getTime()}`,
      expiresAt
    }
  }

  /**
   * Report asset for violations
   */
  async reportAsset(
    assetId: string,
    userId: string,
    reason: 'copyright' | 'inappropriate' | 'low_quality' | 'spam' | 'other',
    details: string
  ): Promise<{ reportId: string }> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log(`Asset ${assetId} reported by ${userId}: ${reason} - ${details}`)

    // Store report and notify moderators

    return { reportId }
  }

  /**
   * Get trending assets
   */
  async getTrendingAssets(period: '24h' | '7d' | '30d', limit: number = 10): Promise<MarketplaceAsset[]> {
    // Calculate trending score based on recent downloads, views, likes
    // In production, use Redis cache for performance

    return []
  }

  /**
   * Get featured assets (curated by admins)
   */
  async getFeaturedAssets(): Promise<MarketplaceAsset[]> {
    // In production, query database for featured flag
    return []
  }
}
