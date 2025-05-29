/* eslint-disable react-hooks/exhaustive-deps */
//HTMLViewer.tsx
import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { StyleSheet, View, Animated, ActivityIndicator, Platform } from "react-native";
import WebView from "react-native-webview";
import * as Clipboard from "expo-clipboard";
import { ThemeView } from "./primitives";
import { leterataFontBase64 } from "@/constants/leterataFontBase64";
import { literataBold18base64 } from "@/constants/literateBold18Base64";
import { useDatabase } from "@/database/provider/DatabaseProvider";
import Annotation from "@/database/models/AnnotationModel";
import Item from "@/database/models/ItemModel";
import { ulid } from "ulid";
import { getPrefixAndSuffix } from "@/utils/getPrefixAndSuffix";
import { parseDocument } from "htmlparser2";
import { Element, Text } from "domhandler";
import { default as render } from "dom-serializer";
interface HTMLViewerProps {
  html: string;
  baseUrl?: string;
  style?: object;
  item: Item; // Add item prop to identify which item annotations belong to
  onHighlightAdded?: (id: unknown, text: string, color: string) => void;
  onHighlightRemoved?: (id: string) => void;
  onSelectionChange?: (selectedText: string) => void;
  onShare?: (text: string) => void;
  setContentHeight?: (height: number) => void;
}

