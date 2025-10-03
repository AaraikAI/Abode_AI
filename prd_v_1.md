# PRD v1.1 — Site‑Plan → 3D Webapp (canibuild‑style)

**Owner:** (You)

**Date:** (Today)

**Version:** v1.1 (adds real‑time shadowed video, Google Maps background via address/APN/AIN, and major integrations)

---

## 1) Product vision
A clean, fast web app that lets anyone upload a site plan, auto‑understand it, place an ADU or small residential structure, and instantly preview & order photorealistic 3D renders/walkthroughs—no CAD required. The experience should feel as effortless as Canva, as informative as canibuild, and as visual as a real‑time game engine.

---

## 2) Goals & KPIs
- **Primary goal:** Convert site‑plan uploads into accurate 3D scenes and paid render orders within a single session.
- **KPIs:**
  - TTI (first interactive) < 2.5s on modern laptop.
  - Upload → first 3D preview < 60s for a 20MB PDF.
  - 3D preview → HQ still render kickoff < 15s.
  - Checkout conversion > 12% of projects with preview.
  - **Paid feature adoption:** ≥ 35% of orders include *Maps background* and/or *shadowed video*.
  - **Integrations:** ≥ 25% of orgs connect at least one integration (Figma/Slack/Drive/etc.).
  - CSAT ≥ 4.6/5; refund rate < 2%.

---

## 3) Scope
### In‑scope (v1.1)
- Account/Org, roles (Owner, Editor, Viewer).
- Project creation by address or parcel ID; optional map placement.
- **File intake:** PDF/JPG/PNG, (stretch: DXF/DWG). Max 50MB/file.
- **AI plan parsing:** scale detect, footprint/driveway/tree lines, north arrow, annotations (OCR).
- **3D scene builder:** automatic massing; parametric roof presets; setbacks; elevation.
- **Material & look controls** (see §7.3 Rendering controls).
- **Environment presets:** desert/suburban/coastal; vegetation library.
- **Camera tools:** orbit, saved views, path/walkthrough.
- **Render pipeline:** real‑time preview + cloud HQ still/video renders.
- **Commerce:** tiered SKUs (Still, Walkthrough, Plan sets), Stripe checkout, order tracking.
- **Collaboration:** comments, markups, versioning, share links.
- **Admin:** asset library, price table, render quotas.
- **Paid tier features:**
  1) **Real‑time dynamic shadows captured in generated videos** (temporal stabilization included).  
  2) **Google Maps background** imagery from **address** or **APN/AIN** (with attribution, alignment tools), used in preview & exports.  
  3) **Integrations**: Figma, Slack, Google Drive/Dropbox, Notion, Zapier (import/share/notify).

### Out‑of‑scope (v1)
- City‑level permit submission, engineer stamps.
- Full BIM authoring.
- Native iOS/Android apps.

---

## 4) Personas & JTBD
- **GC / Builder:** “Show homeowner a believable design quickly and win the job.”
- **Homeowner:** “Validate if the ADU fits and how it will look on my lot before paying an architect.”
- **Designer/Drafter:** “Start from a sketch, iterate materials and lighting, deliver visuals fast.”

---

## 5) Top user stories (acceptance criteria abbreviated)
1. **Upload a plan** → I see a scaled canvas with north, property lines, and footprint detected.  
   *AC:* If scale is missing, user can set two known distances to calibrate.
2. **Place/resize ADU** by draggable corners; setbacks snap & warn.  
   *AC:* Numeric inputs; undo/redo; keyboard nudge.
3. **Preview 3D** instantly; orbit/pan/zoom in browser.  
   *AC:* 60+ FPS on M1 Air or RTX 2060 at 1080p low.
4. **Style the scene** using material, lighting, surroundings, and LUT panels.  
   *AC:* Changes apply in < 300ms.
5. **Use Maps background (paid)** → I provide **address or APN/AIN**, imagery appears aligned to parcel and blends into the ground plane.  
   *AC:* Imagery attribution visible; alignment error ≤ 1m where imagery supports it; user can rotate/zoom/brightness/blur.
