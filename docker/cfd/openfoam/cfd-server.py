#!/usr/bin/env python3
"""
OpenFOAM CFD Server for Abode AI
Handles wind flow simulations and computational fluid dynamics
"""

import os
import sys
import json
import subprocess
import shutil
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import time
import uuid

app = Flask(__name__)
CORS(app)

CASES_DIR = Path("/cases")
MESHES_DIR = Path("/meshes")
RESULTS_DIR = Path("/results")

# Active simulations tracking
active_simulations = {}
simulation_lock = threading.Lock()


class CFDSimulation:
    """Manages a single CFD simulation"""

    def __init__(self, simulation_id, config):
        self.id = simulation_id
        self.config = config
        self.status = "queued"
        self.progress = 0
        self.case_dir = CASES_DIR / simulation_id
        self.result_dir = RESULTS_DIR / simulation_id
        self.start_time = None
        self.end_time = None
        self.error = None

    def setup_case(self):
        """Set up OpenFOAM case directory"""
        try:
            self.status = "setting_up"
            self.case_dir.mkdir(parents=True, exist_ok=True)

            # Create standard OpenFOAM directory structure
            (self.case_dir / "0").mkdir(exist_ok=True)
            (self.case_dir / "constant").mkdir(exist_ok=True)
            (self.case_dir / "system").mkdir(exist_ok=True)

            # Create boundary conditions in 0/ directory
            self._create_boundary_conditions()

            # Create constant files
            self._create_transport_properties()
            self._create_turbulence_properties()

            # Create system files
            self._create_control_dict()
            self._create_fv_schemes()
            self._create_fv_solution()

            # Copy mesh if provided
            mesh_id = self.config.get("mesh_id")
            if mesh_id:
                mesh_dir = MESHES_DIR / mesh_id
                if mesh_dir.exists():
                    shutil.copytree(
                        mesh_dir / "constant" / "polyMesh",
                        self.case_dir / "constant" / "polyMesh"
                    )

            self.progress = 20
            return True

        except Exception as e:
            self.error = f"Setup failed: {str(e)}"
            self.status = "failed"
            return False

    def _create_boundary_conditions(self):
        """Create initial and boundary conditions"""
        # U (velocity) file
        u_content = f"""/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  10                                    |
|   \\\\  /    A nd           | Web:      www.OpenFOAM.org                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{{
    version     2.0;
    format      ascii;
    class       volVectorField;
    object      U;
}}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 1 -1 0 0 0 0];

internalField   uniform (0 0 0);

boundaryField
{{
    inlet
    {{
        type            fixedValue;
        value           uniform ({self.config.get('wind_speed', 10)} 0 0);
    }}

    outlet
    {{
        type            zeroGradient;
    }}

    walls
    {{
        type            noSlip;
    }}

    building
    {{
        type            noSlip;
    }}

    ground
    {{
        type            noSlip;
    }}

    top
    {{
        type            slip;
    }}
}}
"""
        (self.case_dir / "0" / "U").write_text(u_content)

        # p (pressure) file
        p_content = """/*--------------------------------*- C++ -*----------------------------------*\\
| =========                 |                                                 |
| \\\\      /  F ield         | OpenFOAM: The Open Source CFD Toolbox           |
|  \\\\    /   O peration     | Version:  10                                    |
|   \\\\  /    A nd           | Web:      www.OpenFOAM.org                      |
|    \\\\/     M anipulation  |                                                 |
\\*---------------------------------------------------------------------------*/
FoamFile
{
    version     2.0;
    format      ascii;
    class       volScalarField;
    object      p;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 2 -2 0 0 0 0];

internalField   uniform 0;

boundaryField
{
    inlet
    {
        type            zeroGradient;
    }

    outlet
    {
        type            fixedValue;
        value           uniform 0;
    }

    walls
    {
        type            zeroGradient;
    }

    building
    {
        type            zeroGradient;
    }

    ground
    {
        type            zeroGradient;
    }

    top
    {
        type            zeroGradient;
    }
}
"""
        (self.case_dir / "0" / "p").write_text(p_content)

        # k (turbulent kinetic energy) and epsilon for k-epsilon model
        k_content = """/*--------------------------------*- C++ -*----------------------------------*\\
FoamFile
{
    version     2.0;
    format      ascii;
    class       volScalarField;
    object      k;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 2 -2 0 0 0 0];

internalField   uniform 0.375;

boundaryField
{
    inlet
    {
        type            fixedValue;
        value           uniform 0.375;
    }

    outlet
    {
        type            zeroGradient;
    }

    walls
    {
        type            kqRWallFunction;
        value           uniform 0.375;
    }

    building
    {
        type            kqRWallFunction;
        value           uniform 0.375;
    }

    ground
    {
        type            kqRWallFunction;
        value           uniform 0.375;
    }

    top
    {
        type            slip;
    }
}
"""
        (self.case_dir / "0" / "k").write_text(k_content)

        epsilon_content = """/*--------------------------------*- C++ -*----------------------------------*\\
FoamFile
{
    version     2.0;
    format      ascii;
    class       volScalarField;
    object      epsilon;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

dimensions      [0 2 -3 0 0 0 0];

internalField   uniform 14.855;

boundaryField
{
    inlet
    {
        type            fixedValue;
        value           uniform 14.855;
    }

    outlet
    {
        type            zeroGradient;
    }

    walls
    {
        type            epsilonWallFunction;
        value           uniform 14.855;
    }

    building
    {
        type            epsilonWallFunction;
        value           uniform 14.855;
    }

    ground
    {
        type            epsilonWallFunction;
        value           uniform 14.855;
    }

    top
    {
        type            slip;
    }
}
"""
        (self.case_dir / "0" / "epsilon").write_text(epsilon_content)

    def _create_transport_properties(self):
        """Create transport properties"""
        content = """/*--------------------------------*- C++ -*----------------------------------*\\
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      transportProperties;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

transportModel  Newtonian;

nu              [0 2 -1 0 0 0 0] 1.5e-05;
"""
        (self.case_dir / "constant" / "transportProperties").write_text(content)

    def _create_turbulence_properties(self):
        """Create turbulence properties"""
        turb_model = self.config.get("turbulence_model", "kEpsilon")

        content = f"""/*--------------------------------*- C++ -*----------------------------------*\\
FoamFile
{{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      turbulenceProperties;
}}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

simulationType  RAS;

RAS
{{
    RASModel        {turb_model};

    turbulence      on;

    printCoeffs     on;
}}
"""
        (self.case_dir / "constant" / "turbulenceProperties").write_text(content)

    def _create_control_dict(self):
        """Create control dictionary"""
        end_time = self.config.get("simulation_time", 1000)

        content = f"""/*--------------------------------*- C++ -*----------------------------------*\\
FoamFile
{{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      controlDict;
}}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

application     simpleFoam;

startFrom       startTime;

startTime       0;

stopAt          endTime;

endTime         {end_time};

deltaT          1;

writeControl    timeStep;

writeInterval   100;

purgeWrite      2;

writeFormat     ascii;

writePrecision  6;

writeCompression off;

timeFormat      general;

timePrecision   6;

runTimeModifiable true;

functions
{{
    forces
    {{
        type            forces;
        libs            ("libforces.so");
        writeControl    timeStep;
        writeInterval   10;

        patches         (building);
        rho             rhoInf;
        rhoInf          1.225;
        CofR            (0 0 0);
    }}

    forceCoeffs
    {{
        type            forceCoeffs;
        libs            ("libforces.so");
        writeControl    timeStep;
        writeInterval   10;

        patches         (building);
        rho             rhoInf;
        rhoInf          1.225;
        liftDir         (0 0 1);
        dragDir         (1 0 0);
        CofR            (0 0 0);
        pitchAxis       (0 1 0);
        magUInf         {self.config.get('wind_speed', 10)};
        lRef            10;
        Aref            100;
    }}
}}
"""
        (self.case_dir / "system" / "controlDict").write_text(content)

    def _create_fv_schemes(self):
        """Create finite volume schemes"""
        content = """/*--------------------------------*- C++ -*----------------------------------*\\
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      fvSchemes;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

ddtSchemes
{
    default         steadyState;
}

gradSchemes
{
    default         Gauss linear;
    grad(p)         Gauss linear;
    grad(U)         Gauss linear;
}

divSchemes
{
    default         none;
    div(phi,U)      bounded Gauss linearUpwind grad(U);
    div(phi,k)      bounded Gauss upwind;
    div(phi,epsilon) bounded Gauss upwind;
    div((nuEff*dev2(T(grad(U))))) Gauss linear;
}

laplacianSchemes
{
    default         Gauss linear corrected;
}

interpolationSchemes
{
    default         linear;
}

snGradSchemes
{
    default         corrected;
}

wallDist
{
    method          meshWave;
}
"""
        (self.case_dir / "system" / "fvSchemes").write_text(content)

    def _create_fv_solution(self):
        """Create finite volume solution"""
        content = """/*--------------------------------*- C++ -*----------------------------------*\\
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      fvSolution;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

solvers
{
    p
    {
        solver          GAMG;
        tolerance       1e-06;
        relTol          0.1;
        smoother        GaussSeidel;
    }

    U
    {
        solver          smoothSolver;
        smoother        GaussSeidel;
        tolerance       1e-05;
        relTol          0.1;
    }

    "(k|epsilon)"
    {
        solver          smoothSolver;
        smoother        GaussSeidel;
        tolerance       1e-05;
        relTol          0.1;
    }
}

SIMPLE
{
    nNonOrthogonalCorrectors 0;
    consistent      yes;

    residualControl
    {
        p               1e-5;
        U               1e-5;
        "(k|epsilon)"   1e-5;
    }
}

relaxationFactors
{
    fields
    {
        p               0.3;
    }
    equations
    {
        U               0.7;
        k               0.7;
        epsilon         0.7;
    }
}
"""
        (self.case_dir / "system" / "fvSolution").write_text(content)

    def run_simulation(self):
        """Run the CFD simulation"""
        try:
            self.status = "running"
            self.start_time = time.time()
            self.progress = 40

            # Change to case directory
            os.chdir(self.case_dir)

            # Check mesh
            self.progress = 45
            check_result = subprocess.run(
                ["checkMesh"],
                capture_output=True,
                text=True
            )

            if check_result.returncode != 0:
                self.error = "Mesh check failed"
                self.status = "failed"
                return False

            # Run simpleFoam solver
            self.progress = 50
            log_file = self.case_dir / "log.simpleFoam"

            with open(log_file, "w") as log:
                process = subprocess.Popen(
                    ["simpleFoam"],
                    stdout=log,
                    stderr=subprocess.STDOUT,
                    text=True
                )

                # Monitor progress
                while process.poll() is None:
                    time.sleep(5)
                    # Update progress based on log file
                    progress = self._parse_log_progress(log_file)
                    self.progress = 50 + int(progress * 0.4)  # 50-90%

                if process.returncode != 0:
                    self.error = "Simulation failed"
                    self.status = "failed"
                    return False

            self.progress = 90
            self.status = "post_processing"

            # Post-process results
            self._post_process()

            self.progress = 100
            self.status = "completed"
            self.end_time = time.time()

            return True

        except Exception as e:
            self.error = f"Simulation error: {str(e)}"
            self.status = "failed"
            return False

    def _parse_log_progress(self, log_file):
        """Parse simulation progress from log file"""
        try:
            with open(log_file, "r") as f:
                lines = f.readlines()

            # Look for "Time = " entries
            time_steps = []
            for line in lines:
                if line.startswith("Time ="):
                    try:
                        time_val = float(line.split("=")[1].strip())
                        time_steps.append(time_val)
                    except:
                        pass

            if time_steps:
                current_time = time_steps[-1]
                end_time = self.config.get("simulation_time", 1000)
                return min(current_time / end_time, 1.0)

            return 0.0

        except:
            return 0.0

    def _post_process(self):
        """Post-process simulation results"""
        # Create result directory
        self.result_dir.mkdir(parents=True, exist_ok=True)

        # Sample pressure and velocity along lines
        self._sample_fields()

        # Extract force coefficients
        self._extract_forces()

        # Copy final results
        latest_time = self._get_latest_time()
        if latest_time:
            result_time_dir = self.result_dir / latest_time
            result_time_dir.mkdir(parents=True, exist_ok=True)

            # Copy field files
            src_time_dir = self.case_dir / latest_time
            if src_time_dir.exists():
                for field_file in ["U", "p", "k", "epsilon"]:
                    src = src_time_dir / field_file
                    if src.exists():
                        shutil.copy(src, result_time_dir / field_file)

    def _sample_fields(self):
        """Sample velocity and pressure fields"""
        # Create sample dictionary
        sample_dict = """/*--------------------------------*- C++ -*----------------------------------*\\
FoamFile
{
    version     2.0;
    format      ascii;
    class       dictionary;
    object      sampleDict;
}
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

type sets;
libs ("libsampling.so");

interpolationScheme cellPoint;

setFormat raw;

sets
(
    centerline
    {
        type    uniform;
        axis    distance;
        start   (-50 0 5);
        end     (150 0 5);
        nPoints 200;
    }
);

fields (U p);
"""
        sample_file = self.case_dir / "system" / "sampleDict"
        sample_file.write_text(sample_dict)

        # Run postProcess
        subprocess.run(
            ["postProcess", "-func", "sample", "-latestTime"],
            cwd=self.case_dir,
            capture_output=True
        )

    def _extract_forces(self):
        """Extract force coefficients"""
        forces_file = self.case_dir / "postProcessing" / "forceCoeffs" / "0" / "forceCoeffs.dat"
        if forces_file.exists():
            dest = self.result_dir / "forceCoeffs.dat"
            shutil.copy(forces_file, dest)

    def _get_latest_time(self):
        """Get latest time directory"""
        time_dirs = []
        for item in self.case_dir.iterdir():
            if item.is_dir():
                try:
                    time_val = float(item.name)
                    time_dirs.append((time_val, item.name))
                except:
                    pass

        if time_dirs:
            time_dirs.sort(reverse=True)
            return time_dirs[0][1]

        return None

    def get_status(self):
        """Get simulation status"""
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
            "start_time": self.start_time,
            "end_time": self.end_time
        }


