import { HTMLViewerPlugin, PluginContext, PluginMessage } from "./types";

export class AutoResizePlugin implements HTMLViewerPlugin {
  name = "auto-resize";

  get jsCode(): string {
    return `
      (function() {
        let lastHeight = 0;
        
        function reportHeight() {
          const height = Math.max(
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight,
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

        // Initial height report
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', reportHeight);
        } else {
          reportHeight();
        }

        // Monitor for changes
        const observer = new ResizeObserver(reportHeight);
        observer.observe(document.body);
        
        // Also monitor for dynamic content changes
        const mutationObserver = new MutationObserver(function(mutations) {
          let shouldCheck = false;
          mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
              shouldCheck = true;
            }
          });
          if (shouldCheck) {
            setTimeout(reportHeight, 100);
          }
        });
        
        mutationObserver.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class']
        });

        // Cleanup function
        window.autoResizeCleanup = function() {
          observer.disconnect();
          mutationObserver.disconnect();
        };
      })();
    `;
  }

  messageHandler = (message: PluginMessage, context: PluginContext) => {
    if (message.type === "height-changed" && message.payload?.height) {
      // Use the viewer function to set height directly
      context.viewer.setHeight(message.payload.height);
    }
  };
}
