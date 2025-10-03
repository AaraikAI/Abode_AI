const express = require("express")
const cors = require("cors")
const { createServer } = require("http")
const { Server } = require("socket.io")
const { randomUUID } = require("crypto")

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
})

app.use(cors())
app.use(express.json())

const vectorAssets = [
  {
    id: "asset-floor",
    name: "Studio Floor",
    category: "Surfaces",
    description: "Base plane representing the floor slab.",
    geometry: "plane",
    color: "#d9d9d9",
    scale: { x: 20, y: 1, z: 20 },
    environment: "/studio/studio_hdri.hdr",
  },
  {
    id: "asset-wall",
    name: "Partition Wall",
    category: "Architecture",
    description: "Simple wall element for quick layouts.",
    geometry: "box",
    color: "#f5f5f5",
    scale: { x: 4, y: 2.8, z: 0.2 },
  },
  {
    id: "asset-window",
    name: "Window Frame",
    category: "Architecture",
    description: "Aluminium window frame placeholder with mullions.",
    gltfUrl: "/models/window-frame.gltf",
    thumbnailUrl: "/studio/window-frame.jpg",
    scale: { x: 1, y: 1, z: 1 },
  },
  {
    id: "asset-desk",
    name: "Work Desk",
    category: "Furniture",
    description: "Rectangular workstation desk.",
    gltfUrl: "/models/work-desk.gltf",
    color: "#d6a372",
    scale: { x: 1, y: 1, z: 1 },
  },
  {
    id: "asset-chair",
    name: "Ergo Chair",
    category: "Furniture",
    description: "Task chair with fabric seat and polished base.",
    gltfUrl: "/models/chair.gltf",
    thumbnailUrl: "/studio/chair.jpg",
    scale: { x: 1, y: 1, z: 1 },
  },
  {
    id: "asset-pendant",
    name: "Pendant Light",
    category: "Lighting",
    description: "Industrial pendant for high ceilings.",
    gltfUrl: "/models/pendant.gltf",
    metadata: { emissive: "#fef3c7" },
  },
]

const sdJobs = new Map()
const sustainabilityWebhook = process.env.SUSTAINABILITY_WEBHOOK_URL

function scoreAsset(asset, query) {
  if (!query) return 1
  const haystack = `${asset.name} ${asset.description ?? ""} ${asset.category}`.toLowerCase()
  return haystack.includes(query.toLowerCase()) ? haystack.length : 0
}

async function emitSustainabilityMetrics(job) {
  if (!sustainabilityWebhook || !job.metrics) return
  try {
    await fetch(sustainabilityWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        renderId: job.id,
        co2Kg: job.metrics.co2_kg,
        energyKwh: job.metrics.energy_kwh,
        durationSeconds: job.metrics.duration_seconds,
      }),
    })
  } catch (error) {
    console.warn("Failed to forward sustainability metrics", error)
  }
}

function scheduleJobLifecycle(job) {
  setTimeout(() => {
    if (!sdJobs.has(job.id)) return
    const metrics = job.metrics ?? {
      co2_kg: Number((Math.random() * 0.1 + 0.05).toFixed(4)),
      energy_kwh: Number((Math.random() * 0.08 + 0.02).toFixed(4)),
      duration_seconds: Math.floor(Math.random() * 35) + 15,
    }
    const updated = {
      ...job,
      status: "success",
      previewUrl: job.previewUrl ?? "/studio/concept-preview.jpg",
      outputUrl: job.outputUrl ?? "/studio/concept-output.jpg",
      metrics,
    }
    sdJobs.set(job.id, updated)
    void emitSustainabilityMetrics(updated)
  }, 2500)
}

const heroStats = [
  { label: "4K photoreal renders", value: "97s", helper: "GPU optimized pipeline" },
  { label: "Searchable assets", value: "82M", helper: "Manufacturer verified" },
  { label: "Enterprise compliance", value: "SOC2 • GDPR • HIPAA", helper: "Regional residency enforced" },
]

