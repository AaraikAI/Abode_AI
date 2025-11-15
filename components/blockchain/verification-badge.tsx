"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  FileCheck,
  Building2,
  AlertCircle,
  Calendar,
  User,
  Hash,
  ExternalLink,
  Download,
  QrCode,
  Sparkles,
} from "lucide-react"

export interface VerificationBadge {
  id: string
  type: "certification" | "authenticity" | "compliance" | "quality" | "sustainability" | "safety"
  name: string
  description: string
  issuer: string
  issuedTo: string
  issuedAt: string
  expiresAt?: string
  status: "active" | "expired" | "revoked" | "pending"
  blockchainHash: string
  credentialId: string
  metadata: {
    standard?: string
    score?: number
    criteria?: Record<string, boolean>
    documents?: string[]
    verificationLevel?: "basic" | "standard" | "premium" | "enterprise"
  }
  claims: VerificationClaim[]
  chain: string
  verified: boolean
}

export interface VerificationClaim {
  id: string
  type: string
  value: string | number | boolean
  verifiedBy: string
  verifiedAt: string
  blockchainProof: string
}

interface VerificationBadgeProps {
  badges?: VerificationBadge[]
  onVerifyBadge?: (badgeId: string) => void
  onDownloadCertificate?: (badgeId: string) => void
  onViewBlockchain?: (hash: string) => void
  onRequestBadge?: (type: string) => void
}

