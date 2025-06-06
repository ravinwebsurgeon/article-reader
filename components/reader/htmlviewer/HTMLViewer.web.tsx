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
      window.htmlViewer = {
        postMessage: function(data) {
          const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
          window.parent.postMessage(jsonString, '*');
        },
        showContextMenu: function(x, y, selectedText) {
          // Detect if selection is within a highlight using current selection
          const selection = window.getSelection();
          let isHighlighted = false;
          let highlightId = undefined;
          
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const containersToCheck = [
              range.startContainer,
              range.endContainer,
              range.commonAncestorContainer
            ];
            
            for (const container of containersToCheck) {
              let node = container;
              while (node && node !== document.body) {
                if (node.nodeType === 1 && node.classList && 
                    node.classList.contains('pocket-highlight')) {
                  isHighlighted = true;
                  highlightId = node.dataset.highlightId;
                  break;
                }
                node = node.parentNode;
              }
              if (isHighlighted) break;
            }
          }
          
          // Request menu items from parent for the current selection
          window.parent.postMessage(JSON.stringify({
            type: 'request-menu-items',
            payload: { x, y, selectedText, isHighlighted, highlightId }
          }), '*');
        },
        hideContextMenu: function() {
          const menu = document.getElementById('pocket-context-menu');
          if (menu) {
            menu.style.display = 'none';
          }
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

      // Context menu management
      window.pocketContextMenu = {
        show: function(x, y, menuItems, isDark) {
          const menu = document.getElementById('pocket-context-menu');
          const menuItemsContainer = document.getElementById('pocket-menu-items');
          
          if (!menu || !menuItemsContainer) return;
          
          // Clear existing items
          menuItemsContainer.innerHTML = '';
          
          // Add menu items
          menuItems.forEach(function(item) {
            const button = document.createElement('button');
            button.className = 'pocket-menu-item';
            button.textContent = item.label;
            button.onclick = function() {
              window.htmlViewer.postMessage({
                type: 'menu-item-selected',
                payload: { key: item.key, selectedText: window.getSelection().toString() }
              });
              window.htmlViewer.hideContextMenu();
            };
            menuItemsContainer.appendChild(button);
          });
          
          // Apply dark mode if needed
          if (isDark) {
            menu.classList.add('dark');
          } else {
            menu.classList.remove('dark');
          }
          
          // Show menu to measure its size
          menu.style.display = 'block';
          menu.style.left = '0px';
          menu.style.top = '0px';
          
          // Adjust position after render to center and position above selection
          setTimeout(function() {
            const menuRect = menu.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            // Center horizontally around x, but keep on screen
            let leftPos = x - (menuRect.width / 2);
            if (leftPos < 10) {
              leftPos = 10;
            } else if (leftPos + menuRect.width > windowWidth - 10) {
              leftPos = windowWidth - rect.width - 10;
            }
            menu.style.left = leftPos + 'px';
            
            // Position above selection (menu bottom edge above selection top)
            let topPos = y - menuRect.height - 10;
            
            // If menu would go above viewport, show below selection instead
            if (topPos < 10) {
              topPos = y + 30; // Show below selection with some spacing
            }
            
            menu.style.top = topPos + 'px';
          }, 0);
        },
        
        hide: function() {
          const menu = document.getElementById('pocket-context-menu');
          if (menu) {
            menu.style.display = 'none';
          }
        }
      };

      // Listen for commands from React (web)
      window.addEventListener('message', function(event) {
        try {
          const message = event.data;
          if (message && message.type === 'plugin-command') {
            const { pluginName, commandType, payload } = message;
            
            // Use the same command handler as mobile
            window.handlePluginCommand({ pluginName, commandType, payload });
          } else if (message && message.type === 'show-context-menu') {
            const { x, y, menuItems, isDark } = message.payload;
            window.pocketContextMenu.show(x, y, menuItems, isDark);
          }
        } catch (error) {
          console.error('Error parsing command message:', error);
        }
      });
      
      // Hide menu on clicks outside (but not when selecting text)
      document.addEventListener('mousedown', function(event) {
        const menu = document.getElementById('pocket-context-menu');
        if (menu && !menu.contains(event.target)) {
          // Cancel any pending menu display
          if (menuTimeout) {
            clearTimeout(menuTimeout);
            menuTimeout = null;
          }
          
          // Only hide if we're not starting a text selection
          setTimeout(function() {
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed) {
              window.htmlViewer.hideContextMenu();
            }
          }, 10);
        }
      });
      
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
          window.htmlViewer.hideContextMenu();
        }
      });

      // Debounced context menu display
      let menuTimeout = null;
      
      // Show context menu when text is selected (like native)
      document.addEventListener('selectionchange', function() {
        const selection = window.getSelection();
        
        // Clear any pending menu display
        if (menuTimeout) {
          clearTimeout(menuTimeout);
          menuTimeout = null;
        }
        
        if (selection && !selection.isCollapsed && selection.toString().trim()) {
          // Capture selection data immediately to avoid it being cleared later
          const selectedText = selection.toString();
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const x = rect.left + (rect.width / 2);
          const y = rect.top - 10; // Position above the selection
          
          // Debounce menu display - wait for selection to stabilize and plugins to update
          menuTimeout = setTimeout(function() {
            // Use captured data instead of re-querying selection
            // This prevents issues if selection gets cleared before menu shows
            setTimeout(function() {
              window.htmlViewer.showContextMenu(x, y, selectedText);
            }, 200);
            menuTimeout = null;
          }, 300); // 300ms debounce + 200ms for plugin processing
        } else {
          // Hide menu immediately when selection is cleared
          window.htmlViewer.hideContextMenu();
        }
      });

      // Keep right-click as fallback for text that's already selected
      document.addEventListener('contextmenu', function(event) {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          event.preventDefault(); // Prevent browser context menu
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
      const pluginCSS = plugins
        .map((plugin) => plugin.cssCode)
        .filter(Boolean)
        .join("\n\n");

      // Add custom context menu CSS (horizontal mobile-style)
      const contextMenuCSS = `
        .pocket-context-menu {
          position: fixed;
          z-index: 10000;
          background: rgba(0, 0, 0, 0.9);
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          padding: 0;
          display: flex;
          flex-direction: row;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        
        .pocket-context-menu.dark {
          background: rgba(0, 0, 0, 0.9);
          color: white;
        }
        
        .pocket-menu-items {
          display: flex;
          flex-direction: row;
          margin: 0;
          padding: 0;
        }
        
        .pocket-menu-item {
          padding: 12px 16px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          border: none;
          background: none;
          text-align: center;
          font-size: inherit;
          color: white;
          white-space: nowrap;
          font-weight: 500;
          border-radius: 6px;
          margin: 4px;
        }
        
        .pocket-menu-item:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .pocket-context-menu.dark .pocket-menu-item:hover {
          background-color: rgba(255, 255, 255, 0.15);
        }
        
        .pocket-menu-item:first-child {
          margin-left: 6px;
        }
        
        .pocket-menu-item:last-child {
          margin-right: 6px;
        }
        
        /* Add arrow pointing down to selection */
        .pocket-context-menu::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid rgba(0, 0, 0, 0.9);
        }
      `;

      return pluginCSS + "\n\n" + contextMenuCSS;
    }, [plugins]);

    // Generate combined HTML from all plugins
    const combinedPluginHTML = useMemo(() => {
      const pluginHTML = plugins
        .map((plugin) => plugin.htmlCode)
        .filter(Boolean)
        .join("\n");

      // Add custom context menu HTML
      const contextMenuHTML = `
        <div id="pocket-context-menu" class="pocket-context-menu" style="display: none;">
          <div class="pocket-menu-items" id="pocket-menu-items">
            <!-- Menu items will be injected here -->
          </div>
        </div>
      `;

      return pluginHTML + contextMenuHTML;
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
          if (message.type === "webview-ready") {
            setIsWebViewReady(true);

            // Create a ready plugin context for initialization
            const readyPluginContext: PluginContext = {
              sendCommand: (pluginName: string, commandType: string, payload?: unknown) => {
                if (iframeRef.current?.contentWindow) {
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
              isDarkMode,
              setHeight: (height: number) => {
                setViewerHeight(height);
                if (onContentSizeChange) {
                  onContentSizeChange(height);
                }
              },
              updateMenus: () => {
                setMenuUpdateTrigger((prev) => prev + 1);
              },
            };

            // Initialize all plugins with the ready context
            plugins.forEach((plugin) => {
              plugin.initialize(readyPluginContext);
            });

            if (onLoadComplete) {
              onLoadComplete();
            }
            return;
          }

          if (message.type === "request-menu-items") {
            // Ensure plugins have the correct selection state before getting menu items
            const { selectedText, isHighlighted, highlightId } = message.payload;
            console.log(
              "HTMLViewer.web: Menu requested for text:",
              selectedText,
              "highlighted:",
              isHighlighted,
            );

            // Force update plugin selection state first, then get menu items
            const highlightsPlugin = plugins.find((p) => p.name === "highlights");
            if (highlightsPlugin && selectedText) {
              // Update selection state with detected highlight info
              const tempMessage = {
                pluginName: "highlights",
                type: "selection-changed",
                payload: {
                  text: selectedText,
                  isHighlighted: isHighlighted || false,
                  highlightId: highlightId,
                },
              };
              highlightsPlugin.messageHandler(tempMessage as any, pluginContext);
            }

            // Get fresh menu items directly from all plugins (bypassing memoization)
            const freshMenuItems: { label: string; key: string }[] = [];
            plugins.forEach((plugin) => {
              if (plugin.getMenuItems) {
                const pluginMenuItems = plugin.getMenuItems();
                freshMenuItems.push(...pluginMenuItems);
              }
            });

            console.log("HTMLViewer.web: Sending menu items:", freshMenuItems);

            if (iframeRef.current?.contentWindow) {
              iframeRef.current.contentWindow.postMessage(
                {
                  type: "show-context-menu",
                  payload: {
                    x: message.payload.x,
                    y: message.payload.y,
                    menuItems: freshMenuItems,
                    isDark: isDarkMode,
                  },
                },
                "*",
              );
            }
            return;
          }

          if (message.type === "menu-item-selected") {
            // Handle menu selection just like the mobile version
            handleCustomMenuSelection({
              nativeEvent: {
                key: message.payload.key,
                selectedText: message.payload.selectedText,
              },
            });
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
            display: "block",
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
