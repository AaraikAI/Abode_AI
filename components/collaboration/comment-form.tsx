'use client'

import { useState, useRef, useCallback } from 'react'
import { Send, Paperclip, X, Bold, Italic, Link as LinkIcon, AtSign, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface User {
  id: string
  name: string
  avatar?: string
}

export interface Attachment {
  id: string
  name: string
  size: number
  type: string
  url?: string
}

interface CommentFormProps {
  onSubmit: (content: string, attachments: Attachment[]) => void
  onCancel?: () => void
  placeholder?: string
  initialContent?: string
  users?: User[]
  maxLength?: number
  showCancel?: boolean
  submitLabel?: string
}

const EMOJI_LIST = ['😊', '👍', '❤️', '🎉', '🚀', '💡', '👀', '🔥']

export function CommentForm({
  onSubmit,
  onCancel,
  placeholder = 'Write a comment...',
  initialContent = '',
  users = [],
  maxLength = 5000,
  showCancel = false,
  submitLabel = 'Post Comment',
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursor = e.target.selectionStart

    setContent(value)
    setCursorPosition(cursor)

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf('@', cursor - 1)
    if (lastAtIndex !== -1 && cursor - lastAtIndex <= 20) {
      const searchTerm = value.slice(lastAtIndex + 1, cursor)
      if (!searchTerm.includes(' ')) {
        setMentionSearch(searchTerm)
        setShowMentions(true)
        return
      }
    }
    setShowMentions(false)
  }

  const insertMention = (user: User) => {
    const beforeCursor = content.slice(0, cursorPosition)
    const afterCursor = content.slice(cursorPosition)
    const lastAtIndex = beforeCursor.lastIndexOf('@')

    const newContent =
      beforeCursor.slice(0, lastAtIndex) + `@${user.name} ` + afterCursor

    setContent(newContent)
    setShowMentions(false)
    textareaRef.current?.focus()
  }

  const insertEmoji = (emoji: string) => {
    const beforeCursor = content.slice(0, cursorPosition)
    const afterCursor = content.slice(cursorPosition)
    const newContent = beforeCursor + emoji + afterCursor

    setContent(newContent)
    setCursorPosition(cursorPosition + emoji.length)
    textareaRef.current?.focus()
  }

  const formatText = (format: 'bold' | 'italic' | 'link') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.slice(start, end)

    let newText = ''
    let newCursor = end

    switch (format) {
      case 'bold':
        newText = `**${selectedText}**`
        newCursor = selectedText ? end + 4 : start + 2
        break
      case 'italic':
        newText = `*${selectedText}*`
        newCursor = selectedText ? end + 2 : start + 1
        break
      case 'link':
        newText = `[${selectedText || 'link text'}](url)`
        newCursor = selectedText ? end + 2 : start + 1
        break
    }

    const newContent = content.slice(0, start) + newText + content.slice(end)
    setContent(newContent)
    setCursorPosition(newCursor)
    setTimeout(() => textarea.focus(), 0)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: Attachment[] = Array.from(files).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
    }))

    setAttachments(prev => [...prev, ...newAttachments])

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  const handleSubmit = () => {
    if (content.trim() || attachments.length > 0) {
      onSubmit(content.trim(), attachments)
      setContent('')
      setAttachments([])
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(mentionSearch.toLowerCase())
  )

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex items-center gap-1 border-b pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('link')}
            title="Insert Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" title="Mention User">
                <AtSign className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="space-y-1">
                {users.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">No users available</p>
                ) : (
                  users.map(user => (
                    <Button
                      key={user.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        const newContent = content + `@${user.name} `
                        setContent(newContent)
                        setCursorPosition(newContent.length)
                      }}
                    >
                      {user.name}
                    </Button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" title="Insert Emoji">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="grid grid-cols-4 gap-2">
                {EMOJI_LIST.map((emoji, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    onClick={() => insertEmoji(emoji)}
                    className="text-2xl h-10"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="Attach File"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Text Area */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            placeholder={placeholder}
            className="min-h-[120px] resize-none"
            maxLength={maxLength}
          />

          {/* Mention Dropdown */}
          {showMentions && filteredUsers.length > 0 && (
            <Card className="absolute bottom-full mb-2 w-64 max-h-48 overflow-auto z-10 p-1">
              {filteredUsers.map(user => (
                <Button
                  key={user.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => insertMention(user)}
                >
                  <AtSign className="h-3 w-3 mr-2" />
                  {user.name}
                </Button>
              ))}
            </Card>
          )}
        </div>

        {/* Character Count */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {content.length} / {maxLength}
          </span>
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map(attachment => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-2 bg-muted rounded"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="h-4 w-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(attachment.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          {showCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() && attachments.length === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            {submitLabel}
          </Button>
        </div>
      </div>
    </Card>
  )
}
