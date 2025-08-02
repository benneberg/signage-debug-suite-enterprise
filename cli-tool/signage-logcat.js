#!/usr/bin/env node

const { Command } = require("commander")
const chalk = require("chalk")
const fs = require("fs")
const readline = require("readline")

const program = new Command()

program
  .name("signage-logcat")
  .description("A CLI tool for parsing, filtering, and pretty-printing adb logcat output.")
  .version("1.0.0")
  .option("-t, --tag <tags>", 'Comma-separated list of tags to filter by (e.g., "WebView,MediaPlayer")', "")
  .option("-l, --level <level>", "Minimum log level (V, D, I, W, E, F)", "V")
  .option("-m, --message <regex>", "Regex to filter messages by")
  .option("-f, --file <path>", "Read logs from a file instead of stdin")
  .option("-o, --output <format>", "Output format (json, txt, html)", "txt")
  .parse(process.argv)

const options = program.opts()

const TAGS_FILTER = options.tag
  .split(",")
  .map((t) => t.trim().toLowerCase())
  .filter((t) => t)
const LEVEL_MAP = { V: 0, D: 1, I: 2, W: 3, E: 4, F: 5 }
const MIN_LEVEL = LEVEL_MAP[options.level.toUpperCase()] || 0
const MESSAGE_REGEX = options.message ? new RegExp(options.message, "i") : null
const OUTPUT_FORMAT = options.output.toLowerCase()

// Colors for different log levels
const levelColors = {
  V: chalk.gray,
  D: chalk.magenta,
  I: chalk.cyan,
  W: chalk.yellow,
  E: chalk.red,
  F: chalk.red.bold,
}

let lastTimestamp = null

function formatLogLine(line) {
  // Example logcat format:
  // 07-23 13:01:19.123  1234  5678 I Tag: This is a log message
  const match = line.match(/^(\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s+(\d+)\s+([VDIWEF])\s+([^:]+):\s*(.*)$/)

  if (!match) {
    // If it doesn't match the standard format, just return it unformatted
    return line
  }

  const [fullMatch, timestampStr, pid, tid, level, tag, message] = match

  // Apply filters
  if (LEVEL_MAP[level] < MIN_LEVEL) return null
  if (TAGS_FILTER.length > 0 && !TAGS_FILTER.some((fTag) => tag.toLowerCase().includes(fTag))) return null
  if (MESSAGE_REGEX && !MESSAGE_REGEX.test(message)) return null

  const color = levelColors[level] || chalk.white

  // Calculate timestamp diff
  let timeDiff = ""
  try {
    const currentTimestamp = new Date(`2000-${timestampStr.replace("-", "/")}`) // Use a dummy year for parsing
    if (lastTimestamp) {
      const diffMs = currentTimestamp.getTime() - lastTimestamp.getTime()
      timeDiff = chalk.dim(` (+${diffMs}ms)`)
    }
    lastTimestamp = currentTimestamp
  } catch (e) {
    // Ignore timestamp parsing errors
  }

  // Highlight stack traces (simple check for common patterns)
  let formattedMessage = message
  if (level === "E" && (message.includes("at ") || message.includes("Caused by:"))) {
    formattedMessage = chalk.redBright(message)
  }

  return `${chalk.dim(timestampStr)}${timeDiff} ${chalk.gray(`PID:${pid} TID:${tid}`)} ${color(level)} ${chalk.green(tag)}: ${formattedMessage}`
}

function processLine(line) {
  const formatted = formatLogLine(line)
  if (formatted !== null) {
    if (OUTPUT_FORMAT === "json") {
      // For JSON output, parse the line into an object
      const match = line.match(
        /^(\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s+(\d+)\s+([VDIWEF])\s+([^:]+):\s*(.*)$/,
      )
      if (match) {
        const [_, timestamp, pid, tid, level, tag, message] = match
        console.log(
          JSON.stringify({ timestamp, pid: Number.parseInt(pid), tid: Number.parseInt(tid), level, tag, message }),
        )
      } else {
        console.log(JSON.stringify({ raw: line }))
      }
    } else if (OUTPUT_FORMAT === "html") {
      // Basic HTML output (needs more robust escaping for production)
      const levelClass = `log-${formatted.match(/\s+([VDIWEF])\s+/)?.[1]?.toLowerCase() || "v"}`
      console.log(`<div class="log-entry ${levelClass}">${formatted.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`)
    } else {
      // txt or default
      console.log(formatted)
    }
  }
}

function setupInput(input) {
  const rl = readline.createInterface({
    input: input,
    crlfDelay: Number.POSITIVE_INFINITY,
  })

  rl.on("line", (line) => {
    processLine(line)
  })

  rl.on("close", () => {
    if (OUTPUT_FORMAT === "json") {
      // If JSON output, ensure it's a valid array or stream of objects
      // For simplicity, we're just printing line by line, which is a stream of JSON objects.
    } else if (OUTPUT_FORMAT === "html") {
      // Add closing tags if needed for a full HTML document
    }
  })
}

if (options.file) {
  if (!fs.existsSync(options.file)) {
    console.error(chalk.red(`Error: File not found at ${options.file}`))
    process.exit(1)
  }
  const fileStream = fs.createReadStream(options.file)
  setupInput(fileStream)
} else {
  // Read from stdin (e.g., `adb logcat | node signage-logcat.js`)
  setupInput(process.stdin)
}
