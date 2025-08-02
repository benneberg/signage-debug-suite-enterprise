// Session Management Service - Recording, Playback, and Sharing
export interface DebugSession {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  createdBy: string
  teamId?: string
  status: "active" | "paused" | "completed" | "archived"
  tags: string[]
  devices: string[]
  duration: number
  isShared: boolean
  shareUrl?: string
  metadata: SessionMetadata
}

export interface SessionMetadata {
  deviceInfo: any[]
  toolsUsed: string[]
  crashCount: number
  errorCount: number
  warningCount: number
  performanceIssues: number
  resolution?: "fixed" | "workaround" | "wont-fix" | "duplicate"
  linkedIssues: string[]
}

export interface SessionSnapshot {
  id: string
  sessionId: string
  timestamp: string
  type: "manual" | "auto" | "crash" | "error"
  title: string
  description: string
  data: {
    logs: any[]
    performance: any[]
    screenshots: string[]
    toolStates: Record<string, any>
    deviceStates: Record<string, any>
  }
  annotations: SessionAnnotation[]
}

export interface SessionAnnotation {
  id: string
  timestamp: string
  author: string
  type: "note" | "issue" | "solution" | "question"
  content: string
  position?: { x: number; y: number }
  attachments: string[]
  replies: SessionAnnotation[]
}

export interface SessionTemplate {
  id: string
  name: string
  description: string
  category: string
  tools: string[]
  steps: SessionStep[]
  expectedOutcomes: string[]
  troubleshootingTips: string[]
  createdBy: string
  isPublic: boolean
  usageCount: number
}

export interface SessionStep {
  id: string
  title: string
  description: string
  toolId: string
  action: string
  expectedResult: string
  troubleshooting: string[]
  duration: number
}

export interface SessionPlaybook {
  id: string
  name: string
  description: string
  category: string
  templates: string[]
  workflow: PlaybookStep[]
  conditions: PlaybookCondition[]
  automations: PlaybookAutomation[]
  createdBy: string
  teamId?: string
}

export interface PlaybookStep {
  id: string
  name: string
  type: "manual" | "automated" | "conditional"
  templateId?: string
  action: string
  parameters: Record<string, any>
  nextSteps: string[]
  onError: string[]
}

export interface PlaybookCondition {
  id: string
  name: string
  type: "device" | "log" | "performance" | "time"
  operator: "equals" | "contains" | "greater" | "less" | "exists"
  value: any
  action: string
}

export interface PlaybookAutomation {
  id: string
  name: string
  trigger: string
  conditions: string[]
  actions: string[]
  enabled: boolean
}

export class SessionManagementService {
  private sessions: Map<string, DebugSession> = new Map()
  private snapshots: Map<string, SessionSnapshot[]> = new Map()
  private templates: Map<string, SessionTemplate> = new Map()
  private playbooks: Map<string, SessionPlaybook> = new Map()
  private currentSession: DebugSession | null = null
  private recordingActive = false
  private eventListeners: Map<string, Function[]> = new Map()

  constructor() {
    this.initializeEventListeners()
    this.loadMockData()
  }

  private initializeEventListeners() {
    this.eventListeners.set("sessionStarted", [])
    this.eventListeners.set("sessionStopped", [])
    this.eventListeners.set("snapshotCreated", [])
    this.eventListeners.set("annotationAdded", [])
    this.eventListeners.set("sessionShared", [])
  }

