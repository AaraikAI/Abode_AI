"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Image as ImageIcon,
  Building2,
  User,
  Hash,
  Calendar,
  ArrowUpRight,
  Send,
  Download,
  Eye,
  Heart,
  Share2,
  CheckCircle,
  Layers,
} from "lucide-react"

export interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: { trait_type: string; value: string | number }[]
  externalUrl?: string
  animationUrl?: string
  backgroundColor?: string
}

export interface NFT {
  id: string
  tokenId: string
  contractAddress: string
  name: string
  description: string
  imageUrl: string
  owner: {
    address: string
    name?: string
    avatar?: string
  }
  creator: {
    address: string
    name?: string
    avatar?: string
  }
  metadata: NFTMetadata
  mintedAt: string
  lastSale?: {
    price: number
    currency: string
    date: string
  }
  chain: string
  verified: boolean
  favorites: number
  views: number
  category: "building" | "design" | "component" | "rendering" | "other"
}

export interface TransferHistory {
  id: string
  from: string
  to: string
  timestamp: string
  transactionHash: string
  price?: number
  currency?: string
}

interface NFTGalleryProps {
  nfts?: NFT[]
  onTransfer?: (tokenId: string, to: string) => void
  onDownload?: (tokenId: string) => void
  onViewTransaction?: (hash: string) => void
  transferHistory?: Record<string, TransferHistory[]>
}

