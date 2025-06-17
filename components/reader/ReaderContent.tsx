import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { StyleSheet, View, Animated, TouchableOpacity } from "react-native";
import { marked } from "marked";
import { useTheme, useSpacing } from "@/theme/hooks";
import { ThemeText } from "@/components/primitives";
import { useTranslation } from "react-i18next";
import ContentStateMessage from "./ContentStateMessage";
import HTMLViewer from "./htmlviewer/HTMLViewer";
import { AutoResizePlugin } from "./htmlviewer/plugins/AutoResizePlugin";
import { HighlightsPlugin, HighlightsPluginCallbacks } from "./htmlviewer/plugins/HighlightsPlugin";
import Item, { ExtractStatus } from "@/database/models/ItemModel";
import ItemContent from "@/database/models/ItemContentModel";
import Annotation from "@/database/models/AnnotationModel";
import ReaderSkeleton from "./ReaderSkeleton";
import { useDatabase } from "@/database/provider/DatabaseProvider";
import { leterataFontBase64 } from "@/constants/leterataFontBase64";
import { literataBold18base64 } from "@/constants/literateBold18Base64";
import {
  withItemAnnotations,
  createAnnotation,
  deleteAnnotationById,
  findAnnotationByText,
  annotationToHighlightData,
  HighlightData,
} from "@/database/hooks/withAnnotations";

interface ContentProps {
  item: Item;
  content: ItemContent | null;
  annotations: Annotation[]; // Provided by HOC
  onLoadComplete?: () => void;
  onSwitchToWebView?: () => void;
}

