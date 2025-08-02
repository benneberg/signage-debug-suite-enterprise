// Device Connection Service - WebSocket and ADB Bridge
export interface Device {
  id: string
  name: string
  model: string
  androidVersion: string
  status: "connected" | "disconnected" | "unauthorized" | "offline"
  lastSeen: string
  capabilities: string[]
  ipAddress?: string
  serialNumber: string
}

export interface LogStream {
  deviceId: string
  timestamp: string
  level: "V" | "D" | "I" | "W" | "E" | "F"
  tag: string
  message: string
  pid: number
  tid: number
}

export interface DeviceCommand {
  type: "screenshot" | "logcat" | "shell" | "install" | "uninstall" | "restart" | "clear_cache"
  deviceId: string
  payload?: any
  requestId: string
}

export interface DeviceResponse {
  requestId: string
  success: boolean
  data?: any
  error?: string
  timestamp: string
}

export class DeviceConnectionService {
  private ws: WebSocket | null = null
  private devices: Map<string, Device> = new Map()
  private logStreams: Map<string, LogStream[]> = new Map()
  private eventListeners: Map<string, Function[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor(private wsUrl = "ws://localhost:8080") {
    this.initializeEventListeners()
  }

  private initializeEventListeners() {
    this.eventListeners.set("deviceConnected", [])
    this.eventListeners.set("deviceDisconnected", [])
    this.eventListeners.set("logReceived", [])
    this.eventListeners.set("commandResponse", [])
    this.eventListeners.set("connectionStatusChanged", [])
  }

  public async connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl)

