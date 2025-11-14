/**
 * Digital Twin Service
 *
 * Creates and manages digital twins with real-time IoT sensor integration
 * Supports predictive analytics and adaptive building simulations
 */

import { EventEmitter } from 'events'

export interface IoTSensor {
  id: string
  type: 'temperature' | 'humidity' | 'occupancy' | 'light' | 'energy' | 'co2' | 'motion' | 'door' | 'window'
  location: {
    room?: string
    floor?: number
    position?: [number, number, number]
  }
  unit: string
  range?: {
    min: number
    max: number
  }
  calibration?: {
    offset: number
    scale: number
  }
}

export interface SensorReading {
  sensorId: string
  timestamp: Date
  value: number
  quality: 'good' | 'uncertain' | 'bad'
  metadata?: Record<string, any>
}

export interface DigitalTwinState {
  projectId: string
  buildingId: string
  lastUpdate: Date
  sensors: IoTSensor[]
  currentReadings: Map<string, SensorReading>
  historicalData: Map<string, SensorReading[]>
  predictions: Map<string, PredictedValue[]>
  anomalies: Anomaly[]
  alerts: Alert[]
}

export interface PredictedValue {
  timestamp: Date
  value: number
  confidence: number
  lower: number // Confidence interval lower bound
  upper: number // Confidence interval upper bound
}

export interface Anomaly {
  id: string
  sensorId: string
  timestamp: Date
  expectedValue: number
  actualValue: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
}

export interface Alert {
  id: string
  type: 'threshold' | 'anomaly' | 'offline' | 'prediction'
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  sensorId?: string
  timestamp: Date
  acknowledged: boolean
}

export interface AdaptiveAction {
  id: string
  type: 'hvac' | 'lighting' | 'shading' | 'ventilation'
  action: string
  reason: string
  timestamp: Date
  estimatedImpact: {
    energySavings?: number
    comfortImprovement?: number
    costSavings?: number
  }
}

export interface DigitalTwinConfig {
  projectId: string
  buildingId: string
  updateInterval: number // milliseconds
  predictionHorizon: number // hours
  anomalyThreshold: number // standard deviations
  kafkaConfig?: {
    brokers: string[]
    topic: string
    groupId: string
  }
  mqttConfig?: {
    broker: string
    port: number
    username?: string
    password?: string
    topics: string[]
  }
}

export class DigitalTwinService extends EventEmitter {
  private config: DigitalTwinConfig
  private state: DigitalTwinState
  private updateTimer?: NodeJS.Timeout
  private predictionModels: Map<string, any> // Would be TensorFlow models in production
  private kafkaConsumer?: any // Kafka consumer instance
  private mqttClient?: any // MQTT client instance

  constructor(config: DigitalTwinConfig) {
    super()
    this.config = config
    this.predictionModels = new Map()

    this.state = {
      projectId: config.projectId,
      buildingId: config.buildingId,
      lastUpdate: new Date(),
      sensors: [],
      currentReadings: new Map(),
      historicalData: new Map(),
      predictions: new Map(),
      anomalies: [],
      alerts: []
    }
  }

  /**
   * Initialize digital twin and start listening to IoT streams
   */
  async initialize(): Promise<void> {
    console.log(`Initializing digital twin for building ${this.config.buildingId}`)

    // Connect to Kafka for IoT data streams
    if (this.config.kafkaConfig) {
      await this.connectKafka()
    }

    // Connect to MQTT for sensor data
    if (this.config.mqttConfig) {
      await this.connectMQTT()
    }

    // Start update loop
    this.startUpdateLoop()

    this.emit('initialized', { buildingId: this.config.buildingId })
  }

  /**
   * Connect to Kafka for streaming IoT data
   */
  private async connectKafka(): Promise<void> {
    // In production, use kafkajs library
    // const { Kafka } = require('kafkajs')
    //
    // const kafka = new Kafka({
    //   clientId: `digital-twin-${this.config.buildingId}`,
    //   brokers: this.config.kafkaConfig!.brokers
    // })
    //
    // this.kafkaConsumer = kafka.consumer({
    //   groupId: this.config.kafkaConfig!.groupId
    // })
    //
    // await this.kafkaConsumer.connect()
    // await this.kafkaConsumer.subscribe({
    //   topic: this.config.kafkaConfig!.topic,
    //   fromBeginning: false
    // })
    //
    // await this.kafkaConsumer.run({
    //   eachMessage: async ({ message }) => {
    //     const reading = JSON.parse(message.value.toString())
    //     await this.processSensorReading(reading)
    //   }
    // })

    console.log('Kafka connection established (simulated)')
  }

