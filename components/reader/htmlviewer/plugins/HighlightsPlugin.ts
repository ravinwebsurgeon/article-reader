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

    // Start selection monitoring
    if (this.context?.sendCommand) {
      this.context.sendCommand(this.name, "start-monitoring");
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
      // Simple full re-render - blow away and rebuild everything
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

        // Function to unwrap highlight elements (restore original content)
        function unwrapHighlights() {
          const highlights = document.querySelectorAll('.pocket-highlight');
          highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            if (parent) {
              // Move all child nodes before the highlight element
              while (highlight.firstChild) {
                parent.insertBefore(highlight.firstChild, highlight);
              }
              // Remove the now-empty highlight element
              parent.removeChild(highlight);
            }
          });
          
          // Normalize text nodes after unwrapping
          document.normalize();
        }

        // Function to create a highlight from current selection
        function createHighlight(text, prefix, suffix) {
          const selection = window.getSelection();
          if (!selection || selection.isCollapsed) return;
          
          // Just send message to React - no DOM changes
          // Let the database round-trip and re-render handle everything
          window.htmlViewer.postMessage({
            pluginName: 'highlights',
            type: 'highlight-created',
            payload: {
              text,
              prefix,
              suffix
            }
          });
          
          // Clear selection after creating highlight
          selection.removeAllRanges();
          
          // Trigger selection change to update menu
          checkSelectionChange();
        }

        // Function to remove a specific highlight
        function removeHighlight(highlightId) {
          const highlight = document.querySelector(\`[data-highlight-id="\${highlightId}"]\`);
          if (highlight) {
            const parent = highlight.parentNode;
            if (parent) {
              // Move all child nodes before the highlight element
              while (highlight.firstChild) {
                parent.insertBefore(highlight.firstChild, highlight);
              }
              // Remove the now-empty highlight element
              parent.removeChild(highlight);
              
              // Normalize text nodes
              parent.normalize();
            }
          }
        }

        // Function to find text in document with context matching
        function findTextWithContext(text, prefix, suffix) {
          const results = [];
          
          // Create a walker to traverse all text nodes
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );
          
          // Get all text content first
          const allText = document.body.textContent || '';
          
          // Find all occurrences of the target text
          let searchIndex = 0;
          while (true) {
            const textIndex = allText.indexOf(text, searchIndex);
            if (textIndex === -1) break;
            
            // Check context if provided
            let isValidMatch = true;
            
            if (prefix) {
              const beforeText = allText.substring(0, textIndex);
              const beforeWords = beforeText.trim().split(/\\s+/).filter(w => w.length > 0);
              const prefixWords = prefix.trim().split(/\\s+/).filter(w => w.length > 0);
              
              if (beforeWords.length >= prefixWords.length) {
                const contextWords = beforeWords.slice(-prefixWords.length);
                if (contextWords.join(' ') !== prefixWords.join(' ')) {
                  isValidMatch = false;
                }
              } else {
                isValidMatch = false;
              }
            }
            
            if (suffix && isValidMatch) {
              const afterIndex = textIndex + text.length;
              const afterText = allText.substring(afterIndex);
              const afterWords = afterText.trim().split(/\\s+/).filter(w => w.length > 0);
              const suffixWords = suffix.trim().split(/\\s+/).filter(w => w.length > 0);
              
              if (afterWords.length >= suffixWords.length) {
                const contextWords = afterWords.slice(0, suffixWords.length);
                if (contextWords.join(' ') !== suffixWords.join(' ')) {
                  isValidMatch = false;
                }
              } else {
                isValidMatch = false;
              }
            }
            
            if (isValidMatch) {
              // Find the actual DOM position for this text index
              const position = findDOMPositionForTextIndex(textIndex, text.length);
              if (position) {
                results.push(position);
              }
            }
            
            searchIndex = textIndex + 1;
          }
          
          return results;
        }
        
        // Function to find DOM position for a text index in the document
        function findDOMPositionForTextIndex(textIndex, textLength) {
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
          );
          
          let currentIndex = 0;
          let node;
          
          while (node = walker.nextNode()) {
            const nodeText = node.textContent || '';
            const nodeStart = currentIndex;
            const nodeEnd = currentIndex + nodeText.length;
            
            // Check if our target text starts within this node
            if (textIndex >= nodeStart && textIndex < nodeEnd) {
              const startOffset = textIndex - nodeStart;
              const endOffset = Math.min(startOffset + textLength, nodeText.length);
              
              // Check if the text is entirely within this node
              if (textIndex + textLength <= nodeEnd) {
                return {
                  startNode: node,
                  startOffset: startOffset,
                  endNode: node,
                  endOffset: endOffset
                };
              } else {
                // Text spans multiple nodes - find the end node
                let remainingLength = textLength - (nodeText.length - startOffset);
                let endNode = node;
                let endOffset = nodeText.length;
                
                while (remainingLength > 0 && (endNode = walker.nextNode())) {
                  const endNodeText = endNode.textContent || '';
                  if (remainingLength <= endNodeText.length) {
                    endOffset = remainingLength;
                    break;
                  } else {
                    remainingLength -= endNodeText.length;
                    endOffset = endNodeText.length;
                  }
                }
                
                return {
                  startNode: node,
                  startOffset: startOffset,
                  endNode: endNode,
                  endOffset: endOffset
                };
              }
            }
            
            currentIndex = nodeEnd;
          }
          
          return null;
        }

        // Function to apply highlights from database
        function applyHighlights(highlights) {
          console.log('Applying highlights:', highlights.length);
          
          // First, unwrap all existing highlights
          unwrapHighlights();
          
          // Apply each highlight
          highlights.forEach((highlight, index) => {
            console.log(\`Applying highlight \${index + 1}:\`, highlight);
            
            const { text, prefix, suffix, id } = highlight;
            
            // Find positions for this text
            const positions = findTextWithContext(text, prefix, suffix);
            console.log(\`Found \${positions.length} positions for highlight\`, text);
            
            // Apply highlight to the first valid position
            if (positions.length > 0) {
              const position = positions[0];
              try {
                const range = document.createRange();
                range.setStart(position.startNode, position.startOffset);
                range.setEnd(position.endNode, position.endOffset);
                
                const highlightElement = document.createElement('span');
                highlightElement.className = 'pocket-highlight';
                highlightElement.dataset.highlightId = id;
                
                // Use different approach based on whether text spans multiple nodes
                if (position.startNode === position.endNode) {
                  // Simple case - text is in single node
                  range.surroundContents(highlightElement);
                } else {
                  // Complex case - text spans multiple nodes
                  const contents = range.extractContents();
                  highlightElement.appendChild(contents);
                  range.insertNode(highlightElement);
                }
                
                console.log('Successfully applied highlight for:', text);
              } catch (error) {
                console.error('Error applying highlight for text:', text, error);
              }
            } else {
              console.warn('No valid position found for highlight:', text);
            }
          });
        }

        // Track selection changes
        let lastSelectionText = '';

        function checkSelectionChange() {
          const selection = window.getSelection();
          const currentText = selection ? selection.toString().trim() : '';
          
          if (currentText !== lastSelectionText) {
            lastSelectionText = currentText;
            
            // Get selection context if there's text selected
            let selectionData = null;
            if (currentText) {
              const context = getSelectionContext();
              if (context) {
                selectionData = {
                  text: context.text,
                  prefix: context.prefix,
                  suffix: context.suffix,
                  isHighlighted: false
                };
                
                // Check if this text is already highlighted
                if (selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  let container = range.commonAncestorContainer;
                  
                  // Walk up to find if we're inside a highlight
                  while (container && container !== document.body) {
                    if (container.nodeType === 1 && container.classList && container.classList.contains('pocket-highlight')) {
                      selectionData.isHighlighted = true;
                      selectionData.highlightId = container.dataset.highlightId;
                      break;
                    }
                    container = container.parentNode;
                  }
                }
              }
            }
            
            // Send selection change to React
            window.htmlViewer.postMessage({
              pluginName: 'highlights',
              type: 'selection-changed',
              payload: selectionData
            });
          }
        }

        // Start monitoring selection changes
        function startSelectionMonitoring() {
          document.addEventListener('selectionchange', checkSelectionChange);
        }

        // Stop monitoring (cleanup)
        function stopSelectionMonitoring() {
          document.removeEventListener('selectionchange', checkSelectionChange);
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
              
            case 'start-monitoring':
              startSelectionMonitoring();
              break;
          }
        });

        // Start monitoring when script loads
        startSelectionMonitoring();

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
    if (message.pluginName !== "highlights") return;

    switch (message.type) {
      case "selection-changed":
        // Update current selection state
        if (message.payload) {
          this.currentSelection = {
            text: (message.payload as any).text || "",
            isHighlighted: (message.payload as any).isHighlighted || false,
            highlightId: (message.payload as any).highlightId, // This will be the database ULID
          };
        } else {
          // No selection
          this.currentSelection = { text: "", isHighlighted: false };
        }

        // Trigger menu update
        context.updateMenus();
        break;

      case "highlight-created":
        // Don't update selection state here - let the database update flow handle it
        // The database will create annotation with ULID, trigger HOC update, and re-render all highlights
        const highlightMessage = message as HighlightMessage;
        if (highlightMessage.payload) {
          const { text, prefix, suffix } = highlightMessage.payload;
          if (typeof text === "string") {
            if (this.callbacks.onHighlightAdded) {
              this.callbacks.onHighlightAdded(
                text,
                prefix as string | undefined,
                suffix as string | undefined,
              );
            }
          }
        }
        break;
    }
  };
}