6. **Export video with real‑time shadows (paid)** → Shadows match sun/time‑of‑day and remain stable across frames.  
   *AC:* No major flicker/aliasing; export respects camera path & materials.
7. **Connect Figma (integration)** → From Integrations page I connect my account, push scene snapshots to a Figma page, and paste a plan from Figma back to a project.  
   *AC:* OAuth success; assets appear in Figma within 10s.
8. **Order a render** by choosing SKU (still/walkthrough), resolution, and turnaround.  
   *AC:* Payment succeeds, render job queued, ETA shown.
9. **Share** a view‑only link with comments enabled.  
   *AC:* Role‑based access; expiring links.

---

## 6) Information architecture
- **Global nav:** Projects • Library • Orders • **Integrations** • Settings • Help
- **Project:** Overview → Plan → 3D → Deliverables → Comments → Order
- **Right rail inspector:** Tabs = *Materials • Lighting • Environment • Background • Camera • Output*

---

## 7) Detailed requirements

### 7.1 File intake & parsing
- Supported: PDF, PNG, JPG (stretch: DXF/DWG). Multiple pages allowed.
- Auto‑detect: scale, north arrow, property line, existing structures, trees, driveway, annotations.
- Tools: manual trace (pen/spline), snap, layers (site, building, landscape, utilities).
- OCR for text like setbacks, dimensions.
- Output: **ParsedFeatures** (GeoJSON in project CRS), **Scale** (units), **Contours** (if provided).

### 7.2 3D scene generation
- Terrain from map/elevation (Mapbox/ArcGIS). Simple heightfield OK for v1.
- Massing generator: extrude footprints; roofs (gable/hip/shed/flat) with pitch slider.
- Parametrics: floor height, wall thickness, window presets; doors/modules; porch/steps.
- Collisions: enforce setbacks; warnings, not hard blocks.

### 7.3 Rendering controls (browser preview + cloud HQ)
**Materials / Textures**
- PBR materials with albedo/normal/roughness/metallic/AO.
- Real‑world maps: wood grain, rammed earth, concrete, tile (seeded variations, scaling, rotation).
- Material library w/ swatches; upload custom textures (4K max, triplanar option).

**Lighting**
- Real‑time: Image‑based lighting (HDRI), sun/sky; **real‑time shadows** (CSM, soft PCF/PCSS).
- GI options: screen‑space GI or light‑probe volume (runtime), plus path‑traced HQ mode in cloud.
- Time of day & geographic sun; exposure/white balance slider.

**Reflection & Refraction**
- Planar reflections for water planes; reflection probes for general; thin glass refraction (ior ~1.5) with roughness.

**Surroundings**
- Presets: *Desert Hills*, *Suburban Trees*, *Coastal*.  
- Placeable assets: trees, shrubs, stones, stone paths, fences; density slider; wind anim.

**Background (Google Maps Platform — Paid)**
- Ask user for **address** or **APN/AIN** → geocode → fetch aerial/satellite imagery centered & scaled to parcel.  
- Services: Static Maps / Map Tiles (satellite). Optional Street View Static for façade reference.
- Controls: lat/lng/zoom, rotation, ground‑plane alignment, brightness/contrast/blur, blend‑to‑ground slider; attribution watermark always on.
- Compliance: follow Google Maps Platform Terms; include Google attribution; cache imagery **ephemerally** for preview & rendering only (no raw imagery downloads/export of unmodified tiles).

**Color Grading**
- Post‑FX: filmic tonemap, bloom, vignette, chromatic aberration (low), grain (low).  
- LUT loader with defaults: *Warm & Earthy (cinematic)*, *Neutral*, *Cool Dusk*.

**Output**
- Still: 1080p/4K PNG (sRGB/ACEScg baked).  
- Video: 1080p MP4 H.264, 30fps, 10–60s. **Real‑time dynamic shadows are captured and temporally stabilized** during export; optional HQ shadow pass for stills. *(Paid feature).*  
- Walkthrough path editor with easing; waypoint look‑at targets; keyframe sun time.

