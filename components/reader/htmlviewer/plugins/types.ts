export interface HTMLViewerPlugin {
  name: string;
  jsCode: string;
  messageHandler: (message: PluginMessage, context: PluginContext) => void;
  setContext?: (context: PluginContext) => void;
  activate?: () => void; // Called when WebView is ready and plugin can start sending commands
  getMenuItems?: () => { label: string; key: string }[]; // Get context menu items
  handleMenuSelection?: (key: string, selectedText: string) => void; // Handle menu selection
}

export interface PluginContext {
  sendCommand: (pluginName: string, commandType: string, payload?: unknown) => void;
  isDarkMode: boolean;
  // Viewer functions that plugins can call directly
  viewer: {
    setHeight: (height: number) => void;
    getHeight: () => number;
    refresh: () => void;
  };
  updateMenus: () => void; // Request menu update when plugin state changes
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
