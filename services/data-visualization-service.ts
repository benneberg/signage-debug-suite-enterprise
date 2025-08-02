// Professional Data Visualization Service
export interface ChartConfig {
  type: "line" | "bar" | "pie" | "doughnut" | "scatter" | "timeline"
  title: string
  data: ChartData
  options?: ChartOptions
  responsive?: boolean
  maintainAspectRatio?: boolean
}

export interface ChartData {
  labels: string[]
  datasets: Dataset[]
}

export interface Dataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string
  borderWidth?: number
  fill?: boolean
  tension?: number
}

export interface ChartOptions {
  scales?: {
    x?: ScaleConfig
    y?: ScaleConfig
  }
  plugins?: {
    legend?: { display: boolean; position?: string }
    tooltip?: { enabled: boolean }
  }
  animation?: { duration: number }
  interaction?: { intersect: boolean; mode: string }
}

export interface ScaleConfig {
  display: boolean
  title?: { display: boolean; text: string }
  type?: string
  time?: { unit: string }
}

export interface PerformanceMetrics {
  timestamp: string
  memory: number
  cpu: number
  network: number
  battery?: number
  temperature?: number
}

export interface TimelineEvent {
  timestamp: string
  type: "error" | "warning" | "info" | "success"
  title: string
  description: string
  deviceId?: string
  duration?: number
}

export class DataVisualizationService {
  private charts: Map<string, any> = new Map()
  private chartInstances: Map<string, any> = new Map()

  constructor() {
    this.loadChartJS()
  }

  private async loadChartJS() {
    // In a real implementation, this would load Chart.js dynamically
    // For now, we'll assume it's available globally
    if (typeof window !== "undefined" && !(window as any).Chart) {
      console.warn("Chart.js not loaded. Please include Chart.js library.")
    }
  }

  public createPerformanceChart(
    canvasId: string,
    metrics: PerformanceMetrics[],
    type: "memory" | "cpu" | "network" | "all" = "all",
  ): string {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!canvas) {
      throw new Error(`Canvas element with id '${canvasId}' not found`)
    }

    const ctx = canvas.getContext("2d")!
    const labels = metrics.map((m) => new Date(m.timestamp).toLocaleTimeString())

    const datasets: Dataset[] = []

    if (type === "memory" || type === "all") {
      datasets.push({
        label: "Memory Usage (MB)",
        data: metrics.map((m) => m.memory),
        borderColor: "#e06c75",
        backgroundColor: "rgba(224, 108, 117, 0.1)",
        fill: true,
        tension: 0.4,
      })
    }

    if (type === "cpu" || type === "all") {
      datasets.push({
        label: "CPU Usage (%)",
        data: metrics.map((m) => m.cpu),
        borderColor: "#61afef",
        backgroundColor: "rgba(97, 175, 239, 0.1)",
        fill: true,
        tension: 0.4,
      })
    }

    if (type === "network" || type === "all") {
      datasets.push({
        label: "Network Usage (KB/s)",
        data: metrics.map((m) => m.network),
        borderColor: "#98c379",
        backgroundColor: "rgba(152, 195, 121, 0.1)",
        fill: true,
        tension: 0.4,
      })
    }

    const config: ChartConfig = {
      type: "line",
      title: "Performance Metrics",
      data: { labels, datasets },
      options: {
        scales: {
          x: {
            display: true,
            title: { display: true, text: "Time" },
          },
          y: {
            display: true,
            title: { display: true, text: "Usage" },
          },
        },
        plugins: {
          legend: { display: true, position: "top" },
          tooltip: { enabled: true },
        },
        animation: { duration: 750 },
        interaction: { intersect: false, mode: "index" },
      },
    }

    // Create chart using Chart.js (mock implementation)
    const chartInstance = this.createChartInstance(ctx, config)
    this.chartInstances.set(canvasId, chartInstance)

