// GitHub Issues Integration Service
export interface GitHubConfig {
  token: string
  owner: string
  repo: string
  apiUrl: string
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string
  state: "open" | "closed"
  labels: GitHubLabel[]
  assignees: GitHubUser[]
  milestone?: GitHubMilestone
  created_at: string
  updated_at: string
  html_url: string
  user: GitHubUser
}

export interface GitHubLabel {
  id: number
  name: string
  color: string
  description: string
}

export interface GitHubUser {
  id: number
  login: string
  avatar_url: string
  html_url: string
}

export interface GitHubMilestone {
  id: number
  title: string
  description: string
  state: "open" | "closed"
  due_on?: string
}

export interface IssueTemplate {
  id: string
  name: string
  title: string
  body: string
  labels: string[]
  assignees: string[]
  category: "crash" | "performance" | "bug" | "feature" | "question"
  priority: "low" | "medium" | "high" | "critical"
  autoCreate: boolean
  conditions: IssueCondition[]
}

export interface IssueCondition {
  type: "crash_count" | "error_pattern" | "performance_threshold" | "device_type"
  operator: "equals" | "greater" | "contains" | "matches"
  value: any
}

export interface CrashReport {
  type: string
  timestamp: string
  stackTrace: string[]
  deviceInfo: any
  sessionId?: string
  logContext: string[]
}

export class GitHubIntegrationService {
  private config: GitHubConfig | null = null
  private issueTemplates: Map<string, IssueTemplate> = new Map()
  private linkedIssues: Map<string, number> = new Map() // sessionId -> issue number
  private eventListeners: Map<string, Function[]> = new Map()

  constructor() {
    this.initializeEventListeners()
    this.loadDefaultTemplates()
  }

  private initializeEventListeners() {
    this.eventListeners.set("issueCreated", [])
    this.eventListeners.set("issueUpdated", [])
    this.eventListeners.set("configurationChanged", [])
  }

  private loadDefaultTemplates() {
    const defaultTemplates: IssueTemplate[] = [
      {
        id: "crash_template",
        name: "Application Crash",
        title: "🚨 Application Crash - {{crash_type}}",
        body: `## Crash Report

**Crash Type:** {{crash_type}}
**Timestamp:** {{timestamp}}
**Device:** {{device_model}} (Android {{android_version}})
**Session:** {{session_id}}

### Stack Trace
\`\`\`
{{stack_trace}}
\`\`\`

### Device Information
- **Model:** {{device_model}}
- **Android Version:** {{android_version}}
- **Memory:** {{memory_info}}
- **Storage:** {{storage_info}}

### Log Context
\`\`\`
{{log_context}}
\`\`\`

### Reproduction Steps
1. {{reproduction_steps}}

### Expected Behavior
{{expected_behavior}}

### Additional Context
{{additional_context}}

---
*This issue was automatically created by Signage DevHub*
*Session ID: {{session_id}}*`,
        labels: ["bug", "crash", "auto-generated"],
        assignees: [],
        category: "crash",
        priority: "critical",
        autoCreate: true,
        conditions: [
          {
            type: "crash_count",
            operator: "greater",
            value: 0,
          },
        ],
      },
      {
        id: "performance_template",
        name: "Performance Issue",
        title: "⚡ Performance Issue - {{issue_type}}",
        body: `## Performance Issue Report

**Issue Type:** {{issue_type}}
**Severity:** {{severity}}
**Timestamp:** {{timestamp}}
**Device:** {{device_model}}
**Session:** {{session_id}}

### Performance Metrics
- **CPU Usage:** {{cpu_usage}}%
- **Memory Usage:** {{memory_usage}}MB
- **Network Usage:** {{network_usage}}KB/s
- **Temperature:** {{temperature}}°C

### Threshold Violations
{{threshold_violations}}

### Performance Timeline
{{performance_timeline}}

### Recommendations
{{recommendations}}

### Related Logs
\`\`\`
{{related_logs}}
\`\`\`

---
*This issue was automatically created by Signage DevHub*
*Session ID: {{session_id}}*`,
        labels: ["performance", "optimization", "auto-generated"],
        assignees: [],
        category: "performance",
        priority: "medium",
        autoCreate: false,
        conditions: [
          {
            type: "performance_threshold",
            operator: "greater",
            value: { cpu: 80, memory: 85, temperature: 70 },
          },
        ],
      },
      {
        id: "network_template",
        name: "Network Connectivity Issue",
        title: "🌐 Network Issue - {{error_type}}",
        body: `## Network Connectivity Issue

**Error Type:** {{error_type}}
**Timestamp:** {{timestamp}}
**Device:** {{device_model}}
**Session:** {{session_id}}

### Network Information
- **Connection Type:** {{connection_type}}
- **IP Address:** {{ip_address}}
- **DNS Servers:** {{dns_servers}}
- **Proxy Settings:** {{proxy_settings}}

### Error Details
\`\`\`
{{error_details}}
\`\`\`

### Network Logs
\`\`\`
{{network_logs}}
\`\`\`

### Troubleshooting Steps Attempted
{{troubleshooting_steps}}

### Environment
- **Network:** {{network_environment}}
- **Firewall:** {{firewall_settings}}
- **SSL/TLS:** {{ssl_info}}

---
*This issue was automatically created by Signage DevHub*
*Session ID: {{session_id}}*`,
        labels: ["network", "connectivity", "auto-generated"],
        assignees: [],
        category: "bug",
        priority: "high",
        autoCreate: false,
        conditions: [
          {
            type: "error_pattern",
            operator: "contains",
            value: ["timeout", "connection", "network"],
          },
        ],
      },
    ]

    defaultTemplates.forEach((template) => {
      this.issueTemplates.set(template.id, template)
    })
  }

