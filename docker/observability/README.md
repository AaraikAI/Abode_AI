# Observability Stack

Complete observability stack with OpenTelemetry, Jaeger, Prometheus, and Grafana.

## Components

- **Jaeger**: Distributed tracing backend and UI
- **OpenTelemetry Collector**: Receives, processes, and exports telemetry data
- **Prometheus**: Metrics storage and querying
- **Grafana**: Unified visualization for metrics and traces

## Quick Start

```bash
cd docker/observability
docker-compose up -d
```

## Access UIs

- **Jaeger UI**: http://localhost:16686
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **OTEL Collector Health**: http://localhost:13133

## Configuration

### OpenTelemetry in Application

The application automatically sends traces and metrics to the collector:

```typescript
import { openTelemetry } from '@/lib/services/opentelemetry'

// Trace an operation
await openTelemetry.trace('myOperation', async (spanId) => {
  // Your code here
  openTelemetry.setSpanAttribute(spanId, 'user.id', userId)
  return result
})

// Record a metric
openTelemetry.recordMetric({
  name: 'custom.metric',
  value: 123,
  attributes: { environment: 'production' }
})
```

### Using Middleware

```typescript
import { withTracing } from '@/lib/middleware/tracing'

export const GET = withTracing(async (req) => {
  // Your API handler
  return NextResponse.json({ data })
})
```

## Data Flow

```
Application → OpenTelemetry Collector → Jaeger (traces)
                                      → Prometheus (metrics)
```

## Ports

| Service | Port | Purpose |
|---------|------|---------|
| Jaeger UI | 16686 | Web interface |
| Jaeger Collector | 14268 | Jaeger direct |
| OTLP gRPC | 4317 | OpenTelemetry gRPC |
| OTLP HTTP | 4318 | OpenTelemetry HTTP |
| Prometheus | 9090 | Metrics UI |
| Grafana | 3001 | Dashboards |

## Sample Queries

### Jaeger

- Search for traces by service: `service=abode-ai`
- Find slow requests: `minDuration=1s`
- Error traces: `error=true`

### Prometheus

```promql
# Request rate
rate(http_server_duration_count[5m])

# Error rate
rate(http_server_errors_total[5m])

# P95 latency
histogram_quantile(0.95, rate(http_server_duration_bucket[5m]))
```

## Grafana Dashboards

Import the pre-configured dashboards from `grafana/provisioning/dashboards/`.

## Production Considerations

1. **Data Retention**: Configure retention in Jaeger and Prometheus
2. **Sampling**: Adjust sample rate in OTEL collector config
3. **Resource Limits**: Set memory limits in docker-compose
4. **Authentication**: Enable auth in Grafana for production
5. **TLS**: Use TLS for collector endpoints in production
