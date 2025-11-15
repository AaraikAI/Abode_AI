FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    git \
    build-essential \
    flex \
    bison \
    cmake \
    zlib1g-dev \
    libboost-system-dev \
    libboost-thread-dev \
    libopenmpi-dev \
    openmpi-bin \
    gnuplot \
    libreadline-dev \
    libncurses-dev \
    libxt-dev \
    qt5-default \
    libqt5x11extras5-dev \
    libqt5help5 \
    qttools5-dev \
    qtxmlpatterns5-dev-tools \
    libqt5opengl5-dev \
    libqt5svg5-dev \
    libscotch-dev \
    libcgal-dev \
    libfftw3-dev \
    python3 \
    python3-pip \
    python3-dev \
    python3-numpy \
    python3-scipy \
    python3-matplotlib \
    vim \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip3 install --no-cache-dir \
    flask \
    flask-cors \
    numpy \
    scipy \
    matplotlib \
    vtk \
    pillow \
    pyyaml \
    trimesh \
    meshio

# Download and install OpenFOAM 10
RUN wget -O - https://dl.openfoam.org/gpg.key | apt-key add - && \
    echo "deb http://dl.openfoam.org/ubuntu jammy main" > /etc/apt/sources.list.d/openfoam.list && \
    apt-get update && \
    apt-get install -y openfoam10 && \
    rm -rf /var/lib/apt/lists/*

# Set OpenFOAM environment
ENV FOAM_INST_DIR=/opt/openfoam10
ENV WM_PROJECT_USER_DIR=/cases
ENV PATH=$FOAM_INST_DIR/bin:$PATH

# Source OpenFOAM bashrc
RUN echo "source /opt/openfoam10/etc/bashrc" >> /root/.bashrc

# Create working directories
RUN mkdir -p /cases /meshes /results /geometries /visualizations /app

# Copy CFD server applications
COPY cfd-server.py /app/
COPY mesh-server.py /app/
COPY post-processor.py /app/
COPY utils /app/utils

# Set working directory
WORKDIR /app

# Expose ports
EXPOSE 8000 8001 8002

# Default command
CMD ["bash"]
