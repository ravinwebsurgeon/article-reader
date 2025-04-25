import React from "react";
import {
  StyleSheet,
  Image,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  View,
} from "react-native";
import { COLORS, lightColors } from "@/theme";
import { Item } from "@/types/item";
import { Ionicons } from "@expo/vector-icons";
import { useDarkMode, useTheme } from "@/theme";
import { ThemeText, ThemeTouchable, ThemeView } from "@/components/core";
import { scaler } from "@/utils";

interface ArticleCardProps {
  item: Item;
  onPress: () => void;
  onMenuPress: () => void;
  style?: StyleProp<ViewStyle>;
}

const ArticleCard: React.FC<ArticleCardProps> = ({
  item,
  onPress,
  onMenuPress,
  style,
}) => {
  const theme = useTheme();
  const dark = useDarkMode();
  console.log("ArticleCard", item);
  const formatReadTime = (minutes: number) => {
    return `${minutes} min`;


  };

  console.log("item in article card", item);

  // Calculate approximate read time based on word count (average 200-250 words per minute)
  const calculateReadTime = (wordCount: number) => {
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} min`;
  };

  // Format publish date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        style,
        {
          borderBottomColor: dark ? COLORS.text : lightColors.divider,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <ThemeText numberOfLines={2} style={styles.title}>
            {item.title}
          </ThemeText>
        </View>
        <View style={styles.metaContainer}>
          <ThemeText color={theme.colors.text.secondary} style={styles.source}>
            {item.site_name || item.domain}
          </ThemeText>
          <ThemeText
            variant="caption"
            color={theme.colors.text.secondary}
            style={styles.dot}
          >
            •
          </ThemeText>
          <ThemeText
            variant="caption"
            color={theme.colors.text.secondary}
            style={styles.readTime}
          >
            {calculateReadTime(item.word_count)}
          </ThemeText>
          <ThemeText
            variant="caption"
            color={theme.colors.text.secondary}
            style={styles.dot}
          >
            •
          </ThemeText>
          <ThemeText
            // variant="caption"
            color={theme.colors.text.secondary}
            style={styles.date}
          >
            {formatDate(item.published_at)}
          </ThemeText>
        </View>
        <View style={styles.tagsContainer}>
          {item.favorite && (
            <View style={styles.favoriteContainer}>
              <Ionicons name="star" size={16} color={COLORS.favorite} />
            </View>
          )}

          {item.tags &&
            item.tags.map((tag, index) => (
              <View key={index} style={styles.tagContainer}>
                <Ionicons
                  name="pricetag-outline"
                  size={14}
                  color={COLORS.darkGray}
                />
                <ThemeText style={styles.tagText}>{tag}</ThemeText>
              </View>
            ))}

          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={COLORS.darkGray}
            />
          </TouchableOpacity>
        </View>
      </View>

      {item.imageUrl && (
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: scaler(16),
    borderBottomWidth: scaler(0.5),
  },
  contentContainer: {
    flex: 1,
    marginRight: scaler(12),
  },
  header: {
    marginBottom: scaler(8),
  },
  title: {
    fontSize: scaler(16),
    fontWeight: "600",
    lineHeight: scaler(22),
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scaler(8),
  },
  source: {
    fontSize: scaler(14),
    color: COLORS.darkGray,
  },
  dot: {
    fontSize: scaler(14),
    color: COLORS.darkGray,
    marginHorizontal: scaler(4),
  },
  readTime: {
    fontSize: scaler(14),
    color: COLORS.darkGray,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: scaler(4),
  },
  favoriteContainer: {
    marginRight: scaler(8),
  },
  tagContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: scaler(8),
    paddingVertical: scaler(4),
    borderRadius: scaler(12),
    marginRight: scaler(8),
    marginBottom: scaler(4),
  },
  tagText: {
    fontSize: scaler(12),
    color: COLORS.darkGray,
    marginLeft: scaler(4),
  },
  menuButton: {
    marginLeft: "auto",
    padding: scaler(4),
  },
  thumbnailContainer: {
    width: scaler(80),
    height: scaler(80),
    borderRadius: scaler(4),
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
});

export default ArticleCard;
