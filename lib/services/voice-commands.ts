/**
 * Voice Commands Service
 *
 * Implements voice command recognition and natural language processing
 * using Web Speech API for hands-free control of the application.
 *
 * Features:
 * - Voice recognition with Web Speech API
 * - Custom wake word detection
 * - Command mapping and execution
 * - Natural language understanding
 * - Multi-language support
 * - Continuous listening mode
 */

export interface VoiceCommand {
  command: string
  aliases: string[]
  action: string
  parameters?: Record<string, any>
  description: string
  examples: string[]
}

export interface VoiceCommandResult {
  recognized: string
  command?: VoiceCommand
  confidence: number
  parameters?: Record<string, any>
  executed: boolean
  error?: string
}

export type VoiceCommandCallback = (result: VoiceCommandResult) => void

export class VoiceCommandsService {
  private recognition: SpeechRecognition | null = null
  private isListening: boolean = false
  private isContinuous: boolean = false
  private wakeWord: string = 'hey abode'
  private commands: Map<string, VoiceCommand> = new Map()
  private callbacks: VoiceCommandCallback[] = []
  private language: string = 'en-US'
  private confidenceThreshold: number = 0.7

  constructor() {
    this.initializeRecognition()
    this.registerDefaultCommands()
  }

  /**
   * Initialize Web Speech API
   */
  private initializeRecognition(): void {
    if (typeof window === 'undefined') return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser')
      return
    }

    this.recognition = new SpeechRecognition()
    this.recognition.continuous = this.isContinuous
    this.recognition.interimResults = true
    this.recognition.lang = this.language
    this.recognition.maxAlternatives = 3

