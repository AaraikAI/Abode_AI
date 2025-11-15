'use client'

/**
 * Partner Catalog Browser
 *
 * Browse and integrate with partner services, APIs, and integrations
 * for extending platform capabilities
 */

import { useState } from 'react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import {
  Search,
  Filter,
  Star,
  Download,
  ExternalLink,
  Package,
  Zap,
  TrendingUp,
  CheckCircle2,
  Plus,
  Settings,
  Code,
  Database,
  Cloud,
  Shield
} from 'lucide-react'

export interface Partner {
  id: string
  name: string
  description: string
  logo?: string
  category: 'api' | 'integration' | 'plugin' | 'service'
  pricing: 'free' | 'freemium' | 'paid'
  rating: number
  installs: number
  verified: boolean
  trending: boolean
  tags: string[]
  features: string[]
  documentation: string
  supportUrl: string
  apiEndpoint?: string
}

interface CatalogBrowserProps {
  partners?: Partner[]
  onInstall?: (partnerId: string) => void
  onViewDetails?: (partner: Partner) => void
}

const mockPartners: Partner[] = [
  {
    id: 'p1',
    name: 'Weather API Pro',
    description: 'Real-time weather data and forecasting for construction planning',
    category: 'api',
    pricing: 'freemium',
    rating: 4.8,
    installs: 12500,
    verified: true,
    trending: true,
    tags: ['weather', 'forecasting', 'climate'],
    features: [
      'Real-time weather updates',
      '7-day forecasts',
      'Historical data access',
      'Weather alerts'
    ],
    documentation: 'https://weatherapi.example.com/docs',
    supportUrl: 'https://weatherapi.example.com/support',
    apiEndpoint: 'https://api.weatherapi.example.com/v1'
  },
  {
    id: 'p2',
    name: 'BIM Validator',
    description: 'Automated BIM model validation and quality checking',
    category: 'plugin',
    pricing: 'paid',
    rating: 4.9,
    installs: 8900,
    verified: true,
    trending: false,
    tags: ['bim', 'validation', 'quality'],
    features: [
      'IFC validation',
      'Clash detection',
      'Quality reports',
      'Standards compliance'
    ],
    documentation: 'https://bimvalidator.example.com/docs',
    supportUrl: 'https://bimvalidator.example.com/support'
  },
  {
    id: 'p3',
    name: 'Material Database',
    description: 'Comprehensive building materials database with pricing',
    category: 'service',
    pricing: 'freemium',
    rating: 4.6,
    installs: 15200,
    verified: true,
    trending: true,
    tags: ['materials', 'pricing', 'database'],
    features: [
      '50,000+ materials',
      'Real-time pricing',
      'Supplier integration',
      'Environmental data'
    ],
    documentation: 'https://materialdb.example.com/docs',
    supportUrl: 'https://materialdb.example.com/support'
  }
]

export function CatalogBrowser({
  partners = mockPartners,
  onInstall,
  onViewDetails
}: CatalogBrowserProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPricing, setSelectedPricing] = useState<string>('all')
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest'>('popular')

  const filteredPartners = partners.filter(partner => {
    if (selectedCategory !== 'all' && partner.category !== selectedCategory) return false
    if (selectedPricing !== 'all' && partner.pricing !== selectedPricing) return false
    if (searchQuery && !partner.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  const sortedPartners = [...filteredPartners].sort((a, b) => {
    if (sortBy === 'popular') return b.installs - a.installs
    if (sortBy === 'rating') return b.rating - a.rating
    return 0
  })

  const getCategoryIcon = (category: Partner['category']) => {
    switch (category) {
      case 'api':
        return <Code className="h-4 w-4" />
      case 'integration':
        return <Zap className="h-4 w-4" />
      case 'plugin':
        return <Package className="h-4 w-4" />
      case 'service':
        return <Cloud className="h-4 w-4" />
    }
  }

  const handleInstall = (partner: Partner) => {
    onInstall?.(partner.id)
    toast({
      title: 'Installation Started',
      description: `Installing ${partner.name}...`
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partners.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partners.filter(p => p.verified).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trending</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partners.filter(p => p.trending).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Installs</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partners.reduce((sum, p) => sum + p.installs, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Partner Catalog</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search partners..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="api">APIs</SelectItem>
                  <SelectItem value="integration">Integrations</SelectItem>
                  <SelectItem value="plugin">Plugins</SelectItem>
                  <SelectItem value="service">Services</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedPricing} onValueChange={setSelectedPricing}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Pricing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pricing</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="freemium">Freemium</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Partner List */}
        <div className="lg:col-span-2 space-y-3">
          {sortedPartners.map(partner => (
            <Card
              key={partner.id}
              className="cursor-pointer hover:shadow-md transition"
              onClick={() => setSelectedPartner(partner)}
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{partner.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base">{partner.name}</CardTitle>
                      {partner.verified && (
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      )}
                      {partner.trending && (
                        <Badge variant="secondary">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{partner.description}</CardDescription>
                  </div>
                  {getCategoryIcon(partner.category)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{partner.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {partner.installs.toLocaleString()}
                      </span>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {partner.pricing}
                    </Badge>
                  </div>
                  <Button size="sm" onClick={() => handleInstall(partner)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Install
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {partner.tags.slice(0, 5).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Partner Details */}
        <Card className="h-fit sticky top-4">
          {selectedPartner ? (
            <>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback>{selectedPartner.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle>{selectedPartner.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{selectedPartner.rating}</span>
                      </div>
                      {selectedPartner.verified && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{selectedPartner.description}</p>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Features</h4>
                  <ul className="space-y-1">
                    {selectedPartner.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Category</span>
                    <Badge variant="outline" className="capitalize">
                      {selectedPartner.category}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pricing</span>
                    <Badge variant="outline" className="capitalize">
                      {selectedPartner.pricing}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Installs</span>
                    <span className="font-medium">
                      {selectedPartner.installs.toLocaleString()}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={selectedPartner.documentation} target="_blank" rel="noopener">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Documentation
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={selectedPartner.supportUrl} target="_blank" rel="noopener">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Support
                    </a>
                  </Button>
                </div>

                <Button
                  onClick={() => handleInstall(selectedPartner)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Install Partner
                </Button>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Partner Selected</h3>
              <p className="text-muted-foreground">Select a partner to view details</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
