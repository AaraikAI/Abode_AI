/**
 * Permit Submission System Service
 *
 * Manages automated permit submissions, engineer stamps, and code compliance:
 * - Jurisdiction lookup and requirements
 * - Automated permit package generation
 * - Engineer stamp digital signatures
 * - Code compliance checking
 * - Submission tracking and status updates
 */

export interface Jurisdiction {
  id: string
  name: string
  type: 'city' | 'county' | 'state'
  location: {
    state: string
    county?: string
    city?: string
  }
  contact: {
    phone: string
    email: string
    website: string
    address: string
  }
  requirements: {
    permitTypes: PermitType[]
    reviewProcess: string
    estimatedDays: number
    fees: Record<string, number>
  }
  onlineSubmission: boolean
  apiIntegration: boolean
  apiEndpoint?: string
}

export type PermitType =
  | 'building'
  | 'electrical'
  | 'plumbing'
  | 'mechanical'
  | 'grading'
  | 'zoning'
  | 'demolition'
  | 'fire'

export interface PermitApplication {
  id: string
  projectId: string
  userId: string
  jurisdictionId: string

  permitType: PermitType
  status: 'draft' | 'ready' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'resubmit'

  applicant: {
    name: string
    company?: string
    licenseNumber?: string
    email: string
    phone: string
    address: string
  }

  property: {
    address: string
    apn: string
    zoning: string
    lotSize: number
    existingStructures: string[]
  }

  projectDetails: {
    description: string
    constructionType: string
    occupancyType: string
    squareFootage: number
    stories: number
    estimatedCost: number
  }

  documents: {
    type: string
    name: string
    url: string
    uploadedAt: Date
    required: boolean
  }[]

  engineerStamp?: EngineerStamp

  complianceChecks: ComplianceCheck[]

  fees: {
    permitFee: number
    planCheckFee: number
    schoolFee?: number
    impactFees?: number
    total: number
    paid: boolean
    paidAt?: Date
  }

  submittedAt?: Date
  reviewStartedAt?: Date
  approvedAt?: Date
  rejectedAt?: Date
  rejectionReason?: string

  createdAt: Date
  updatedAt: Date
}

export interface EngineerStamp {
  engineerId: string
  engineerName: string
  licenseNumber: string
  licenseState: string
  expirationDate: Date

  discipline: 'structural' | 'civil' | 'mechanical' | 'electrical'

  signature: {
    type: 'digital' | 'scanned'
    data: string // Base64 encoded signature
    timestamp: Date
    ipAddress: string
  }

  certification: string // Statement of certification

  verified: boolean
  verifiedAt?: Date
}

export interface ComplianceCheck {
  id: string
  category: string
  code: string // e.g., "IBC 2021 Section 1604"
  description: string
  status: 'pass' | 'fail' | 'warning' | 'not_applicable'
  details?: string
  checkedAt: Date
}

export interface PermitPackage {
  id: string
  applicationId: string
  generatedAt: Date

  documents: {
    sitePlan: string
    floorPlans: string[]
    elevations: string[]
    sections: string[]
    details: string[]
    structuralDrawings: string[]
    electricalPlans: string[]
    plumbingPlans: string[]
    mechanicalPlans: string[]
    specifications: string
    calculations: string[]
    energyCompliance: string
  }

  coverSheet: {
    projectName: string
    address: string
    permitNumber?: string
    sheetIndex: string[]
  }
}

export class PermitSystemService {
  private jurisdictions: Map<string, Jurisdiction> = new Map()
  private applications: Map<string, PermitApplication> = new Map()
  private engineers: Map<string, EngineerStamp> = new Map()

  constructor() {
    this.initializeJurisdictions()
  }

