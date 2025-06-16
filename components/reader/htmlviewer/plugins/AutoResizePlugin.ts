import { HTMLViewerPlugin, PluginContext, PluginMessage, AutoResizeMessage } from "./types";

export class AutoResizePlugin implements HTMLViewerPlugin {
  name = "auto-resize";

  /**
   * Initialize the plugin (called by HTMLViewer when WebView is ready)
   */
  initialize(_context: PluginContext) {
    // AutoResizePlugin doesn't need any initialization
    // The JavaScript will start working immediately
  }

  get jsCode(): string {
    return `
      (function() {
        let lastHeight = 0;
        
        function reportHeight() {
          const height = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight
          );
          
          if (height !== lastHeight && height > 0) {
            lastHeight = height;
            window.htmlViewer.postMessage({
              pluginName: 'auto-resize',
              type: 'height-changed',
              payload: { height }
            });
          }
        }

        // Initial measurement  
        reportHeight();

        // Watch for size changes
        new ResizeObserver(reportHeight).observe(document.body);
      })();
    `;
  }

  messageHandler = (message: PluginMessage, context: PluginContext) => {
    if (message.type === "height-changed" && message.pluginName === "auto-resize") {
      const autoResizeMessage = message as AutoResizeMessage;
      if (autoResizeMessage.payload?.height) {
        const height = Number(autoResizeMessage.payload.height);
        if (!isNaN(height)) {
          context.setHeight(height);
        }
      }
    }
  };
}
