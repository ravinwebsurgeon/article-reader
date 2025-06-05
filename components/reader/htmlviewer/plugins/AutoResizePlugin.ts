import { HTMLViewerPlugin, PluginContext, PluginMessage, AutoResizeMessage } from "./types";

export class AutoResizePlugin implements HTMLViewerPlugin {
  name = "auto-resize";

  get jsCode(): string {
    return `
      (function() {
        let lastHeight = 0;
        
        function reportHeight() {
          const height = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
            document.documentElement.offsetHeight,
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

        // Report height when ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', reportHeight);
        } else {
          reportHeight();
        }

        // Watch for changes
        new ResizeObserver(reportHeight).observe(document.body);
        new MutationObserver(() => setTimeout(reportHeight, 50))
          .observe(document.body, { childList: true, subtree: true });
      })();
    `;
  }

  messageHandler = (message: PluginMessage, context: PluginContext) => {
    if (message.type === "height-changed" && message.pluginName === "auto-resize") {
      const autoResizeMessage = message as AutoResizeMessage;
      if (autoResizeMessage.payload?.height) {
        const height = Number(autoResizeMessage.payload.height);
        if (!isNaN(height)) {
          context.viewer.setHeight(height);
        }
      }
    }
  };
}
