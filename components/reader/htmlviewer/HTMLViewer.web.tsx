import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { ThemeView } from "@/components/primitives";
import { HTMLViewerPlugin, PluginContext, PluginMessage } from "./plugins/types";
import { useDarkMode } from "@/theme/hooks";

interface HTMLViewerProps {
  content: string; // The main content to display
  cssStyles: string; // CSS styles for the content
  plugins?: HTMLViewerPlugin[];
  style?: ViewStyle;
  onMessage?: (message: PluginMessage) => void;
  onLoadComplete?: () => void;
  onContentSizeChange?: (height: number) => void;
}

export const HTMLViewer: React.FC<HTMLViewerProps> = React.memo(
  ({ content, cssStyles, plugins = [], style, onMessage, onLoadComplete, onContentSizeChange }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isWebViewReady, setIsWebViewReady] = useState(false);
    const [viewerHeight, setViewerHeight] = useState(600);
    const [menuUpdateTrigger, setMenuUpdateTrigger] = useState(0);
    const isDarkMode = useDarkMode(); // Get real dark mode state

    // Get menu items from all plugins
    const menuItems = useMemo(() => {
      const allMenuItems: { label: string; key: string }[] = [];

      // Collect menu items from all plugins
      plugins.forEach((plugin) => {
        if (plugin.getMenuItems) {
          const pluginMenuItems = plugin.getMenuItems();
          allMenuItems.push(...pluginMenuItems);
        }
      });

      return allMenuItems;
    }, [plugins, menuUpdateTrigger]);

    // Handle menu selection
    const handleCustomMenuSelection = useCallback(
      (event: { nativeEvent: { key: string; selectedText: string } }) => {
        const { key, selectedText } = event.nativeEvent;

        // Route menu selection to all plugins that can handle it
        plugins.forEach((plugin) => {
          if (plugin.handleMenuSelection) {
            plugin.handleMenuSelection(key, selectedText);
          }
        });
      },
      [plugins],
    );

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
        isDarkMode, // Use real dark mode state
        setHeight: (height: number) => {
          console.log("HTMLViewer.web: Setting height to", height);
          setViewerHeight(height);
          if (onContentSizeChange) {
            onContentSizeChange(height);
          }
        },
        updateMenus: () => {
          setMenuUpdateTrigger((prev) => prev + 1);
        },
      }),
      [isDarkMode, isWebViewReady, onContentSizeChange, viewerHeight],
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

      // Predefined command handler for secure plugin communication
      window.handlePluginCommand = function(commandData) {
        const { pluginName, commandType, payload } = commandData;
        
        // Dispatch to the appropriate plugin
        window.dispatchEvent(new CustomEvent(pluginName + 'Command', {
          detail: {
            type: commandType,
            payload: payload
          }
        }));
      };

      // Listen for commands from React (web)
      window.addEventListener('message', function(event) {
        try {
          const message = event.data;
          if (message && message.type === 'plugin-command') {
            const { pluginName, commandType, payload } = message;
            console.log('HTMLViewer.web iframe received command:', { pluginName, commandType, payload });
            
            // Use the same command handler as mobile
            window.handlePluginCommand({ pluginName, commandType, payload });
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

    // Generate combined CSS from all plugins
    const combinedPluginCSS = useMemo(() => {
      return plugins
        .map((plugin) => plugin.cssCode)
        .filter(Boolean)
        .join("\n\n");
    }, [plugins]);

    // Generate combined HTML from all plugins
    const combinedPluginHTML = useMemo(() => {
      return plugins
        .map((plugin) => plugin.htmlCode)
        .filter(Boolean)
        .join("\n");
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
              ${combinedPluginCSS}
            </style>
          </head>
          <body>
            ${content}
            ${combinedPluginHTML}
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
    }, [
      content,
      cssStyles,
      combinedPluginCSS,
      combinedPluginHTML,
      htmlViewerApiScript,
      combinedPluginScript,
    ]);

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

            // Initialize all plugins with their context
            plugins.forEach((plugin) => {
              plugin.initialize(pluginContext);
            });

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
            border: "none",
            width: "100%",
            height: viewerHeight,
            minHeight: viewerHeight,
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