export function NFTGallery({ nfts = [], onTransfer, onDownload, onViewTransaction, transferHistory = {} }: NFTGalleryProps) {
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [isTransferring, setIsTransferring] = useState(false)
  const [transferAddress, setTransferAddress] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const handleTransfer = () => {
    if (selectedNFT && transferAddress && onTransfer) {
      onTransfer(selectedNFT.tokenId, transferAddress)
      setTransferAddress("")
      setIsTransferring(false)
    }
  }

  const getCategoryColor = (category: NFT["category"]) => {
    switch (category) {
      case "building":
        return "bg-blue-500/10 text-blue-500"
      case "design":
        return "bg-purple-500/10 text-purple-500"
      case "component":
        return "bg-orange-500/10 text-orange-500"
      case "rendering":
        return "bg-green-500/10 text-green-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const filteredNFTs = filterCategory === "all" ? nfts : nfts.filter((nft) => nft.category === filterCategory)

  const totalNFTs = nfts.length
  const totalValue =
    nfts.reduce((sum, nft) => sum + (nft.lastSale?.price || 0), 0)
  const verifiedCount = nfts.filter((nft) => nft.verified).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 p-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">NFT Gallery</h1>
          <p className="text-sm text-muted-foreground">Building and design NFTs with blockchain ownership</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={filterCategory} onValueChange={setFilterCategory}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="building">Buildings</TabsTrigger>
              <TabsTrigger value="design">Designs</TabsTrigger>
              <TabsTrigger value="rendering">Renders</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription>Total NFTs</CardDescription>
            <CardTitle className="text-2xl text-foreground">{totalNFTs}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">In collection</CardContent>
        </Card>
        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription>Verified</CardDescription>
            <CardTitle className="text-2xl text-green-500">{verifiedCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Authenticated</CardContent>
        </Card>
        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription>Total Value</CardDescription>
            <CardTitle className="text-2xl text-foreground">{totalValue.toFixed(2)} ETH</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Last sale prices</CardContent>
        </Card>
        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription>Total Views</CardDescription>
            <CardTitle className="text-2xl text-foreground">
              {nfts.reduce((sum, nft) => sum + nft.views, 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Across all NFTs</CardContent>
        </Card>
      </div>

      <Card className="border border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle className="text-base">NFT Collection</CardTitle>
          <CardDescription>Your blockchain-verified digital assets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
            {filteredNFTs.map((nft) => (
              <Card
                key={nft.id}
                className="group cursor-pointer overflow-hidden border border-border/40 bg-card/50 transition-all hover:border-primary/50 hover:shadow-lg"
                onClick={() => setSelectedNFT(nft)}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={nft.imageUrl || "/placeholder.png"}
                    alt={nft.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  {nft.verified && (
                    <Badge className="absolute right-2 top-2 bg-green-500/90 text-white">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                  <Badge className={`absolute left-2 top-2 ${getCategoryColor(nft.category)}`}>
                    {nft.category}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground">{nft.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{nft.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={nft.owner.avatar} />
                        <AvatarFallback>{nft.owner.name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {nft.owner.name || `${nft.owner.address.slice(0, 6)}...`}
                      </span>
                    </div>
                    {nft.lastSale && (
                      <span className="font-semibold text-foreground">
                        {nft.lastSale.price} {nft.lastSale.currency}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {nft.favorites}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {nft.views}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredNFTs.length === 0 && (
              <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
                No NFTs found in this category
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedNFT && (
        <Dialog open={!!selectedNFT} onOpenChange={() => setSelectedNFT(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedNFT.name}</DialogTitle>
              <DialogDescription>Token ID: #{selectedNFT.tokenId}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                  <img
                    src={selectedNFT.imageUrl || "/placeholder.png"}
                    alt={selectedNFT.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  {onDownload && (
                    <Button onClick={() => onDownload(selectedNFT.tokenId)} variant="outline" className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="attributes">Attributes</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Description</Label>
                      <p className="text-sm">{selectedNFT.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Owner</Label>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={selectedNFT.owner.avatar} />
                            <AvatarFallback>{selectedNFT.owner.name?.[0] || "U"}</AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium">
                            {selectedNFT.owner.name || `${selectedNFT.owner.address.slice(0, 10)}...`}
                          </p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Creator</Label>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={selectedNFT.creator.avatar} />
                            <AvatarFallback>{selectedNFT.creator.name?.[0] || "C"}</AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium">
                            {selectedNFT.creator.name || `${selectedNFT.creator.address.slice(0, 10)}...`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Contract Address</Label>
                      <p className="font-mono text-xs">{selectedNFT.contractAddress}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Chain</Label>
                        <p className="text-sm font-medium">{selectedNFT.chain}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Minted</Label>
                        <p className="text-sm">{new Date(selectedNFT.mintedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {selectedNFT.lastSale && (
                      <div>
                        <Label className="text-muted-foreground">Last Sale</Label>
                        <p className="text-sm font-medium">
                          {selectedNFT.lastSale.price} {selectedNFT.lastSale.currency} on{" "}
                          {new Date(selectedNFT.lastSale.date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="attributes" className="space-y-2">
                    <ScrollArea className="h-[300px]">
                      <div className="grid grid-cols-2 gap-2">
                        {selectedNFT.metadata.attributes.map((attr, idx) => (
                          <Card key={idx} className="border border-border/40 bg-card/50">
                            <CardContent className="p-3">
                              <p className="text-xs text-muted-foreground">{attr.trait_type}</p>
                              <p className="font-semibold text-foreground">{attr.value}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="history" className="space-y-2">
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {transferHistory[selectedNFT.tokenId]?.map((transfer) => (
                          <Card key={transfer.id} className="border border-border/40 bg-card/50">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-1">
                                  <p className="text-xs font-semibold text-foreground">Transfer</p>
                                  <p className="text-xs text-muted-foreground">
                                    From: {transfer.from.slice(0, 10)}...
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    To: {transfer.to.slice(0, 10)}...
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(transfer.timestamp).toLocaleString()}
                                  </p>
                                  {transfer.price && (
                                    <p className="text-xs font-semibold text-green-500">
                                      {transfer.price} {transfer.currency}
                                    </p>
                                  )}
                                </div>
                                {onViewTransaction && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onViewTransaction(transfer.transactionHash)}
                                  >
                                    <ArrowUpRight className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {(!transferHistory[selectedNFT.tokenId] ||
                          transferHistory[selectedNFT.tokenId].length === 0) && (
                          <p className="py-8 text-center text-sm text-muted-foreground">No transfer history</p>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
                {onTransfer && (
                  <Dialog open={isTransferring} onOpenChange={setIsTransferring}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Send className="mr-2 h-4 w-4" />
                        Transfer NFT
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Transfer NFT</DialogTitle>
                        <DialogDescription>Send {selectedNFT.name} to another address</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="address">Recipient Address</Label>
                          <Input
                            id="address"
                            value={transferAddress}
                            onChange={(e) => setTransferAddress(e.target.value)}
                            placeholder="0x..."
                          />
                        </div>
                        <Button onClick={handleTransfer} className="w-full" disabled={!transferAddress}>
                          Confirm Transfer
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