  public async configure(config: GitHubConfig): Promise<boolean> {
    try {
      // Validate configuration by making a test API call
      const response = await this.makeApiCall(`/repos/${config.owner}/${config.repo}`, "GET", config)

      if (response.ok) {
        this.config = config
        this.emit("configurationChanged", { config: { ...config, token: "***" } })
        return true
      }

      throw new Error("Invalid repository or insufficient permissions")
    } catch (error) {
      console.error("GitHub configuration failed:", error)
      return false
    }
  }

  public async createIssueFromCrash(
    crashReport: CrashReport,
    templateId = "crash_template",
  ): Promise<GitHubIssue | null> {
    if (!this.config) throw new Error("GitHub not configured")

    const template = this.issueTemplates.get(templateId)
    if (!template) throw new Error("Template not found")

    const issueData = this.populateTemplate(template, {
      crash_type: crashReport.type,
      timestamp: new Date(crashReport.timestamp).toLocaleString(),
      device_model: crashReport.deviceInfo?.model || "Unknown",
      android_version: crashReport.deviceInfo?.androidVersion || "Unknown",
      session_id: crashReport.sessionId || "N/A",
      stack_trace: crashReport.stackTrace.join("\n"),
      memory_info: crashReport.deviceInfo?.memory || "Unknown",
      storage_info: crashReport.deviceInfo?.storage || "Unknown",
      log_context: crashReport.logContext.join("\n"),
      reproduction_steps: "Steps to be filled by developer",
      expected_behavior: "Expected behavior to be described",
      additional_context: "Additional context to be added",
    })

    return await this.createIssue(issueData)
  }

  public async createIssueFromPerformance(
    performanceData: any,
    templateId = "performance_template",
  ): Promise<GitHubIssue | null> {
    if (!this.config) throw new Error("GitHub not configured")

    const template = this.issueTemplates.get(templateId)
    if (!template) throw new Error("Template not found")

    const issueData = this.populateTemplate(template, {
      issue_type: this.determinePerformanceIssueType(performanceData),
      severity: this.determinePerformanceSeverity(performanceData),
      timestamp: new Date().toLocaleString(),
      device_model: performanceData.deviceInfo?.model || "Unknown",
      session_id: performanceData.sessionId || "N/A",
      cpu_usage: performanceData.cpu || "Unknown",
      memory_usage: performanceData.memory || "Unknown",
      network_usage: performanceData.network || "Unknown",
      temperature: performanceData.temperature || "Unknown",
      threshold_violations: this.formatThresholdViolations(performanceData),
      performance_timeline: this.formatPerformanceTimeline(performanceData),
      recommendations: this.generatePerformanceRecommendations(performanceData),
      related_logs: performanceData.logs?.join("\n") || "No logs available",
    })

    return await this.createIssue(issueData)
  }