const workspaces = [
  {
    id: "orchestration",
    label: "Task Orchestration",
    description: "Coordinate DAGs, approvals, and GPUs with observability baked into every run.",
    highlights: [
      {
        title: "Airflow-native runbooks",
        description: "Attach GPU, legal, and sustainability policies to each orchestrated step.",
        icon: "CalendarClock",
      },
      {
        title: "Agent marketplace",
        description: "Deploy parsing, staging, and manufacturing agents with rollback snapshots.",
        icon: "Bot",
      },
      {
        title: "Compliance guardrails",
        description: "SOC2-ready log streams, geo-fenced sessions, credit throttling per contract.",
        icon: "ShieldCheck",
      },
    ],
    journey: [
      { title: "Blueprint template", description: "Kick off from rebuild, render, or manufacturing templates" },
      { title: "Execution governance", description: "Route approvals with Redis backed state machines" },
      { title: "Insight loop", description: "Prometheus metrics and Elasticsearch analytics close the loop" },
    ],
    metrics: [
      { label: "Avg cycle time", value: "11m" },
      { label: "Agent uptime", value: "99.96%" },
      { label: "Credit efficiency", value: "+22%" },
    ],
  },
  {
    id: "design-studio",
    label: "Design Studio",
    description: "Drag irregular rooms, run text-to-room, and stage manufacturing-ready scenes.",
    highlights: [
      {
        title: "Multimodal intake",
        description: "Parse PDF/DXF up to 50MB with Vastu checks and contour extraction.",
        icon: "Layers3",
      },
      {
        title: "Generative editing",
        description: "Segment, inpaint, and upscale imagery with ControlNet + ESRGAN.",
        icon: "Sparkles",
      },
      {
        title: "Realtime preview",
        description: "WebGPU viewer with live cursors and undo/redo from Redis state",
        icon: "LayoutDashboard",
      },
    ],
    journey: [
      { title: "Upload & parse", description: "Auto align to maps imagery and flag zoning issues" },
      { title: "Generate & iterate", description: "Create concept variations and text-to-room scenes in seconds" },
      { title: "Deliverables", description: "Export 4K stills, walkthroughs, CAD, and AR ready twins" },
    ],
    metrics: [
      { label: "Design throughput", value: "3.4x" },
      { label: "Render success", value: "99.4%" },
      { label: "Asset library", value: "82M" },
    ],
  },
  {
    id: "manufacturing",
    label: "Manufacturing Bridge",
    description: "Auto generate BOMs, sync JEGA factories, and log sustainability telemetry.",
    highlights: [
      {
        title: "ERP exports",
        description: "Create BOMs, quotes, and cutlists with JEGA adapters",
        icon: "Factory",
      },
      {
        title: "Versioned models",
        description: "Store fine-tuned checkpoints with Git-like tags",
        icon: "GitBranch",
      },
      {
        title: "Sustainability ledger",
        description: "Track CodeCarbon per render and embodied carbon totals",
        icon: "Leaf",
      },
    ],
    journey: [
      { title: "Approve", description: "Redis approvals notify stakeholders" },
      { title: "Sync", description: "Push packets to ERP and confirm receipts" },
      { title: "Monitor", description: "K6 and Sentry guard rails keep latency < 500ms" },
    ],
    metrics: [
      { label: "BOM accuracy", value: "98%" },
      { label: "CO₂/report", value: "1.3 kg" },
      { label: "Factory sync", value: "54s" },
    ],
  },
]

