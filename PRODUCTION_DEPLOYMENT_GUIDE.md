# Production Deployment Guide

Complete guide to deploying Abode AI to production with all features fully functional.

---

## Quick Start

```bash
# 1. Copy environment configuration
cp .env.production.example .env.production

# 2. Edit .env.production with your API keys and configuration
nano .env.production

# 3. Start all backend services
chmod +x scripts/start-production.sh
./scripts/start-production.sh

# 4. Start the Next.js application
npm run build
npm run start
```

---

## Backend Services Overview

### 1. AI Parsing Service (Port 8003)
**Purpose:** YOLOv8-based object detection for floor plans and images

**Start:**
```bash
cd docker/ai-parsing
docker-compose up -d
```

**Healthcheck:**
```bash
curl http://localhost:8003/health
```

**Features:**
- YOLOv8 object detection
- Scale detection in architectural drawings
- Floor plan analysis
- Automatic model downloading

**Configuration:**
```.env
AI_PARSING_ENDPOINT=http://localhost:8003
```

---

### 2. ifcopenshell Service (Port 8004)
**Purpose:** Advanced IFC/BIM processing and validation

**Start:**
```bash
cd docker/ifcopenshell
docker-compose up -d
```

**Healthcheck:**
```bash
curl http://localhost:8004/health
```

**Features:**
- IFC validation
- Geometry extraction
- Property set management
- Relationship traversal
- Compliance checking (IFC2x3, IFC4, IFC4.3)

**Configuration:**
```env
IFCOPENSHELL_ENDPOINT=http://localhost:8004
```

---

### 3. Wind Flow CFD (Ports 8000-8002)
**Purpose:** Computational Fluid Dynamics simulations

**Start:**
```bash
cd docker/cfd
docker-compose up -d
```

**Services:**
- CFD Server (8000) - OpenFOAM simulations
- Mesh Generator (8001) - Mesh creation
- Post-processor (8002) - Results processing

**Configuration:**
Already configured in TypeScript service

---

### 4. OpenTelemetry Stack (Multiple Ports)
**Purpose:** Distributed tracing and metrics

**Start:**
```bash
cd docker/observability
docker-compose up -d
```

**Services:**
- Jaeger UI (16686) - Trace visualization
- Prometheus (9090) - Metrics storage
- Grafana (3001) - Dashboards
- OTEL Collector (4318) - Data processing

**Configuration:**
```env
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

---

### 5. ELK Stack (Ports 9200, 5601, 5000)
**Purpose:** Centralized logging

**Start:**
```bash
cd docker/elk
docker-compose up -d
```

**Services:**
- Elasticsearch (9200) - Log storage
- Kibana (5601) - Log visualization
- Logstash (5000) - Log processing

---

## AI Service Configuration

### OpenAI Integration (RAG & Reasoning)

**Required for:**
- Multi-step Reasoning (LLM)
- RAG System (Embeddings)

**Setup:**
```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4
```

**TypeScript Service Update:**
File: `lib/services/multi-step-reasoning.ts`

```typescript
// Add to generateThought method:
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{role: 'user', content: query}]
  })
})
```

---

### Rodin AI Configuration

**Required for:**
- Text-to-3D generation
- Image-to-3D conversion
- Texture synthesis

**Setup:**
1. Sign up at https://hyperhuman.deemos.com/rodin
2. Get API key
3. Configure:

```env
NEXT_PUBLIC_RODIN_API_KEY=your-rodin-key
```

**Already Integrated:** Service automatically uses API key when available

---

### Partner Integrations

#### Coohom (80M+ Models)

**Setup:**
```env
COOHOM_API_KEY=your-key
COOHOM_BASE_URL=https://api.coohom.com/v1
```

#### AIHouse

**Setup:**
```env
AIHOUSE_API_KEY=your-key
AIHOUSE_BASE_URL=https://api.aihouse.com/v2
```

---

## Geospatial Data Integration

### USGS Seismic Data

**For:** Seismic risk assessment

**Setup:**
```env
USGS_API_KEY=your-usgs-key
```

**Integration Point:**
File: `lib/services/predictive-risk-models.ts`

```typescript
private async getSeismicZone(lat: number, lon: number) {
  const response = await fetch(
    `https://earthquake.usgs.gov/ws/designmaps/asce7-16.json?latitude=${lat}&longitude=${lon}&riskCategory=ii&siteClass=c&title=Abode`,
    {headers: {'Authorization': `Bearer ${process.env.USGS_API_KEY}`}}
  )
  const data = await response.json()
  return {
    zone: data.response.data.ss >= 1.5 ? 4 : 2,
    pga: data.response.data.pga
  }
}
```

### FEMA Flood Data

**For:** Flood risk assessment

**Setup:**
```env
FEMA_API_KEY=your-fema-key
```

**Integration:**
```typescript
private async getFloodZone(lat: number, lon: number) {
  const response = await fetch(
    `https://hazards.fema.gov/gis/nfhl/rest/services/FIRMette/GPServer/FIRMette/execute`,
    {
      method: 'POST',
      headers: {'Authorization': `Bearer ${process.env.FEMA_API_KEY}`},
      body: JSON.stringify({Lat: lat, Long: lon})
    }
  )
  return await response.json()
}
```

---

## Edge Computing Configuration

### Cloudflare Workers

**Setup:**
```env
CLOUDFLARE_API_KEY=your-key
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_ZONE_ID=your-zone-id
```

**Deploy Function:**
```typescript
import { edgeComputing } from '@/lib/services/edge-computing'