def run_simulation_thread(simulation):
    """Run simulation in background thread"""
    if simulation.setup_case():
        simulation.run_simulation()


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "cfd-server"})


@app.route("/api/simulate", methods=["POST"])
def start_simulation():
    """Start a new CFD simulation"""
    try:
        config = request.json

        # Validate config
        required_fields = ["wind_speed", "mesh_id"]
        for field in required_fields:
            if field not in config:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Create simulation
        sim_id = str(uuid.uuid4())
        simulation = CFDSimulation(sim_id, config)

        with simulation_lock:
            active_simulations[sim_id] = simulation

        # Start simulation in background thread
        thread = threading.Thread(target=run_simulation_thread, args=(simulation,))
        thread.daemon = True
        thread.start()

        return jsonify({
            "simulation_id": sim_id,
            "status": "queued"
        }), 202

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/simulate/<sim_id>", methods=["GET"])
def get_simulation_status(sim_id):
    """Get simulation status"""
    with simulation_lock:
        simulation = active_simulations.get(sim_id)

    if not simulation:
        return jsonify({"error": "Simulation not found"}), 404

    return jsonify(simulation.get_status())


@app.route("/api/simulate/<sim_id>/cancel", methods=["POST"])
def cancel_simulation(sim_id):
    """Cancel a running simulation"""
    with simulation_lock:
        simulation = active_simulations.get(sim_id)

    if not simulation:
        return jsonify({"error": "Simulation not found"}), 404

    # TODO: Implement graceful cancellation
    simulation.status = "cancelled"

    return jsonify({"status": "cancelled"})


@app.route("/api/simulate", methods=["GET"])
def list_simulations():
    """List all simulations"""
    with simulation_lock:
        simulations = [sim.get_status() for sim in active_simulations.values()]

    return jsonify({"simulations": simulations})


if __name__ == "__main__":
    # Ensure directories exist
    CASES_DIR.mkdir(parents=True, exist_ok=True)
    MESHES_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    app.run(host="0.0.0.0", port=8000, debug=False)
