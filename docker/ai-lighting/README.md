# AI Lighting Optimization Service - Production Backend

ML-based lighting analysis, natural lighting calculations, and AI-powered optimization.

## Features

- **Lighting Quality Analysis** - Score and recommend improvements
- **Natural Lighting Calculation** - Solar position and skylight simulation
- **Auto Light Placement** - AI-powered optimal light positioning
- **Multiple Lighting Goals** - Natural, dramatic, and even lighting presets

## Quick Start

```bash
cd docker/ai-lighting
docker-compose up -d
```

The service will be available at `http://localhost:8005`

## API Endpoints

### Health Check
```bash
GET http://localhost:8005/health
```

### Analyze Lighting Setup
```bash
POST http://localhost:8005/analyze
Content-Type: application/json

{
  "lights": [
    {
      "type": "point",
      "position": {"x": 5, "y": 5, "z": 0},
      "intensity": 1.0,
      "color": "#ffffff"
    }
  ],
  "cameraPosition": {"x": 0, "y": 1.6, "z": 0}
}
```

**Response:**
```json
{
  "overallScore": 0.75,
  "metrics": {
    "illuminance": 450,
    "colorTemperature": 5000,
    "coverage": 0.8,
    "shadowQuality": 0.6
  },
  "recommendations": [
    "Add fill lights to soften shadows"
  ]
}
```

### Calculate Natural Lighting
```bash
POST http://localhost:8005/natural-lighting
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "date": "2025-06-21T12:00:00Z",
  "time": 14,
  "cloudCover": 0.2,
  "buildingOrientation": 0
}
```

**Response:**
```json
{
  "sunPosition": {
    "altitude": 73.5,
    "azimuth": 180.2
  },
  "sunColor": "#fffaf4",
  "sunIntensity": 0.95,
  "skyLightIntensity": 0.28,
  "colorTemperature": 5700,
  "recommendedHDRI": "clear_sky.hdr"
}
```

### Optimize Light Placement
```bash
POST http://localhost:8005/optimize
Content-Type: application/json

{
  "sceneBounds": {
    "minX": -10,
    "maxX": 10,
    "minZ": -10,
    "maxZ": 10
  },
  "targetIlluminance": 500,
  "lightingGoal": "even"
}
```

**Response:**
```json
{
  "lights": [
    {
      "type": "point",
      "position": {"x": 4, "y": 8, "z": 4},
      "intensity": 0.8,
      "color": "#ffffff",
      "name": "Top Right"
    }
  ],
  "estimatedIlluminance": 500,
  "configuration": "even"
}
```

## Lighting Goals

- **natural** - Simulates natural daylight (key + fill)
- **dramatic** - High-contrast artistic lighting
- **even** - Studio-style even illumination (4-point)

## Configuration

Set environment variable in TypeScript service:
```env
AI_LIGHTING_ENDPOINT=http://localhost:8005
```

## Performance

- **Analysis Time**: ~10-50ms per request
- **Memory Usage**: 1-2GB
- **Concurrent Requests**: Supports multiple concurrent requests

## Production Deployment

For production, use docker-compose with resource limits:

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 2G
```

## Monitoring

Check service health:
```bash
curl http://localhost:8005/health
```

View logs:
```bash
docker-compose logs -f ai-lighting
```

## Integration with Frontend

The TypeScript service at `lib/services/ai-lighting.ts` automatically uses this backend when `AI_LIGHTING_ENDPOINT` is configured.
