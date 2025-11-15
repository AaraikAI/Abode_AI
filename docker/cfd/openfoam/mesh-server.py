#!/usr/bin/env python3
"""
Mesh Generation Server for OpenFOAM
Handles conversion of 3D models to CFD meshes using snappyHexMesh
"""

import os
import sys
import json
import subprocess
import shutil
import uuid
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import threading
import time
import trimesh
import numpy as np

app = Flask(__name__)
CORS(app)

GEOMETRIES_DIR = Path("/geometries")
MESHES_DIR = Path("/meshes")

# Active mesh generation jobs
mesh_jobs = {}
mesh_lock = threading.Lock()


class MeshGenerationJob:
    """Manages mesh generation from 3D geometry"""

    def __init__(self, job_id, geometry_file, config):
        self.id = job_id
        self.geometry_file = geometry_file
        self.config = config
        self.status = "queued"
        self.progress = 0
        self.mesh_dir = MESHES_DIR / job_id
        self.case_dir = self.mesh_dir / "case"
        self.start_time = None
        self.end_time = None
        self.error = None
        self.mesh_stats = None

    def setup_case(self):
        """Setup meshing case"""
        try:
            self.status = "setting_up"

            # Create directories
            self.mesh_dir.mkdir(parents=True, exist_ok=True)
            self.case_dir.mkdir(exist_ok=True)

            (self.case_dir / "0").mkdir(exist_ok=True)
            (self.case_dir / "constant").mkdir(exist_ok=True)
            (self.case_dir / "system").mkdir(exist_ok=True)
            (self.case_dir / "constant" / "triSurface").mkdir(exist_ok=True)

            # Convert geometry to STL if needed
            self._convert_geometry_to_stl()

            # Create blockMeshDict
            self._create_block_mesh_dict()

            # Create snappyHexMeshDict
            self._create_snappy_hex_mesh_dict()

            # Create mesh quality dict
            self._create_mesh_quality_dict()

            self.progress = 20
            return True

        except Exception as e:
            self.error = f"Setup failed: {str(e)}"
            self.status = "failed"
            return False

    def _convert_geometry_to_stl(self):
        """Convert input geometry to STL format"""
        src_file = GEOMETRIES_DIR / self.geometry_file
        dest_file = self.case_dir / "constant" / "triSurface" / "building.stl"

        if src_file.suffix.lower() in ['.stl', '.obj', '.ply', '.glb', '.gltf']:
            # Load mesh using trimesh
            mesh = trimesh.load(src_file)

            # Ensure it's a single mesh
            if isinstance(mesh, trimesh.Scene):
                mesh = mesh.dump(concatenate=True)

            # Get bounds for domain sizing
            bounds = mesh.bounds
            self.geometry_bounds = bounds

            # Export as STL
            mesh.export(dest_file, file_type='stl_ascii')

        else:
            raise ValueError(f"Unsupported geometry format: {src_file.suffix}")

    def _create_block_mesh_dict(self):
        """Create blockMesh dictionary for background mesh"""
        # Calculate domain size based on geometry bounds
        if not hasattr(self, 'geometry_bounds'):
            raise ValueError("Geometry bounds not available")

        bounds = self.geometry_bounds
        center = (bounds[0] + bounds[1]) / 2
        size = bounds[1] - bounds[0]

        # Domain should be ~5x the building size
        domain_factor = self.config.get('domain_factor', 5)
        domain_size = size * domain_factor

        # Domain extends upstream, downstream, and around
        x_min = center[0] - domain_size[0] * 0.5
        x_max = center[0] + domain_size[0] * 1.5  # More downstream
        y_min = center[1] - domain_size[1] * 0.5
        y_max = center[1] + domain_size[1] * 0.5
        z_min = 0  # Ground level
        z_max = domain_size[2] * 2  # Tall domain

        # Number of cells
        cell_size = self.config.get('cell_size', 1.0)
        nx = int((x_max - x_min) / cell_size)
        ny = int((y_max - y_min) / cell_size)
        nz = int((z_max - z_min) / cell_size)

        content = f"""/*--------------------------------*- C++ -*----------------------------------*\\
FoamFile
{{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      blockMeshDict;
}}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

convertToMeters 1;

vertices
(
    ({x_min} {y_min} {z_min})
    ({x_max} {y_min} {z_min})
    ({x_max} {y_max} {z_min})
    ({x_min} {y_max} {z_min})
    ({x_min} {y_min} {z_max})
    ({x_max} {y_min} {z_max})
    ({x_max} {y_max} {z_max})
    ({x_min} {y_max} {z_max})
);

blocks
(
    hex (0 1 2 3 4 5 6 7) ({nx} {ny} {nz}) simpleGrading (1 1 1)
);

edges
(
);

boundary
(
    inlet
    {{
        type patch;
        faces
        (
            (0 4 7 3)
        );
    }}
    outlet
    {{
        type patch;
        faces
        (
            (1 2 6 5)
        );
    }}
    walls
    {{
        type wall;
        faces
        (
            (0 1 5 4)
            (3 7 6 2)
        );
    }}
    ground
    {{
        type wall;
        faces
        (
            (0 3 2 1)
        );
    }}
    top
    {{
        type patch;
        faces
        (
            (4 5 6 7)
        );
    }}
);

mergePatchPairs
(
);
"""
        (self.case_dir / "system" / "blockMeshDict").write_text(content)

    def _create_snappy_hex_mesh_dict(self):
        """Create snappyHexMesh dictionary"""
        refinement_level = self.config.get('refinement_level', 3)

        content = f"""/*--------------------------------*- C++ -*----------------------------------*\\
FoamFile
{{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      snappyHexMeshDict;
}}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

castellatedMesh true;
snap            true;
addLayers       true;

geometry
{{
    building.stl
    {{
        type triSurfaceMesh;
        name building;
    }}
}};

castellatedMeshControls
{{
    maxLocalCells 100000000;
    maxGlobalCells 200000000;
    minRefinementCells 10;
    maxLoadUnbalance 0.10;
    nCellsBetweenLevels 3;

    features
    (
        {{
            file "building.eMesh";
            level {refinement_level};
        }}
    );

    refinementSurfaces
    {{
        building
        {{
            level ({refinement_level} {refinement_level});
            patchInfo
            {{
                type wall;
            }}
        }}
    }}

    refinementRegions
    {{
        building
        {{
            mode inside;
            levels ((1E15 {refinement_level}));
        }}
    }}

    locationInMesh (0.01 0.01 0.01);

    allowFreeStandingZoneFaces true;
}}

snapControls
{{
    nSmoothPatch 3;
    tolerance 2.0;
    nSolveIter 30;
    nRelaxIter 5;
    nFeatureSnapIter 10;
    implicitFeatureSnap false;
    explicitFeatureSnap true;
    multiRegionFeatureSnap false;
}}

addLayersControls
{{
    relativeSizes true;

    layers
    {{
        building
        {{
            nSurfaceLayers 3;
        }}
    }}

    expansionRatio 1.2;
    finalLayerThickness 0.3;
    minThickness 0.1;
    nGrow 0;
    featureAngle 130;
    slipFeatureAngle 30;
    nRelaxIter 5;
    nSmoothSurfaceNormals 1;
    nSmoothNormals 3;
    nSmoothThickness 10;
    maxFaceThicknessRatio 0.5;
    maxThicknessToMedialRatio 0.3;
    minMedianAxisAngle 90;
    nBufferCellsNoExtrude 0;
    nLayerIter 50;
}}

meshQualityControls
{{
    maxNonOrtho 65;
    maxBoundarySkewness 20;
    maxInternalSkewness 4;
    maxConcave 80;
    minVol 1e-13;
    minTetQuality -1;
    minArea -1;
    minTwist 0.02;
    minDeterminant 0.001;
    minFaceWeight 0.05;
    minVolRatio 0.01;
    minTriangleTwist -1;
    nSmoothScale 4;
    errorReduction 0.75;
}}

mergeTolerance 1e-6;
"""
        (self.case_dir / "system" / "snappyHexMeshDict").write_text(content)

    def _create_mesh_quality_dict(self):
        """Create mesh quality dictionary"""
        content = """/*--------------------------------*- C++ -*----------------------------------*\\
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      meshQualityDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

maxNonOrtho 65;
maxBoundarySkewness 20;
maxInternalSkewness 4;
maxConcave 80;
minVol 1e-13;
minTetQuality -1;
minArea -1;
minTwist 0.02;
minDeterminant 0.001;
minFaceWeight 0.05;
minVolRatio 0.01;
minTriangleTwist -1;
"""
        (self.case_dir / "system" / "meshQualityDict").write_text(content)

    def generate_mesh(self):
        """Generate the mesh"""
        try:
            self.status = "generating"
            self.start_time = time.time()

            os.chdir(self.case_dir)

            # Step 1: Generate background mesh
            self.progress = 30
            subprocess.run(
                ["blockMesh"],
                capture_output=True,
                check=True
            )

            # Step 2: Extract feature edges
            self.progress = 40
            subprocess.run(
                ["surfaceFeatureExtract"],
                capture_output=True,
                check=True
            )

            # Step 3: Run snappyHexMesh
            self.progress = 50
            log_file = self.case_dir / "log.snappyHexMesh"

            with open(log_file, "w") as log:
                process = subprocess.Popen(
                    ["snappyHexMesh", "-overwrite"],
                    stdout=log,
                    stderr=subprocess.STDOUT
                )

                # Monitor progress
                while process.poll() is None:
                    time.sleep(2)
                    self.progress = min(50 + int((time.time() - self.start_time) / 10) * 5, 85)

                if process.returncode != 0:
                    self.error = "snappyHexMesh failed"
                    self.status = "failed"
                    return False

            # Step 4: Check mesh quality
            self.progress = 90
            check_result = subprocess.run(
                ["checkMesh"],
                capture_output=True,
                text=True
            )

            # Parse mesh statistics
            self._parse_mesh_stats(check_result.stdout)

            # Copy mesh to output directory
            self._copy_mesh()

            self.progress = 100
            self.status = "completed"
            self.end_time = time.time()

            return True

        except Exception as e:
            self.error = f"Mesh generation failed: {str(e)}"
            self.status = "failed"
            return False

    def _parse_mesh_stats(self, check_output):
        """Parse checkMesh output for statistics"""
        self.mesh_stats = {}

        for line in check_output.split('\n'):
            if 'cells:' in line:
                try:
                    self.mesh_stats['cells'] = int(line.split(':')[1].strip())
                except:
                    pass
            elif 'points:' in line:
                try:
                    self.mesh_stats['points'] = int(line.split(':')[1].strip())
                except:
                    pass
            elif 'faces:' in line:
                try:
                    self.mesh_stats['faces'] = int(line.split(':')[1].strip())
                except:
                    pass

    def _copy_mesh(self):
        """Copy generated mesh to output directory"""
        src_mesh = self.case_dir / "constant" / "polyMesh"
        dest_mesh = self.mesh_dir / "constant" / "polyMesh"

        if src_mesh.exists():
            shutil.copytree(src_mesh, dest_mesh, dirs_exist_ok=True)

    def get_status(self):
        """Get job status"""
        duration = None
        if self.start_time:
            if self.end_time:
                duration = self.end_time - self.start_time
            else:
                duration = time.time() - self.start_time

        return {
            "id": self.id,
            "status": self.status,
            "progress": self.progress,
            "error": self.error,
            "duration": duration,
            "mesh_stats": self.mesh_stats
        }