        this.ws.onopen = () => {
          console.log("Connected to device service")
          this.reconnectAttempts = 0
          this.emit("connectionStatusChanged", { status: "connected" })
          resolve(true)
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data))
        }

        this.ws.onclose = () => {
          console.log("Disconnected from device service")
          this.emit("connectionStatusChanged", { status: "disconnected" })
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error)
          this.emit("connectionStatusChanged", { status: "error", error })
          reject(error)
        }

        // Timeout for connection
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error("Connection timeout"))
          }
        }, 5000)
      } catch (error) {
        reject(error)
      }
    })
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case "deviceList":
        this.updateDeviceList(message.devices)
        break
      case "deviceConnected":
        this.addDevice(message.device)
        break
      case "deviceDisconnected":
        this.removeDevice(message.deviceId)
        break
      case "logStream":
        this.handleLogStream(message.log)
        break
      case "commandResponse":
        this.emit("commandResponse", message)
        break
      case "error":
        console.error("Device service error:", message.error)
        break
    }
  }

  private updateDeviceList(devices: Device[]) {
    this.devices.clear()
    devices.forEach((device) => {
      this.devices.set(device.id, device)
    })
    this.emit("deviceConnected", { devices: Array.from(this.devices.values()) })
  }

  private addDevice(device: Device) {
    this.devices.set(device.id, device)
    this.emit("deviceConnected", { device })
  }

  private removeDevice(deviceId: string) {
    const device = this.devices.get(deviceId)
    if (device) {
      this.devices.delete(deviceId)
      this.emit("deviceDisconnected", { device })
    }
  }

  private handleLogStream(log: LogStream) {
    if (!this.logStreams.has(log.deviceId)) {
      this.logStreams.set(log.deviceId, [])
    }

    const logs = this.logStreams.get(log.deviceId)!
    logs.push(log)

    // Keep only last 1000 logs per device
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000)
    }

    this.emit("logReceived", { log })
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

      setTimeout(() => {
        this.connect().catch((error) => {
          console.error("Reconnection failed:", error)
        })
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }

  public sendCommand(command: DeviceCommand): Promise<DeviceResponse> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("Not connected to device service"))
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error("Command timeout"))
      }, 30000)

      const responseHandler = (response: DeviceResponse) => {
        if (response.requestId === command.requestId) {
          clearTimeout(timeout)
          this.off("commandResponse", responseHandler)
          resolve(response)
        }
      }

      this.on("commandResponse", responseHandler)
      this.ws.send(JSON.stringify(command))
    })
  }

  public async getDevices(): Promise<Device[]> {
    return Array.from(this.devices.values())
  }

  public async getDeviceLogs(deviceId: string, limit = 100): Promise<LogStream[]> {
    const logs = this.logStreams.get(deviceId) || []
    return logs.slice(-limit)
  }

  public async takeScreenshot(deviceId: string): Promise<string> {
    const command: DeviceCommand = {
      type: "screenshot",
      deviceId,
      requestId: this.generateRequestId(),
    }

    const response = await this.sendCommand(command)
    if (response.success) {
      return response.data.screenshot // Base64 encoded image
    }
    throw new Error(response.error || "Screenshot failed")
  }

  public async startLogcatStream(deviceId: string, filters?: { tag?: string; level?: string }): Promise<void> {
    const command: DeviceCommand = {
      type: "logcat",
      deviceId,
      payload: { action: "start", filters },
      requestId: this.generateRequestId(),
    }

    await this.sendCommand(command)
  }

  public async stopLogcatStream(deviceId: string): Promise<void> {
    const command: DeviceCommand = {
      type: "logcat",
      deviceId,
      payload: { action: "stop" },
      requestId: this.generateRequestId(),
    }

    await this.sendCommand(command)
  }

  public async executeShellCommand(deviceId: string, command: string): Promise<string> {
    const cmd: DeviceCommand = {
      type: "shell",
      deviceId,
      payload: { command },
      requestId: this.generateRequestId(),
    }

    const response = await this.sendCommand(cmd)
    if (response.success) {
      return response.data.output
    }
    throw new Error(response.error || "Shell command failed")
  }

  public async restartApp(deviceId: string, packageName: string): Promise<void> {
    const command: DeviceCommand = {
      type: "restart",
      deviceId,
      payload: { packageName },
      requestId: this.generateRequestId(),
    }

    await this.sendCommand(command)
  }

  public async clearAppCache(deviceId: string, packageName: string): Promise<void> {
    const command: DeviceCommand = {
      type: "clear_cache",
      deviceId,
      payload: { packageName },
      requestId: this.generateRequestId(),
    }

    await this.sendCommand(command)
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  public on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  public off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event) || []
    listeners.forEach((callback) => callback(data))
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// Mock WebSocket Server Implementation (for development/demo)
export class MockDeviceService {
  private devices: Device[] = [
    {
      id: "device_001",
      name: "Samsung Signage Display",
      model: "SM-T870",
      androidVersion: "11",
      status: "connected",
      lastSeen: new Date().toISOString(),
      capabilities: ["screenshot", "logcat", "shell", "install"],
      ipAddress: "192.168.1.100",
      serialNumber: "R58M123456",
    },
    {
      id: "device_002",
      name: "LG WebOS Signage",
      model: "LG-49UH5C",
      androidVersion: "9",
      status: "connected",
      lastSeen: new Date().toISOString(),
      capabilities: ["screenshot", "logcat"],
      ipAddress: "192.168.1.101",
      serialNumber: "LG789012",
    },
  ]

  private logGeneratorInterval: NodeJS.Timeout | null = null

  public startMockService(port = 8080) {
    console.log(`Mock device service would start on port ${port}`)

    // Simulate log generation
    this.logGeneratorInterval = setInterval(() => {
      this.generateMockLogs()
    }, 2000)
  }

  private generateMockLogs() {
    const mockLogs = [
      "I/SignageApp: Content updated successfully",
      "D/MediaPlayer: Video playback started",
      "W/NetworkManager: Connection unstable, retrying...",
      "E/WebView: JavaScript error in content",
      "I/DisplayManager: Screen resolution changed to 1920x1080",
    ]

    const randomLog = mockLogs[Math.floor(Math.random() * mockLogs.length)]
    const [level, tag, message] = randomLog.split(/[/:]/, 3)

    // This would normally be sent via WebSocket
    console.log("Mock log generated:", { level, tag, message })
  }

  public stopMockService() {
    if (this.logGeneratorInterval) {
      clearInterval(this.logGeneratorInterval)
      this.logGeneratorInterval = null
    }
  }

  public getMockDevices(): Device[] {
    return this.devices
  }
}
