/**
 * MLOps Workflow E2E Tests
 * Complete end-to-end workflow testing for ML model lifecycle management
 * Total: 10 tests
 *
 * Workflow: Model upload → Training → Deployment → A/B testing → Monitoring
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_USER = { email: 'test@example.com', password: 'Test123456!' }

test.describe('MLOps Workflow E2E Tests', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.fill('[data-testid="email-input"]', TEST_USER.email)
    await page.fill('[data-testid="password-input"]', TEST_USER.password)
    await page.click('[data-testid="signin-button"]')
    await expect(page).toHaveURL(/\\/dashboard/)
  })

  test.afterEach(async () => {
    await page.close()
  })

  // Model Upload Tests (2 tests)
  test('should upload ML model package', async () => {
    await page.goto(`${BASE_URL}/ml/models`)

    await page.click('[data-testid="upload-model-button"]')
    await page.fill('[data-testid="model-name-input"]', 'Design Style Classifier v1')
    await page.fill('[data-testid="model-version-input"]', '1.0.0')
    await page.selectOption('[data-testid="model-type-select"]', 'classification')
    await page.selectOption('[data-testid="framework-select"]', 'tensorflow')

    // Upload model file
    const modelInput = page.locator('[data-testid="model-file-input"]')
    await modelInput.setInputFiles({
      name: 'model.h5',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('Mock TensorFlow model data')
    })

    // Upload model config
    const configInput = page.locator('[data-testid="config-file-input"]')
    await configInput.setInputFiles({
      name: 'config.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({
        input_shape: [224, 224, 3],
        output_classes: 10,
        preprocessing: 'normalize'
      }))
    })

    await page.click('[data-testid="upload-model-submit-button"]')
    await expect(page.locator('[data-testid="model-uploaded-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="model-list"]')).toContainText('Design Style Classifier v1')
  })

  test('should validate uploaded model', async () => {
    await page.goto(`${BASE_URL}/ml/models`)

    await page.click('[data-testid="model-card"]:first-child')
    await page.click('[data-testid="validate-model-button"]')

    // Validation process
    await expect(page.locator('[data-testid="validation-status"]')).toContainText(/Validating|Running/)
    await expect(page.locator('[data-testid="validation-complete"]')).toBeVisible({ timeout: 15000 })

    // Check validation results
    await expect(page.locator('[data-testid="input-shape-valid"]')).toBeVisible()
    await expect(page.locator('[data-testid="output-shape-valid"]')).toBeVisible()
    await expect(page.locator('[data-testid="dependencies-valid"]')).toBeVisible()
  })

  // Model Training Tests (2 tests)
  test('should configure and start model training', async () => {
    await page.goto(`${BASE_URL}/ml/models`)

    await page.click('[data-testid="model-card"]:first-child')
    await page.click('[data-testid="train-model-button"]')

    // Configure training
    await page.fill('[data-testid="training-job-name-input"]', 'Style Classifier Training Job 1')
    await page.selectOption('[data-testid="dataset-select"]', 'architectural-styles-v2')
    await page.fill('[data-testid="epochs-input"]', '50')
    await page.fill('[data-testid="batch-size-input"]', '32')
    await page.fill('[data-testid="learning-rate-input"]', '0.001')

    // Select compute resources
    await page.selectOption('[data-testid="instance-type-select"]', 'gpu-tesla-v100')
    await page.fill('[data-testid="max-runtime-input"]', '3600')

    await page.click('[data-testid="start-training-button"]')
    await expect(page.locator('[data-testid="training-started-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="job-status"]')).toContainText(/Initializing|Running/)
  })

  test('should monitor training progress and metrics', async () => {
    await page.goto(`${BASE_URL}/ml/training-jobs`)

    await page.click('[data-testid="training-job-card"]:first-child')

    // Check training metrics
    await expect(page.locator('[data-testid="current-epoch"]')).toContainText(/Epoch \d+/)
    await expect(page.locator('[data-testid="training-loss"]')).toContainText(/\d+\.\d+/)
    await expect(page.locator('[data-testid="validation-accuracy"]')).toContainText(/\d+\.\d+%/)

    // View training charts
    await expect(page.locator('[data-testid="loss-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="accuracy-chart"]')).toBeVisible()

    // Check resource utilization
    await page.click('[data-testid="resources-tab"]')
    await expect(page.locator('[data-testid="gpu-utilization"]')).toContainText(/\d+%/)
    await expect(page.locator('[data-testid="memory-usage"]')).toContainText(/\d+ GB/)
  })

  // Model Deployment Tests (2 tests)
  test('should deploy model to staging environment', async () => {
    await page.goto(`${BASE_URL}/ml/models`)

    await page.click('[data-testid="model-card"]:first-child')
    await page.click('[data-testid="deploy-model-button"]')

    await page.selectOption('[data-testid="environment-select"]', 'staging')
    await page.fill('[data-testid="endpoint-name-input"]', 'style-classifier-staging')
    await page.selectOption('[data-testid="instance-type-select"]', 'ml-m5-large')
    await page.fill('[data-testid="instance-count-input"]', '2')

    // Configure auto-scaling
    await page.check('[data-testid="enable-autoscaling-checkbox"]')
    await page.fill('[data-testid="min-instances-input"]', '1')
    await page.fill('[data-testid="max-instances-input"]', '5')
    await page.fill('[data-testid="target-requests-input"]', '100')

    await page.click('[data-testid="deploy-submit-button"]')
    await expect(page.locator('[data-testid="deployment-started-toast"]')).toBeVisible()
  })

  test('should deploy model to production environment', async () => {
    await page.goto(`${BASE_URL}/ml/models`)

    await page.click('[data-testid="model-card"]:first-child')
    await page.click('[data-testid="deploy-model-button"]')

    await page.selectOption('[data-testid="environment-select"]', 'production')
    await page.fill('[data-testid="endpoint-name-input"]', 'style-classifier-prod')
    await page.selectOption('[data-testid="instance-type-select"]', 'ml-c5-xlarge')
    await page.fill('[data-testid="instance-count-input"]', '3')

    // Configure deployment strategy
    await page.selectOption('[data-testid="deployment-strategy-select"]', 'blue-green')

    // Set traffic routing
    await page.check('[data-testid="enable-canary-checkbox"]')
    await page.fill('[data-testid="canary-traffic-percent-input"]', '10')

    await page.click('[data-testid="deploy-submit-button"]')
    await expect(page.locator('[data-testid="deployment-started-toast"]')).toBeVisible()

    // Wait for deployment
    await expect(page.locator('[data-testid="deployment-status"]')).toContainText(/InService|Deployed/, { timeout: 20000 })
    await expect(page.locator('[data-testid="endpoint-url"]')).toBeVisible()
  })

  // A/B Testing Tests (2 tests)
  test('should create A/B test for model variants', async () => {
    await page.goto(`${BASE_URL}/ml/experiments`)

    await page.click('[data-testid="create-experiment-button"]')
    await page.fill('[data-testid="experiment-name-input"]', 'Style Classifier A/B Test')
    await page.fill('[data-testid="experiment-description-input"]', 'Testing v1.0 vs v1.1 performance')

    // Configure variant A
    await page.selectOption('[data-testid="variant-a-model-select"]', 'style-classifier-v1.0')
    await page.fill('[data-testid="variant-a-traffic-input"]', '50')

    // Configure variant B
    await page.selectOption('[data-testid="variant-b-model-select"]', 'style-classifier-v1.1')
    await page.fill('[data-testid="variant-b-traffic-input"]', '50')

    // Set success metrics
    await page.check('[data-testid="metric-accuracy"]')
    await page.check('[data-testid="metric-latency"]')
    await page.check('[data-testid="metric-user-satisfaction"]')

    await page.fill('[data-testid="duration-days-input"]', '7')

    await page.click('[data-testid="start-experiment-button"]')
    await expect(page.locator('[data-testid="experiment-started-toast"]')).toBeVisible()
  })

  test('should monitor A/B test results', async () => {
    await page.goto(`${BASE_URL}/ml/experiments`)

    await page.click('[data-testid="experiment-card"]:first-child')

    // View experiment overview
    await expect(page.locator('[data-testid="experiment-status"]')).toContainText(/Running|Active/)
    await expect(page.locator('[data-testid="total-requests"]')).toContainText(/\d+/)

    // Compare variant metrics
    const variantA = page.locator('[data-testid="variant-a-metrics"]')
    await expect(variantA.locator('[data-testid="accuracy"]')).toContainText(/\d+\.\d+%/)
    await expect(variantA.locator('[data-testid="latency"]')).toContainText(/\d+ ms/)

    const variantB = page.locator('[data-testid="variant-b-metrics"]')
    await expect(variantB.locator('[data-testid="accuracy"]')).toContainText(/\d+\.\d+%/)
    await expect(variantB.locator('[data-testid="latency"]')).toContainText(/\d+ ms/)

    // Check statistical significance
    await expect(page.locator('[data-testid="statistical-significance"]')).toBeVisible()

    // View charts
    await expect(page.locator('[data-testid="accuracy-comparison-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="latency-comparison-chart"]')).toBeVisible()
  })

  // Model Monitoring Tests (2 tests)
  test('should monitor model performance metrics', async () => {
    await page.goto(`${BASE_URL}/ml/endpoints`)

    await page.click('[data-testid="endpoint-card"]:first-child')
    await page.click('[data-testid="monitoring-tab"]')

    // View real-time metrics
    await expect(page.locator('[data-testid="requests-per-second"]')).toContainText(/\d+/)
    await expect(page.locator('[data-testid="avg-latency"]')).toContainText(/\d+ ms/)
    await expect(page.locator('[data-testid="error-rate"]')).toContainText(/\d+\.\d+%/)

    // Check prediction distribution
    await expect(page.locator('[data-testid="prediction-distribution-chart"]')).toBeVisible()

    // View time-series metrics
    await page.selectOption('[data-testid="time-range-select"]', '24h')
    await expect(page.locator('[data-testid="metrics-chart"]')).toBeVisible()
  })

  test('should detect and alert on model drift', async () => {
    await page.goto(`${BASE_URL}/ml/endpoints`)

    await page.click('[data-testid="endpoint-card"]:first-child')
    await page.click('[data-testid="drift-detection-tab"]')

    // Configure drift detection
    await page.click('[data-testid="configure-drift-button"]')
    await page.fill('[data-testid="baseline-dataset-select"]', 'training-set-v1')
    await page.selectOption('[data-testid="drift-metric-select"]', 'kl-divergence')
    await page.fill('[data-testid="drift-threshold-input"]', '0.1')

    // Set alert configuration
    await page.check('[data-testid="enable-drift-alerts-checkbox"]')
    await page.selectOption('[data-testid="alert-severity-select"]', 'warning')
    await page.selectOption('[data-testid="alert-channel-select"]', 'email')

    await page.click('[data-testid="save-drift-config-button"]')
    await expect(page.locator('[data-testid="drift-config-saved-toast"]')).toBeVisible()

    // View drift metrics
    await expect(page.locator('[data-testid="feature-drift-score"]')).toContainText(/\d+\.\d+/)
    await expect(page.locator('[data-testid="prediction-drift-score"]')).toContainText(/\d+\.\d+/)
    await expect(page.locator('[data-testid="drift-status"]')).toContainText(/No Drift|Drift Detected/)
  })
})

/**
 * Test Summary:
 * - Model Upload: 2 tests (upload package, validate model)
 * - Model Training: 2 tests (configure and start training, monitor progress)
 * - Model Deployment: 2 tests (deploy to staging, deploy to production)
 * - A/B Testing: 2 tests (create experiment, monitor results)
 * - Model Monitoring: 2 tests (performance metrics, drift detection)
 *
 * Total: 10 comprehensive E2E tests covering MLOps workflow
 */
