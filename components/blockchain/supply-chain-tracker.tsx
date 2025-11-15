"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Package,
  Truck,
  Building2,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  ArrowRight,
  Factory,
  Ship,
  Plane,
  AlertCircle,
} from "lucide-react"

export interface ShipmentStage {
  id: string
  name: string
  status: "completed" | "in-progress" | "pending" | "delayed"
  location: string
  timestamp?: string
  estimatedArrival?: string
  actualArrival?: string
  actor: string
  notes?: string
  blockchainHash?: string
  transportMethod?: "truck" | "ship" | "plane" | "rail"
}

export interface SupplyChainItem {
  id: string
  materialName: string
  materialType: string
  quantity: number
  unit: string
  supplier: string
  destination: string
  currentLocation: string
  progress: number
  status: "in-transit" | "delivered" | "delayed" | "pending"
  stages: ShipmentStage[]
  startDate: string
  estimatedDelivery: string
  actualDelivery?: string
  trackingNumber: string
  blockchainVerified: boolean
}

interface SupplyChainTrackerProps {
  shipments?: SupplyChainItem[]
  onRefresh?: () => void
  onTrackShipment?: (id: string) => void
}

export function SupplyChainTracker({ shipments = [], onRefresh, onTrackShipment }: SupplyChainTrackerProps) {
  const [selectedShipment, setSelectedShipment] = useState<SupplyChainItem | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const getStatusColor = (status: SupplyChainItem["status"]) => {
    switch (status) {
      case "delivered":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "in-transit":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "delayed":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    }
  }

  const getStageStatusIcon = (status: ShipmentStage["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "in-progress":
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
      case "delayed":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getTransportIcon = (method?: ShipmentStage["transportMethod"]) => {
    switch (method) {
      case "truck":
        return <Truck className="h-4 w-4" />
      case "ship":
        return <Ship className="h-4 w-4" />
      case "plane":
        return <Plane className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const filteredShipments =
    filterStatus === "all" ? shipments : shipments.filter((s) => s.status === filterStatus)

  const inTransitCount = shipments.filter((s) => s.status === "in-transit").length
  const deliveredCount = shipments.filter((s) => s.status === "delivered").length
  const delayedCount = shipments.filter((s) => s.status === "delayed").length
  const totalShipments = shipments.length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 p-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Supply Chain Tracker</h1>
          <p className="text-sm text-muted-foreground">Track materials from source to installation with blockchain verification</p>
        </div>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" className="gap-2">
            <Package className="h-4 w-4" />
            Refresh Tracking
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription>Total Shipments</CardDescription>
            <CardTitle className="text-2xl text-foreground">{totalShipments}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Active tracking</CardContent>
        </Card>
        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription>In Transit</CardDescription>
            <CardTitle className="text-2xl text-blue-500">{inTransitCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">En route</CardContent>
        </Card>
        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription>Delivered</CardDescription>
            <CardTitle className="text-2xl text-green-500">{deliveredCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Completed</CardContent>
        </Card>
        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription>Delayed</CardDescription>
            <CardTitle className="text-2xl text-red-500">{delayedCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Needs attention</CardContent>
        </Card>
      </div>

      <Card className="border border-border/60 bg-card/70">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Active Shipments</CardTitle>
              <CardDescription>Real-time tracking with blockchain verification</CardDescription>
            </div>
            <Tabs value={filterStatus} onValueChange={setFilterStatus}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="in-transit">In Transit</TabsTrigger>
                <TabsTrigger value="delivered">Delivered</TabsTrigger>
                <TabsTrigger value="delayed">Delayed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredShipments.map((shipment) => (
                <Card
                  key={shipment.id}
                  className="cursor-pointer border border-border/40 bg-card/50 transition-colors hover:bg-accent/50"
                  onClick={() => setSelectedShipment(shipment)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{shipment.materialName}</h3>
                            {shipment.blockchainVerified && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {shipment.quantity} {shipment.unit}
                            </span>
                            <span className="flex items-center gap-1">
                              <Factory className="h-3 w-3" />
                              {shipment.supplier}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {shipment.currentLocation}
                            </span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(shipment.status)}>{shipment.status}</Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{shipment.progress}%</span>
                        </div>
                        <Progress value={shipment.progress} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Est. Delivery: {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                        </span>
                        <span className="font-mono text-muted-foreground">#{shipment.trackingNumber}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredShipments.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No shipments found</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedShipment && (
        <Card className="border border-border/60 bg-card/70">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{selectedShipment.materialName}</CardTitle>
                <CardDescription>Tracking #{selectedShipment.trackingNumber}</CardDescription>
              </div>
              <Badge className={getStatusColor(selectedShipment.status)}>{selectedShipment.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label className="text-muted-foreground">Supplier</Label>
                <p className="font-medium">{selectedShipment.supplier}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Destination</Label>
                <p className="font-medium">{selectedShipment.destination}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Current Location</Label>
                <p className="font-medium">{selectedShipment.currentLocation}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="mb-4 font-semibold text-foreground">Shipment Timeline</h3>
              <div className="space-y-4">
                {selectedShipment.stages.map((stage, idx) => (
                  <div key={stage.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      {getStageStatusIcon(stage.status)}
                      {idx < selectedShipment.stages.length - 1 && (
                        <div className="my-1 h-12 w-px bg-border" />
                      )}
                    </div>
                    <Card className="flex-1 border border-border/40 bg-card/50">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground">{stage.name}</h4>
                              {stage.transportMethod && (
                                <span className="text-muted-foreground">{getTransportIcon(stage.transportMethod)}</span>
                              )}
                            </div>
                            <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                              <p className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {stage.location}
                              </p>
                              <p className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {stage.actor}
                              </p>
                              {stage.timestamp && (
                                <p className="text-xs">
                                  {stage.status === "completed" ? "Completed" : "Started"}:{" "}
                                  {new Date(stage.timestamp).toLocaleString()}
                                </p>
                              )}
                              {stage.estimatedArrival && stage.status !== "completed" && (
                                <p className="text-xs">
                                  Est. Arrival: {new Date(stage.estimatedArrival).toLocaleString()}
                                </p>
                              )}
                              {stage.notes && <p className="text-xs italic">{stage.notes}</p>}
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={
                              stage.status === "completed"
                                ? "bg-green-500/10 text-green-500"
                                : stage.status === "in-progress"
                                  ? "bg-blue-500/10 text-blue-500"
                                  : ""
                            }
                          >
                            {stage.status}
                          </Badge>
                        </div>
                        {stage.blockchainHash && (
                          <p className="mt-2 font-mono text-xs text-muted-foreground">
                            Hash: {stage.blockchainHash.slice(0, 16)}...
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {onTrackShipment && (
              <Button onClick={() => onTrackShipment(selectedShipment.id)} className="w-full">
                View Full Blockchain History
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium ${className || ""}`}>{children}</div>
}