await edgeComputing.deployFunction({
  name: 'model-optimizer',
  code: 'export default () => "Hello from edge"',
  runtime: 'nodejs'
})
```

---

## Discourse Forum Integration

**Setup:**
1. Deploy Discourse instance (https://github.com/discourse/discourse)
2. Configure SSO
3. Set environment variables:

```env
DISCOURSE_URL=https://forum.your-domain.com
DISCOURSE_API_KEY=your-api-key
DISCOURSE_USERNAME=system
DISCOURSE_SSO_SECRET=your-secret
```

---

## Production Checklist

### Pre-Deployment

- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Fill in all API keys
- [ ] Review resource limits in docker-compose files
- [ ] Set up SSL certificates
- [ ] Configure firewall rules
- [ ] Set up backup strategy

### Deployment Steps

- [ ] Start backend services (`./scripts/start-production.sh`)
- [ ] Verify all health checks pass
- [ ] Build Next.js application (`npm run build`)
- [ ] Run database migrations
- [ ] Start Next.js (`npm run start`)
- [ ] Verify application loads
- [ ] Run smoke tests

### Post-Deployment

- [ ] Configure monitoring alerts
- [ ] Set up log rotation
- [ ] Configure automated backups
- [ ] Test disaster recovery
- [ ] Document runbook procedures

---

## Monitoring

### Health Checks

```bash
# Check all services
./scripts/health-check.sh
```

### View Logs

```bash
# AI Parsing
docker-compose -f docker/ai-parsing/docker-compose.yml logs -f

# ifcopenshell
docker-compose -f docker/ifcopenshell/docker-compose.yml logs -f

# CFD
docker-compose -f docker/cfd/docker-compose.yml logs -f
```

### Metrics

- **Jaeger:** http://localhost:16686
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3001 (admin/admin)
- **Kibana:** http://localhost:5601

---

## Scaling

### Horizontal Scaling

All backend services support horizontal scaling:

```yaml
# docker-compose.yml
services:
  ai-parsing:
    deploy:
      replicas: 3
```

### Load Balancing

Use nginx or Traefik for load balancing:

```nginx
upstream ai-parsing {
    server localhost:8003;
    server localhost:8013;
    server localhost:8023;
}
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs service-name

# Check health
curl http://localhost:PORT/health

# Restart service
docker-compose restart service-name
```

### High Memory Usage

```bash
# Check resource usage
docker stats

# Adjust limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 4G
```

### API Integration Failures

1. Verify API keys in `.env.production`
2. Check network connectivity
3. Review rate limits
4. Check service logs

---

## Security

### API Key Management

- Store keys in `.env.production` (never commit!)
- Use environment-specific keys
- Rotate keys regularly
- Use secrets management (AWS Secrets Manager, HashiCorp Vault)

### Network Security

- Use firewall to restrict port access
- Enable SSL/TLS for all services
- Use VPN for internal services
- Implement rate limiting

### Container Security

- Use official base images
- Scan images for vulnerabilities
- Run containers as non-root
- Keep images updated

---

## Backup & Recovery

### Database Backups

```bash
# PostgreSQL
pg_dump -U user abode_ai > backup.sql

# Restore
psql -U user abode_ai < backup.sql
```

### Model Files

```bash
# Backup YOLO models
tar -czf models-backup.tar.gz docker/ai-parsing/models/

# Restore
tar -xzf models-backup.tar.gz -C docker/ai-parsing/
```

### Configuration

```bash
# Backup .env
cp .env.production .env.production.backup

# Backup docker volumes
docker run --rm -v volume_name:/data -v $(pwd):/backup busybox tar czf /backup/volume-backup.tar.gz /data
```

---

## Performance Optimization

### Database

- Add indexes on frequently queried columns
- Use connection pooling
- Enable query caching
- Partition large tables

### Caching

- Use Redis for session storage
- Cache API responses
- Enable CDN caching
- Use service worker caching

### Backend Services

- Use GPU for AI inference (if available)
- Enable batch processing
- Implement request queuing
- Use async operations

---

## Support

For issues and questions:

1. Check logs: `docker-compose logs service-name`
2. Review health checks: `curl http://localhost:PORT/health`
3. Check GitHub issues: https://github.com/YourOrg/Abode_AI/issues
4. Contact support: support@your-domain.com

---

## Updates

### Updating Services

```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d

# Check status
docker-compose ps
```

### Updating Application

```bash
git pull origin main
npm install
npm run build
pm2 restart abode-ai
```

---

**Last Updated:** November 15, 2025
**Version:** 1.0.0
