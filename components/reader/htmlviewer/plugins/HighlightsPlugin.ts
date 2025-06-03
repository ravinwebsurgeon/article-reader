import { HTMLViewerPlugin, PluginContext, PluginMessage } from "./types";

export class HighlightsPlugin implements HTMLViewerPlugin {
  name = "highlights";

  private onHighlightAdded?: (id: string, text: string, color: string) => void;
  private onHighlightRemoved?: (id: string) => void;
  private onSelectionChange?: (text: string) => void;

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
  }

  get jsCode(): string {
    return `
      (function() {
        // Basic highlight functionality - will be expanded later
        let selectedText = '';
        let isHighlighted = false;

        // Track text selection
        document.addEventListener('selectionchange', function() {
          const selection = window.getSelection();
          const text = selection ? selection.toString().trim() : '';
          
          if (text !== selectedText) {
            selectedText = text;
            window.htmlViewer.postMessage({
              pluginName: 'highlights',
              type: 'selection-changed',
              payload: { text, isHighlighted: false }
            });
          }
        });

        // Basic highlight creation (placeholder)
        window.createHighlight = function(id, text, color) {
          // Implementation will be added later
          console.log('Creating highlight:', id, text, color);
        };

        // Basic highlight removal (placeholder)
        window.removeHighlight = function(id) {
          // Implementation will be added later
          console.log('Removing highlight:', id);
        };

        // Restore highlights (placeholder)
        window.restoreHighlight = function(id, text, prefix, suffix, color) {
          // Implementation will be added later
          console.log('Restoring highlight:', id, text, color);
        };

      })();
    `;
  }

  messageHandler = (message: PluginMessage, context: PluginContext) => {
    switch (message.type) {
      case "selection-changed":
        if (this.onSelectionChange && message.payload?.text) {
          this.onSelectionChange(message.payload.text);
        }
        break;
      case "highlight-added":
        if (this.onHighlightAdded && message.payload?.id && message.payload?.text) {
          this.onHighlightAdded(
            message.payload.id,
            message.payload.text,
            message.payload.color || "#FFFF00",
          );
        }
        break;
      case "highlight-removed":
        if (this.onHighlightRemoved && message.payload?.id) {
          this.onHighlightRemoved(message.payload.id);
        }
        break;
    }
  };
}
