# Small Language Model (SLM) Deployment Guide

Guide to deploying small language models for local inference with Abode AI.

---

## Overview

The SLM service supports multiple deployment options:
- **Browser-based** - WebGPU, WASM, Transformers.js
- **Server-based** - Ollama, vLLM, text-generation-webui

For production, we recommend **server-based** deployment for better performance and resource management.

---

## Quick Start - Ollama (Recommended)

Ollama provides the simplest deployment for small language models.

### 1. Install Ollama

```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download
```

### 2. Pull a Model

```bash
# Phi-3 Mini (3.8B) - Recommended
ollama pull phi3:mini

# Llama 3.2 (3B)
ollama pull llama3.2

# Qwen 2.5 (3B)
ollama pull qwen2.5:3b

# Gemma 2B
ollama pull gemma:2b
```

### 3. Start Ollama Server

```bash
ollama serve
```

The server will be available at `http://localhost:11434`

### 4. Configure Abode AI

```env
SLM_BACKEND=server
SLM_SERVER_ENDPOINT=http://localhost:11434
SLM_MODEL_ID=phi3:mini
```

### 5. Use in Code

```typescript
import { slm } from '@/lib/services/slm'

const response = await slm.infer({
  prompt: 'Describe a modern living room design',
  maxTokens: 256,
  temperature: 0.7
})

console.log(response.generated)
```

---

## Option 2: vLLM (Production)

vLLM provides optimized inference for production workloads.

### Docker Deployment

```bash
# Create docker-compose.yml
cat > docker/slm/docker-compose.yml << 'EOF'
version: '3.8'

services:
  vllm:
    image: vllm/vllm-openai:latest
    container_name: abode-slm-vllm
    ports:
      - "8006:8000"
    environment:
      - MODEL_NAME=microsoft/Phi-3-mini-4k-instruct
      - TENSOR_PARALLEL_SIZE=1
      - GPU_MEMORY_UTILIZATION=0.9
    volumes:
      - ./models:/root/.cache/huggingface
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    command: --model microsoft/Phi-3-mini-4k-instruct --port 8000

networks:
  default:
    name: abode-network
EOF

# Start vLLM
cd docker/slm
docker-compose up -d
```

### Configuration

```env
SLM_BACKEND=server
SLM_SERVER_ENDPOINT=http://localhost:8006/v1
SLM_MODEL_ID=microsoft/Phi-3-mini-4k-instruct
```

---

## Option 3: text-generation-webui

Comprehensive UI and API for local LLMs.

### Installation

```bash
# Clone repository
git clone https://github.com/oobabooga/text-generation-webui
cd text-generation-webui

# Install dependencies
pip install -r requirements.txt

# Download model
python download-model.py microsoft/Phi-3-mini-4k-instruct

# Start server with API
python server.py --api --listen --listen-port 8007
```

### Configuration

```env
SLM_BACKEND=server
SLM_SERVER_ENDPOINT=http://localhost:8007/api/v1
SLM_MODEL_ID=microsoft/Phi-3-mini-4k-instruct
```

---

## Option 4: Browser-based (WebGPU)

For lightweight, privacy-focused deployment without a server.

### Requirements

- Modern browser with WebGPU support (Chrome 113+, Edge 113+)
- Sufficient RAM (4GB+ for 3B models)

### Installation

```bash
npm install @huggingface/transformers
# or
npm install @mlc-ai/web-llm
```

### Configuration

```typescript
import { SLMService } from '@/lib/services/slm'

const slm = new SLMService({
  modelId: 'Xenova/Phi-3-mini-4k-instruct',
  modelType: 'phi-3',
  backend: 'webgpu',
  quantization: 'int4'
})

await slm.loadModel()
```

---

## Supported Models

### Phi-3 Mini (Recommended)
- **Size:** 3.8B parameters
- **Context:** 4K tokens
- **Strengths:** Excellent quality-to-size ratio, fast inference
- **Use Cases:** General chat, code generation, analysis

```bash
# Ollama
ollama pull phi3:mini

# Hugging Face
microsoft/Phi-3-mini-4k-instruct
```

### Llama 3.2
- **Size:** 1B / 3B parameters
- **Context:** 128K tokens
- **Strengths:** Latest Meta model, long context
- **Use Cases:** Document analysis, long conversations

```bash
# Ollama
ollama pull llama3.2

# Hugging Face
meta-llama/Llama-3.2-3B-Instruct
```

### Qwen 2.5
- **Size:** 0.5B / 1.5B / 3B parameters
- **Context:** 32K tokens
- **Strengths:** Multilingual, code-focused
- **Use Cases:** Code generation, multilingual support

```bash
# Ollama
ollama pull qwen2.5:3b

# Hugging Face
Qwen/Qwen2.5-3B-Instruct
```

