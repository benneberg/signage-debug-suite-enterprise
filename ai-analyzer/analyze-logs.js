import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Ensure your OpenAI API key is set as an environment variable:
// export OPENAI_API_KEY="sk-..."

const sampleLogs = `
07-23 10:00:01.123  1234  5678 I App: Application started. Version 1.0.
07-23 10:00:02.456  1234  5678 D Player: Initializing media player instance.
07-23 10:00:03.789  1234  5678 I Network: Attempting to fetch content from https://cdn.signage.com/playlist.json
07-23 10:00:04.111  1234  5678 W Network: Connection to analytics endpoint failed. Retrying...
07-23 10:00:05.222  1234  5678 E Player: Media playback error: Codec not supported for 'video_ad_promo.mp4'.
07-23 10:00:05.333  1234  5678 I App: Player error detected. Attempting fallback content.
07-23 10:00:06.444  1234  5678 D Player: Loading fallback image: 'default_promo.jpg'.
07-23 10:00:07.555  1234  5678 I Network: Content fetched successfully.
07-23 10:00:08.666  1234  5678 E System.err: java.lang.NullPointerException: Attempt to invoke virtual method 'void android.widget.TextView.setText(java.lang.CharSequence)' on a null object reference
07-23 10:00:08.777  1234  5678 I App: Application running smoothly.
07-23 10:00:09.888  1234  5678 W Player: High memory usage detected: 85% of available RAM.
`

async function analyzeLogs(logs) {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"), // Using gpt-4o as a powerful model for analysis [^1]
      system: `You are an expert Android digital signage developer assistant. Analyze the provided logcat output.
               Identify critical errors, warnings, and potential issues.
               Provide a concise summary, highlight probable causes, and suggest solutions or next steps.
               Group related events chronologically.
               Focus on player lifecycle events, network issues, and system errors.`,
      prompt: `Analyze the following digital signage player logs:\n\n${logs}`,
    })

    console.log("--- AI Log Analysis Report ---")
    console.log(text)
    console.log("\n------------------------------")
  } catch (error) {
    console.error("Error analyzing logs with AI:", error)
    if (error.message.includes("API Key")) {
      console.error("Please ensure your OPENAI_API_KEY environment variable is correctly set.")
    }
  }
}

console.log("Analyzing sample logs...")
analyzeLogs(sampleLogs)