interface HighlightData {
  id: string;
  text: string;
  color: string;
  prefix?: string;
  suffix?: string;
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
    item,
    onHighlightAdded,
    onHighlightRemoved,
    onSelectionChange,
    onShare,
    setContentHeight,
  }) => {
    const webViewRef = useRef<WebView>(null);
    const { database } = useDatabase();
    const [selectedText, setSelectedText] = useState<string>("");
    const [highlights, setHighlights] = useState<HighlightData[]>([]);
    const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
    const [selectedHighlightText, setSelectedHighlightText] = useState<string | null>(null);
    const [webViewHeight, setWebViewHeight] = useState<number>(300);
    const [isWebViewReady, setIsWebViewReady] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRemovingLoading, setRemovingLoading] = useState<boolean>(false);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [highlighted, setHighlighted] = useState<boolean>(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (highlights.length > 0) {
        highlights.map(async (item) => {
          // console.log("item----------->", item);
        });
      }
    }, [highlights]);

    React.useEffect(() => {
      loadExistingAnnotations();
    }, [database, item, isWebViewReady]);
    const loadExistingAnnotations = async () => {
      if (!database || !item.annotations) return;

      try {
        const existingAnnotations = await item.annotations.fetch();
        const highlightData = existingAnnotations.map((annotation) => ({
          id: annotation.id,
          text: annotation.text ?? "",
          color: "#FFFF00", // Default yellow color
          prefix: annotation.prefix ?? "",
          suffix: annotation.suffix ?? "",
        }));
        setHighlights(highlightData);

        // Inject highlights into WebView once it's ready
        if (isWebViewReady && webViewRef.current && highlightData.length > 0) {
          const restoreScript = highlightData
            .map(
              (highlight) =>
                `window.restoreHighlight && window.restoreHighlight('${highlight.id}', '${highlight.text}', '${highlight.prefix}', '${highlight.suffix}', '${highlight.color}');`,
            )
            .join("\n");

          webViewRef.current.injectJavaScript(`
              ${restoreScript}
              true;
            `);
        }
      } catch (error) {
        console.error("Error loading existing annotations:", error);
      }
    };
    // Save annotation to database
    const saveAnnotationToDatabase = useCallback(
      async (
        annotationId: string,
        text: string,
        prefix: string,
        suffix: string,
        color: string = "#FFFF00",
      ) => {
        if (!database) {
          console.error("Database not available");
          return;
        }

        try {
          await database.write(async () => {
            const result = await database.get<Annotation>("annotations").create((annotation) => {
              if (annotation.item) {
                annotation.item.set(item);
              }
              annotation.text = text;
              annotation.prefix = prefix;
              annotation.suffix = suffix;
              annotation.note = null; // Can be used later for user notes
            });
            if (result) {
              loadExistingAnnotations();
            }
          });

          // console.log("Annotation saved successfully:", annotationId);
        } catch (error) {
          console.error("Error saving annotation to database:", error);
        }
      },
      [database, item],
    );

    // Remove annotation from database
    const removeAnnotationFromDatabase = useCallback(
      async (annotationId: string) => {
        if (!database) {
          console.error("Database not available");
          return;
        }

        try {
          await database.write(async () => {
            // console.log("annotationId--->", annotationId);
            const annotation = await database.get<Annotation>("annotations").find(annotationId);
            await annotation.destroyPermanently();
            setRemovingLoading(true);
            await loadExistingAnnotations();
            setHighlighted(false);
            setSelectedHighlightId(null);
            setSelectedHighlightText(null);
            setRemovingLoading(false);
          });
        } catch (error) {
          console.error("Error removing annotation from database:", error);
        }
      },
      [database],
    );

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
    // Update the initialJavaScript to be more robust
    const initialJavaScript = useMemo(
      () => `
    (function() {
      // Enhanced dark mode detection
      const detectDarkMode = () => {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      };
      
      let currentIsDark = detectDarkMode();
      
      // Function to update theme colors
      const updateThemeColors = (isDark) => {
        const bodyColor = isDark ? '#e0e0e0' : '#333';
        const bgColor = isDark ? '#242526' : '#ffffff';
        
        document.body.style.color = bodyColor;
        document.body.style.backgroundColor = bgColor;
        document.documentElement.style.backgroundColor = bgColor;
        
        // Update CSS custom properties for more reliable theming
        document.documentElement.style.setProperty('--text-color', bodyColor);
        document.documentElement.style.setProperty('--bg-color', bgColor);
      };
      
      // Add base styles with CSS custom properties
      if (!document.getElementById('base-styles')) {
        const style = document.createElement('style');
        style.id = 'base-styles';
        style.textContent = \`
          :root {
            --text-color: \${currentIsDark ? '#e0e0e0' : '#333'};
            --bg-color: \${currentIsDark ? '#242526' : '#ffffff'};
          }
          
          html, body {
            font-family: 'Literata', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            font-size: 18px;
            line-height: 1.8;
            padding: 20px;
            color: var(--text-color) !important;
            background-color: var(--bg-color) !important;
            margin: 0;
            -webkit-text-size-adjust: 100%;
            overflow-wrap: break-word;
            transition: background-color 0.3s ease, color 0.3s ease;
          }
          
          * {
            color: inherit;
          }
        \`;
        document.head.appendChild(style);
      }
      
      // Apply initial theme
      updateThemeColors(currentIsDark);
      
      // Listen for theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleThemeChange = (e) => {
        currentIsDark = e.matches;
        updateThemeColors(currentIsDark);
        
        // Notify React Native about theme change
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'theme-changed',
          isDark: currentIsDark
        }));
      };
      
      if (mediaQuery.addListener) {
        mediaQuery.addListener(handleThemeChange);
      } else if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleThemeChange);
      }
      
      // Store theme change handler for cleanup
      window.themeChangeHandler = handleThemeChange;
      window.mediaQuery = mediaQuery;
      
      // Expose theme update function for manual control
      window.updateTheme = updateThemeColors;
      
      // Signal that initial render is ready
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'webview-ready',
        isDark: currentIsDark
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

              /* Dark mode highlight adjustment */
              @media (prefers-color-scheme: dark) {
                .text-highlight {
                  background-color: rgba(255, 255, 0, 0.25);
                }
              }
          
          /* Force dark mode when CSS variables indicate dark theme */
          [style*="--bg-color: #242526"] .text-highlight {
            background-color: rgba(255, 255, 0, 0.25) !important;
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

          // Utility function to get text context around selection
          function getTextContext(range, contextLength = 50) {
            const container = range.commonAncestorContainer;
            const fullText = container.textContent || '';
            const startOffset = range.startOffset;
            const endOffset = range.endOffset;
            
            // Get prefix (text before selection)
            const prefixStart = Math.max(0, startOffset - contextLength);
            const prefix = fullText.substring(prefixStart, startOffset);
            
            // Get suffix (text after selection)
            const suffixEnd = Math.min(fullText.length, endOffset + contextLength);
            const suffix = fullText.substring(endOffset, suffixEnd);
            
            return { prefix, suffix };
          }

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
             const LONG_PRESS_DURATION = 300;
  let longPressTimer = null;

  document.body.addEventListener('touchstart', function (e) {
    const target = e.target;

    if (target.className === 'text-highlight') {
      longPressTimer = setTimeout(() => {
        // Long press detected, select the text
        const range = document.createRange();
        range.selectNodeContents(target);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        // Send message to React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'highlight-longpress',
          id: target.id,
          text: target.textContent
        }));
      }, LONG_PRESS_DURATION);
    }
  });

  document.body.addEventListener('touchend', function () {
    clearTimeout(longPressTimer);
  });

  document.body.addEventListener('touchmove', function () {
    clearTimeout(longPressTimer);
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

          // Function to highlight text with context
          window.highlightSelection = function(color) {          
            const selection = window.getSelection();
            if (!selection.toString()) return null;
            
            const range = selection.getRangeAt(0);
            const highlightId = 'highlight-' + Date.now();
            const selectedText = selection.toString();
            
            // Get context around the selection
            const { prefix, suffix } = getTextContext(range);
            
            const highlightEl = document.createElement('span');
            highlightEl.id = highlightId;
            highlightEl.className = 'text-highlight';
            highlightEl.style.backgroundColor = color;
            highlightEl.setAttribute('role', 'mark');
            highlightEl.setAttribute('aria-label', 'Highlighted text: ' + selectedText);
            highlightEl.setAttribute('data-prefix', prefix);
            highlightEl.setAttribute('data-suffix', suffix);
            
            try {
              range.surroundContents(highlightEl);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'highlight-added',
                id: highlightId,
                text: selectedText,
                prefix: prefix,
                suffix: suffix,
                color: color
              }));
              return highlightId;
            } catch (e) {
              console.error('Error highlighting:', e);
              return null;
            }
          };

          // Function to restore highlights from database
          window.restoreHighlight = function(highlightId, text, prefix, suffix, color) {
            // Find text using prefix and suffix context
            const walker = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );
            
            let node;
            while (node = walker.nextNode()) {
              const nodeText = node.textContent || '';
              const textIndex = nodeText.indexOf(text);
              
              if (textIndex !== -1) {
                // Check if context matches
                const beforeText = nodeText.substring(Math.max(0, textIndex - prefix.length), textIndex);
                const afterText = nodeText.substring(textIndex + text.length, textIndex + text.length + suffix.length);
                
                if (beforeText.includes(prefix.slice(-20)) && afterText.includes(suffix.slice(0, 20))) {
                  // Create highlight
                  const range = document.createRange();
                  range.setStart(node, textIndex);
                  range.setEnd(node, textIndex + text.length);
                  
                  const highlightEl = document.createElement('span');
                  highlightEl.id = highlightId;
                  highlightEl.className = 'text-highlight';
                  highlightEl.style.backgroundColor = color;
                  highlightEl.setAttribute('role', 'mark');
                  highlightEl.setAttribute('aria-label', 'Highlighted text: ' + text);
                  highlightEl.setAttribute('data-prefix', prefix);
                  highlightEl.setAttribute('data-suffix', suffix);
                  
                  try {
                    range.surroundContents(highlightEl);
                    return true;
                  } catch (e) {
                    console.error('Error restoring highlight:', e);
                  }
                }
              }
            }
            return false;
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
    const menuItemsHighlight = useMemo(
      () => [
        { label: "Remove Highlight", key: "removeHighlight" },
        { label: "Copy", key: "copy" },
        { label: "Select All", key: "selectAll" },
        { label: "Share", key: "share" },
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
              setIsDarkMode(Boolean(data.isDark) ?? false);
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
              const getId = highlights.find((item) => {
                const highlightText = data.text as string;
                return item.text === highlightText;
              });
              if (getId) {
                setHighlighted(true);
              } else {
                setHighlighted(false);
              }
              setSelectedHighlightText(data.text as string);
              setSelectedText(data.text as string);
              if (onSelectionChange) {
                onSelectionChange(data.text as string);
              }
              break;

            case "selection-cleared":
              setHighlighted(false);
              setSelectedText("");
              break;

            case "highlight-added":
              // const newHighlight = {
              //   id: ulid(),
              //   text: data.text,
              //   color: data.color,
              //   prefix: prefix,
              //   suffix: suffix,
              // };
              // setHighlights((prev) => [...prev, newHighlight]);
              // // Save to database
              // saveAnnotationToDatabase(
              //   ulid(),
              //   data.text as string,
              //   prefix as string,
              //   suffix as string,
              //   data.color as string,
              // );

              // if (onHighlightAdded) {
              //   onHighlightAdded(data.id, data.text as string, data.color as string);
              // }
              break;

            case "highlight-removed":
              // setHighlights((prev) => prev.filter((h) => h.id !== data.id));

              // Remove from database
              // removeAnnotationFromDatabase(data.id as string);

              if (onHighlightRemoved) {
                onHighlightRemoved(data.id as string);
              }
              break;

            case "highlight-clicked":
              console.log("sdff", data);
              setSelectedHighlightId(data.id as string);
              setSelectedHighlightText(data.text as string);
              break;

            case "theme-changed":
              setIsDarkMode(Boolean(data.isDark) || false);
              // Force a re-render of any theme-dependent elements
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
        saveAnnotationToDatabase,
        removeAnnotationFromDatabase,
      ],
    );

    // Add a method to manually update theme (call this when you detect theme changes in React Native)
    const updateWebViewTheme = useCallback(
      (isDark: boolean) => {
        if (!webViewRef.current || !isWebViewReady) return;

        webViewRef.current.injectJavaScript(`
    if (window.updateTheme) {
      window.updateTheme(${isDark});
    }
    true;
  `);
      },
      [isWebViewReady],
    );

    // Add useEffect to handle prop-based theme changes
    React.useEffect(() => {
      if (isDarkMode !== undefined && isDarkMode !== isDarkMode) {
        updateWebViewTheme(isDarkMode);
        setIsDarkMode(isDarkMode);
      }
    }, [isDarkMode, updateWebViewTheme]);

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
        if (selectedText) {
          const { suffix, prefix } = getPrefixAndSuffix(`${selectedText}`);
          const id = ulid();
          // Save to database
          saveAnnotationToDatabase(
            id,
            selectedText as string,
            prefix as string,
            suffix as string,
            color as string,
          );

          if (onHighlightAdded) {
            onHighlightAdded(id, selectedText as string, color as string);
          }
        }
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
        setSelectedHighlightText(null);
      },
      [isWebViewReady],
    );
    const removeHighlightText = useCallback(
      (highlightText: string) => {
        const getId = highlights.find((item) => {
          console.log("highlightText", highlightText, item.text);
          return item.text === highlightText;
        });
        if (getId?.id) {
          removeAnnotationFromDatabase(getId.id as string);
        }
      },
      [highlights],
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
            console.log("selectedHighlightText ", selectedHighlightText);
            if (selectedHighlightText) {
              removeHighlightText(selectedHighlightText as string);
            }
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
      () => [styles.container, ...(Platform.OS === "web" ? [] : [{ height: webViewHeight }])],
      [webViewHeight],
    );

    // Combine user style with base webview style
    const webViewStyle = useMemo(() => [styles.webview, style], [style]);
    const processHtmlWithHighlights = (html: string): string => {
      // 1. Add lazy loading to all images
      let updatedHtml = html.replace(/<img/gi, '<img loading="lazy"');

      const highlightTexts = highlights.map((h: HighlightData) => h.text?.trim());

      // 2. Parse HTML into DOM
      const doc = parseDocument(updatedHtml);

      // 3. Traverse nodes and wrap matched highlight text
      const traverse = (node: any) => {
        if (node.type === "text") {
          highlightTexts.forEach((highlight) => {
            const index = node.data.indexOf(highlight);
            if (index !== -1) {
              const before = node.data.slice(0, index);
              const match = node.data.slice(index, index + highlight.length) as string;
              const after = node.data.slice(index + highlight.length);

              const parent = node.parent;
              const newNodes = [];

              if (before) newNodes.push(new Text(before as string));
              newNodes.push(new Element("span", { class: "text-highlight" }, [new Text(match)]));
              if (after) newNodes.push(new Text(after as string));

              const parentChildren = parent?.children;
              if (parentChildren) {
                const idx = parentChildren.indexOf(node);
                parentChildren.splice(idx, 1, ...newNodes);
              }
            }
          });
        } else if (node.children) {
          node.children.forEach(traverse);
        }
      };

      doc.children.forEach(traverse);
      return render(doc);
    };

    // WebView source object created once to prevent re-renders
    const source = useMemo(
      () => ({
        html: processHtmlWithHighlights(html),
        baseUrl: baseUrl ?? "about:blank",
      }),
      [html, baseUrl, highlights],
    );
    useEffect(() => {
      const detectDarkMode = () => {
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      };

      let currentIsDark = detectDarkMode();
      setIsDarkMode(currentIsDark);
    }, []);

    return (
      <ThemeView style={containerStyle}>
        {/* Skeleton Loader */}

        {Platform.OS === "web" && source.html ? (
          <div
            dangerouslySetInnerHTML={{
              __html:
                `<style>
                   :root {
            --text-color: ${isDarkMode ? "#e0e0e0" : "#333"};
            --bg-color: ${isDarkMode ? "#242526" : "#ffffff"};
          }
          
          html, body {
            font-family: 'Literata', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            font-size: 18px;
            line-height: 1.8;
            padding: 0;
            color: var(--text-color) !important;
            background-color: var(--bg-color) !important;
            margin: 0;
            -webkit-text-size-adjust: 100%;
            overflow-wrap: break-word;
            transition: background-color 0.3s ease, color 0.3s ease;
          }
          
          * {
            color: inherit;
          }
            @font-face {
                font-family: 'Literata';
                src: url(data:font/ttf;charset=utf-8;base64,${leterataFontBase64});
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

              /* Dark mode highlight adjustment */
              @media (prefers-color-scheme: dark) {
                .text-highlight {
                  background-color: rgba(255, 255, 0, 0.25);
                }
              }
          
          /* Force dark mode when CSS variables indicate dark theme */
          [style*="--bg-color: #242526"] .text-highlight {
            background-color: rgba(255, 255, 0, 0.25) !important;
          }
           
          
          </style>` + source.html,
            }}
          ></div>
        ) : (
          <View style={styles.skeletonOverlay}>
            {isLoading && <SkeletonLoader isDark={isDarkMode} />}
          </View>
        )}
        {Platform.OS !== "web" && (isLoading || isRemovingLoading) && (
          <View style={styles.skeletonOverlay}>
            {isLoading && <SkeletonLoader isDark={isDarkMode} />}
            {isRemovingLoading && <ActivityIndicator size="large" />}
          </View>
        )}
        {/* menuItemsHighlight */}
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
            menuItems={highlighted ? menuItemsHighlight : menuItems}
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
            // allowsInlineMediaPlayload={false}
            mediaPlaybackRequiresUserAction={true}
            // Reduce initial load time
            startInLoadingState={false}
            // renderLoading={() => null}
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
