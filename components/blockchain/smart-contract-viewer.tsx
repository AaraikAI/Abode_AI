"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  FileCode,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Hash,
  User,
  Calendar,
  AlertCircle,
  Play,
  Eye,
} from "lucide-react"

export interface SmartContract {
  id: string
  name: string
  address: string
  type: "escrow" | "materials" | "payments" | "certification" | "custom"
  status: "active" | "paused" | "completed" | "terminated"
  deployedAt: string
  owner: string
  network: string
  balance?: number
  functions: ContractFunction[]
  events: ContractEvent[]
  transactions: ContractTransaction[]
  metadata: {
    version?: string
    compiler?: string
    verified?: boolean
  }
}

export interface ContractFunction {
  name: string
  type: "read" | "write" | "payable"
  inputs: { name: string; type: string }[]
  outputs?: { name: string; type: string }[]
  description?: string
}

export interface ContractEvent {
  id: string
  name: string
  timestamp: string
  blockNumber: number
  transactionHash: string
  parameters: Record<string, any>
}

export interface ContractTransaction {
  id: string
  hash: string
  from: string
  to: string
  value?: number
  timestamp: string
  blockNumber: number
  status: "success" | "failed" | "pending"
  gasUsed?: number
  functionCalled?: string
}

interface SmartContractViewerProps {
  contracts?: SmartContract[]
  onExecuteFunction?: (contractId: string, functionName: string, params: Record<string, any>) => void
  onViewTransaction?: (txHash: string) => void
  onRefresh?: () => void
}

