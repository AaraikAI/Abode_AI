"""
Abode AI Python SDK

Official Python SDK for Abode AI API integration
"""

import requests
import time
from typing import Optional, Dict, List, Any, Tuple
from dataclasses import dataclass


@dataclass
class AbodeAIConfig:
    """Configuration for Abode AI SDK"""
    api_key: str
    base_url: str = "https://api.abodeai.com/v1"
    timeout: int = 30
    retry_attempts: int = 3


class AbodeAIError(Exception):
    """Base exception for Abode AI SDK"""
    def __init__(self, message: str, status_code: Optional[int] = None, code: Optional[str] = None):
        super().__init__(message)
        self.status_code = status_code
        self.code = code


class AbodeAI:
    """
    Abode AI SDK Client

    Example:
        >>> client = AbodeAI(api_key="your_api_key")
        >>> project = client.create_project(name="My Project")
        >>> print(project['id'])
    """

    def __init__(self, api_key: str, base_url: str = "https://api.abodeai.com/v1",
                 timeout: int = 30, retry_attempts: int = 3):
        """
        Initialize Abode AI client

        Args:
            api_key: Your Abode AI API key
            base_url: API base URL (default: https://api.abodeai.com/v1)
            timeout: Request timeout in seconds (default: 30)
            retry_attempts: Number of retry attempts for failed requests (default: 3)
        """
        if not api_key:
            raise AbodeAIError("API key is required")

        self.config = AbodeAIConfig(
            api_key=api_key,
            base_url=base_url,
            timeout=timeout,
            retry_attempts=retry_attempts
        )

        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {self.config.api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'AbodeAI-SDK-Python/1.0.0'
        })

    # ============== Projects ==============

    def create_project(self, name: str, description: Optional[str] = None) -> Dict[str, Any]:
        """Create a new project"""
        return self._request('POST', '/projects', {
            'name': name,
            'description': description
        })

    def get_project(self, project_id: str) -> Dict[str, Any]:
        """Get project by ID"""
        return self._request('GET', f'/projects/{project_id}')

    def list_projects(self, page: int = 1, limit: int = 20,
                     status: Optional[str] = None) -> Dict[str, Any]:
        """List all projects"""
        params = {'page': page, 'limit': limit}
        if status:
            params['status'] = status
        return self._request('GET', '/projects', params=params)

    def update_project(self, project_id: str, **kwargs) -> Dict[str, Any]:
        """Update project"""
        return self._request('PATCH', f'/projects/{project_id}', kwargs)

    def delete_project(self, project_id: str) -> None:
        """Delete project"""
        self._request('DELETE', f'/projects/{project_id}')

    # ============== Design Models ==============

    def create_model(self, project_id: str, name: str,
                    model_type: str, data: Any) -> Dict[str, Any]:
        """Create a new design model"""
        return self._request('POST', '/models', {
            'projectId': project_id,
            'name': name,
            'type': model_type,
            'data': data
        })

    def get_model(self, model_id: str) -> Dict[str, Any]:
        """Get model by ID"""
        return self._request('GET', f'/models/{model_id}')

    def list_models(self, project_id: str) -> List[Dict[str, Any]]:
        """List all models in a project"""
        return self._request('GET', f'/projects/{project_id}/models')

    # ============== Rendering ==============

    def create_render(self, project_id: str, model_id: str,
                     resolution: Tuple[int, int], samples: int = 128,
                     engine: str = 'cycles') -> Dict[str, Any]:
        """Create a render job"""
        return self._request('POST', '/render', {
            'projectId': project_id,
            'modelId': model_id,
            'resolution': resolution,
            'samples': samples,
            'engine': engine
        })

    def get_render_status(self, job_id: str) -> Dict[str, Any]:
        """Get render job status"""
        return self._request('GET', f'/render/{job_id}')

    def wait_for_render(self, job_id: str, poll_interval: int = 5) -> Dict[str, Any]:
        """
        Wait for render to complete

        Args:
            job_id: Render job ID
            poll_interval: Polling interval in seconds

        Returns:
            Completed render job data

        Raises:
            AbodeAIError: If render fails
        """
        while True:
            job = self.get_render_status(job_id)

            if job['status'] == 'completed':
                return job
            elif job['status'] == 'failed':
                raise AbodeAIError('Render job failed', code='RENDER_FAILED')

            time.sleep(poll_interval)

    # ============== Energy Simulation ==============

    def run_energy_simulation(self, project_id: str, climate: str,
                            building_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run energy simulation"""
        return self._request('POST', '/energy/simulate', {
            'projectId': project_id,
            'climate': climate,
            'buildingData': building_data
        })

    def get_energy_report(self, simulation_id: str) -> Dict[str, Any]:
        """Get energy simulation report"""
        return self._request('GET', f'/energy/simulations/{simulation_id}')

    # ============== Bionic Design ==============

    def optimize_design(self, project_id: str, pattern: str,
                       constraints: Dict[str, Any],
                       objectives: Dict[str, Any]) -> Dict[str, Any]:
        """
        Optimize design using bionic patterns

        Args:
            project_id: Project ID
            pattern: Bionic pattern ('honeycomb', 'spider-web', 'bone', 'tree')
            constraints: Design constraints
            objectives: Optimization objectives
        """
        return self._request('POST', '/bionic/optimize', {
            'projectId': project_id,
            'pattern': pattern,
            'constraints': constraints,
            'objectives': objectives
        })

    def get_bionic_results(self, optimization_id: str) -> Dict[str, Any]:
        """Get bionic optimization results"""
        return self._request('GET', f'/bionic/optimizations/{optimization_id}')

    # ============== Blockchain ==============

    def register_material(self, material_name: str, material_type: str,
                         origin: Dict[str, Any],
                         sustainability: Dict[str, Any]) -> Dict[str, Any]:
        """Register material on blockchain"""
        return self._request('POST', '/blockchain/materials', {
            'materialName': material_name,
            'materialType': material_type,
            'origin': origin,
            'sustainability': sustainability
        })

    def get_material_provenance(self, material_id: str) -> Dict[str, Any]:
        """Get material provenance from blockchain"""
        return self._request('GET', f'/blockchain/materials/{material_id}')

    def verify_supply_chain(self, material_id: str) -> Dict[str, Any]:
        """Verify supply chain integrity"""
        return self._request('GET', f'/blockchain/materials/{material_id}/verify')

    # ============== AR/VR Export ==============

    def export_to_ar(self, project_id: str, format: str = 'glb',
                    options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Export project to AR/VR format"""
        return self._request('POST', '/arvr/export', {
            'projectId': project_id,
            'format': format,
            'options': options or {}
        })

    # ============== Digital Twin ==============

    def create_digital_twin(self, project_id: str, building_id: str,
                          sensors: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create digital twin for building"""
        return self._request('POST', f'/digital-twin/{building_id}', {
            'action': 'create',
            'data': {
                'projectId': project_id,
                'buildingId': building_id,
                'sensors': sensors
            }
        })

    def send_sensor_reading(self, building_id: str, sensor_id: str,
                          value: float, timestamp: Optional[str] = None,
                          quality: str = 'good') -> Dict[str, Any]:
        """Send sensor reading to digital twin"""
        return self._request('POST', f'/digital-twin/{building_id}', {
            'action': 'sensor-reading',
            'data': {
                'sensorId': sensor_id,
                'value': value,
                'timestamp': timestamp,
                'quality': quality
            }
        })

    def get_digital_twin_state(self, building_id: str) -> Dict[str, Any]:
        """Get current state of digital twin"""
        return self._request('GET', f'/digital-twin/{building_id}',
                           params={'action': 'state'})

    # ============== Marketplace ==============

    def search_assets(self, query: Optional[str] = None,
                     asset_type: Optional[str] = None,
                     category: Optional[str] = None,
                     page: int = 1, limit: int = 24) -> Dict[str, Any]:
        """Search marketplace assets"""
        params = {'page': page, 'limit': limit}
        if query:
            params['query'] = query
        if asset_type:
            params['type'] = asset_type
        if category:
            params['category'] = category
        return self._request('GET', '/marketplace/assets', params=params)

    def purchase_asset(self, asset_id: str, payment_method_id: str) -> Dict[str, Any]:
        """Purchase marketplace asset"""
        return self._request('POST', '/marketplace/assets', {
            'action': 'purchase',
            'assetId': asset_id,
            'paymentMethodId': payment_method_id
        })

    # ============== Referrals ==============

    def get_referral_code(self) -> Dict[str, Any]:
        """Get user's referral code"""
        return self._request('GET', '/referrals/code')

    def get_referral_stats(self) -> Dict[str, Any]:
        """Get referral statistics"""
        return self._request('GET', '/referrals/stats')

    def get_leaderboard(self, period: str = 'all-time') -> List[Dict[str, Any]]:
        """
        Get referral leaderboard

        Args:
            period: Time period ('all-time', 'monthly', 'weekly')
        """
        return self._request('GET', '/referrals/leaderboard',
                           params={'period': period})

    # ============== AI Training ==============

    def create_dataset(self, name: str, dataset_type: str) -> Dict[str, Any]:
        """
        Create AI training dataset

        Args:
            name: Dataset name
            dataset_type: Type ('style-transfer', 'object-detection', 'material-recognition')
        """
        return self._request('POST', '/ai/training', {
            'action': 'create-dataset',
            'name': name,
            'type': dataset_type
        })

    def start_training(self, dataset_id: str, model_config: Dict[str, Any]) -> Dict[str, Any]:
        """Start AI model training"""
        return self._request('POST', '/ai/training', {
            'action': 'start-training',
            'datasetId': dataset_id,
            'modelConfig': model_config
        })

    def run_inference(self, deployment_id: str, input_data: Any) -> Dict[str, Any]:
        """Run inference on deployed model"""
        return self._request('POST', '/ai/training', {
            'action': 'inference',
            'request': {
                'deploymentId': deployment_id,
                'input': input_data
            }
        })

    # ============== Collaboration ==============

    def join_session(self, session_id: str, user_name: str) -> Dict[str, Any]:
        """Join collaboration session"""
        return self._request('POST', f'/collaboration/{session_id}/join', {
            'userName': user_name
        })

    def add_comment(self, session_id: str, position: Dict[str, float],
                   text: str) -> Dict[str, Any]:
        """Add comment to collaboration session"""
        return self._request('POST', f'/collaboration/{session_id}/comments', {
            'position': position,
            'text': text
        })

    # ============== Core Request Method ==============

    def _request(self, method: str, path: str,
                data: Optional[Dict[str, Any]] = None,
                params: Optional[Dict[str, Any]] = None) -> Any:
        """Make HTTP request to API"""
        url = f"{self.config.base_url}{path}"

        last_error = None

        for attempt in range(self.config.retry_attempts):
            try:
                response = self.session.request(
                    method=method,
                    url=url,
                    json=data if method != 'GET' else None,
                    params=params,
                    timeout=self.config.timeout
                )

                response_data = response.json()

                if not response.ok:
                    raise AbodeAIError(
                        response_data.get('error', 'Request failed'),
                        response.status_code,
                        response_data.get('code')
                    )

                return response_data.get('data', response_data)

            except requests.exceptions.RequestException as e:
                last_error = e

                # Don't retry on client errors (4xx)
                if hasattr(e, 'response') and e.response is not None:
                    if 400 <= e.response.status_code < 500:
                        raise

                # Wait before retrying
                if attempt < self.config.retry_attempts - 1:
                    time.sleep(2 ** attempt)

        raise AbodeAIError(f"Request failed after {self.config.retry_attempts} attempts: {last_error}")

    def __enter__(self):
        """Context manager support"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Close session on exit"""
        self.session.close()


# Version
__version__ = "1.0.0"

# Export main class
__all__ = ['AbodeAI', 'AbodeAIError', 'AbodeAIConfig']
