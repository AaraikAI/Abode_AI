/**
 * Permit System Service Tests
 * Comprehensive test suite covering all permit system functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import {
  PermitSystemService,
  type Jurisdiction,
  type PermitApplication,
  type PermitType,
  type EngineerStamp,
  type ComplianceCheck,
  type PermitPackage
} from '../../lib/services/permit-system'

describe('PermitSystemService', () => {
  let service: PermitSystemService

  beforeEach(() => {
    service = new PermitSystemService()
    jest.clearAllMocks()
  })

  // ===== JURISDICTION LOOKUP TESTS (15 tests) =====
  describe('Jurisdiction Lookup', () => {
    it('should find Los Angeles jurisdiction by address', async () => {
      const jurisdiction = await service.findJurisdiction('123 Main St, Los Angeles, CA')
      expect(jurisdiction).toBeTruthy()
      expect(jurisdiction?.id).toBe('ca-la-city')
      expect(jurisdiction?.name).toBe('City of Los Angeles')
    })

    it('should find San Francisco jurisdiction by address', async () => {
      const jurisdiction = await service.findJurisdiction('456 Market St, San Francisco, CA')
      expect(jurisdiction).toBeTruthy()
      expect(jurisdiction?.id).toBe('ca-sf-city')
      expect(jurisdiction?.name).toBe('City and County of San Francisco')
    })

    it('should return null for unknown jurisdiction', async () => {
      const jurisdiction = await service.findJurisdiction('123 Unknown St, Nowhere, XX')
      expect(jurisdiction).toBeNull()
    })

    it('should handle case-insensitive address lookup', async () => {
      const jurisdiction = await service.findJurisdiction('123 MAIN ST, LOS ANGELES, CA')
      expect(jurisdiction).toBeTruthy()
      expect(jurisdiction?.id).toBe('ca-la-city')
    })

    it('should include jurisdiction contact information', async () => {
      const jurisdiction = await service.findJurisdiction('123 Main St, Los Angeles, CA')
      expect(jurisdiction?.contact).toBeDefined()
      expect(jurisdiction?.contact.phone).toBe('(213) 482-6700')
      expect(jurisdiction?.contact.email).toBe('ladbs@lacity.org')
    })

    it('should include permit type requirements', async () => {
      const jurisdiction = await service.findJurisdiction('123 Main St, Los Angeles, CA')
      expect(jurisdiction?.requirements.permitTypes).toContain('building')
      expect(jurisdiction?.requirements.permitTypes).toContain('electrical')
    })

    it('should indicate online submission availability', async () => {
      const jurisdiction = await service.findJurisdiction('123 Main St, Los Angeles, CA')
      expect(jurisdiction?.onlineSubmission).toBe(true)
    })

    it('should indicate API integration capability', async () => {
      const jurisdiction = await service.findJurisdiction('123 Main St, Los Angeles, CA')
      expect(jurisdiction?.apiIntegration).toBe(true)
      expect(jurisdiction?.apiEndpoint).toBeDefined()
    })

    it('should include fee schedule', async () => {
      const jurisdiction = await service.findJurisdiction('123 Main St, Los Angeles, CA')
      expect(jurisdiction?.requirements.fees.building).toBe(500)
      expect(jurisdiction?.requirements.fees.electrical).toBe(200)
    })

    it('should include estimated review days', async () => {
      const jurisdiction = await service.findJurisdiction('123 Main St, Los Angeles, CA')
      expect(jurisdiction?.requirements.estimatedDays).toBe(15)
    })

    it('should include review process description', async () => {
      const jurisdiction = await service.findJurisdiction('123 Main St, Los Angeles, CA')
      expect(jurisdiction?.requirements.reviewProcess).toContain('Plan check')
    })

    it('should handle jurisdiction without API integration', async () => {
      const jurisdiction = await service.findJurisdiction('456 Market St, San Francisco, CA')
      expect(jurisdiction?.apiIntegration).toBe(false)
      expect(jurisdiction?.apiEndpoint).toBeUndefined()
    })

    it('should include jurisdiction type', async () => {
      const jurisdiction = await service.findJurisdiction('123 Main St, Los Angeles, CA')
      expect(jurisdiction?.type).toBe('city')
    })

    it('should include location details', async () => {
      const jurisdiction = await service.findJurisdiction('123 Main St, Los Angeles, CA')
      expect(jurisdiction?.location.state).toBe('CA')
      expect(jurisdiction?.location.city).toBe('Los Angeles')
    })

    it('should include physical address', async () => {
      const jurisdiction = await service.findJurisdiction('123 Main St, Los Angeles, CA')
      expect(jurisdiction?.contact.address).toContain('Figueroa')
    })
  })

  // ===== APPLICATION CREATION TESTS (15 tests) =====
  describe('Application Creation', () => {
    it('should create building permit application', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: ['Single Family Home']
        },
        projectDetails: {
          description: 'New ADU',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.id).toBeDefined()
      expect(application.permitType).toBe('building')
      expect(application.status).toBe('draft')
    })

    it('should generate unique application IDs', async () => {
      const app1 = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      const app2 = await service.createApplication({
        projectId: 'proj_456',
        userId: 'user_789',
        jurisdictionId: 'ca-la-city',
        permitType: 'electrical',
        applicant: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '555-5678',
          address: '456 Oak St'
        },
        property: {
          address: '321 Test Blvd',
          apn: '9876-543-210',
          zoning: 'R2',
          lotSize: 6000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Electrical upgrade',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 1200,
          stories: 2,
          estimatedCost: 25000
        }
      })

      expect(app1.id).not.toBe(app2.id)
    })

    it('should calculate permit fees correctly', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.fees.permitFee).toBe(500)
      expect(application.fees.planCheckFee).toBe(325)
      expect(application.fees.total).toBe(825)
    })

    it('should initialize with unpaid fees', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.fees.paid).toBe(false)
      expect(application.fees.paidAt).toBeUndefined()
    })

    it('should throw error for invalid jurisdiction', async () => {
      await expect(service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'invalid_jurisdiction',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })).rejects.toThrow('Jurisdiction not found')
    })

    it('should store applicant information', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          company: 'Test Company',
          licenseNumber: 'LIC123',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.applicant.name).toBe('John Doe')
      expect(application.applicant.company).toBe('Test Company')
      expect(application.applicant.licenseNumber).toBe('LIC123')
    })

    it('should store property information', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: ['Single Family Home', 'Garage']
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.property.address).toBe('789 Test Ave')
      expect(application.property.apn).toBe('1234-567-890')
      expect(application.property.zoning).toBe('R1')
      expect(application.property.lotSize).toBe(5000)
      expect(application.property.existingStructures).toHaveLength(2)
    })

    it('should store project details', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'New ADU construction',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.projectDetails.description).toBe('New ADU construction')
      expect(application.projectDetails.squareFootage).toBe(800)
      expect(application.projectDetails.estimatedCost).toBe(150000)
    })

    it('should initialize empty documents array', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.documents).toEqual([])
    })

    it('should initialize empty compliance checks array', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.complianceChecks).toEqual([])
    })

    it('should set created and updated timestamps', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.createdAt).toBeInstanceOf(Date)
      expect(application.updatedAt).toBeInstanceOf(Date)
    })

    it('should create electrical permit application', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'electrical',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.permitType).toBe('electrical')
      expect(application.fees.permitFee).toBe(200)
    })

    it('should create plumbing permit application', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'plumbing',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.permitType).toBe('plumbing')
      expect(application.fees.permitFee).toBe(150)
    })

    it('should create mechanical permit application', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'mechanical',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.permitType).toBe('mechanical')
      expect(application.fees.permitFee).toBe(150)
    })

    it('should link application to project and user', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.projectId).toBe('proj_123')
      expect(application.userId).toBe('user_456')
    })
  })

  // ===== DOCUMENT MANAGEMENT TESTS (10 tests) =====
  describe('Document Management', () => {
    let applicationId: string

    beforeEach(async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })
      applicationId = application.id
    })

    it('should add document to application', async () => {
      await service.addDocument(applicationId, {
        type: 'site-plan',
        name: 'Site Plan.pdf',
        url: 'https://example.com/site-plan.pdf',
        required: true
      })

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.documents).toHaveLength(1)
      expect(application?.documents[0].name).toBe('Site Plan.pdf')
    })

    it('should throw error when adding document to non-existent application', async () => {
      await expect(service.addDocument('invalid_id', {
        type: 'site-plan',
        name: 'Test.pdf',
        url: 'https://example.com/test.pdf',
        required: true
      })).rejects.toThrow('Application not found')
    })

    it('should set upload timestamp on document', async () => {
      await service.addDocument(applicationId, {
        type: 'site-plan',
        name: 'Site Plan.pdf',
        url: 'https://example.com/site-plan.pdf',
        required: true
      })

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.documents[0].uploadedAt).toBeInstanceOf(Date)
    })

    it('should add multiple documents', async () => {
      await service.addDocument(applicationId, {
        type: 'site-plan',
        name: 'Site Plan.pdf',
        url: 'https://example.com/site-plan.pdf',
        required: true
      })

      await service.addDocument(applicationId, {
        type: 'floor-plan',
        name: 'Floor Plan.pdf',
        url: 'https://example.com/floor-plan.pdf',
        required: true
      })

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.documents).toHaveLength(2)
    })

    it('should preserve document metadata', async () => {
      await service.addDocument(applicationId, {
        type: 'elevation',
        name: 'Elevations.pdf',
        url: 'https://example.com/elevations.pdf',
        required: false
      })

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.documents[0].type).toBe('elevation')
      expect(application?.documents[0].required).toBe(false)
    })

    it('should update application timestamp when adding document', async () => {
      const application = await service.getApplicationStatus(applicationId)
      const originalUpdatedAt = application?.updatedAt

      await new Promise(resolve => setTimeout(resolve, 10))

      await service.addDocument(applicationId, {
        type: 'site-plan',
        name: 'Site Plan.pdf',
        url: 'https://example.com/site-plan.pdf',
        required: true
      })

      const updatedApplication = await service.getApplicationStatus(applicationId)
      expect(updatedApplication?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt!.getTime())
    })

    it('should handle required documents', async () => {
      await service.addDocument(applicationId, {
        type: 'structural-calcs',
        name: 'Structural Calculations.pdf',
        url: 'https://example.com/calcs.pdf',
        required: true
      })

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.documents[0].required).toBe(true)
    })

    it('should handle optional documents', async () => {
      await service.addDocument(applicationId, {
        type: 'photos',
        name: 'Site Photos.pdf',
        url: 'https://example.com/photos.pdf',
        required: false
      })

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.documents[0].required).toBe(false)
    })

    it('should store document URLs', async () => {
      const url = 'https://cdn.example.com/documents/12345.pdf'
      await service.addDocument(applicationId, {
        type: 'site-plan',
        name: 'Site Plan.pdf',
        url,
        required: true
      })

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.documents[0].url).toBe(url)
    })

    it('should store document type', async () => {
      await service.addDocument(applicationId, {
        type: 'energy-compliance',
        name: 'Title 24 Compliance.pdf',
        url: 'https://example.com/title24.pdf',
        required: true
      })

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.documents[0].type).toBe('energy-compliance')
    })
  })

  // ===== CODE COMPLIANCE CHECKING TESTS (15 tests) =====
  describe('Code Compliance Checking', () => {
    let applicationId: string

    beforeEach(async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1-D',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 2400,
          stories: 3,
          estimatedCost: 350000
        }
      })
      applicationId = application.id
    })

    it('should run compliance checks on application', async () => {
      const checks = await service.runComplianceChecks(applicationId)
      expect(checks.length).toBeGreaterThan(0)
    })

    it('should check seismic requirements', async () => {
      const checks = await service.runComplianceChecks(applicationId)
      const seismicCheck = checks.find(c => c.code.includes('1604'))
      expect(seismicCheck).toBeDefined()
      expect(seismicCheck?.category).toBe('Building Code')
    })

    it('should check accessible egress for multi-story buildings', async () => {
      const checks = await service.runComplianceChecks(applicationId)
      const egressCheck = checks.find(c => c.code.includes('1009'))
      expect(egressCheck).toBeDefined()
      expect(egressCheck?.status).toBe('pass')
    })

    it('should mark egress check as not applicable for single story', async () => {
      const singleStoryApp = await service.createApplication({
        projectId: 'proj_789',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      const checks = await service.runComplianceChecks(singleStoryApp.id)
      const egressCheck = checks.find(c => c.code.includes('1009'))
      expect(egressCheck?.status).toBe('not_applicable')
    })

    it('should check zoning setback requirements', async () => {
      const checks = await service.runComplianceChecks(applicationId)
      const zoningCheck = checks.find(c => c.category === 'Zoning')
      expect(zoningCheck).toBeDefined()
      expect(zoningCheck?.description).toContain('Setback')
    })

    it('should check energy code compliance', async () => {
      const checks = await service.runComplianceChecks(applicationId)
      const energyCheck = checks.find(c => c.category === 'Energy Code')
      expect(energyCheck).toBeDefined()
      expect(energyCheck?.code).toContain('Title 24')
    })

    it('should require sprinklers for buildings over 2 stories', async () => {
      const checks = await service.runComplianceChecks(applicationId)
      const sprinklerCheck = checks.find(c => c.description.includes('sprinkler'))
      expect(sprinklerCheck).toBeDefined()
      expect(sprinklerCheck?.status).toBe('pass')
    })

    it('should not require sprinklers for 2-story or less buildings', async () => {
      const twoStoryApp = await service.createApplication({
        projectId: 'proj_789',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 1600,
          stories: 2,
          estimatedCost: 250000
        }
      })

      const checks = await service.runComplianceChecks(twoStoryApp.id)
      const sprinklerCheck = checks.find(c => c.description.includes('sprinkler'))
      expect(sprinklerCheck).toBeUndefined()
    })

    it('should throw error for non-existent application', async () => {
      await expect(service.runComplianceChecks('invalid_id')).rejects.toThrow('Application not found')
    })

    it('should store checks on application', async () => {
      await service.runComplianceChecks(applicationId)
      const application = await service.getApplicationStatus(applicationId)
      expect(application?.complianceChecks.length).toBeGreaterThan(0)
    })

    it('should timestamp each check', async () => {
      const checks = await service.runComplianceChecks(applicationId)
      checks.forEach(check => {
        expect(check.checkedAt).toBeInstanceOf(Date)
      })
    })

    it('should include check details', async () => {
      const checks = await service.runComplianceChecks(applicationId)
      const checkWithDetails = checks.find(c => c.details)
      expect(checkWithDetails).toBeDefined()
      expect(checkWithDetails?.details).toBeTruthy()
    })

    it('should generate unique check IDs', async () => {
      const checks = await service.runComplianceChecks(applicationId)
      const ids = checks.map(c => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should handle warning status', async () => {
      const checks = await service.runComplianceChecks(applicationId)
      const seismicCheck = checks.find(c => c.code.includes('1604'))
      expect(['pass', 'warning']).toContain(seismicCheck?.status)
    })

    it('should update application timestamp', async () => {
      const application = await service.getApplicationStatus(applicationId)
      const originalUpdatedAt = application?.updatedAt

      await new Promise(resolve => setTimeout(resolve, 10))

      await service.runComplianceChecks(applicationId)

      const updatedApplication = await service.getApplicationStatus(applicationId)
      expect(updatedApplication?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt!.getTime())
    })
  })

  // ===== ENGINEER STAMP VALIDATION TESTS (15 tests) =====
  describe('Engineer Stamp Validation', () => {
    let applicationId: string

    beforeEach(async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })
      applicationId = application.id
    })

    it('should add structural engineer stamp', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await service.addEngineerStamp(applicationId, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'SE12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'structural',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.engineerStamp).toBeDefined()
      expect(application?.engineerStamp?.discipline).toBe('structural')
    })

    it('should reject expired engineer license', async () => {
      const pastDate = new Date()
      pastDate.setFullYear(pastDate.getFullYear() - 1)

      await expect(service.addEngineerStamp(applicationId, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'SE12345',
        licenseState: 'CA',
        expirationDate: pastDate,
        discipline: 'structural',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })).rejects.toThrow('Engineer license has expired')
    })

    it('should store engineer information', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await service.addEngineerStamp(applicationId, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'SE12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'structural',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.engineerStamp?.engineerName).toBe('Jane Engineer')
      expect(application?.engineerStamp?.licenseNumber).toBe('SE12345')
      expect(application?.engineerStamp?.licenseState).toBe('CA')
    })

    it('should store digital signature', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await service.addEngineerStamp(applicationId, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'SE12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'structural',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.engineerStamp?.signature.type).toBe('digital')
      expect(application?.engineerStamp?.signature.data).toBe('base64encodeddata')
    })

    it('should timestamp signature', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await service.addEngineerStamp(applicationId, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'SE12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'structural',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.engineerStamp?.signature.timestamp).toBeInstanceOf(Date)
    })

    it('should store IP address', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await service.addEngineerStamp(applicationId, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'SE12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'structural',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.engineerStamp?.signature.ipAddress).toBe('192.168.1.1')
    })

    it('should generate certification statement', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await service.addEngineerStamp(applicationId, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'SE12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'structural',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.engineerStamp?.certification).toContain('hereby certify')
      expect(application?.engineerStamp?.certification).toContain('Structural Engineer')
    })

    it('should support civil engineer discipline', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await service.addEngineerStamp(applicationId, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'CE12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'civil',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.engineerStamp?.discipline).toBe('civil')
    })

    it('should support mechanical engineer discipline', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await service.addEngineerStamp(applicationId, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'ME12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'mechanical',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.engineerStamp?.discipline).toBe('mechanical')
    })

    it('should support electrical engineer discipline', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await service.addEngineerStamp(applicationId, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'EE12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'electrical',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.engineerStamp?.discipline).toBe('electrical')
    })

    it('should throw error for non-existent application', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await expect(service.addEngineerStamp('invalid_id', {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'SE12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'structural',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })).rejects.toThrow('Application not found')
    })

    it('should initially mark stamp as unverified', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await service.addEngineerStamp(applicationId, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'SE12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'structural',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.engineerStamp?.verified).toBe(false)
    })

    it('should verify stamp asynchronously', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await service.addEngineerStamp(applicationId, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'SE12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'structural',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })

      // Wait for async verification
      await new Promise(resolve => setTimeout(resolve, 1100))

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.engineerStamp?.verified).toBe(true)
      expect(application?.engineerStamp?.verifiedAt).toBeInstanceOf(Date)
    })

    it('should update application timestamp when adding stamp', async () => {
      const application = await service.getApplicationStatus(applicationId)
      const originalUpdatedAt = application?.updatedAt

      await new Promise(resolve => setTimeout(resolve, 10))

      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await service.addEngineerStamp(applicationId, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'SE12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'structural',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })

      const updatedApplication = await service.getApplicationStatus(applicationId)
      expect(updatedApplication?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt!.getTime())
    })

    it('should include license expiration date', async () => {
      const futureDate = new Date('2026-12-31')

      await service.addEngineerStamp(applicationId, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'SE12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'structural',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })

      const application = await service.getApplicationStatus(applicationId)
      expect(application?.engineerStamp?.expirationDate).toEqual(futureDate)
    })
  })

  // ===== PERMIT PACKAGE GENERATION TESTS (15 tests) =====
  describe('Permit Package Generation', () => {
    let applicationId: string

    beforeEach(async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'New ADU',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })
      applicationId = application.id

      await service.runComplianceChecks(applicationId)

      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await service.addEngineerStamp(applicationId, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'SE12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'structural',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })
    })

    it('should generate permit package', async () => {
      const permitPackage = await service.generatePermitPackage(applicationId)
      expect(permitPackage.id).toBeDefined()
      expect(permitPackage.applicationId).toBe(applicationId)
    })

    it('should require engineer stamp', async () => {
      const newApp = await service.createApplication({
        projectId: 'proj_789',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      await expect(service.generatePermitPackage(newApp.id))
        .rejects.toThrow('Engineer stamp required')
    })

    it('should reject package generation with failed compliance checks', async () => {
      const newApp = await service.createApplication({
        projectId: 'proj_789',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await service.addEngineerStamp(newApp.id, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'SE12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'structural',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })

      // Manually add failed check
      const app = await service.getApplicationStatus(newApp.id)
      app!.complianceChecks.push({
        id: 'check_fail',
        category: 'Test',
        code: 'TEST',
        description: 'Failed test',
        status: 'fail',
        checkedAt: new Date()
      })

      await expect(service.generatePermitPackage(newApp.id))
        .rejects.toThrow('compliance checks failed')
    })

    it('should include site plan', async () => {
      const permitPackage = await service.generatePermitPackage(applicationId)
      expect(permitPackage.documents.sitePlan).toBeDefined()
      expect(permitPackage.documents.sitePlan).toContain('.pdf')
    })

    it('should include floor plans', async () => {
      const permitPackage = await service.generatePermitPackage(applicationId)
      expect(permitPackage.documents.floorPlans).toBeInstanceOf(Array)
      expect(permitPackage.documents.floorPlans.length).toBeGreaterThan(0)
    })

    it('should include elevations', async () => {
      const permitPackage = await service.generatePermitPackage(applicationId)
      expect(permitPackage.documents.elevations).toBeInstanceOf(Array)
      expect(permitPackage.documents.elevations.length).toBe(4) // N, S, E, W
    })

    it('should include building sections', async () => {
      const permitPackage = await service.generatePermitPackage(applicationId)
      expect(permitPackage.documents.sections).toBeInstanceOf(Array)
      expect(permitPackage.documents.sections.length).toBeGreaterThan(0)
    })

    it('should include construction details', async () => {
      const permitPackage = await service.generatePermitPackage(applicationId)
      expect(permitPackage.documents.details).toBeInstanceOf(Array)
      expect(permitPackage.documents.details.length).toBeGreaterThan(0)
    })

    it('should include structural drawings', async () => {
      const permitPackage = await service.generatePermitPackage(applicationId)
      expect(permitPackage.documents.structuralDrawings).toBeInstanceOf(Array)
      expect(permitPackage.documents.structuralDrawings.length).toBeGreaterThan(0)
    })

    it('should include MEP plans', async () => {
      const permitPackage = await service.generatePermitPackage(applicationId)
      expect(permitPackage.documents.electricalPlans).toBeInstanceOf(Array)
      expect(permitPackage.documents.plumbingPlans).toBeInstanceOf(Array)
      expect(permitPackage.documents.mechanicalPlans).toBeInstanceOf(Array)
    })

    it('should include specifications', async () => {
      const permitPackage = await service.generatePermitPackage(applicationId)
      expect(permitPackage.documents.specifications).toBeDefined()
      expect(permitPackage.documents.specifications).toContain('specifications.pdf')
    })

    it('should include calculations', async () => {
      const permitPackage = await service.generatePermitPackage(applicationId)
      expect(permitPackage.documents.calculations).toBeInstanceOf(Array)
      expect(permitPackage.documents.calculations.length).toBeGreaterThan(0)
    })

    it('should include energy compliance documents', async () => {
      const permitPackage = await service.generatePermitPackage(applicationId)
      expect(permitPackage.documents.energyCompliance).toBeDefined()
      expect(permitPackage.documents.energyCompliance).toContain('title24')
    })

    it('should include cover sheet with project info', async () => {
      const permitPackage = await service.generatePermitPackage(applicationId)
      expect(permitPackage.coverSheet.projectName).toBe('New ADU')
      expect(permitPackage.coverSheet.address).toBe('789 Test Ave')
    })

    it('should include sheet index', async () => {
      const permitPackage = await service.generatePermitPackage(applicationId)
      expect(permitPackage.coverSheet.sheetIndex).toBeInstanceOf(Array)
      expect(permitPackage.coverSheet.sheetIndex.length).toBeGreaterThan(10)
    })

    it('should set application status to ready', async () => {
      await service.generatePermitPackage(applicationId)
      const application = await service.getApplicationStatus(applicationId)
      expect(application?.status).toBe('ready')
    })
  })

  // ===== SUBMISSION WORKFLOW TESTS (15 tests) =====
  describe('Submission Workflow', () => {
    let applicationId: string

    beforeEach(async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })
      applicationId = application.id

      await service.runComplianceChecks(applicationId)

      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await service.addEngineerStamp(applicationId, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'SE12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'structural',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })

      await service.generatePermitPackage(applicationId)
    })

    it('should reject submission if not ready', async () => {
      const newApp = await service.createApplication({
        projectId: 'proj_789',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      const result = await service.submitApplication(newApp.id)
      expect(result.success).toBe(false)
      expect(result.error).toContain('not ready')
    })

    it('should reject submission if fees not paid', async () => {
      const result = await service.submitApplication(applicationId)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Fees not paid')
    })

    it('should submit via API when available', async () => {
      const app = await service.getApplicationStatus(applicationId)
      app!.fees.paid = true
      app!.fees.paidAt = new Date()

      const result = await service.submitApplication(applicationId)
      expect(result.success).toBe(true)
      expect(result.confirmationNumber).toBeDefined()
    })

    it('should set submitted status', async () => {
      const app = await service.getApplicationStatus(applicationId)
      app!.fees.paid = true

      await service.submitApplication(applicationId)

      const updatedApp = await service.getApplicationStatus(applicationId)
      expect(updatedApp?.status).toBe('submitted')
    })

    it('should set submission timestamp', async () => {
      const app = await service.getApplicationStatus(applicationId)
      app!.fees.paid = true

      await service.submitApplication(applicationId)

      const updatedApp = await service.getApplicationStatus(applicationId)
      expect(updatedApp?.submittedAt).toBeInstanceOf(Date)
    })

    it('should generate API confirmation number', async () => {
      const app = await service.getApplicationStatus(applicationId)
      app!.fees.paid = true

      const result = await service.submitApplication(applicationId)
      expect(result.confirmationNumber).toContain('API-')
    })

    it('should handle manual submission for jurisdictions without API', async () => {
      const sfApp = await service.createApplication({
        projectId: 'proj_sf',
        userId: 'user_456',
        jurisdictionId: 'ca-sf-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '456 Market St, San Francisco',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      await service.runComplianceChecks(sfApp.id)

      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await service.addEngineerStamp(sfApp.id, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'SE12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'structural',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })

      await service.generatePermitPackage(sfApp.id)

      const app = await service.getApplicationStatus(sfApp.id)
      app!.fees.paid = true

      const result = await service.submitApplication(sfApp.id)
      expect(result.success).toBe(true)
      expect(result.confirmationNumber).toContain('MANUAL-')
    })

    it('should throw error for non-existent application', async () => {
      await expect(service.submitApplication('invalid_id'))
        .rejects.toThrow('Application not found')
    })

    it('should throw error for non-existent jurisdiction', async () => {
      const app = await service.getApplicationStatus(applicationId)
      app!.jurisdictionId = 'invalid_jurisdiction'
      app!.fees.paid = true

      const result = await service.submitApplication(applicationId)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Jurisdiction not found')
    })

    it('should update application timestamp on submission', async () => {
      const app = await service.getApplicationStatus(applicationId)
      const originalUpdatedAt = app?.updatedAt
      app!.fees.paid = true

      await new Promise(resolve => setTimeout(resolve, 10))

      await service.submitApplication(applicationId)

      const updatedApp = await service.getApplicationStatus(applicationId)
      expect(updatedApp?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt!.getTime())
    })

    it('should preserve application data after submission', async () => {
      const app = await service.getApplicationStatus(applicationId)
      app!.fees.paid = true

      await service.submitApplication(applicationId)

      const updatedApp = await service.getApplicationStatus(applicationId)
      expect(updatedApp?.applicant.name).toBe('John Doe')
      expect(updatedApp?.property.address).toBe('789 Test Ave')
    })

    it('should maintain engineer stamp after submission', async () => {
      const app = await service.getApplicationStatus(applicationId)
      app!.fees.paid = true

      await service.submitApplication(applicationId)

      const updatedApp = await service.getApplicationStatus(applicationId)
      expect(updatedApp?.engineerStamp).toBeDefined()
      expect(updatedApp?.engineerStamp?.engineerName).toBe('Jane Engineer')
    })

    it('should maintain compliance checks after submission', async () => {
      const app = await service.getApplicationStatus(applicationId)
      const checksCount = app?.complianceChecks.length
      app!.fees.paid = true

      await service.submitApplication(applicationId)

      const updatedApp = await service.getApplicationStatus(applicationId)
      expect(updatedApp?.complianceChecks.length).toBe(checksCount)
    })

    it('should maintain fee information after submission', async () => {
      const app = await service.getApplicationStatus(applicationId)
      app!.fees.paid = true
      const totalFees = app!.fees.total

      await service.submitApplication(applicationId)

      const updatedApp = await service.getApplicationStatus(applicationId)
      expect(updatedApp?.fees.total).toBe(totalFees)
      expect(updatedApp?.fees.paid).toBe(true)
    })
  })

  // ===== FEE CALCULATION TESTS (10 tests) =====
  describe('Fee Calculation', () => {
    it('should calculate building permit fees for LA', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.fees.permitFee).toBe(500)
      expect(application.fees.planCheckFee).toBe(325)
      expect(application.fees.total).toBe(825)
    })

    it('should calculate electrical permit fees', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'electrical',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.fees.permitFee).toBe(200)
      expect(application.fees.planCheckFee).toBe(130)
    })

    it('should calculate plan check fee as 65% of permit fee', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      const expectedPlanCheck = Math.floor(application.fees.permitFee * 0.65)
      expect(application.fees.planCheckFee).toBe(expectedPlanCheck)
    })

    it('should calculate total fees correctly', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      const expectedTotal = application.fees.permitFee + application.fees.planCheckFee
      expect(application.fees.total).toBe(expectedTotal)
    })

    it('should use different fees for San Francisco', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-sf-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '456 Market St',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.fees.permitFee).toBe(650)
    })

    it('should handle plumbing permit fees', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'plumbing',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.fees.permitFee).toBe(150)
    })

    it('should handle mechanical permit fees', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'mechanical',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.fees.permitFee).toBe(150)
    })

    it('should handle unknown permit types with zero fee', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'grading',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.fees.permitFee).toBe(0)
    })

    it('should initialize fees as unpaid', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.fees.paid).toBe(false)
      expect(application.fees.paidAt).toBeUndefined()
    })

    it('should not include optional fees initially', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(application.fees.schoolFee).toBeUndefined()
      expect(application.fees.impactFees).toBeUndefined()
    })
  })

  // ===== STATUS TRACKING TESTS (10 tests) =====
  describe('Status Tracking', () => {
    it('should get application status', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      const status = await service.getApplicationStatus(application.id)
      expect(status).toBeDefined()
      expect(status?.id).toBe(application.id)
    })

    it('should return null for non-existent application', async () => {
      const status = await service.getApplicationStatus('invalid_id')
      expect(status).toBeNull()
    })

    it('should get all user applications', async () => {
      await service.createApplication({
        projectId: 'proj_1',
        userId: 'user_123',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      await service.createApplication({
        projectId: 'proj_2',
        userId: 'user_123',
        jurisdictionId: 'ca-la-city',
        permitType: 'electrical',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '321 Test Blvd',
          apn: '9876-543-210',
          zoning: 'R2',
          lotSize: 6000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 1200,
          stories: 2,
          estimatedCost: 25000
        }
      })

      const applications = await service.getUserApplications('user_123')
      expect(applications).toHaveLength(2)
    })

    it('should filter applications by user ID', async () => {
      await service.createApplication({
        projectId: 'proj_1',
        userId: 'user_123',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      await service.createApplication({
        projectId: 'proj_2',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'electrical',
        applicant: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '555-5678',
          address: '456 Oak St'
        },
        property: {
          address: '321 Test Blvd',
          apn: '9876-543-210',
          zoning: 'R2',
          lotSize: 6000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 1200,
          stories: 2,
          estimatedCost: 25000
        }
      })

      const applications = await service.getUserApplications('user_123')
      expect(applications).toHaveLength(1)
      expect(applications[0].userId).toBe('user_123')
    })

    it('should sort applications by creation date (newest first)', async () => {
      const app1 = await service.createApplication({
        projectId: 'proj_1',
        userId: 'user_123',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      const app2 = await service.createApplication({
        projectId: 'proj_2',
        userId: 'user_123',
        jurisdictionId: 'ca-la-city',
        permitType: 'electrical',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '321 Test Blvd',
          apn: '9876-543-210',
          zoning: 'R2',
          lotSize: 6000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 1200,
          stories: 2,
          estimatedCost: 25000
        }
      })

      const applications = await service.getUserApplications('user_123')
      expect(applications[0].id).toBe(app2.id)
      expect(applications[1].id).toBe(app1.id)
    })

    it('should return empty array for user with no applications', async () => {
      const applications = await service.getUserApplications('unknown_user')
      expect(applications).toEqual([])
    })

    it('should get compliance summary', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1-D',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 2400,
          stories: 3,
          estimatedCost: 350000
        }
      })

      await service.runComplianceChecks(application.id)

      const summary = await service.getComplianceSummary(application.id)
      expect(summary.total).toBeGreaterThan(0)
      expect(summary.passed).toBeGreaterThan(0)
    })

    it('should calculate pass rate correctly', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      await service.runComplianceChecks(application.id)

      const summary = await service.getComplianceSummary(application.id)
      const expectedPassRate = (summary.passed / summary.total) * 100
      expect(summary.passRate).toBe(expectedPassRate)
    })

    it('should count failed checks', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      await service.runComplianceChecks(application.id)

      const summary = await service.getComplianceSummary(application.id)
      expect(summary.failed).toBeDefined()
      expect(summary.failed).toBeGreaterThanOrEqual(0)
    })

    it('should throw error for non-existent application in compliance summary', async () => {
      await expect(service.getComplianceSummary('invalid_id'))
        .rejects.toThrow('Application not found')
    })
  })

  // ===== NOTIFICATION SYSTEM TESTS (5 tests) =====
  describe('Notification System', () => {
    it('should log application creation', async () => {
      const consoleSpy = jest.spyOn(console, 'log')

      await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Created'))
    })

    it('should log document addition', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      const consoleSpy = jest.spyOn(console, 'log')

      await service.addDocument(application.id, {
        type: 'site-plan',
        name: 'Site Plan.pdf',
        url: 'https://example.com/site-plan.pdf',
        required: true
      })

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Added document'))
    })

    it('should log compliance check completion', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      const consoleSpy = jest.spyOn(console, 'log')

      await service.runComplianceChecks(application.id)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Compliance checks complete'))
    })

    it('should log engineer stamp addition', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      const consoleSpy = jest.spyOn(console, 'log')

      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await service.addEngineerStamp(application.id, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'SE12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'structural',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Added'))
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('engineer stamp'))
    })

    it('should log permit package generation', async () => {
      const application = await service.createApplication({
        projectId: 'proj_123',
        userId: 'user_456',
        jurisdictionId: 'ca-la-city',
        permitType: 'building',
        applicant: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St'
        },
        property: {
          address: '789 Test Ave',
          apn: '1234-567-890',
          zoning: 'R1',
          lotSize: 5000,
          existingStructures: []
        },
        projectDetails: {
          description: 'Test',
          constructionType: 'Type V',
          occupancyType: 'R-3',
          squareFootage: 800,
          stories: 1,
          estimatedCost: 150000
        }
      })

      await service.runComplianceChecks(application.id)

      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await service.addEngineerStamp(application.id, {
        engineerId: 'eng_123',
        engineerName: 'Jane Engineer',
        licenseNumber: 'SE12345',
        licenseState: 'CA',
        expirationDate: futureDate,
        discipline: 'structural',
        signatureData: 'base64encodeddata',
        ipAddress: '192.168.1.1'
      })

      const consoleSpy = jest.spyOn(console, 'log')

      await service.generatePermitPackage(application.id)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Generated permit package'))
    })
  })
})
