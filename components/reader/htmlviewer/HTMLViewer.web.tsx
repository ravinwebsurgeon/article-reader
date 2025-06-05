import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { ThemeView } from "@/components/primitives";
import { HTMLViewerPlugin, PluginContext, PluginMessage } from "./plugins/types";

interface HTMLViewerProps {
  content: string; // The main content to display
  cssStyles: string; // CSS styles for the content
  plugins?: HTMLViewerPlugin[];
  style?: ViewStyle;
  onMessage?: (message: PluginMessage) => void;
  onLoadComplete?: () => void;
  onContentSizeChange?: (height: number) => void;
  menuItems?: { label: string; key: string }[];
  onCustomMenuSelection?: (event: { nativeEvent: { key: string; selectedText: string } }) => void;
}

export const HTMLViewer: React.FC<HTMLViewerProps> = React.memo(
  ({
    content,
    cssStyles,
    plugins = [],
    style,
    onMessage,
    onLoadComplete,
    onContentSizeChange,
    menuItems,
    onCustomMenuSelection,
  }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isWebViewReady, setIsWebViewReady] = useState(false);
    const [viewerHeight, setViewerHeight] = useState(300);

    // Viewer functions that plugins can call directly
    const viewerFunctions = useMemo(
      () => ({
        setHeight: (height: number) => {
          setViewerHeight(height);
          // Notify parent of content size change for scroll calculations
          if (onContentSizeChange) {
            onContentSizeChange(height);
          }
        },
        getHeight: () => viewerHeight,
        refresh: () => {
          const iframe = iframeRef.current;
          if (iframe) {
            iframe.src = iframe.src; // Reload iframe
          }
        },
      }),
      [viewerHeight, onContentSizeChange],
    );

    // Create plugin context
    const pluginContext: PluginContext = useMemo(
      () => ({
        sendCommand: (pluginName: string, commandType: string, payload?: unknown) => {
          if (iframeRef.current?.contentWindow && isWebViewReady) {
            console.log("HTMLViewer.web: Sending command to iframe:", {
              pluginName,
              commandType,
              payload,
            });
            iframeRef.current.contentWindow.postMessage(
              {
                type: "plugin-command",
                pluginName,
                commandType,
                payload,
              },
              "*",
            );
          }
        },
        isDarkMode: false,
        viewer: viewerFunctions,
        updateMenus: () => {
          // No-op for web version
        },
      }),
      [isWebViewReady, viewerFunctions],
    );

    // Generate the generic HTMLViewer API injection script
    const htmlViewerApiScript = useMemo(
      () => `
      console.log('HTMLViewer.web API script loaded');
      window.htmlViewer = {
        postMessage: function(data) {
          console.log('HTMLViewer.web postMessage called with:', data);
          const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
          window.parent.postMessage(jsonString, '*');
        },
        showContextMenu: function(x, y, selectedText) {
          // This is a placeholder for web - we'll implement a custom context menu later
          console.log('Context menu requested at', x, y, 'for text:', selectedText);
        }
      };

      // Listen for commands from React (web)
      window.addEventListener('message', function(event) {
        try {
          const message = event.data;
          if (message && message.type === 'plugin-command') {
            const { pluginName, commandType, payload } = message;
            console.log('HTMLViewer.web iframe received command:', { pluginName, commandType, payload });
            
            // Dispatch to the appropriate plugin
            window.dispatchEvent(new CustomEvent(pluginName + 'Command', {
              detail: {
                type: commandType,
                payload: payload
              }
            }));
          }
        } catch (error) {
          console.error('Error parsing command message:', error);
        }
      });
    `,
      [],
    );

    // Generate combined JavaScript from all plugins
    const combinedPluginScript = useMemo(() => {
      return plugins.map((plugin) => plugin.jsCode).join("\n\n");
    }, [plugins]);

    // Create the complete HTML document
    const fullHtml = useMemo(() => {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <style>
              ${cssStyles}
            </style>
          </head>
          <body>
            ${content}
            <script>
              console.log('HTMLViewer.web: Starting script injection...');
              ${htmlViewerApiScript}
              ${combinedPluginScript}
              
              // Wait for everything to load before sending ready message
              window.addEventListener('load', () => {
                window.htmlViewer.postMessage({
                  type: 'webview-ready'
                });
              });
            </script>
          </body>
        </html>
      `;
    }, [content, cssStyles, htmlViewerApiScript, combinedPluginScript]);

    // Handle messages from iframe
    const handleMessage = useCallback(
      (event: MessageEvent) => {
        // Ensure the message is from our iframe
        if (event.source !== iframeRef.current?.contentWindow) return;

        try {
          const message = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
          console.log("HTMLViewer.web: Received message:", message);

          if (message.type === "webview-ready") {
            setIsWebViewReady(true);
            if (onLoadComplete) {
              onLoadComplete();
            }
            return;
          }

          // Route messages to appropriate plugins
          if (message.pluginName) {
            const plugin = plugins.find((p) => p.name === message.pluginName);
            if (plugin) {
              console.log("HTMLViewer.web: Routing message to plugin:", message.pluginName);
              plugin.messageHandler(message as PluginMessage, pluginContext);
            }
          }

          // Forward message to parent
          if (onMessage) {
            onMessage(message as PluginMessage);
          }
        } catch (error) {
          console.error("Error parsing iframe message:", error);
        }
      },
      [plugins, pluginContext, onMessage, onLoadComplete],
    );

    // Set up message listener
    useEffect(() => {
      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }, [handleMessage]);

    return (
      <ThemeView style={[styles.container, style]}>
        <iframe
          ref={iframeRef}
          srcDoc={fullHtml}
          style={{
            flex: 1,
            border: "none",
            width: "100%",
            height: viewerHeight,
          }}
          title="HTML Viewer"
        />
      </ThemeView>
    );
  },
);

HTMLViewer.displayName = "HTMLViewer";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default HTMLViewer;