### Gemma 2B
- **Size:** 2B parameters
- **Context:** 8K tokens
- **Strengths:** Google model, efficient
- **Use Cases:** Lightweight inference, mobile deployment

```bash
# Ollama
ollama pull gemma:2b

# Hugging Face
google/gemma-2b-it
```

---

## Performance Comparison

| Model | Size | Speed (tokens/s) | Memory | Quality |
|-------|------|------------------|--------|---------|
| Phi-3 Mini | 3.8B | 30-50 | 8GB | ⭐⭐⭐⭐⭐ |
| Llama 3.2 3B | 3B | 35-55 | 6GB | ⭐⭐⭐⭐ |
| Qwen 2.5 3B | 3B | 40-60 | 6GB | ⭐⭐⭐⭐ |
| Gemma 2B | 2B | 50-70 | 4GB | ⭐⭐⭐ |

*Tested on: NVIDIA RTX 4090, int8 quantization*

---

## Production Deployment

### Docker Stack (Recommended)

```bash
# Complete deployment with all services
cd docker/slm
docker-compose up -d

# Health check
curl http://localhost:8006/health

# Test inference
curl http://localhost:8006/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "microsoft/Phi-3-mini-4k-instruct",
    "prompt": "Design a living room:",
    "max_tokens": 100
  }'
```

### Environment Configuration

Add to `.env.production`:

```env
# SLM Service Configuration
SLM_BACKEND=server
SLM_SERVER_ENDPOINT=http://localhost:8006/v1
SLM_MODEL_ID=microsoft/Phi-3-mini-4k-instruct
SLM_QUANTIZATION=int8
SLM_MAX_TOKENS=512
SLM_TEMPERATURE=0.7
```

### Scaling

For high-traffic production:

```yaml
# docker-compose.yml
services:
  vllm:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '4'
          memory: 16G
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

---

## Fine-tuning

### Prepare Dataset

```json
[
  {
    "instruction": "Describe a modern interior design style",
    "input": "",
    "output": "Modern interior design features clean lines, minimal ornamentation..."
  }
]
```

### Train with LoRA

```bash
# Using Hugging Face transformers
python fine_tune.py \
  --model_name microsoft/Phi-3-mini-4k-instruct \
  --dataset_path ./data/interior_design.json \
  --output_dir ./models/phi3-interior-design \
  --num_epochs 3 \
  --batch_size 4 \
  --learning_rate 2e-5
```

### Deploy Fine-tuned Model

```bash
# With Ollama
ollama create phi3-interior-design -f ./models/phi3-interior-design/Modelfile

# With vLLM
docker run -v ./models:/models vllm/vllm-openai \
  --model /models/phi3-interior-design \
  --port 8006
```

---

## Monitoring

### Health Checks

```bash
# Ollama
curl http://localhost:11434/api/tags

# vLLM
curl http://localhost:8006/health

# Check model loaded
curl http://localhost:8006/v1/models
```

### Metrics

```bash
# vLLM includes Prometheus metrics
curl http://localhost:8006/metrics
```

---

## Troubleshooting

### Out of Memory

```bash
# Reduce model size
ollama pull phi3:mini-q4_0  # 4-bit quantization

# Limit context window
export OLLAMA_MAX_LOADED_MODELS=1
export OLLAMA_NUM_PARALLEL=1
```

### Slow Inference

```bash
# Enable GPU acceleration
export CUDA_VISIBLE_DEVICES=0

# Use quantized models
--quantization int8

# Reduce batch size
--max-batch-size 32
```

### Connection Issues

```bash
# Check service is running
docker ps | grep slm

# Check logs
docker logs abode-slm-vllm

# Test connection
curl http://localhost:8006/health
```

---

## Cost Comparison

| Deployment | Cost/month | Requests/day | Latency |
|------------|------------|--------------|---------|
| Local (Ollama) | $0 | Unlimited | 50-100ms |
| Cloud GPU (1x A10) | $300 | Unlimited | 30-50ms |
| OpenAI GPT-4 | $600 | 60,000 | 500-1000ms |
| Anthropic Claude | $480 | 60,000 | 400-800ms |

*Based on 60K requests/day, 100 tokens/request*

---

## Best Practices

1. **Use quantized models** (int8/int4) for better memory efficiency
2. **Monitor memory usage** to prevent OOM crashes
3. **Set context limits** based on your use case
4. **Implement caching** for repeated queries
5. **Use batching** for multiple requests
6. **Profile inference times** to optimize performance
7. **Version control models** for reproducibility

---

## Support

- **Ollama Documentation:** https://github.com/ollama/ollama
- **vLLM Documentation:** https://docs.vllm.ai
- **Hugging Face Models:** https://huggingface.co/models
- **WebGPU Status:** https://webgpureport.org

---

**Last Updated:** November 15, 2025
**Version:** 1.0.0
