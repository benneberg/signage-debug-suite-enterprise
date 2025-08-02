;(() => {
  // Check if the overlay already exists to prevent multiple injections
  if (window.__signageDebugOverlay) {
    console.warn("Signage Debug Overlay already loaded.")
    return
  }
  window.__signageDebugOverlay = true

  const OVERLAY_ID = "signage-debug-overlay"
  const LOG_LIMIT = 100 // Max number of log entries to display

  let overlay = document.getElementById(OVERLAY_ID)
  const logBuffer = []

  if (!overlay) {
    overlay = document.createElement("div")
    overlay.id = OVERLAY_ID
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      width: 350px;
      max-height: 80%;
      background-color: rgba(0, 0, 0, 0.85);
      color: #fff;
      border: 1px solid #444;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 99999;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      resize: both; /* Allow resizing */
      overflow: hidden; /* Hide scrollbars initially */
      display: none; /* Hidden by default */
      flex-direction: column;
    `
    document.body.appendChild(overlay)

    // Header for dragging
    const header = document.createElement("div")
    header.style.cssText = `
      background-color: #333;
      padding: 8px 12px;
      cursor: grab;
      border-bottom: 1px solid #444;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
    `
    header.innerHTML = `Signage Debug <span style="font-size: 10px; opacity: 0.7;">(Shift+D to toggle)</span>`
    overlay.appendChild(header)

    // Info section
    const infoSection = document.createElement("div")
    infoSection.style.cssText = `
      padding: 8px 12px;
      border-bottom: 1px solid #444;
      font-size: 11px;
      line-height: 1.4;
    `
    infoSection.innerHTML = `
      <div><strong>Resolution:</strong> <span id="debug-res">N/A</span></div>
      <div><strong>Player State:</strong> <span id="debug-player-state">N/A</span></div>
      <div><strong>Media Info:</strong> <span id="debug-media-info">N/A</span></div>
      <div><strong>App Config:</strong> <span id="debug-app-config">N/A</span></div>
    `
    overlay.appendChild(infoSection)

    // Log output area
    const logOutput = document.createElement("div")
    logOutput.id = "debug-log-output"
    logOutput.style.cssText = `
      flex-grow: 1;
      overflow-y: auto;
      padding: 8px 12px;
      white-space: pre-wrap;
      word-break: break-all;
    `
    overlay.appendChild(logOutput)

    // Make draggable
    let isDragging = false
    let offsetX, offsetY

    header.addEventListener("mousedown", (e) => {
      isDragging = true
      offsetX = e.clientX - overlay.getBoundingClientRect().left
      offsetY = e.clientY - overlay.getBoundingClientRect().top
      header.style.cursor = "grabbing"
    })

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return
      overlay.style.left = `${e.clientX - offsetX}px`
      overlay.style.top = `${e.clientY - offsetY}px`
    })

    document.addEventListener("mouseup", () => {
      isDragging = false
      header.style.cursor = "grab"
    })

    // Toggle visibility with Shift + D
    document.addEventListener("keydown", (e) => {
      if (e.shiftKey && e.key === "D") {
        overlay.style.display = overlay.style.display === "none" ? "flex" : "none"
      }
    })

    // Update info periodically (mock data for demonstration)
    function updateInfo() {
      document.getElementById("debug-res").textContent = `${window.innerWidth}x${window.innerHeight}`
      document.getElementById("debug-player-state").textContent = Math.random() > 0.5 ? "PLAYING" : "IDLE"
      document.getElementById("debug-media-info").textContent =
        `Video: ${Math.random() > 0.5 ? "mp4" : "webm"}, Duration: ${Math.floor(Math.random() * 300)}s`
      document.getElementById("debug-app-config").textContent = `Endpoint: /api/content, Auth: true`
    }
    setInterval(updateInfo, 2000) // Update every 2 seconds
    updateInfo() // Initial update
  }

  const originalConsoleLog = console.log
  const originalConsoleWarn = console.warn
  const originalConsoleError = console.error

  function appendLog(type, args) {
    const logOutput = document.getElementById("debug-log-output")
    if (!logOutput) return

    const timestamp = new Date().toLocaleTimeString()
    const message = Array.from(args)
      .map((arg) => {
        if (typeof arg === "object" && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2)
          } catch (e) {
            return String(arg) // Fallback for circular structures
          }
        }
        return String(arg)
      })
      .join(" ")

    logBuffer.push({ timestamp, type, message })
    if (logBuffer.length > LOG_LIMIT) {
      logBuffer.shift() // Remove oldest log
    }

    // Re-render all logs to ensure order and limit
    logOutput.innerHTML = logBuffer
      .map((entry) => {
        let color = "#fff"
        if (entry.type === "warn") color = "#e5c07b"
        if (entry.type === "error") color = "#e06c75"
        return `<div style="color: ${color}; margin-bottom: 4px;">
                <span style="opacity: 0.7;">[${entry.timestamp}]</span>
                <span style="text-transform: uppercase; font-weight: bold;">${entry.type}:</span>
                ${entry.message}
              </div>`
      })
      .join("")

    logOutput.scrollTop = logOutput.scrollHeight // Scroll to bottom
  }

  // Override console methods
  console.log = (...args) => {
    appendLog("log", args)
    originalConsoleLog.apply(console, args)
  }

  console.warn = (...args) => {
    appendLog("warn", args)
    originalConsoleWarn.apply(console, args)
  }

  console.error = (...args) => {
    appendLog("error", args)
    originalConsoleError.apply(console, args)
  }

  console.info("Signage Debug Overlay loaded. Press Shift+D to toggle visibility.")

  // Example usage:
  // setTimeout(() => console.log("App initialized."), 1000);
  // setTimeout(() => console.warn("Network connection unstable."), 3000);
  // setTimeout(() => console.error("Failed to load media: video.mp4"), 5000);
  // setTimeout(() => console.log("Player state changed to PLAYING"), 7000);
  // setTimeout(() => console.log({ config: { endpoint: '/api/data', version: '1.2' }, status: 'ok' }), 9000);
})()
