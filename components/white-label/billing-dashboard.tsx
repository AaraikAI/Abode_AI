'use client'

import { useState } from 'react'
import {
  CreditCard,
  Download,
  TrendingUp,
  DollarSign,
  Calendar,
  FileText,
  ExternalLink,
  ChevronRight,
  Activity,
  Database,
  Users,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

export interface BillingPlan {
  id: string
  name: string
  tier: 'free' | 'starter' | 'pro' | 'enterprise'
  price: number
  interval: 'monthly' | 'yearly'
  features: string[]
}

export interface UsageMetric {
  name: string
  current: number
  limit: number
  unit: string
  icon?: React.ReactNode
}

export interface Invoice {
  id: string
  number: string
  date: string
  dueDate: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  pdfUrl?: string
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'bank_account'
  last4: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
}

export interface BillingDashboardProps {
  tenantId: string
  currentPlan: BillingPlan
  availablePlans: BillingPlan[]
  usageMetrics: UsageMetric[]
  invoices: Invoice[]
  paymentMethod?: PaymentMethod
  nextBillingDate?: string
  onChangePlan?: (planId: string) => Promise<void>
  onDownloadInvoice?: (invoiceId: string) => void
  onUpdatePaymentMethod?: () => void
  onCancelSubscription?: () => void
}

export default function BillingDashboard({
  tenantId,
  currentPlan,
  availablePlans,
  usageMetrics,
  invoices,
  paymentMethod,
  nextBillingDate,
  onChangePlan,
  onDownloadInvoice,
  onUpdatePaymentMethod,
  onCancelSubscription,
}: BillingDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const getInvoiceStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default">Paid</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>
    }
  }

  const calculateUsagePercentage = (metric: UsageMetric) => {
    return (metric.current / metric.limit) * 100
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const filteredPlans = availablePlans.filter(plan => plan.interval === selectedPeriod)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Billing Dashboard
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage billing, plans, usage metrics, and invoices
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {currentPlan.name}
        </Badge>
      </div>

      {/* Current Plan & Payment Method */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Current Plan
            </CardTitle>
            <CardDescription>Your subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">${currentPlan.price}</span>
              <span className="text-muted-foreground">/{currentPlan.interval}</span>
            </div>

            <Separator />

            <div className="space-y-2">
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {nextBillingDate && (
              <>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Next billing date</span>
                  <span className="font-medium">
                    {new Date(nextBillingDate).toLocaleDateString()}
                  </span>
                </div>
              </>
            )}

            <Button variant="outline" className="w-full" asChild>
              <a href="#plans">
                <TrendingUp className="h-4 w-4 mr-2" />
                Upgrade Plan
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </CardTitle>
            <CardDescription>Manage your payment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethod ? (
              <>
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">
                      {paymentMethod.type === 'card' ? (
                        <>
                          {paymentMethod.brand} •••• {paymentMethod.last4}
                        </>
                      ) : (
                        <>Bank Account •••• {paymentMethod.last4}</>
                      )}
                    </div>
                    {paymentMethod.expiryMonth && paymentMethod.expiryYear && (
                      <div className="text-sm text-muted-foreground">
                        Expires {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}
                      </div>
                    )}
                  </div>
                  {paymentMethod.isDefault && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onUpdatePaymentMethod}
                >
                  Update Payment Method
                </Button>
              </>
            ) : (
              <>
                <div className="text-center py-8 text-muted-foreground">
                  No payment method on file
                </div>
                <Button className="w-full" onClick={onUpdatePaymentMethod}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </>
            )}

            {onCancelSubscription && (
              <>
                <Separator />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive"
                  onClick={onCancelSubscription}
                >
                  Cancel Subscription
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Usage Metrics
          </CardTitle>
          <CardDescription>Current usage against your plan limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {usageMetrics.map((metric, index) => {
              const percentage = calculateUsagePercentage(metric)
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {metric.icon}
                      <span className="font-medium">{metric.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {metric.current.toLocaleString()} / {metric.limit.toLocaleString()} {metric.unit}
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={percentage} className="h-2" />
                    <div
                      className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getUsageColor(
                        percentage
                      )}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  {percentage >= 90 && (
                    <p className="text-xs text-destructive">
                      Warning: You're approaching your limit
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div id="plans">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Available Plans</h3>
          <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as 'monthly' | 'yearly')}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {filteredPlans.map((plan) => {
            const isCurrent = plan.id === currentPlan.id
            return (
              <Card key={plan.id} className={isCurrent ? 'border-primary' : ''}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/{plan.interval}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant={isCurrent ? 'outline' : 'default'}
                    className="w-full"
                    disabled={isCurrent}
                    onClick={() => onChangePlan?.(plan.id)}
                  >
                    {isCurrent ? 'Current Plan' : 'Switch to Plan'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Billing History
              </CardTitle>
              <CardDescription>View and download past invoices</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invoices available
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>
                      {new Date(invoice.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownloadInvoice?.(invoice.id)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        {invoice.pdfUrl && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
