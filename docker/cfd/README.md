# Wind Flow CFD Service - Production Stack

OpenFOAM-based computational fluid dynamics for wind flow analysis.

## Services

This stack includes 4 services:

1. **OpenFOAM Solver** (Port 8000) - CFD simulation engine
2. **Mesh Generator** (Port 8001) - Mesh generation with snappyHexMesh
3. **Post-Processor** (Port 8002) - Results processing and visualization
4. **ParaView** (Port 11111) - Interactive visualization

## Quick Start

```bash
cd docker/cfd
docker-compose up -d
```

## API Endpoints

### CFD Solver (Port 8000)

**Start Simulation:**
```bash
POST http://localhost:8000/simulate
Content-Type: application/json

{
  "geometry": {
    "buildings": [...],
    "terrain": {...}
  },
  "windDirection": 45,
  "windSpeed": 5.0,
  "timeSteps": 1000
}
```

**Get Status:**
```bash
GET http://localhost:8000/status/<simulation_id>
```

**Get Results:**
```bash
GET http://localhost:8000/results/<simulation_id>
```

### Mesh Generator (Port 8001)

**Generate Mesh:**
```bash
POST http://localhost:8001/generate
Content-Type: application/json

{
  "geometry": {...},
  "resolution": "medium",
  "refinement": ["buildings", "ground"]
}
```

**Get Mesh Info:**
```bash
GET http://localhost:8001/info/<mesh_id>
```

### Post-Processor (Port 8002)

**Process Results:**
```bash
POST http://localhost:8002/process/<simulation_id>
Content-Type: application/json

{
  "fields": ["U", "p"],
  "operations": ["statistics", "extract"]
}
```

**Wind Comfort Analysis:**
```bash
GET http://localhost:8002/wind-comfort/<simulation_id>
```

**Export Results:**
```bash
POST http://localhost:8002/export/<simulation_id>
Content-Type: application/json

{
  "format": "vtk",
  "field": "U",
  "time": "latest"
}
```

## Configuration

Set environment variable in TypeScript service:
```env
WIND_FLOW_CFD_ENDPOINT=http://localhost:8000
```

## Deployment

### Production Deployment

```bash
# Start all CFD services
docker-compose up -d

# Check health
curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:8002/health

# View logs
docker-compose logs -f openfoam
```

### Resource Configuration

Edit `docker-compose.yml` for your hardware:

```yaml
services:
  openfoam:
    environment:
      - PARALLEL_CORES=8  # Set to your CPU count
    deploy:
      resources:
        limits:
          cpus: '8.0'
          memory: 16G
```

## Wind Comfort Criteria

The post-processor uses Lawson comfort criteria:

- **Sitting (long):** 0-2.5 m/s
- **Sitting (short):** 2.5-3.5 m/s
- **Standing:** 3.5-5.0 m/s
- **Walking (slow):** 5.0-8.0 m/s
- **Walking (fast):** 8.0-10.0 m/s
- **Uncomfortable:** >10.0 m/s

## Performance

- **Mesh Generation:** 30-300 seconds (depends on complexity)
- **Simulation:** 5-60 minutes (depends on domain size and time steps)
- **Post-processing:** 10-60 seconds

## Monitoring

```bash
# Check simulation status
docker exec abode-openfoam tail -f /cases/<simulation_id>/log.simpleFoam

# Monitor resource usage
docker stats abode-openfoam

# Check mesh quality
docker exec abode-mesh-generator checkMesh -case /meshes/<mesh_id>
```

## Troubleshooting

### Mesh Generation Fails

```bash
# Check geometry input
docker logs abode-mesh-generator

# Verify snappyHexMesh settings
docker exec abode-mesh-generator cat /meshes/<mesh_id>/system/snappyHexMeshDict
```

### Simulation Diverges

```bash
# Check residuals
docker exec abode-openfoam tail /cases/<simulation_id>/log.simpleFoam

# Adjust solver settings (reduce relaxation factors)
# Edit case dictionary files in /cases/<simulation_id>/system/
```

### Out of Memory

```bash
# Reduce mesh resolution
# Increase container memory limit
# Use parallel decomposition for large cases
```

## Integration with Frontend

The TypeScript service at `lib/services/wind-flow-cfd.ts` automatically uses these backends when configured.

## Visualization

Access ParaView web interface at `http://localhost:11111` for interactive visualization of results.

---

**Last Updated:** November 15, 2025
**Version:** 1.0.0
