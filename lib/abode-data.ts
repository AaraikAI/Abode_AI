import {
  Bot,
  CalendarClock,
  Factory,
  GitBranch,
  LayoutDashboard,
  Leaf,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import type {
  AgentTemplate,
  AutomationStep,
  BillingSummary,
  CapabilitySection,
  ComplianceDiscipline,
  HeroStat,
  IntegrationCategory,
  ObservabilityMetric,
  PlatformSnapshot,
  PricingTier,
  ProjectSummary,
  RoadmapItem,
  SustainabilityPoint,
  SustainabilitySummary,
  WorkspaceDefinition,
  WorkspaceTemplate,
} from "./platform-types"

export const heroStats: HeroStat[] = [
  {
    label: "4K photoreal renders",
    value: "< 2 min",
    helper: "Coohom-class GPU pipeline"
  },
  {
    label: "Searchable assets",
    value: "80M+",
    helper: "Parametric + manufacturer-grade"
  },
  {
    label: "Enterprise compliance",
    value: "GDPR • SOC2 • HIPAA-ready",
    helper: "Zero-trust w/ regional residency"
  }
]

export const workspaces: WorkspaceDefinition[] = [
  {
    id: "orchestration",
    label: "Task Orchestration",
    description:
      "Coordinate AI agents, human checkpoints, and billing policies across blueprints, renders, and compliance workflows.",
    highlights: [
      {
        title: "Airflow-native pipelines",
        description:
          "Schedule DAGs with retry logic, GPU affinities, and dependency resolution mapped to Kubernetes clusters.",
        icon: CalendarClock
      },
      {
        title: "Agent marketplace",
        description:
          "Launch pre-built agents for parsing, inpainting, staging, and BOM generation with version snapshots.",
        icon: Bot
      },
      {
        title: "Audit-first controls",
        description:
          "SOC2-ready log streams, geo-fenced sessions, and credit throttling tied to roles and contracts.",
        icon: ShieldCheck
      }
    ],
    journey: [
      {
        title: "Blueprint template",
        description: "Start from site-parse, render, or ERP handoff recipes with configurable guardrails."
      },
      {
        title: "Execution governance",
        description: "Route approvals through Redis-backed state machines and hybrid checkpoints."
      },
      {
        title: "Insight loop",
        description: "Push metrics to Prometheus/Grafana and retraining queues via Elasticsearch aggregation."
      }
    ],
    metrics: [
      { label: "Avg cycle time", value: "12m" },
      { label: "Agent uptime", value: "99.94%" },
      { label: "Credit efficiency", value: "+18%" }
    ]
  },
  {
    id: "design-studio",
    label: "Design Studio",
    description:
      "From site parse to cinematic CGI: drag irregular rooms, text-to-room prompts, and parametric cabinetry in one workspace.",
    highlights: [
      {
        title: "Multimodal inputs",
        description:
          "Ingest PDF, DXF, DWG up to 50MB, auto-extract scale, orientation, and compliance annotations via YOLO + OCR.",
        icon: Layers3
      },
      {
        title: "Generative editing",
        description:
          "Segment, inpaint, upscale, and style transfer with Stable Diffusion control nets and ESRGAN upscaling.",
        icon: Sparkles
      },
      {
        title: "Real-time preview",
        description:
          "WebGPU-powered Three.js viewport with progressive renders, undo/redo in Redis, and live cursors.",
        icon: LayoutDashboard
      }
    ],
    journey: [
      {
        title: "Upload & parse",
        description: "Auto-convert plans to GeoJSON, align to Maps imagery, and flag Vastu + zoning issues."
      },
      {
        title: "Generate & iterate",
        description:
          "Spin concept variations, parametric furniture, and text-to-room scenes with reusable style boards."
      },
      {
        title: "Deliverables",
        description:
          "Export 4K stills, walkthrough videos, CAD, and AR-ready twins with watermarking + signed URLs."
      }
    ],
    metrics: [
      { label: "Design throughput", value: "3x" },
      { label: "Render success", value: "99.2%" },
      { label: "Asset library", value: "80M" }
    ]
  },
  {
    id: "manufacturing",
    label: "Manufacturing Bridge",
    description:
      "Close the loop with JEGA/ZBOM sync, costed BOMs, and sustainability telemetry for every render batch.",
    highlights: [
      {
        title: "ERP-ready exports",
        description:
          "Generate BOMs, cutlists, and quotes with JEGA adapters plus Zapier-compatible factory webhooks.",
        icon: Factory
      },
      {
        title: "Versioned models",
        description:
          "Store fine-tuned checkpoints in org S3 buckets with Git-like tags and rollbacks.",
        icon: GitBranch
      },
      {
        title: "Sustainability ledger",
        description:
          "Track CodeCarbon CO₂ per render alongside embodied carbon calculators and export to ESG reports.",
        icon: Leaf
      }
    ],
    journey: [
      {
        title: "Approve",
        description: "Socket.io approvals notify stakeholders with traceable signatures."
      },
      {
        title: "Sync",
        description: "Push manufacturing packets to ERP, notify via Slack/Teams, and confirm receipt."
      },
      {
        title: "Monitor",
        description: "Automated k6 + Sentry monitors keep latency <500ms and exports retriable."
      }
    ],
    metrics: [
      { label: "BOM accuracy", value: "98%" },
      { label: "CO₂/report", value: "1.4 kg" },
      { label: "Factory sync", value: "< 60s" }
    ]
  }
]

export const workspaceTemplates: WorkspaceTemplate[] = [
  {
    id: "orchestration",
    name: "Task Orchestration",
    description:
      "Schedule Airflow DAGs with retry logic, GPU affinities, and compliance guardrails.",
    rbac: ["admin", "analyst", "developer"],
    defaultAgents: ["site-parse", "render-batch", "codecarbon-audit"],
    checklist: [
      "Validate geo-fencing and data residency",
      "Assign approval owners",
      "Review credit throttles",
    ],
  },
  {
    id: "design-studio",
    name: "Design Studio",
    description:
      "Generative design, text-to-room, and style transfer in a collaborative viewport.",
    rbac: ["designer", "freelancer", "admin"],
    defaultAgents: ["concept-variation", "virtual-staging", "style-transfer"],
    checklist: [
      "Confirm asset licensing",
      "Pin preferred style boards",
      "Enable live cursors",
    ],
  },
  {
    id: "manufacturing",
    name: "Manufacturing Bridge",
    description:
      "Generate BOMs, cutlists, and ERP payloads with sustainability telemetry attached.",
    rbac: ["manufacturer", "admin", "analyst"],
    defaultAgents: ["bom-export", "factory-sync", "sustainability-report"],
    checklist: [
      "Map JEGA credentials",
      "Review pricing rules",
      "Schedule QA sign-off",
    ],
  },
]

export const agentCatalog: AgentTemplate[] = [
  {
    id: "site-parse",
    name: "Site Parser",
    version: "1.6.0",
    description:
      "Converts PDF/DXF plans to GeoJSON, extracts annotations, and flags Vastu compliance.",
    capabilities: ["cv", "ocr", "compliance"],
    averageDuration: "2m",
    rating: 4.8,
  },
  {
    id: "concept-variation",
    name: "Concept Variation",
    version: "2.1.3",
    description:
      "Generates digital twin variations and sustainability-optimized massings.",
    capabilities: ["stable-diffusion", "digital-twin", "bionic-design"],
    averageDuration: "90s",
    rating: 4.6,
  },
  {
    id: "bom-export",
    name: "Manufacturing Export",
    version: "1.2.4",
    description:
      "Creates BOM, cutlists, and JEGA payloads from approved scenes.",
    capabilities: ["bom", "erp", "sustainability"],
    averageDuration: "45s",
    rating: 4.9,
  },
]

export const projectSummaries: ProjectSummary[] = [
  {
    id: "prj-sunrise",
    name: "Sunrise Villas",
    workspace: "design-studio",
    status: "in_review",
    owner: {
      name: "Lina Cho",
      role: "designer",
      org: "Aurora Collective",
    },
    updatedAt: new Date().toISOString(),
    metrics: {
      renders: 18,
      co2Kg: 25.2,
      creditsConsumed: 640,
      satisfaction: 92,
    },
    nextActions: [
      "Run AI lighting optimization",
      "Request manufacturer approval",
      "Schedule client VR review",
    ],
  },
  {
    id: "prj-harbor",
    name: "Harborview HQ",
    workspace: "orchestration",
    status: "approved",
    owner: {
      name: "Michelle Ortiz",
      role: "analyst",
      org: "Northwind Enterprises",
    },
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    metrics: {
      renders: 42,
      co2Kg: 58.1,
      creditsConsumed: 1890,
      satisfaction: 97,
    },
    nextActions: [
      "Export BOM for JEGA",
      "Notify compliance for audit trail",
      "Trigger sustainability dashboard refresh",
    ],
  },
  {
    id: "prj-adaptive",
    name: "Adaptive Learning Campus",
    workspace: "manufacturing",
    status: "exported",
    owner: {
      name: "Raj Singh",
      role: "manufacturer",
      org: "AdaptiveBuild",
    },
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    metrics: {
      renders: 12,
      co2Kg: 14.4,
      creditsConsumed: 320,
    },
    nextActions: [
      "Monitor factory sync",
      "Review CodeCarbon variance",
      "Send NPS survey",
    ],
  },
]

export const capabilitySections: CapabilitySection[] = [
  {
    title: "Design Automation",
    items: [
      {
        name: "Site-to-room AI",
        description: "Parse parcels, detect trees/grade, and auto-stage interiors with text or voice prompts.",
        badge: "YOLO • LLM"
      },
      {
        name: "Generative variations",
        description: "Create concept boards, digital twins, and bionic design simulations for sustainability reviews.",
        badge: "2025 update"
      },
      {
        name: "Parametric furniture",
        description: "Cabinets, doors, and irregular rooms with manufacturable constraints from AIHouse 5 Plus."
      }
    ]
  },
  {
    title: "Rendering & FX",
    items: [
      {
        name: "HDRI + AI lighting",
        description: "Coohom-inspired pipelines optimize sun paths, shadows, and cinematic LUTs automatically."
      },
      {
        name: "WebGPU preview",
        description: "Progressive viewport, AR/VR handoff, and stabilized camera paths for walkthroughs.",
        badge: "WebXR"
      },
      {
        name: "Batch GPU control",
        description: "Kubernetes autoscaling, CUDA acceleration, and rush queues for priority clients."
      }
    ]
  },
  {
    title: "Collaboration",
    items: [
      {
        name: "Hybrid approvals",
        description: "Redis queues drive approval state machines with human checkpoints and SLA timers."
      },
      {
        name: "Real-time co-editing",
        description: "Socket.io cursors, annotations, and Shepherd.js onboarding tours." 
      },
      {
        name: "Community hubs",
        description: "Launch Discourse forums with role-based access to shared libraries and templates."
      }
    ]
  },
  {
    title: "DevOps & Compliance",
    items: [
      {
        name: "Zero-trust mesh",
        description: "Istio, RASP, and Splunk-backed SIEM with quarterly drills and 72h disclosure playbooks.",
        badge: "SOC2"
      },
      {
        name: "Observability",
        description: "Prometheus, OpenTelemetry, Evidently, and Fairlearn bias checks wired into alerts."
      },
      {
        name: "Data residency",
        description: "Region-aware storage, consent automation, and granular RBAC for multi-orgs.",
        badge: "OneTrust"
      }
    ]
  }
]

export const automationFlow: AutomationStep[] = [
  {
    name: "Intake",
    description: "Upload plans, prompt briefs, or existing BIM to kick off orchestrated DAGs.",
    dependencies: "S3 + metadata schema"
  },
  {
    name: "Parsing",
    description: "Computer vision extracts geometry, topography, and compliance context.",
    dependencies: "OpenCV • YOLOv8"
  },
  {
    name: "Generation",
    description: "Stable Diffusion + custom transformers create CGI, style boards, and digital twins.",
    dependencies: "GPU fleet"
  },
  {
    name: "Review",
    description: "Hybrid approvals with WebSockets, Redis queues, and structured audit logs.",
    dependencies: "Socket.io • Postgres"
  },
  {
    name: "Manufacture",
    description: "Export BOMs, quotes, and JEGA payloads with sustainability telemetry.",
    dependencies: "ERP webhooks"
  },
  {
    name: "Telemetry",
    description: "CodeCarbon, Mixpanel, and Alertmanager close the loop with sustainability + adoption insights.",
    dependencies: "Prometheus • ELK"
  }
]

export const observabilityMetrics: ObservabilityMetric[] = [
  {
    name: "Render fleet utilization",
    value: "84%",
    change: "+6% vs last sprint",
    positive: true
  },
  {
    name: "CO₂ per render",
    value: "1.4 kg",
    change: "-12% with CodeCarbon",
    positive: true
  },
  {
    name: "99th percentile latency",
    value: "410 ms",
    change: "SLO 500 ms",
    positive: true
  },
  {
    name: "Incidents last quarter",
    value: "1",
    change: "Postmortem published",
    positive: true
  }
]

export const sustainabilitySeries: SustainabilityPoint[] = [
  { month: "Jan", co2: 2.1 },
  { month: "Feb", co2: 1.9 },
  { month: "Mar", co2: 1.8 },
  { month: "Apr", co2: 1.6 },
  { month: "May", co2: 1.5 },
  { month: "Jun", co2: 1.4 }
]

export const complianceMatrix: ComplianceDiscipline[] = [
  {
    name: "Security",
    controls: [
      "TLS 1.3 everywhere, AES-256 at rest",
      "Continuous pentesting via HackerOne",
      "Runtime protection with RASP + anomaly detection"
    ]
  },
  {
    name: "Privacy",
    controls: [
      "OneTrust consent flows with right-to-forget automation",
      "Regional data residency and key rotation with AWS KMS",
      "S3 signed URLs + watermarking for exports"
    ]
  },
  {
    name: "AI Governance",
    controls: [
      "Bias audits with Fairlearn and ethics board sign-off",
      "Prompt security, watermarking, and hallucination scoring",
      "Shadow evaluations for retraining and rollback"
    ]
  }
]

export const integrationCatalog: IntegrationCategory[] = [
  {
    title: "Productivity",
    items: ["Slack", "Microsoft Teams", "Notion", "Zapier", "Jira"]
  },
  {
    title: "Design & Content",
    items: ["Figma", "Adobe CC SDKs", "Dropbox", "Google Drive"]
  },
  {
    title: "Manufacturing",
    items: ["JEGA", "ZBOM", "Procore", "SAP ERP"]
  },
  {
    title: "Developer",
    items: ["REST", "gRPC", "GraphQL", "Terraform provider"]
  }
]

export const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    credits: "100 credits",
    features: [
      "Text-to-room prompts",
      "Watermarked exports",
      "Community support"
    ],
    cta: "Start for free"
  },
  {
    name: "Pro",
    price: "$29/mo",
    credits: "1,000 credits",
    features: [
      "Unlimited model library",
      "4K renders & walkthroughs",
      "Priority GPU queue"
    ],
    cta: "Upgrade to Pro",
    mostPopular: true
  },
  {
    name: "Team",
    price: "$99/org",
    credits: "5,000 shared",
    features: [
      "Realtime collaboration",
      "Slack/Figma integrations",
      "Advanced analytics"
    ],
    cta: "Launch collaboration"
  },
  {
    name: "Enterprise",
    price: "Custom",
    credits: "Volume pricing",
    features: [
      "Dedicated clusters",
      "SLA & compliance desk",
      "Manufacturing bridge"
    ],
    cta: "Contact sales"
  }
]

