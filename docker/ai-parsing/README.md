# AI Parsing Service - Production Backend

Production-ready object detection and image analysis using YOLOv8.

## Features

- **YOLOv8 Object Detection** - Fast and accurate
- **Scale Detection** - OCR-based scale detection in architectural drawings
- **Floor Plan Analysis** - Comprehensive analysis with categorization
- **Multiple Model Support** - yolov8n, yolov8s, yolov8m, yolov8l, yolov8x
- **Health Checks** - Built-in health monitoring

## Quick Start

```bash
cd docker/ai-parsing
docker-compose up -d
```

The service will be available at `http://localhost:8003`

## API Endpoints

### Health Check
```bash
GET http://localhost:8003/health
```

### YOLO Detection
```bash
POST http://localhost:8003/yolo/detect
Content-Type: application/json

{
  "image": "base64_encoded_image",
  "conf_threshold": 0.25,
  "iou_threshold": 0.45,
  "model": "yolov8n"
}
```

### Detectron2 (fallback to YOLO)
```bash
POST http://localhost:8003/detectron2/predict
```

### Scale Detection
```bash
POST http://localhost:8003/detect-scale
Content-Type: application/json

{
  "image": "base64_encoded_image"
}
```

### Floor Plan Analysis
```bash
POST http://localhost:8003/analyze-floor-plan
Content-Type: application/json

{
  "image": "base64_encoded_image"
}
```

## Configuration

Set environment variable in TypeScript service:
```typescript
AI_PARSING_ENDPOINT=http://localhost:8003
```

## Model Files

Models are automatically downloaded on first use and cached in `./models/` directory.

Available models:
- `yolov8n.pt` - Nano (fastest, ~6MB)
- `yolov8s.pt` - Small (~22MB)
- `yolov8m.pt` - Medium (~52MB)
- `yolov8l.pt` - Large (~87MB)
- `yolov8x.pt` - Extra Large (best accuracy, ~136MB)

## Production Deployment

For production, use docker-compose with resource limits:

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 4G
```

## Monitoring

Check service health:
```bash
curl http://localhost:8003/health
```

View logs:
```bash
docker-compose logs -f ai-parsing
```

## Performance

- **Inference Time**: ~50-200ms per image (depends on model and image size)
- **Memory Usage**: 1-4GB (depends on model)
- **Concurrent Requests**: Supports multiple concurrent requests

## Integration with Frontend

The TypeScript service at `lib/services/ai-parsing.ts` automatically uses this backend when `AI_PARSING_ENDPOINT` is configured.
