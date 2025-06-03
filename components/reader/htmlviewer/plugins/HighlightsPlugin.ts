import { HTMLViewerPlugin, PluginContext, PluginMessage } from "./types";

interface HighlightData {
  id: string;
  text: string;
  color: string;
  prefix?: string;
  suffix?: string;
}

export class HighlightsPlugin implements HTMLViewerPlugin {
  name = "highlights";

  private onHighlightAdded?: (
    id: string,
    text: string,
    color: string,
    prefix?: string,
    suffix?: string,
  ) => void;
  private onHighlightRemoved?: (id: string) => void;
  private onSelectionChange?: (text: string) => void;
  private highlights: Map<string, HighlightData> = new Map();
  private isHighlighted: boolean = false;
  private context: PluginContext | null = null;
  private currentHighlightId: string | null = null;

  constructor({
    onHighlightAdded,
    onHighlightRemoved,
    onSelectionChange,
  }: {
    onHighlightAdded?: (
      id: string,
      text: string,
      color: string,
      prefix?: string,
      suffix?: string,
    ) => void;
    onHighlightRemoved?: (id: string) => void;
    onSelectionChange?: (text: string) => void;
  } = {}) {
    this.onHighlightAdded = onHighlightAdded;
    this.onHighlightRemoved = onHighlightRemoved;
    this.onSelectionChange = onSelectionChange;
    console.log("HighlightsPlugin: Initialized");
  }

  // Get current menu items based on selection state
  getMenuItems(): Array<{ label: string; key: string }> {
    console.log("HighlightsPlugin: Getting menu items", {
      isHighlighted: this.isHighlighted,
      currentHighlightId: this.currentHighlightId,
      highlightsCount: this.highlights.size,
    });

    // Base menu items that should always be available
    const baseItems = [
      { label: "Copy", key: "copy" },
      { label: "Share", key: "share" },
      { label: "Select All", key: "selectAll" },
    ];

    // Add highlight-specific items based on state
    if (!this.isHighlighted) {
      const items = [{ label: "Highlight", key: "highlight" }, ...baseItems];
      console.log("HighlightsPlugin: Returning highlight menu items:", items);
      return items;
    }

    const items = [{ label: "Remove Highlight", key: "removeHighlight" }, ...baseItems];
    console.log("HighlightsPlugin: Returning remove highlight menu items:", items);
    return items;
  }

  // Handle menu selection
  handleMenuSelection(key: string, selectedText: string) {
    console.log("HighlightsPlugin: Handling menu selection:", { key, selectedText });
    switch (key) {
      case "highlight":
        if (selectedText) {
          const id = `highlight-${Date.now()}`;
          const color = "#FFFF00"; // Default yellow color
          console.log("HighlightsPlugin: Creating highlight:", { id, text: selectedText, color });

          // Send message via postMessage instead of calling global function
          if (this.context?.injectJavaScript) {
            this.context.injectJavaScript(`
              window.dispatchEvent(new CustomEvent('highlightCommand', {
                detail: {
                  type: 'create-highlight',
                  payload: { id: '${id}', text: '${selectedText.replace(/'/g, "\\'")}', color: '${color}' }
                }
              }));
              true;
            `);
          }
        }
        break;
      case "removeHighlight":
        if (this.currentHighlightId) {
          console.log("HighlightsPlugin: Removing highlight with ID:", this.currentHighlightId);

          // Send message via postMessage instead of calling global function
          if (this.context?.injectJavaScript) {
            this.context.injectJavaScript(`
              window.dispatchEvent(new CustomEvent('highlightCommand', {
                detail: {
                  type: 'remove-highlight',
                  payload: { id: '${this.currentHighlightId}' }
                }
              }));
              true;
            `);
          }

          // Reset current highlight ID
          this.currentHighlightId = null;
        } else {
          console.log("HighlightsPlugin: No current highlight ID found");
        }
        break;
      case "copy":
        // Handle copy action
        console.log("HighlightsPlugin: Copy action requested");
        break;
      case "share":
        // Handle share action
        console.log("HighlightsPlugin: Share action requested");
        break;
      case "selectAll":
        // Handle select all action
        console.log("HighlightsPlugin: Select all action requested");
        break;
    }
  }

