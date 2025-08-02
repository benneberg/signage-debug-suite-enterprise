const { spawn } = require("child_process")

const startLogcatButton = document.getElementById("startLogcat")
const stopLogcatButton = document.getElementById("stopLogcat")
const clearLogsButton = document.getElementById("clearLogs")
const tagFilterInput = document.getElementById("tagFilter")
const levelFilterSelect = document.getElementById("levelFilter")
const messageFilterInput = document.getElementById("messageFilter")
const logOutput = document.getElementById("logOutput")

let logcatProcess = null
let allLogLines = [] // Store all raw log lines

function applyFiltersAndRender() {
  logOutput.innerHTML = "" // Clear current view

  const tagFilter = tagFilterInput.value
    .toLowerCase()
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t)
  const levelFilter = levelFilterSelect.value.toUpperCase()
  const messageFilter = messageFilterInput.value
  let messageRegex
  try {
    messageRegex = messageFilter ? new RegExp(messageFilter, "i") : null
  } catch (e) {
    console.error("Invalid regex:", e)
    messageRegex = null
  }

  allLogLines.forEach((line) => {
    // Example log format: I/Tag: Message
    const parts = line.match(/^([VDIWEF])\/(.+?):\s*(.*)$/)
    if (!parts) {
      // If it doesn't match the expected format, just display it without filtering
      appendLogLine(line, "log-V") // Default to verbose color
      return
    }

    const level = parts[1]
    const tag = parts[2]
    const message = parts[3]

    // Apply filters
    if (levelFilter && level !== levelFilter) return
    if (tagFilter.length > 0 && !tagFilter.some((fTag) => tag.toLowerCase().includes(fTag))) return
    if (messageRegex && !messageRegex.test(message)) return

    appendLogLine(line, `log-${level}`)
  })
  logOutput.scrollTop = logOutput.scrollHeight // Scroll to bottom
}

function appendLogLine(line, className) {
  const span = document.createElement("span")
  span.classList.add(className)
  span.textContent = line + "\n"
  logOutput.appendChild(span)
}

startLogcatButton.addEventListener("click", () => {
  if (logcatProcess) {
    console.log("Logcat already running.")
    return
  }

  // Clear previous logs
  allLogLines = []
  logOutput.innerHTML = ""

  // Spawn adb logcat process
  // Ensure 'adb' is in your system's PATH
  logcatProcess = spawn("adb", ["logcat"])

  logcatProcess.stdout.on("data", (data) => {
    const lines = data
      .toString()
      .split("\n")
      .filter((line) => line.trim() !== "")
    lines.forEach((line) => {
      allLogLines.push(line)
    })
    applyFiltersAndRender() // Re-render all logs with filters
  })

  logcatProcess.stderr.on("data", (data) => {
    console.error(`Logcat stderr: ${data}`)
    appendLogLine(`ERROR: ${data}`, "log-E")
  })

  logcatProcess.on("close", (code) => {
    console.log(`Logcat process exited with code ${code}`)
    logcatProcess = null
    appendLogLine(`Logcat process stopped. Code: ${code}`, "log-I")
  })

  logcatProcess.on("error", (err) => {
    console.error("Failed to start logcat process:", err)
    appendLogLine(`Failed to start logcat: ${err.message}. Is adb installed and in PATH?`, "log-F")
    logcatProcess = null
  })

  console.log("Logcat started.")
  appendLogLine("Logcat started...", "log-I")
})

stopLogcatButton.addEventListener("click", () => {
  if (logcatProcess) {
    logcatProcess.kill() // Terminate the process
    logcatProcess = null
    console.log("Logcat stopped.")
    appendLogLine("Logcat stopped.", "log-I")
  }
})

clearLogsButton.addEventListener("click", () => {
  allLogLines = []
  logOutput.innerHTML = ""
})

tagFilterInput.addEventListener("input", applyFiltersAndRender)
levelFilterSelect.addEventListener("change", applyFiltersAndRender)
messageFilterInput.addEventListener("input", applyFiltersAndRender)

// Initial render (empty)
applyFiltersAndRender()