export function SmartContractViewer({
  contracts = [],
  onExecuteFunction,
  onViewTransaction,
  onRefresh,
}: SmartContractViewerProps) {
  const [selectedContract, setSelectedContract] = useState<SmartContract | null>(null)
  const [selectedFunction, setSelectedFunction] = useState<ContractFunction | null>(null)
  const [functionParams, setFunctionParams] = useState<Record<string, string>>({})

  const getStatusColor = (status: SmartContract["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "paused":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "completed":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "terminated":
        return "bg-red-500/10 text-red-500 border-red-500/20"
    }
  }

  const getTypeColor = (type: SmartContract["type"]) => {
    switch (type) {
      case "escrow":
        return "bg-purple-500/10 text-purple-500"
      case "materials":
        return "bg-orange-500/10 text-orange-500"
      case "payments":
        return "bg-green-500/10 text-green-500"
      case "certification":
        return "bg-blue-500/10 text-blue-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const getTxStatusIcon = (status: ContractTransaction["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const handleExecuteFunction = () => {
    if (selectedContract && selectedFunction && onExecuteFunction) {
      onExecuteFunction(selectedContract.id, selectedFunction.name, functionParams)
      setSelectedFunction(null)
      setFunctionParams({})
    }
  }

  const activeContracts = contracts.filter((c) => c.status === "active").length
  const totalTransactions = contracts.reduce((sum, c) => sum + c.transactions.length, 0)
  const totalEvents = contracts.reduce((sum, c) => sum + c.events.length, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 p-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Smart Contract Viewer</h1>
          <p className="text-sm text-muted-foreground">View and interact with blockchain smart contracts</p>
        </div>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" className="gap-2">
            <Activity className="h-4 w-4" />
            Refresh
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription>Total Contracts</CardDescription>
            <CardTitle className="text-2xl text-foreground">{contracts.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Deployed</CardContent>
        </Card>
        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl text-green-500">{activeContracts}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Running</CardContent>
        </Card>
        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription>Transactions</CardDescription>
            <CardTitle className="text-2xl text-foreground">{totalTransactions}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Total executed</CardContent>
        </Card>
        <Card className="border border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardDescription>Events</CardDescription>
            <CardTitle className="text-2xl text-foreground">{totalEvents}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Emitted</CardContent>
        </Card>
      </div>

      <Card className="border border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle className="text-base">Smart Contracts</CardTitle>
          <CardDescription>Deployed contracts on blockchain network</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {contracts.map((contract) => (
                <Card
                  key={contract.id}
                  className="cursor-pointer border border-border/40 bg-card/50 transition-colors hover:bg-accent/50"
                  onClick={() => setSelectedContract(contract)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{contract.name}</h3>
                          <Badge variant="secondary" className={getTypeColor(contract.type)}>
                            {contract.type}
                          </Badge>
                          {contract.metadata.verified && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                          <p className="flex items-center gap-1 font-mono text-xs">
                            <Hash className="h-3 w-3" />
                            {contract.address}
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {contract.owner.slice(0, 8)}...
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(contract.deployedAt).toLocaleDateString()}
                            </span>
                            <span>Network: {contract.network}</span>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                          <span>{contract.functions.length} functions</span>
                          <span>•</span>
                          <span>{contract.events.length} events</span>
                          <span>•</span>
                          <span>{contract.transactions.length} txs</span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(contract.status)}>{contract.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {contracts.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No contracts deployed</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedContract && (
        <Card className="border border-border/60 bg-card/70">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{selectedContract.name}</CardTitle>
                <CardDescription className="font-mono text-xs">{selectedContract.address}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge className={getStatusColor(selectedContract.status)}>{selectedContract.status}</Badge>
                <Badge variant="secondary" className={getTypeColor(selectedContract.type)}>
                  {selectedContract.type}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="functions">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="functions">Functions</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>
              <TabsContent value="functions" className="space-y-3">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {selectedContract.functions.map((func, idx) => (
                      <Card key={idx} className="border border-border/40 bg-card/50">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-mono font-semibold text-foreground">{func.name}()</h4>
                                <Badge
                                  variant="secondary"
                                  className={
                                    func.type === "write"
                                      ? "bg-orange-500/10 text-orange-500"
                                      : func.type === "payable"
                                        ? "bg-green-500/10 text-green-500"
                                        : "bg-blue-500/10 text-blue-500"
                                  }
                                >
                                  {func.type}
                                </Badge>
                              </div>
                              {func.description && (
                                <p className="mt-1 text-xs text-muted-foreground">{func.description}</p>
                              )}
                              {func.inputs.length > 0 && (
                                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                  <p className="font-semibold">Inputs:</p>
                                  {func.inputs.map((input, i) => (
                                    <p key={i} className="font-mono">
                                      - {input.name}: {input.type}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                            {onExecuteFunction && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedFunction(func)
                                      setFunctionParams({})
                                    }}
                                  >
                                    <Play className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Execute Function: {func.name}</DialogTitle>
                                    <DialogDescription>Enter parameters to execute this function</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    {func.inputs.map((input) => (
                                      <div key={input.name} className="space-y-2">
                                        <Label htmlFor={input.name}>
                                          {input.name} ({input.type})
                                        </Label>
                                        <Input
                                          id={input.name}
                                          value={functionParams[input.name] || ""}
                                          onChange={(e) =>
                                            setFunctionParams({ ...functionParams, [input.name]: e.target.value })
                                          }
                                          placeholder={`Enter ${input.type}`}
                                        />
                                      </div>
                                    ))}
                                    <Button onClick={handleExecuteFunction} className="w-full">
                                      Execute
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="events" className="space-y-3">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {selectedContract.events.map((event) => (
                      <Card key={event.id} className="border border-border/40 bg-card/50">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">{event.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                Block #{event.blockNumber} • {new Date(event.timestamp).toLocaleString()}
                              </p>
                              <div className="mt-2 space-y-1 rounded bg-muted/50 p-2 font-mono text-xs">
                                {Object.entries(event.parameters).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="text-muted-foreground">{key}:</span>{" "}
                                    <span className="text-foreground">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {onViewTransaction && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onViewTransaction(event.transactionHash)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <p className="mt-2 font-mono text-xs text-muted-foreground">
                            Tx: {event.transactionHash.slice(0, 16)}...
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                    {selectedContract.events.length === 0 && (
                      <p className="py-8 text-center text-sm text-muted-foreground">No events emitted</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="transactions" className="space-y-3">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {selectedContract.transactions.map((tx) => (
                      <Card key={tx.id} className="border border-border/40 bg-card/50">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {getTxStatusIcon(tx.status)}
                                <h4 className="font-mono text-sm font-semibold text-foreground">
                                  {tx.hash.slice(0, 16)}...
                                </h4>
                              </div>
                              <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                                <p>
                                  From: {tx.from.slice(0, 10)}... → To: {tx.to.slice(0, 10)}...
                                </p>
                                <p>Block #{tx.blockNumber} • {new Date(tx.timestamp).toLocaleString()}</p>
                                {tx.functionCalled && <p>Function: {tx.functionCalled}()</p>}
                                {tx.gasUsed && <p>Gas: {tx.gasUsed.toLocaleString()}</p>}
                                {tx.value !== undefined && <p>Value: {tx.value} ETH</p>}
                              </div>
                            </div>
                            {onViewTransaction && (
                              <Button size="sm" variant="ghost" onClick={() => onViewTransaction(tx.hash)}>
                                <ArrowUpRight className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {selectedContract.transactions.length === 0 && (
                      <p className="py-8 text-center text-sm text-muted-foreground">No transactions</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