  private loadMockData() {
    // Load mock templates
    const mockTemplates: SessionTemplate[] = [
      {
        id: "template_001",
        name: "Media Playback Debug",
        description: "Standard workflow for debugging media playback issues",
        category: "media",
        tools: ["logcat-parser", "performance-dashboard", "device-monitor"],
        steps: [
          {
            id: "step_001",
            title: "Check Device Connection",
            description: "Verify device is connected and responsive",
            toolId: "device-monitor",
            action: "connect_device",
            expectedResult: "Device shows as connected with green status",
            troubleshooting: ["Check USB connection", "Restart ADB", "Check device authorization"],
            duration: 60,
          },
          {
            id: "step_002",
            title: "Start Log Collection",
            description: "Begin collecting logcat data with media filters",
            toolId: "logcat-parser",
            action: "start_logcat",
            expectedResult: "Logs streaming with media-related entries",
            troubleshooting: ["Clear log buffer", "Check log permissions", "Restart logcat service"],
            duration: 30,
          },
          {
            id: "step_003",
            title: "Monitor Performance",
            description: "Track CPU, memory, and network usage during playback",
            toolId: "performance-dashboard",
            action: "start_monitoring",
            expectedResult: "Performance metrics showing normal ranges",
            troubleshooting: ["Check for memory leaks", "Monitor CPU spikes", "Verify network stability"],
            duration: 300,
          },
        ],
        expectedOutcomes: [
          "Media files play without errors",
          "Performance metrics within normal ranges",
          "No crash or ANR events detected",
        ],
        troubleshootingTips: [
          "Check codec compatibility",
          "Verify file format support",
          "Monitor network bandwidth",
          "Check storage space",
        ],
        createdBy: "system",
        isPublic: true,
        usageCount: 45,
      },
      {
        id: "template_002",
        name: "Network Connectivity Debug",
        description: "Diagnose network-related issues in signage applications",
        category: "network",
        tools: ["logcat-parser", "device-monitor"],
        steps: [
          {
            id: "step_001",
            title: "Check Network Status",
            description: "Verify network connectivity and configuration",
            toolId: "device-monitor",
            action: "check_network",
            expectedResult: "Network shows as connected with valid IP",
            troubleshooting: ["Check WiFi/Ethernet connection", "Verify network settings", "Test DNS resolution"],
            duration: 120,
          },
          {
            id: "step_002",
            title: "Monitor Network Logs",
            description: "Collect logs related to network operations",
            toolId: "logcat-parser",
            action: "filter_network_logs",
            expectedResult: "Network requests completing successfully",
            troubleshooting: ["Check firewall settings", "Verify proxy configuration", "Test with different endpoints"],
            duration: 180,
          },
        ],
        expectedOutcomes: [
          "Network requests complete successfully",
          "No timeout or connection errors",
          "Stable network performance",
        ],
        troubleshootingTips: [
          "Test with different networks",
          "Check proxy settings",
          "Verify SSL certificates",
          "Monitor bandwidth usage",
        ],
        createdBy: "system",
        isPublic: true,
        usageCount: 32,
      },
    ]

    mockTemplates.forEach((template) => {
      this.templates.set(template.id, template)
    })

    // Load mock playbooks
    const mockPlaybooks: SessionPlaybook[] = [
      {
        id: "playbook_001",
        name: "Complete Signage Health Check",
        description: "Comprehensive health check for digital signage systems",
        category: "maintenance",
        templates: ["template_001", "template_002"],
        workflow: [
          {
            id: "workflow_001",
            name: "System Check",
            type: "automated",
            action: "check_system_health",
            parameters: { includePerformance: true, includeNetwork: true },
            nextSteps: ["workflow_002"],
            onError: ["workflow_error_001"],
          },
          {
            id: "workflow_002",
            name: "Media Test",
            type: "manual",
            templateId: "template_001",
            action: "run_template",
            parameters: {},
            nextSteps: ["workflow_003"],
            onError: ["workflow_error_002"],
          },
        ],
        conditions: [
          {
            id: "condition_001",
            name: "High CPU Usage",
            type: "performance",
            operator: "greater",
            value: 80,
            action: "create_alert",
          },
        ],
        automations: [
          {
            id: "automation_001",
            name: "Auto Screenshot on Error",
            trigger: "error_detected",
            conditions: ["condition_001"],
            actions: ["take_screenshot", "create_snapshot"],
            enabled: true,
          },
        ],
        createdBy: "admin",
        teamId: "team_001",
      },
    ]

    mockPlaybooks.forEach((playbook) => {
      this.playbooks.set(playbook.id, playbook)
    })
  }

