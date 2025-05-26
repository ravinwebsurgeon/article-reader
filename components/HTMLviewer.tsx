//HTMLViewer.tsx
import React, { useRef, useState, useCallback, useMemo } from "react";
import { StyleSheet, View, Animated } from "react-native";
import WebView from "react-native-webview";
import * as Clipboard from "expo-clipboard";
import { ThemeView } from "./primitives";
import { leterataFontBase64 } from "@/constants/leterataFontBase64";
import { literataBold18base64 } from "@/constants/literateBold18Base64";

interface HTMLViewerProps {
  html: string;
  baseUrl?: string;
  style?: object;
  onHighlightAdded?: (id: unknown, text: string, color: string) => void;
  onHighlightRemoved?: (id: unknown) => void;
  onSelectionChange?: (selectedText: string) => void;
  onShare?: (text: string) => void;
  onScroll?: (event: unknown) => void;
  onContentSizeChange?: (width: number, height: number) => void;
  onLayout?: (event: unknown) => void;
  setContentHeight?: (height: number) => void;
  setScrollViewHeight?: (height: number) => void;
  handleScroll?: (event: unknown) => void;
}

interface HighlightData {
  id: string;
  text: string;
  color: string;
}

// Skeleton component for loading state
const SkeletonLoader: React.FC<{ isDark?: boolean }> = ({ isDark = false }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const pulseStyle = {
    opacity: pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    }),
  };

  const baseColor = isDark ? "#333" : "#E5E5E5";
  const skeletonStyle = [styles.skeletonLine, { backgroundColor: baseColor }, pulseStyle];

  return (
    <View style={[styles.skeletonContainer, { backgroundColor: isDark ? "#242526" : "#FFFFFF" }]}>
      {/* Header skeleton */}
      <Animated.View style={[skeletonStyle, styles.skeletonHeader]} />

      {/* Paragraph skeletons */}
      <View style={styles.skeletonParagraph}>
        <Animated.View style={[skeletonStyle, styles.skeletonLongLine]} />
        <Animated.View style={[skeletonStyle, styles.skeletonLongLine]} />
        <Animated.View style={[skeletonStyle, styles.skeletonMediumLine]} />
      </View>

      <View style={styles.skeletonParagraph}>
        <Animated.View style={[skeletonStyle, styles.skeletonLongLine]} />
        <Animated.View style={[skeletonStyle, styles.skeletonLongLine]} />
        <Animated.View style={[skeletonStyle, styles.skeletonLongLine]} />
        <Animated.View style={[skeletonStyle, styles.skeletonShortLine]} />
      </View>

      <View style={styles.skeletonParagraph}>
        <Animated.View style={[skeletonStyle, styles.skeletonLongLine]} />
        <Animated.View style={[skeletonStyle, styles.skeletonMediumLine]} />
      </View>

      {/* Image placeholder */}
      <Animated.View style={[skeletonStyle, styles.skeletonImage]} />

      <View style={styles.skeletonParagraph}>
        <Animated.View style={[skeletonStyle, styles.skeletonLongLine]} />
        <Animated.View style={[skeletonStyle, styles.skeletonLongLine]} />
        <Animated.View style={[skeletonStyle, styles.skeletonMediumLine]} />
      </View>
    </View>
  );
};

