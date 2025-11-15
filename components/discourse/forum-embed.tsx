'use client'

/**
 * Forum Embed Component
 *
 * Embedded community forum/discourse integration for
 * user discussions, support, and knowledge sharing
 */

import { useState, useEffect, useRef } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import {
  MessageSquare,
  Users,
  TrendingUp,
  Search,
  Filter,
  PlusCircle,
  ThumbsUp,
  MessageCircle,
  Eye,
  Pin,
  Lock,
  Award,
  Clock,
  Tag,
  ExternalLink,
  Send,
  CheckCircle
} from 'lucide-react'

export interface ForumTopic {
  id: string
  title: string
  content: string
  author: ForumUser
  category: string
  tags: string[]
  views: number
  replies: number
  likes: number
  isPinned: boolean
  isLocked: boolean
  isSolved: boolean
  createdAt: Date
  lastActivity: Date
  lastReplyAuthor?: ForumUser
}

export interface ForumUser {
  id: string
  username: string
  displayName: string
  avatar?: string
  reputation: number
  badges: string[]
  joinedAt: Date
}

export interface ForumReply {
  id: string
  topicId: string
  content: string
  author: ForumUser
  likes: number
  isAccepted: boolean
  createdAt: Date
}

export interface ForumCategory {
  id: string
  name: string
  description: string
  topicCount: number
  color: string
  icon: string
}

interface ForumEmbedProps {
  forumUrl?: string
  categories?: ForumCategory[]
  topics?: ForumTopic[]
  onCreateTopic?: (title: string, content: string, category: string) => void
  onReply?: (topicId: string, content: string) => void
  currentUser?: ForumUser
  embedded?: boolean
}

const defaultCategories: ForumCategory[] = [
  {
    id: 'general',
    name: 'General Discussion',
    description: 'General topics about the platform',
    topicCount: 245,
    color: '#3b82f6',
    icon: '💬'
  },
  {
    id: 'support',
    name: 'Technical Support',
    description: 'Get help with technical issues',
    topicCount: 189,
    color: '#ef4444',
    icon: '🛠️'
  },
  {
    id: 'features',
    name: 'Feature Requests',
    description: 'Suggest new features',
    topicCount: 156,
    color: '#10b981',
    icon: '✨'
  },
  {
    id: 'tutorials',
    name: 'Tutorials & Guides',
    description: 'Learn from the community',
    topicCount: 98,
    color: '#f59e0b',
    icon: '📚'
  }
]

const defaultTopics: ForumTopic[] = [
  {
    id: '1',
    title: 'How to optimize AI model performance?',
    content: 'Looking for best practices to optimize AI model inference speed...',
    author: {
      id: 'u1',
      username: 'john_doe',
      displayName: 'John Doe',
      reputation: 1250,
      badges: ['Expert', 'Helpful'],
      joinedAt: new Date('2023-01-15')
    },
    category: 'support',
    tags: ['ai', 'optimization', 'performance'],
    views: 1248,
    replies: 24,
    likes: 45,
    isPinned: true,
    isLocked: false,
    isSolved: true,
    createdAt: new Date('2024-01-20'),
    lastActivity: new Date('2024-01-22')
  },
  {
    id: '2',
    title: 'Feature Request: Dark Mode Support',
    content: 'Would love to see dark mode support in the platform...',
    author: {
      id: 'u2',
      username: 'jane_smith',
      displayName: 'Jane Smith',
      reputation: 890,
      badges: ['Contributor'],
      joinedAt: new Date('2023-03-20')
    },
    category: 'features',
    tags: ['ui', 'feature-request'],
    views: 856,
    replies: 18,
    likes: 67,
    isPinned: false,
    isLocked: false,
    isSolved: false,
    createdAt: new Date('2024-01-19'),
    lastActivity: new Date('2024-01-21')
  }
]