def run_mesh_generation_thread(job):
    """Run mesh generation in background"""
    if job.setup_case():
        job.generate_mesh()


@app.route("/health", methods=["GET"])
def health():
    """Health check"""
    return jsonify({"status": "healthy", "service": "mesh-generator"})


@app.route("/api/mesh/generate", methods=["POST"])
def generate_mesh():
    """Generate mesh from geometry"""
    try:
        data = request.json

        if "geometry_file" not in data:
            return jsonify({"error": "geometry_file required"}), 400

        geometry_file = data["geometry_file"]
        config = data.get("config", {})

        # Verify geometry file exists
        if not (GEOMETRIES_DIR / geometry_file).exists():
            return jsonify({"error": "Geometry file not found"}), 404

        # Create job
        job_id = str(uuid.uuid4())
        job = MeshGenerationJob(job_id, geometry_file, config)

        with mesh_lock:
            mesh_jobs[job_id] = job

        # Start generation in background
        thread = threading.Thread(target=run_mesh_generation_thread, args=(job,))
        thread.daemon = True
        thread.start()

        return jsonify({
            "job_id": job_id,
            "status": "queued"
        }), 202

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/mesh/<job_id>", methods=["GET"])
def get_mesh_status(job_id):
    """Get mesh generation status"""
    with mesh_lock:
        job = mesh_jobs.get(job_id)

    if not job:
        return jsonify({"error": "Job not found"}), 404

    return jsonify(job.get_status())


@app.route("/api/mesh/<job_id>/download", methods=["GET"])
def download_mesh(job_id):
    """Download generated mesh"""
    with mesh_lock:
        job = mesh_jobs.get(job_id)

    if not job:
        return jsonify({"error": "Job not found"}), 404

    if job.status != "completed":
        return jsonify({"error": "Mesh not ready"}), 400

    # Create tarball of mesh
    import tarfile

    tar_path = job.mesh_dir / "mesh.tar.gz"

    with tarfile.open(tar_path, "w:gz") as tar:
        tar.add(job.mesh_dir / "constant", arcname="constant")

    return send_file(tar_path, as_attachment=True, download_name=f"mesh_{job_id}.tar.gz")


if __name__ == "__main__":
    GEOMETRIES_DIR.mkdir(parents=True, exist_ok=True)
    MESHES_DIR.mkdir(parents=True, exist_ok=True)

    app.run(host="0.0.0.0", port=8001, debug=False)
