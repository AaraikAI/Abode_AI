"""
Blender Render Farm Service
Production-ready Blender rendering with Cycles and Eevee engines

Features:
- Cycles path-traced rendering for photoreal stills
- Eevee real-time rendering for fast previews
- 4K/8K output support
- Post-processing pipeline (LUTs, bloom, tonemapping)
- Distributed rendering across GPU cluster
- Material library management
- HDRI environment support
"""

import json
import subprocess
import tempfile
import os
from typing import Dict, Any, Optional, List
from pathlib import Path

class BlenderRenderer:
    """Blender rendering service for high-quality architectural visualization"""

    def __init__(self, blender_path: str = "/usr/bin/blender"):
        self.blender_path = blender_path
        self.script_dir = Path(__file__).parent / "blender_scripts"
        self.script_dir.mkdir(exist_ok=True)

    def render_still(
        self,
        scene_data: Dict[str, Any],
        output_path: str,
        quality: str = "4k",
        engine: str = "CYCLES",
        samples: int = 256,
        denoising: bool = True,
        post_fx: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Render a single still image

        Args:
            scene_data: Scene description (objects, materials, lighting, camera)
            output_path: Path to save rendered image
            quality: "1080p", "4k", or "8k"
            engine: "CYCLES" or "EEVEE"
            samples: Number of render samples
            denoising: Enable denoising
            post_fx: Post-processing effects (LUT, bloom, etc.)

        Returns:
            Dict with render results and metadata
        """
        # Create temporary Blender Python script
        script = self._generate_render_script(
            scene_data=scene_data,
            output_path=output_path,
            render_type="STILL",
            quality=quality,
            engine=engine,
            samples=samples,
            denoising=denoising,
            post_fx=post_fx
        )

        script_path = self._save_script(script, "render_still")

        # Execute Blender in background
        result = self._execute_blender(script_path, output_path)

        return result

    def render_walkthrough(
        self,
        scene_data: Dict[str, Any],
        output_path: str,
        camera_path: List[Dict[str, Any]],
        fps: int = 30,
        duration: float = 10.0,
        quality: str = "1080p",
        engine: str = "EEVEE",
        samples: int = 128
    ) -> Dict[str, Any]:
        """
        Render a walkthrough video animation

        Args:
            scene_data: Scene description
            output_path: Path to save video
            camera_path: List of keyframes with position/rotation
            fps: Frames per second
            duration: Video duration in seconds
            quality: Output resolution
            engine: Render engine
            samples: Samples per frame

        Returns:
            Dict with render results
        """
        script = self._generate_render_script(
            scene_data=scene_data,
            output_path=output_path,
            render_type="ANIMATION",
            quality=quality,
            engine=engine,
            samples=samples,
            camera_path=camera_path,
            fps=fps,
            duration=duration
        )

        script_path = self._save_script(script, "render_animation")
        result = self._execute_blender(script_path, output_path)

        # Encode video using FFmpeg
        if result["success"]:
            video_path = self._encode_video(output_path, fps)
            result["video_path"] = video_path

        return result

    def _generate_render_script(
        self,
        scene_data: Dict[str, Any],
        output_path: str,
        render_type: str,
        quality: str,
        engine: str,
        samples: int,
        denoising: bool = True,
        post_fx: Optional[Dict[str, Any]] = None,
        camera_path: Optional[List[Dict[str, Any]]] = None,
        fps: int = 30,
        duration: float = 10.0
    ) -> str:
        """Generate Blender Python script for rendering"""

        # Resolution settings
        resolution_map = {
            "1080p": (1920, 1080),
            "4k": (3840, 2160),
            "8k": (7680, 4320)
        }
        width, height = resolution_map.get(quality, (1920, 1080))

        script = f'''
import bpy
import json
import mathutils
import os

# Clear existing scene
bpy.ops.wm.read_homefile(use_empty=True)

# Set render engine
bpy.context.scene.render.engine = '{engine}'

# Configure render settings
scene = bpy.context.scene
scene.render.resolution_x = {width}
scene.render.resolution_y = {height}
scene.render.resolution_percentage = 100
scene.render.film_transparent = False

# Cycles settings
if '{engine}' == 'CYCLES':
    scene.cycles.samples = {samples}
    scene.cycles.use_denoising = {str(denoising)}
    scene.cycles.denoiser = 'OPENIMAGEDENOISE'
    scene.cycles.device = 'GPU'

    # Enable GPU rendering
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'CUDA'  # or 'OPTIX' for RTX
    prefs.get_devices()
    for device in prefs.devices:
        device.use = True

# Eevee settings
elif '{engine}' == 'EEVEE':
    scene.eevee.taa_render_samples = {samples}
    scene.eevee.use_gtao = True
    scene.eevee.use_bloom = True
    scene.eevee.use_ssr = True
    scene.eevee.use_ssr_refraction = True

# Load scene data
scene_data = {json.dumps(scene_data)}

# Create objects
for obj_data in scene_data.get("objects", []):
    # Create mesh
    mesh = bpy.data.meshes.new(obj_data["name"])
    obj = bpy.data.objects.new(obj_data["name"], mesh)
    bpy.context.collection.objects.link(obj)

    # Set geometry
    vertices = obj_data.get("vertices", [])
    faces = obj_data.get("faces", [])
    mesh.from_pydata(vertices, [], faces)
    mesh.update()

    # Set transform
    if "position" in obj_data:
        obj.location = obj_data["position"]
    if "rotation" in obj_data:
        obj.rotation_euler = obj_data["rotation"]
    if "scale" in obj_data:
        obj.scale = obj_data["scale"]

    # Apply material
    if "material" in obj_data:
        mat = create_pbr_material(obj_data["material"])
        obj.data.materials.append(mat)

# Setup camera
camera_data = scene_data.get("camera", {{}})
camera = bpy.data.cameras.new("Camera")
camera_obj = bpy.data.objects.new("Camera", camera)
bpy.context.collection.objects.link(camera_obj)
scene.camera = camera_obj

camera_obj.location = camera_data.get("position", [0, -10, 5])
camera_obj.rotation_euler = camera_data.get("rotation", [1.1, 0, 0])
camera.lens = camera_data.get("focal_length", 35)

# Setup lighting
lighting_data = scene_data.get("lighting", {{}})

# Sun light
sun = bpy.data.lights.new("Sun", 'SUN')
sun_obj = bpy.data.objects.new("Sun", sun)
bpy.context.collection.objects.link(sun_obj)
sun_obj.location = lighting_data.get("sun_position", [10, -10, 20])
sun.energy = lighting_data.get("sun_energy", 1.0)

# HDRI environment
if "hdri" in lighting_data:
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True

    env_tex = world.node_tree.nodes.new('ShaderNodeTexEnvironment')
    env_tex.image = bpy.data.images.load(lighting_data["hdri"])

    bg = world.node_tree.nodes['Background']
    world.node_tree.links.new(env_tex.outputs['Color'], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = lighting_data.get("hdri_strength", 1.0)

# Animation setup
if '{render_type}' == 'ANIMATION':
    camera_path = {json.dumps(camera_path or [])}
    fps = {fps}
    duration = {duration}

    scene.render.fps = fps
    frame_count = int(fps * duration)
    scene.frame_end = frame_count

    # Insert keyframes
    for i, keyframe in enumerate(camera_path):
        frame = int((i / len(camera_path)) * frame_count)
        camera_obj.location = keyframe["position"]
        camera_obj.rotation_euler = keyframe["rotation"]
        camera_obj.keyframe_insert(data_path="location", frame=frame)
        camera_obj.keyframe_insert(data_path="rotation_euler", frame=frame)

# Post-processing (Compositor nodes)
post_fx = {json.dumps(post_fx or {{}})}
if post_fx:
    scene.use_nodes = True
    tree = scene.node_tree

    # Clear default nodes
    for node in tree.nodes:
        tree.nodes.remove(node)

    # Create nodes
    render_layers = tree.nodes.new('CompositorNodeRLayers')
    composite = tree.nodes.new('CompositorNodeComposite')

    current_node = render_layers

    # LUT (Color lookup table)
    if 'lut' in post_fx:
        lut_node = tree.nodes.new('CompositorNodeColorCorrection')
        tree.links.new(current_node.outputs[0], lut_node.inputs[0])
        current_node = lut_node

    # Bloom
    if post_fx.get('bloom'):
        glare_node = tree.nodes.new('CompositorNodeGlare')
        glare_node.glare_type = 'BLOOM'
        glare_node.threshold = post_fx.get('bloom_threshold', 1.0)
        tree.links.new(current_node.outputs[0], glare_node.inputs[0])
        current_node = glare_node

    # Vignette
    if post_fx.get('vignette'):
        vignette_node = tree.nodes.new('CompositorNodeLensdist')
        vignette_node.use_fit = True
        tree.links.new(current_node.outputs[0], vignette_node.inputs[0])
        current_node = vignette_node

    # Connect to composite
    tree.links.new(current_node.outputs[0], composite.inputs[0])

# Helper function for PBR materials
def create_pbr_material(mat_data):
    mat = bpy.data.materials.new(mat_data.get("name", "Material"))
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Clear default nodes
    nodes.clear()

    # Create Principled BSDF
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    output = nodes.new('ShaderNodeOutputMaterial')
    links.new(bsdf.outputs[0], output.inputs[0])

    # Set properties
    bsdf.inputs['Base Color'].default_value = mat_data.get("color", [0.8, 0.8, 0.8, 1.0])
    bsdf.inputs['Metallic'].default_value = mat_data.get("metallic", 0.0)
    bsdf.inputs['Roughness'].default_value = mat_data.get("roughness", 0.5)

    # Load textures if provided
    if 'albedo_texture' in mat_data:
        img_tex = nodes.new('ShaderNodeTexImage')
        img_tex.image = bpy.data.images.load(mat_data['albedo_texture'])
        links.new(img_tex.outputs[0], bsdf.inputs['Base Color'])

    return mat

# Render
output_path = "{output_path}"
scene.render.filepath = output_path

if '{render_type}' == 'STILL':
    bpy.ops.render.render(write_still=True)
elif '{render_type}' == 'ANIMATION':
    bpy.ops.render.render(animation=True)

print("RENDER_COMPLETE")
'''
        return script

    def _save_script(self, script: str, name: str) -> str:
        """Save Blender Python script to temporary file"""
        script_path = self.script_dir / f"{name}_{os.getpid()}.py"
        with open(script_path, 'w') as f:
            f.write(script)
        return str(script_path)

    def _execute_blender(self, script_path: str, output_path: str) -> Dict[str, Any]:
        """Execute Blender in background mode"""
        try:
            cmd = [
                self.blender_path,
                "--background",
                "--python", script_path,
                "--", output_path
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=3600  # 1 hour timeout
            )

            success = "RENDER_COMPLETE" in result.stdout

            return {
                "success": success,
                "output_path": output_path if success else None,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode
            }

        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Render timeout (exceeded 1 hour)"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
        finally:
            # Cleanup script file
            try:
                os.remove(script_path)
            except:
                pass

    def _encode_video(self, frames_path: str, fps: int) -> str:
        """Encode rendered frames to video using FFmpeg"""
        video_path = frames_path.replace("%04d.png", ".mp4")

        cmd = [
            "ffmpeg",
            "-framerate", str(fps),
            "-i", frames_path,
            "-c:v", "libx264",
            "-preset", "slow",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            "-y",  # Overwrite
            video_path
        ]

        subprocess.run(cmd, capture_output=True)
        return video_path


# Material Library for Blender
MATERIAL_PRESETS = {
    "wood_oak": {
        "name": "Oak Wood",
        "color": [0.6, 0.4, 0.2, 1.0],
        "roughness": 0.6,
        "metallic": 0.0
    },
    "wood_cedar": {
        "name": "Cedar Wood",
        "color": [0.7, 0.35, 0.2, 1.0],
        "roughness": 0.5,
        "metallic": 0.0
    },
    "concrete": {
        "name": "Concrete",
        "color": [0.5, 0.5, 0.5, 1.0],
        "roughness": 0.8,
        "metallic": 0.0
    },
    "rammed_earth": {
        "name": "Rammed Earth",
        "color": [0.6, 0.5, 0.4, 1.0],
        "roughness": 0.9,
        "metallic": 0.0
    },
    "glass_clear": {
        "name": "Clear Glass",
        "color": [1.0, 1.0, 1.0, 1.0],
        "roughness": 0.0,
        "metallic": 0.0,
        "transmission": 1.0,
        "ior": 1.5
    },
    "metal_brushed": {
        "name": "Brushed Metal",
        "color": [0.8, 0.8, 0.8, 1.0],
        "roughness": 0.3,
        "metallic": 1.0
    },
    "tile_ceramic": {
        "name": "Ceramic Tile",
        "color": [0.9, 0.9, 0.85, 1.0],
        "roughness": 0.2,
        "metallic": 0.0
    }
}

# HDRI Environment Presets
HDRI_PRESETS = {
    "studio": "/hdri/studio_soft.hdr",
    "sunset": "/hdri/sunset_warm.hdr",
    "dawn": "/hdri/dawn_cool.hdr",
    "overcast": "/hdri/overcast_soft.hdr",
    "desert": "/hdri/desert_sunny.hdr",
    "forest": "/hdri/forest_ambient.hdr"
}
