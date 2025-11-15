#!/bin/bash

# Production Deployment Script for Abode AI
# Starts all backend services in production mode

set -e

echo "🚀 Starting Abode AI Production Services..."
echo ""

# Colors for output
GREEN='\033[0.32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to start a service
start_service() {
    local service_name=$1
    local service_path=$2

    echo -e "${BLUE}Starting $service_name...${NC}"

    if [ -d "$service_path" ]; then
        cd "$service_path"
        docker-compose up -d
        cd - > /dev/null
        echo -e "${GREEN}✓ $service_name started${NC}"
    else
        echo -e "${YELLOW}⚠ $service_name directory not found at $service_path${NC}"
    fi
    echo ""
}

# Start all services
start_service "AI Parsing (YOLOv8)" "docker/ai-parsing"
start_service "ifcopenshell" "docker/ifcopenshell"
start_service "AI Lighting" "docker/ai-lighting"
start_service "Wind Flow CFD" "docker/cfd"
start_service "OpenTelemetry Stack" "docker/observability"
start_service "ELK Stack" "docker/elk"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All services started successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Service URLs:"
echo "  • AI Parsing:      http://localhost:8003"
echo "  • ifcopenshell:    http://localhost:8004"
echo "  • AI Lighting:     http://localhost:8005"
echo "  • CFD Server:      http://localhost:8000"
echo "  • Jaeger UI:       http://localhost:16686"
echo "  • Prometheus:      http://localhost:9090"
echo "  • Grafana:         http://localhost:3001"
echo "  • Kibana:          http://localhost:5601"
echo ""
echo "To view logs: docker-compose logs -f <service-name>"
echo "To stop all:  ./scripts/stop-production.sh"
echo ""
