// Advanced Logcat Analysis Engine
export interface LogEntry {
  timestamp: string
  pid: number
  tid: number
  level: "V" | "D" | "I" | "W" | "E" | "F"
  tag: string
  message: string
  raw: string
}

export interface CrashReport {
  type: "ANR" | "CRASH" | "NATIVE_CRASH" | "WATCHDOG"
  timestamp: string
  process: string
  stackTrace: string[]
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  category: string
  suggestions: string[]
}

export interface PerformanceMetric {
  type: "MEMORY" | "CPU" | "NETWORK" | "BATTERY" | "STORAGE"
  timestamp: string
  value: number
  unit: string
  threshold?: number
  status: "NORMAL" | "WARNING" | "CRITICAL"
}

export interface AnalysisResult {
  summary: {
    totalLines: number
    timeRange: { start: string; end: string }
    errorCount: number
    warningCount: number
    crashCount: number
  }
  crashes: CrashReport[]
  performance: PerformanceMetric[]
  patterns: PatternMatch[]
  recommendations: string[]
}

export interface PatternMatch {
  pattern: string
  matches: LogEntry[]
  severity: "INFO" | "WARNING" | "ERROR"
  description: string
}

export class LogcatAnalyzer {
  private patterns: Map<string, RegExp> = new Map()
  private performancePatterns: Map<string, RegExp> = new Map()
  private crashPatterns: Map<string, RegExp> = new Map()

  constructor() {
    this.initializePatterns()
  }

