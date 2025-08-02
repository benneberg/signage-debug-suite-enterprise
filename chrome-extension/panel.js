// This script runs within the DevTools panel's context

const logContainer = document.getElementById("logContainer")
const tagFilterInput = document.getElementById("tagFilter")
const levelFilterSelect = document.getElementById("levelFilter")
const messageFilterInput = document.getElementById("messageFilter")
const clearLogsButton = document.getElementById("clearLogs")

let allLogs = [] // Store all logs to apply filters dynamically

// Simulate receiving logs from the inspected window
// In a real scenario, you'd use chrome.devtools.inspectedWindow.eval
// or a content script to intercept console messages and send them here.
function addLog(level, tag, message) {
  const timestamp = new Date().toLocaleTimeString()
  const logEntry = { timestamp, level, tag, message }
  allLogs.push(logEntry)
  renderLogs()
}

function renderLogs() {
  logContainer.innerHTML = "" // Clear current view

  const tagFilter = tagFilterInput.value
    .toLowerCase()
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t)
  const levelFilter = levelFilterSelect.value.toLowerCase()
  const messageFilter = messageFilterInput.value
  let messageRegex
  try {
    messageRegex = messageFilter ? new RegExp(messageFilter, "i") : null
  } catch (e) {
    console.error("Invalid regex:", e)
    messageRegex = null
  }

  allLogs.forEach((log) => {
    const { timestamp, level, tag, message } = log

    // Apply filters
    if (levelFilter && level.toLowerCase() !== levelFilter) return
    if (tagFilter.length > 0 && !tagFilter.some((fTag) => tag.toLowerCase().includes(fTag))) return
    if (messageRegex && !messageRegex.test(message)) return

    const logElement = document.createElement("div")
    logElement.classList.add("log-entry")
    logElement.classList.add(`level-${level.toLowerCase()}`)

    // Highlight player lifecycle events
    if (message.toLowerCase().includes("init") && tag.toLowerCase().includes("player")) {
      logElement.classList.add("highlight-init")
    } else if (message.toLowerCase().includes("loadmedia") && tag.toLowerCase().includes("player")) {
      logElement.classList.add("highlight-loadmedia")
    } else if (level.toLowerCase() === "error" || message.toLowerCase().includes("error")) {
      logElement.classList.add("highlight-error")
    }

    logElement.innerHTML = `
      <span class="timestamp">${timestamp}</span>
      <span class="level level-${level.toLowerCase()}">${level.substring(0, 1)}</span>
      <span class="tag">${tag}</span>
      <span class="message">${message}</span>
    `
    logContainer.appendChild(logElement)
  })
  logContainer.scrollTop = logContainer.scrollHeight // Scroll to bottom
}

// Event Listeners for filters
tagFilterInput.addEventListener("input", renderLogs)
levelFilterSelect.addEventListener("change", renderLogs)
messageFilterInput.addEventListener("input", renderLogs)
clearLogsButton.addEventListener("click", () => {
  allLogs = []
  renderLogs()
})

// --- Mock Log Generation for Demonstration ---
// In a real scenario, these would come from the inspected page.
// You can call `addLog` from the DevTools console (e.g., `chrome.devtools.inspectedWindow.eval('addLog("INFO", "App", "Application started.");')`)
// or set up a content script to forward console messages.

// Simulate some initial logs
addLog("INFO", "App", "Application initialized.")
addLog("DEBUG", "Player", "Player instance created.")
addLog("INFO", "Network", "Fetching content playlist from https://example.com/playlist.json")
addLog("DEBUG", "Player", "loadMedia called with mediaId: 'video-ad-1'")
addLog("VERBOSE", "MediaPlayer", "Video buffer progress: 25%")
addLog("WARN", "Network", "Failed to fetch analytics endpoint: Connection timed out.")
addLog("ERROR", "Player", "Media playback error: Codec not supported for 'video-ad-1'.")
addLog("INFO", "App", "Restarting player due to error.")
addLog("DEBUG", "Player", "Player instance created.")
addLog("INFO", "Network", "Playlist updated. New content available.")
addLog("DEBUG", "Player", "loadMedia called with mediaId: 'image-promo-2'")
addLog("INFO", "System", "Memory usage: 85%")
addLog(
  "ERROR",
  "System.err",
  "java.lang.NullPointerException: Attempt to invoke virtual method 'void android.view.View.setVisibility(int)' on a null object reference",
)
addLog("INFO", "App", "Application shutdown sequence initiated.")

// Example of how you might send a message from the inspected window to the panel
// (This requires a content script or direct eval from devtools.js)
// For demonstration, we'll just add a log directly.
// To simulate a log from the inspected page, you could run this in the DevTools console:
// `chrome.devtools.inspectedWindow.eval('console.log("Hello from inspected page!");')`
// and then have a content script intercept it and send it to the panel.
