import React, { useRef, useState, useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import WebView from "react-native-webview";
import { ThemeView } from "@/components/primitives";
import { HTMLViewerPlugin, PluginContext, PluginMessage } from "./plugins/types";

interface HTMLViewerProps {
  content: string; // The main content to display
  cssStyles: string; // CSS styles for the content
  plugins?: HTMLViewerPlugin[];
  style?: object;
  onMessage?: (message: PluginMessage) => void;
  onLoadComplete?: () => void;
  onContentSizeChange?: (height: number) => void;
}

export const HTMLViewer: React.FC<HTMLViewerProps> = React.memo(
  ({ content, cssStyles, plugins = [], style, onMessage, onLoadComplete, onContentSizeChange }) => {
    const webViewRef = useRef<WebView>(null);
    const [viewerHeight, setViewerHeight] = useState(600);
    const [menuUpdateTrigger, setMenuUpdateTrigger] = useState(0);

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
          if (webViewRef.current) {
            webViewRef.current.reload();
          }
        },
      }),
      [viewerHeight, onContentSizeChange],
    );

    // Create plugin context
    const pluginContext: PluginContext = useMemo(
      () => ({
        sendCommand: (pluginName: string, commandType: string, payload?: unknown) => {
          if (webViewRef.current) {
            // Use controlled closure injection - secure and minimal
            const commandData = JSON.stringify({ pluginName, commandType, payload });

            webViewRef.current.injectJavaScript(`
              (function() {
                if (window.handlePluginCommand) {
                  window.handlePluginCommand(${commandData});
                } else {
                  console.error('HTMLViewer: handlePluginCommand not available yet');
                }
              })();
              true;
            `);
          }
        },
        isDarkMode: false,
        viewer: viewerFunctions,
        updateMenus: () => {
          setMenuUpdateTrigger((prev) => prev + 1);
        },
      }),
      [viewerFunctions],
    );

    // Generate the generic HTMLViewer API injection script
    const htmlViewerApiScript = useMemo(
      () => `
      window.htmlViewer = {
        postMessage: function(data) {
          const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
          window.ReactNativeWebView?.postMessage(jsonString);
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

    // Handle messages from WebView
    const handleMessage = useCallback(
      (event: { nativeEvent: { data: string } }) => {
        try {
          const message = JSON.parse(event.nativeEvent.data) as PluginMessage;

          if (message.type === "webview-ready") {
            // Set context on all plugins immediately when WebView is ready
            plugins.forEach((plugin) => {
              if (plugin.setContext) {
                plugin.setContext(pluginContext);
              }
            });

            // Activate all plugins after context is set
            plugins.forEach((plugin) => {
              if (plugin.activate) {
                plugin.activate();
              }
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
              plugin.messageHandler(message, pluginContext);
            }
          }

          // Forward message to parent
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error("Error handling WebView message:", error);
        }
      },
      [plugins, pluginContext, onMessage, onLoadComplete],
    );

    return (
      <ThemeView style={[styles.container, style]}>
        <WebView
          ref={webViewRef}
          source={{ html: fullHtml }}
          style={[styles.webview, { height: viewerHeight }]}
          onMessage={handleMessage}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          onCustomMenuSelection={handleCustomMenuSelection}
          menuItems={menuItems}
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
  webview: {
    flex: 1,
  },
});

export default HTMLViewer;
