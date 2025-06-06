import React, { useRef, useState, useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import WebView from "react-native-webview";
import { ThemeView } from "@/components/primitives";
import { HTMLViewerPlugin, PluginContext, PluginMessage } from "./plugins/types";
import { useDarkMode } from "@/theme/hooks";

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
    const [menuVersion, setMenuVersion] = useState(0);
    const isDarkMode = useDarkMode(); // Get real dark mode state

    // Get menu items from all plugins (recalculate when menuVersion changes)
    const menuItems = useMemo(() => {
      const allMenuItems: { label: string; key: string }[] = [];
      plugins.forEach((plugin) => {
        if (plugin.getMenuItems) {
          const pluginMenuItems = plugin.getMenuItems();
          allMenuItems.push(...pluginMenuItems);
        }
      });
      return allMenuItems;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plugins, menuVersion]); // menuVersion intentionally triggers recalculation when plugin state changes

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

    // Viewer functions that plugins can call directly (currently unused but may be needed for future plugin functionality)
    // const viewerFunctions = useMemo(
    //   () => ({
    //     setHeight: (height: number) => {
    //       setViewerHeight(height);
    //       // Notify parent of content size change for scroll calculations
    //       if (onContentSizeChange) {
    //         onContentSizeChange(height);
    //       }
    //     },
    //     getHeight: () => viewerHeight,
    //     refresh: () => {
    //       if (webViewRef.current) {
    //         webViewRef.current.reload();
    //       }
    //     },
    //   }),
    //   [viewerHeight, onContentSizeChange],
    // );

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
        isDarkMode, // Use real dark mode state
        setHeight: (height: number) => {
          setViewerHeight(height);
          if (onContentSizeChange) {
            onContentSizeChange(height);
          }
        },
        invalidateMenuItems: () => {
          // Defer state update to next tick to avoid React warnings
          setTimeout(() => {
            setMenuVersion((prev) => prev + 1);
          }, 0);
        },
      }),
      [isDarkMode, onContentSizeChange],
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

    // Handle messages from WebView
    const handleMessage = useCallback(
      (event: { nativeEvent: { data: string } }) => {
        try {
          const message = JSON.parse(event.nativeEvent.data) as PluginMessage;

          if (message.type === "webview-ready") {
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