  public async startSession(name: string, description: string, templateId?: string): Promise<DebugSession> {
    const session: DebugSession = {
      id: this.generateId("session"),
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "current_user", // Would be actual user ID
      status: "active",
      tags: [],
      devices: [],
      duration: 0,
      isShared: false,
      metadata: {
        deviceInfo: [],
        toolsUsed: [],
        crashCount: 0,
        errorCount: 0,
        warningCount: 0,
        performanceIssues: 0,
        linkedIssues: [],
      },
    }

    if (templateId) {
      const template = this.templates.get(templateId)
      if (template) {
        session.tags.push(template.category)
        session.metadata.toolsUsed = [...template.tools]
      }
    }

    this.sessions.set(session.id, session)
    this.snapshots.set(session.id, [])
    this.currentSession = session
    this.recordingActive = true

    this.emit("sessionStarted", { session })
    return session
  }

  public async stopSession(): Promise<void> {
    if (!this.currentSession) return

    this.currentSession.status = "completed"
    this.currentSession.updatedAt = new Date().toISOString()
    this.currentSession.duration = Date.now() - new Date(this.currentSession.createdAt).getTime()
    this.recordingActive = false

    this.emit("sessionStopped", { session: this.currentSession })
    this.currentSession = null
  }

  public async pauseSession(): Promise<void> {
    if (!this.currentSession) return

    this.currentSession.status = "paused"
    this.currentSession.updatedAt = new Date().toISOString()
    this.recordingActive = false
  }

  public async resumeSession(): Promise<void> {
    if (!this.currentSession) return

    this.currentSession.status = "active"
    this.currentSession.updatedAt = new Date().toISOString()
    this.recordingActive = true
  }

  public async createSnapshot(
    title: string,
    description: string,
    type: SessionSnapshot["type"] = "manual",
  ): Promise<SessionSnapshot> {
    if (!this.currentSession) throw new Error("No active session")

    const snapshot: SessionSnapshot = {
      id: this.generateId("snapshot"),
      sessionId: this.currentSession.id,
      timestamp: new Date().toISOString(),
      type,
      title,
      description,
      data: {
        logs: [], // Would capture current logs
        performance: [], // Would capture current performance data
        screenshots: [], // Would capture current screenshots
        toolStates: {}, // Would capture current tool states
        deviceStates: {}, // Would capture current device states
      },
      annotations: [],
    }

    const sessionSnapshots = this.snapshots.get(this.currentSession.id) || []
    sessionSnapshots.push(snapshot)
    this.snapshots.set(this.currentSession.id, sessionSnapshots)

    this.emit("snapshotCreated", { snapshot })
    return snapshot
  }

  public async addAnnotation(
    snapshotId: string,
    annotation: Omit<SessionAnnotation, "id" | "timestamp" | "replies">,
  ): Promise<SessionAnnotation> {
    const fullAnnotation: SessionAnnotation = {
      id: this.generateId("annotation"),
      timestamp: new Date().toISOString(),
      replies: [],
      ...annotation,
    }

    // Find and update the snapshot
    for (const [sessionId, snapshots] of this.snapshots.entries()) {
      const snapshot = snapshots.find((s) => s.id === snapshotId)
      if (snapshot) {
        snapshot.annotations.push(fullAnnotation)
        this.emit("annotationAdded", { annotation: fullAnnotation, snapshotId })
        return fullAnnotation
      }
    }

    throw new Error("Snapshot not found")
  }

  public async shareSession(sessionId: string, permissions: string[] = ["read"]): Promise<string> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error("Session not found")

    const shareUrl = `${window.location.origin}/shared-session/${sessionId}?token=${this.generateShareToken()}`
    session.isShared = true
    session.shareUrl = shareUrl
    session.updatedAt = new Date().toISOString()

