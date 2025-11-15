'use client'

/**
 * Walkthrough Editor Component
 *
 * Timeline editor for camera paths with keyframes and interpolation
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Film,
  Play,
  Pause,
  Plus,
  Trash2,
  Copy,
  MoreVertical,
  Camera,
  MoveVertical,
  RotateCw,
  Map,
} from 'lucide-react'

export type InterpolationType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bezier'

export interface CameraKeyframe {
  id: string
  time: number // in seconds
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  fov: number
  interpolation: InterpolationType
}

export interface WalkthroughSettings {
  duration: number
  fps: number
  keyframes: CameraKeyframe[]
  loopEnabled: boolean
  smoothingFactor: number
}

interface WalkthroughEditorProps {
  projectId: string
  initialSettings?: Partial<WalkthroughSettings>
  onChange?: (settings: WalkthroughSettings) => void
  onPreview?: (time: number) => void
}

export function WalkthroughEditor({
  projectId,
  initialSettings,
  onChange,
  onPreview,
}: WalkthroughEditorProps) {
  const [settings, setSettings] = useState<WalkthroughSettings>({
    duration: initialSettings?.duration || 30,
    fps: initialSettings?.fps || 30,
    keyframes: initialSettings?.keyframes || [],
    loopEnabled: initialSettings?.loopEnabled || false,
    smoothingFactor: initialSettings?.smoothingFactor || 0.5,
  })

  const [selectedKeyframe, setSelectedKeyframe] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const updateSettings = (updates: Partial<WalkthroughSettings>) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    onChange?.(newSettings)
  }

  const addKeyframe = () => {
    const newKeyframe: CameraKeyframe = {
      id: `keyframe-${Date.now()}`,
      time: currentTime,
      position: { x: 0, y: 0, z: 5 },
      rotation: { x: 0, y: 0, z: 0 },
      fov: 50,
      interpolation: 'ease-in-out',
    }

    const newKeyframes = [...settings.keyframes, newKeyframe].sort((a, b) => a.time - b.time)
    updateSettings({ keyframes: newKeyframes })
    setSelectedKeyframe(newKeyframe.id)
  }

  const deleteKeyframe = (id: string) => {
    const newKeyframes = settings.keyframes.filter((kf) => kf.id !== id)
    updateSettings({ keyframes: newKeyframes })
    if (selectedKeyframe === id) {
      setSelectedKeyframe(null)
    }
  }

  const duplicateKeyframe = (id: string) => {
    const keyframe = settings.keyframes.find((kf) => kf.id === id)
    if (!keyframe) return

    const newKeyframe: CameraKeyframe = {
      ...keyframe,
      id: `keyframe-${Date.now()}`,
      time: Math.min(keyframe.time + 1, settings.duration),
    }

    const newKeyframes = [...settings.keyframes, newKeyframe].sort((a, b) => a.time - b.time)
    updateSettings({ keyframes: newKeyframes })
    setSelectedKeyframe(newKeyframe.id)
  }

  const updateKeyframe = (id: string, updates: Partial<CameraKeyframe>) => {
    const newKeyframes = settings.keyframes.map((kf) =>
      kf.id === id ? { ...kf, ...updates } : kf
    )
    updateSettings({ keyframes: newKeyframes })
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const time = percentage * settings.duration
    setCurrentTime(Math.max(0, Math.min(settings.duration, time)))
    onPreview?.(time)
  }

  const selectedKeyframeData = settings.keyframes.find((kf) => kf.id === selectedKeyframe)

  return (
    <div className="space-y-4">
      {/* Playback Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Film className="h-5 w-5" />
                Walkthrough Editor
              </CardTitle>
              <CardDescription>
                Create camera animations with keyframes
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={isPlaying ? 'secondary' : 'default'}
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Preview
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={addKeyframe}>
                <Plus className="h-4 w-4 mr-2" />
                Add Keyframe
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Timeline Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={settings.duration}
                onChange={(e) => updateSettings({ duration: parseInt(e.target.value) || 30 })}
                min={1}
                max={300}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fps">Frame Rate (FPS)</Label>
              <Select
                value={settings.fps.toString()}
                onValueChange={(value) => updateSettings({ fps: parseInt(value) })}
              >
                <SelectTrigger id="fps">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 FPS (Cinema)</SelectItem>
                  <SelectItem value="30">30 FPS (Standard)</SelectItem>
                  <SelectItem value="60">60 FPS (Smooth)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Timeline Scrubber */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Timeline</span>
              <span className="font-medium">
                {currentTime.toFixed(2)}s / {settings.duration}s
              </span>
            </div>

            {/* Timeline Track */}
            <div
              className="relative h-20 bg-muted rounded-lg cursor-pointer"
              onClick={handleTimelineClick}
            >
              {/* Time Markers */}
              <div className="absolute inset-x-0 top-0 flex justify-between px-2 pt-1 text-xs text-muted-foreground">
                {Array.from({ length: 11 }, (_, i) => (
                  <span key={i}>{((settings.duration / 10) * i).toFixed(0)}s</span>
                ))}
              </div>

              {/* Keyframes */}
              <div className="absolute inset-0 flex items-center">
                {settings.keyframes.map((keyframe) => (
                  <div
                    key={keyframe.id}
                    className={`absolute w-3 h-3 rounded-full cursor-pointer transform -translate-x-1/2 ${
                      selectedKeyframe === keyframe.id
                        ? 'bg-primary ring-2 ring-primary ring-offset-2'
                        : 'bg-secondary hover:bg-primary/50'
                    }`}
                    style={{ left: `${(keyframe.time / settings.duration) * 100}%` }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedKeyframe(keyframe.id)
                      setCurrentTime(keyframe.time)
                    }}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="absolute inset-0" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => duplicateKeyframe(keyframe.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => deleteKeyframe(keyframe.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}

                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary"
                  style={{ left: `${(currentTime / settings.duration) * 100}%` }}
                >
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-primary rounded-full" />
                </div>
              </div>
            </div>

            {/* Timeline Slider */}
            <Slider
              value={[currentTime]}
              onValueChange={([value]) => {
                setCurrentTime(value)
                onPreview?.(value)
              }}
              min={0}
              max={settings.duration}
              step={0.1}
            />
          </div>

          <Separator />

          {/* Smoothing */}
          <div className="space-y-2">
            <Label>Path Smoothing: {settings.smoothingFactor.toFixed(2)}</Label>
            <Slider
              value={[settings.smoothingFactor]}
              onValueChange={([value]) => updateSettings({ smoothingFactor: value })}
              min={0}
              max={1}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">
              Higher values create smoother camera movements
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Keyframe Properties */}
      {selectedKeyframeData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Keyframe Properties
              </CardTitle>
              <div className="flex gap-2">
                <Badge>Time: {selectedKeyframeData.time.toFixed(2)}s</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteKeyframe(selectedKeyframeData.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Time */}
            <div className="space-y-2">
              <Label>Time (seconds)</Label>
              <Input
                type="number"
                value={selectedKeyframeData.time}
                onChange={(e) =>
                  updateKeyframe(selectedKeyframeData.id, {
                    time: Math.max(0, Math.min(settings.duration, parseFloat(e.target.value) || 0)),
                  })
                }
                step={0.1}
                min={0}
                max={settings.duration}
              />
            </div>

            <Separator />

            {/* Position */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Position
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="pos-x" className="text-xs">X</Label>
                  <Input
                    id="pos-x"
                    type="number"
                    value={selectedKeyframeData.position.x}
                    onChange={(e) =>
                      updateKeyframe(selectedKeyframeData.id, {
                        position: {
                          ...selectedKeyframeData.position,
                          x: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    step={0.1}
                  />
                </div>
                <div>
                  <Label htmlFor="pos-y" className="text-xs">Y</Label>
                  <Input
                    id="pos-y"
                    type="number"
                    value={selectedKeyframeData.position.y}
                    onChange={(e) =>
                      updateKeyframe(selectedKeyframeData.id, {
                        position: {
                          ...selectedKeyframeData.position,
                          y: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    step={0.1}
                  />
                </div>
                <div>
                  <Label htmlFor="pos-z" className="text-xs">Z</Label>
                  <Input
                    id="pos-z"
                    type="number"
                    value={selectedKeyframeData.position.z}
                    onChange={(e) =>
                      updateKeyframe(selectedKeyframeData.id, {
                        position: {
                          ...selectedKeyframeData.position,
                          z: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    step={0.1}
                  />
                </div>
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <RotateCw className="h-4 w-4" />
                Rotation (degrees)
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="rot-x" className="text-xs">X</Label>
                  <Input
                    id="rot-x"
                    type="number"
                    value={selectedKeyframeData.rotation.x}
                    onChange={(e) =>
                      updateKeyframe(selectedKeyframeData.id, {
                        rotation: {
                          ...selectedKeyframeData.rotation,
                          x: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    step={1}
                  />
                </div>
                <div>
                  <Label htmlFor="rot-y" className="text-xs">Y</Label>
                  <Input
                    id="rot-y"
                    type="number"
                    value={selectedKeyframeData.rotation.y}
                    onChange={(e) =>
                      updateKeyframe(selectedKeyframeData.id, {
                        rotation: {
                          ...selectedKeyframeData.rotation,
                          y: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    step={1}
                  />
                </div>
                <div>
                  <Label htmlFor="rot-z" className="text-xs">Z</Label>
                  <Input
                    id="rot-z"
                    type="number"
                    value={selectedKeyframeData.rotation.z}
                    onChange={(e) =>
                      updateKeyframe(selectedKeyframeData.id, {
                        rotation: {
                          ...selectedKeyframeData.rotation,
                          z: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    step={1}
                  />
                </div>
              </div>
            </div>

            {/* FOV */}
            <div className="space-y-2">
              <Label>Field of View: {selectedKeyframeData.fov}°</Label>
              <Slider
                value={[selectedKeyframeData.fov]}
                onValueChange={([value]) => updateKeyframe(selectedKeyframeData.id, { fov: value })}
                min={10}
                max={120}
                step={1}
              />
            </div>

            {/* Interpolation */}
            <div className="space-y-2">
              <Label>Interpolation</Label>
              <Select
                value={selectedKeyframeData.interpolation}
                onValueChange={(value: InterpolationType) =>
                  updateKeyframe(selectedKeyframeData.id, { interpolation: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="ease-in">Ease In</SelectItem>
                  <SelectItem value="ease-out">Ease Out</SelectItem>
                  <SelectItem value="ease-in-out">Ease In-Out</SelectItem>
                  <SelectItem value="bezier">Bezier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keyframe List */}
      <Card>
        <CardHeader>
          <CardTitle>Keyframes ({settings.keyframes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {settings.keyframes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No keyframes added yet</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={addKeyframe}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Keyframe
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {settings.keyframes.map((keyframe, index) => (
                <div
                  key={keyframe.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedKeyframe === keyframe.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => {
                    setSelectedKeyframe(keyframe.id)
                    setCurrentTime(keyframe.time)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Keyframe {index + 1}</span>
                        <Badge variant="outline">{keyframe.time.toFixed(2)}s</Badge>
                        <Badge variant="secondary" className="text-xs">
                          {keyframe.interpolation}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Pos: ({keyframe.position.x.toFixed(1)}, {keyframe.position.y.toFixed(1)}, {keyframe.position.z.toFixed(1)})
                        • FOV: {keyframe.fov}°
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => duplicateKeyframe(keyframe.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => deleteKeyframe(keyframe.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
