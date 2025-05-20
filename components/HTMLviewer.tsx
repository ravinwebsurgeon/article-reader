import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { StyleSheet, Platform } from "react-native";
import WebView from "react-native-webview";
import * as Clipboard from "expo-clipboard";
import { ThemeView } from "./primitives";

interface HTMLViewerProps {
  html: string;
  baseUrl?: string;
  style?: object;
  onHighlightAdded?: (id: any, text: string, color: string) => void;
  onHighlightRemoved?: (id: any) => void;
  onSelectionChange?: (selectedText: string) => void;
  onShare?: (text: string) => void;
  onScroll?: (event: any) => void;
  onContentSizeChange?: (width: number, height: number) => void;
  onLayout?: (event: any) => void;
  setContentHeight?: (height: number) => void;
  setScrollViewHeight?: (height: number) => void;
  handleScroll?: (event: any) => void;
}

interface HighlightData {
  id: string;
  text: string;
  color: string;
}

const HTMLViewer: React.FC<HTMLViewerProps> = React.memo(
  ({
    html,
    baseUrl,
    style,
    onHighlightAdded,
    onHighlightRemoved,
    onSelectionChange,
    onShare,
    onScroll,
    onContentSizeChange,
    onLayout,
    setContentHeight,
    setScrollViewHeight,
    handleScroll,
  }) => {
    const webViewRef = useRef<WebView>(null);
    const [selectedText, setSelectedText] = useState<string>("");
    const [highlights, setHighlights] = useState<HighlightData[]>([]);
    const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
    const [webViewHeight, setWebViewHeight] = useState<number>(300); // Start with a default height

    // Debounce height changes to prevent rapid re-renders
    const debouncedSetHeight = useCallback(
      (height: number) => {
        if (Math.abs(height - webViewHeight) > 10) {
          // Only update if significant change
          setWebViewHeight(height);
          if (setContentHeight) {
            setContentHeight(height);
          }
        }
      },
      [webViewHeight, setContentHeight],
    );

    // Cache the injected JavaScript to prevent unnecessary re-creation
    const injectedJavaScript = useMemo(
      () => `
    (function() {
      // Only add styles if they don't exist yet
      if (!document.getElementById('literata-styles')) {
        const style = document.createElement('style');
        style.id = 'literata-styles';
        style.textContent = \`
          @font-face {
            font-family: 'Literata';
            src: url('https://fonts.gstatic.com/s/literata/v30/or3PQ6P12-iJxAIgLa78DkrbXsDgk0oVDaDPYLanFLHpPf2TbBG_J_zWTFUPx1j.woff2') format('woff2');
            font-weight: normal;
            font-style: normal;
          }
          @font-face {
            font-family: 'Literata';
            src: url('https://fonts.gstatic.com/s/literata/v30/or3PQ6P12-iJxAIgLa78DkrbXsDgk0oVDaDPYLanFLHpPf2TbBG_J__WTFUPx1j.woff2') format('woff2');
            font-weight: bold;
            font-style: normal;
          }
          @font-face {
            font-family: 'Literata';
            src: url('https://fonts.gstatic.com/s/literata/v30/or3NQ6P12-iJxAIgLYT1PLs1Zd0nfUwAbeGVKoRYzNiCp1OUedn8f7XWSUKTt8iVow.woff2') format('woff2');
            font-weight: normal;
            font-style: italic;
          }
          body {
            font-family: 'Literata', serif;
            font-size: 18px;
            line-height: 1.8;
            padding: 20px;
            color: #333;
            margin: 0;
            -webkit-text-size-adjust: 100%;
            overflow-wrap: break-word;
          }
          h1, h2, h3, h4, h5, h6 {
            font-family: 'Literata', serif;
            font-weight: 700;
            line-height: 1.3;
          }
          p {
            margin-bottom: 1em;
          }
          img { max-width: 100%; height: auto; }
          .text-highlight {
            background-color: rgba(255, 255, 0, 0.4);
            border-radius: 3px;
            padding: 0 2px;
            margin: 0 -2px;
            box-decoration-break: clone;
            -webkit-box-decoration-break: clone;
            cursor: pointer;
            position: relative;
          }
          .text-highlight:active {
            opacity: 0.8;
          }
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #121212;
              color: #e0e0e0;
            }
            .text-highlight {
              background-color: rgba(255, 255, 0, 0.25);
            }
          }
        \`;
        document.head.appendChild(style);
      
        // Add viewport meta tag for proper mobile rendering
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'viewport');
        meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0');
        document.head.appendChild(meta);
      
        // Reset default margins
        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
      }
      
      // Only setup event listeners once
      if (!window.highlightSelectionInitialized) {
        window.highlightSelectionInitialized = true;
      
        // Tracking selection
        document.addEventListener('selectionchange', function() {
          const selection = window.getSelection();
          const selectedText = selection.toString();
          if (selectedText) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'selection',
              text: selectedText,
              position: {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
              }
            }));
          } else {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'selection-cleared'
            }));
          }
        });
      
        // Add event listener for clicking on highlights
        document.body.addEventListener('click', function(e) {
          // Only prevent default if clicking on a highlight
          if (e.target.className === 'text-highlight') {
            e.preventDefault(); // avoid unwanted bubbling only for highlights
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'highlight-clicked',
              id: e.target.id,
              text: e.target.textContent
            }));
          }
        });
      }
      
      // Function to highlight text
      window.highlightSelection = function(color) {
        const selection = window.getSelection();
        if (!selection.toString()) return null;
        
        const range = selection.getRangeAt(0);
        const highlightId = 'highlight-' + Date.now();
        
        const highlightEl = document.createElement('span');
        highlightEl.id = highlightId;
        highlightEl.className = 'text-highlight';
        highlightEl.style.backgroundColor = color;
        highlightEl.setAttribute('role', 'mark');
        highlightEl.setAttribute('aria-label', 'Highlighted text: ' + selection.toString());
        
        try {
          range.surroundContents(highlightEl);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'highlight-added',
            id: highlightId,
            text: highlightEl.textContent,
            color: color
          }));
          return highlightId;
        } catch (e) {
          console.error('Error highlighting:', e);
          return null;
        }
      };

      window.removeHighlight = function(highlightId) {
        const highlightEl = document.getElementById(highlightId);
        if (!highlightEl) return false;
        
        const text = highlightEl.textContent;
        const parent = highlightEl.parentNode;
        
        // Replace the highlight element with its text content
        if (parent) {
          parent.replaceChild(document.createTextNode(text), highlightEl);
          parent.normalize(); // Normalize to combine adjacent text nodes
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'highlight-removed',
            id: highlightId
          }));
          return true;
        }
        return false;
      };

      // Function to select all text
      window.selectAllText = function() {
        const allText = document.body;
        const range = document.createRange();
        range.selectNodeContents(allText);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'selection',
          text: selection.toString(),
          isSelectAll: true
        }));
      };

      // Set accessibility for highlights
      const setHighlightAccessibility = function() {
        const highlights = document.querySelectorAll('.text-highlight');
        highlights.forEach(highlight => {
          if (!highlight.hasAttribute('role')) {
            highlight.setAttribute('role', 'mark');
            highlight.setAttribute('aria-label', 'Highlighted text: ' + highlight.textContent);
          }
        });
      };
      
      // Call initially and when content changes
      setHighlightAccessibility();
      
      // Only set up observers once
      if (!window.highlightObserverInitialized) {
        window.highlightObserverInitialized = true;
        
        // Observer for accessibility
        const observer = new MutationObserver(setHighlightAccessibility);
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Height management with improved performance
        function getActualHeight() {
          return document.documentElement.scrollHeight;
        }
      
        // Use ResizeObserver with throttling for more efficient height tracking
        let resizeTimeout = null;
        const heightObserver = new ResizeObserver(() => {
          if (resizeTimeout) clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            const height = getActualHeight();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'contentHeight',
              height: height
            }));
          }, 100); // 100ms throttle
        });
        
        heightObserver.observe(document.documentElement);
        
        // Initial height measurement
        setTimeout(() => {
          const height = getActualHeight();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'contentHeight',
            height: height
          }));
        }, 300);
      }
    
    return true;
    })();
  `,
      [],
    );

    // Define menu items outside the render to prevent re-creation
    const menuItems = useMemo(
      () => [
        { label: "Highlight", key: "highlight" },
        { label: "Copy", key: "copy" },
        { label: "Select All", key: "selectAll" },
        { label: "Share", key: "share" },
        { label: "Remove Highlight", key: "removeHighlight" },
      ],
      [],
    );

    // Handle messages from WebView
    const handleMessage = useCallback(
      (event: { nativeEvent: { data: string } }) => {
        try {
          const data = JSON.parse(event.nativeEvent.data);

          switch (data.type) {
            case "contentHeight":
              // Use requestAnimationFrame to batch height updates
              requestAnimationFrame(() => {
                debouncedSetHeight(data.height);
              });
              break;

            case "selection":
              setSelectedText(data.text);
              if (onSelectionChange) {
                onSelectionChange(data.text);
              }
              break;

            case "selection-cleared":
              setSelectedText("");
              break;

            case "highlight-added":
              const newHighlight = {
                id: data.id,
                text: data.text,
                color: data.color,
              };
              setHighlights((prev) => [...prev, newHighlight]);
              if (onHighlightAdded) {
                onHighlightAdded(data.id, data.text, data.color);
              }
              break;

            case "highlight-removed":
              setHighlights((prev) => prev.filter((h) => h.id !== data.id));
              if (onHighlightRemoved) {
                onHighlightRemoved(data.id);
              }
              break;

            case "highlight-clicked":
              // setSelectedHighlightId(data.id);
              break;
          }
        } catch (error) {
          console.error("Error handling WebView message:", error);
        }
      },
      [debouncedSetHeight, onHighlightAdded, onHighlightRemoved, onSelectionChange],
    );

    // Memoize WebView actions to prevent recreation on render
    const addHighlight = useCallback(
      (color = "#FFFF00") => {
        if (!selectedText || !webViewRef.current) return;

        webViewRef.current.injectJavaScript(`
        window.highlightSelection('${color}');
        window.getSelection().removeAllRanges();
        true;
      `);
      },
      [selectedText],
    );

    const removeHighlight = useCallback((highlightId: string) => {
      if (!webViewRef.current) return;

      webViewRef.current.injectJavaScript(`
      window.removeHighlight('${highlightId}');
      true;
    `);
      setSelectedHighlightId(null);
    }, []);

    const selectAll = useCallback(() => {
      if (!webViewRef.current) return;

      webViewRef.current.injectJavaScript(`
      window.selectAllText();
      true;
    `);
    }, []);

    const handleCustomMenuSelection = useCallback(
      (event: { nativeEvent: { key: string; selectedText: string } }) => {
        const { key, selectedText } = event.nativeEvent;

        switch (key) {
          case "highlight":
            addHighlight();
            break;
          case "copy":
            Clipboard.setStringAsync(selectedText);
            break;
          case "selectAll":
            selectAll();
            break;
          case "share":
            if (onShare) onShare(selectedText);
            break;
          case "removeHighlight":
            if (selectedHighlightId) {
              removeHighlight(selectedHighlightId);
            } else if (webViewRef.current) {
              // Try removing based on selection
              webViewRef.current.injectJavaScript(`
              (function() {
                const sel = window.getSelection();
                if (!sel.rangeCount) return;
                const range = sel.getRangeAt(0);
                const ancestor = range.commonAncestorContainer;
                const highlightEl = ancestor.nodeType === 1 ? ancestor : ancestor.parentElement;
                if (highlightEl && highlightEl.classList.contains('text-highlight')) {
                  window.removeHighlight(highlightEl.id);
                }
                return true;
              })();
            `);
            }
            break;
        }
      },
      [addHighlight, selectAll, onShare, selectedHighlightId, removeHighlight],
    );

    // Use a style object that doesn't change on re-renders
    const containerStyle = useMemo(
      () => [styles.container, { height: webViewHeight }],
      [webViewHeight],
    );

    // Combine user style with base webview style
    const webViewStyle = useMemo(() => [styles.webview, style], [style]);

    // WebView source object created once to prevent re-renders
    const source = useMemo(
      () => ({
        html: html,
        baseUrl: baseUrl || "about:blank",
      }),
      [html, baseUrl],
    );

    

    return (
      <ThemeView style={containerStyle}>
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={source}
          style={webViewStyle}
          injectedJavaScript={injectedJavaScript}
          onMessage={handleMessage}
          menuItems={menuItems}
          onCustomMenuSelection={handleCustomMenuSelection}
          textInteractionEnabled={true}
          textZoom={100}
          scalesPageToFit={true}
          javaScriptEnabled={true}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          scrollEnabled={false}
          nestedScrollEnabled={false}
          cacheEnabled={true}
          cacheMode="LOAD_DEFAULT"
          domStorageEnabled={true}
        />
      </ThemeView>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    width: "100%",
    overflow: "hidden",
  },
  webview: {
    flexGrow: 1,
  },
});

export default HTMLViewer;