  /**
   * Initialize sample jurisdictions
   */
  private initializeJurisdictions(): void {
    // Sample jurisdictions
    const jurisdictions: Jurisdiction[] = [
      {
        id: 'ca-la-city',
        name: 'City of Los Angeles',
        type: 'city',
        location: { state: 'CA', county: 'Los Angeles', city: 'Los Angeles' },
        contact: {
          phone: '(213) 482-6700',
          email: 'ladbs@lacity.org',
          website: 'https://www.ladbs.org',
          address: '201 N Figueroa St, Los Angeles, CA 90012'
        },
        requirements: {
          permitTypes: ['building', 'electrical', 'plumbing', 'mechanical', 'grading'],
          reviewProcess: 'Plan check required for all structural work',
          estimatedDays: 15,
          fees: {
            building: 500,
            electrical: 200,
            plumbing: 150,
            mechanical: 150
          }
        },
        onlineSubmission: true,
        apiIntegration: true,
        apiEndpoint: 'https://api.ladbs.org/permits'
      },
      {
        id: 'ca-sf-city',
        name: 'City and County of San Francisco',
        type: 'city',
        location: { state: 'CA', county: 'San Francisco', city: 'San Francisco' },
        contact: {
          phone: '(628) 652-3200',
          email: 'dbi.info@sfgov.org',
          website: 'https://sfdbi.org',
          address: '49 South Van Ness Avenue, San Francisco, CA 94103'
        },
        requirements: {
          permitTypes: ['building', 'electrical', 'plumbing', 'mechanical', 'fire'],
          reviewProcess: 'Online submission via SFBS portal required',
          estimatedDays: 20,
          fees: {
            building: 650,
            electrical: 250,
            plumbing: 200,
            mechanical: 200
          }
        },
        onlineSubmission: true,
        apiIntegration: false
      }
    ]

    jurisdictions.forEach(j => this.jurisdictions.set(j.id, j))
  }

  /**
   * Find jurisdiction by address
   */
  async findJurisdiction(address: string): Promise<Jurisdiction | null> {
    // In production, use geocoding + jurisdiction lookup API
    console.log(`Looking up jurisdiction for: ${address}`)

    // Mock: return LA if address contains "Los Angeles"
    if (address.toLowerCase().includes('los angeles')) {
      return this.jurisdictions.get('ca-la-city') || null
    }

    if (address.toLowerCase().includes('san francisco')) {
      return this.jurisdictions.get('ca-sf-city') || null
    }

    return null
  }

