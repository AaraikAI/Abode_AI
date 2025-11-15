"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Package, QrCode, History, CheckCircle, XCircle, Clock, MapPin, Building2, FileText } from "lucide-react"

export interface MaterialRecord {
  id: string
  name: string
  materialType: string
  quantity: number
  unit: string
  supplier: string
  origin: string
  certifications: string[]
  blockchainHash: string
  timestamp: string
  status: "verified" | "pending" | "rejected"
  qrCode?: string
  provenanceChain: ProvenanceEntry[]
  metadata: {
    sustainability?: string
    recycledContent?: number
    carbonFootprint?: number
  }
}

export interface ProvenanceEntry {
  id: string
  action: string
  actor: string
  location: string
  timestamp: string
  blockNumber: number
  transactionHash: string
}

interface MaterialRegistryProps {
  materials?: MaterialRecord[]
  onRegisterMaterial?: (material: Partial<MaterialRecord>) => void
  onVerifyMaterial?: (id: string) => void
  onGenerateQR?: (id: string) => void
}

export function MaterialRegistry({
  materials = [],
  onRegisterMaterial,
  onVerifyMaterial,
  onGenerateQR,
}: MaterialRegistryProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialRecord | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    materialType: "",
    quantity: "",
    unit: "",
    supplier: "",
    origin: "",
  })

  const handleRegister = () => {
    if (onRegisterMaterial) {
      onRegisterMaterial({
        ...formData,
        quantity: parseFloat(formData.quantity),
      })
    }
    setFormData({
      name: "",
      materialType: "",
      quantity: "",
      unit: "",
      supplier: "",
      origin: "",
    })
    setIsRegistering(false)
  }

  const getStatusIcon = (status: MaterialRecord["status"]) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: MaterialRecord["status"]) => {
    switch (status) {
      case "verified":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20"
    }
  }

  const verifiedCount = materials.filter((m) => m.status === "verified").length
  const pendingCount = materials.filter((m) => m.status === "pending").length
  const totalMaterials = materials.length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 p-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Material Registry</h1>
          <p className="text-sm text-muted-foreground">Blockchain-based material tracking with provenance verification</p>
        </div>
        <Dialog open={isRegistering} onOpenChange={setIsRegistering}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Package className="h-4 w-4" />
              Register Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Material</DialogTitle>
              <DialogDescription>Add material to blockchain registry</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Material Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Recycled Steel Beams"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="materialType">Type</Label>
                  <Input
                    id="materialType"
                    value={formData.materialType}
                    onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                    placeholder="Steel, Concrete, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Supplier name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="tons, m³, etc."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="origin">Origin Location</Label>
                <Input
                  id="origin"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  placeholder="e.g., Pittsburgh, PA"
                />
              </div>
              <Button onClick={handleRegister} className="w-full">
                Register on Blockchain
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription>Total Materials</CardDescription>
            <CardTitle className="text-2xl text-foreground">{totalMaterials}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Registered on blockchain</CardContent>
        </Card>
        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription>Verified</CardDescription>
            <CardTitle className="text-2xl text-green-500">{verifiedCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Authenticity confirmed</CardContent>
        </Card>
        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl text-yellow-500">{pendingCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Awaiting verification</CardContent>
        </Card>
      </div>

      <Card className="border border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle className="text-base">Material Registry</CardTitle>
          <CardDescription>Blockchain-verified materials with provenance tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {materials.map((material) => (
                <Card
                  key={material.id}
                  className="cursor-pointer border border-border/40 bg-card/50 transition-colors hover:bg-accent/50"
                  onClick={() => setSelectedMaterial(material)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{material.name}</h3>
                          {getStatusIcon(material.status)}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {material.materialType}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {material.quantity} {material.unit}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {material.origin}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {material.certifications.map((cert, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getStatusColor(material.status)}>{material.status}</Badge>
                        {onGenerateQR && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              onGenerateQR(material.id)
                            }}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Hash: {material.blockchainHash.slice(0, 16)}...
                    </div>
                  </CardContent>
                </Card>
              ))}
              {materials.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No materials registered yet</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedMaterial && (
        <Dialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedMaterial.name}</DialogTitle>
              <DialogDescription>Complete material provenance and blockchain verification</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="provenance">Provenance</TabsTrigger>
                <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Type</Label>
                      <p className="font-medium">{selectedMaterial.materialType}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Supplier</Label>
                      <p className="font-medium">{selectedMaterial.supplier}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Quantity</Label>
                      <p className="font-medium">
                        {selectedMaterial.quantity} {selectedMaterial.unit}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Origin</Label>
                      <p className="font-medium">{selectedMaterial.origin}</p>
                    </div>
                  </div>
                  {selectedMaterial.metadata.sustainability && (
                    <div>
                      <Label className="text-muted-foreground">Sustainability Rating</Label>
                      <p className="font-medium">{selectedMaterial.metadata.sustainability}</p>
                    </div>
                  )}
                  {selectedMaterial.metadata.recycledContent !== undefined && (
                    <div>
                      <Label className="text-muted-foreground">Recycled Content</Label>
                      <p className="font-medium">{selectedMaterial.metadata.recycledContent}%</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="provenance" className="space-y-4">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {selectedMaterial.provenanceChain.map((entry, idx) => (
                      <Card key={entry.id} className="border border-border/40 bg-card/50">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="rounded-full bg-primary/10 p-2">
                              <History className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">{entry.action}</h4>
                              <p className="text-sm text-muted-foreground">
                                {entry.actor} • {entry.location}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Block #{entry.blockNumber} • {new Date(entry.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="blockchain" className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Blockchain Hash</Label>
                    <p className="font-mono text-sm">{selectedMaterial.blockchainHash}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Registration Time</Label>
                    <p className="font-medium">{new Date(selectedMaterial.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedMaterial.status)}>{selectedMaterial.status}</Badge>
                    </div>
                  </div>
                  {onVerifyMaterial && selectedMaterial.status === "pending" && (
                    <Button
                      onClick={() => {
                        onVerifyMaterial(selectedMaterial.id)
                        setSelectedMaterial(null)
                      }}
                      className="w-full"
                    >
                      Verify Material
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
