import { useState, useEffect, useCallback } from 'react'
import {
  voiceCommands,
  type VoiceCommand,
  type VoiceCommandResult,
  VoiceCommandsService
} from '@/lib/services/voice-commands'

export interface UseVoiceCommandsOptions {
  continuous?: boolean
  autoStart?: boolean
  onCommand?: (result: VoiceCommandResult) => void
}

export function useVoiceCommands(options: UseVoiceCommandsOptions = {}) {
  const { continuous = false, autoStart = false, onCommand } = options

  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [lastResult, setLastResult] = useState<VoiceCommandResult | null>(null)
  const [availableCommands, setAvailableCommands] = useState<VoiceCommand[]>([])
  const [status, setStatus] = useState({
    isListening: false,
    isContinuous: false,
    language: 'en-US',
    wakeWord: 'hey abode',
    commandCount: 0
  })

  useEffect(() => {
    // Check browser support
    const supported = VoiceCommandsService.isSupported()
    setIsSupported(supported)

    if (!supported) {
      console.warn('Voice commands not supported in this browser')
      return
    }

    // Load available commands
    setAvailableCommands(voiceCommands.getAvailableCommands())
    setStatus(voiceCommands.getStatus())

    // Subscribe to command results
    const unsubscribe = voiceCommands.onCommand((result: VoiceCommandResult) => {
      setLastResult(result)
      setStatus(voiceCommands.getStatus())
      setIsListening(voiceCommands.getStatus().isListening)
      onCommand?.(result)
    })

    // Auto-start if requested
    if (autoStart && supported) {
      start()
    }

    return () => {
      unsubscribe()
      stop()
    }
  }, [autoStart, onCommand])

  const start = useCallback(() => {
    if (!isSupported) {
      console.error('Voice commands not supported')
      return
    }

    voiceCommands.start(continuous)
    setIsListening(true)
  }, [isSupported, continuous])

  const stop = useCallback(() => {
    voiceCommands.stop()
    setIsListening(false)
  }, [])

  const toggle = useCallback(() => {
    if (isListening) {
      stop()
    } else {
      start()
    }
  }, [isListening, start, stop])

  const registerCommand = useCallback((command: VoiceCommand) => {
    voiceCommands.registerCommand(command)
    setAvailableCommands(voiceCommands.getAvailableCommands())
  }, [])

  const setWakeWord = useCallback((word: string) => {
    voiceCommands.setWakeWord(word)
    setStatus(voiceCommands.getStatus())
  }, [])

  const setLanguage = useCallback((language: string) => {
    voiceCommands.setLanguage(language)
    setStatus(voiceCommands.getStatus())
  }, [])

  const setConfidenceThreshold = useCallback((threshold: number) => {
    voiceCommands.setConfidenceThreshold(threshold)
  }, [])

  return {
    // State
    isListening,
    isSupported,
    lastResult,
    availableCommands,
    status,

    // Actions
    start,
    stop,
    toggle,
    registerCommand,
    setWakeWord,
    setLanguage,
    setConfidenceThreshold,
  }
}
