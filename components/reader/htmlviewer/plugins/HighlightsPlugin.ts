import { HTMLViewerPlugin, PluginContext, PluginMessage } from "./types";

interface HighlightData {
  id: string;
  text: string;
  color: string;
}

export class HighlightsPlugin implements HTMLViewerPlugin {
  name = "highlights";

  private onHighlightAdded?: (id: string, text: string, color: string) => void;
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
    onHighlightAdded?: (id: string, text: string, color: string) => void;
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
              const highlight = document.createElement('span');
              highlight.id = payload.id;
              highlight.className = 'text-highlight';
              highlight.style.backgroundColor = payload.color;
              highlight.setAttribute('role', 'mark');
              
              range.surroundContents(highlight);
              
              window.htmlViewer.postMessage({
                pluginName: 'highlights',
                type: 'highlight-added',
                payload
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
            // Find text and highlight it
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            let node;
            while (node = walker.nextNode()) {
              const index = node.textContent.indexOf(payload.text);
              if (index !== -1) {
                const range = document.createRange();
                range.setStart(node, index);
                range.setEnd(node, index + payload.text.length);
                
                const highlight = document.createElement('span');
                highlight.id = payload.id;
                highlight.className = 'text-highlight';
                highlight.style.backgroundColor = payload.color;
                highlight.setAttribute('role', 'mark');
                
                try {
                  range.surroundContents(highlight);
                  break;
                } catch (error) {
                  console.error('Error restoring highlight:', error);
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
          const { id, text, color } = message.payload;
          this.highlights.set(id, { id, text, color });
          console.log("HighlightsPlugin: Highlight added:", { id, text, color });
          this.onHighlightAdded(id, text, color || "#FFFF00");
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