    this.emit("sessionShared", { session, shareUrl })
    return shareUrl
  }

  public async loadSharedSession(sessionId: string, token: string): Promise<DebugSession | null> {
    // In a real implementation, this would validate the token
    const session = this.sessions.get(sessionId)
    return session?.isShared ? session : null
  }

  public async getSessions(filters?: { status?: string; createdBy?: string; tags?: string[] }): Promise<
    DebugSession[]
  > {
    let sessions = Array.from(this.sessions.values())

    if (filters) {
      if (filters.status) {
        sessions = sessions.filter((s) => s.status === filters.status)
      }
      if (filters.createdBy) {
        sessions = sessions.filter((s) => s.createdBy === filters.createdBy)
      }
      if (filters.tags && filters.tags.length > 0) {
        sessions = sessions.filter((s) => filters.tags!.some((tag) => s.tags.includes(tag)))
      }
    }

    return sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  public async getSessionSnapshots(sessionId: string): Promise<SessionSnapshot[]> {
    return this.snapshots.get(sessionId) || []
  }

  public async getTemplates(category?: string): Promise<SessionTemplate[]> {
    let templates = Array.from(this.templates.values())

    if (category) {
      templates = templates.filter((t) => t.category === category)
    }

    return templates.sort((a, b) => b.usageCount - a.usageCount)
  }

  public async getPlaybooks(teamId?: string): Promise<SessionPlaybook[]> {
    let playbooks = Array.from(this.playbooks.values())

    if (teamId) {
      playbooks = playbooks.filter((p) => p.teamId === teamId)
    }

    return playbooks
  }

  public async runTemplate(templateId: string, sessionId?: string): Promise<void> {
    const template = this.templates.get(templateId)
    if (!template) throw new Error("Template not found")

    template.usageCount++

    // In a real implementation, this would execute the template steps
    console.log(`Running template: ${template.name}`)

    if (sessionId && this.currentSession?.id === sessionId) {
      this.currentSession.metadata.toolsUsed = [
        ...new Set([...this.currentSession.metadata.toolsUsed, ...template.tools]),
      ]
    }
  }

  public async exportSession(sessionId: string, format: "json" | "pdf" | "html" = "json"): Promise<string> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error("Session not found")

    const snapshots = this.snapshots.get(sessionId) || []

    const exportData = {
      session,
      snapshots,
      exportedAt: new Date().toISOString(),
      format,
    }

    if (format === "json") {
      return JSON.stringify(exportData, null, 2)
    } else if (format === "html") {
      return this.generateHtmlReport(exportData)
    } else {
      // PDF export would be implemented with a library like jsPDF
      return "PDF export not implemented in demo"
    }
  }

  private generateHtmlReport(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Debug Session Report - ${data.session.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .section { margin-bottom: 30px; }
          .snapshot { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
          .annotation { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Debug Session Report</h1>
          <h2>${data.session.name}</h2>
          <p><strong>Description:</strong> ${data.session.description}</p>
          <p><strong>Created:</strong> ${new Date(data.session.createdAt).toLocaleString()}</p>
          <p><strong>Duration:</strong> ${Math.round(data.session.duration / 1000 / 60)} minutes</p>
          <p><strong>Status:</strong> ${data.session.status}</p>
        </div>
        
        <div class="section">
          <h3>Session Metadata</h3>
          <ul>
            <li>Tools Used: ${data.session.metadata.toolsUsed.join(", ")}</li>
            <li>Crashes: ${data.session.metadata.crashCount}</li>
            <li>Errors: ${data.session.metadata.errorCount}</li>
            <li>Warnings: ${data.session.metadata.warningCount}</li>
          </ul>
        </div>
        
        <div class="section">
          <h3>Snapshots (${data.snapshots.length})</h3>
          ${data.snapshots
            .map(
              (snapshot: SessionSnapshot) => `
            <div class="snapshot">
              <h4>${snapshot.title}</h4>
              <p><strong>Time:</strong> ${new Date(snapshot.timestamp).toLocaleString()}</p>
              <p><strong>Type:</strong> ${snapshot.type}</p>
              <p>${snapshot.description}</p>
              ${
                snapshot.annotations.length > 0
                  ? `
                <h5>Annotations:</h5>
                ${snapshot.annotations
                  .map(
                    (annotation: SessionAnnotation) => `
                  <div class="annotation">
                    <strong>${annotation.author}:</strong> ${annotation.content}
                  </div>
                `,
                  )
                  .join("")}
              `
                  : ""
              }
            </div>
          `,
            )
            .join("")}
        </div>
        
        <div class="section">
          <p><em>Report generated on ${new Date(data.exportedAt).toLocaleString()}</em></p>
        </div>
      </body>
      </html>
    `
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateShareToken(): string {
    return Math.random().toString(36).substr(2, 16)
  }

  public on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event) || []
    listeners.forEach((callback) => callback(data))
  }

  public getCurrentSession(): DebugSession | null {
    return this.currentSession
  }

  public isRecording(): boolean {
    return this.recordingActive
  }
}
