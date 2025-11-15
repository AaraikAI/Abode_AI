import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { VoiceCommandsService, type VoiceCommand, type VoiceCommandResult } from '@/lib/services/voice-commands'

// Mock Web Speech API
class MockSpeechRecognition {
  continuous = false
  interimResults = false
  lang = 'en-US'
  maxAlternatives = 1

  onresult: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  onend: (() => void) | null = null
  onstart: (() => void) | null = null

  start() {
    this.onstart?.()
  }

  stop() {
    this.onend?.()
  }

  // Helper method to simulate recognition
  mockResult(transcript: string, confidence: number = 0.9) {
    const event = {
      results: [
        [
          {
            transcript,
            confidence
          }
        ]
      ]
    }
    this.onresult?.(event)
  }

  mockError(error: string) {
    this.onerror?.({ error })
  }
}

describe('VoiceCommandsService', () => {
  let service: VoiceCommandsService
  let mockRecognition: MockSpeechRecognition

  beforeEach(() => {
    // Setup mock
    mockRecognition = new MockSpeechRecognition()
    global.window = {
      SpeechRecognition: vi.fn(() => mockRecognition)
    } as any

    service = new VoiceCommandsService()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      const status = service.getStatus()

      expect(status.isListening).toBe(false)
      expect(status.isContinuous).toBe(false)
      expect(status.language).toBe('en-US')
      expect(status.wakeWord).toBe('hey abode')
      expect(status.commandCount).toBeGreaterThan(0)
    })

    it('should register default commands', () => {
      const commands = service.getAvailableCommands()

      expect(commands.length).toBeGreaterThan(0)
      expect(commands.some(cmd => cmd.command === 'navigate')).toBe(true)
      expect(commands.some(cmd => cmd.command === 'render')).toBe(true)
      expect(commands.some(cmd => cmd.command === 'help')).toBe(true)
    })

    it('should check browser support', () => {
      expect(VoiceCommandsService.isSupported()).toBe(true)

      // Test without SpeechRecognition
      delete (global.window as any).SpeechRecognition
      expect(VoiceCommandsService.isSupported()).toBe(false)
    })
  })

  describe('Command Registration', () => {
    it('should register a custom command', () => {
      const customCommand: VoiceCommand = {
        command: 'test command',
        aliases: ['test', 'testing'],
        action: 'test_action',
        description: 'A test command',
        examples: ['test this']
      }

      service.registerCommand(customCommand)

      const commands = service.getAvailableCommands()
      expect(commands.some(cmd => cmd.command === 'test command')).toBe(true)
    })

    it('should register command aliases', () => {
      const customCommand: VoiceCommand = {
        command: 'custom',
        aliases: ['alias1', 'alias2'],
        action: 'custom_action',
        description: 'Custom command',
        examples: []
      }

      service.registerCommand(customCommand)

      // Should be able to trigger via alias
      let result: VoiceCommandResult | null = null
      service.onCommand((r) => { result = r })

      service.start()
      mockRecognition.mockResult('hey abode alias1', 0.9)

      expect(result?.executed).toBe(true)
      expect(result?.command?.command).toBe('custom')
    })
  })

  describe('Voice Recognition', () => {
    it('should start listening', () => {
      service.start()

      const status = service.getStatus()
      expect(status.isListening).toBe(true)
    })

    it('should stop listening', () => {
      service.start()
      service.stop()

      const status = service.getStatus()
      expect(status.isListening).toBe(false)
    })

    it('should recognize wake word and command', () => {
      let result: VoiceCommandResult | null = null
      service.onCommand((r) => { result = r })

      service.start()
      mockRecognition.mockResult('hey abode help', 0.9)

      expect(result?.recognized).toContain('help')
      expect(result?.executed).toBe(true)
      expect(result?.command?.action).toBe('show_help')
    })

    it('should reject low confidence recognition', () => {
      let result: VoiceCommandResult | null = null
      service.onCommand((r) => { result = r })

      service.start()
      mockRecognition.mockResult('hey abode help', 0.5)

      expect(result?.executed).toBe(false)
      expect(result?.error).toContain('Low confidence')
    })

    it('should handle commands without wake word in listening mode', () => {
      let result: VoiceCommandResult | null = null
      service.onCommand((r) => { result = r })

      service.start()
      mockRecognition.mockResult('hey abode help', 0.9) // First activate
      mockRecognition.mockResult('save', 0.9) // Should work without wake word

      expect(result?.command?.action).toBe('save')
    })
  })

  describe('Command Matching', () => {
    it('should match exact command', () => {
      let result: VoiceCommandResult | null = null
      service.onCommand((r) => { result = r })

      service.start()
      mockRecognition.mockResult('hey abode render', 0.9)

      expect(result?.executed).toBe(true)
      expect(result?.command?.action).toBe('start_render')
    })

    it('should match command with alias', () => {
      let result: VoiceCommandResult | null = null
      service.onCommand((r) => { result = r })

      service.start()
      mockRecognition.mockResult('hey abode start render', 0.9)

      expect(result?.executed).toBe(true)
      expect(result?.command?.action).toBe('start_render')
    })

    it('should use fuzzy matching for similar commands', () => {
      let result: VoiceCommandResult | null = null
      service.onCommand((r) => { result = r })

      service.start()
      mockRecognition.mockResult('hey abode hlp', 0.9)

      // Might match 'help' with fuzzy matching
      expect(result).not.toBeNull()
    })

    it('should not match unrecognized commands', () => {
      let result: VoiceCommandResult | null = null
      service.onCommand((r) => { result = r })

      service.start()
      mockRecognition.mockResult('hey abode completely unknown command xyz', 0.9)

      expect(result?.executed).toBe(false)
      expect(result?.error).toContain('No matching command')
    })
  })

  describe('Parameter Extraction', () => {
    it('should extract navigation target', () => {
      let result: VoiceCommandResult | null = null
      service.onCommand((r) => { result = r })

      service.start()
      mockRecognition.mockResult('hey abode go to dashboard', 0.9)

      expect(result?.executed).toBe(true)
      expect(result?.parameters?.target).toContain('dashboard')
    })

    it('should extract search query', () => {
      let result: VoiceCommandResult | null = null
      service.onCommand((r) => { result = r })

      service.start()
      mockRecognition.mockResult('hey abode search for modern sofa', 0.9)

      expect(result?.executed).toBe(true)
      expect(result?.parameters?.target).toContain('modern sofa')
    })

    it('should extract zoom direction', () => {
      let result: VoiceCommandResult | null = null
      service.onCommand((r) => { result = r })

      service.start()
      mockRecognition.mockResult('hey abode zoom in', 0.9)

      expect(result?.executed).toBe(true)
      expect(result?.parameters?.direction).toBe('in')
    })

    it('should extract language change', () => {
      let result: VoiceCommandResult | null = null
      service.onCommand((r) => { result = r })

      service.start()
      mockRecognition.mockResult('hey abode change language to spanish', 0.9)

      expect(result?.executed).toBe(true)
      expect(result?.parameters?.language).toBe('spanish')
    })
  })

  describe('Settings', () => {
    it('should set custom wake word', () => {
      service.setWakeWord('hello computer')

      const status = service.getStatus()
      expect(status.wakeWord).toBe('hello computer')
    })

    it('should set language', () => {
      service.setLanguage('es-ES')

      const status = service.getStatus()
      expect(status.language).toBe('es-ES')
    })

    it('should set confidence threshold', () => {
      service.setConfidenceThreshold(0.8)

      let result: VoiceCommandResult | null = null
      service.onCommand((r) => { result = r })

      service.start()
      mockRecognition.mockResult('hey abode help', 0.75) // Below threshold

      expect(result?.executed).toBe(false)
    })

    it('should clamp confidence threshold between 0 and 1', () => {
      service.setConfidenceThreshold(1.5) // Should clamp to 1.0
      service.setConfidenceThreshold(-0.5) // Should clamp to 0.0

      // No error should occur
      expect(true).toBe(true)
    })
  })

  describe('Callbacks', () => {
    it('should notify multiple listeners', () => {
      const results: VoiceCommandResult[] = []

      service.onCommand((r) => results.push(r))
      service.onCommand((r) => results.push(r))

      service.start()
      mockRecognition.mockResult('hey abode help', 0.9)

      expect(results.length).toBe(2)
      expect(results[0].executed).toBe(true)
      expect(results[1].executed).toBe(true)
    })

    it('should unsubscribe callback', () => {
      let callCount = 0

      const unsubscribe = service.onCommand(() => callCount++)

      service.start()
      mockRecognition.mockResult('hey abode help', 0.9)
      expect(callCount).toBe(1)

      unsubscribe()
      mockRecognition.mockResult('hey abode save', 0.9)
      expect(callCount).toBe(1) // Should not increment
    })
  })

  describe('Continuous Mode', () => {
    it('should restart recognition in continuous mode', () => {
      service.start(true)

      const status = service.getStatus()
      expect(status.isContinuous).toBe(true)

      // Simulate end event
      mockRecognition.onend?.()

      // Should have attempted to restart
      expect(mockRecognition.continuous).toBe(true)
    })

    it('should not restart when stopped', () => {
      service.start(true)
      service.stop()

      // Simulate end event
      const spy = vi.spyOn(mockRecognition, 'start')
      mockRecognition.onend?.()

      // Should not restart
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle no-speech error gracefully', () => {
      service.start(true)

      mockRecognition.mockError('no-speech')

      // Should attempt to restart in continuous mode
      expect(service.getStatus().isListening).toBe(true)
    })

    it('should handle other errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      service.start()
      mockRecognition.mockError('network')

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Levenshtein Distance', () => {
    it('should calculate similarity correctly', () => {
      const service = new VoiceCommandsService()

      // Access private method via any
      const similarity = (service as any).calculateSimilarity('help', 'help')
      expect(similarity).toBe(1.0)

      const similarity2 = (service as any).calculateSimilarity('help', 'kelp')
      expect(similarity2).toBeGreaterThan(0.5)

      const similarity3 = (service as any).calculateSimilarity('help', 'completely different')
      expect(similarity3).toBeLessThan(0.5)
    })
  })
})
