import React, { useState, useRef, useMemo, useEffect } from "react";
import { StyleSheet, Share, View } from "react-native";
import { marked } from "marked";
import { useDarkMode } from "@/theme/hooks";
import HTMLViewer from "./htmlviewer/HTMLViewer";
import { AutoResizePlugin } from "./htmlviewer/plugins/AutoResizePlugin";
import { HighlightsPlugin } from "./htmlviewer/plugins/HighlightsPlugin";
import Item from "@/database/models/ItemModel";
import ItemContent from "@/database/models/ItemContentModel";
import Skeleton from "./Skeleton";

interface ContentProps {
  item: Item;
  content: ItemContent | null;
  onProgressChange?: (progress: number) => void;
  onUserScrolled?: () => void;
  onLoadComplete?: () => void;
}

export const Content: React.FC<ContentProps> = ({
  item,
  content,
  onProgressChange,
  onUserScrolled,
  onLoadComplete,
}) => {
  const isDarkMode = useDarkMode();

  // State
  const [isHtmlLoaded, setIsHtmlLoaded] = useState(false);
  const [selectedText, setSelectedText] = useState<string>("");
  const [highlights, setHighlights] = useState<any[]>([]);

  // Process markdown content
  const processedContent = useMemo(() => {
    const raw = content?.content ?? "";
    return marked.parse(raw) as string;
  }, [content?.content]);

  // Base styles for the article content
  const baseCSS = useMemo(
    () => `
      html, body {
        font-family: 'Literata-Regular', Georgia, serif;
        font-size: 18px;
        line-height: 28px;
        font-weight: 400;
        padding: 0 10px;
        margin: 0;
        color: ${isDarkMode ? "#ffffff" : "#000000"};
        background-color: ${isDarkMode ? "#000000" : "#ffffff"};
        width: 100%;
        overflow-x: hidden;
        box-sizing: border-box;
      }
      
      h1 {
        font-family: 'Literata-Bold', Georgia, serif;
        font-size: 24px;
        line-height: 32px;
        font-weight: 700;
        margin: 24px 0 16px 0;
        color: ${isDarkMode ? "#ffffff" : "#000000"};
      }
      
      h2 {
        font-family: 'Literata-Bold', Georgia, serif;
        font-size: 22px;
        line-height: 30px;
        font-weight: 700;
        margin: 22px 0 14px 0;
        color: ${isDarkMode ? "#ffffff" : "#000000"};
      }
      
      h3 {
        font-family: 'Literata-SemiBold', Georgia, serif;
        font-size: 20px;
        line-height: 28px;
        font-weight: 600;
        margin: 20px 0 12px 0;
        color: ${isDarkMode ? "#ffffff" : "#000000"};
      }
      
      h4, h5, h6 {
        font-family: 'Literata-SemiBold', Georgia, serif;
        font-size: 18px;
        line-height: 26px;
        font-weight: 600;
        margin: 18px 0 10px 0;
        color: ${isDarkMode ? "#ffffff" : "#000000"};
      }
      
      p {
        font-family: 'Literata-Regular', Georgia, serif;
        font-size: 18px;
        line-height: 28px;
        font-weight: 400;
        margin-bottom: 16px;
        color: ${isDarkMode ? "#ffffff" : "#000000"};
      }
      
      em, i {
        font-family: 'Literata-Italic', Georgia, serif;
        font-style: italic;
      }
      
      strong, b {
        font-family: 'Literata-Bold', Georgia, serif;
        font-weight: 700;
      }
      
      a {
        color: ${isDarkMode ? "#4A9EFF" : "#007AFF"};
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
        font-family: 'Literata-Italic', Georgia, serif;
        font-size: 18px;
        line-height: 28px;
        font-style: italic;
        border-left: 4px solid ${isDarkMode ? "#444" : "#ddd"};
        margin: 20px 0;
        padding-left: 20px;
        color: ${isDarkMode ? "#ccc" : "#666"};
      }
      
      ul, ol {
        margin: 16px 0;
        padding-left: 20px;
      }
      
      li {
        font-family: 'Literata-Regular', Georgia, serif;
        font-size: 18px;
        line-height: 28px;
        margin-bottom: 8px;
        color: ${isDarkMode ? "#ffffff" : "#000000"};
      }
      
      code {
        background-color: ${isDarkMode ? "#2d2d2d" : "#f6f6f6"};
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Monaco', 'Consolas', 'Liberation Mono', monospace;
        font-size: 16px;
      }
      
      pre {
        background-color: ${isDarkMode ? "#2d2d2d" : "#f6f6f6"};
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

  // Reset state when item changes
  useEffect(() => {
    setIsHtmlLoaded(false);
  }, [item.id]);

  const handleLoadComplete = () => {
    console.log("Content: handleLoadComplete called, setting isHtmlLoaded to true");
    setIsHtmlLoaded(true);
    if (onLoadComplete) {
      console.log("Content: calling parent onLoadComplete");
      onLoadComplete();
    }
  };

  // Show skeleton if content is not ready
  if (!content || !processedContent) {
    return <Skeleton isDark={isDarkMode} />;
  }

  return (
    <View style={styles.container}>
      <HTMLViewer
        content={processedContent}
        cssStyles={baseCSS}
        plugins={plugins}
        onLoadComplete={handleLoadComplete}
      />
      {!isHtmlLoaded && (
        <View
          style={[
            styles.skeletonContainer,
            { backgroundColor: isDarkMode ? "#000000" : "#ffffff" },
          ]}
        >
          <Skeleton isDark={isDarkMode} />
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
  skeletonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default Content;
