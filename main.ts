// Signage Debug Suite - Main Application Entry Point
// Phase 3: Enterprise and Professional Features Complete

import { LogcatAnalyzer } from "./utils/logcat-analyzer"
import { DeviceConnectionService } from "./services/device-connection-service"
import { DataVisualizationService } from "./services/data-visualization-service"
import { SessionManagementService } from "./services/session-management-service"
import { GitHubIntegrationService } from "./services/github-integration-service"
import { TeamWorkspaceService } from "./services/team-workspace-service"
import { EnterpriseDeploymentService } from "./services/enterprise-deployment-service"
import { AdvancedMediaAnalysisService } from "./services/advanced-media-analysis-service"
import { SecurityComplianceService } from "./services/security-compliance-service"
import { ProfessionalDevelopmentService } from "./services/professional-development-service"

// Tool configurations
interface ToolConfig {
  id: string
  name: string
  description: string
  category: "debugging" | "analysis" | "media" | "collaboration" | "enterprise" | "development"
  path: string
  icon: string
  phase: 1 | 2 | 3
  isPinned: boolean
  isVisible: boolean
}

// Application state
interface AppState {
  openTools: Set<string>
  pinnedTools: Set<string>
  searchQuery: string
  selectedCategory: string
  currentUser: string
  theme: "light" | "dark"
  layout: "grid" | "list"
}

class SignageDebugSuite {
  private state: AppState
  private services: Record<string, any> = {}
  private tools: ToolConfig[] = []
  private eventListeners: Map<string, Function[]> = new Map()

  constructor() {
    this.state = {
      openTools: new Set(),
      pinnedTools: new Set(["logcat-parser", "device-monitor"]),
      searchQuery: "",
      selectedCategory: "all",
      currentUser: "developer@company.com",
      theme: "dark",
      layout: "grid",
    }

    this.initializeServices()
    this.initializeTools()
    this.loadState()
    this.setupEventListeners()
    this.render()
  }

  private initializeServices() {
    // Phase 1: Core Services
    this.services.logcatAnalyzer = new LogcatAnalyzer()
    this.services.deviceConnection = new DeviceConnectionService()
    this.services.dataVisualization = new DataVisualizationService()

    // Phase 2: Collaboration Services
    this.services.sessionManagement = new SessionManagementService()
    this.services.githubIntegration = new GitHubIntegrationService()
    this.services.teamWorkspace = new TeamWorkspaceService()

    // Phase 3: Enterprise Services
    this.services.enterpriseDeployment = new EnterpriseDeploymentService()
    this.services.advancedMediaAnalysis = new AdvancedMediaAnalysisService()
    this.services.securityCompliance = new SecurityComplianceService()
    this.services.professionalDevelopment = new ProfessionalDevelopmentService()

    // Make services globally available for tools
    ;(window as any).signageDebugServices = this.services
  }

