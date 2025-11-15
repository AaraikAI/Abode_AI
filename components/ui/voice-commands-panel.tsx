'use client'

import { useState, useEffect } from 'react'
import { Mic, Volume2, Settings, X, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  voiceCommands,
  type VoiceCommand,
  type VoiceCommandResult,
  VoiceCommandsService
} from '@/lib/services/voice-commands'
import { VoiceCommandButton } from './voice-command-button'

export function VoiceCommandsPanel() {
  const [commands, setCommands] = useState<VoiceCommand[]>([])
  const [status, setStatus] = useState({
    isListening: false,
    isContinuous: false,
    language: 'en-US',
    wakeWord: 'hey abode',
    commandCount: 0
  })
  const [recentCommands, setRecentCommands] = useState<VoiceCommandResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState({
    continuous: false,
    wakeWord: 'hey abode',
    confidenceThreshold: 0.7,
    language: 'en-US'
  })

  useEffect(() => {
    // Load available commands
    setCommands(voiceCommands.getAvailableCommands())
    setStatus(voiceCommands.getStatus())

    // Subscribe to command results
    const unsubscribe = voiceCommands.onCommand((result: VoiceCommandResult) => {
      setRecentCommands(prev => [result, ...prev].slice(0, 10))
      setStatus(voiceCommands.getStatus())
    })

    return () => unsubscribe()
  }, [])

  const handleCommandExecuted = (result: VoiceCommandResult) => {
    // Handle command execution in the application
    if (!result.command) return

    switch (result.command.action) {
      case 'navigate':
        // Handle navigation
        console.log('Navigate to:', result.parameters?.target)
        break
      case 'create_project':
        // Handle project creation
        console.log('Create project')
        break
      case 'start_render':
        // Handle render start
        console.log('Start render')
        break
      case 'search':
        // Handle search
        console.log('Search for:', result.parameters?.target)
        break
      case 'zoom':
        // Handle zoom
        console.log('Zoom:', result.parameters?.direction)
        break
      case 'change_language':
        // Handle language change
        console.log('Change language to:', result.parameters?.language)
        break
      case 'show_help':
        // Show help
        setIsOpen(true)
        break
      default:
        console.log('Execute action:', result.command.action, result.parameters)
    }
  }

  const applySettings = () => {
    voiceCommands.setWakeWord(settings.wakeWord)
    voiceCommands.setConfidenceThreshold(settings.confidenceThreshold)
    voiceCommands.setLanguage(settings.language)
  }

  const groupedCommands = commands.reduce((acc, cmd) => {
    const category = cmd.action.split('_')[0]
    if (!acc[category]) acc[category] = []
    acc[category].push(cmd)
    return acc
  }, {} as Record<string, VoiceCommand[]>)

  return (
    <div className="flex items-center gap-2">
      <VoiceCommandButton
        onCommandExecuted={handleCommandExecuted}
        continuous={settings.continuous}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Voice Commands
            </DialogTitle>
            <DialogDescription>
              Control Abode AI with your voice using natural language commands
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Listening</span>
                  <Badge variant={status.isListening ? 'default' : 'secondary'}>
                    {status.isListening ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Wake Word</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{status.wakeWord}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Language</span>
                  <span className="text-sm">{status.language}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Available Commands</span>
                  <Badge variant="outline">{status.commandCount}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wake-word">Wake Word</Label>
                  <Input
                    id="wake-word"
                    value={settings.wakeWord}
                    onChange={(e) => setSettings({ ...settings, wakeWord: e.target.value })}
                    placeholder="hey abode"
                  />
                  <p className="text-xs text-muted-foreground">
                    Say this word before each command to activate
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="continuous">Continuous Listening</Label>
                    <p className="text-xs text-muted-foreground">
                      Keep listening after each command
                    </p>
                  </div>
                  <Switch
                    id="continuous"
                    checked={settings.continuous}
                    onCheckedChange={(checked) => setSettings({ ...settings, continuous: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Confidence Threshold: {Math.round(settings.confidenceThreshold * 100)}%</Label>
                  <Slider
                    value={[settings.confidenceThreshold]}
                    onValueChange={([value]) => setSettings({ ...settings, confidenceThreshold: value })}
                    min={0.5}
                    max={1}
                    step={0.05}
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values require clearer speech
                  </p>
                </div>

                <Button onClick={applySettings} className="w-full">
                  Apply Settings
                </Button>
              </CardContent>
            </Card>

            {/* Available Commands */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Available Commands</CardTitle>
                <CardDescription>
                  Say the wake word followed by any of these commands
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(groupedCommands).map(([category, cmds]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="text-sm font-semibold capitalize">{category}</h4>
                    <div className="space-y-2">
                      {cmds.map((cmd) => (
                        <div
                          key={cmd.command}
                          className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <code className="text-sm font-medium">{cmd.command}</code>
                                {cmd.aliases.length > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    or {cmd.aliases.slice(0, 2).join(', ')}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{cmd.description}</p>
                            </div>
                          </div>
                          {cmd.examples.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Examples:</p>
                              {cmd.examples.slice(0, 2).map((example, idx) => (
                                <code key={idx} className="block text-xs bg-muted px-2 py-1 rounded">
                                  "{status.wakeWord} {example}"
                                </code>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <Separator />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Commands */}
            {recentCommands.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recent Commands</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentCommands.map((result, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded border text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{result.recognized}</span>
                          <Badge
                            variant={result.executed ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {result.executed ? 'Executed' : 'Failed'}
                          </Badge>
                        </div>
                        {result.command && (
                          <div className="text-muted-foreground">
                            Action: {result.command.action}
                            {result.parameters && Object.keys(result.parameters).length > 0 && (
                              <span> • Params: {JSON.stringify(result.parameters)}</span>
                            )}
                          </div>
                        )}
                        {result.error && (
                          <div className="text-destructive">{result.error}</div>
                        )}
                        <div className="text-muted-foreground">
                          Confidence: {Math.round(result.confidence * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