const ReaderContentComponent: React.FC<ContentProps> = ({
  item,
  content,
  annotations,
  onLoadComplete,
  onSwitchToWebView,
}) => {
  const theme = useTheme();
  const spacing = useSpacing();
  const { syncEngine } = useDatabase();
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const highlightsPluginRef = useRef<HighlightsPlugin | null>(null);

  // State
  const [isHtmlLoaded, setIsHtmlLoaded] = useState(false);
  const [isFetchingContent, setIsFetchingContent] = useState(false);
  const [waybackData, setWaybackData] = useState<{ available: boolean; url?: string } | null>(null);
  const [isCheckingWayback, setIsCheckingWayback] = useState(false);

  // Create styles using theme values
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

  // Convert annotations to highlight data
  const highlights = useMemo((): HighlightData[] => {
    return annotations.map(annotationToHighlightData);
  }, [annotations]);

  // Update plugin highlights whenever they change
  useEffect(() => {
    if (highlightsPluginRef.current) {
      highlightsPluginRef.current.setHighlights(highlights);
    }
  }, [highlights]);

  // Handle highlight creation
  const handleHighlightAdded = useCallback(
    async (text: string, prefix?: string, suffix?: string) => {
      if (!item?.id) return;

      try {
        // Check if annotation already exists
        const existing = await findAnnotationByText(item.id, text, prefix, suffix);
        if (existing) {
          return;
        }

        // Create new annotation (database update will trigger highlights re-render via HOC)
        await createAnnotation(item.id, text, prefix, suffix);
      } catch (error) {
        console.error("ReaderContent: Error creating highlight:", error);
      }
    },
    [item?.id],
  );

  // Handle highlight removal
  const handleHighlightRemoved = useCallback(async (highlightId: string) => {
    try {
      // Remove from database (database update will trigger highlights re-render via HOC)
      await deleteAnnotationById(highlightId);
    } catch (error) {
      console.error("ReaderContent: Error removing highlight:", error);
    }
  }, []);

  // Plugin callbacks
  const highlightsCallbacks: HighlightsPluginCallbacks = useMemo(
    () => ({
      onHighlightAdded: handleHighlightAdded,
      onHighlightRemoved: handleHighlightRemoved,
    }),
    [handleHighlightAdded, handleHighlightRemoved],
  );

  // Process markdown content
  const processedContent = useMemo(() => {
    let raw = content?.content ?? "";

    // If no main content, use description as fallback
    if (!raw && content?.description) {
      raw = content.description;
    }

    return marked.parse(raw) as string;
  }, [content?.content, content?.description]);

  // Base styles for the article content using theme colors
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
        --text-color: ${theme.colors.text.primary};
        --bg-color: ${theme.colors.background.default};
        --link-color: ${theme.colors.primary.main};
        --blockquote-border: ${theme.colors.gray[300]};
        --blockquote-color: ${theme.colors.text.secondary};
        --code-bg: ${theme.colors.gray[100]};
      }

      html, body {
        font-family: 'Literata', Georgia, serif;
        font-size: 18px;
        line-height: 28px;
        font-weight: 400;
        padding: 0 ${spacing.sm + spacing.xs}px; /* 10px equivalent */
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
        margin: ${spacing.lg}px 0 ${spacing.md}px 0;
      }
      
      h2 {
        font-size: 22px;
        line-height: 30px;
        font-weight: 700;
        margin: ${spacing.lg + spacing.xs}px 0 ${spacing.md - spacing.xs}px 0; /* 22px 0 14px 0 */
      }
      
      h3 {
        font-size: 20px;
        line-height: 28px;
        font-weight: 600;
        margin: ${spacing.lg - spacing.xs}px 0 ${spacing.md - spacing.xs}px 0; /* 20px 0 12px 0 */
      }
      
      h4, h5, h6 {
        font-size: 18px;
        line-height: 26px;
        font-weight: 600;
        margin: ${spacing.md + spacing.xs}px 0 ${spacing.sm + spacing.xs}px 0; /* 18px 0 10px 0 */
      }
      
      p {
        margin-bottom: ${spacing.md}px;
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
        margin: ${spacing.lg - spacing.xs}px 0; /* 20px 0 */
        border-radius: 8px;
      }
      
      blockquote {
        font-style: italic;
        border-left: 4px solid var(--blockquote-border);
        margin: ${spacing.lg - spacing.xs}px 0; /* 20px 0 */
        padding-left: ${spacing.lg - spacing.xs}px; /* 20px */
        color: var(--blockquote-color);
      }
      
      ul, ol {
        margin: ${spacing.md}px 0;
        padding-left: ${spacing.lg - spacing.xs}px; /* 20px */
      }
      
      li {
        margin-bottom: ${spacing.sm}px;
        color: var(--text-color);
      }
      
      code {
        background-color: var(--code-bg);
        padding: ${spacing.xxs}px ${spacing.sm - spacing.xs}px; /* 2px 6px */
        border-radius: 4px;
        font-family: 'Monaco', 'Consolas', 'Liberation Mono', monospace;
        font-size: 16px;
      }
      
      pre {
        background-color: var(--code-bg);
        padding: ${spacing.md}px;
        border-radius: ${spacing.sm}px;
        overflow-x: auto;
        margin: ${spacing.lg - spacing.xs}px 0; /* 20px 0 */
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
        padding: 0 ${spacing.xxs}px; /* 0 2px */
        margin: 0 -${spacing.xxs}px; /* 0 -2px */
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
    [theme.colors, spacing],
  );

  // Create plugins
  const plugins = useMemo(() => {
    const highlightsPlugin = new HighlightsPlugin(highlightsCallbacks);
    highlightsPluginRef.current = highlightsPlugin;

    return [new AutoResizePlugin(), highlightsPlugin];
  }, [highlightsCallbacks]);

  const handleLoadComplete = () => {
    setIsHtmlLoaded(true);
    // Fade in the content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    if (onLoadComplete) {
      onLoadComplete();
    }
  };

  // Reset state when item changes
  useEffect(() => {
    setIsHtmlLoaded(false);
    fadeAnim.setValue(0);
  }, [item.id, fadeAnim]);

  // Check for missing content and trigger sync
  useEffect(() => {
    const fetchMissingContent = async () => {
      // Only fetch if item has content_hash but no content
      if (item.contentHash && !content && !isFetchingContent) {
        setIsFetchingContent(true);
        try {
          await syncEngine.syncItemContent(item.id);
        } catch (error) {
          console.error(`ReaderContent: Failed to fetch content for item ${item.id}:`, error);
        } finally {
          setIsFetchingContent(false);
        }
      }
    };

    fetchMissingContent();
  }, [item, content, isFetchingContent, syncEngine]);

  // Check wayback availability when needed
  const checkWayback = useCallback(async () => {
    if (!item.url || waybackData !== null || isCheckingWayback) return;

    setIsCheckingWayback(true);
    try {
      const response = await fetch(
        `https://archive.org/wayback/available?url=${encodeURIComponent(item.url)}`,
      );
      const data = await response.json();

      if (data.archived_snapshots?.closest?.available) {
        setWaybackData({
          available: true,
          url: data.archived_snapshots.closest.url,
        });
      } else {
        setWaybackData({ available: false });
      }
    } catch (error) {
      console.error("Failed to check wayback availability:", error);
      setWaybackData({ available: false });
    } finally {
      setIsCheckingWayback(false);
    }
  }, [item.url, waybackData, isCheckingWayback]);

  // Handle different content states
  const extractStatus = item.extractStatus;

  // Check if we have any fallback content to show
  const hasFallbackContent = content?.description;

  // Show appropriate message based on extract status and content availability
  if (!content || (!content.content && !hasFallbackContent)) {
    if (
      extractStatus === ExtractStatus.PENDING ||
      extractStatus === ExtractStatus.EXTRACTING ||
      extractStatus === ExtractStatus.RETRYING
    ) {
      return <ContentStateMessage message={t("reader.content.extracting")} />;
    }
    if (extractStatus === ExtractStatus.FAILED) {
      return (
        <ContentStateMessage
          message={t("reader.content.pageNotAvailable")}
          showWaybackLink={true}
          waybackData={waybackData}
          isCheckingWayback={isCheckingWayback}
          onCheckWayback={checkWayback}
          itemUrl={item.url}
        />
      );
    }
    if (extractStatus === ExtractStatus.UNAVAILABLE) {
      return (
        <ContentStateMessage
          message={t("reader.content.pageNoLongerAvailable")}
          showWaybackLink={true}
          waybackData={waybackData}
          isCheckingWayback={isCheckingWayback}
          onCheckWayback={checkWayback}
          itemUrl={item.url}
        />
      );
    }
    if (extractStatus === ExtractStatus.UNSUPPORTED) {
      return <ContentStateMessage message={t("reader.content.contentTypeNotSupported")} />;
    }
    if (extractStatus === ExtractStatus.COMPLETED && item.isWebOnly) {
      return (
        <ContentStateMessage
          message={t("reader.content.contentBestViewedOnWeb")}
          showWebLink={true}
          onSwitchToWebView={onSwitchToWebView}
          itemUrl={item.url}
        />
      );
    }

    // Fallback for missing content
    return <ReaderSkeleton />;
  }

  // Show skeleton if content exists but processed content is not ready
  if (!processedContent) {
    return <ReaderSkeleton />;
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
        {item.paywalled && (
          <View
            style={{
              padding: spacing.lg,
              backgroundColor: theme.colors.gray[50],
              borderRadius: 8,
              margin: spacing.md,
              alignItems: "center",
            }}
          >
            <ThemeText
              variant="caption"
              style={{
                textAlign: "center",
                marginBottom: spacing.md,
                color: theme.colors.text.subtle,
                fontStyle: "italic",
              }}
            >
              {t("reader.content.paywallNotice")}
            </ThemeText>
            {onSwitchToWebView && (
              <TouchableOpacity
                onPress={onSwitchToWebView}
                style={{
                  backgroundColor: theme.colors.primary.main,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: 8,
                }}
              >
                <ThemeText variant="button" style={{ color: theme.colors.white }}>
                  {t("reader.content.viewFullArticleOnWeb")}
                </ThemeText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.View>
      {!isHtmlLoaded && (
        <View style={styles.loading}>
          <ReaderSkeleton />
        </View>
      )}
    </View>
  );
};

// Export the component wrapped with the annotations HOC
export const ReaderContent = withItemAnnotations()(ReaderContentComponent);

export default ReaderContent;
