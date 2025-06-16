import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { Image } from "expo-image";
import { ThemeView, ThemeText } from "@/components/primitives";
import { useTheme, useSpacing } from "@/theme/hooks";
import Item from "@/database/models/ItemModel";
import ItemContent from "@/database/models/ItemContentModel";

interface MetaDataProps {
  item: Item;
  content: ItemContent | null;
  showFeatureImage?: boolean;
}

export const ReaderMetaData: React.FC<MetaDataProps> = ({
  item,
  content,
  showFeatureImage = true,
}) => {
  const theme = useTheme();
  const spacing = useSpacing();

  // Create styles using theme values
  // TODO: Revisit spacing values
  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: spacing.lg - spacing.xs, // 20px equivalent
      paddingTop: spacing.lg - spacing.xs, // 20px equivalent
    },
    source: {
      marginBottom: spacing.md,
    },
    title: {
      fontWeight: 100,
      marginBottom: spacing.md,
      fontFamily: "Literata-ExtraBold",
      lineHeight: 38,
      letterSpacing: 0,
      fontSize: 32,
    },
    metaContainer: {
      marginBottom: spacing.lg + spacing.sm, // 32px equivalent
    },
    dek: {
      fontWeight: 400,
      fontSize: 18,
      lineHeight: 24,
      letterSpacing: 0,
      textAlign: "left",
      fontFamily: "Inter-Regular",
      marginBottom: spacing.md,
    },
    author: {
      fontWeight: 400,
      fontSize: 16,
      lineHeight: 20,
      letterSpacing: 0,
      textAlign: "left",
      fontFamily: "Inter-Regular",
      marginBottom: spacing.xs,
    },
    publishedAt: {
      fontWeight: 400,
      fontSize: 16,
      lineHeight: 20,
      letterSpacing: 0,
      textAlign: "left",
      fontFamily: "Inter-Regular",
      marginBottom: 0,
    },
    imageContainer: {
      marginBottom: spacing.sm + spacing.xs, // 10px equivalent
      width: "100%",
      borderRadius: 8,
      overflow: "hidden",
    },
    featureImage: {
      width: "100%",
      aspectRatio: 16 / 9,
      resizeMode: "cover",
      borderRadius: 8,
    },
  });

  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Check if content has images to determine whether to show feature image
  const contentHasImage = useMemo(() => {
    if (!content?.content) return false;

    // Look for markdown image syntax: ![alt text](url)
    const markdownImagePattern = /!\[.*?\]\(.*?\)/;

    // Return true if markdown image is found in the content
    return markdownImagePattern.test(content.content);
  }, [content?.content]);

  const shouldShowFeatureImage = showFeatureImage && item.imageUrl && !contentHasImage;

  return (
    <ThemeView style={styles.container}>
      {/* Source */}
      {item.source && (
        <ThemeText variant="meta" color={theme.colors.text.secondary} style={styles.source}>
          {item.source}
        </ThemeText>
      )}

      {/* Title */}
      {item.title && (
        <ThemeText variant="reader.title" style={styles.title}>
          {item.title}
        </ThemeText>
      )}

      {/* Article metadata */}
      {(content?.dek ?? content?.author ?? item.publishedAt) && (
        <ThemeView style={styles.metaContainer}>
          {/* Dek/Subtitle */}
          {content?.dek && (
            <ThemeText variant="meta" color={theme.colors.text.primary} style={styles.dek}>
              {content.dek}
            </ThemeText>
          )}

          {/* Author */}
          {content?.author && (
            <ThemeText variant="meta" color={theme.colors.text.primary} style={styles.author}>
              {content.author}
            </ThemeText>
          )}

          {/* Published date and read time */}
          {item.publishedAt && (
            <ThemeText
              variant="meta"
              color={theme.colors.text.secondary}
              style={styles.publishedAt}
            >
              {formatDate(item.publishedAt)} {item.readTime && `• ${item.readTime} min`}
            </ThemeText>
          )}
        </ThemeView>
      )}

      {/* Feature image */}
      {shouldShowFeatureImage && item.imageUrl && (
        <ThemeView style={styles.imageContainer}>
          <Image source={{ uri: item.imageUrl }} style={styles.featureImage} />
        </ThemeView>
      )}
    </ThemeView>
  );
};

export default ReaderMetaData;
