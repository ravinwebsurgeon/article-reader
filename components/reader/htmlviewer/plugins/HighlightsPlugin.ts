import { HTMLViewerPlugin, PluginContext, PluginMessage, HighlightMessage } from "./types";
import { HighlightData } from "@/database/hooks/withAnnotations";

export interface HighlightsPluginCallbacks {
  onHighlightAdded?: (text: string, prefix?: string, suffix?: string) => void;
  onHighlightRemoved?: (highlightId: string) => void;
}

export class HighlightsPlugin implements HTMLViewerPlugin {
  name = "highlights";

  private callbacks: HighlightsPluginCallbacks;
  private context: PluginContext | null = null;
  private currentSelection: {
    text: string;
    isHighlighted: boolean;
    highlightId?: string;
  } = { text: "", isHighlighted: false };
  private currentHighlights: HighlightData[] = [];
  private isActivated: boolean = false;

  constructor(callbacks: HighlightsPluginCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /**
   * Set the plugin context (called by HTMLViewer when WebView is ready)
   */
  setContext(context: PluginContext) {
    this.context = context;
  }

  /**
   * Activate the plugin (called by HTMLViewer when WebView is ready and plugin can start sending commands)
   */
  activate() {
    this.isActivated = true;

    // Send any stored highlights to the WebView now that we're activated
    if (this.currentHighlights.length > 0 && this.context?.sendCommand) {
      this.context.sendCommand(this.name, "set-highlights", { highlights: this.currentHighlights });
    }
  }

  /**
   * Update the highlights to render (called by parent when database changes)
   */
  setHighlights(highlights: HighlightData[]) {
    // Always store the current highlights
    this.currentHighlights = highlights;

    // Only send to WebView if plugin is activated
    if (this.isActivated && this.context?.sendCommand) {
      this.context.sendCommand(this.name, "set-highlights", { highlights });
    }
  }

  // Get current menu items based on selection state
  getMenuItems(): { label: string; key: string }[] {
    // Base menu items that should always be available
    const baseItems = [
      { label: "Copy", key: "copy" },
      { label: "Share", key: "share" },
      { label: "Select All", key: "selectAll" },
    ];

    // Add highlight-specific items based on state
    if (!this.currentSelection.isHighlighted && this.currentSelection.text) {
      return [{ label: "Highlight", key: "highlight" }, ...baseItems];
    }

    if (this.currentSelection.isHighlighted && this.currentSelection.highlightId) {
      return [{ label: "Remove Highlight", key: "removeHighlight" }, ...baseItems];
    }

    return baseItems;
  }

  // Handle menu selection
  handleMenuSelection(key: string, selectedText: string) {
    switch (key) {
      case "highlight":
        // Send command to get selection context and create highlight
        if (this.context?.sendCommand) {
          this.context.sendCommand(this.name, "create-highlight-from-selection");
        }
        break;

      case "removeHighlight":
        if (this.currentSelection.highlightId && this.callbacks.onHighlightRemoved) {
          this.callbacks.onHighlightRemoved(this.currentSelection.highlightId);
        }
        break;

      case "copy":
      case "share":
      case "selectAll":
        // These actions are handled by the system
        break;
    }
  }

  get jsCode(): string {
    return `
      (function() {
        // Helper function to get text inside a node
        function getTextInsideNode(node, start, end) {
          if (!node) return '';
          
          if (node.nodeType === 3) { // text node
            return node.data.slice(start ?? 0, end ?? node.data.length);
          } else { // DOM node
            return node.textContent ? node.textContent.slice(start ?? 0, end ?? node.textContent.length) : '';
          }
        }

        // Function to get words before selection
        function getWordsBefore(selection, wordCount) {
          if (wordCount === 0) return undefined;
          
          const { anchorNode, anchorOffset } = selection;
          if (!anchorNode) return undefined;
          
          const fullText = getTextInsideNode(anchorNode);
          const beforeText = fullText.substring(0, anchorOffset).trim();
          
          if (!beforeText) return undefined;
          
          const beforeWords = beforeText.split(' ').filter(word => word.length > 0);
          if (beforeWords.length === 0) return undefined;
          
          const startIndex = Math.max(0, beforeWords.length - wordCount);
          return beforeWords.slice(startIndex).join(' ');
        }

        // Function to get words after selection
        function getWordsAfter(selection, wordCount) {
          if (wordCount === 0) return undefined;
          
          const { focusNode, focusOffset } = selection;
          if (!focusNode) return undefined;
          
          const fullText = getTextInsideNode(focusNode);
          const afterText = fullText.substring(focusOffset).trim();
          
          if (!afterText) return undefined;
          
          const afterWords = afterText.split(' ').filter(word => word.length > 0);
          if (afterWords.length === 0) return undefined;
          
          const endIndex = Math.min(afterWords.length, wordCount);
          return afterWords.slice(0, endIndex).join(' ');
        }

        // Function to test if a text/prefix/suffix combination is unique in the document
        function isUniqueInDocument(text, prefix, suffix) {
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let matchCount = 0;
          let node;
          
          while (node = walker.nextNode()) {
            const nodeText = node.textContent;
            let index = nodeText.indexOf(text);
            
            while (index !== -1) {
              let isValidMatch = true;
              
              // Check prefix context if provided
              if (prefix && index > 0) {
                const beforeText = nodeText.substring(0, index).trim();
                const beforeWords = beforeText.split(' ').filter(word => word.length > 0);
                const prefixWords = prefix.split(' ').filter(word => word.length > 0);
                
                if (beforeWords.length < prefixWords.length) {
                  isValidMatch = false;
                } else {
                  const beforeSuffix = beforeWords.slice(-prefixWords.length).join(' ');
                  if (beforeSuffix !== prefix) {
                    isValidMatch = false;
                  }
                }
              }
              
              // Check suffix context if provided
              if (suffix && isValidMatch) {
                const afterIndex = index + text.length;
                const afterText = nodeText.substring(afterIndex).trim();
                const afterWords = afterText.split(' ').filter(word => word.length > 0);
                const suffixWords = suffix.split(' ').filter(word => word.length > 0);
                
                if (afterWords.length < suffixWords.length) {
                  isValidMatch = false;
                } else {
                  const afterPrefix = afterWords.slice(0, suffixWords.length).join(' ');
                  if (afterPrefix !== suffix) {
                    isValidMatch = false;
                  }
                }
              }
              
              if (isValidMatch) {
                matchCount++;
                if (matchCount > 1) return false;
              }
              
              index = nodeText.indexOf(text, index + 1);
            }
          }
          
          return matchCount === 1;
        }

        // Function to get selection context
        function getSelectionContext() {
          const selection = window.getSelection();
          if (!selection || selection.isCollapsed) return null;
          
          const text = selection.toString().trim();
          if (!text) return null;
          
          // Get context words
          const prefix = getWordsBefore(selection, 3);
          const suffix = getWordsAfter(selection, 3);
          
          // Test if this combination is unique
          if (isUniqueInDocument(text, prefix, suffix)) {
            return { text, prefix, suffix };
          }
          
          // If not unique, try with more context
          const prefix2 = getWordsBefore(selection, 5);
          const suffix2 = getWordsAfter(selection, 5);
          
          if (isUniqueInDocument(text, prefix2, suffix2)) {
            return { text, prefix: prefix2, suffix: suffix2 };
          }
          
          // If still not unique, try with even more context
          const prefix3 = getWordsBefore(selection, 7);
          const suffix3 = getWordsAfter(selection, 7);
          
          if (isUniqueInDocument(text, prefix3, suffix3)) {
            return { text, prefix: prefix3, suffix: suffix3 };
          }
          
          // If still not unique, return just the text
          return { text };
        }

        // Function to create a highlight
        function createHighlight(text, prefix, suffix) {
          const selection = window.getSelection();
          if (!selection || selection.isCollapsed) return;
          
          // Create highlight element
          const highlight = document.createElement('span');
          highlight.className = 'pocket-highlight';
          highlight.dataset.highlightId = Date.now().toString();
          
          // Wrap selection in highlight
          const range = selection.getRangeAt(0);
          range.surroundContents(highlight);
          
          // Send message to React
          window.htmlViewer.postMessage({
            pluginName: 'highlights',
            type: 'highlight-created',
            payload: {
              text,
              prefix,
              suffix,
              highlightId: highlight.dataset.highlightId
            }
          });
        }

        // Function to remove a highlight
        function removeHighlight(highlightId) {
          const highlight = document.querySelector(\`[data-highlight-id="\${highlightId}"]\`);
          if (highlight) {
            const parent = highlight.parentNode;
            if (parent) {
              while (highlight.firstChild) {
                parent.insertBefore(highlight.firstChild, highlight);
              }
              parent.removeChild(highlight);
            }
          }
        }

        // Function to apply highlights
        function applyHighlights(highlights) {
          // Remove existing highlights
          document.querySelectorAll('.pocket-highlight').forEach(el => el.remove());
          
          // Apply new highlights
          highlights.forEach(highlight => {
            const { text, prefix, suffix } = highlight;
            
            // Find text in document
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            let node;
            
            while (node = walker.nextNode()) {
              const nodeText = node.textContent;
              let index = nodeText.indexOf(text);
              
              while (index !== -1) {
                let isValidMatch = true;
                
                // Check prefix context if provided
                if (prefix && index > 0) {
                  const beforeText = nodeText.substring(0, index).trim();
                  const beforeWords = beforeText.split(' ').filter(word => word.length > 0);
                  const prefixWords = prefix.split(' ').filter(word => word.length > 0);
                  
                  if (beforeWords.length < prefixWords.length) {
                    isValidMatch = false;
                  } else {
                    const beforeSuffix = beforeWords.slice(-prefixWords.length).join(' ');
                    if (beforeSuffix !== prefix) {
                      isValidMatch = false;
                    }
                  }
                }
                
                // Check suffix context if provided
                if (suffix && isValidMatch) {
                  const afterIndex = index + text.length;
                  const afterText = nodeText.substring(afterIndex).trim();
                  const afterWords = afterText.split(' ').filter(word => word.length > 0);
                  const suffixWords = suffix.split(' ').filter(word => word.length > 0);
                  
                  if (afterWords.length < suffixWords.length) {
                    isValidMatch = false;
                  } else {
                    const afterPrefix = afterWords.slice(0, suffixWords.length).join(' ');
                    if (afterPrefix !== suffix) {
                      isValidMatch = false;
                    }
                  }
                }
                
                if (isValidMatch) {
                  // Create highlight element
                  const highlight = document.createElement('span');
                  highlight.className = 'pocket-highlight';
                  highlight.dataset.highlightId = highlight.id;
                  
                  // Split text node and wrap selection
                  const range = document.createRange();
                  range.setStart(node, index);
                  range.setEnd(node, index + text.length);
                  range.surroundContents(highlight);
                  
                  // Update node reference for next iteration
                  node = highlight.nextSibling;
                  break;
                }
                
                index = nodeText.indexOf(text, index + 1);
              }
            }
          });
        }

        // Listen for commands from React
        window.addEventListener('highlightsCommand', function(event) {
          const { type, payload } = event.detail;
          
          switch (type) {
            case 'set-highlights':
              applyHighlights(payload.highlights);
              break;
              
            case 'create-highlight-from-selection':
              const context = getSelectionContext();
              if (context) {
                createHighlight(context.text, context.prefix, context.suffix);
              }
              break;
          }
        });

        // Add styles
        const style = document.createElement('style');
        style.textContent = \`
          .pocket-highlight {
            background-color: rgba(255, 255, 0, 0.3);
            border-radius: 2px;
          }
        \`;
        document.head.appendChild(style);
      })();
    `;
  }

  messageHandler = (message: PluginMessage, context: PluginContext) => {
    if (message.type === "highlight-created" && message.pluginName === "highlights") {
      const highlightMessage = message as HighlightMessage;
      if (highlightMessage.payload) {
        const { text, prefix, suffix, id: highlightId } = highlightMessage.payload;
        if (typeof text === "string" && typeof highlightId === "string") {
          this.currentSelection = {
            text,
            isHighlighted: true,
            highlightId,
          };
          if (this.callbacks.onHighlightAdded) {
            this.callbacks.onHighlightAdded(
              text,
              prefix as string | undefined,
              suffix as string | undefined,
            );
          }
        }
      }
    }
  };
}
