"""
ifcopenshell Advanced Backend
Production-ready IFC validation, geometry extraction, and compliance checking
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import ifcopenshell
import ifcopenshell.geom
import ifcopenshell.validate
import logging
import tempfile
import os
from urllib.parse import urlparse
import urllib.request

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def download_ifc_file(file_url):
    """Download IFC file from URL"""
    try:
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.ifc')
        urllib.request.urlretrieve(file_url, temp_file.name)
        return temp_file.name
    except Exception as e:
        logger.error(f"Error downloading file: {e}")
        return None

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ifcopenshell',
        'version': ifcopenshell.version
    })

@app.route('/validate', methods=['POST'])
def validate_ifc():
    """Comprehensive IFC validation"""
    try:
        data = request.get_json()

        if not data or 'fileUrl' not in data:
            return jsonify({'error': 'No file URL provided'}), 400

        # Download file
        file_path = download_ifc_file(data['fileUrl'])
        if not file_path:
            return jsonify({'error': 'Failed to download file'}), 500

        try:
            # Open IFC file
            ifc_file = ifcopenshell.open(file_path)

            errors = []
            warnings = []

            # Basic validation
            schema = ifc_file.schema
            file_size = os.path.getsize(file_path)
            entity_count = len(list(ifc_file))

            # Check for required entities
            required_entities = ['IfcProject', 'IfcSite', 'IfcBuilding']
            for entity_type in required_entities:
                entities = ifc_file.by_type(entity_type)
                if len(entities) == 0:
                    errors.append({
                        'severity': 'error',
                        'code': 'MISSING_REQUIRED_ENTITY',
                        'message': f'Required entity {entity_type} not found',
                        'entity': entity_type
                    })

            # Check for owner history
            projects = ifc_file.by_type('IfcProject')
            if projects and not projects[0].OwnerHistory:
                warnings.append({
                    'code': 'MISSING_OWNER_HISTORY',
                    'message': 'IfcProject missing OwnerHistory',
                    'entity': 'IfcProject',
                    'suggestion': 'Add IfcOwnerHistory for better tracking'
                })

            # Validate geometry
            buildings = ifc_file.by_type('IfcBuilding')
            for building in buildings:
                if not building.ObjectPlacement:
                    errors.append({
                        'severity': 'error',
                        'code': 'MISSING_PLACEMENT',
                        'message': 'IfcBuilding missing ObjectPlacement',
                        'entity': f'IfcBuilding #{building.id()}'
                    })

            # Check units
            projects = ifc_file.by_type('IfcProject')
            if projects:
                units_in_context = projects[0].UnitsInContext
                if not units_in_context:
                    warnings.append({
                        'code': 'MISSING_UNITS',
                        'message': 'Project missing UnitsInContext',
                        'suggestion': 'Define measurement units'
                    })

            is_valid = len(errors) == 0

            return jsonify({
                'isValid': is_valid,
                'errors': errors,
                'warnings': warnings,
                'schema': schema,
                'fileSize': file_size,
                'entityCount': entity_count
            })

        finally:
            # Cleanup
            if os.path.exists(file_path):
                os.unlink(file_path)

    except Exception as e:
        logger.error(f"Validation error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/geometry', methods=['POST'])
def extract_geometry():
    """Extract geometry from IFC elements"""
    try:
        data = request.get_json()

        if not data or 'fileUrl' not in data:
            return jsonify({'error': 'No file URL provided'}), 400

        file_path = download_ifc_file(data['fileUrl'])
        if not file_path:
            return jsonify({'error': 'Failed to download file'}), 500

        try:
            ifc_file = ifcopenshell.open(file_path)

            # Setup geometry settings
            settings = ifcopenshell.geom.settings()
            settings.set(settings.USE_WORLD_COORDS, True)

            entity_ids = data.get('entityIds', [])
            geometries = {}

            # Get entities to process
            if entity_ids:
                entities = [ifc_file.by_id(int(eid.replace('#', ''))) for eid in entity_ids]
            else:
                # Get all building elements
                entities = ifc_file.by_type('IfcBuildingElement')[:10]  # Limit for demo

            for entity in entities:
                try:
                    # Create geometry
                    shape = ifcopenshell.geom.create_shape(settings, entity)

                    # Extract vertices and faces
                    geometry_data = shape.geometry

                    verts = geometry_data.verts
                    faces = geometry_data.faces

                    # Convert to lists
                    vertices = [[verts[i], verts[i+1], verts[i+2]]
                               for i in range(0, len(verts), 3)]
                    faces_list = [[faces[i], faces[i+1], faces[i+2]]
                                 for i in range(0, len(faces), 3)]

                    # Get material
                    materials = []
                    if hasattr(entity, 'HasAssociations'):
                        for association in entity.HasAssociations:
                            if association.is_a('IfcRelAssociatesMaterial'):
                                material = association.RelatingMaterial
                                if material.is_a('IfcMaterial'):
                                    materials.append({
                                        'name': material.Name or 'Unnamed',
                                        'color': {'r': 0.8, 'g': 0.8, 'b': 0.8, 'a': 1.0}
                                    })

                    geometries[f'#{entity.id()}'] = {
                        'type': 'mesh',
                        'vertices': vertices[:100],  # Limit for response size
                        'faces': faces_list[:100],
                        'materials': materials
                    }

                except Exception as e:
                    logger.warning(f"Could not extract geometry for {entity.id()}: {e}")
                    continue

            return jsonify({'geometries': geometries})

        finally:
            if os.path.exists(file_path):
                os.unlink(file_path)

    except Exception as e:
        logger.error(f"Geometry extraction error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/properties', methods=['POST'])
def get_properties():
    """Get property sets for an IFC element"""
    try:
        data = request.get_json()

        if not data or 'fileUrl' not in data or 'entityId' not in data:
            return jsonify({'error': 'Missing required parameters'}), 400

        file_path = download_ifc_file(data['fileUrl'])
        if not file_path:
            return jsonify({'error': 'Failed to download file'}), 500

        try:
            ifc_file = ifcopenshell.open(file_path)
            entity_id = int(data['entityId'].replace('#', ''))
            entity = ifc_file.by_id(entity_id)

            property_sets = []

            # Get property sets
            if hasattr(entity, 'IsDefinedBy'):
                for definition in entity.IsDefinedBy:
                    if definition.is_a('IfcRelDefinesByProperties'):
                        property_set = definition.RelatingPropertyDefinition

                        if property_set.is_a('IfcPropertySet'):
                            properties = []

                            for prop in property_set.HasProperties:
                                if prop.is_a('IfcPropertySingleValue'):
                                    prop_value = prop.NominalValue
                                    properties.append({
                                        'name': prop.Name,
                                        'value': prop_value.wrappedValue if prop_value else None,
                                        'type': prop_value.is_a() if prop_value else 'IfcLabel',
                                        'unit': None
                                    })

                            property_sets.append({
                                'name': property_set.Name,
                                'description': property_set.Description or '',
                                'properties': properties
                            })

            # If no property sets, return basic properties
            if not property_sets:
                basic_properties = []
                if hasattr(entity, 'Name'):
                    basic_properties.append({
                        'name': 'Name',
                        'value': entity.Name,
                        'type': 'IfcLabel'
                    })
                if hasattr(entity, 'Description'):
                    basic_properties.append({
                        'name': 'Description',
                        'value': entity.Description,
                        'type': 'IfcText'
                    })

                property_sets.append({
                    'name': 'Basic Properties',
                    'description': 'Basic element properties',
                    'properties': basic_properties
                })

            return jsonify({'propertySets': property_sets})

        finally:
            if os.path.exists(file_path):
                os.unlink(file_path)

    except Exception as e:
        logger.error(f"Property extraction error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/relationships', methods=['POST'])
def get_relationships():
    """Get relationships for an IFC element"""
    try:
        data = request.get_json()

        if not data or 'fileUrl' not in data or 'entityId' not in data:
            return jsonify({'error': 'Missing required parameters'}), 400

        file_path = download_ifc_file(data['fileUrl'])
        if not file_path:
            return jsonify({'error': 'Failed to download file'}), 500

        try:
            ifc_file = ifcopenshell.open(file_path)
            entity_id = int(data['entityId'].replace('#', ''))
            entity = ifc_file.by_id(entity_id)
            relationship_type = data.get('relationshipType')

            relationships = []

            # Get containment relationships
            if hasattr(entity, 'ContainsElements'):
                for rel in entity.ContainsElements:
                    relationships.append({
                        'type': 'IfcRelContainedInSpatialStructure',
                        'relatingObject': f'#{entity.id()}',
                        'relatedObjects': [f'#{e.id()}' for e in rel.RelatedElements],
                        'description': 'Contains elements'
                    })

            # Get aggregation relationships
            if hasattr(entity, 'IsDecomposedBy'):
                for rel in entity.IsDecomposedBy:
                    relationships.append({
                        'type': 'IfcRelAggregates',
                        'relatingObject': f'#{entity.id()}',
                        'relatedObjects': [f'#{e.id()}' for e in rel.RelatedObjects],
                        'description': 'Aggregates parts'
                    })

            # Filter by type if specified
            if relationship_type:
                relationships = [r for r in relationships if r['type'] == relationship_type]

            return jsonify({'relationships': relationships})

        finally:
            if os.path.exists(file_path):
                os.unlink(file_path)

    except Exception as e:
        logger.error(f"Relationship extraction error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/compliance', methods=['POST'])
def check_compliance():
    """Check IFC compliance with buildingSMART standards"""
    try:
        data = request.get_json()

        if not data or 'fileUrl' not in data:
            return jsonify({'error': 'No file URL provided'}), 400

        file_path = download_ifc_file(data['fileUrl'])
        if not file_path:
            return jsonify({'error': 'Failed to download file'}), 500

        try:
            ifc_file = ifcopenshell.open(file_path)
            standard = data.get('standard', 'IFC4')

            issues = []

            # Check schema compliance
            if ifc_file.schema != standard:
                issues.append({
                    'type': 'schema_mismatch',
                    'description': f'File schema {ifc_file.schema} does not match requested {standard}',
                    'severity': 'moderate'
                })

            # Check required entities for compliance
            required_for_compliance = {
                'IfcProject': True,
                'IfcSite': True,
                'IfcBuilding': True,
                'IfcBuildingStorey': False  # Optional but recommended
            }

            for entity_type, required in required_for_compliance.items():
                entities = ifc_file.by_type(entity_type)
                if len(entities) == 0 and required:
                    issues.append({
                        'type': 'missing_entity',
                        'description': f'Missing required entity: {entity_type}',
                        'severity': 'high'
                    })

            # Calculate coverage (percentage of recommended entities present)
            total_checks = len(required_for_compliance)
            passed_checks = sum(1 for entity_type in required_for_compliance
                              if len(ifc_file.by_type(entity_type)) > 0)
            coverage = passed_checks / total_checks

            compliant = len([i for i in issues if i['severity'] == 'high']) == 0

            return jsonify({
                'compliant': compliant,
                'issues': issues,
                'coverage': coverage
            })

        finally:
            if os.path.exists(file_path):
                os.unlink(file_path)

    except Exception as e:
        logger.error(f"Compliance check error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8004, debug=False)