  private initializePatterns() {
    // Crash detection patterns
    this.crashPatterns.set("ANR", /ANR in|Application Not Responding/i)
    this.crashPatterns.set("CRASH", /FATAL EXCEPTION|AndroidRuntime.*FATAL/i)
    this.crashPatterns.set("NATIVE_CRASH", /\*\*\* FATAL EXCEPTION IN NATIVE CODE|signal \d+ \(SIG/i)
    this.crashPatterns.set("WATCHDOG", /WATCHDOG KILLING SYSTEM PROCESS/i)

    // Performance patterns
    this.performancePatterns.set("MEMORY_WARNING", /Low memory killer|GC_|OutOfMemoryError/i)
    this.performancePatterns.set("CPU_HIGH", /CPU usage from \d+ms to \d+ms later.*:\s*(\d+)%/i)
    this.performancePatterns.set(
      "NETWORK_TIMEOUT",
      /SocketTimeoutException|ConnectTimeoutException|UnknownHostException/i,
    )
    this.performancePatterns.set("STORAGE_FULL", /No space left on device|ENOSPC/i)

    // Digital signage specific patterns
    this.patterns.set("MEDIA_PLAYBACK_ERROR", /MediaPlayer.*error|Codec.*not supported|Video.*failed/i)
    this.patterns.set("WEBVIEW_CRASH", /WebView.*crash|Chromium.*crash|RenderProcessGone/i)
    this.patterns.set("DISPLAY_ISSUE", /Display.*disconnected|Resolution.*changed|HDMI.*error/i)
    this.patterns.set("NETWORK_CONNECTIVITY", /NetworkInfo.*DISCONNECTED|WiFi.*lost|Ethernet.*down/i)
    this.patterns.set("STORAGE_CORRUPTION", /SQLite.*corrupt|Database.*malformed|File.*corrupted/i)
  }

  public parseLogLine(line: string): LogEntry | null {
    // Enhanced logcat parsing with multiple formats
    const patterns = [
      // Standard format: MM-dd HH:mm:ss.SSS PID TID LEVEL TAG: MESSAGE
      /^(\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s+(\d+)\s+([VDIWEF])\s+([^:]+):\s*(.*)$/,
      // Brief format: LEVEL/TAG(PID): MESSAGE
      /^([VDIWEF])\/([^(]+)$$\s*(\d+)$$:\s*(.*)$/,
      // Time format: MM-dd HH:mm:ss.SSS LEVEL/TAG(PID): MESSAGE
      /^(\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3})\s+([VDIWEF])\/([^(]+)$$\s*(\d+)$$:\s*(.*)$/,
    ]

    for (const pattern of patterns) {
      const match = line.match(pattern)
      if (match) {
        if (pattern === patterns[0]) {
          // Standard format
          const [, timestamp, pid, tid, level, tag, message] = match
          return {
            timestamp,
            pid: Number.parseInt(pid),
            tid: Number.parseInt(tid),
            level: level as LogEntry["level"],
            tag: tag.trim(),
            message: message.trim(),
            raw: line,
          }
        } else if (pattern === patterns[1]) {
          // Brief format
          const [, level, tag, pid, message] = match
          return {
            timestamp: new Date().toISOString(),
            pid: Number.parseInt(pid),
            tid: 0,
            level: level as LogEntry["level"],
            tag: tag.trim(),
            message: message.trim(),
            raw: line,
          }
        } else if (pattern === patterns[2]) {
          // Time format
          const [, timestamp, level, tag, pid, message] = match
          return {
            timestamp,
            pid: Number.parseInt(pid),
            tid: 0,
            level: level as LogEntry["level"],
            tag: tag.trim(),
            message: message.trim(),
            raw: line,
          }
        }
      }
    }
    return null
  }

  public analyzeLogEntries(entries: LogEntry[]): AnalysisResult {
    const crashes = this.detectCrashes(entries)
    const performance = this.analyzePerformance(entries)
    const patterns = this.findPatterns(entries)
    const recommendations = this.generateRecommendations(crashes, performance, patterns)

    const summary = {
      totalLines: entries.length,
      timeRange: {
        start: entries[0]?.timestamp || "",
        end: entries[entries.length - 1]?.timestamp || "",
      },
      errorCount: entries.filter((e) => e.level === "E").length,
      warningCount: entries.filter((e) => e.level === "W").length,
      crashCount: crashes.length,
    }

    return {
      summary,
      crashes,
      performance,
      patterns,
      recommendations,
    }
  }

  private detectCrashes(entries: LogEntry[]): CrashReport[] {
    const crashes: CrashReport[] = []
    let currentCrash: Partial<CrashReport> | null = null
    let stackTrace: string[] = []

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]

      // Check for crash patterns
      for (const [type, pattern] of this.crashPatterns) {
        if (pattern.test(entry.message)) {
          if (currentCrash) {
            // Finish previous crash
            crashes.push(this.finalizeCrashReport(currentCrash, stackTrace))
          }

          currentCrash = {
            type: type as CrashReport["type"],
            timestamp: entry.timestamp,
            process: entry.tag,
            stackTrace: [],
            severity: this.determineCrashSeverity(type, entry.message),
            category: this.categorizeCrash(entry.message),
          }
          stackTrace = [entry.message]
        }
      }

      // Collect stack trace lines
      if (
        currentCrash &&
        (entry.message.includes("at ") ||
          entry.message.includes("Caused by:") ||
          entry.message.includes("... ") ||
          entry.level === "E")
      ) {
        stackTrace.push(entry.message)
      }

      // End crash collection after gap or different process
      if (currentCrash && i > 0) {
        const prevEntry = entries[i - 1]
        const timeDiff = new Date(entry.timestamp).getTime() - new Date(prevEntry.timestamp).getTime()
        if (timeDiff > 5000 || (entry.tag !== currentCrash.process && !entry.message.includes("at "))) {
          crashes.push(this.finalizeCrashReport(currentCrash, stackTrace))
          currentCrash = null
          stackTrace = []
        }
      }
    }

    // Finalize last crash if exists
    if (currentCrash) {
      crashes.push(this.finalizeCrashReport(currentCrash, stackTrace))
    }

    return crashes
  }

  private finalizeCrashReport(crash: Partial<CrashReport>, stackTrace: string[]): CrashReport {
    return {
      type: crash.type!,
      timestamp: crash.timestamp!,
      process: crash.process!,
      stackTrace,
      severity: crash.severity!,
      category: crash.category!,
      suggestions: this.generateCrashSuggestions(crash.type!, stackTrace),
    }
  }

  private determineCrashSeverity(type: string, message: string): CrashReport["severity"] {
    if (type === "ANR" || message.includes("FATAL")) return "CRITICAL"
    if (type === "NATIVE_CRASH") return "HIGH"
    if (message.includes("OutOfMemoryError")) return "HIGH"
    if (type === "CRASH") return "MEDIUM"
    return "LOW"
  }

  private categorizeCrash(message: string): string {
    if (message.includes("MediaPlayer") || message.includes("Video") || message.includes("Audio")) {
      return "Media Playback"
    }
    if (message.includes("WebView") || message.includes("Chromium")) {
      return "WebView/Browser"
    }
    if (message.includes("Network") || message.includes("Socket") || message.includes("HTTP")) {
      return "Network"
    }
    if (message.includes("SQLite") || message.includes("Database")) {
      return "Database"
    }
    if (message.includes("OutOfMemoryError") || message.includes("GC")) {
      return "Memory Management"
    }
    return "General"
  }

  private generateCrashSuggestions(type: string, stackTrace: string[]): string[] {
    const suggestions: string[] = []
    const stackTraceText = stackTrace.join(" ")

    switch (type) {
      case "ANR":
        suggestions.push("Check for blocking operations on the main thread")
        suggestions.push("Use AsyncTask or background threads for heavy operations")
        suggestions.push("Review database queries and network calls")
        break
      case "CRASH":
        if (stackTraceText.includes("NullPointerException")) {
          suggestions.push("Add null checks before accessing objects")
          suggestions.push("Initialize variables properly")
        }
        if (stackTraceText.includes("OutOfMemoryError")) {
          suggestions.push("Optimize image loading and caching")
          suggestions.push("Review memory usage patterns")
          suggestions.push("Consider using memory-efficient data structures")
        }
        break
      case "NATIVE_CRASH":
        suggestions.push("Check native library compatibility")
        suggestions.push("Verify JNI method signatures")
        suggestions.push("Review memory management in native code")
        break
    }

    return suggestions
  }

  private analyzePerformance(entries: LogEntry[]): PerformanceMetric[] {
    const metrics: PerformanceMetric[] = []

    for (const entry of entries) {
      // Memory analysis
      const memoryMatch = entry.message.match(/GC_.*freed (\d+).*(\d+)K->(\d+)K/i)
      if (memoryMatch) {
        const afterGC = Number.parseInt(memoryMatch[3])
        metrics.push({
          type: "MEMORY",
          timestamp: entry.timestamp,
          value: afterGC,
          unit: "KB",
          threshold: 100000, // 100MB threshold
          status: afterGC > 100000 ? "WARNING" : "NORMAL",
        })
      }

      // CPU analysis
      const cpuMatch = entry.message.match(/CPU usage.*:\s*(\d+)%/i)
      if (cpuMatch) {
        const cpuUsage = Number.parseInt(cpuMatch[1])
        metrics.push({
          type: "CPU",
          timestamp: entry.timestamp,
          value: cpuUsage,
          unit: "%",
          threshold: 80,
          status: cpuUsage > 80 ? "CRITICAL" : cpuUsage > 60 ? "WARNING" : "NORMAL",
        })
      }

      // Network analysis
      if (entry.message.includes("timeout") || entry.message.includes("failed to connect")) {
        metrics.push({
          type: "NETWORK",
          timestamp: entry.timestamp,
          value: 0,
          unit: "status",
          status: "CRITICAL",
        })
      }
    }

    return metrics
  }

  private findPatterns(entries: LogEntry[]): PatternMatch[] {
    const patternMatches: PatternMatch[] = []

    for (const [patternName, regex] of this.patterns) {
      const matches = entries.filter((entry) => regex.test(entry.message))
      if (matches.length > 0) {
        patternMatches.push({
          pattern: patternName,
          matches,
          severity: this.getPatternSeverity(patternName),
          description: this.getPatternDescription(patternName),
        })
      }
    }

    return patternMatches
  }

  private getPatternSeverity(patternName: string): PatternMatch["severity"] {
    const errorPatterns = ["MEDIA_PLAYBACK_ERROR", "WEBVIEW_CRASH", "STORAGE_CORRUPTION"]
    const warningPatterns = ["DISPLAY_ISSUE", "NETWORK_CONNECTIVITY"]

    if (errorPatterns.includes(patternName)) return "ERROR"
    if (warningPatterns.includes(patternName)) return "WARNING"
    return "INFO"
  }

  private getPatternDescription(patternName: string): string {
    const descriptions: Record<string, string> = {
      MEDIA_PLAYBACK_ERROR: "Issues with media file playback, codec support, or video rendering",
      WEBVIEW_CRASH: "WebView or Chromium browser engine crashes affecting web content",
      DISPLAY_ISSUE: "Display connectivity or resolution problems",
      NETWORK_CONNECTIVITY: "Network connection issues affecting content delivery",
      STORAGE_CORRUPTION: "Database or file system corruption issues",
    }
    return descriptions[patternName] || "Pattern detected in logs"
  }

  private generateRecommendations(
    crashes: CrashReport[],
    performance: PerformanceMetric[],
    patterns: PatternMatch[],
  ): string[] {
    const recommendations: string[] = []

    // Crash-based recommendations
    if (crashes.length > 0) {
      recommendations.push(`Found ${crashes.length} crash(es). Review crash reports for immediate fixes.`)

      const anrCount = crashes.filter((c) => c.type === "ANR").length
      if (anrCount > 0) {
        recommendations.push("Multiple ANRs detected. Optimize main thread operations.")
      }
    }

    // Performance-based recommendations
    const memoryIssues = performance.filter((p) => p.type === "MEMORY" && p.status !== "NORMAL")
    if (memoryIssues.length > 0) {
      recommendations.push("Memory usage is high. Consider optimizing image loading and caching.")
    }

    const cpuIssues = performance.filter((p) => p.type === "CPU" && p.status !== "NORMAL")
    if (cpuIssues.length > 0) {
      recommendations.push("High CPU usage detected. Profile and optimize performance-critical code.")
    }

    // Pattern-based recommendations
    const mediaErrors = patterns.find((p) => p.pattern === "MEDIA_PLAYBACK_ERROR")
    if (mediaErrors && mediaErrors.matches.length > 0) {
      recommendations.push("Media playback issues detected. Verify codec compatibility and file formats.")
    }

    const webviewCrashes = patterns.find((p) => p.pattern === "WEBVIEW_CRASH")
    if (webviewCrashes && webviewCrashes.matches.length > 0) {
      recommendations.push("WebView crashes detected. Update WebView version and review JavaScript code.")
    }

    return recommendations
  }
}
