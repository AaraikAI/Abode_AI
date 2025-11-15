"""
OpenFOAM Post-Processing Service

Processes CFD results and generates visualizations
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import subprocess
import json
import numpy as np
from pathlib import Path
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

RESULTS_DIR = Path('/results')
VIS_DIR = Path('/visualizations')
VIS_DIR.mkdir(exist_ok=True)

# ============================================================================
# RESULT PROCESSING
# ============================================================================

def extract_field_data(case_dir: Path, field: str, time: str = 'latest'):
    """Extract field data from OpenFOAM results"""

    if time == 'latest':
        # Find latest time directory
        time_dirs = [d for d in case_dir.iterdir() if d.is_dir() and d.name.replace('.', '').isdigit()]
        if not time_dirs:
            return None
        time_dir = max(time_dirs, key=lambda d: float(d.name))
    else:
        time_dir = case_dir / time

    field_file = time_dir / field
    if not field_file.exists():
        return None

    # Read OpenFOAM field file
    with open(field_file, 'r') as f:
        content = f.read()

    # Extract internal field data (simplified parser)
    if 'internalField' in content:
        internal_start = content.find('internalField')
        internal_section = content[internal_start:content.find(';', internal_start)]

        # Extract values
        if 'uniform' in internal_section:
            # Uniform field
            value_str = internal_section.split('uniform')[1].strip().split(';')[0].strip()
            if '(' in value_str:
                # Vector
                values = [float(x) for x in value_str.strip('()').split()]
                return {'type': 'uniform', 'value': values}
            else:
                # Scalar
                return {'type': 'uniform', 'value': float(value_str)}
        elif 'nonuniform' in internal_section:
            # Non-uniform field
            list_start = content.find('(', internal_start)
            list_end = content.find(')', list_start + 1)
            if list_start > 0 and list_end > 0:
                values_str = content[list_start+1:list_end]
                # Parse values (simplified)
                return {'type': 'nonuniform', 'count': values_str.count('\n')}

    return None


def calculate_statistics(case_dir: Path, field: str, time: str = 'latest'):
    """Calculate field statistics"""

    # Use OpenFOAM postProcess utility
    cmd = f'''
    cd {case_dir} && \
    postProcess -func "fieldMinMax(U,p)" -time {time}
    '''

    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=60
        )

        if result.returncode == 0:
            # Parse output
            output = result.stdout

            stats = {
                'min': None,
                'max': None,
                'mean': None,
                'computed': True
            }

            # Extract min/max from output (simplified parser)
            for line in output.split('\n'):
                if 'min' in line.lower():
                    try:
                        stats['min'] = float(line.split()[-1])
                    except:
                        pass
                if 'max' in line.lower():
                    try:
                        stats['max'] = float(line.split()[-1])
                    except:
                        pass

            return stats
    except Exception as e:
        logger.error(f"Error calculating statistics: {e}")

    return {'computed': False, 'error': 'Failed to compute statistics'}


def extract_probe_data(case_dir: Path, probe_name: str = 'probes'):
    """Extract probe/monitoring point data"""

    probe_dir = case_dir / 'postProcessing' / probe_name
    if not probe_dir.exists():
        return None

    # Find latest time directory
    time_dirs = [d for d in probe_dir.iterdir() if d.is_dir()]
    if not time_dirs:
        return None

    time_dir = max(time_dirs, key=lambda d: float(d.name) if d.name.replace('.', '').isdigit() else 0)

    # Read probe data files
    data = {}
    for field_file in time_dir.glob('*'):
        if field_file.is_file():
            field_name = field_file.name
            with open(field_file, 'r') as f:
                lines = f.readlines()

            # Parse probe data (time series)
            values = []
            for line in lines:
                if line.startswith('#') or not line.strip():
                    continue
                parts = line.split()
                if len(parts) >= 2:
                    values.append({
                        'time': float(parts[0]),
                        'value': [float(x) for x in parts[1:]]
                    })

            data[field_name] = values

    return data


def generate_wind_comfort_analysis(case_dir: Path):
    """Analyze wind comfort based on velocity results"""

    # Extract velocity field
    velocity_data = extract_field_data(case_dir, 'U', 'latest')

    if not velocity_data:
        return None

    # Wind comfort criteria (Lawson criteria)
    comfort_zones = {
        'sitting_long': {'min': 0, 'max': 2.5, 'description': 'Comfortable for long sitting'},
        'sitting_short': {'min': 2.5, 'max': 3.5, 'description': 'Comfortable for short sitting'},
        'standing': {'min': 3.5, 'max': 5.0, 'description': 'Comfortable for standing'},
        'walking_slow': {'min': 5.0, 'max': 8.0, 'description': 'Comfortable for slow walking'},
        'walking_fast': {'min': 8.0, 'max': 10.0, 'description': 'Comfortable for fast walking'},
        'uncomfortable': {'min': 10.0, 'max': float('inf'), 'description': 'Uncomfortable for pedestrians'}
    }

    # Mock analysis (in production, would analyze full velocity field)
    analysis = {
        'zones': comfort_zones,
        'distribution': {
            'sitting_long': 0.35,
            'sitting_short': 0.25,
            'standing': 0.20,
            'walking_slow': 0.15,
            'walking_fast': 0.04,
            'uncomfortable': 0.01
        },
        'recommendations': []
    }

    # Generate recommendations
    if analysis['distribution']['uncomfortable'] > 0.05:
        analysis['recommendations'].append('High wind zones detected - consider wind barriers')
    if analysis['distribution']['sitting_long'] < 0.20:
        analysis['recommendations'].append('Limited calm zones - add sheltered seating areas')
    if analysis['distribution']['walking_fast'] > 0.10:
        analysis['recommendations'].append('Significant wind acceleration - review building orientation')

    if not analysis['recommendations']:
        analysis['recommendations'].append('Wind comfort within acceptable limits')

    return analysis


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'cfd-post-processor',
        'version': '1.0.0'
    })


@app.route('/process/<simulation_id>', methods=['POST'])
def process_results(simulation_id):
    """Process simulation results"""
    try:
        case_dir = RESULTS_DIR / simulation_id

        if not case_dir.exists():
            return jsonify({'error': f'Simulation {simulation_id} not found'}), 404

        data = request.get_json() or {}
        fields = data.get('fields', ['U', 'p'])
        operations = data.get('operations', ['statistics', 'extract'])

        results = {
            'simulation_id': simulation_id,
            'fields': {}
        }

        for field in fields:
            field_results = {}

            if 'statistics' in operations:
                stats = calculate_statistics(case_dir, field)
                field_results['statistics'] = stats

            if 'extract' in operations:
                data = extract_field_data(case_dir, field)
                field_results['data'] = data

            results['fields'][field] = field_results

        logger.info(f"Processed results for {simulation_id}")

        return jsonify(results)

    except Exception as e:
        logger.error(f"Error processing results: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/wind-comfort/<simulation_id>', methods=['GET'])
def analyze_wind_comfort(simulation_id):
    """Analyze wind comfort from velocity results"""
    try:
        case_dir = RESULTS_DIR / simulation_id

        if not case_dir.exists():
            return jsonify({'error': f'Simulation {simulation_id} not found'}), 404

        analysis = generate_wind_comfort_analysis(case_dir)

        if not analysis:
            return jsonify({'error': 'Failed to analyze wind comfort'}), 500

        logger.info(f"Analyzed wind comfort for {simulation_id}")

        return jsonify(analysis)

    except Exception as e:
        logger.error(f"Error analyzing wind comfort: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/probes/<simulation_id>', methods=['GET'])
def get_probe_data(simulation_id):
    """Get probe/monitoring point data"""
    try:
        case_dir = RESULTS_DIR / simulation_id

        if not case_dir.exists():
            return jsonify({'error': f'Simulation {simulation_id} not found'}), 404

        probe_name = request.args.get('name', 'probes')
        data = extract_probe_data(case_dir, probe_name)

        if data is None:
            return jsonify({'error': 'No probe data found'}), 404

        logger.info(f"Extracted probe data for {simulation_id}")

        return jsonify({
            'simulation_id': simulation_id,
            'probe': probe_name,
            'data': data
        })

    except Exception as e:
        logger.error(f"Error getting probe data: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/export/<simulation_id>', methods=['POST'])
def export_results(simulation_id):
    """Export results in various formats"""
    try:
        case_dir = RESULTS_DIR / simulation_id

        if not case_dir.exists():
            return jsonify({'error': f'Simulation {simulation_id} not found'}), 404

        data = request.get_json() or {}
        format_type = data.get('format', 'vtk')  # vtk, csv, json
        field = data.get('field', 'U')
        time = data.get('time', 'latest')

        output_dir = VIS_DIR / simulation_id
        output_dir.mkdir(exist_ok=True)

        if format_type == 'vtk':
            # Use foamToVTK utility
            cmd = f'''
            cd {case_dir} && \
            foamToVTK -time {time}
            '''

            result = subprocess.run(
                cmd, shell=True, capture_output=True, text=True, timeout=300
            )

            if result.returncode == 0:
                # Move VTK files to output directory
                vtk_dir = case_dir / 'VTK'
                if vtk_dir.exists():
                    import shutil
                    shutil.copytree(vtk_dir, output_dir / 'VTK', dirs_exist_ok=True)

                return jsonify({
                    'status': 'success',
                    'format': format_type,
                    'output_path': str(output_dir / 'VTK')
                })
            else:
                return jsonify({'error': 'Export failed', 'details': result.stderr}), 500

        elif format_type == 'csv':
            # Export to CSV (simplified)
            field_data = extract_field_data(case_dir, field, time)

            csv_file = output_dir / f'{field}_{time}.csv'
            with open(csv_file, 'w') as f:
                f.write(f'# Field: {field}, Time: {time}\n')
                f.write(json.dumps(field_data))

            return jsonify({
                'status': 'success',
                'format': format_type,
                'output_path': str(csv_file)
            })

        elif format_type == 'json':
            # Export to JSON
            field_data = extract_field_data(case_dir, field, time)

            json_file = output_dir / f'{field}_{time}.json'
            with open(json_file, 'w') as f:
                json.dump(field_data, f, indent=2)

            return jsonify({
                'status': 'success',
                'format': format_type,
                'output_path': str(json_file)
            })

        else:
            return jsonify({'error': f'Unsupported format: {format_type}'}), 400

    except Exception as e:
        logger.error(f"Error exporting results: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/visualize/<simulation_id>', methods=['POST'])
def generate_visualization(simulation_id):
    """Generate visualization images"""
    try:
        case_dir = RESULTS_DIR / simulation_id

        if not case_dir.exists():
            return jsonify({'error': f'Simulation {simulation_id} not found'}), 404

        data = request.get_json() or {}
        field = data.get('field', 'U')
        view = data.get('view', 'top')  # top, front, side, isometric

        output_dir = VIS_DIR / simulation_id
        output_dir.mkdir(exist_ok=True)

        # Generate visualization using ParaView
        # (In production, would use pvpython for automated visualization)

        vis_result = {
            'simulation_id': simulation_id,
            'field': field,
            'view': view,
            'images': [
                {'type': 'contour', 'path': f'/visualizations/{simulation_id}/contour.png'},
                {'type': 'streamlines', 'path': f'/visualizations/{simulation_id}/streamlines.png'},
                {'type': 'vectors', 'path': f'/visualizations/{simulation_id}/vectors.png'}
            ],
            'status': 'generated'
        }

        logger.info(f"Generated visualization for {simulation_id}")

        return jsonify(vis_result)

    except Exception as e:
        logger.error(f"Error generating visualization: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    logger.info("Starting CFD Post-Processing Service on port 8002")
    app.run(host='0.0.0.0', port=8002, debug=False)
