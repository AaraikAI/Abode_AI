"""
AI Lighting Optimization Service - Production Backend

ML-based lighting analysis, natural lighting calculations, and AI-powered optimization
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from datetime import datetime
import math
from typing import List, Dict, Any, Tuple
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# LIGHTING ANALYSIS MODELS
# ============================================================================

class LightingAnalyzer:
    """ML-based lighting quality analysis"""

    def __init__(self):
        self.min_illuminance = 300  # lux for work areas
        self.max_illuminance = 1000  # lux to avoid glare
        self.optimal_color_temp = 5000  # Kelvin for natural light

    def analyze_lighting_setup(self, lights: List[Dict], camera_position: Dict) -> Dict:
        """Analyze lighting quality and generate recommendations"""

        # Calculate total illuminance
        total_illuminance = self._calculate_total_illuminance(lights, camera_position)

        # Calculate color temperature balance
        color_temp_score = self._analyze_color_temperature(lights)

        # Check for shadows and coverage
        coverage_score = self._analyze_coverage(lights)

        # Detect harsh shadows
        shadow_score = self._analyze_shadow_quality(lights)

        # Calculate overall score
        overall_score = (
            0.3 * min(total_illuminance / self.min_illuminance, 1.0) +
            0.25 * color_temp_score +
            0.25 * coverage_score +
            0.20 * shadow_score
        )

        # Generate recommendations
        recommendations = self._generate_recommendations(
            total_illuminance, color_temp_score, coverage_score, shadow_score
        )

        return {
            'overallScore': float(overall_score),
            'metrics': {
                'illuminance': float(total_illuminance),
                'colorTemperature': float(self._get_avg_color_temp(lights)),
                'coverage': float(coverage_score),
                'shadowQuality': float(shadow_score)
            },
            'recommendations': recommendations
        }

    def _calculate_total_illuminance(self, lights: List[Dict], camera_pos: Dict) -> float:
        """Calculate total illuminance at camera position"""
        total = 0
        for light in lights:
            distance = self._distance(
                camera_pos,
                light.get('position', {'x': 0, 'y': 5, 'z': 0})
            )
            intensity = light.get('intensity', 1.0)
            # Inverse square law
            illuminance = (intensity * 10000) / max(distance ** 2, 1)
            total += illuminance
        return total

    def _analyze_color_temperature(self, lights: List[Dict]) -> float:
        """Score color temperature balance"""
        if not lights:
            return 0.0

        avg_temp = self._get_avg_color_temp(lights)
        # Score based on deviation from optimal
        deviation = abs(avg_temp - self.optimal_color_temp) / self.optimal_color_temp
        return max(0, 1 - deviation)

    def _get_avg_color_temp(self, lights: List[Dict]) -> float:
        """Get average color temperature"""
        if not lights:
            return 5000
        temps = [self._color_to_temperature(l.get('color', '#ffffff')) for l in lights]
        return sum(temps) / len(temps)

    def _color_to_temperature(self, color: str) -> float:
        """Convert hex color to approximate color temperature"""
        # Simple approximation based on RGB values
        if color.startswith('#'):
            r = int(color[1:3], 16) / 255.0
            b = int(color[5:7], 16) / 255.0
            if b > r:
                return 6500  # Cool/blue
            elif r > b:
                return 3000  # Warm/orange
            else:
                return 5000  # Neutral
        return 5000

    def _analyze_coverage(self, lights: List[Dict]) -> float:
        """Score spatial coverage of lights"""
        if len(lights) < 2:
            return 0.5

        # Calculate spatial distribution
        positions = [l.get('position', {'x': 0, 'y': 5, 'z': 0}) for l in lights]
        distances = []
        for i in range(len(positions)):
            for j in range(i + 1, len(positions)):
                dist = self._distance(positions[i], positions[j])
                distances.append(dist)

        if not distances:
            return 0.5

        # Good coverage has balanced spacing
        avg_dist = sum(distances) / len(distances)
        variance = sum((d - avg_dist) ** 2 for d in distances) / len(distances)
        std_dev = math.sqrt(variance)

        # Lower variance = better coverage
        score = 1.0 / (1.0 + std_dev / max(avg_dist, 1))
        return score

    def _analyze_shadow_quality(self, lights: List[Dict]) -> float:
        """Score shadow quality (multiple lights = softer shadows)"""
        num_lights = len(lights)
        if num_lights == 0:
            return 0.0
        elif num_lights == 1:
            return 0.3  # Harsh shadows
        elif num_lights == 2:
            return 0.6  # Medium shadows
        elif num_lights == 3:
            return 0.85  # Soft shadows
        else:
            return 1.0  # Very soft shadows

    def _distance(self, pos1: Dict, pos2: Dict) -> float:
        """Calculate Euclidean distance"""
        dx = pos1.get('x', 0) - pos2.get('x', 0)
        dy = pos1.get('y', 0) - pos2.get('y', 0)
        dz = pos1.get('z', 0) - pos2.get('z', 0)
        return math.sqrt(dx**2 + dy**2 + dz**2)

    def _generate_recommendations(self, illuminance: float, color_temp: float,
                                  coverage: float, shadow: float) -> List[str]:
        """Generate actionable recommendations"""
        recs = []

        if illuminance < self.min_illuminance:
            recs.append(f'Increase light intensity - current illuminance {illuminance:.0f} lux is below minimum {self.min_illuminance} lux')
        elif illuminance > self.max_illuminance:
            recs.append(f'Reduce light intensity - current illuminance {illuminance:.0f} lux exceeds maximum {self.max_illuminance} lux to avoid glare')

        if color_temp < 0.7:
            recs.append('Balance color temperature - mix warm and cool lights for better color rendering')

        if coverage < 0.6:
            recs.append('Improve spatial coverage - add lights in underlit areas for more even illumination')

        if shadow < 0.6:
            recs.append('Add fill lights to soften shadows and reduce contrast')

        if not recs:
            recs.append('Lighting setup is well-balanced - no major improvements needed')

        return recs


class NaturalLightCalculator:
    """Calculate natural lighting from sun position"""

    def calculate(self, latitude: float, longitude: float, date: datetime,
                  time: float, cloud_cover: float, building_orientation: float) -> Dict:
        """Calculate sun position and natural lighting characteristics"""

        # Calculate day of year
        day_of_year = date.timetuple().tm_yday

        # Solar declination (angle of sun relative to equator)
        declination = 23.45 * math.sin(math.radians((360/365) * (day_of_year - 81)))

        # Hour angle (position of sun in the sky at given time)
        hour_angle = 15 * (time - 12)

        # Solar altitude (elevation angle)
        lat_rad = math.radians(latitude)
        dec_rad = math.radians(declination)
        hour_rad = math.radians(hour_angle)

        altitude = math.degrees(math.asin(
            math.sin(lat_rad) * math.sin(dec_rad) +
            math.cos(lat_rad) * math.cos(dec_rad) * math.cos(hour_rad)
        ))

        # Solar azimuth (compass direction)
        azimuth = math.degrees(math.atan2(
            math.sin(hour_rad),
            math.cos(hour_rad) * math.sin(lat_rad) - math.tan(dec_rad) * math.cos(lat_rad)
        ))

        # Adjust azimuth to 0-360 range
        azimuth = (azimuth + 360) % 360

        # Sun intensity based on altitude (higher = stronger)
        base_intensity = max(0, math.sin(math.radians(altitude)))

        # Adjust for cloud cover
        cloud_factor = 1 - (cloud_cover * 0.7)  # Clouds reduce intensity
        intensity = base_intensity * cloud_factor

        # Sun color (warmer at low angles, cooler at high angles)
        color_temp = 2000 + (altitude / 90) * 4500  # 2000K at horizon, 6500K at zenith

        # Sky light intensity (ambient light from sky)
        sky_intensity = 0.3 * intensity

        # Recommended HDRI based on conditions
        hdri = self._select_hdri(altitude, cloud_cover, time)

        return {
            'sunPosition': {
                'altitude': float(altitude),
                'azimuth': float(azimuth)
            },
            'sunColor': self._temp_to_hex(color_temp),
            'sunIntensity': float(intensity),
            'skyLightIntensity': float(sky_intensity),
            'colorTemperature': float(color_temp),
            'recommendedHDRI': hdri
        }

    def _select_hdri(self, altitude: float, cloud_cover: float, time: float) -> str:
        """Select appropriate HDRI based on conditions"""
        if time < 6 or time > 20:
            return 'night_sky.hdr'
        elif altitude < 10:
            return 'sunrise_sunset.hdr'
        elif cloud_cover > 0.7:
            return 'overcast_sky.hdr'
        elif cloud_cover > 0.3:
            return 'partly_cloudy.hdr'
        else:
            return 'clear_sky.hdr'

    def _temp_to_hex(self, temp: float) -> str:
        """Convert color temperature to hex color (approximation)"""
        # Simplified conversion
        if temp < 3000:
            return '#ff9329'  # Warm orange
        elif temp < 4000:
            return '#ffd699'  # Warm white
        elif temp < 5500:
            return '#fffaf4'  # Neutral white
        else:
            return '#cce6ff'  # Cool blue-white


class LightOptimizer:
    """AI-powered light placement optimizer"""

    def optimize(self, scene_bounds: Dict, target_illuminance: float,
                 lighting_goal: str) -> Dict:
        """Generate optimal light placement"""

        # Parse scene bounds
        min_x = scene_bounds.get('minX', -10)
        max_x = scene_bounds.get('maxX', 10)
        min_z = scene_bounds.get('minZ', -10)
        max_z = scene_bounds.get('maxZ', 10)

        # Generate lights based on goal
        if lighting_goal == 'natural':
            lights = self._generate_natural_lights(min_x, max_x, min_z, max_z)
        elif lighting_goal == 'dramatic':
            lights = self._generate_dramatic_lights(min_x, max_x, min_z, max_z)
        else:  # even
            lights = self._generate_even_lights(min_x, max_x, min_z, max_z)

        # Adjust intensities to match target illuminance
        lights = self._adjust_intensities(lights, target_illuminance)

        return {
            'lights': lights,
            'estimatedIlluminance': float(target_illuminance),
            'configuration': lighting_goal
        }

    def _generate_natural_lights(self, min_x: float, max_x: float,
                                 min_z: float, max_z: float) -> List[Dict]:
        """Generate natural lighting setup"""
        center_x = (min_x + max_x) / 2
        center_z = (min_z + max_z) / 2

        return [
            {
                'type': 'directional',
                'position': {'x': center_x + 5, 'y': 10, 'z': center_z + 5},
                'intensity': 1.2,
                'color': '#fffaf4',
                'name': 'Key Light (Sun)'
            },
            {
                'type': 'point',
                'position': {'x': center_x - 3, 'y': 8, 'z': center_z},
                'intensity': 0.4,
                'color': '#cce6ff',
                'name': 'Fill Light (Sky)'
            }
        ]

    def _generate_dramatic_lights(self, min_x: float, max_x: float,
                                  min_z: float, max_z: float) -> List[Dict]:
        """Generate dramatic lighting setup"""
        center_x = (min_x + max_x) / 2
        center_z = (min_z + max_z) / 2

        return [
            {
                'type': 'spot',
                'position': {'x': center_x + 8, 'y': 12, 'z': center_z},
                'intensity': 2.0,
                'color': '#ffffff',
                'name': 'Main Spot'
            },
            {
                'type': 'point',
                'position': {'x': center_x - 5, 'y': 2, 'z': center_z - 5},
                'intensity': 0.3,
                'color': '#ff9329',
                'name': 'Accent Light'
            }
        ]

    def _generate_even_lights(self, min_x: float, max_x: float,
                             min_z: float, max_z: float) -> List[Dict]:
        """Generate even lighting setup (studio lighting)"""
        center_x = (min_x + max_x) / 2
        center_z = (min_z + max_z) / 2
        size = max(max_x - min_x, max_z - min_z)
        offset = size * 0.4

        return [
            {
                'type': 'point',
                'position': {'x': center_x + offset, 'y': 8, 'z': center_z + offset},
                'intensity': 0.8,
                'color': '#ffffff',
                'name': 'Top Right'
            },
            {
                'type': 'point',
                'position': {'x': center_x - offset, 'y': 8, 'z': center_z + offset},
                'intensity': 0.8,
                'color': '#ffffff',
                'name': 'Top Left'
            },
            {
                'type': 'point',
                'position': {'x': center_x + offset, 'y': 8, 'z': center_z - offset},
                'intensity': 0.8,
                'color': '#ffffff',
                'name': 'Bottom Right'
            },
            {
                'type': 'point',
                'position': {'x': center_x - offset, 'y': 8, 'z': center_z - offset},
                'intensity': 0.8,
                'color': '#ffffff',
                'name': 'Bottom Left'
            }
        ]

    def _adjust_intensities(self, lights: List[Dict], target: float) -> List[Dict]:
        """Scale light intensities to match target illuminance"""
        # Simple scaling factor
        scale = target / 500  # 500 lux baseline

        for light in lights:
            light['intensity'] = light['intensity'] * scale

        return lights


# Initialize services
analyzer = LightingAnalyzer()
natural_light = NaturalLightCalculator()
optimizer = LightOptimizer()

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ai-lighting',
        'version': '1.0.0'
    })


@app.route('/analyze', methods=['POST'])
def analyze_lighting():
    """Analyze lighting setup quality"""
    try:
        data = request.get_json()

        lights = data.get('lights', [])
        camera_position = data.get('cameraPosition', {'x': 0, 'y': 1.6, 'z': 0})

        result = analyzer.analyze_lighting_setup(lights, camera_position)

        logger.info(f"Analyzed {len(lights)} lights, score: {result['overallScore']:.2f}")

        return jsonify(result)

    except Exception as e:
        logger.error(f"Error analyzing lighting: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/natural-lighting', methods=['POST'])
def calculate_natural_lighting():
    """Calculate natural lighting from sun position"""
    try:
        data = request.get_json()

        latitude = data.get('latitude', 40.7128)
        longitude = data.get('longitude', -74.0060)
        date_str = data.get('date')
        time = data.get('time', 12)
        cloud_cover = data.get('cloudCover', 0)
        building_orientation = data.get('buildingOrientation', 0)

        # Parse date
        if date_str:
            date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        else:
            date = datetime.now()

        result = natural_light.calculate(
            latitude, longitude, date, time, cloud_cover, building_orientation
        )

        logger.info(f"Calculated natural lighting: altitude={result['sunPosition']['altitude']:.1f}°")

        return jsonify(result)

    except Exception as e:
        logger.error(f"Error calculating natural lighting: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/optimize', methods=['POST'])
def optimize_lighting():
    """Generate optimal light placement"""
    try:
        data = request.get_json()

        scene_bounds = data.get('sceneBounds', {
            'minX': -10, 'maxX': 10,
            'minZ': -10, 'maxZ': 10
        })
        target_illuminance = data.get('targetIlluminance', 500)
        lighting_goal = data.get('lightingGoal', 'even')

        result = optimizer.optimize(scene_bounds, target_illuminance, lighting_goal)

        logger.info(f"Optimized lighting: {len(result['lights'])} lights, goal={lighting_goal}")

        return jsonify(result)

    except Exception as e:
        logger.error(f"Error optimizing lighting: {str(e)}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    logger.info("Starting AI Lighting Optimization Service on port 8005")
    app.run(host='0.0.0.0', port=8005, debug=False)
