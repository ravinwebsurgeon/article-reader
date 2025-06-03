import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { StyleSheet } from "react-native";
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
        injectJavaScript: (script: string) => {
          if (iframeRef.current?.contentWindow && isWebViewReady) {
            try {
              (iframeRef.current.contentWindow as any).eval(script);
            } catch (error) {
              console.error("Error injecting JavaScript:", error);
            }
          }
        },
        item: null, // Will be provided by plugin if needed
        isDarkMode: false, // Will be provided by plugin if needed
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
      window.htmlViewer = {
        postMessage: function(data) {
          const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
          window.parent.postMessage(jsonString, '*');
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
              plugin.messageHandler(message as PluginMessage, pluginContext);
            }
          }

          // Forward message to parent
          if (onMessage) {
            onMessage(message);
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

    // Create data URL for iframe
    const dataUrl = useMemo(() => {
      return `data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`;
    }, [fullHtml]);

    const iframeStyle: React.CSSProperties = {
      width: "100%",
      height: "100%",
      border: "none",
      backgroundColor: "transparent",
    };

    return (
      <ThemeView style={[styles.container, { height: viewerHeight }, style]}>
        <iframe
          ref={iframeRef}
          src={dataUrl}
          style={iframeStyle}
          frameBorder="0"
          scrolling="no"
          sandbox="allow-scripts allow-same-origin"
        />
      </ThemeView>
    );
  },
);

HTMLViewer.displayName = "HTMLViewer";

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
});

export default HTMLViewer;
