import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { StyleSheet, Share, View, Animated } from "react-native";
import { marked } from "marked";
import { useDarkMode } from "@/theme/hooks";
import HTMLViewer from "./htmlviewer/HTMLViewer";
import { AutoResizePlugin } from "./htmlviewer/plugins/AutoResizePlugin";
import { HighlightsPlugin } from "./htmlviewer/plugins/HighlightsPlugin";
import { PluginContext, PluginMessage } from "./htmlviewer/plugins/types";
import Item from "@/database/models/ItemModel";
import ItemContent from "@/database/models/ItemContentModel";
import ReaderSkeleton from "./ReaderSkeleton";
import { leterataFontBase64 } from "@/constants/leterataFontBase64";
import { literataBold18base64 } from "@/constants/literateBold18Base64";

interface ContentProps {
  item: Item;
  content: ItemContent | null;
  onProgressChange?: (progress: number) => void;
  onUserScrolled?: () => void;
  onLoadComplete?: () => void;
}

export const ReaderContent: React.FC<ContentProps> = ({
  item,
  content,
  onProgressChange,
  onUserScrolled,
  onLoadComplete,
}) => {
  const isDarkMode = useDarkMode();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // State
  const [isHtmlLoaded, setIsHtmlLoaded] = useState(false);
  const [selectedText, setSelectedText] = useState<string>("");
  const [highlights, setHighlights] = useState<Array<{ id: string; text: string; color: string }>>(
    [],
  );
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Process markdown content
  const processedContent = useMemo(() => {
    const raw = content?.content ?? "";
    return marked.parse(raw) as string;
  }, [content?.content]);

  // Base styles for the article content
  const baseCSS = useMemo(
    () => `
      @font-face {
        font-family: 'Literata';
        src: url(data:font/ttf;charset=utf-8;base64,${leterataFontBase64});
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'Literata';
        src: url(data:font/ttf;charset=utf-8;base64,${literataBold18base64});
        font-weight: bold;
        font-style: normal;
        font-display: swap;
      }

      :root {
        --text-color: ${isDarkMode ? "#e0e0e0" : "#000000"};
        --bg-color: ${isDarkMode ? "#242526" : "#ffffff"};
        --link-color: ${isDarkMode ? "#4A9EFF" : "#007AFF"};
        --blockquote-border: ${isDarkMode ? "#444" : "#ddd"};
        --blockquote-color: ${isDarkMode ? "#ccc" : "#666"};
        --code-bg: ${isDarkMode ? "#2d2d2d" : "#f6f6f6"};
      }

      html, body {
        font-family: 'Literata', Georgia, serif;
        font-size: 18px;
        line-height: 28px;
        font-weight: 400;
        padding: 0 10px;
        margin: 0;
        color: var(--text-color);
        background-color: var(--bg-color);
        width: 100%;
        overflow-x: hidden;
        box-sizing: border-box;
      }
      
      h1, h2, h3, h4, h5, h6 {
        font-family: 'Literata', Georgia, serif;
        line-height: 1.3;
        color: var(--text-color);
      }
      
      h1 {
        font-size: 24px;
        line-height: 32px;
        font-weight: 700;
        margin: 24px 0 16px 0;
      }
      
      h2 {
        font-size: 22px;
        line-height: 30px;
        font-weight: 700;
        margin: 22px 0 14px 0;
      }
      
      h3 {
        font-size: 20px;
        line-height: 28px;
        font-weight: 600;
        margin: 20px 0 12px 0;
      }
      
      h4, h5, h6 {
        font-size: 18px;
        line-height: 26px;
        font-weight: 600;
        margin: 18px 0 10px 0;
      }
      
      p {
        margin-bottom: 16px;
        color: var(--text-color);
      }
      
      em, i {
        font-style: italic;
      }
      
      strong, b {
        font-weight: 700;
      }
      
      a {
        color: var(--link-color);
        text-decoration: none;
      }
      
      a:hover {
        text-decoration: underline;
      }
      
      img { 
        max-width: 100%; 
        height: auto; 
        display: block;
        margin: 20px 0;
      }
      
      blockquote {
        font-style: italic;
        border-left: 4px solid var(--blockquote-border);
        margin: 20px 0;
        padding-left: 20px;
        color: var(--blockquote-color);
      }
      
      ul, ol {
        margin: 16px 0;
        padding-left: 20px;
      }
      
      li {
        margin-bottom: 8px;
        color: var(--text-color);
      }
      
      code {
        background-color: var(--code-bg);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Monaco', 'Consolas', 'Liberation Mono', monospace;
        font-size: 16px;
      }
      
      pre {
        background-color: var(--code-bg);
        padding: 16px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 20px 0;
      }
      
      pre code {
        background: none;
        padding: 0;
        font-size: 14px;
        line-height: 20px;
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
    `,
    [isDarkMode],
  );

  // Create plugins
  const plugins = useMemo(
    () => [
      new AutoResizePlugin(),
      new HighlightsPlugin({
        onHighlightAdded: (id, text, color) => {
          setHighlights((prev) => [...prev, { id, text, color }]);
        },
        onHighlightRemoved: (id) => {
          setHighlights((prev) => prev.filter((h) => h.id !== id));
        },
        onSelectionChange: (text) => {
          setSelectedText(text);
        },
      }),
    ],
    [],
  );

  // Handle sharing selected text
  const handleShareSelectedText = async (text: string) => {
    try {
      await Share.share({
        message: text,
      });
    } catch (error) {
      console.error("Error sharing text:", error);
    }
  };

  const handleLoadComplete = () => {
    console.log("Content: handleLoadComplete called, setting isHtmlLoaded to true");
    setIsHtmlLoaded(true);
    // Fade in the content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    if (onLoadComplete) {
      console.log("Content: calling parent onLoadComplete");
      onLoadComplete();
    }
  };

  // Reset state when item changes
  useEffect(() => {
    setIsHtmlLoaded(false);
    fadeAnim.setValue(0);
  }, [item.id, fadeAnim]);

  // Show skeleton if content is not ready
  if (!content || !processedContent) {
    return <ReaderSkeleton isDark={isDarkMode} />;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <HTMLViewer
          content={processedContent}
          cssStyles={baseCSS}
          plugins={plugins}
          onLoadComplete={handleLoadComplete}
        />
      </Animated.View>
      {!isHtmlLoaded && (
        <View style={styles.loading}>
          <ReaderSkeleton isDark={isDarkMode} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  content: {
    flex: 1,
  },
  loading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default ReaderContent;
