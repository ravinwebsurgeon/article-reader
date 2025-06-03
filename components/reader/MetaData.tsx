import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { Image } from "expo-image";
import { ThemeView, ThemeText } from "@/components/primitives";
import { useTheme } from "@/theme/hooks";
import Item from "@/database/models/ItemModel";
import ItemContent from "@/database/models/ItemContentModel";

interface MetaDataProps {
  item: Item;
  content: ItemContent | null;
  showFeatureImage?: boolean;
}

export const MetaData: React.FC<MetaDataProps> = ({ item, content, showFeatureImage = true }) => {
  const theme = useTheme();

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

    // Look for various types of image elements in the processed HTML
    const imagePatterns = [
      /<img[^>]+>/i, // Standard img tags
      /<figure[^>]*>[\s\S]*?<img[^>]+>/i, // Figure elements with images
      /<picture[^>]*>[\s\S]*?<img[^>]+>/i, // Picture elements with images
      /<svg[^>]*>[\s\S]*?<\/svg>/i, // SVG elements
    ];

    // Return true if any pattern is found in the content
    return imagePatterns.some((pattern) => pattern.test(content.content || ""));
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
      <ThemeText variant="reader.title" style={styles.title}>
        {item.title}
      </ThemeText>

      {/* Article metadata */}
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
          <ThemeText variant="meta" color={theme.colors.text.secondary} style={styles.publishedAt}>
            {formatDate(item.publishedAt)} {item.readTime && `• ${item.readTime} min`}
          </ThemeText>
        )}
      </ThemeView>

      {/* Feature image */}
      {shouldShowFeatureImage && item.imageUrl && (
        <ThemeView style={styles.imageContainer}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.featureImage}
            resizeMode="cover"
            placeholder={
              item.imageThumbHash
                ? { uri: `data:image/png;base64,${item.imageThumbHash}` }
                : undefined
            }
          />
        </ThemeView>
      )}
    </ThemeView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  source: {
    marginBottom: 16,
  },
  title: {
    fontWeight: 100,
    marginBottom: 16,
    fontFamily: "Literata-ExtraBold",
    lineHeight: 38,
    letterSpacing: 0,
    fontSize: 32,
  },
  metaContainer: {
    marginBottom: 24,
  },
  dek: {
    fontWeight: 400,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
    textAlign: "left",
    fontFamily: "Inter-Regular",
    marginBottom: 16,
  },
  author: {
    fontWeight: 400,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0,
    textAlign: "left",
    fontFamily: "Inter-Regular",
    marginBottom: 4,
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
    marginBottom: 24,
    width: "100%",
    borderRadius: 0,
    overflow: "hidden",
  },
  featureImage: {
    width: "100%",
    height: 300,
    borderRadius: 0,
  },
});

export default MetaData;