const capabilitySections = [
  {
    title: "Design Automation",
    items: [
      { name: "Site-to-room AI", description: "Parse parcels, detect trees/grade, auto stage interiors", badge: "YOLO • LLM" },
      { name: "Concept variations", description: "Generate digital twins and bionic designs for sustainability", badge: "2025 update" },
      { name: "Parametric furniture", description: "Cabinets, doors, irregular rooms with manufacturable constraints" },
    ],
  },
  {
    title: "Rendering & FX",
    items: [
      { name: "HDRI + AI lighting", description: "Optimize sun paths and cinematic LUTs automatically" },
      { name: "WebGPU preview", description: "Progressive viewport with AR/VR handoff", badge: "WebXR" },
      { name: "Batch GPU control", description: "Autoscale Kubernetes GPUs and rush queues" },
    ],
  },
  {
    title: "Collaboration",
    items: [
      { name: "Hybrid approvals", description: "Redis queues manage human checkpoints and SLAs" },
      { name: "Real-time co-editing", description: "Socket.io cursors and Shepherd onboarding" },
      { name: "Community hubs", description: "Discourse forums with role-based libraries" },
    ],
  },
  {
    title: "DevOps & Compliance",
    items: [
      { name: "Zero-trust mesh", description: "Istio, RASP, Splunk SIEM with quarterly drills", badge: "SOC2" },
      { name: "Observability", description: "Prometheus, OpenTelemetry, Evidently, Fairlearn" },
      { name: "Data residency", description: "Region-aware storage with consent automation", badge: "OneTrust" },
    ],
  },
]

const automationFlow = [
  { name: "Intake", description: "Upload plans or prompts to kick off DAGs", dependencies: "S3 + metadata" },
  { name: "Parsing", description: "CV extracts geometry and compliance context", dependencies: "OpenCV • YOLOv8" },
  { name: "Generation", description: "Stable Diffusion + transformers produce CGI and twins", dependencies: "GPU fleet" },
  { name: "Review", description: "Hybrid approvals via Socket.io + Postgres", dependencies: "Socket.io • Redis" },
  { name: "Manufacture", description: "Export BOMs, quotes, JEGA payloads", dependencies: "ERP webhooks" },
  { name: "Telemetry", description: "CodeCarbon and Alertmanager track sustainability", dependencies: "Prometheus • ELK" },
]

const observabilityMetrics = [
  { name: "Render fleet utilization", value: "82%", change: "+5% vs last sprint", positive: true },
  { name: "CO₂ per render", value: "1.28 kg", change: "-10% vs baseline", positive: true },
  { name: "99th percentile latency", value: "402 ms", change: "SLO 500 ms", positive: true },
  { name: "Incidents last quarter", value: "0", change: "On track", positive: true },
]

const sustainabilitySeries = [
  { month: "Jan", co2: 2.0 },
  { month: "Feb", co2: 1.8 },
  { month: "Mar", co2: 1.7 },
  { month: "Apr", co2: 1.5 },
  { month: "May", co2: 1.4 },
  { month: "Jun", co2: 1.3 },
]

const complianceMatrix = [
  {
    name: "Security",
    controls: ["TLS 1.3 + AES-256", "HackerOne pentesting", "Runtime anomaly detection"],
  },
  {
    name: "Privacy",
    controls: ["OneTrust consent flows", "Regional KMS segregation", "Signed URL watermarking"],
  },
  {
    name: "AI Governance",
    controls: ["Fairlearn bias audits", "Prompt security & watermarking", "Shadow evals for retraining"],
  },
]

const integrationCatalog = [
  { title: "Productivity", items: ["Slack", "Microsoft Teams", "Notion", "Zapier", "Jira"] },
  { title: "Design & Content", items: ["Figma", "Adobe CC", "Dropbox", "Google Drive"] },
  { title: "Manufacturing", items: ["JEGA", "ZBOM", "Procore", "SAP ERP"] },
  { title: "Developer", items: ["REST", "gRPC", "GraphQL", "Terraform provider"] },
]

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    credits: "100 credits",
    features: ["Text-to-room prompts", "Watermarked exports", "Community support"],
    cta: "Start for free",
  },
  {
    name: "Pro",
    price: "$29/mo",
    credits: "1,000 credits",
    features: ["Unlimited models", "4K renders & walkthroughs", "Priority GPU queue"],
    cta: "Upgrade to Pro",
    mostPopular: true,
  },
  {
    name: "Team",
    price: "$99/org",
    credits: "5,000 shared",
    features: ["Realtime collaboration", "Slack/Figma integrations", "Advanced analytics"],
    cta: "Launch collaboration",
  },
  {
    name: "Enterprise",
    price: "Custom",
    credits: "Volume pricing",
    features: ["Dedicated clusters", "SLA & compliance desk", "Manufacturing bridge"],
    cta: "Contact sales",
  },
]