### 7.4 Orders & pricing
- Admin‑editable SKUs similar to: *3D Walkthrough*, *3D Elevation Renders*, *Concept Plan*, *Detailed Plan*, *Feasibility Report*.
- **Paid add‑ons/tier:** *Shadowed Video Export*, *Google Maps Background* (project‑level unlock), *Rush*.  
- Each SKU: ETA days, base price, options (resolution, rush fee), tax.
- Cart/Checkout via Stripe; invoices & receipts; order status: **Queued → Rendering → QA → Delivered**.
- Download center for deliverables; email/webhook on completion.

### 7.5 Collaboration
- Inline comments pinned to canvas/3D with timestamps.  
- Versions with diff (plan layer + material/lighting diffs).  
- Share links with expiration and watermark option.

### 7.6 Admin & library
- Manage users/roles, price tables, taxes, coupons.  
- Asset library: materials, HDRIs, LUTs, vegetation; CDN backed.  
- Render farm control: GPU pool, cost caps, per‑org quotas.

### 7.7 Integrations
- **Figma:** Export scene snapshots & material sheets as frames; Figma plugin to import a plan image and push snapshots back to a page.
- **Autodesk & SketchUp:** Import (when available) DWG/DXF/SKP via server conversion; map layers/blocks to scene entities.
- **Storage & docs:** Google Drive/Dropbox import/export; Share to Notion pages; Slack notifications on deliverables.
- **Automation:** Zapier + webhooks (render_complete, order_paid, comment_added).  
- **Auth & security:** OAuth per provider; token vault; per‑org enable/disable.
- **Admin UI:** **Integrations** page to connect/disconnect and set scopes.

---

## 8) Technical architecture
**Frontend**
- **Stack:** Next.js + React; TypeScript; Vite build; Tailwind + shadcn/ui; Zustand for state.
- **3D:** Three.js (WebGL2) with WebGPU flag when available; PMREM for IBL; postprocessing pipeline. Shadow tech: cascaded shadow maps (PCF/PCSS) with temporal denoise.
- **Maps:** Mapbox GL (parcel context) + **Google Maps Platform** imagery for background (Static Maps/Tiles). Address & APN/AIN entry with geocoding.
- **Accessibility:** WCAG 2.2 AA; keyboard for all inspector controls.

**Backend**
- **API:** Node (NestJS) or Python (FastAPI); GraphQL for scene state + REST for uploads/renders.
- **Storage:** S3 (uploads & deliverables), CloudFront CDN, signed URLs.
- **DB:** Postgres + PostGIS (geospatial).  
- **Jobs:** Render queue using BullMQ (Redis) or Celery (RabbitMQ).  
- **Auth:** OAuth (Google), email magic link; orgs & roles; audit log.

**AI/Parsing Service** (Python)
- OpenCV + Detectron/YOLO for line/label segmentation; Tesseract or cloud OCR.  
- Vectorization to GeoJSON; scale infer via annotated dimension detection.  
- Confidence scores → review UI.

**Render Service (Cloud HQ)**
- Blender (Eevee for speed, Cycles for path‑traced stills) with sun/sky driven from scene; or Unreal/Omniverse alt.  
- Dynamic shadow pass retained in video encoder; temporal stabilization (TAA) to reduce shimmer.  
- Containerized workers on GPU nodes (AWS G5/RTX).

