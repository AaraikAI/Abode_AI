'use client'

import { useState } from 'react'
import { GitCompare, ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type ChangeType = 'added' | 'removed' | 'modified' | 'unchanged'

export interface DiffLine {
  lineNumber: number
  content: string
  type: ChangeType
}

export interface FileDiff {
  path: string
  changeType: ChangeType
  oldLines?: DiffLine[]
  newLines?: DiffLine[]
  isBinary?: boolean
}

export interface VersionDiffData {
  oldVersion: {
    id: string
    name: string
    versionNumber: number
  }
  newVersion: {
    id: string
    name: string
    versionNumber: number
  }
  files: FileDiff[]
  summary: {
    filesChanged: number
    additions: number
    deletions: number
  }
}

interface VersionDiffProps {
  diffData: VersionDiffData
  viewMode?: 'split' | 'unified'
  onClose?: () => void
}

const CHANGE_TYPE_COLORS: Record<ChangeType, string> = {
  added: 'bg-green-50 text-green-900 border-green-200',
  removed: 'bg-red-50 text-red-900 border-red-200',
  modified: 'bg-blue-50 text-blue-900 border-blue-200',
  unchanged: 'bg-gray-50 text-gray-700',
}

const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  added: 'Added',
  removed: 'Removed',
  modified: 'Modified',
  unchanged: 'Unchanged',
}

export function VersionDiff({
  diffData,
  viewMode: initialViewMode = 'split',
  onClose,
}: VersionDiffProps) {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>(initialViewMode)
  const [selectedFile, setSelectedFile] = useState<number>(0)

  const currentFile = diffData.files[selectedFile]

  const renderLineNumber = (lineNum: number | null, type: ChangeType) => {
    return (
      <div
        className={`w-12 text-right px-2 text-xs text-muted-foreground border-r select-none ${
          type === 'added' ? 'bg-green-100' : type === 'removed' ? 'bg-red-100' : ''
        }`}
      >
        {lineNum !== null ? lineNum : ''}
      </div>
    )
  }

  const renderLine = (line: DiffLine) => {
    const bgColor =
      line.type === 'added'
        ? 'bg-green-50'
        : line.type === 'removed'
        ? 'bg-red-50'
        : line.type === 'modified'
        ? 'bg-blue-50'
        : ''

    const prefix =
      line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  '

    return (
      <div className={`flex font-mono text-xs ${bgColor}`}>
        {renderLineNumber(line.lineNumber, line.type)}
        <div className="flex-1 px-3 py-1 whitespace-pre">
          <span className="text-muted-foreground">{prefix}</span>
          {line.content}
        </div>
      </div>
    )
  }

  const renderSplitView = () => {
    if (!currentFile.oldLines && !currentFile.newLines) return null

    const maxLines = Math.max(
      currentFile.oldLines?.length || 0,
      currentFile.newLines?.length || 0
    )

    return (
      <div className="grid grid-cols-2 gap-4">
        {/* Old Version */}
        <div>
          <div className="bg-red-100 text-red-900 px-3 py-2 text-sm font-medium border-b">
            {diffData.oldVersion.name} (v{diffData.oldVersion.versionNumber})
          </div>
          <ScrollArea className="h-[500px]">
            {currentFile.oldLines?.map((line, index) => (
              <div key={`old-${index}`}>{renderLine(line)}</div>
            ))}
          </ScrollArea>
        </div>

        {/* New Version */}
        <div>
          <div className="bg-green-100 text-green-900 px-3 py-2 text-sm font-medium border-b">
            {diffData.newVersion.name} (v{diffData.newVersion.versionNumber})
          </div>
          <ScrollArea className="h-[500px]">
            {currentFile.newLines?.map((line, index) => (
              <div key={`new-${index}`}>{renderLine(line)}</div>
            ))}
          </ScrollArea>
        </div>
      </div>
    )
  }

  const renderUnifiedView = () => {
    if (!currentFile.oldLines && !currentFile.newLines) return null

    const allLines: DiffLine[] = []

    // Merge lines from both versions
    const oldLines = currentFile.oldLines || []
    const newLines = currentFile.newLines || []

    oldLines.forEach(line => {
      if (line.type === 'removed') {
        allLines.push(line)
      }
    })

    newLines.forEach(line => {
      if (line.type === 'added') {
        allLines.push(line)
      } else if (line.type === 'unchanged') {
        allLines.push(line)
      }
    })

    return (
      <ScrollArea className="h-[500px]">
        <div className="border">
          {allLines.map((line, index) => (
            <div key={index}>{renderLine(line)}</div>
          ))}
        </div>
      </ScrollArea>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitCompare className="h-5 w-5" />
            <div>
              <h3 className="font-semibold text-lg">Version Comparison</h3>
              <p className="text-sm text-muted-foreground">
                Comparing v{diffData.oldVersion.versionNumber} with v
                {diffData.newVersion.versionNumber}
              </p>
            </div>
          </div>

          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>

        {/* Summary */}
        <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
          <Badge variant="outline">
            {diffData.summary.filesChanged} files changed
          </Badge>
          <Badge className="bg-green-100 text-green-900 hover:bg-green-100">
            +{diffData.summary.additions} additions
          </Badge>
          <Badge className="bg-red-100 text-red-900 hover:bg-red-100">
            -{diffData.summary.deletions} deletions
          </Badge>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'split' | 'unified')}>
            <TabsList>
              <TabsTrigger value="split">
                <ArrowLeftRight className="h-3 w-3 mr-2" />
                Split View
              </TabsTrigger>
              <TabsTrigger value="unified">Unified View</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* File Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedFile(Math.max(0, selectedFile - 1))}
              disabled={selectedFile === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {selectedFile + 1} / {diffData.files.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSelectedFile(Math.min(diffData.files.length - 1, selectedFile + 1))
              }
              disabled={selectedFile === diffData.files.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* File List */}
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="h-32">
            {diffData.files.map((file, index) => (
              <button
                key={index}
                onClick={() => setSelectedFile(index)}
                className={`w-full text-left px-4 py-2 text-sm border-b hover:bg-muted/50 transition-colors ${
                  index === selectedFile ? 'bg-muted' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono">{file.path}</span>
                  <Badge variant="outline" className="text-xs">
                    {CHANGE_TYPE_LABELS[file.changeType]}
                  </Badge>
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>

        {/* Diff View */}
        <div className="border rounded-lg overflow-hidden">
          {currentFile.isBinary ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Binary file - cannot show diff</p>
            </div>
          ) : (
            <>
              {viewMode === 'split' && renderSplitView()}
              {viewMode === 'unified' && renderUnifiedView()}
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