  get jsCode(): string {
    return `
      (function() {
        let selectedText = '';
        let isHighlighted = false;
        let currentHighlightId = null;

        // Helper function to get text inside a node
        function getTextInsideNode(node, start, end) {
          if (!node) return '';
          
          if (node.nodeType === 3) { // text node
            return node.data.slice(start || 0, end || node.data.length);
          } else { // DOM node
            return node.textContent ? node.textContent.slice(start || 0, end || node.textContent.length) : '';
          }
        }

        // Helper function to get the first word at anchor position
        function getFirstAnchorWord(node, offset) {
          const text = getTextInsideNode(node);
          if (offset === 0) {
            return text.split(' ')[0];
          }
          
          let spaceOffset = offset;
          while (spaceOffset > 0 && text[spaceOffset] !== ' ') {
            spaceOffset--;
          }
          return text.slice(spaceOffset + 1).split(' ')[0];
        }

        // Helper function to get the last word at focus position
        function getLastFocusWord(node, offset) {
          const text = getTextInsideNode(node);
          if (offset === text.length) {
            return text.split(' ').reverse()[0];
          }
          
          let spaceOffset = offset;
          while (spaceOffset < text.length && text[spaceOffset] !== ' ') {
            spaceOffset++;
          }
          return text.slice(0, spaceOffset).split(' ').reverse()[0];
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
                if (matchCount > 1) return false; // Not unique
              }
              
              index = nodeText.indexOf(text, index + 1);
            }
          }
          
          return matchCount === 1; // Unique if exactly one match
        }

        // Function to extract text with prefix and suffix context using uniqueness checking
        function getTextWithContext(selection) {
          const selectedText = selection.toString().trim();
          if (!selectedText) {
            return { text: '', prefix: undefined, suffix: undefined };
          }
          
          // Step 1: Try with no context
          if (isUniqueInDocument(selectedText, undefined, undefined)) {
            return { text: selectedText, prefix: undefined, suffix: undefined };
          }
          
          // Step 2: Try with 3 words of context
          let prefix = getWordsBefore(selection, 3);
          let suffix = getWordsAfter(selection, 3);
          
          if (isUniqueInDocument(selectedText, prefix, suffix)) {
            return { text: selectedText, prefix, suffix };
          }
          
          // Step 3: Keep adding 1 word at a time until unique (max 10 words each side)
          for (let wordCount = 4; wordCount <= 10; wordCount++) {
            prefix = getWordsBefore(selection, wordCount);
            suffix = getWordsAfter(selection, wordCount);
            
            if (isUniqueInDocument(selectedText, prefix, suffix)) {
              return { text: selectedText, prefix, suffix };
            }
          }
          
          // Fallback: return what we have (even if not unique)
          return { text: selectedText, prefix, suffix };
        }

        // Track selection changes
        document.addEventListener('selectionchange', function() {
          const selection = window.getSelection();
          const text = selection ? selection.toString().trim() : '';
          
          if (text === selectedText) return;
          
          selectedText = text;
          isHighlighted = false;
          currentHighlightId = null;
          
          // Check if selection is within a highlight
          if (text && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const element = range.commonAncestorContainer.nodeType === 1 
              ? range.commonAncestorContainer 
              : range.commonAncestorContainer.parentElement;
              
            if (element && element.classList.contains('text-highlight')) {
              isHighlighted = true;
              currentHighlightId = element.id;
            }
          }
          
          window.htmlViewer.postMessage({
            pluginName: 'highlights',
            type: 'selection-changed',
            payload: { text, isHighlighted, currentHighlightId }
          });
        });

        // Listen for commands
        window.addEventListener('highlightCommand', function(event) {
          const { type, payload } = event.detail;
          
          if (type === 'create-highlight') {
            const selection = window.getSelection();
            if (!selection.toString()) return;
            
            try {
              const range = selection.getRangeAt(0);
              const textWithContext = getTextWithContext(selection);
              
              const highlight = document.createElement('span');
              highlight.id = payload.id;
              highlight.className = 'text-highlight';
              highlight.style.backgroundColor = payload.color;
              highlight.setAttribute('role', 'mark');
              
              // Store context data as attributes for later retrieval
              if (textWithContext.prefix) {
                highlight.setAttribute('data-prefix', textWithContext.prefix);
              }
              if (textWithContext.suffix) {
                highlight.setAttribute('data-suffix', textWithContext.suffix);
              }
              
              range.surroundContents(highlight);
              
              window.htmlViewer.postMessage({
                pluginName: 'highlights',
                type: 'highlight-added',
                payload: {
                  ...payload,
                  text: textWithContext.text,
                  prefix: textWithContext.prefix,
                  suffix: textWithContext.suffix
                }
              });
            } catch (error) {
              console.error('Error creating highlight:', error);
            }
          }
          
          else if (type === 'remove-highlight') {
            const element = document.getElementById(payload.id);
            if (element) {
              const parent = element.parentNode;
              parent.replaceChild(document.createTextNode(element.textContent), element);
              parent.normalize();
              
              window.htmlViewer.postMessage({
                pluginName: 'highlights',
                type: 'highlight-removed',
                payload
              });
            }
          }
          
          else if (type === 'restore-highlight') {
            // Find text using context-aware matching
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            let node;
            let found = false;
            
            while (node = walker.nextNode() && !found) {
              const text = node.textContent;
              let index = text.indexOf(payload.text);
              
              // If we have prefix/suffix, use them for better matching
              if (index !== -1) {
                let isValidMatch = true;
                
                // Check prefix context if provided (multi-word support)
                if (payload.prefix && index > 0) {
                  const beforeText = text.substring(0, index).trim();
                  const beforeWords = beforeText.split(' ').filter(word => word.length > 0);
                  const prefixWords = payload.prefix.split(' ').filter(word => word.length > 0);
                  
                  if (beforeWords.length < prefixWords.length) {
                    isValidMatch = false;
                  } else {
                    const beforeSuffix = beforeWords.slice(-prefixWords.length).join(' ');
                    if (beforeSuffix !== payload.prefix) {
                      isValidMatch = false;
                    }
                  }
                }
                
                // Check suffix context if provided (multi-word support)
                if (payload.suffix && isValidMatch) {
                  const afterIndex = index + payload.text.length;
                  const afterText = text.substring(afterIndex).trim();
                  const afterWords = afterText.split(' ').filter(word => word.length > 0);
                  const suffixWords = payload.suffix.split(' ').filter(word => word.length > 0);
                  
                  if (afterWords.length < suffixWords.length) {
                    isValidMatch = false;
                  } else {
                    const afterPrefix = afterWords.slice(0, suffixWords.length).join(' ');
                    if (afterPrefix !== payload.suffix) {
                      isValidMatch = false;
                    }
                  }
                }
                
                if (isValidMatch) {
                  const range = document.createRange();
                  range.setStart(node, index);
                  range.setEnd(node, index + payload.text.length);
                  
                  const highlight = document.createElement('span');
                  highlight.id = payload.id;
                  highlight.className = 'text-highlight';
                  highlight.style.backgroundColor = payload.color;
                  highlight.setAttribute('role', 'mark');
                  
                  if (payload.prefix) {
                    highlight.setAttribute('data-prefix', payload.prefix);
                  }
                  if (payload.suffix) {
                    highlight.setAttribute('data-suffix', payload.suffix);
                  }
                  
                  try {
                    range.surroundContents(highlight);
                    found = true;
                  } catch (error) {
                    console.error('Error restoring highlight:', error);
                  }
                }
              }
            }
          }
        });
      })();
    `;
  }