**Integrations & External APIs**
- **Google Maps Platform:** Static Maps/Tiles for imagery; Places for geocoding; quotas & attribution management; address/**APN/AIN** parsing.
- **Figma:** OAuth app + plugin (React/TS) communicating with backend via signed requests.  
- **Slack/Notion/Drive/Dropbox/Zapier:** OAuth + webhooks; background sync workers; per‑org connectors.

**Observability & Ops**
- Sentry + OpenTelemetry.  
- Feature flags (Unleash).  
- IaC: Terraform; CI/CD GitHub Actions.  
- Backups & disaster recovery RPO 24h, RTO 4h.

---

## 9) Data model (core entities)
- **User**(id, name, email, org_id, role)  
- **Org**(id, name, plan, quotas)  
- **Project**(id, org_id, address, lat/lng, status)  
- **File**(id, project_id, type, url, size, pages)  
- **ParsedFeatures**(id, project_id, geojson, scale, confidence)  
- **Scene**(id, project_id, json, version, preview_url)  
- **Material**(id, name, maps, params)  
- **Environment**(id, hdr_url, sun_time, preset)  
- **MapImagery**(id, project_id, provider, type, lat, lng, zoom, bbox, attribution, expires_at, url)  
- **RenderJob**(id, project_id, type, params, status, progress, eta, cost)  
- **Deliverable**(id, job_id, kind, url, size)  
- **Order**(id, org_id, items, total, currency, payment_status)  
- **Integration**(id, org_id, provider, scopes, status, tokens_meta)  
- **IntegrationEvent**(id, integration_id, type, payload, ts)  
- **Comment**(id, project_id, target_ref, body, author_id)  
- **AuditLog**(id, actor_id, action, payload, ts)

---

## 10) API sketch
```
POST /auth/magic-link
POST /projects {address}
POST /projects/:id/files (multipart)
POST /projects/:id/parse
GET  /projects/:id/scene
PUT  /projects/:id/scene
POST /render-jobs { projectId, kind: 'still'|'walkthrough', params }
GET  /render-jobs/:id
POST /orders/checkout
GET  /deliverables/:id

// Paid & integrations
GET  /maps/imagery?projectId=&address|ain=&zoom=   // fetch & cache signed URL (ephemeral)
POST /integrations/:provider/connect
DELETE /integrations/:provider
GET  /integrations
```

Scene JSON additions (excerpt):
```
{
  "background": {
    "provider": "google",
    "lat": 34.05, "lng": -118.24, "zoom": 19,
    "rotation": 15,
    "blend": 0.6, "brightness": 1.0, "contrast": 1.0, "blur": 0.1,
    "attribution": "© Google"
  },
  "video": {"captureShadows": true, "stabilize": true}
}
```

---

## 11) UX & visual design
- **Look:** calm, minimal, airy; plenty of whitespace.
- **Type:** Inter (UI) + Source Sans (labels). Sizes: 12/14/16/20/28/40.
- **Color:** grayscale UI with accent (brand primary). Success/Warning/Error neutrals.
- **Components:**
  - App shell with collapsible left sidebar (Projects, Files, Layers), right inspector tabs.
  - Sticky bottom bar for *Preview • Save • Order*.
  - Material swatch grid with search + drag‑to‑apply.
  - Lighting dial (time‑of‑day scrubber) + geo sun toggle.
  - Surroundings density slider + asset picker.
  - **Background** panel: address/APN/AIN input, alignment/zoom/rotation, blend/blur/brightness/contrast, Google attribution badge (non‑removable), “Apply to Video Export (paid)” toggle.
  - Camera bookmarks with thumbnails.
  - Render queue panel with progress and ETA chips.
  - **Integrations** page to connect Figma, Slack, Drive/Dropbox, Notion.
- **Interactions:**
  - Hover hints; Cmd/Ctrl+Z/Y undo/redo; hold Shift to constrain; double‑click to edit.
  - Smooth 200ms transitions; never block the canvas during uploads/parsing.
  - "Use Maps background" (paid) prompts for address/**APN/AIN** and shows preview with attribution.
- **Empty states:** friendly illustrations and 1‑click sample project.

---

## 12) Performance & quality
- 60 FPS target in preview; fallbacks for low‑end GPUs (LOD, texture size caps).  
- Lazy loading of heavy assets; texture streaming; Web Workers for parsing.  
- Preview memory cap ~1.2GB; background GC when tab hidden.  
- Video export: maintain shadow stability (temporal reprojection) and limit shimmer.  
- Cross‑browser: Chrome, Edge, Safari Tech Preview (WebGPU gated), Firefox (WebGL2).

---

## 13) Security & privacy
- SSO (Google), MFA optional.  
- Row‑level security by org; signed URLs; least‑privilege IAM.  
- **Maps:** adhere to Google Maps Platform Terms; attribution badges required; cache imagery ephemerally; prohibit exporting raw imagery.  
- Data retention selectable per org (30/90/365d).  
- GDPR/CCPA ready; PII encryption at rest (AES‑256) and in transit (TLS1.3).

---

## 14) Analytics & telemetry
- Events: upload_start/success, parse_success, scene_first_render, apply_material, start_checkout, place_order, render_complete, share_created, **maps_background_enabled**, **video_export_shadow_rt**, **integration_connected**.  
- Funnel dashboards; cohort of time‑to‑value.

---

## 15) Milestones & acceptance criteria
**M0 – Tech spike (2w):** parsing POC, WebGL preview at 60 FPS, basic material swap.  
**M1 – MVP (6–8w):** upload→parse→3D preview; materials/lighting; one environment preset; still render to 4K via cloud; Stripe checkout; **paid tier scaffolding** (feature flags, billing hooks).  
**M2 – Beta (6w):** walkthroughs; LUTs; vegetation presets; comments; share links; **real‑time shadowed video export (paid, beta)**; **Maps background (paid, beta) using address/APN/AIN**; **Figma plugin (alpha)**.  
**M3 – v1 GA (6w):** admin pricing, quotas, versioning, analytics, render farm scaling; **Integrations** settings page; **Maps background GA**; **Figma plugin v1**.

**Key AC for GA**
- Plan upload to first orbitable 3D in < 60s (20MB test plan).  
- All rendering controls present: textures; lighting (GI + real‑time shadows); reflection/refraction; surroundings; color grading (LUT).  
- **Paid videos** include stabilized **real‑time shadows** matching preview quality.  
- **Maps background (paid)** aligns to parcel bounds within ≤1m at zoom ~19 (where imagery allows) and shows required Google attribution in both preview and exports.  
- 4K still render ≤ 8 min median on G5 GPU; video ≤ 30 min for 20s path.  
- Payments reliable; deliverables downloadable and watermarked if chosen.  
- Figma plugin can push ≥ 3 snapshots from a project into a chosen Figma page in ≤ 10s.

---

## 16) Risks & mitigations
- **Parsing accuracy** → provide manual correction tools, confidence overlays.  
- **GPU cost spikes** → job time caps, spot instances, quality tiers.  
- **Browser perf variance** → capability detection, dynamic LOD & effect toggles.  
- **Licensing/ToS (Maps imagery)** → attribution & usage controls baked into UI + server‑side guardrails.  
- **Integration token security** → short‑lived tokens, encrypted at rest, limited scopes.

---

## 17) QA plan
- Gold‑set plans (10) with ground truth; visual regression on renders.  
- Cross‑GPU test matrix (Intel iGPU, M‑series, RTX 20/30/40).  
- Shadow stability suite (camera pan/tilt/orbit) with pass/fail on flicker threshold.  
- Maps alignment tests vs. known parcel corners (≤1m).  
- Accessibility checks (axe) and keyboard paths for every panel.  
- Integration smoke tests (Figma connect/push; Slack webhook; Drive import).

---

## 18) Open decisions (to lock before GA)
- Choose cloud renderer: **Blender Cycles** default, optional Unreal path tracer.  
- Stretch formats: DWG/DXF licensing or cloud conversion.  
- Which zoning/parcel providers (Mapbox/Esri/County open data).  
- Final list of imagery zoom limits & pricing per tier.

---

## 19) Appendices
- **Default materials:** wood (oak, cedar), rammed earth (3 variants), concrete (cast, board‑formed), tile (ceramic, stone), glass (clear, frosted), water (pond/pool).  
- **Default LUTs:** warm_earthy, neutral, dusk_cool.  
- **HDRIs:** desert_sunny, overcast_soft, golden_hour.

---

> This PRD is written for an AI engineering agent to generate code, assets, and infra with minimal back‑and‑forth. Keep the UX simple, interactions snappy, and the visuals cinematic yet realistic.