export const roadmap: RoadmapItem[] = [
  {
    phase: "v1 MVP",
    quarter: "Q4 2025",
    focus: "Site parse + interiors + renders PWA",
    metrics: ["TTI < 60s", "50% retention"]
  },
  {
    phase: "v2 Pro",
    quarter: "Q1 2026",
    focus: "Manufacturing, 80M library, BOM automation",
    metrics: ["95% CSAT", "+200% AOV"]
  },
  {
    phase: "v3 Enterprise",
    quarter: "Q2 2026",
    focus: "AR/VR twins, custom model fine-tuning",
    metrics: ["99.9% uptime", "Regional residency"]
  },
  {
    phase: "v4 Advanced",
    quarter: "Q3 2026",
    focus: "API marketplace, bionic design sims",
    metrics: ["10K users", "40% referrals"]
  }
]

const averageCo2 =
  sustainabilitySeries.reduce((acc, item) => acc + item.co2, 0) /
  sustainabilitySeries.length

export const fallbackSustainabilitySummary: SustainabilitySummary = {
  summary: {
    rollingAverageKg: Number(averageCo2.toFixed(2)),
    targetKg: 1.2,
    variance: Number((averageCo2 - 1.2).toFixed(2)),
    trend: "down",
    sampleSize: sustainabilitySeries.length,
  },
  items: sustainabilitySeries.map((point, index) => ({
    id: `metric-${index + 1}`,
    renderId: `render-${index + 10}`,
    projectId: index % 2 === 0 ? "prj-sunrise" : "prj-harbor",
    co2Kg: point.co2,
    energyKwh: Number((point.co2 * 0.65).toFixed(2)),
    region: index % 2 === 0 ? "us-west-1" : "eu-central-1",
    timestamp: new Date(Date.now() - index * 86400000).toISOString(),
    offsets: {
      method: index % 3 === 0 ? "renewable" : "carbon-credit",
      value: Number((point.co2 * 0.45).toFixed(2)),
    },
  })),
}