  messageHandler = (message: PluginMessage, context: PluginContext) => {
    // Store context for later use
    this.context = context;

    console.log("HighlightsPlugin: Handling message:", message);
    switch (message.type) {
      case "selection-changed":
        if (this.onSelectionChange && message.payload?.text) {
          this.isHighlighted = message.payload.isHighlighted;
          this.currentHighlightId = message.payload.currentHighlightId || null;
          console.log("HighlightsPlugin: Selection changed:", {
            text: message.payload.text,
            isHighlighted: this.isHighlighted,
            currentHighlightId: this.currentHighlightId,
          });
          this.onSelectionChange(message.payload.text);
        }
        break;
      case "highlight-added":
        if (this.onHighlightAdded && message.payload?.id && message.payload?.text) {
          const { id, text, color, prefix, suffix } = message.payload;
          this.highlights.set(id, { id, text, color, prefix, suffix });
          console.log("HighlightsPlugin: Highlight added:", { id, text, color, prefix, suffix });
          this.onHighlightAdded(id, text, color || "#FFFF00", prefix, suffix);
        }
        break;
      case "highlight-removed":
        if (this.onHighlightRemoved && message.payload?.id) {
          const id = message.payload.id;
          this.highlights.delete(id);
          console.log("HighlightsPlugin: Highlight removed:", id);
          this.onHighlightRemoved(id);
        }
        break;
    }
  };
}
