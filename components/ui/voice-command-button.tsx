'use client'

import { useState, useEffect, useCallback } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  voiceCommands,
  type VoiceCommandResult,
  VoiceCommandsService
} from '@/lib/services/voice-commands'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface VoiceCommandButtonProps {
  className?: string
  onCommandExecuted?: (result: VoiceCommandResult) => void
  continuous?: boolean
}

export function VoiceCommandButton({
  className,
  onCommandExecuted,
  continuous = false
}: VoiceCommandButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [lastRecognized, setLastRecognized] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Check browser support
    setIsSupported(VoiceCommandsService.isSupported())

    // Subscribe to command results
    const unsubscribe = voiceCommands.onCommand((result: VoiceCommandResult) => {
      setLastRecognized(result.recognized)
      setIsProcessing(false)

      if (result.executed) {
        console.log('✅ Command executed:', result.command?.action, result.parameters)
        onCommandExecuted?.(result)
      } else if (result.error) {
        console.warn('⚠️ Command error:', result.error)
      }

      // Clear recognized text after 3 seconds
      setTimeout(() => setLastRecognized(''), 3000)
    })

    return () => {
      unsubscribe()
      voiceCommands.stop()
    }
  }, [onCommandExecuted])

  const toggleListening = useCallback(() => {
    if (!isSupported) {
      console.error('Voice commands not supported in this browser')
      return
    }

    if (isListening) {
      voiceCommands.stop()
      setIsListening(false)
      setIsProcessing(false)
    } else {
      voiceCommands.start(continuous)
      setIsListening(true)
      setIsProcessing(true)
    }
  }, [isListening, isSupported, continuous])

  if (!isSupported) {
    return null
  }

  return (
    <TooltipProvider>
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isListening ? 'default' : 'outline'}
              size="icon"
              onClick={toggleListening}
              className={cn(
                'relative transition-all',
                isListening && 'animate-pulse bg-red-500 hover:bg-red-600'
              )}
            >
              {isProcessing && !lastRecognized ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isListening ? (
                <Mic className="h-4 w-4" />
              ) : (
                <MicOff className="h-4 w-4" />
              )}

              {isListening && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isListening
                ? `Voice commands active${continuous ? ' (continuous)' : ''}`
                : 'Start voice commands'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Say "hey abode" followed by a command
            </p>
          </TooltipContent>
        </Tooltip>

        {lastRecognized && (
          <div className="absolute mt-16 px-3 py-2 bg-popover border rounded-md shadow-lg animate-in fade-in slide-in-from-top-2">
            <p className="text-xs text-muted-foreground">Recognized:</p>
            <p className="text-sm font-medium">{lastRecognized}</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