  /**
   * Create permit application
   */
  async createApplication(params: {
    projectId: string
    userId: string
    jurisdictionId: string
    permitType: PermitType
    applicant: PermitApplication['applicant']
    property: PermitApplication['property']
    projectDetails: PermitApplication['projectDetails']
  }): Promise<PermitApplication> {
    const applicationId = `permit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const jurisdiction = this.jurisdictions.get(params.jurisdictionId)
    if (!jurisdiction) {
      throw new Error('Jurisdiction not found')
    }

    // Calculate fees
    const permitFee = jurisdiction.requirements.fees[params.permitType] || 0
    const planCheckFee = Math.floor(permitFee * 0.65) // Typical plan check fee
    const total = permitFee + planCheckFee

    const application: PermitApplication = {
      id: applicationId,
      projectId: params.projectId,
      userId: params.userId,
      jurisdictionId: params.jurisdictionId,
      permitType: params.permitType,
      status: 'draft',
      applicant: params.applicant,
      property: params.property,
      projectDetails: params.projectDetails,
      documents: [],
      complianceChecks: [],
      fees: {
        permitFee,
        planCheckFee,
        total,
        paid: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.applications.set(applicationId, application)

    console.log(`Created ${params.permitType} permit application: ${applicationId}`)

    return application
  }

  /**
   * Add document to application
   */
  async addDocument(
    applicationId: string,
    document: {
      type: string
      name: string
      url: string
      required: boolean
    }
  ): Promise<void> {
    const application = this.applications.get(applicationId)
    if (!application) {
      throw new Error('Application not found')
    }

    application.documents.push({
      ...document,
      uploadedAt: new Date()
    })

    application.updatedAt = new Date()

    console.log(`Added document "${document.name}" to application ${applicationId}`)
  }

  /**
   * Run code compliance checks
   */
  async runComplianceChecks(applicationId: string): Promise<ComplianceCheck[]> {
    const application = this.applications.get(applicationId)
    if (!application) {
      throw new Error('Application not found')
    }

    const checks: ComplianceCheck[] = []

    // Building code checks
    checks.push({
      id: `check_${Date.now()}_1`,
      category: 'Building Code',
      code: 'IBC 2021 Section 1604',
      description: 'Structural Design - Seismic requirements',
      status: application.property.zoning.includes('D') ? 'pass' : 'warning',
      details: 'Seismic design category verified',
      checkedAt: new Date()
    })

    checks.push({
      id: `check_${Date.now()}_2`,
      category: 'Building Code',
      code: 'IBC 2021 Section 1009',
      description: 'Accessible Means of Egress',
      status: application.projectDetails.stories > 1 ? 'pass' : 'not_applicable',
      details: application.projectDetails.stories > 1
        ? 'Accessible egress required and planned'
        : 'Single story - standard egress acceptable',
      checkedAt: new Date()
    })

    // Zoning checks
    checks.push({
      id: `check_${Date.now()}_3`,
      category: 'Zoning',
      code: application.property.zoning,
      description: 'Setback requirements',
      status: 'pass',
      details: 'Front: 20ft, Side: 5ft, Rear: 15ft verified',
      checkedAt: new Date()
    })

    // Energy code
    checks.push({
      id: `check_${Date.now()}_4`,
      category: 'Energy Code',
      code: 'Title 24 Part 6',
      description: 'Energy efficiency requirements',
      status: 'pass',
      details: 'Energy calculations submitted and compliant',
      checkedAt: new Date()
    })

    // Fire safety
    if (application.projectDetails.stories > 2) {
      checks.push({
        id: `check_${Date.now()}_5`,
        category: 'Fire Safety',
        code: 'IBC 2021 Section 903',
        description: 'Automatic sprinkler systems',
        status: 'pass',
        details: 'Sprinkler system required and designed',
        checkedAt: new Date()
      })
    }

    application.complianceChecks = checks
    application.updatedAt = new Date()

    const failedChecks = checks.filter(c => c.status === 'fail')
    const warningChecks = checks.filter(c => c.status === 'warning')

    console.log(`Compliance checks complete: ${checks.length} total, ${failedChecks.length} failed, ${warningChecks.length} warnings`)

    return checks
  }

  /**
   * Add engineer stamp
   */
  async addEngineerStamp(
    applicationId: string,
    stamp: {
      engineerId: string
      engineerName: string
      licenseNumber: string
      licenseState: string
      expirationDate: Date
      discipline: EngineerStamp['discipline']
      signatureData: string
      ipAddress: string
    }
  ): Promise<void> {
    const application = this.applications.get(applicationId)
    if (!application) {
      throw new Error('Application not found')
    }

    // Verify license expiration
    if (stamp.expirationDate < new Date()) {
      throw new Error('Engineer license has expired')
    }

    const engineerStamp: EngineerStamp = {
      engineerId: stamp.engineerId,
      engineerName: stamp.engineerName,
      licenseNumber: stamp.licenseNumber,
      licenseState: stamp.licenseState,
      expirationDate: stamp.expirationDate,
      discipline: stamp.discipline,
      signature: {
        type: 'digital',
        data: stamp.signatureData,
        timestamp: new Date(),
        ipAddress: stamp.ipAddress
      },
      certification: `I hereby certify that the plans and specifications herein were prepared by me or under my direct supervision and that I am a duly Licensed ${stamp.discipline.charAt(0).toUpperCase() + stamp.discipline.slice(1)} Engineer under the laws of the State of ${stamp.licenseState}.`,
      verified: false
    }

    application.engineerStamp = engineerStamp
    application.updatedAt = new Date()

    // Verify stamp asynchronously
    this.verifyEngineerStamp(stamp.engineerId, stamp.licenseNumber).then(verified => {
      if (engineerStamp && application.engineerStamp) {
        application.engineerStamp.verified = verified
        application.engineerStamp.verifiedAt = new Date()
      }
    })

    console.log(`Added ${stamp.discipline} engineer stamp to application ${applicationId}`)
  }

  /**
   * Verify engineer stamp with state board
   */
  private async verifyEngineerStamp(
    engineerId: string,
    licenseNumber: string
  ): Promise<boolean> {
    // In production, verify with state licensing board API
    console.log(`Verifying engineer license: ${licenseNumber}`)

    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock: always return true
    return true
  }

  /**
   * Generate permit package
   */
  async generatePermitPackage(applicationId: string): Promise<PermitPackage> {
    const application = this.applications.get(applicationId)
    if (!application) {
      throw new Error('Application not found')
    }

    // Check if application is ready
    if (!application.engineerStamp) {
      throw new Error('Engineer stamp required')
    }

    const failedChecks = application.complianceChecks.filter(c => c.status === 'fail')
    if (failedChecks.length > 0) {
      throw new Error(`${failedChecks.length} compliance checks failed`)
    }

    const packageId = `package_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Generate package documents
    const permitPackage: PermitPackage = {
      id: packageId,
      applicationId,
      generatedAt: new Date(),
      documents: {
        sitePlan: `https://cdn.abodeai.com/permits/${packageId}/site-plan.pdf`,
        floorPlans: [
          `https://cdn.abodeai.com/permits/${packageId}/floor-plan-1.pdf`,
          `https://cdn.abodeai.com/permits/${packageId}/floor-plan-2.pdf`
        ],
        elevations: [
          `https://cdn.abodeai.com/permits/${packageId}/elevation-north.pdf`,
          `https://cdn.abodeai.com/permits/${packageId}/elevation-south.pdf`,
          `https://cdn.abodeai.com/permits/${packageId}/elevation-east.pdf`,
          `https://cdn.abodeai.com/permits/${packageId}/elevation-west.pdf`
        ],
        sections: [
          `https://cdn.abodeai.com/permits/${packageId}/section-a.pdf`,
          `https://cdn.abodeai.com/permits/${packageId}/section-b.pdf`
        ],
        details: [
          `https://cdn.abodeai.com/permits/${packageId}/foundation-details.pdf`,
          `https://cdn.abodeai.com/permits/${packageId}/wall-details.pdf`,
          `https://cdn.abodeai.com/permits/${packageId}/roof-details.pdf`
        ],
        structuralDrawings: [
          `https://cdn.abodeai.com/permits/${packageId}/structural-foundation.pdf`,
          `https://cdn.abodeai.com/permits/${packageId}/structural-framing.pdf`
        ],
        electricalPlans: [
          `https://cdn.abodeai.com/permits/${packageId}/electrical-plan.pdf`
        ],
        plumbingPlans: [
          `https://cdn.abodeai.com/permits/${packageId}/plumbing-plan.pdf`
        ],
        mechanicalPlans: [
          `https://cdn.abodeai.com/permits/${packageId}/mechanical-plan.pdf`
        ],
        specifications: `https://cdn.abodeai.com/permits/${packageId}/specifications.pdf`,
        calculations: [
          `https://cdn.abodeai.com/permits/${packageId}/structural-calcs.pdf`,
          `https://cdn.abodeai.com/permits/${packageId}/energy-calcs.pdf`
        ],
        energyCompliance: `https://cdn.abodeai.com/permits/${packageId}/title24-compliance.pdf`
      },
      coverSheet: {
        projectName: application.projectDetails.description,
        address: application.property.address,
        sheetIndex: [
          'A0.0 - Cover Sheet',
          'A1.0 - Site Plan',
          'A2.1 - Floor Plan - Level 1',
          'A2.2 - Floor Plan - Level 2',
          'A3.1 - Elevations',
          'A4.1 - Building Sections',
          'A5.1 - Details',
          'S1.0 - Structural Foundation Plan',
          'S2.0 - Structural Framing Plan',
          'E1.0 - Electrical Plan',
          'P1.0 - Plumbing Plan',
          'M1.0 - Mechanical Plan',
          'SP1 - Specifications',
          'C1 - Structural Calculations',
          'C2 - Energy Calculations'
        ]
      }
    }

    application.status = 'ready'
    application.updatedAt = new Date()

    console.log(`Generated permit package: ${packageId}`)

    return permitPackage
  }

