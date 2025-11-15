# AI Lighting Optimization - Production Backend
# ML-based lighting analysis and optimization

FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    flask==3.0.0 \
    flask-cors==4.0.0 \
    numpy==1.24.3 \
    scikit-learn==1.3.2 \
    scipy==1.11.4 \
    pillow==10.1.0 \
    opencv-python-headless==4.8.1.78

# Copy application files
COPY server.py /app/
COPY models/ /app/models/

# Expose port
EXPOSE 8005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8005/health')"

# Run server
CMD ["python", "server.py"]
