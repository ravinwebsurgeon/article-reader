import React, { useRef, useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Platform } from "react-native";
import WebView from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
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

const HTMLViewer: React.FC<HTMLViewerProps> = ({
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
  const [showToolbar, setShowToolbar] = useState<boolean>(false);
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
  const [webViewHeight, setWebViewHeight] = useState<number>(0);

  console.log("HTMLViewer props:", highlights);

  const getInjectedJavaScript = () => `
    (function() {
      // Add Literata font support
      const style = document.createElement('style');
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
  meta.setAttribute('content', 'width=device-width, initial-scale=1.0');
  document.head.appendChild(meta);

  // Reset default margins
  document.documentElement.style.margin = 0;
  document.documentElement.style.padding = 0;
  document.body.style.margin = 0;
  document.body.style.padding = 0;

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

      // Add event listener for clicking on highlights
      document.body.addEventListener('click', function(e) {
      e.preventDefault(); // avoid unwanted bubbling
        if (e.target.className === 'text-highlight') {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'highlight-clicked',
            id: e.target.id,
            text: e.target.textContent
          }));
        }
      });

      // Add accessibility to all highlights
      const setHighlightAccessibility = function() {
        const highlights = document.querySelectorAll('.text-highlight');
        highlights.forEach(highlight => {
          highlight.setAttribute('role', 'mark');
          highlight.setAttribute('aria-label', 'Highlighted text: ' + highlight.textContent);
        });
      };
      
      // Call initially and when content changes
      setHighlightAccessibility();
      const observer = new MutationObserver(setHighlightAccessibility);
      observer.observe(document.body, { childList: true, subtree: true });

  function getActualHeight() {
    // Use documentElement instead of body for better measurement
    return Math.min(
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
  }

  function updateHeight() {
    const height = getActualHeight();
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'contentHeight',
      height: height
    }));
  }

  // Throttle height updates
  let updatePending = false;
  const throttledUpdate = () => {
    if (!updatePending) {
      updatePending = true;
      requestAnimationFrame(() => {
        updateHeight();
        updatePending = false;
      });
    }
  };

  // Initial setup
  updateHeight();
  
  // Setup observers
  new ResizeObserver(throttledUpdate).observe(document.body);
  new MutationObserver(throttledUpdate).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
  });

  // Final verification
  setTimeout(updateHeight, 500);
  setTimeout(updateHeight, 1000);
      
    true;
    })();
  `;
  
  // Handle messages from WebView
  const handleMessage = useCallback(
    (event: {
      nativeEvent: {
        data: string;
      };
    }) => {
      try {
        const data: { type: string; text: string; id: any; color: string } = JSON.parse(
          event.nativeEvent.data,
        );

        console.log("Received message from WebView: height", data.type);

        switch (data.type) {
          case "resize":
            // Apply reasonable minimum and maximum
            const height = Math.max(100, Math.min(10000, data.height));
            console.log("Setting WebView height to:", height, data.height);
            setWebViewHeight(height);
            break;

          case "contentHeight":
            console.log("WebView height changed:1", data.height);
            if (Math.abs(data.height - webViewHeight) > 5) {
              console.log("WebView height changed:2", data.height);
              setWebViewHeight(data.height);
            }
            break;

          case "selection":
            setSelectedText(data.text);
            setShowToolbar(true);
            if (onSelectionChange) {
              onSelectionChange(data.text);
            }
            break;

          case "selection-cleared":
            setSelectedText("");
            setShowToolbar(false);
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
            setShowToolbar(true);
            break;
        }
      } catch (error) {
        console.error("Error handling WebView message:", error);
      }
    },
    [onHighlightAdded, onHighlightRemoved, onSelectionChange, webViewHeight],
  );

  // Add highlight with specified color
  const addHighlight = useCallback(
    (color = "#FFFF00") => {
      if (!selectedText) return;

      webViewRef.current?.injectJavaScript(`
      window.highlightSelection('${color}');
      window.getSelection().removeAllRanges();
      true;
    `);

      setShowToolbar(false);
    },
    [selectedText],
  );

  // Remove highlight by ID
  const removeHighlight = useCallback((highlightId: string) => {
    console.log("Removing highlight:", highlightId);
    webViewRef.current?.injectJavaScript(`
      window.removeHighlight('${highlightId}');
      true;
    `);
    setSelectedHighlightId(null);
    setShowToolbar(false);
  }, []);

  

  // Select all text
  const selectAll = useCallback(() => {
    webViewRef.current?.injectJavaScript(`
      window.selectAllText();
      true;
    `);
  }, []);

  // Custom WebView with enhanced menu items
  const menuItems = [
    { label: "Highlight", key: "highlight" },
    { label: "Copy", key: "copy" },
    { label: "Select All", key: "selectAll" },
    { label: "Share", key: "share" },
    { label: "Remove Highlight", key: "removeHighlight" },
  ];

  const handleCustomMenuSelection = useCallback(
    (event: {
      nativeEvent: {
        key: string;
        selectedText: string;
      };
    }) => {
      const { key, selectedText } = event.nativeEvent;

      switch (key) {
        case "highlight":
          addHighlight();
          break;
        case "copy":
          Clipboard.setStringAsync(selectedText);
          setShowToolbar(false);
          break;
        case "selectAll":
          selectAll();
          break;
        case "share":
          onShare && onShare(selectedText);
          break;
        case "removeHighlight":
          if (selectedHighlightId) {
            removeHighlight(selectedHighlightId);
            setSelectedHighlightId(null);
          } else {
            // fallback: try removing based on selection (if it's a highlight)
            webViewRef.current?.injectJavaScript(`
              (function() {
                const sel = window.getSelection();
                if (!sel.rangeCount) return;
                const range = sel.getRangeAt(0);
                const ancestor = range.commonAncestorContainer;
                const highlightEl = ancestor.nodeType === 1 ? ancestor : ancestor.parentElement;
                if (highlightEl && highlightEl.classList.contains('text-highlight')) {
                  const id = highlightEl.id;
                  window.removeHighlight(id);
                }
              })();
              true;
            `);
          }
          break;
      }
    },
    [addHighlight, selectAll, onShare, selectedHighlightId, removeHighlight],
  );

  return (
    <ThemeView
      style={[
        styles.container,
        // { height: webViewHeight > 0 ? Math.min(webViewHeight, 2000) : 300 },
        { height: webViewHeight > 0 ? webViewHeight : 300 },
      ]}
    >
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{
          html: html,
          baseUrl: baseUrl || "about:blank",
        }}
        style={[styles.webview, style]}
        injectedJavaScript={getInjectedJavaScript()}
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
      />
    </ThemeView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    width: "100%",
    height: 1000,
  },
  webview: {
    flexGrow: 1,
  },
  toolbar: {
    flexDirection: "row",
    backgroundColor: "#FAFAFA",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: "space-around",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  toolbarButton: {
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
  },
  toolbarText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
});

export default HTMLViewer;