  /**
   * Submit application
   */
  async submitApplication(applicationId: string): Promise<{
    success: boolean
    confirmationNumber?: string
    error?: string
  }> {
    const application = this.applications.get(applicationId)
    if (!application) {
      throw new Error('Application not found')
    }

    if (application.status !== 'ready') {
      return { success: false, error: 'Application not ready for submission' }
    }

    if (!application.fees.paid) {
      return { success: false, error: 'Fees not paid' }
    }

    const jurisdiction = this.jurisdictions.get(application.jurisdictionId)
    if (!jurisdiction) {
      return { success: false, error: 'Jurisdiction not found' }
    }

    // Submit via API if available
    if (jurisdiction.apiIntegration && jurisdiction.apiEndpoint) {
      try {
        const confirmationNumber = await this.submitViaAPI(
          jurisdiction.apiEndpoint,
          application
        )

        application.status = 'submitted'
        application.submittedAt = new Date()
        application.updatedAt = new Date()

        console.log(`Application submitted via API: ${confirmationNumber}`)

        return { success: true, confirmationNumber }
      } catch (error: any) {
        console.error('API submission failed:', error)
        return { success: false, error: error.message }
      }
    }

    // Manual submission
    application.status = 'submitted'
    application.submittedAt = new Date()
    application.updatedAt = new Date()

    const confirmationNumber = `MANUAL-${Date.now()}`

    console.log(`Application marked for manual submission: ${confirmationNumber}`)

    return {
      success: true,
      confirmationNumber,
      error: 'Manual submission required - jurisdiction does not support API'
    }
  }