export function ForumEmbed({
  forumUrl,
  categories = defaultCategories,
  topics = defaultTopics,
  onCreateTopic,
  onReply,
  currentUser,
  embedded = false
}: ForumEmbedProps) {
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest')
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null)
  const [showNewTopic, setShowNewTopic] = useState(false)
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [newTopicContent, setNewTopicContent] = useState('')
  const [newTopicCategory, setNewTopicCategory] = useState('')
  const [replyContent, setReplyContent] = useState('')

  // Filter topics
  const filteredTopics = topics.filter(topic => {
    if (selectedCategory !== 'all' && topic.category !== selectedCategory) return false
    if (searchQuery && !topic.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  // Sort topics
  const sortedTopics = [...filteredTopics].sort((a, b) => {
    if (sortBy === 'latest') {
      return b.lastActivity.getTime() - a.lastActivity.getTime()
    } else if (sortBy === 'popular') {
      return b.views - a.views
    } else {
      return (b.likes + b.replies) - (a.likes + a.replies)
    }
  })

  // Move pinned topics to top
  const pinnedTopics = sortedTopics.filter(t => t.isPinned)
  const regularTopics = sortedTopics.filter(t => !t.isPinned)
  const displayTopics = [...pinnedTopics, ...regularTopics]

  // Calculate stats
  const totalTopics = topics.length
  const totalReplies = topics.reduce((sum, t) => sum + t.replies, 0)
  const totalViews = topics.reduce((sum, t) => sum + t.views, 0)
  const solvedTopics = topics.filter(t => t.isSolved).length

  /**
   * Handle creating new topic
   */
  const handleCreateTopic = () => {
    if (!newTopicTitle || !newTopicContent || !newTopicCategory) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      })
      return
    }

    onCreateTopic?.(newTopicTitle, newTopicContent, newTopicCategory)

    toast({
      title: 'Topic Created',
      description: 'Your topic has been posted successfully'
    })

    setNewTopicTitle('')
    setNewTopicContent('')
    setNewTopicCategory('')
    setShowNewTopic(false)
  }

  /**
   * Handle reply
   */
  const handleReply = () => {
    if (!selectedTopic || !replyContent) return

    onReply?.(selectedTopic.id, replyContent)

    toast({
      title: 'Reply Posted',
      description: 'Your reply has been added to the topic'
    })

    setReplyContent('')
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Topics</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTopics}</div>
            <p className="text-xs text-muted-foreground">
              {solvedTopics} solved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Replies</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReplies}</div>
            <p className="text-xs text-muted-foreground">
              Community responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all topics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">
              Online now
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Browse topics by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`p-4 border rounded-lg text-left transition-all hover:bg-accent ${
                selectedCategory === 'all' ? 'border-primary bg-accent' : ''
              }`}
            >
              <div className="text-2xl mb-2">🔍</div>
              <div className="font-medium">All Topics</div>
              <div className="text-xs text-muted-foreground">{totalTopics} topics</div>
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 border rounded-lg text-left transition-all hover:bg-accent ${
                  selectedCategory === category.id ? 'border-primary bg-accent' : ''
                }`}
              >
                <div className="text-2xl mb-2">{category.icon}</div>
                <div className="font-medium">{category.name}</div>
                <div className="text-xs text-muted-foreground">
                  {category.topicCount} topics
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Topics List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Discussion Topics</CardTitle>
              <CardDescription>
                {selectedCategory === 'all'
                  ? 'All discussions'
                  : categories.find(c => c.id === selectedCategory)?.name}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search topics..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowNewTopic(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Topic
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {displayTopics.map(topic => (
                <div
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-accent/50 ${
                    selectedTopic?.id === topic.id ? 'border-primary bg-accent/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {topic.author.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {topic.isPinned && (
                            <Pin className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                          {topic.isLocked && (
                            <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <h3 className="font-medium truncate">{topic.title}</h3>
                          {topic.isSolved && (
                            <Badge variant="default" className="flex-shrink-0">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Solved
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {topic.content}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {topic.replies}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {topic.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {topic.likes}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {topic.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                        <span>by {topic.author.displayName}</span>
                        <span>{topic.lastActivity.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* New Topic Dialog */}
      {showNewTopic && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Create New Topic</CardTitle>
            <CardDescription>Start a new discussion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Enter topic title..."
                value={newTopicTitle}
                onChange={e => setNewTopicTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={newTopicCategory} onValueChange={setNewTopicCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Write your message..."
                value={newTopicContent}
                onChange={e => setNewTopicContent(e.target.value)}
                rows={6}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewTopic(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTopic}>
                <Send className="h-4 w-4 mr-2" />
                Post Topic
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topic Detail (when selected) */}
      {selectedTopic && !showNewTopic && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {selectedTopic.isPinned && <Pin className="h-4 w-4 text-primary" />}
                  {selectedTopic.isLocked && (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <CardTitle>{selectedTopic.title}</CardTitle>
                  {selectedTopic.isSolved && (
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Solved
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Posted by {selectedTopic.author.displayName} •{' '}
                  {selectedTopic.createdAt.toLocaleDateString()}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTopic(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose max-w-none">
              <p>{selectedTopic.content}</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Add a Reply</label>
              <Textarea
                placeholder="Share your thoughts..."
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                rows={4}
              />
              <Button onClick={handleReply} disabled={!replyContent}>
                <Send className="h-4 w-4 mr-2" />
                Post Reply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