export const fallbackBillingSummary: BillingSummary = {
  orgId: "aurora-collective",
  tier: "team",
  billingCycleEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 9).toISOString(),
  includedCredits: 5000,
  creditsRemaining: 2150,
  rolloverCredits: 320,
  alerts: [
    {
      type: "usage",
      message:
        "AI customization GPUs are trending +18% this week. Consider enabling rush queue pricing.",
    },
    {
      type: "compliance",
      message:
        "Manufacturing bridge exports require JEGA compliance review before quarter close.",
    },
  ],
  ledger: [
    {
      id: "ledger-5012",
      orgId: "aurora-collective",
      delta: -120,
      balance: 2150,
      currency: "credits",
      reason: "4K render batch (rush queue)",
      actor: "Lina Cho",
      createdAt: new Date().toISOString(),
      metadata: { projectId: "prj-sunrise" },
    },
    {
      id: "ledger-5009",
      orgId: "aurora-collective",
      delta: -280,
      balance: 2270,
      currency: "credits",
      reason: "AI customization fine-tune (8GB dataset)",
      actor: "Raj Singh",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      id: "ledger-4998",
      orgId: "aurora-collective",
      delta: 500,
      balance: 2550,
      currency: "credits",
      reason: "Purchased credit pack",
      actor: "Michelle Ortiz",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ],
}

export const fallbackPlatformSnapshot: PlatformSnapshot = {
  heroStats,
  workspaces,
  workspaceTemplates,
  agentCatalog,
  projects: projectSummaries,
  capabilitySections,
  automationFlow,
  observabilityMetrics,
  sustainabilitySeries,
  complianceMatrix,
  integrationCatalog,
  pricingTiers,
  roadmap,
}