  /**
   * Connect to MQTT for sensor data
   */
  private async connectMQTT(): Promise<void> {
    // In production, use mqtt library
    // const mqtt = require('mqtt')
    //
    // this.mqttClient = mqtt.connect(`mqtt://${this.config.mqttConfig!.broker}:${this.config.mqttConfig!.port}`, {
    //   username: this.config.mqttConfig!.username,
    //   password: this.config.mqttConfig!.password
    // })
    //
    // this.mqttClient.on('connect', () => {
    //   console.log('MQTT connected')
    //   this.config.mqttConfig!.topics.forEach(topic => {
    //     this.mqttClient!.subscribe(topic)
    //   })
    // })
    //
    // this.mqttClient.on('message', async (topic: string, message: Buffer) => {
    //   const reading = JSON.parse(message.toString())
    //   await this.processSensorReading(reading)
    // })

    console.log('MQTT connection established (simulated)')
  }

  /**
   * Register IoT sensors
   */
  registerSensors(sensors: IoTSensor[]): void {
    this.state.sensors.push(...sensors)

    // Initialize data structures for new sensors
    sensors.forEach(sensor => {
      this.state.historicalData.set(sensor.id, [])
      this.state.predictions.set(sensor.id, [])
    })

    this.emit('sensors-registered', { count: sensors.length })
  }

  /**
   * Process incoming sensor reading
   */
  async processSensorReading(reading: SensorReading): Promise<void> {
    // Validate sensor exists
    const sensor = this.state.sensors.find(s => s.id === reading.sensorId)
    if (!sensor) {
      console.warn(`Unknown sensor: ${reading.sensorId}`)
      return
    }

    // Apply calibration if configured
    if (sensor.calibration) {
      reading.value = reading.value * sensor.calibration.scale + sensor.calibration.offset
    }

    // Validate range
    if (sensor.range) {
      if (reading.value < sensor.range.min || reading.value > sensor.range.max) {
        reading.quality = 'bad'
        this.createAlert({
          type: 'threshold',
          severity: 'warning',
          message: `Sensor ${sensor.id} reading out of range: ${reading.value} ${sensor.unit}`,
          sensorId: sensor.id,
          timestamp: reading.timestamp,
          acknowledged: false
        })
      }
    }

    // Store current reading
    this.state.currentReadings.set(reading.sensorId, reading)

    // Store in historical data
    const history = this.state.historicalData.get(reading.sensorId) || []
    history.push(reading)

    // Keep only recent data (e.g., last 7 days)
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const filteredHistory = history.filter(r => r.timestamp >= cutoff)
    this.state.historicalData.set(reading.sensorId, filteredHistory)

    // Detect anomalies
    await this.detectAnomalies(sensor, reading)

    // Update predictions
    await this.updatePredictions(sensor)

    // Trigger adaptive actions if needed
    await this.evaluateAdaptiveActions(sensor, reading)

    // Update timestamp
    this.state.lastUpdate = new Date()

    // Emit event
    this.emit('reading', { sensor, reading })
  }

  /**
   * Detect anomalies using statistical methods or ML
   */
  private async detectAnomalies(sensor: IoTSensor, reading: SensorReading): Promise<void> {
    const history = this.state.historicalData.get(sensor.id) || []

    if (history.length < 30) {
      // Need more data for anomaly detection
      return
    }

    // Calculate mean and standard deviation
    const values = history.map(r => r.value)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)

    // Check if current reading is anomalous (Z-score method)
    const zScore = Math.abs((reading.value - mean) / stdDev)

