import Item from "@/database/models/ItemModel";

export interface HTMLViewerPlugin {
  name: string;
  jsCode: string;
  messageHandler: (message: PluginMessage, context: PluginContext) => void;
}

export interface PluginContext {
  injectJavaScript: (script: string) => void;
  sendCommand?: (pluginName: string, commandType: string, payload?: any) => void;
  item: Item | null;
  isDarkMode: boolean;
  onUpdate: (data: any) => void;
  // Viewer functions that plugins can call directly
  viewer: {
    setHeight: (height: number) => void;
    getHeight: () => number;
    refresh: () => void;
  };
}

export interface PluginMessage {
  type: string;
  pluginName: string;
  payload?: any;
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
  type: "highlight-added" | "highlight-removed" | "selection-changed" | "highlight-clicked";
  payload: {
    id?: string;
    text?: string;
    color?: string;
    range?: any;
    isHighlighted?: boolean;
  };
}
