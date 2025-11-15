'use client'

import { useState } from 'react'
import { Search, Sparkles, FileText, Clock, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { rag, type RAGContext, type DocumentChunk } from '@/lib/services/rag'

export function SemanticSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<RAGContext | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    topK: 5,
    hybridAlpha: 0.7,
    rerank: true,
    minScore: 0.0
  })
  const [showContext, setShowContext] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    try {
      const context = await rag.retrieve(query, {
        topK: settings.topK,
        hybridAlpha: settings.hybridAlpha,
        rerank: settings.rerank,
        minScore: settings.minScore
      })

      setResults(context)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const stats = rag.getStats()

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Semantic Search
          </CardTitle>
          <CardDescription>
            Search your knowledge base using natural language
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question or search for information..."
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{stats.totalChunks} chunks indexed</span>
            </div>
            {results && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{results.retrievalTime}ms</span>
                </div>
              </>
            )}
          </div>

          {/* Settings */}
          <details className="space-y-4">
            <summary className="text-sm font-medium cursor-pointer hover:text-primary">
              Advanced Settings
            </summary>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Number of results: {settings.topK}</Label>
                <Slider
                  value={[settings.topK]}
                  onValueChange={([value]) => setSettings({ ...settings, topK: value })}
                  min={1}
                  max={20}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Hybrid search weight: {Math.round(settings.hybridAlpha * 100)}% semantic
                </Label>
                <Slider
                  value={[settings.hybridAlpha]}
                  onValueChange={([value]) => setSettings({ ...settings, hybridAlpha: value })}
                  min={0}
                  max={1}
                  step={0.1}
                />
                <p className="text-xs text-muted-foreground">
                  0 = keyword only, 100 = semantic only
                </p>
              </div>

              <div className="space-y-2">
                <Label>Minimum score: {settings.minScore.toFixed(2)}</Label>
                <Slider
                  value={[settings.minScore]}
                  onValueChange={([value]) => setSettings({ ...settings, minScore: value })}
                  min={0}
                  max={0.9}
                  step={0.05}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Rerank results</Label>
                  <p className="text-xs text-muted-foreground">
                    Boost relevance of results
                  </p>
                </div>
                <Switch
                  checked={settings.rerank}
                  onCheckedChange={(checked) => setSettings({ ...settings, rerank: checked })}
                />
              </div>
            </div>
          </details>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Results ({results.chunks.length})
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowContext(!showContext)}
              >
                {showContext ? 'Hide Context' : 'Show Context'}
              </Button>
            </CardTitle>
            <CardDescription>
              Found {results.chunks.length} relevant chunks from {results.totalChunks} total
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.chunks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No results found. Try adjusting your search or settings.</p>
              </div>
            ) : (
              <>
                {/* Show combined context */}
                {showContext && (
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <h4 className="text-sm font-medium mb-2">Combined Context for LLM:</h4>
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {results.context}
                    </pre>
                  </div>
                )}

                {/* Individual chunks */}
                <div className="space-y-3">
                  {results.chunks.map((chunk, index) => (
                    <ChunkResult key={chunk.id} chunk={chunk} rank={index + 1} />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ChunkResult({ chunk, rank }: { chunk: DocumentChunk; rank: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const preview = chunk.content.slice(0, 200)
  const hasMore = chunk.content.length > 200

  return (
    <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-3">
        <Badge variant="outline" className="shrink-0">
          #{rank}
        </Badge>
        <div className="flex-1 space-y-2 min-w-0">
          {/* Source */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium truncate">
                {chunk.metadata.source}
              </span>
            </div>
            {chunk.score !== undefined && (
              <Badge variant="secondary" className="text-xs shrink-0">
                {Math.round(chunk.score * 100)}% match
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="text-sm text-muted-foreground">
            {isExpanded ? chunk.content : preview}
            {hasMore && !isExpanded && '...'}
          </div>

          {/* Expand/Collapse */}
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 text-xs"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </Button>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {chunk.metadata.page && (
              <span>Page {chunk.metadata.page}</span>
            )}
            {chunk.metadata.section && (
              <span>Section: {chunk.metadata.section}</span>
            )}
            {chunk.metadata.chunkIndex !== undefined && (
              <span>
                Chunk {chunk.metadata.chunkIndex + 1}/{chunk.metadata.totalChunks}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