const roadmap = [
  { phase: "v1 MVP", quarter: "Q4 2025", focus: "Site parse + interiors + renders PWA", metrics: ["TTI < 60s", "50% retention"] },
  { phase: "v2 Pro", quarter: "Q1 2026", focus: "Manufacturing, 80M library, BOM automation", metrics: ["95% CSAT", "+200% AOV"] },
  { phase: "v3 Enterprise", quarter: "Q2 2026", focus: "AR/VR twins, custom model fine-tuning", metrics: ["99.9% uptime", "Regional residency"] },
  { phase: "v4 Advanced", quarter: "Q3 2026", focus: "API marketplace, bionic simulations", metrics: ["10K users", "40% referrals"] },
]

const billingSummary = {
  orgId: "aurora-collective",
  tier: "team",
  billingCycleEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(),
  includedCredits: 5000,
  creditsRemaining: 1980,
  rolloverCredits: 420,
  alerts: [
    {
      type: "usage",
      message: "GPU rush queue usage up 22%. Consider enabling surge pricing",
      link: "https://billing.example.com/alerts/gpu",
    },
    {
      type: "compliance",
      message: "JEGA export awaiting compliance officer approval",
    },
  ],
  ledger: [
    {
      id: "ledger-6001",
      orgId: "aurora-collective",
      delta: -160,
      balance: 1980,
      currency: "credits",
      reason: "4K render batch (12 scenes)",
      actor: "Lina Cho",
      createdAt: new Date().toISOString(),
      metadata: { projectId: "prj-sunrise" },
    },
    {
      id: "ledger-5996",
      orgId: "aurora-collective",
      delta: -320,
      balance: 2140,
      currency: "credits",
      reason: "AI customization fine-tune (12GB)",
      actor: "Raj Singh",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    },
    {
      id: "ledger-5982",
      orgId: "aurora-collective",
      delta: 500,
      balance: 2460,
      currency: "credits",
      reason: "Purchased credit pack",
      actor: "Michelle Ortiz",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ],
}

app.post("/vector-search", (req, res) => {
  const { query = "", limit = 24 } = req.body ?? {}
  const scored = vectorAssets
    .map((asset) => ({ asset, score: scoreAsset(asset, query) }))
    .filter((entry) => entry.score > 0 || !query)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(Number(limit) || 24, 60)))
    .map((entry) => entry.asset)

  const categories = Array.from(new Set(scored.map((asset) => asset.category)))
  res.json({ assets: scored, categories })
})

app.post("/sd/jobs", (req, res) => {
  const { prompt, style, id } = req.body ?? {}
  if (!prompt) {
    return res.status(400).json({ error: "prompt is required" })
  }
  const jobId = id ?? randomUUID()
  const job = {
    id: jobId,
    prompt,
    style: style ?? null,
    status: "processing",
    previewUrl: "/studio/concept-preview.jpg",
    metadata: { submittedAt: new Date().toISOString() },
  }
  sdJobs.set(jobId, job)
  scheduleJobLifecycle(job)
  res.json(job)
})

app.get("/sd/jobs/:id", (req, res) => {
  const job = sdJobs.get(req.params.id)
  if (!job) {
    return res.status(404).json({ error: "job not found" })
  }
  res.json(job)
})