    return canvasId
  }

  public createTimelineChart(canvasId: string, events: TimelineEvent[]): string {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!canvas) {
      throw new Error(`Canvas element with id '${canvasId}' not found`)
    }

    const ctx = canvas.getContext("2d")!

    // Group events by type
    const errorEvents = events.filter((e) => e.type === "error")
    const warningEvents = events.filter((e) => e.type === "warning")
    const infoEvents = events.filter((e) => e.type === "info")
    const successEvents = events.filter((e) => e.type === "success")

    const labels = events.map((e) => new Date(e.timestamp).toLocaleTimeString())

    const datasets: Dataset[] = [
      {
        label: "Errors",
        data: errorEvents.map(() => 1),
        backgroundColor: "#e06c75",
        borderColor: "#e06c75",
      },
      {
        label: "Warnings",
        data: warningEvents.map(() => 1),
        backgroundColor: "#e5c07b",
        borderColor: "#e5c07b",
      },
      {
        label: "Info",
        data: infoEvents.map(() => 1),
        backgroundColor: "#56b6c2",
        borderColor: "#56b6c2",
      },
      {
        label: "Success",
        data: successEvents.map(() => 1),
        backgroundColor: "#98c379",
        borderColor: "#98c379",
      },
    ]

    const config: ChartConfig = {
      type: "bar",
      title: "Event Timeline",
      data: { labels, datasets },
      options: {
        scales: {
          x: {
            display: true,
            title: { display: true, text: "Time" },
          },
          y: {
            display: true,
            title: { display: true, text: "Event Count" },
          },
        },
        plugins: {
          legend: { display: true, position: "top" },
        },
      },
    }

    const chartInstance = this.createChartInstance(ctx, config)
    this.chartInstances.set(canvasId, chartInstance)

    return canvasId
  }

  public createCrashAnalysisChart(canvasId: string, crashData: any[]): string {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!canvas) {
      throw new Error(`Canvas element with id '${canvasId}' not found`)
    }

    const ctx = canvas.getContext("2d")!

    // Analyze crash types
    const crashTypes = crashData.reduce((acc, crash) => {
      acc[crash.type] = (acc[crash.type] || 0) + 1
      return acc
    }, {})

    const labels = Object.keys(crashTypes)
    const data = Object.values(crashTypes) as number[]
    const colors = ["#e06c75", "#e5c07b", "#61afef", "#98c379", "#c678dd"]

    const config: ChartConfig = {
      type: "doughnut",
      title: "Crash Analysis",
      data: {
        labels,
        datasets: [
          {
            label: "Crash Types",
            data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 2,
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: true, position: "right" },
        },
      },
    }

    const chartInstance = this.createChartInstance(ctx, config)
    this.chartInstances.set(canvasId, chartInstance)

    return canvasId
  }

  private createChartInstance(ctx: CanvasRenderingContext2D, config: ChartConfig): any {
    // Mock Chart.js implementation for demo
    // In real implementation, this would be: new Chart(ctx, config)
    console.log("Creating chart with config:", config)

    // Return mock chart instance
    return {
      update: () => console.log("Chart updated"),
      destroy: () => console.log("Chart destroyed"),
      resize: () => console.log("Chart resized"),
      config: config,
    }
  }

  public updateChart(canvasId: string, newData: ChartData): void {
    const chartInstance = this.chartInstances.get(canvasId)
    if (chartInstance) {
      chartInstance.data = newData
      chartInstance.update()
    }
  }

  public destroyChart(canvasId: string): void {
    const chartInstance = this.chartInstances.get(canvasId)
    if (chartInstance) {
      chartInstance.destroy()
      this.chartInstances.delete(canvasId)
    }
  }

  public exportChart(canvasId: string, format: "png" | "jpg" | "pdf" = "png"): string {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!canvas) {
      throw new Error(`Canvas element with id '${canvasId}' not found`)
    }

    if (format === "pdf") {
      // Would integrate with jsPDF for PDF export
      console.log("PDF export would be implemented with jsPDF")
      return "data:application/pdf;base64,mock-pdf-data"
    }

    return canvas.toDataURL(`image/${format}`)
  }

  public generateMockPerformanceData(count = 50): PerformanceMetrics[] {
    const data: PerformanceMetrics[] = []
    const now = Date.now()

    for (let i = 0; i < count; i++) {
      data.push({
        timestamp: new Date(now - (count - i) * 30000).toISOString(), // 30 second intervals
        memory: 50 + Math.random() * 100 + Math.sin(i * 0.1) * 20,
        cpu: 20 + Math.random() * 60 + Math.sin(i * 0.2) * 15,
        network: Math.random() * 1000 + Math.sin(i * 0.15) * 200,
        battery: 100 - i * 0.5 + Math.random() * 5,
        temperature: 35 + Math.random() * 10 + Math.sin(i * 0.05) * 3,
      })
    }

    return data
  }

  public generateMockTimelineEvents(count = 20): TimelineEvent[] {
    const events: TimelineEvent[] = []
    const now = Date.now()
    const eventTypes: TimelineEvent["type"][] = ["error", "warning", "info", "success"]
    const eventTitles = {
      error: ["App Crash", "Network Error", "Media Playback Failed", "Database Error"],
      warning: ["High Memory Usage", "Slow Network", "Low Battery", "High Temperature"],
      info: ["App Started", "Content Updated", "User Interaction", "System Event"],
      success: ["Content Loaded", "Network Connected", "Update Completed", "Backup Created"],
    }

    for (let i = 0; i < count; i++) {
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)]
      const titles = eventTitles[type]
      const title = titles[Math.floor(Math.random() * titles.length)]

      events.push({
        timestamp: new Date(now - (count - i) * 60000).toISOString(), // 1 minute intervals
        type,
        title,
        description: `${title} occurred at ${new Date(now - (count - i) * 60000).toLocaleTimeString()}`,
        deviceId: `device_${Math.floor(Math.random() * 3) + 1}`,
        duration: Math.random() * 5000, // Random duration up to 5 seconds
      })
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }
}