  public async createCustomIssue(
    title: string,
    body: string,
    labels: string[] = [],
    assignees: string[] = [],
  ): Promise<GitHubIssue | null> {
    if (!this.config) throw new Error("GitHub not configured")

    const issueData = {
      title,
      body,
      labels,
      assignees,
    }

    return await this.createIssue(issueData)
  }

  private async createIssue(issueData: any): Promise<GitHubIssue | null> {
    if (!this.config) return null

    try {
      const response = await this.makeApiCall(
        `/repos/${this.config.owner}/${this.config.repo}/issues`,
        "POST",
        this.config,
        issueData,
      )

      if (response.ok) {
        const issue = await response.json()
        this.emit("issueCreated", { issue })
        return issue
      }

      throw new Error(`Failed to create issue: ${response.statusText}`)
    } catch (error) {
      console.error("Failed to create GitHub issue:", error)
      return null
    }
  }

  public async updateIssue(issueNumber: number, updates: Partial<GitHubIssue>): Promise<GitHubIssue | null> {
    if (!this.config) throw new Error("GitHub not configured")

    try {
      const response = await this.makeApiCall(
        `/repos/${this.config.owner}/${this.config.repo}/issues/${issueNumber}`,
        "PATCH",
        this.config,
        updates,
      )

      if (response.ok) {
        const issue = await response.json()
        this.emit("issueUpdated", { issue })
        return issue
      }

      throw new Error(`Failed to update issue: ${response.statusText}`)
    } catch (error) {
      console.error("Failed to update GitHub issue:", error)
      return null
    }
  }

  public async getIssues(state: "open" | "closed" | "all" = "open", labels?: string[]): Promise<GitHubIssue[]> {
    if (!this.config) throw new Error("GitHub not configured")

    try {
      let url = `/repos/${this.config.owner}/${this.config.repo}/issues?state=${state}`

      if (labels && labels.length > 0) {
        url += `&labels=${labels.join(",")}`
      }

      const response = await this.makeApiCall(url, "GET", this.config)

      if (response.ok) {
        return await response.json()
      }

      throw new Error(`Failed to fetch issues: ${response.statusText}`)
    } catch (error) {
      console.error("Failed to fetch GitHub issues:", error)
      return []
    }
  }

  public async linkSessionToIssue(sessionId: string, issueNumber: number): Promise<void> {
    this.linkedIssues.set(sessionId, issueNumber)
  }

  public getLinkedIssue(sessionId: string): number | undefined {
    return this.linkedIssues.get(sessionId)
  }

  public async addCommentToIssue(issueNumber: number, comment: string): Promise<boolean> {
    if (!this.config) throw new Error("GitHub not configured")

    try {
      const response = await this.makeApiCall(
        `/repos/${this.config.owner}/${this.config.repo}/issues/${issueNumber}/comments`,
        "POST",
        this.config,
        { body: comment },
      )

      return response.ok
    } catch (error) {
      console.error("Failed to add comment to GitHub issue:", error)
      return false
    }
  }

  public async closeIssue(issueNumber: number, comment?: string): Promise<boolean> {
    if (!this.config) throw new Error("GitHub not configured")

    try {
      if (comment) {
        await this.addCommentToIssue(issueNumber, comment)
      }

      const response = await this.updateIssue(issueNumber, { state: "closed" })
      return response !== null
    } catch (error) {
      console.error("Failed to close GitHub issue:", error)
      return false
    }
  }

  public getIssueTemplates(): IssueTemplate[] {
    return Array.from(this.issueTemplates.values())
  }

  public async createIssueTemplate(template: Omit<IssueTemplate, "id">): Promise<IssueTemplate> {
    const newTemplate: IssueTemplate = {
      id: this.generateId("template"),
      ...template,
    }

    this.issueTemplates.set(newTemplate.id, newTemplate)
    return newTemplate
  }