app.post("/sd/jobs/:id/upscale", (req, res) => {
  const job = sdJobs.get(req.params.id)
  if (!job) {
    return res.status(404).json({ error: "job not found" })
  }
  const updated = {
    ...job,
    status: "upscaling",
  }
  sdJobs.set(job.id, updated)

  setTimeout(() => {
    if (!sdJobs.has(job.id)) return
    const metrics = job.metrics ?? {
      co2_kg: Number((Math.random() * 0.05 + 0.02).toFixed(4)),
      energy_kwh: Number((Math.random() * 0.05 + 0.01).toFixed(4)),
      duration_seconds: Math.floor(Math.random() * 20) + 8,
    }
    const finalJob = {
      ...job,
      status: "success",
      upscaledUrl: "/studio/concept-upscaled.jpg",
      metrics,
    }
    sdJobs.set(job.id, finalJob)
    void emitSustainabilityMetrics(finalJob)
  }, 2000)

  res.json({ ...updated, upscaledUrl: null })
})

app.get("/auth/token", (_req, res) => {
  res.json({ access_token: "mock-platform-token", expires_in: 3600, token_type: "bearer" })
})

app.get("/platform/snapshot", (_req, res) => {
  res.json({
    heroStats,
    workspaces,
    workspaceTemplates: workspaces,
    agentCatalog: [],
    projects: [],
    capabilitySections,
    automationFlow,
    observabilityMetrics,
    sustainabilitySeries,
    complianceMatrix,
    integrationCatalog,
    pricingTiers,
    roadmap,
  })
})

app.get("/metrics/sustainability", (_req, res) => {
  const averageCo2 =
    sustainabilitySeries.reduce((acc, item) => acc + item.co2, 0) /
    sustainabilitySeries.length

  res.json({
    summary: {
      rollingAverageKg: Number(averageCo2.toFixed(2)),
      targetKg: 1.2,
      variance: Number((averageCo2 - 1.2).toFixed(2)),
      trend: averageCo2 <= 1.2 ? "down" : "up",
      sampleSize: sustainabilitySeries.length,
    },
    items: sustainabilitySeries.map((point, index) => ({
      id: `metric-${index + 1}`,
      renderId: `render-${index + 20}`,
      projectId: index % 2 === 0 ? "prj-sunrise" : "prj-harbor",
      co2Kg: point.co2,
      energyKwh: Number((point.co2 * 0.68).toFixed(2)),
      region: index % 2 === 0 ? "us-west-1" : "eu-central-1",
      timestamp: new Date(Date.now() - index * 86_400_000).toISOString(),
      offsets: {
        method: index % 3 === 0 ? "renewable" : "carbon-credit",
        value: Number((point.co2 * 0.4).toFixed(2)),
      },
    })),
  })
})

app.get("/billing/summary", (_req, res) => {
  res.json(billingSummary)
})

app.post("/api/chat", (req, res) => {
  const { message } = req.body || {}
  res.json({
    response: `Mock backend heard: ${message}. Live FastAPI integration pending.`,
    confidence: 0.98,
    intent: "demo",
    sources: [{ title: "Mock Knowledge Base", url: "https://example.com/responses" }],
  })
})

io.on("connection", (socket) => {
  const emitTelemetry = () => {
    const event = {
      type: "sustainability",
      timestamp: new Date().toISOString(),
      payload: {
        co2Kg: Number((1.1 + Math.random() * 0.5).toFixed(2)),
        energyKwh: Number((0.8 + Math.random() * 0.3).toFixed(2)),
        renderId: `render-${Math.floor(Math.random() * 500)}`,
      },
    }
    socket.emit("telemetry", event)
  }

  const interval = setInterval(emitTelemetry, 5000)
  emitTelemetry()

  socket.on("disconnect", () => {
    clearInterval(interval)
  })
})

const PORT = Number(process.env.MOCK_PORT || 5050)
httpServer.listen(PORT, () => {
  console.log(`Mock backend listening on http://localhost:${PORT}`)
})
