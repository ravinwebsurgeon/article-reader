const LOG_PREFIX = "[SyncEngine]";

interface ServerChangesListenerCallbacks {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onMessage?: (message: any) => void;
  onError?: (error: any) => void;
}

/**
 * Handles WebSocket connection to Action Cable for real-time server change notifications.
 * Provides a simple interface for connecting to and listening for server-side changes.
 */
export class ServerChangesListener {
  private webSocket: WebSocket | null = null;
  private token: string | null = null;
  private apiUrl: string;
  private callbacks: ServerChangesListenerCallbacks = {};
  private shouldBeConnected: boolean = false;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private readonly baseReconnectDelay: number = 1000; // 1 second

  constructor(apiUrl: string, token: string | null = null) {
    this.apiUrl = apiUrl;
    this.token = token;
  }

  /**
   * Sets the authentication token
   */
  setToken(token: string | null): void {
    this.token = token;
  }

  /**
   * Starts listening for server changes by establishing WebSocket connection
   */
  connect(callbacks: ServerChangesListenerCallbacks = {}): void {
    if (!this.token) {
      console.warn(`${LOG_PREFIX} Cannot connect: No auth token available`);
      callbacks.onError?.(new Error("No auth token available"));
      return;
    }

    this.callbacks = callbacks;
    this.shouldBeConnected = true;

    // Clear any pending reconnect attempts
    this.clearReconnectTimeout();

    // Close existing connection if any
    this.disconnect();

    try {
      // Create WebSocket URL with auth token - Action Cable is served from root /cable, not versioned
      const wsUrl = this.apiUrl.replace(/^http/, "ws").replace(/\/v4$/, "") + "/cable";

      console.log(`${LOG_PREFIX} Connecting to ${wsUrl}`);

      // Create WebSocket connection with authentication
      // Try query param first, but we might need to switch to headers
      this.webSocket = new WebSocket(`${wsUrl}?token=${this.token}`);

      this.webSocket.onopen = () => {
        console.log(`${LOG_PREFIX} Connected to real-time sync`);
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        this.callbacks.onConnected?.();

        // Subscribe to user-specific sync channel using Action Cable protocol
        const subscribeMessage = {
          command: "subscribe",
          identifier: JSON.stringify({ channel: "SyncChannel" }),
        };

        this.webSocket?.send(JSON.stringify(subscribeMessage));
      };

      this.webSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(
            typeof event.data === "string" ? event.data : String(event.data),
          );

          // Handle different Action Cable message types
          if (message.type === "welcome") {
            // Connection established
          } else if (message.type === "ping") {
            // Keep-alive messages - ignore silently
            return;
          } else if (message.type === "confirm_subscription") {
            console.log(`${LOG_PREFIX} Real-time sync ready`);
          } else if (message.type === "reject_subscription") {
            console.error(`${LOG_PREFIX} Subscription rejected`);
            this.callbacks.onError?.(new Error("Subscription rejected"));
          } else if (message.identifier && message.message !== undefined) {
            // Handle channel messages with identifier (like SyncChannel messages)

            // Check if this is a sync message
            if (typeof message.message === "object" && message.message.type === "sync") {
              const syncMessage = message.message;

              // Filter out our own sync notifications
              if (this.token?.startsWith(syncMessage.source_token_id as string)) {
                console.log(`${LOG_PREFIX} Ignoring own sync`);
                return; // Ignore our own actions
              }

              console.log(`${LOG_PREFIX} Syncing from remote changes`);
              this.callbacks.onMessage?.(syncMessage);
            } else {
              // Handle other channel messages
              this.callbacks.onMessage?.(message.message);
            }
          } else if (message.message !== undefined) {
            this.callbacks.onMessage?.(message.message);
          }
        } catch (parseError) {
          // Handle raw timestamp pings that aren't JSON
          const rawData = event.data;
          if (/^\d+$/.test(rawData as string)) {
            // Raw timestamp ping - ignore silently
            return;
          }
          console.warn(`${LOG_PREFIX} Failed to parse WebSocket message:`, parseError);
          this.callbacks.onError?.(parseError);
        }
      };

      this.webSocket.onclose = (event) => {
        console.log(
          `${LOG_PREFIX} Real-time sync disconnected (code: ${event.code}, clean: ${event.wasClean})`,
        );
        this.callbacks.onDisconnected?.();

        // Only attempt to reconnect if we should be connected and it wasn't a clean close
        if (this.shouldBeConnected && !event.wasClean) {
          console.log(`${LOG_PREFIX} Unexpected disconnect detected, will attempt reconnection`);
          this.scheduleReconnect();
        } else if (this.shouldBeConnected && event.wasClean) {
          console.log(
            `${LOG_PREFIX} Clean disconnect while connected - server may have closed connection`,
          );
        } else {
          console.log(`${LOG_PREFIX} Clean disconnect - no reconnection needed`);
        }
      };

      this.webSocket.onerror = (error) => {
        console.error(`${LOG_PREFIX} WebSocket error:`, error);
        console.log(`${LOG_PREFIX} WebSocket error may trigger reconnection on close`);
        this.callbacks.onError?.(error);
      };
    } catch (error) {
      console.error(`${LOG_PREFIX} Failed to connect:`, error);
      this.callbacks.onError?.(error);
    }
  }

  /**
   * Stops listening and closes the WebSocket connection
   */
  disconnect(): void {
    this.shouldBeConnected = false;
    this.clearReconnectTimeout();

    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`${LOG_PREFIX} Max reconnect attempts reached, giving up`);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(
      `${LOG_PREFIX} Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`,
    );

    this.reconnectTimeoutId = setTimeout(() => {
      if (this.shouldBeConnected) {
        console.log(`${LOG_PREFIX} Attempting to reconnect...`);
        this.connect(this.callbacks);
      }
    }, delay);
  }

  /**
   * Returns true if currently connected
   */
  isConnected(): boolean {
    return this.webSocket?.readyState === WebSocket.OPEN;
  }

  /**
   * Returns true if currently connecting or connected
   */
  isConnectedOrConnecting(): boolean {
    return (
      this.webSocket?.readyState === WebSocket.CONNECTING ||
      this.webSocket?.readyState === WebSocket.OPEN
    );
  }
}
