export interface HTMLViewerPlugin {
  name: string;
  jsCode: string;
  cssCode?: string; // New: plugins can provide CSS
  htmlCode?: string; // New: plugins can provide HTML (for future extensibility)
  messageHandler: (message: PluginMessage, context: PluginContext) => void;
  initialize: (context: PluginContext) => void; // Much clearer than "activate"
  getMenuItems?: () => { label: string; key: string }[]; // Get context menu items
  handleMenuSelection?: (key: string, selectedText: string) => void; // Handle menu selection
}

export interface PluginContext {
  sendCommand: (pluginName: string, commandType: string, payload?: unknown) => void;
  isDarkMode: boolean;
  setHeight: (height: number) => void;
  updateMenus: () => void;
}

export interface PluginMessage {
  type: string;
  pluginName: string;
  payload?: unknown;
}

export interface AutoResizeMessage extends PluginMessage {
  pluginName: "auto-resize";
  type: "height-changed";
  payload: {
    height: number;
  };
}

export interface HighlightMessage extends PluginMessage {
  pluginName: "highlights";
  type: "selection-changed" | "highlight-created";
  payload: {
    id?: string;
    text?: string;
    isHighlighted?: boolean;
    prefix?: string;
    suffix?: string;
    highlightId?: string;
  };
}
