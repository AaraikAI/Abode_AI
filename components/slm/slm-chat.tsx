'use client'

import { useState } from 'react'
import { Send, Bot, User, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSLM } from '@/hooks/use-slm'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  tokens?: number
  inferenceTime?: number
}

export function SLMChat() {
  const { isLoaded, isInferring, modelInfo, loadModel, infer, error } = useSLM()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')

  const handleSend = async () => {
    if (!input.trim() || isInferring) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')

    try {
      if (!isLoaded) {
        await loadModel()
      }

      const response = await infer({
        prompt: input,
        systemPrompt: 'You are a helpful AI assistant specialized in architectural design and 3D modeling.'
      })

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.generated,
        timestamp: new Date(),
        tokens: response.tokens,
        inferenceTime: response.inferenceTime
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Local AI Assistant
            </CardTitle>
            <CardDescription>
              Powered by {modelInfo.modelId} ({modelInfo.backend})
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isLoaded ? 'default' : 'secondary'}>
              {isLoaded ? 'Ready' : 'Not Loaded'}
            </Badge>
            <Badge variant="outline">{modelInfo.estimatedSize}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation with the AI assistant</p>
                <p className="text-sm mt-2">
                  Runs locally on your device - private and fast
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] space-y-1 ${
                      message.role === 'user' ? 'text-right' : ''
                    }`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {message.tokens && (
                        <>
                          <span>•</span>
                          <span>{message.tokens} tokens</span>
                        </>
                      )}
                      {message.inferenceTime && (
                        <>
                          <span>•</span>
                          <span>{message.inferenceTime}ms</span>
                        </>
                      )}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {isInferring && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isLoaded ? "Type your message..." : "Loading model..."}
            disabled={isInferring || !isLoaded}
            className="min-h-[60px] max-h-[120px] resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isInferring || !isLoaded}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            {isInferring ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Model Status */}
        {!isLoaded && (
          <Button onClick={loadModel} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Load Model ({modelInfo.estimatedSize})
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
