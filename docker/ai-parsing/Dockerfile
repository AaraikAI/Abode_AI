FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    wget \
    libopencv-dev \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip install --no-cache-dir \
    flask==3.0.0 \
    flask-cors==4.0.0 \
    opencv-python==4.8.1.78 \
    numpy==1.24.3 \
    pillow==10.1.0 \
    torch==2.1.0 \
    torchvision==0.16.0 \
    ultralytics==8.0.200 \
    pytesseract==0.3.10

# For Detectron2 (optional - requires more resources)
# RUN pip install 'git+https://github.com/facebookresearch/detectron2.git'

WORKDIR /app

COPY server.py /app/
COPY models/ /app/models/

EXPOSE 8003

CMD ["python", "server.py"]
