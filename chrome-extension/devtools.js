// Declare the chrome variable
const chrome = window.chrome

// Create a custom panel in DevTools
chrome.devtools.panels.create(
  "Signage Debug", // Title of the panel
  "", // Icon (optional)
  "panel.html", // HTML file for the panel's content
  (panel) => {
    // Panel created callback
    console.log("Signage Debug panel created!")

    // You can communicate with the panel here if needed
    // For example, to send messages from the inspected window to the panel
    // panel.onShown.addListener(function(window) {
    //   // window is the panel's window object
    // });
  },
)