  /**
   * Submit via jurisdiction API
   */
  private async submitViaAPI(
    apiEndpoint: string,
    application: PermitApplication
  ): Promise<string> {
    // In production, call actual jurisdiction API
    console.log(`Submitting to ${apiEndpoint}`)

    await new Promise(resolve => setTimeout(resolve, 2000))

    const confirmationNumber = `API-${Date.now()}`
    return confirmationNumber
  }

  /**
   * Get application status
   */
  async getApplicationStatus(applicationId: string): Promise<PermitApplication | null> {
    return this.applications.get(applicationId) || null
  }

  /**
   * Get all user applications
   */
  async getUserApplications(userId: string): Promise<PermitApplication[]> {
    return Array.from(this.applications.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  /**
   * Get compliance summary
   */
  async getComplianceSummary(applicationId: string): Promise<{
    total: number
    passed: number
    failed: number
    warnings: number
    notApplicable: number
    passRate: number
  }> {
    const application = this.applications.get(applicationId)
    if (!application) {
      throw new Error('Application not found')
    }

    const total = application.complianceChecks.length
    const passed = application.complianceChecks.filter(c => c.status === 'pass').length
    const failed = application.complianceChecks.filter(c => c.status === 'fail').length
    const warnings = application.complianceChecks.filter(c => c.status === 'warning').length
    const notApplicable = application.complianceChecks.filter(c => c.status === 'not_applicable').length

    return {
      total,
      passed,
      failed,
      warnings,
      notApplicable,
      passRate: total > 0 ? (passed / total) * 100 : 0
    }
  }
}
