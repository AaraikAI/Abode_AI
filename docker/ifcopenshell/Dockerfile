FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip install --no-cache-dir \
    flask==3.0.0 \
    flask-cors==4.0.0 \
    ifcopenshell==0.7.0 \
    numpy==1.24.3

WORKDIR /app

COPY server.py /app/

EXPOSE 8004

CMD ["python", "server.py"]
