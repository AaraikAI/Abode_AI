'use client'

import { useState } from 'react'
import {
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh,
  Power,
  Settings,
  MoreVertical,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface IoTDevice {
  id: string
  name: string
  type: 'sensor' | 'actuator' | 'gateway' | 'controller' | 'camera' | 'thermostat'
  status: 'online' | 'offline' | 'error' | 'maintenance'
  batteryLevel?: number
  signalStrength: number
  lastSeen: string
  location: string
  ipAddress?: string
  firmware: string
  uptime: number
  dataRate?: number
  model: string
}

interface DeviceListProps {
  devices: IoTDevice[]
  onDeviceSelect?: (device: IoTDevice) => void
  onDeviceAction?: (deviceId: string, action: 'restart' | 'configure' | 'remove') => void
  onRefresh?: () => void
}

export function DeviceList({
  devices,
  onDeviceSelect,
  onDeviceAction,
  onRefresh
}: DeviceListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const getStatusColor = (status: IoTDevice['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'offline':
        return 'bg-gray-500'
      case 'error':
        return 'bg-red-500'
      case 'maintenance':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusVariant = (status: IoTDevice['status']) => {
    switch (status) {
      case 'online':
        return 'default'
      case 'offline':
        return 'secondary'
      case 'error':
        return 'destructive'
      case 'maintenance':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getBatteryIcon = (level?: number) => {
    if (!level) return null
    if (level < 20) return BatteryLow
    if (level < 60) return BatteryMedium
    return BatteryFull
  }

  const getSignalIcon = (strength: number) => {
    if (strength < 30) return SignalLow
    if (strength < 70) return SignalMedium
    return SignalHigh
  }

  const getBatteryColor = (level?: number) => {
    if (!level) return 'text-muted-foreground'
    if (level < 20) return 'text-red-500'
    if (level < 60) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getSignalColor = (strength: number) => {
    if (strength < 30) return 'text-red-500'
    if (strength < 70) return 'text-yellow-500'
    return 'text-green-500'
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         device.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter
    const matchesType = typeFilter === 'all' || device.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const stats = {
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length,
    error: devices.filter(d => d.status === 'error').length,
    lowBattery: devices.filter(d => d.batteryLevel && d.batteryLevel < 20).length,
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
            <p className="text-xs text-muted-foreground">
              {stats.online} online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.online}</div>
            <Progress value={(stats.online / devices.length) * 100} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{stats.offline}</div>
            <Progress value={(stats.offline / devices.length) * 100} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Battery</CardTitle>
            <BatteryLow className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.lowBattery}</div>
            <p className="text-xs text-muted-foreground">
              Needs attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connected Devices</CardTitle>
              <CardDescription>Manage your IoT devices and sensors</CardDescription>
            </div>
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:max-w-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sensor">Sensor</SelectItem>
                <SelectItem value="actuator">Actuator</SelectItem>
                <SelectItem value="gateway">Gateway</SelectItem>
                <SelectItem value="controller">Controller</SelectItem>
                <SelectItem value="camera">Camera</SelectItem>
                <SelectItem value="thermostat">Thermostat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Device List */}
          <div className="space-y-3">
            {filteredDevices.map(device => {
              const BatteryIcon = getBatteryIcon(device.batteryLevel)
              const SignalIcon = getSignalIcon(device.signalStrength)

              return (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => onDeviceSelect?.(device)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`h-3 w-3 rounded-full ${getStatusColor(device.status)}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{device.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {device.type}
                        </Badge>
                        <Badge variant={getStatusVariant(device.status)} className="text-xs">
                          {device.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{device.location}</span>
                        <span>•</span>
                        <span>{device.model}</span>
                        <span>•</span>
                        <span>Uptime: {formatUptime(device.uptime)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {BatteryIcon && (
                      <div className="flex items-center gap-1">
                        <BatteryIcon className={`h-4 w-4 ${getBatteryColor(device.batteryLevel)}`} />
                        <span className={`text-sm font-medium ${getBatteryColor(device.batteryLevel)}`}>
                          {device.batteryLevel}%
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <SignalIcon className={`h-4 w-4 ${getSignalColor(device.signalStrength)}`} />
                      <span className={`text-sm font-medium ${getSignalColor(device.signalStrength)}`}>
                        {device.signalStrength}%
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground min-w-[80px] text-right">
                      {formatLastSeen(device.lastSeen)}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          onDeviceAction?.(device.id, 'configure')
                        }}>
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          onDeviceAction?.(device.id, 'restart')
                        }}>
                          <Power className="h-4 w-4 mr-2" />
                          Restart
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeviceAction?.(device.id, 'remove')
                          }}
                        >
                          <WifiOff className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}

            {filteredDevices.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <WifiOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No devices found matching your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