  public async checkAutoCreateConditions(data: any): Promise<IssueTemplate[]> {
    const triggeredTemplates: IssueTemplate[] = []

    for (const template of this.issueTemplates.values()) {
      if (!template.autoCreate) continue

      const shouldCreate = template.conditions.every((condition) => {
        return this.evaluateCondition(condition, data)
      })

      if (shouldCreate) {
        triggeredTemplates.push(template)
      }
    }

    return triggeredTemplates
  }

  private evaluateCondition(condition: IssueCondition, data: any): boolean {
    switch (condition.type) {
      case "crash_count":
        return this.compareValues(data.crashCount || 0, condition.operator, condition.value)
      case "error_pattern":
        const errorText = (data.logs || []).join(" ").toLowerCase()
        return condition.value.some((pattern: string) => errorText.includes(pattern.toLowerCase()))
      case "performance_threshold":
        const thresholds = condition.value
        return Object.keys(thresholds).some((metric) => {
          return this.compareValues(data[metric] || 0, condition.operator, thresholds[metric])
        })
      case "device_type":
        return this.compareValues(data.deviceType || "", condition.operator, condition.value)
      default:
        return false
    }
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case "equals":
        return actual === expected
      case "greater":
        return actual > expected
      case "contains":
        return String(actual).toLowerCase().includes(String(expected).toLowerCase())
      case "matches":
        return new RegExp(expected).test(String(actual))
      default:
        return false
    }
  }

  private populateTemplate(template: IssueTemplate, variables: Record<string, string>): any {
    let title = template.title
    let body = template.body

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      title = title.replace(new RegExp(placeholder, "g"), value)
      body = body.replace(new RegExp(placeholder, "g"), value)
    })

    return {
      title,
      body,
      labels: template.labels,
      assignees: template.assignees,
    }
  }

  private determinePerformanceIssueType(data: any): string {
    if (data.cpu > 80) return "High CPU Usage"
    if (data.memory > 85) return "High Memory Usage"
    if (data.temperature > 70) return "Overheating"
    if (data.network < 100) return "Poor Network Performance"
    return "General Performance Issue"
  }

  private determinePerformanceSeverity(data: any): string {
    const issues = []
    if (data.cpu > 90) issues.push("critical")
    if (data.memory > 95) issues.push("critical")
    if (data.temperature > 80) issues.push("critical")

    if (issues.includes("critical")) return "Critical"
    if (data.cpu > 80 || data.memory > 85 || data.temperature > 70) return "High"
    if (data.cpu > 60 || data.memory > 70 || data.temperature > 60) return "Medium"
    return "Low"
  }

  private formatThresholdViolations(data: any): string {
    const violations = []
    if (data.cpu > 80) violations.push(`CPU: ${data.cpu}% (threshold: 80%)`)
    if (data.memory > 85) violations.push(`Memory: ${data.memory}MB (threshold: 85%)`)
    if (data.temperature > 70) violations.push(`Temperature: ${data.temperature}°C (threshold: 70°C)`)
    return violations.length > 0 ? violations.join("\n") : "No threshold violations detected"
  }

  private formatPerformanceTimeline(data: any): string {
    // In a real implementation, this would format actual timeline data
    return "Performance timeline data would be formatted here"
  }

  private generatePerformanceRecommendations(data: any): string {
    const recommendations = []
    if (data.cpu > 80) recommendations.push("- Optimize CPU-intensive operations")
    if (data.memory > 85) recommendations.push("- Review memory usage and implement caching strategies")
    if (data.temperature > 70) recommendations.push("- Check device ventilation and reduce processing load")
    if (data.network < 100) recommendations.push("- Optimize network requests and implement retry mechanisms")

    return recommendations.length > 0 ? recommendations.join("\n") : "No specific recommendations at this time"
  }

  private async makeApiCall(endpoint: string, method: string, config: GitHubConfig, body?: any): Promise<Response> {
    const url = `${config.apiUrl}${endpoint}`
    const headers: Record<string, string> = {
      Authorization: `token ${config.token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Signage-DevHub/1.0",
    }

    if (body) {
      headers["Content-Type"] = "application/json"
    }

    return fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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

  public isConfigured(): boolean {
    return this.config !== null
  }

  public getConfig(): Partial<GitHubConfig> | null {
    if (!this.config) return null
    return {
      owner: this.config.owner,
      repo: this.config.repo,
      apiUrl: this.config.apiUrl,
    }
  }
}
