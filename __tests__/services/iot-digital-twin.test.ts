/**
 * IoT and Digital Twin Service Tests
 * Tests IoT device integration, sensor data streaming, and predictive maintenance
 */

import { IoTDigitalTwinService } from '@/lib/services/iot-digital-twin'

describe('IoTDigitalTwinService', () => {
  let service: IoTDigitalTwinService

  beforeEach(() => {
    service = new IoTDigitalTwinService()
  })

  afterEach(() => {
    service.disconnect()
  })

  describe('Device Registration', () => {
    test('should register IoT device', async () => {
      const device = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'hvac_sensor',
        manufacturer: 'Honeywell',
        model: 'TH8000',
        macAddress: '00:1B:44:11:3A:B7',
        capabilities: ['temperature', 'humidity', 'occupancy']
      })

      expect(device).toHaveProperty('deviceId')
      expect(device.status).toBe('registered')
      expect(device.capabilities).toHaveLength(3)
    })

    test('should validate device credentials', async () => {
      const device = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'hvac_sensor',
        manufacturer: 'Honeywell',
        model: 'TH8000',
        macAddress: '00:1B:44:11:3A:B7'
      })

      expect(device.credentials).toHaveProperty('apiKey')
      expect(device.credentials).toHaveProperty('secretHash')
    })

    test('should prevent duplicate MAC addresses', async () => {
      await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'hvac_sensor',
        manufacturer: 'Honeywell',
        model: 'TH8000',
        macAddress: '00:1B:44:11:3A:B7'
      })

      await expect(
        service.registerDevice({
          projectId: 'project-123',
          deviceType: 'lighting',
          manufacturer: 'Philips',
          model: 'Hue',
          macAddress: '00:1B:44:11:3A:B7' // Duplicate
        })
      ).rejects.toThrow('Device already registered')
    })

    test('should support different device types', async () => {
      const deviceTypes = [
        'hvac_sensor',
        'lighting_controller',
        'energy_meter',
        'water_meter',
        'security_camera',
        'access_control',
        'smoke_detector',
        'leak_sensor'
      ]

      for (const type of deviceTypes) {
        const device = await service.registerDevice({
          projectId: 'project-123',
          deviceType: type,
          manufacturer: 'Test',
          model: 'Model',
          macAddress: `00:1B:44:11:3A:${deviceTypes.indexOf(type).toString(16).padStart(2, '0')}`
        })

        expect(device.deviceType).toBe(type)
      }
    })
  })

  describe('Sensor Data Streaming', () => {
    test('should stream temperature data', async () => {
      const device = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'hvac_sensor',
        capabilities: ['temperature']
      })

      const dataPoints: any[] = []
      service.subscribeSensor(device.deviceId, 'temperature', (data) => {
        dataPoints.push(data)
      })

      await service.publishSensorData(device.deviceId, 'temperature', {
        value: 72.5,
        unit: 'fahrenheit',
        timestamp: new Date()
      })

      expect(dataPoints).toHaveLength(1)
      expect(dataPoints[0].value).toBe(72.5)
      expect(dataPoints[0].unit).toBe('fahrenheit')
    })

    test('should stream multiple sensor types', async () => {
      const device = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'hvac_sensor',
        capabilities: ['temperature', 'humidity', 'co2']
      })

      const readings: any = {}

      service.subscribeSensor(device.deviceId, 'temperature', (data) => {
        readings.temperature = data.value
      })

      service.subscribeSensor(device.deviceId, 'humidity', (data) => {
        readings.humidity = data.value
      })

      service.subscribeSensor(device.deviceId, 'co2', (data) => {
        readings.co2 = data.value
      })

      await service.publishSensorData(device.deviceId, 'temperature', { value: 72 })
      await service.publishSensorData(device.deviceId, 'humidity', { value: 45 })
      await service.publishSensorData(device.deviceId, 'co2', { value: 400 })

      expect(readings.temperature).toBe(72)
      expect(readings.humidity).toBe(45)
      expect(readings.co2).toBe(400)
    })

    test('should handle high-frequency data', async () => {
      const device = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'energy_meter',
        capabilities: ['power']
      })

      const dataPoints: any[] = []
      service.subscribeSensor(device.deviceId, 'power', (data) => {
        dataPoints.push(data)
      })

      // Simulate 100Hz data stream
      for (let i = 0; i < 100; i++) {
        await service.publishSensorData(device.deviceId, 'power', {
          value: 1500 + Math.random() * 100,
          unit: 'watts'
        })
      }

      expect(dataPoints.length).toBeGreaterThanOrEqual(90) // Allow some dropped packets
    }, 10000)

    test('should support batch data publishing', async () => {
      const device = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'energy_meter'
      })

      const batchData = Array(1000).fill(null).map((_, i) => ({
        type: 'power',
        value: 1500 + i,
        timestamp: new Date(Date.now() - i * 1000)
      }))

      await service.publishBatchData(device.deviceId, batchData)

      const stored = await service.getSensorHistory(device.deviceId, 'power', {
        limit: 1000
      })

      expect(stored.length).toBe(1000)
    })
  })

  describe('Digital Twin State', () => {
    test('should create digital twin from BIM model', async () => {
      const twin = await service.createDigitalTwin({
        projectId: 'project-123',
        name: 'Building A',
        bimModelId: 'model-456',
        syncInterval: 5000 // 5 seconds
      })

      expect(twin).toHaveProperty('twinId')
      expect(twin.status).toBe('active')
      expect(twin.syncInterval).toBe(5000)
    })

    test('should sync sensor data to twin state', async () => {
      const twin = await service.createDigitalTwin({
        projectId: 'project-123',
        name: 'Building A'
      })

      const device = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'hvac_sensor'
      })

      await service.linkDeviceToTwin(twin.twinId, device.deviceId, {
        location: 'Room 101',
        zone: 'Zone A'
      })

      await service.publishSensorData(device.deviceId, 'temperature', {
        value: 72
      })

      await service.syncTwin(twin.twinId)

      const state = await service.getTwinState(twin.twinId)
      expect(state.sensors.temperature).toBe(72)
    })

    test('should track twin state history', async () => {
      const twin = await service.createDigitalTwin({
        projectId: 'project-123',
        name: 'Building A'
      })

      const device = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'hvac_sensor'
      })

      await service.linkDeviceToTwin(twin.twinId, device.deviceId)

      // Publish data over time
      for (let i = 0; i < 10; i++) {
        await service.publishSensorData(device.deviceId, 'temperature', {
          value: 70 + i
        })
        await service.syncTwin(twin.twinId)
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const history = await service.getTwinHistory(twin.twinId, {
        startTime: new Date(Date.now() - 60000),
        endTime: new Date()
      })

      expect(history.length).toBeGreaterThanOrEqual(10)
    })
  })

  describe('Anomaly Detection', () => {
    test('should detect temperature anomalies', async () => {
      const device = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'hvac_sensor',
        capabilities: ['temperature']
      })

      const anomalies: any[] = []
      service.onAnomaly(device.deviceId, (anomaly) => {
        anomalies.push(anomaly)
      })

      // Normal range: 68-76°F
      await service.setAnomalyThreshold(device.deviceId, 'temperature', {
        min: 68,
        max: 76
      })

      // Normal data
      await service.publishSensorData(device.deviceId, 'temperature', { value: 72 })

      // Anomaly
      await service.publishSensorData(device.deviceId, 'temperature', { value: 95 })

      expect(anomalies).toHaveLength(1)
      expect(anomalies[0].type).toBe('threshold_exceeded')
      expect(anomalies[0].value).toBe(95)
    })

    test('should detect sudden value changes', async () => {
      const device = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'energy_meter'
      })

      const anomalies: any[] = []
      service.onAnomaly(device.deviceId, (anomaly) => {
        anomalies.push(anomaly)
      })

      // Baseline data
      for (let i = 0; i < 10; i++) {
        await service.publishSensorData(device.deviceId, 'power', {
          value: 1500 + Math.random() * 50
        })
      }

      // Sudden spike
      await service.publishSensorData(device.deviceId, 'power', { value: 5000 })

      expect(anomalies.length).toBeGreaterThan(0)
      expect(anomalies[0].type).toBe('sudden_change')
    })

    test('should use ML for pattern-based anomaly detection', async () => {
      const device = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'hvac_sensor'
      })

      // Train on normal pattern
      const normalPattern = []
      for (let hour = 0; hour < 24; hour++) {
        // Typical office building pattern
        const temp = hour >= 6 && hour <= 18 ? 72 : 65
        normalPattern.push({ hour, temperature: temp })
      }

      await service.trainAnomalyModel(device.deviceId, normalPattern)

      const anomalies: any[] = []
      service.onAnomaly(device.deviceId, (anomaly) => {
        anomalies.push(anomaly)
      })

      // Anomalous: high temp at night
      await service.publishSensorData(device.deviceId, 'temperature', {
        value: 75,
        timestamp: new Date('2024-01-01T02:00:00')
      })

      expect(anomalies.length).toBeGreaterThan(0)
    })
  })

  describe('Predictive Maintenance', () => {
    test('should predict equipment failure', async () => {
      const device = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'hvac_unit',
        capabilities: ['vibration', 'temperature', 'pressure']
      })

      // Simulate degrading performance
      const readings = []
      for (let i = 0; i < 100; i++) {
        readings.push({
          vibration: 0.5 + (i * 0.01), // Increasing vibration
          temperature: 150 + (i * 0.5), // Rising temp
          pressure: 30 - (i * 0.05) // Dropping pressure
        })
      }

      for (const reading of readings) {
        await service.publishSensorData(device.deviceId, 'vibration', { value: reading.vibration })
        await service.publishSensorData(device.deviceId, 'temperature', { value: reading.temperature })
        await service.publishSensorData(device.deviceId, 'pressure', { value: reading.pressure })
      }

      const prediction = await service.predictMaintenance(device.deviceId)

      expect(prediction.failureProbability).toBeGreaterThan(0.7)
      expect(prediction.estimatedDaysToFailure).toBeLessThan(30)
      expect(prediction.recommendedAction).toBe('schedule_maintenance')
    })

    test('should calculate remaining useful life', async () => {
      const device = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'pump',
        installDate: new Date('2020-01-01')
      })

      const rul = await service.calculateRemainingUsefulLife(device.deviceId)

      expect(rul).toHaveProperty('estimatedDays')
      expect(rul).toHaveProperty('confidence')
      expect(rul.confidence).toBeGreaterThan(0)
      expect(rul.confidence).toBeLessThan(1)
    })

    test('should generate maintenance schedule', async () => {
      const twin = await service.createDigitalTwin({
        projectId: 'project-123',
        name: 'Building A'
      })

      // Register multiple devices
      const devices = await Promise.all([
        service.registerDevice({
          projectId: 'project-123',
          deviceType: 'hvac_unit',
          maintenanceInterval: 90 // days
        }),
        service.registerDevice({
          projectId: 'project-123',
          deviceType: 'elevator',
          maintenanceInterval: 30
        }),
        service.registerDevice({
          projectId: 'project-123',
          deviceType: 'generator',
          maintenanceInterval: 180
        })
      ])

      for (const device of devices) {
        await service.linkDeviceToTwin(twin.twinId, device.deviceId)
      }

      const schedule = await service.generateMaintenanceSchedule(twin.twinId, {
        lookAheadDays: 365
      })

      expect(schedule.tasks).toBeDefined()
      expect(schedule.tasks.length).toBeGreaterThan(0)
      expect(schedule.estimatedCost).toBeGreaterThan(0)
    })
  })

  describe('Energy Optimization', () => {
    test('should track energy consumption', async () => {
      const device = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'energy_meter'
      })

      const readings = []
      for (let hour = 0; hour < 24; hour++) {
        await service.publishSensorData(device.deviceId, 'power', {
          value: 1000 + Math.random() * 500,
          timestamp: new Date(`2024-01-01T${hour.toString().padStart(2, '0')}:00:00`)
        })
      }

      const consumption = await service.getEnergyConsumption(device.deviceId, {
        startDate: '2024-01-01',
        endDate: '2024-01-02'
      })

      expect(consumption.totalKWh).toBeGreaterThan(0)
      expect(consumption.peakDemand).toBeDefined()
      expect(consumption.offPeakUsage).toBeDefined()
    })

    test('should identify energy waste', async () => {
      const twin = await service.createDigitalTwin({
        projectId: 'project-123',
        name: 'Building A'
      })

      // Create devices
      const hvac = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'hvac_unit'
      })

      const occupancy = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'occupancy_sensor'
      })

      await service.linkDeviceToTwin(twin.twinId, hvac.deviceId)
      await service.linkDeviceToTwin(twin.twinId, occupancy.deviceId)

      // Simulate HVAC running with no occupancy
      await service.publishSensorData(occupancy.deviceId, 'occupancy', { value: 0 })
      await service.publishSensorData(hvac.deviceId, 'power', { value: 3000 })

      const waste = await service.identifyEnergyWaste(twin.twinId)

      expect(waste.issues).toBeDefined()
      expect(waste.issues.some((i: any) => i.type === 'hvac_unoccupied')).toBe(true)
      expect(waste.estimatedSavings).toBeGreaterThan(0)
    })

    test('should optimize HVAC schedule', async () => {
      const twin = await service.createDigitalTwin({
        projectId: 'project-123',
        name: 'Office Building'
      })

      const optimization = await service.optimizeHVACSchedule(twin.twinId, {
        occupancyPattern: {
          weekday: { start: '08:00', end: '18:00' },
          weekend: { start: '00:00', end: '00:00' }
        },
        targetTemperature: 72,
        maxCostPerDay: 50
      })

      expect(optimization.schedule).toBeDefined()
      expect(optimization.estimatedSavings).toBeGreaterThan(0)
      expect(optimization.comfortScore).toBeGreaterThan(0.8)
    })
  })

  describe('Protocol Support', () => {
    test('should support MQTT protocol', async () => {
      const connection = await service.connect({
        protocol: 'mqtt',
        broker: 'mqtt://broker.example.com:1883',
        clientId: 'abode-ai-client'
      })

      expect(connection.status).toBe('connected')
      expect(connection.protocol).toBe('mqtt')
    })

    test('should support Kafka protocol', async () => {
      const connection = await service.connect({
        protocol: 'kafka',
        brokers: ['kafka1.example.com:9092', 'kafka2.example.com:9092'],
        topic: 'iot-sensors'
      })

      expect(connection.status).toBe('connected')
      expect(connection.protocol).toBe('kafka')
    })

    test('should support WebSocket protocol', async () => {
      const connection = await service.connect({
        protocol: 'websocket',
        url: 'wss://iot.example.com/stream'
      })

      expect(connection.status).toBe('connected')
      expect(connection.protocol).toBe('websocket')
    })

    test('should handle connection failures', async () => {
      await expect(
        service.connect({
          protocol: 'mqtt',
          broker: 'mqtt://invalid-broker:1883',
          timeout: 1000
        })
      ).rejects.toThrow('Connection timeout')
    })

    test('should auto-reconnect on disconnect', async () => {
      const connection = await service.connect({
        protocol: 'mqtt',
        broker: 'mqtt://broker.example.com:1883',
        autoReconnect: true
      })

      // Simulate disconnect
      await service.simulateDisconnect(connection.id)

      // Wait for reconnect
      await new Promise(resolve => setTimeout(resolve, 2000))

      const status = await service.getConnectionStatus(connection.id)
      expect(status).toBe('connected')
    }, 5000)
  })

  describe('Data Storage and Retrieval', () => {
    test('should store time-series data efficiently', async () => {
      const device = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'temperature_sensor'
      })

      const startTime = Date.now()

      // Write 10,000 data points
      for (let i = 0; i < 10000; i++) {
        await service.publishSensorData(device.deviceId, 'temperature', {
          value: 70 + Math.random() * 5,
          timestamp: new Date(Date.now() - i * 1000)
        })
      }

      const writeTime = Date.now() - startTime

      expect(writeTime).toBeLessThan(10000) // Should write in under 10 seconds
    }, 15000)

    test('should query data by time range', async () => {
      const device = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'temperature_sensor'
      })

      const now = Date.now()
      for (let i = 0; i < 100; i++) {
        await service.publishSensorData(device.deviceId, 'temperature', {
          value: 70 + i,
          timestamp: new Date(now - i * 60000) // Every minute
        })
      }

      const lastHour = await service.getSensorHistory(device.deviceId, 'temperature', {
        startTime: new Date(now - 3600000),
        endTime: new Date(now)
      })

      expect(lastHour.length).toBe(60)
    })

    test('should aggregate data', async () => {
      const device = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'energy_meter'
      })

      // Publish data for 24 hours
      for (let i = 0; i < 1440; i++) {
        await service.publishSensorData(device.deviceId, 'power', {
          value: 1000 + Math.random() * 500,
          timestamp: new Date(Date.now() - i * 60000)
        })
      }

      const hourly = await service.aggregateSensorData(device.deviceId, 'power', {
        interval: '1h',
        aggregation: 'avg'
      })

      expect(hourly.length).toBe(24)
      hourly.forEach((point: any) => {
        expect(point.avg).toBeGreaterThan(0)
      })
    })
  })

  describe('Alerts and Notifications', () => {
    test('should trigger alerts on threshold breach', async () => {
      const device = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'leak_sensor'
      })

      const alerts: any[] = []
      service.onAlert(device.deviceId, (alert) => {
        alerts.push(alert)
      })

      await service.setAlertRule(device.deviceId, {
        sensor: 'moisture',
        condition: 'greater_than',
        threshold: 10,
        severity: 'critical'
      })

      await service.publishSensorData(device.deviceId, 'moisture', { value: 50 })

      expect(alerts).toHaveLength(1)
      expect(alerts[0].severity).toBe('critical')
    })

    test('should support complex alert rules', async () => {
      const device = await service.registerDevice({
        projectId: 'project-123',
        deviceType: 'hvac_sensor'
      })

      const alerts: any[] = []
      service.onAlert(device.deviceId, (alert) => {
        alerts.push(alert)
      })

      await service.setAlertRule(device.deviceId, {
        rule: 'temperature > 80 AND humidity > 60 FOR 10 minutes',
        severity: 'warning'
      })

      // Simulate sustained condition
      for (let i = 0; i < 11; i++) {
        await service.publishSensorData(device.deviceId, 'temperature', { value: 85 })
        await service.publishSensorData(device.deviceId, 'humidity', { value: 65 })
        await new Promise(resolve => setTimeout(resolve, 60000)) // Advance 1 minute
      }

      expect(alerts.length).toBeGreaterThan(0)
    })
  })
})