export function VerificationBadgeComponent({
  badges = [],
  onVerifyBadge,
  onDownloadCertificate,
  onViewBlockchain,
  onRequestBadge,
}: VerificationBadgeProps) {
  const [selectedBadge, setSelectedBadge] = useState<VerificationBadge | null>(null)
  const [filterType, setFilterType] = useState<string>("all")

  const getStatusColor = (status: VerificationBadge["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "expired":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "revoked":
        return "bg-red-500/10 text-red-500 border-red-500/20"
    }
  }

  const getTypeIcon = (type: VerificationBadge["type"]) => {
    switch (type) {
      case "certification":
        return <Award className="h-4 w-4" />
      case "authenticity":
        return <Shield className="h-4 w-4" />
      case "compliance":
        return <FileCheck className="h-4 w-4" />
      case "quality":
        return <Sparkles className="h-4 w-4" />
      case "sustainability":
        return <Building2 className="h-4 w-4" />
      case "safety":
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: VerificationBadge["type"]) => {
    switch (type) {
      case "certification":
        return "bg-purple-500/10 text-purple-500"
      case "authenticity":
        return "bg-blue-500/10 text-blue-500"
      case "compliance":
        return "bg-green-500/10 text-green-500"
      case "quality":
        return "bg-yellow-500/10 text-yellow-500"
      case "sustainability":
        return "bg-emerald-500/10 text-emerald-500"
      case "safety":
        return "bg-red-500/10 text-red-500"
    }
  }

  const getStatusIcon = (status: VerificationBadge["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "expired":
        return <Clock className="h-5 w-5 text-orange-500" />
      case "revoked":
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getVerificationLevel = (level?: string) => {
    switch (level) {
      case "enterprise":
        return { color: "bg-purple-500/10 text-purple-500", label: "Enterprise" }
      case "premium":
        return { color: "bg-blue-500/10 text-blue-500", label: "Premium" }
      case "standard":
        return { color: "bg-green-500/10 text-green-500", label: "Standard" }
      case "basic":
        return { color: "bg-gray-500/10 text-gray-500", label: "Basic" }
      default:
        return { color: "bg-gray-500/10 text-gray-500", label: "Unknown" }
    }
  }

  const filteredBadges = filterType === "all" ? badges : badges.filter((b) => b.type === filterType)

  const activeBadges = badges.filter((b) => b.status === "active").length
  const pendingBadges = badges.filter((b) => b.status === "pending").length
  const verifiedBadges = badges.filter((b) => b.verified).length
  const totalBadges = badges.length

  const isExpiringSoon = (badge: VerificationBadge) => {
    if (!badge.expiresAt) return false
    const daysUntilExpiry = Math.floor(
      (new Date(badge.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 p-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Verification Badges</h1>
          <p className="text-sm text-muted-foreground">Blockchain-verified certifications and authenticity badges</p>
        </div>
        {onRequestBadge && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Award className="h-4 w-4" />
                Request Badge
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Verification Badge</DialogTitle>
                <DialogDescription>Choose the type of verification badge you need</DialogDescription>
              </DialogHeader>
              <div className="grid gap-2">
                {(["certification", "authenticity", "compliance", "quality", "sustainability", "safety"] as const).map(
                  (type) => (
                    <Button
                      key={type}
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={() => onRequestBadge(type)}
                    >
                      {getTypeIcon(type)}
                      <span className="capitalize">{type}</span>
                    </Button>
                  )
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription>Total Badges</CardDescription>
            <CardTitle className="text-2xl text-foreground">{totalBadges}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Issued</CardContent>
        </Card>
        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl text-green-500">{activeBadges}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Valid badges</CardContent>
        </Card>
        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription>Verified</CardDescription>
            <CardTitle className="text-2xl text-blue-500">{verifiedBadges}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Blockchain confirmed</CardContent>
        </Card>
        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl text-yellow-500">{pendingBadges}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">In review</CardContent>
        </Card>
      </div>

      <Card className="border border-border/60 bg-card/70">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Your Badges</CardTitle>
              <CardDescription>Blockchain-verified credentials and certifications</CardDescription>
            </div>
            <Tabs value={filterType} onValueChange={setFilterType}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="certification">Certs</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="quality">Quality</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBadges.map((badge) => (
                <Card
                  key={badge.id}
                  className="group cursor-pointer overflow-hidden border border-border/40 bg-card/50 transition-all hover:border-primary/50 hover:shadow-md"
                  onClick={() => setSelectedBadge(badge)}
                >
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className={`rounded-full p-2 ${getTypeColor(badge.type)}`}>
                        {getTypeIcon(badge.type)}
                      </div>
                      {getStatusIcon(badge.status)}
                    </div>
                    <h3 className="font-semibold text-foreground">{badge.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{badge.description}</p>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="secondary" className={getTypeColor(badge.type)}>
                          {badge.type}
                        </Badge>
                        <Badge className={getStatusColor(badge.status)}>{badge.status}</Badge>
                      </div>
                      {badge.metadata.verificationLevel && (
                        <Badge
                          variant="secondary"
                          className={getVerificationLevel(badge.metadata.verificationLevel).color}
                        >
                          {getVerificationLevel(badge.metadata.verificationLevel).label}
                        </Badge>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Issuer: {badge.issuer}</span>
                      </div>
                      {isExpiringSoon(badge) && (
                        <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Expiring Soon
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredBadges.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
                  No badges found
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedBadge && (
        <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedBadge.name}
                    {selectedBadge.verified && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription>Credential ID: {selectedBadge.credentialId}</DialogDescription>
                </div>
                <Badge className={getStatusColor(selectedBadge.status)}>{selectedBadge.status}</Badge>
              </div>
            </DialogHeader>
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="claims">Claims</TabsTrigger>
                <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="text-sm">{selectedBadge.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Issuer</Label>
                    <p className="font-medium">{selectedBadge.issuer}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Issued To</Label>
                    <p className="font-medium">{selectedBadge.issuedTo}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Issued Date</Label>
                    <p className="text-sm">{new Date(selectedBadge.issuedAt).toLocaleDateString()}</p>
                  </div>
                  {selectedBadge.expiresAt && (
                    <div>
                      <Label className="text-muted-foreground">Expires</Label>
                      <p className="text-sm">{new Date(selectedBadge.expiresAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                {selectedBadge.metadata.standard && (
                  <div>
                    <Label className="text-muted-foreground">Standard</Label>
                    <p className="font-medium">{selectedBadge.metadata.standard}</p>
                  </div>
                )}
                {selectedBadge.metadata.score !== undefined && (
                  <div>
                    <Label className="text-muted-foreground">Score</Label>
                    <div className="mt-2 space-y-2">
                      <Progress value={selectedBadge.metadata.score} className="h-2" />
                      <p className="text-sm font-semibold">{selectedBadge.metadata.score}%</p>
                    </div>
                  </div>
                )}
                {selectedBadge.metadata.criteria && (
                  <div>
                    <Label className="text-muted-foreground">Criteria Met</Label>
                    <div className="mt-2 space-y-1">
                      {Object.entries(selectedBadge.metadata.criteria).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          {value ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span>{key}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  {onDownloadCertificate && (
                    <Button onClick={() => onDownloadCertificate(selectedBadge.id)} variant="outline" className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Download Certificate
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1">
                    <QrCode className="mr-2 h-4 w-4" />
                    QR Code
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="claims" className="space-y-3">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {selectedBadge.claims.map((claim) => (
                      <Card key={claim.id} className="border border-border/40 bg-card/50">
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-foreground">{claim.type}</h4>
                                <p className="text-sm text-muted-foreground">Value: {String(claim.value)}</p>
                              </div>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <p>Verified by: {claim.verifiedBy}</p>
                              <p>Date: {new Date(claim.verifiedAt).toLocaleString()}</p>
                            </div>
                            <p className="font-mono text-xs text-muted-foreground">
                              Proof: {claim.blockchainProof.slice(0, 16)}...
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {selectedBadge.claims.length === 0 && (
                      <p className="py-8 text-center text-sm text-muted-foreground">No claims recorded</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="blockchain" className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Blockchain Hash</Label>
                  <p className="font-mono text-sm">{selectedBadge.blockchainHash}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Network</Label>
                  <p className="font-medium">{selectedBadge.chain}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Verification Status</Label>
                  <div className="mt-2 flex items-center gap-2">
                    {selectedBadge.verified ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium text-green-500">Verified on Blockchain</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-5 w-5 text-yellow-500" />
                        <span className="font-medium text-yellow-500">Pending Verification</span>
                      </>
                    )}
                  </div>
                </div>
                {onViewBlockchain && (
                  <Button onClick={() => onViewBlockchain(selectedBadge.blockchainHash)} className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on Blockchain Explorer
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium ${className || ""}`}>{children}</div>
}