  private initializeTools() {
    this.tools = [
      // Phase 1: Core Debugging Tools
      {
        id: "logcat-parser",
        name: "Logcat Parser",
        description: "Parse and analyze Android logcat output with intelligent filtering",
        category: "debugging",
        path: "./tools/logcat-parser/index.html",
        icon: "📱",
        phase: 1,
        isPinned: true,
        isVisible: true,
      },
      {
        id: "ai-log-analyzer",
        name: "AI Log Analyzer",
        description: "AI-powered log analysis and pattern recognition",
        category: "analysis",
        path: "./tools/ai-log-analyzer/index.html",
        icon: "🤖",
        phase: 1,
        isPinned: false,
        isVisible: true,
      },
      {
        id: "advanced-logcat-analyzer",
        name: "Advanced Logcat Analyzer",
        description: "Advanced pattern recognition and crash detection",
        category: "analysis",
        path: "./tools/advanced-logcat-analyzer/index.html",
        icon: "🔍",
        phase: 1,
        isPinned: false,
        isVisible: true,
      },
      {
        id: "device-monitor",
        name: "Device Monitor",
        description: "Real-time device connection and status monitoring",
        category: "debugging",
        path: "./tools/device-monitor/index.html",
        icon: "📺",
        phase: 1,
        isPinned: true,
        isVisible: true,
      },
      {
        id: "performance-dashboard",
        name: "Performance Dashboard",
        description: "Real-time performance metrics and visualization",
        category: "analysis",
        path: "./tools/performance-dashboard/index.html",
        icon: "📊",
        phase: 1,
        isPinned: false,
        isVisible: true,
      },
      {
        id: "indexeddb-manager",
        name: "IndexedDB Manager",
        description: "Manage and inspect IndexedDB storage",
        category: "debugging",
        path: "./tools/indexeddb-manager/index.html",
        icon: "🗄️",
        phase: 1,
        isPinned: false,
        isVisible: true,
      },
      {
        id: "media-metadata-editor",
        name: "Media Metadata Editor",
        description: "Edit and manage media file metadata",
        category: "media",
        path: "./tools/media-metadata-editor/index.html",
        icon: "🎬",
        phase: 1,
        isPinned: false,
        isVisible: true,
      },
      {
        id: "codec-compatibility-checker",
        name: "Codec Compatibility Checker",
        description: "Check media codec compatibility across devices",
        category: "media",
        path: "./tools/codec-compatibility-checker/index.html",
        icon: "🎥",
        phase: 1,
        isPinned: false,
        isVisible: true,
      },
      {
        id: "timeline-view-generator",
        name: "Timeline View Generator",
        description: "Generate timeline visualizations for debugging",
        category: "analysis",
        path: "./tools/timeline-view-generator/index.html",
        icon: "📈",
        phase: 1,
        isPinned: false,
        isVisible: true,
      },
      {
        id: "player-preview-simulator",
        name: "Player Preview Simulator",
        description: "Simulate signage player behavior and preview content",
        category: "debugging",
        path: "./tools/player-preview-simulator/index.html",
        icon: "🖥️",
        phase: 1,
        isPinned: false,
        isVisible: true,
      },

      // Phase 2: Collaboration Tools
      {
        id: "session-manager",
        name: "Session Manager",
        description: "Record, share, and collaborate on debugging sessions",
        category: "collaboration",
        path: "./tools/session-manager/index.html",
        icon: "🎯",
        phase: 2,
        isPinned: false,
        isVisible: true,
      },
      {
        id: "github-integration",
        name: "GitHub Integration",
        description: "Create and manage GitHub issues from debugging sessions",
        category: "collaboration",
        path: "./tools/github-integration/index.html",
        icon: "🐙",
        phase: 2,
        isPinned: false,
        isVisible: true,
      },

      // Phase 3: Enterprise Tools
      {
        id: "enterprise-deployment",
        name: "Enterprise Deployment",
        description: "Multi-environment deployment orchestration and management",
        category: "enterprise",
        path: "./tools/enterprise-deployment/index.html",
        icon: "🏢",
        phase: 3,
        isPinned: false,
        isVisible: true,
      },
      {
        id: "media-analysis",
        name: "Advanced Media Analysis",
        description: "Comprehensive codec, format, and streaming analysis",
        category: "media",
        path: "./tools/media-analysis/index.html",
        icon: "🎬",
        phase: 3,
        isPinned: false,
        isVisible: true,
      },
      {
        id: "security-compliance",
        name: "Security & Compliance",
        description: "Security scanning, audit trails, and compliance frameworks",
        category: "enterprise",
        path: "./tools/security-compliance/index.html",
        icon: "🔒",
        phase: 3,
        isPinned: false,
        isVisible: true,
      },
      {
        id: "cicd-pipeline",
        name: "CI/CD Pipeline",
        description: "Continuous integration and deployment pipeline management",
        category: "development",
        path: "./tools/cicd-pipeline/index.html",
        icon: "⚡",
        phase: 3,
        isPinned: false,
        isVisible: true,
      },
      {
        id: "workflow-automation",
        name: "Workflow Automation",
        description: "Automated debugging workflows and developer productivity",
        category: "development",
        path: "./tools/workflow-automation/index.html",
        icon: "🔄",
        phase: 3,
        isPinned: false,
        isVisible: true,
      },
      {
        id: "developer-workspace",
        name: "Developer Workspace",
        description: "Personalized development environment and IDE integration",
        category: "development",
        path: "./tools/developer-workspace/index.html",
        icon: "💻",
        phase: 3,
        isPinned: false,
        isVisible: true,
      },
    ]
  }