    this.setupEventListeners()
  }

  /**
   * Setup event listeners for speech recognition
   */
  private setupEventListeners(): void {
    if (!this.recognition) return

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1]
      const transcript = result[0].transcript.trim().toLowerCase()
      const confidence = result[0].confidence

      console.log(`🎤 Recognized: "${transcript}" (confidence: ${confidence})`)

      // Check for wake word
      if (transcript.includes(this.wakeWord)) {
        this.processCommand(transcript.replace(this.wakeWord, '').trim(), confidence)
      } else if (this.isListening) {
        this.processCommand(transcript, confidence)
      }
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)

      if (event.error === 'no-speech') {
        // Restart if continuous mode
        if (this.isContinuous && this.isListening) {
          setTimeout(() => this.start(), 1000)
        }
      }
    }

    this.recognition.onend = () => {
      // Restart if continuous mode
      if (this.isContinuous && this.isListening) {
        this.recognition?.start()
      }
    }

    this.recognition.onstart = () => {
      console.log('🎤 Voice recognition started')
    }
  }

  /**
   * Register default commands
   */
  private registerDefaultCommands(): void {
    // Navigation commands
    this.registerCommand({
      command: 'navigate',
      aliases: ['go to', 'open', 'show'],
      action: 'navigate',
      description: 'Navigate to a different page',
      examples: [
        'go to dashboard',
        'open projects',
        'show models'
      ]
    })

    // Project commands
    this.registerCommand({
      command: 'create project',
      aliases: ['new project', 'start project'],
      action: 'create_project',
      description: 'Create a new project',
      examples: [
        'create project',
        'new project named house design',
        'start a new project'
      ]
    })

    // Render commands
    this.registerCommand({
      command: 'render',
      aliases: ['start render', 'begin render', 'queue render'],
      action: 'start_render',
      description: 'Start rendering the current scene',
      examples: [
        'render this scene',
        'start rendering',
        'queue a render job'
      ]
    })

    // Upload commands
    this.registerCommand({
      command: 'upload',
      aliases: ['upload file', 'add file'],
      action: 'upload_file',
      description: 'Upload a file to the project',
      examples: [
        'upload a file',
        'add floor plan'
      ]
    })

    // Search commands
    this.registerCommand({
      command: 'search',
      aliases: ['find', 'look for', 'search for'],
      action: 'search',
      description: 'Search for models or content',
      examples: [
        'search for sofa',
        'find kitchen models',
        'look for modern chairs'
      ]
    })

    // View commands
    this.registerCommand({
      command: 'zoom',
      aliases: ['zoom in', 'zoom out', 'zoom to'],
      action: 'zoom',
      description: 'Control camera zoom',
      examples: [
        'zoom in',
        'zoom out',
        'zoom to fit'
      ]
    })

    // Settings commands
    this.registerCommand({
      command: 'change language',
      aliases: ['switch language', 'set language'],
      action: 'change_language',
      description: 'Change interface language',
      examples: [
        'change language to spanish',
        'switch to french',
        'set language chinese'
      ]
    })

    // Help commands
    this.registerCommand({
      command: 'help',
      aliases: ['show help', 'what can you do', 'commands'],
      action: 'show_help',
      description: 'Show available voice commands',
      examples: [
        'help',
        'what can you do',
        'show me commands'
      ]
    })

    // Save command
    this.registerCommand({
      command: 'save',
      aliases: ['save project', 'save changes'],
      action: 'save',
      description: 'Save current project',
      examples: [
        'save',
        'save project',
        'save my changes'
      ]
    })

    // Undo/Redo commands
    this.registerCommand({
      command: 'undo',
      aliases: ['undo last', 'go back'],
      action: 'undo',
      description: 'Undo last action',
      examples: [
        'undo',
        'undo last action',
        'go back'
      ]
    })

    this.registerCommand({
      command: 'redo',
      aliases: ['redo last', 'go forward'],
      action: 'redo',
      description: 'Redo last undone action',
      examples: [
        'redo',
        'redo last action'
      ]
    })
  }

  /**
   * Register a voice command
   */
  registerCommand(command: VoiceCommand): void {
    this.commands.set(command.command, command)

    // Register aliases
    command.aliases.forEach(alias => {
      this.commands.set(alias, command)
    })

    console.log(`✅ Registered voice command: "${command.command}"`)
  }

  /**
   * Process recognized speech and match to command
   */
  private processCommand(transcript: string, confidence: number): void {
    if (confidence < this.confidenceThreshold) {
      this.notifyListeners({
        recognized: transcript,
        confidence,
        executed: false,
        error: 'Low confidence recognition'
      })
      return
    }

    // Find matching command
    const matchResult = this.matchCommand(transcript)

    if (matchResult) {
      const result: VoiceCommandResult = {
        recognized: transcript,
        command: matchResult.command,
        parameters: matchResult.parameters,
        confidence,
        executed: true
      }

      this.notifyListeners(result)
    } else {
      this.notifyListeners({
        recognized: transcript,
        confidence,
        executed: false,
        error: 'No matching command found'
      })
    }
  }

  /**
   * Match transcript to a command
   */
  private matchCommand(transcript: string): { command: VoiceCommand; parameters: Record<string, any> } | null {
    const lowerTranscript = transcript.toLowerCase()

    // Try exact match first
    for (const [key, command] of this.commands) {
      if (lowerTranscript.includes(key)) {
        const parameters = this.extractParameters(lowerTranscript, command)
        return { command, parameters }
      }
    }

    // Try fuzzy matching
    for (const [_, command] of this.commands) {
      const similarity = this.calculateSimilarity(lowerTranscript, command.command)
      if (similarity > 0.7) {
        const parameters = this.extractParameters(lowerTranscript, command)
        return { command, parameters }
      }
    }

    return null
  }

  /**
   * Extract parameters from transcript
   */
  private extractParameters(transcript: string, command: VoiceCommand): Record<string, any> {
    const parameters: Record<string, any> = {}

    // Extract common parameters
    if (command.action === 'navigate' || command.action === 'search') {
      // Remove command words
      let target = transcript
      command.aliases.forEach(alias => {
        target = target.replace(alias, '')
      })
      target = target.replace(command.command, '').trim()

      if (target) {
        parameters.target = target
      }
    }

    if (command.action === 'change_language') {
      const languages = ['english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'japanese', 'chinese', 'korean', 'arabic', 'hindi', 'russian']
      const found = languages.find(lang => transcript.includes(lang))
      if (found) {
        parameters.language = found
      }
    }

    if (command.action === 'zoom') {
      if (transcript.includes('in')) parameters.direction = 'in'
      if (transcript.includes('out')) parameters.direction = 'out'
      if (transcript.includes('fit')) parameters.direction = 'fit'
    }

    return parameters
  }

  /**
   * Calculate similarity between two strings (Levenshtein distance)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  /**
   * Levenshtein distance calculation
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Notify all registered listeners
   */
  private notifyListeners(result: VoiceCommandResult): void {
    this.callbacks.forEach(callback => callback(result))
  }

  /**
   * Start listening for voice commands
   */
  start(continuous: boolean = false): void {
    if (!this.recognition) {
      console.error('Speech recognition not available')
      return
    }

    this.isContinuous = continuous
    this.recognition.continuous = continuous
    this.isListening = true

    try {
      this.recognition.start()
      console.log('🎤 Voice commands activated')
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
    }
  }

  /**
   * Stop listening for voice commands
   */
  stop(): void {
    if (!this.recognition) return

    this.isListening = false
    this.recognition.stop()
    console.log('🔇 Voice commands deactivated')
  }

  /**
   * Set wake word
   */
  setWakeWord(word: string): void {
    this.wakeWord = word.toLowerCase()
    console.log(`🎙️ Wake word set to: "${this.wakeWord}"`)
  }

  /**
   * Set language
   */
  setLanguage(language: string): void {
    this.language = language
    if (this.recognition) {
      this.recognition.lang = language
    }
  }

  /**
   * Set confidence threshold
   */
  setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold))
  }

  /**
   * Register callback for command results
   */
  onCommand(callback: VoiceCommandCallback): () => void {
    this.callbacks.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Get all registered commands
   */
  getAvailableCommands(): VoiceCommand[] {
    const uniqueCommands = new Map<string, VoiceCommand>()
    this.commands.forEach((command) => {
      uniqueCommands.set(command.command, command)
    })
    return Array.from(uniqueCommands.values())
  }

  /**
   * Check if browser supports speech recognition
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
           ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }

  /**
   * Get current status
   */
  getStatus(): {
    isListening: boolean
    isContinuous: boolean
    language: string
    wakeWord: string
    commandCount: number
  } {
    return {
      isListening: this.isListening,
      isContinuous: this.isContinuous,
      language: this.language,
      wakeWord: this.wakeWord,
      commandCount: this.getAvailableCommands().length
    }
  }
}

// Export singleton instance
export const voiceCommands = new VoiceCommandsService()