    if (zScore > this.config.anomalyThreshold) {
      const anomaly: Anomaly = {
        id: `anomaly_${Date.now()}_${sensor.id}`,
        sensorId: sensor.id,
        timestamp: reading.timestamp,
        expectedValue: mean,
        actualValue: reading.value,
        severity: zScore > 4 ? 'critical' : zScore > 3 ? 'high' : 'medium',
        description: `Unusual ${sensor.type} reading: ${reading.value} ${sensor.unit} (expected ~${mean.toFixed(2)} ${sensor.unit})`
      }

      this.state.anomalies.push(anomaly)

      // Create alert
      this.createAlert({
        type: 'anomaly',
        severity: anomaly.severity === 'critical' ? 'error' : 'warning',
        message: anomaly.description,
        sensorId: sensor.id,
        timestamp: reading.timestamp,
        acknowledged: false
      })

      this.emit('anomaly', anomaly)
    }
  }

  /**
   * Update predictions using time series forecasting
   */
  private async updatePredictions(sensor: IoTSensor): Promise<void> {
    const history = this.state.historicalData.get(sensor.id) || []

    if (history.length < 100) {
      // Need more data for reliable predictions
      return
    }

    // In production, use TensorFlow.js or similar for LSTM/ARIMA predictions
    // For now, use simple moving average with trend

    const recentValues = history.slice(-48).map(r => r.value) // Last 48 readings
    const mean = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length

    // Calculate trend
    const midpoint = Math.floor(recentValues.length / 2)
    const firstHalfMean = recentValues.slice(0, midpoint).reduce((sum, val) => sum + val, 0) / midpoint
    const secondHalfMean = recentValues.slice(midpoint).reduce((sum, val) => sum + val, 0) / (recentValues.length - midpoint)
    const trend = (secondHalfMean - firstHalfMean) / midpoint

    // Generate predictions
    const predictions: PredictedValue[] = []
    const now = Date.now()
    const interval = 60 * 60 * 1000 // 1 hour

    for (let i = 1; i <= this.config.predictionHorizon; i++) {
      const predictedValue = mean + trend * i
      const uncertainty = Math.sqrt(i) * 2 // Uncertainty increases with time

      predictions.push({
        timestamp: new Date(now + i * interval),
        value: predictedValue,
        confidence: Math.max(0, 1 - i / this.config.predictionHorizon),
        lower: predictedValue - uncertainty,
        upper: predictedValue + uncertainty
      })
    }

    this.state.predictions.set(sensor.id, predictions)
    this.emit('predictions-updated', { sensorId: sensor.id, predictions })
  }

  /**
   * Evaluate and trigger adaptive actions based on sensor data
   */
  private async evaluateAdaptiveActions(sensor: IoTSensor, reading: SensorReading): Promise<void> {
    const actions: AdaptiveAction[] = []

    // Temperature-based HVAC optimization
    if (sensor.type === 'temperature') {
      const occupancy = this.getCurrentOccupancy()
      const targetTemp = 22 // °C

      if (Math.abs(reading.value - targetTemp) > 2) {
        if (occupancy > 0) {
          actions.push({
            id: `action_${Date.now()}_hvac`,
            type: 'hvac',
            action: reading.value > targetTemp ? 'increase_cooling' : 'increase_heating',
            reason: `Temperature ${reading.value}°C is ${reading.value > targetTemp ? 'above' : 'below'} target ${targetTemp}°C with ${occupancy} occupants`,
            timestamp: new Date(),
            estimatedImpact: {
              comfortImprovement: 15,
              energySavings: -5 // Temporary increase in energy use
            }
          })
        } else {
          // No occupancy - use setback temperatures
          actions.push({
            id: `action_${Date.now()}_hvac_setback`,
            type: 'hvac',
            action: 'setback_mode',
            reason: `Building unoccupied, enabling energy-saving setback mode`,
            timestamp: new Date(),
            estimatedImpact: {
              energySavings: 30
            }
          })
        }
      }
    }

    // CO2-based ventilation control
    if (sensor.type === 'co2' && reading.value > 1000) {
      actions.push({
        id: `action_${Date.now()}_ventilation`,
        type: 'ventilation',
        action: 'increase_fresh_air',
        reason: `CO2 level ${reading.value} ppm exceeds comfort threshold (1000 ppm)`,
        timestamp: new Date(),
        estimatedImpact: {
          comfortImprovement: 20,
          energySavings: -10
        }
      })
    }

    // Light-based shading control
    if (sensor.type === 'light' && reading.value > 1000) {
      const hour = new Date().getHours()
      if (hour >= 10 && hour <= 16) {
        actions.push({
          id: `action_${Date.now()}_shading`,
          type: 'shading',
          action: 'lower_blinds',
          reason: `High light level ${reading.value} lux during peak sun hours`,
          timestamp: new Date(),
          estimatedImpact: {
            comfortImprovement: 10,
            energySavings: 5 // Reduced cooling load
          }
        })
      }
    }

    // Execute actions
    for (const action of actions) {
      await this.executeAdaptiveAction(action)
    }
  }

  /**
   * Execute adaptive action
   */
  private async executeAdaptiveAction(action: AdaptiveAction): Promise<void> {
    console.log(`Executing adaptive action: ${action.action} - ${action.reason}`)

    // In production, this would interface with building management systems (BMS)
    // via protocols like BACnet, Modbus, or REST APIs

    this.emit('adaptive-action', action)
  }

  /**
   * Get current building occupancy from occupancy sensors
   */
  private getCurrentOccupancy(): number {
    let totalOccupancy = 0

    this.state.sensors
      .filter(s => s.type === 'occupancy')
      .forEach(sensor => {
        const reading = this.state.currentReadings.get(sensor.id)
        if (reading && reading.quality === 'good') {
          totalOccupancy += reading.value
        }
      })

    return totalOccupancy
  }

  /**
   * Create alert
   */
  private createAlert(alert: Omit<Alert, 'id'>): void {
    const fullAlert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...alert
    }

    this.state.alerts.push(fullAlert)

    // Keep only recent alerts (last 100)
    if (this.state.alerts.length > 100) {
      this.state.alerts = this.state.alerts.slice(-100)
    }

    this.emit('alert', fullAlert)
  }

  /**
   * Start update loop for periodic tasks
   */
  private startUpdateLoop(): void {
    this.updateTimer = setInterval(() => {
      this.performPeriodicUpdate()
    }, this.config.updateInterval)
  }

  /**
   * Periodic update tasks
   */
  private async performPeriodicUpdate(): Promise<void> {
    // Check for offline sensors
    const now = Date.now()
    const offlineThreshold = 5 * 60 * 1000 // 5 minutes

    this.state.sensors.forEach(sensor => {
      const reading = this.state.currentReadings.get(sensor.id)
      if (!reading || (now - reading.timestamp.getTime()) > offlineThreshold) {
        this.createAlert({
          type: 'offline',
          severity: 'warning',
          message: `Sensor ${sensor.id} appears to be offline`,
          sensorId: sensor.id,
          timestamp: new Date(),
          acknowledged: false
        })
      }
    })

    // Update all predictions
    for (const sensor of this.state.sensors) {
      await this.updatePredictions(sensor)
    }

    this.emit('periodic-update', { timestamp: new Date() })
  }

  /**
   * Get current digital twin state
   */
  getState(): DigitalTwinState {
    return this.state
  }

  /**
   * Get sensor statistics
   */
  getSensorStatistics(sensorId: string, period: 'hour' | 'day' | 'week' | 'month'): {
    min: number
    max: number
    mean: number
    median: number
    stdDev: number
  } | null {
    const history = this.state.historicalData.get(sensorId)
    if (!history || history.length === 0) {
      return null
    }

    // Filter by period
    const now = Date.now()
    const periodMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    }[period]

    const filteredHistory = history.filter(r => (now - r.timestamp.getTime()) <= periodMs)
    const values = filteredHistory.map(r => r.value).sort((a, b) => a - b)

    if (values.length === 0) {
      return null
    }

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length

    return {
      min: values[0],
      max: values[values.length - 1],
      mean,
      median: values[Math.floor(values.length / 2)],
      stdDev: Math.sqrt(variance)
    }
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.state.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      this.emit('alert-acknowledged', { alertId })
      return true
    }
    return false
  }

  /**
   * Shutdown digital twin
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down digital twin...')

    // Stop update loop
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
    }

    // Disconnect from Kafka
    if (this.kafkaConsumer) {
      await this.kafkaConsumer.disconnect()
    }

    // Disconnect from MQTT
    if (this.mqttClient) {
      this.mqttClient.end()
    }

    this.emit('shutdown', { buildingId: this.config.buildingId })
  }
}

/**
 * Digital Twin Manager - manages multiple digital twins
 */
export class DigitalTwinManager {
  private twins: Map<string, DigitalTwinService> = new Map()

  /**
   * Create and start a new digital twin
   */
  async createDigitalTwin(config: DigitalTwinConfig): Promise<DigitalTwinService> {
    const twin = new DigitalTwinService(config)
    await twin.initialize()
    this.twins.set(config.buildingId, twin)
    return twin
  }

  /**
   * Get digital twin by building ID
   */
  getDigitalTwin(buildingId: string): DigitalTwinService | undefined {
    return this.twins.get(buildingId)
  }

  /**
   * Stop and remove digital twin
   */
  async removeDigitalTwin(buildingId: string): Promise<void> {
    const twin = this.twins.get(buildingId)
    if (twin) {
      await twin.shutdown()
      this.twins.delete(buildingId)
    }
  }

  /**
   * Get all active digital twins
   */
  getAllDigitalTwins(): DigitalTwinService[] {
    return Array.from(this.twins.values())
  }

  /**
   * Shutdown all digital twins
   */
  async shutdownAll(): Promise<void> {
    const promises = Array.from(this.twins.values()).map(twin => twin.shutdown())
    await Promise.all(promises)
    this.twins.clear()
  }
}