  private setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById("searchInput") as HTMLInputElement
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.state.searchQuery = (e.target as HTMLInputElement).value.toLowerCase()
        this.filterAndRenderTools()
      })
    }

    // Category filter
    const categorySelect = document.getElementById("categorySelect") as HTMLSelectElement
    if (categorySelect) {
      categorySelect.addEventListener("change", (e) => {
        this.state.selectedCategory = (e.target as HTMLSelectElement).value
        this.filterAndRenderTools()
      })
    }

    // Theme toggle
    const themeToggle = document.getElementById("themeToggle")
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        this.toggleTheme()
      })
    }

    // Layout toggle
    const layoutToggle = document.getElementById("layoutToggle")
    if (layoutToggle) {
      layoutToggle.addEventListener("click", () => {
        this.toggleLayout()
      })
    }

    // Save state on page unload
    window.addEventListener("beforeunload", () => {
      this.saveState()
    })

    // Handle tool iframe messages
    window.addEventListener("message", (event) => {
      this.handleToolMessage(event)
    })
  }

  private render() {
    const app = document.getElementById("app")
    if (!app) return

    app.innerHTML = `
      <div class="app-container ${this.state.theme}">
        <header class="app-header">
          <div class="header-content">
            <div class="logo">
              <h1>🔧 Signage Debug Suite</h1>
              <span class="version">v3.0 Enterprise</span>
            </div>
            <div class="header-controls">
              <div class="search-container">
                <input type="text" id="searchInput" placeholder="Search tools..." value="${this.state.searchQuery}">
                <select id="categorySelect">
                  <option value="all">All Categories</option>
                  <option value="debugging">Debugging</option>
                  <option value="analysis">Analysis</option>
                  <option value="media">Media</option>
                  <option value="collaboration">Collaboration</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="development">Development</option>
                </select>
              </div>
              <div class="view-controls">
                <button id="layoutToggle" class="control-btn" title="Toggle Layout">
                  ${this.state.layout === "grid" ? "📋" : "⊞"}
                </button>
                <button id="themeToggle" class="control-btn" title="Toggle Theme">
                  ${this.state.theme === "dark" ? "☀️" : "🌙"}
                </button>
                <button id="settingsBtn" class="control-btn" title="Settings">⚙️</button>
              </div>
            </div>
          </div>
        </header>

        <main class="app-main">
          <div class="sidebar">
            <div class="pinned-tools">
              <h3>📌 Pinned Tools</h3>
              <div id="pinnedToolsList" class="pinned-list">
                ${this.renderPinnedTools()}
              </div>
            </div>
            <div class="phase-info">
              <h3>🚀 Development Phases</h3>
              <div class="phase-list">
                <div class="phase-item phase-1">
                  <span class="phase-badge">Phase 1</span>
                  <span>Core Debugging</span>
                  <span class="phase-count">${this.tools.filter((t) => t.phase === 1).length}</span>
                </div>
                <div class="phase-item phase-2">
                  <span class="phase-badge">Phase 2</span>
                  <span>Collaboration</span>
                  <span class="phase-count">${this.tools.filter((t) => t.phase === 2).length}</span>
                </div>
                <div class="phase-item phase-3">
                  <span class="phase-badge">Phase 3</span>
                  <span>Enterprise</span>
                  <span class="phase-count">${this.tools.filter((t) => t.phase === 3).length}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="content-area">
            <div class="tools-grid ${this.state.layout}" id="toolsGrid">
              ${this.renderTools()}
            </div>
            <div class="open-tools" id="openTools">
              ${this.renderOpenTools()}
            </div>
          </div>
        </main>

        <div class="status-bar">
          <div class="status-left">
            <span>User: ${this.state.currentUser}</span>
            <span>Tools: ${this.tools.length}</span>
            <span>Open: ${this.state.openTools.size}</span>
          </div>
          <div class="status-right">
            <span>Services: ${Object.keys(this.services).length} active</span>
            <span class="connection-status">🟢 Connected</span>
          </div>
        </div>
      </div>
    `

    this.filterAndRenderTools()
  }

  private renderPinnedTools(): string {
    const pinnedTools = this.tools.filter((tool) => this.state.pinnedTools.has(tool.id))

    return pinnedTools
      .map(
        (tool) => `
      <div class="pinned-tool" onclick="signageDebugSuite.openTool('${tool.id}')">
        <span class="tool-icon">${tool.icon}</span>
        <span class="tool-name">${tool.name}</span>
      </div>
    `,
      )
      .join("")
  }

  private renderTools(): string {
    return this.getFilteredTools()
      .map(
        (tool) => `
      <div class="tool-card ${this.state.openTools.has(tool.id) ? "active" : ""}" data-tool-id="${tool.id}">
        <div class="tool-header">
          <span class="tool-icon">${tool.icon}</span>
          <div class="tool-info">
            <h3 class="tool-name">${tool.name}</h3>
            <span class="tool-phase">Phase ${tool.phase}</span>
          </div>
          <div class="tool-actions">
            <button class="pin-btn ${this.state.pinnedTools.has(tool.id) ? "pinned" : ""}" 
                    onclick="signageDebugSuite.togglePin('${tool.id}')" title="Pin Tool">
              📌
            </button>
          </div>
        </div>
        <div class="tool-description">
          ${tool.description}
        </div>
        <div class="tool-category">
          <span class="category-badge category-${tool.category}">${tool.category}</span>
        </div>
        <div class="tool-footer">
          <button class="open-btn" onclick="signageDebugSuite.openTool('${tool.id}')">
            ${this.state.openTools.has(tool.id) ? "Focus" : "Open"}
          </button>
          ${
            this.state.openTools.has(tool.id)
              ? `
            <button class="close-btn" onclick="signageDebugSuite.closeTool('${tool.id}')">Close</button>
          `
              : ""
          }
        </div>
      </div>
    `,
      )
      .join("")
  }

  private renderOpenTools(): string {
    if (this.state.openTools.size === 0) {
      return '<div class="no-tools">No tools currently open</div>'
    }

    const openToolsArray = Array.from(this.state.openTools)
    return openToolsArray
      .map((toolId) => {
        const tool = this.tools.find((t) => t.id === toolId)
        if (!tool) return ""

        return `
        <div class="tool-window" id="tool-${toolId}">
          <div class="tool-window-header">
            <span class="tool-icon">${tool.icon}</span>
            <span class="tool-title">${tool.name}</span>
            <div class="window-controls">
              <button onclick="signageDebugSuite.minimizeTool('${toolId}')" title="Minimize">−</button>
              <button onclick="signageDebugSuite.closeTool('${toolId}')" title="Close">×</button>
            </div>
          </div>
          <div class="tool-window-content">
            <iframe src="${tool.path}" frameborder="0" width="100%" height="100%"></iframe>
          </div>
        </div>
      `
      })
      .join("")
  }

  private getFilteredTools(): ToolConfig[] {
    return this.tools.filter((tool) => {
      const matchesSearch =
        !this.state.searchQuery ||
        tool.name.toLowerCase().includes(this.state.searchQuery) ||
        tool.description.toLowerCase().includes(this.state.searchQuery)

      const matchesCategory = this.state.selectedCategory === "all" || tool.category === this.state.selectedCategory

      return matchesSearch && matchesCategory && tool.isVisible
    })
  }

  private filterAndRenderTools() {
    const toolsGrid = document.getElementById("toolsGrid")
    if (toolsGrid) {
      toolsGrid.innerHTML = this.renderTools()
    }
  }

  // Public methods for tool management
  public openTool(toolId: string) {
    const tool = this.tools.find((t) => t.id === toolId)
    if (!tool) return

    this.state.openTools.add(toolId)
    this.render()
    this.saveState()

    // Emit tool opened event
    this.emit("toolOpened", { toolId, tool })
  }

  public closeTool(toolId: string) {
    this.state.openTools.delete(toolId)
    this.render()
    this.saveState()

    // Emit tool closed event
    this.emit("toolClosed", { toolId })
  }

  public togglePin(toolId: string) {
    if (this.state.pinnedTools.has(toolId)) {
      this.state.pinnedTools.delete(toolId)
    } else {
      this.state.pinnedTools.add(toolId)
    }
    this.render()
    this.saveState()
  }

  public minimizeTool(toolId: string) {
    const toolWindow = document.getElementById(`tool-${toolId}`)
    if (toolWindow) {
      toolWindow.classList.toggle("minimized")
    }
  }

  private toggleTheme() {
    this.state.theme = this.state.theme === "dark" ? "light" : "dark"
    this.render()
    this.saveState()
  }

  private toggleLayout() {
    this.state.layout = this.state.layout === "grid" ? "list" : "grid"
    this.render()
    this.saveState()
  }

  private handleToolMessage(event: MessageEvent) {
    // Handle messages from tool iframes
    if (event.data.type === "toolAction") {
      this.emit("toolAction", event.data)
    }
  }

  private saveState() {
    const stateToSave = {
      openTools: Array.from(this.state.openTools),
      pinnedTools: Array.from(this.state.pinnedTools),
      theme: this.state.theme,
      layout: this.state.layout,
      currentUser: this.state.currentUser,
    }
    localStorage.setItem("signageDebugSuite_state", JSON.stringify(stateToSave))
  }

  private loadState() {
    const savedState = localStorage.getItem("signageDebugSuite_state")
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        this.state.openTools = new Set(parsed.openTools || [])
        this.state.pinnedTools = new Set(parsed.pinnedTools || ["logcat-parser", "device-monitor"])
        this.state.theme = parsed.theme || "dark"
        this.state.layout = parsed.layout || "grid"
        this.state.currentUser = parsed.currentUser || "developer@company.com"
      } catch (error) {
        console.error("Failed to load saved state:", error)
      }
    }
  }

  // Event system
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

  // Service access
  public getService(serviceName: string) {
    return this.services[serviceName]
  }

  public getServices() {
    return this.services
  }

  // Tool management
  public getTools() {
    return this.tools
  }

  public getTool(toolId: string) {
    return this.tools.find((t) => t.id === toolId)
  }

  // Analytics and monitoring
  public getUsageStats() {
    return {
      totalTools: this.tools.length,
      openTools: this.state.openTools.size,
      pinnedTools: this.state.pinnedTools.size,
      activeServices: Object.keys(this.services).length,
      currentUser: this.state.currentUser,
      theme: this.state.theme,
      layout: this.state.layout,
    }
  }
}

// Initialize the application
let signageDebugSuite: SignageDebugSuite

document.addEventListener("DOMContentLoaded", () => {
  signageDebugSuite = new SignageDebugSuite()

  // Make it globally available for tool interactions
  ;(window as any).signageDebugSuite = signageDebugSuite

  console.log("🚀 Signage Debug Suite v3.0 Enterprise initialized")
  console.log("📊 Phase 3 Complete: All enterprise and professional features active")
  console.log("🔧 Services loaded:", Object.keys(signageDebugSuite.getServices()))
  console.log("🛠️ Tools available:", signageDebugSuite.getTools().length)
})

// Service worker registration for PWA functionality
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration)
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError)
      })
  })
}

export { SignageDebugSuite }
