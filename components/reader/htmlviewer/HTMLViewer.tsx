import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { StyleSheet } from "react-native";
import WebView from "react-native-webview";
import { ThemeView } from "@/components/primitives";
import { HTMLViewerPlugin, PluginContext, PluginMessage } from "./plugins/types";

interface HTMLViewerProps {
  content: string; // The main content to display
  cssStyles: string; // CSS styles for the content
  plugins?: HTMLViewerPlugin[];
  style?: object;
  onMessage?: (message: any) => void;
  onLoadComplete?: () => void;
  onContentSizeChange?: (height: number) => void;
}

export const HTMLViewer: React.FC<HTMLViewerProps> = React.memo(
  ({ content, cssStyles, plugins = [], style, onMessage, onLoadComplete, onContentSizeChange }) => {
    const webViewRef = useRef<WebView>(null);
    const [isWebViewReady, setIsWebViewReady] = useState(false);
    const [viewerHeight, setViewerHeight] = useState(600);
    const [selectedText, setSelectedText] = useState("");
    const [menuUpdateTrigger, setMenuUpdateTrigger] = useState(0);

    // Get menu items from plugins
    const menuItems = useMemo(() => {
      console.log("HTMLViewer: Getting menu items from plugins");
      const highlightsPlugin = plugins.find((p) => p.name === "highlights") as any;
      if (highlightsPlugin?.getMenuItems) {
        const items = highlightsPlugin.getMenuItems();
        console.log("HTMLViewer: Menu items from highlights plugin:", items);
        return items;
      }
      console.log("HTMLViewer: No menu items found from highlights plugin");
      return [];
    }, [plugins, selectedText, menuUpdateTrigger]);

    // Handle menu selection
    const handleCustomMenuSelection = useCallback(
      (event: { nativeEvent: { key: string; selectedText: string } }) => {
        console.log("HTMLViewer: Menu selection event:", event.nativeEvent);
        const { key, selectedText } = event.nativeEvent;
        const highlightsPlugin = plugins.find((p) => p.name === "highlights") as any;
        if (highlightsPlugin?.handleMenuSelection) {
          console.log("HTMLViewer: Calling handleMenuSelection on highlights plugin");
          highlightsPlugin.handleMenuSelection(key, selectedText);
        } else {
          console.log(
            "HTMLViewer: No highlights plugin found or handleMenuSelection not available",
          );
        }
      },
      [plugins],
    );

    // Debug log for menu items
    useEffect(() => {
      console.log("HTMLViewer: Current menu items:", menuItems);
    }, [menuItems]);

    // Viewer functions that plugins can call directly
    const viewerFunctions = useMemo(
      () => ({
        setHeight: (height: number) => {
          console.log("HTMLViewer: Setting height to", height);
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
        injectJavaScript: (script: string) => {
          if (webViewRef.current && isWebViewReady) {
            webViewRef.current.injectJavaScript(script);
          }
        },
        item: null,
        isDarkMode: false,
        onUpdate: (data: any) => {
          console.log("Plugin update:", data);
        },
        viewer: viewerFunctions,
      }),
      [isWebViewReady, viewerFunctions],
    );

    // Generate the generic HTMLViewer API injection script
    const htmlViewerApiScript = useMemo(
      () => `
      console.log('HTMLViewer API script loaded');
      window.htmlViewer = {
        postMessage: function(data) {
          console.log('HTMLViewer postMessage called with:', data);
          const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
          window.ReactNativeWebView?.postMessage(jsonString);
        }
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
              console.log('Starting script injection...');
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
      (event: any) => {
        try {
          const message = JSON.parse(event.nativeEvent.data);
          console.log("HTMLViewer: Received message:", message);

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
              console.log("HTMLViewer: Routing message to plugin:", message.pluginName);
              plugin.messageHandler(message as PluginMessage, pluginContext);

              // Trigger menu update for selection changes
              if (message.type === "selection-changed" && message.pluginName === "highlights") {
                setMenuUpdateTrigger((prev) => prev + 1);
                console.log("HTMLViewer: Triggering menu update due to selection change");
              }
            }
          }

          // Forward message to parent
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error("Error parsing WebView message:", error);
        }
      },
      [plugins, pluginContext, onMessage, onLoadComplete],
    );

    // WebView source
    const source = useMemo(
      () => ({
        html: fullHtml,
        baseUrl: "about:blank",
      }),
      [fullHtml],
    );

    const handleLoadStart = useCallback(() => {
      console.log("HTMLViewer: Load started");
    }, []);

    const handleLoadEnd = useCallback(() => {
      console.log("HTMLViewer: Load ended");
    }, []);

    const handleError = useCallback((error: any) => {
      console.error("HTMLViewer: WebView error:", error);
    }, []);

    console.log("HTMLViewer: Rendering with height:", viewerHeight);

    return (
      <ThemeView style={[styles.container, { height: viewerHeight }, style]}>
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={source}
          style={styles.webview}
          onMessage={handleMessage}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          nestedScrollEnabled={false}
          cacheEnabled={true}
          mixedContentMode="compatibility"
          mediaPlaybackRequiresUserAction={true}
          startInLoadingState={false}
          allowsInlineMediaPlayback={true}
          bounces={false}
          onShouldStartLoadWithRequest={() => true}
          textInteractionEnabled={true}
          textZoom={100}
          scalesPageToFit={true}
          menuItems={menuItems}
          onCustomMenuSelection={handleCustomMenuSelection}
        />
      </ThemeView>
    );
  },
);

HTMLViewer.displayName = "HTMLViewer";

const styles = StyleSheet.create({
  container: {
    width: "100%",
    position: "relative",
    backgroundColor: "transparent",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});

export default HTMLViewer;