const HTMLViewer: React.FC<HTMLViewerProps> = React.memo(
  ({
    html,
    baseUrl,
    style,
    onHighlightAdded,
    onHighlightRemoved,
    onSelectionChange,
    onShare,
    setContentHeight,
  }) => {
    const webViewRef = useRef<WebView>(null);
    const [selectedText, setSelectedText] = useState<string>("");
    const [highlights, setHighlights] = useState<HighlightData[]>([]);
    const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
    const [webViewHeight, setWebViewHeight] = useState<number>(300);
    const [isWebViewReady, setIsWebViewReady] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    console.log(highlights);

    // Debounce height changes to prevent rapid re-renders
    const debouncedSetHeight = useCallback(
      (height: number) => {
        if (Math.abs(height - webViewHeight) > 10) {
          setWebViewHeight(height);
          if (setContentHeight) {
            setContentHeight(height);
          }
        }
      },
      [webViewHeight, setContentHeight],
    );

    // Minimal initial JavaScript - just what's needed for first render
    const initialJavaScript = useMemo(
      () => `
        (function() {
          // Detect dark mode
          const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          
          // Add basic styles immediately for faster rendering
          if (!document.getElementById('base-styles')) {
            const style = document.createElement('style');
            style.id = 'base-styles';
            style.textContent = \`
              body {
                font-family: 'Literata', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                
                font-size: 18px;
                line-height: 1.8;
                padding: 20px;
                color: \${isDark ? '#e0e0e0' : '#333'};
                background-color: \${isDark ? '#242526' : '#ffffff'};
                margin: 0;
                -webkit-text-size-adjust: 100%;
                overflow-wrap: break-word;
              }
              @media (prefers-color-scheme: dark) {
                body {
                  background-color: #242526;
                  color: #e0e0e0;
                }
              }
            \`;
            document.head.appendChild(style);
          }
          
          // Signal that initial render is ready
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'webview-ready',
            isDark: isDark
          }));
          
          return true;
        })();
      `,
      [],
    );

    // Full feature JavaScript - loaded after initial render
    const fullFeaturesJavaScript = useMemo(
      () => `
        (function() {
          // Load custom fonts asynchronously after initial render
          if (!document.getElementById('literata-styles')) {
            const style = document.createElement('style');
            style.id = 'literata-styles';
            style.textContent = \`
              @font-face {
                font-family: 'Literata';
                src: url(data:font/ttf;charset=utf-8;base64,${leterataFontBase64});
                    //  url('file:///android_asset/fonts/Literata/Literata_18pt-Regular.ttf') format('truetype');
                font-weight: normal;
                font-style: normal;
                font-display: swap; /* Improve font loading performance */
              }
              @font-face {
                font-family: 'Literata';
                src: url(data:font/ttf;charset=utf-8;base64, ${literataBold18base64});
                    //  url('file:///android_asset/fonts/Literata/Literata_18pt-Bold.ttf') format('truetype');
                font-weight: bold;
                font-style: normal;
                font-display: swap;
              }
              // @font-face {
              //   font-family: 'Literata';
              //   src: url('../assets/fonts/Literata/Literata_18pt-Regular.ttf') format('truetype'),
              //        url('file:///android_asset/fonts/Literata/Literata_18pt-Italic.ttf') format('truetype');
              //   font-weight: normal;
              //   font-style: italic;
              //   font-display: swap;
              // }
              // @font-face {
              //   font-family: 'Literata';
              //   src: url('file:///assets/fonts/Literata/Literata_18pt-BoldItalic.ttf') format('truetype'),
              //        url('file:///android_asset/fonts/Literata/Literata_18pt-BoldItalic.ttf') format('truetype');
              //   font-weight: bold;
              //   font-style: italic;
              //   font-display: swap;
              // }
            \`;
            document.head.appendChild(style);
            
            // Gradually transition to Literata font
            requestAnimationFrame(() => {
              document.body.style.fontFamily = "'Literata', serif";
            });
          }

          // Enhanced styles for highlights and typography
          if (!document.getElementById('enhanced-styles')) {
            const enhancedStyle = document.createElement('style');
            enhancedStyle.id = 'enhanced-styles';
            enhancedStyle.textContent = \`
              h1, h2, h3, h4, h5, h6 {
                font-family: 'Literata', serif !important;
                font-weight: 700;
                line-height: 1.3;
              }
              p {
                margin-bottom: 1em;
                font-family: 'Literata', serif !important;
              }
              img { 
                max-width: 100%; 
                height: auto; 
              }
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
                .text-highlight {
                  background-color: rgba(255, 255, 0, 0.25);
                }
              }
            \`;
            document.head.appendChild(enhancedStyle);
          }

          // Add viewport meta tag for proper mobile rendering
          if (!document.querySelector('meta[name="viewport"]')) {
            const meta = document.createElement('meta');
            meta.setAttribute('name', 'viewport');
            meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0');
            document.head.appendChild(meta);
          }

          // Reset default margins
          document.documentElement.style.margin = '0';
          document.documentElement.style.padding = '0';
          document.body.style.margin = '0';
          document.body.style.padding = '0';

          // Setup event listeners
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
              if (e.target.className === 'text-highlight') {
                e.preventDefault();
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
            
            if (parent) {
              parent.replaceChild(document.createTextNode(text), highlightEl);
              parent.normalize();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'highlight-removed',
                id: highlightId
              }));
              return true;
            }
            return false;
          };

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

          // Setup observers for height tracking
          if (!window.highlightObserverInitialized) {
            window.highlightObserverInitialized = true;
            
            function getActualHeight() {
              return document.documentElement.scrollHeight;
            }

            // Use ResizeObserver with throttling
            let resizeTimeout = null;
            const heightObserver = new ResizeObserver(() => {
              if (resizeTimeout) clearTimeout(resizeTimeout);
              resizeTimeout = setTimeout(() => {
                const height = getActualHeight();
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'contentHeight',
                  height: height
                }));
              }, 100);
            });
            
            heightObserver.observe(document.documentElement);
            
            // Initial height measurement - delayed to allow for font loading
            setTimeout(() => {
              const height = getActualHeight();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'contentHeight',
                height: height
              }));
              
              // Signal that content is fully loaded
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'content-loaded'
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
            case "webview-ready":
              setIsWebViewReady(true);
              setIsDarkMode(data.isDark || false);
              // Load full features after initial render
              setTimeout(() => {
                if (webViewRef.current) {
                  webViewRef.current.injectJavaScript(fullFeaturesJavaScript);
                }
              }, 50);
              break;

            case "content-loaded":
              // Fade out skeleton and fade in WebView
              setIsLoading(false);
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }).start();
              break;

            case "contentHeight":
              requestAnimationFrame(() => {
                debouncedSetHeight(data.height as number);
              });
              break;

            case "selection":
              setSelectedText(data.text as string);
              if (onSelectionChange) {
                onSelectionChange(data.text as string);
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
                onHighlightAdded(data.id, data.text as string, data.color as string);
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
      [
        debouncedSetHeight,
        onHighlightAdded,
        onHighlightRemoved,
        onSelectionChange,
        fullFeaturesJavaScript,
        fadeAnim,
      ],
    );

    // Handle WebView load events
    const handleLoadStart = useCallback(() => {
      setIsLoading(true);
      fadeAnim.setValue(0);
    }, [fadeAnim]);

    const handleLoadEnd = useCallback(() => {
      // Additional fallback in case content-loaded message isn't received
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      }, 1000);
    }, [isLoading, fadeAnim]);

    // Memoize WebView actions to prevent recreation on render
    const addHighlight = useCallback(
      (color = "#FFFF00") => {
        if (!selectedText || !webViewRef.current || !isWebViewReady) return;

        webViewRef.current.injectJavaScript(`
          window.highlightSelection && window.highlightSelection('${color}');
          window.getSelection().removeAllRanges();
          true;
        `);
      },
      [selectedText, isWebViewReady],
    );

    const removeHighlight = useCallback(
      (highlightId: string) => {
        if (!webViewRef.current || !isWebViewReady) return;

        webViewRef.current.injectJavaScript(`
        window.removeHighlight && window.removeHighlight('${highlightId}');
        true;
      `);
        setSelectedHighlightId(null);
      },
      [isWebViewReady],
    );

    const selectAll = useCallback(() => {
      if (!webViewRef.current || !isWebViewReady) return;

      webViewRef.current.injectJavaScript(`
        window.selectAllText && window.selectAllText();
        true;
      `);
    }, [isWebViewReady]);

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
            } else if (webViewRef.current && isWebViewReady) {
              webViewRef.current.injectJavaScript(`
                (function() {
                  const sel = window.getSelection();
                  if (!sel.rangeCount) return;
                  const range = sel.getRangeAt(0);
                  const ancestor = range.commonAncestorContainer;
                  const highlightEl = ancestor.nodeType === 1 ? ancestor : ancestor.parentElement;
                  if (highlightEl && highlightEl.classList.contains('text-highlight')) {
                    window.removeHighlight && window.removeHighlight(highlightEl.id);
                  }
                  return true;
                })();
              `);
            }
            break;
        }
      },
      [addHighlight, selectAll, onShare, selectedHighlightId, removeHighlight, isWebViewReady],
    );

    // Use a style object that doesn't change on re-renders
    const containerStyle = useMemo(
      () => [styles.container, { height: webViewHeight }],
      [webViewHeight],
    );

    // Combine user style with base webview style
    const webViewStyle = useMemo(() => [styles.webview, style], [style]);

    const addLazyLoading = (html: any) => {
      return html.replace(/<img/gi, '<img loading="lazy"');
    };

    // WebView source object created once to prevent re-renders
    const source = useMemo(
      () => ({
        html: addLazyLoading(html),
        baseUrl: baseUrl || "about:blank",
      }),
      [html, baseUrl],
    );

    return (
      <ThemeView style={containerStyle}>
        {/* Skeleton Loader */}
        {isLoading && (
          <View style={styles.skeletonOverlay}>
            <SkeletonLoader isDark={isDarkMode} />
          </View>
        )}

        {/* WebView with fade animation */}
        <Animated.View style={[styles.webviewContainer, { opacity: fadeAnim }]}>
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={source}
            style={webViewStyle}
            injectedJavaScript={initialJavaScript}
            onMessage={handleMessage}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
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
            // Performance optimizations
            mixedContentMode="compatibility"
            allowsInlineMediaPlayload={false}
            mediaPlaybackRequiresUserAction={true}
            // Reduce initial load time
            startInLoadingState={false}
            renderLoading={() => null}
          />
        </Animated.View>
      </ThemeView>
    );
  },
);

HTMLViewer.displayName = "HTMLViewer";

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  webview: {
    flexGrow: 1,
  },
  webviewContainer: {
    flex: 1,
  },
  skeletonOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  skeletonContainer: {
    flex: 1,
    padding: 20,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonHeader: {
    height: 24,
    width: "70%",
    marginBottom: 20,
    borderRadius: 8,
  },
  skeletonParagraph: {
    marginBottom: 20,
  },
  skeletonLongLine: {
    width: "100%",
  },
  skeletonMediumLine: {
    width: "80%",
  },
  skeletonShortLine: {
    width: "60%",
  },
  skeletonImage: {
    height: 200,
    width: "100%",
    marginBottom: 20,
    borderRadius: 8,
  },
});

export default HTMLViewer;
