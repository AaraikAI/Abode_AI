'use client'

/**
 * AI Reasoning Chat Interface
 *
 * Advanced chat interface with Claude AI integration for architectural reasoning,
 * design decisions, and technical consultations
 */

import { useState, useRef, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import {
  MessageSquare,
  Send,
  Loader2,
  Brain,
  Code,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Download
} from 'lucide-react'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  reasoning?: ReasoningStep[]
  attachments?: Attachment[]
  confidence?: number
  feedback?: 'positive' | 'negative' | null
}

export interface ReasoningStep {
  step: number
  type: 'analysis' | 'evaluation' | 'synthesis' | 'conclusion'
  content: string
  confidence: number
}

export interface Attachment {
  id: string
  type: 'image' | 'document' | 'code'
  name: string
  url: string
  size: number
}

interface ChatInterfaceProps {
  projectId?: string
  initialMessages?: Message[]
  onSendMessage?: (message: string, attachments?: Attachment[]) => Promise<Message>
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void
  maxTokens?: number
  temperature?: number
  model?: 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku'
}

const defaultMessages: Message[] = [
  {
    id: '1',
    role: 'system',
    content: 'I am Claude, an AI assistant specialized in architecture, engineering, and construction. I can help you with design decisions, code review, technical analysis, and architectural reasoning.',
    timestamp: new Date(),
    confidence: 100
  }
]

export function ChatInterface({
  projectId,
  initialMessages = defaultMessages,
  onSendMessage,
  onFeedback,
  maxTokens = 4096,
  temperature = 0.7,
  model = 'claude-3-sonnet'
}: ChatInterfaceProps) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showReasoning, setShowReasoning] = useState(true)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  /**
   * Send message to AI
   */
  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setAttachments([])
    setIsLoading(true)

    try {
      // Call API or custom handler
      let assistantMessage: Message

      if (onSendMessage) {
        assistantMessage = await onSendMessage(input, attachments)
      } else {
        // Simulate AI response with reasoning
        await new Promise(resolve => setTimeout(resolve, 2000))

        const reasoning: ReasoningStep[] = [
          {
            step: 1,
            type: 'analysis',
            content: 'Analyzing the requirements and context of your question.',
            confidence: 95
          },
          {
            step: 2,
            type: 'evaluation',
            content: 'Evaluating multiple approaches and considering best practices.',
            confidence: 90
          },
          {
            step: 3,
            type: 'synthesis',
            content: 'Synthesizing information to formulate a comprehensive response.',
            confidence: 92
          },
          {
            step: 4,
            type: 'conclusion',
            content: 'Providing actionable recommendations based on analysis.',
            confidence: 88
          }
        ]

        assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: `Based on your question about "${input.slice(0, 50)}...", I've analyzed the situation and here's my recommendation:\n\n1. **Primary Consideration**: The approach should prioritize sustainability and cost-effectiveness.\n\n2. **Technical Analysis**: Using modern materials and AI-driven optimization can reduce costs by 15-20%.\n\n3. **Implementation Strategy**: I recommend a phased approach with iterative testing.\n\nWould you like me to elaborate on any specific aspect?`,
          timestamp: new Date(),
          reasoning,
          confidence: 91
        }
      }

      setMessages(prev => [...prev, assistantMessage])

      toast({
        title: 'Response Generated',
        description: 'Claude has analyzed your request'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to get response',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle file attachment
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    const newAttachments: Attachment[] = files.map(file => ({
      id: `attach-${Date.now()}-${Math.random()}`,
      type: file.type.startsWith('image/') ? 'image' : 'document',
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size
    }))

    setAttachments(prev => [...prev, ...newAttachments])
  }

  /**
   * Copy message content
   */
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: 'Copied',
      description: 'Message content copied to clipboard'
    })
  }

  /**
   * Handle feedback
   */
  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    )
    onFeedback?.(messageId, feedback)

    toast({
      title: 'Feedback Recorded',
      description: 'Thank you for your feedback'
    })
  }

  /**
   * Regenerate response
   */
  const handleRegenerate = async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1 || messageIndex === 0) return

    const previousUserMessage = messages[messageIndex - 1]
    if (previousUserMessage.role !== 'user') return

    // Remove the assistant message
    setMessages(prev => prev.filter(m => m.id !== messageId))

    // Regenerate
    setInput(previousUserMessage.content)
    await handleSend()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <Card className="flex-shrink-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Reasoning Chat
              </CardTitle>
              <CardDescription>
                Powered by {model.replace('-', ' ').toUpperCase()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <Sparkles className="h-3 w-3 mr-1" />
                Advanced Reasoning
              </Badge>
              <Select value={model} disabled>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                  <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="flex-1 mt-4 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <Avatar className="flex-shrink-0">
                  <AvatarFallback>
                    {message.role === 'user' ? (
                      'U'
                    ) : message.role === 'assistant' ? (
                      <Brain className="h-4 w-4" />
                    ) : (
                      'S'
                    )}
                  </AvatarFallback>
                </Avatar>

                {/* Message Content */}
                <div
                  className={`flex-1 max-w-[80%] ${
                    message.role === 'user' ? 'text-right' : ''
                  }`}
                >
                  <div
                    className={`rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : message.role === 'system'
                        ? 'bg-muted'
                        : 'bg-accent'
                    }`}
                  >
                    {/* Message Text */}
                    <div className="whitespace-pre-wrap">{message.content}</div>

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.attachments.map(attachment => (
                          <div
                            key={attachment.id}
                            className="flex items-center gap-2 p-2 rounded bg-background/50"
                          >
                            {attachment.type === 'image' ? (
                              <ImageIcon className="h-4 w-4" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                            <span className="text-sm flex-1">{attachment.name}</span>
                            <span className="text-xs opacity-70">
                              {(attachment.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Confidence */}
                    {message.confidence && message.role === 'assistant' && (
                      <div className="mt-3 pt-3 border-t border-current/20">
                        <div className="flex items-center justify-between text-xs opacity-70 mb-1">
                          <span>Confidence</span>
                          <span>{message.confidence}%</span>
                        </div>
                        <Progress value={message.confidence} className="h-1" />
                      </div>
                    )}
                  </div>

                  {/* Reasoning Steps */}
                  {message.reasoning && showReasoning && message.role === 'assistant' && (
                    <Card className="mt-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Reasoning Process
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {message.reasoning.map(step => (
                          <div key={step.step} className="flex gap-2">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                              {step.step}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {step.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {step.confidence}% confidence
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{step.content}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Actions */}
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(message.content)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback(message.id, 'positive')}
                        className={message.feedback === 'positive' ? 'text-green-500' : ''}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback(message.id, 'negative')}
                        className={message.feedback === 'negative' ? 'text-red-500' : ''}
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegenerate(message.id)}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Regenerate
                      </Button>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-xs text-muted-foreground mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar>
                  <AvatarFallback>
                    <Brain className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="rounded-lg p-4 bg-accent">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Claude is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Input Area */}
      <Card className="flex-shrink-0 mt-4">
        <CardContent className="p-4 space-y-3">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map(attachment => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted"
                >
                  {attachment.type === 'image' ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span className="text-sm">{attachment.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setAttachments(prev => prev.filter(a => a.id !== attachment.id))
                    }
                    className="h-5 w-5 p-0"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Input Field */}
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />

            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Ask Claude about architecture, design, code, or technical decisions..."
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />

            <Button
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && attachments.length === 0)}
              size="icon"
              className="h-auto"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>
              {input.length}/{maxTokens * 4}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
