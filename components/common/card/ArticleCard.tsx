import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle, StyleProp, View } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, lightColors } from '@/theme';
import Item from '@/database/models/ItemModel';
import Tag from '@/database/models/TagModel';
import { Ionicons } from '@expo/vector-icons';
import { useDarkMode, useTheme } from '@/theme';
import { ThemeText } from '@/components/core';
import { scaler } from '@/utils';
import { withObservables } from '@nozbe/watermelondb/react';
import { format } from 'date-fns';

// Export a fixed height constant for use in FlatList
export const ARTICLE_CARD_HEIGHT = scaler(130);

interface ArticleCardProps {
  item: Item;
  tags: Tag[];
  onPress: () => void;
  onMenuPress: () => void;
  style?: StyleProp<ViewStyle>;
}

const ArticleCardComponent: React.FC<ArticleCardProps> = ({
  item,
  tags,
  onPress,
  onMenuPress,
  style,
}) => {
  const theme = useTheme();
  const dark = useDarkMode();

  // console.log('ArticleCard', item);
  const formatReadTime = (minutes: number) => {
    return `${minutes} min`;
  };

  // console.log('item in article card', item);

  console.log('render article card', item.id);

  const formatDate = (date: string | number | Date | null | undefined): string => {
    if (!date) return '';
    return format(new Date(date), 'MMM d, yyyy');
  };

  const readTime = item.readTime;

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
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <View style={styles.header}>
              <ThemeText numberOfLines={2} variant="h7" style={styles.title}>
                {item.title}
              </ThemeText>
            </View>
            <View style={styles.metaContainer}>
              <ThemeText
                numberOfLines={1}
                color={theme.colors.text.secondary}
                style={styles.source}
                variant="caption"
              >
                {item.siteName || item.domain}
              </ThemeText>
              <ThemeText variant="caption" color={theme.colors.text.secondary} style={styles.dot}>
                •
              </ThemeText>
              <ThemeText
                variant="caption"
                color={theme.colors.text.secondary}
                style={styles.readTime}
              >
                {formatReadTime(readTime)}
              </ThemeText>
              {/* <ThemeText variant="caption" color={theme.colors.text.secondary} style={styles.dot}>
                •
              </ThemeText>
              <ThemeText numberOfLines={1} color={theme.colors.text.secondary} style={styles.date}>
                {formatDate(item.publishedAt)}
              </ThemeText> */}
            </View>
          </View>
          {item.imageUrl && (
            <View style={styles.thumbnailContainer}>
              <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} contentFit="cover" />
            </View>
          )}
        </View>

        <View style={styles.tagsContainer}>
          {item.favorite && (
            <View style={styles.favoriteContainer}>
              <Ionicons name="star" size={16} color={COLORS.favorite} />
            </View>
          )}

          {tags.map((tag: Tag, index: number) => (
            <View key={index} style={styles.tagContainer}>
              <Ionicons name="pricetag-outline" size={14} color={COLORS.darkGray} />
              <ThemeText numberOfLines={1} style={styles.tagText}>
                {tag.name}
              </ThemeText>
            </View>
          ))}

          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
            <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: scaler(16),
    borderBottomWidth: scaler(0.5),
    height: ARTICLE_CARD_HEIGHT,
  },
  contentContainer: {
    flex: 1,
  },
  cardTop: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: scaler(8),
  },
  cardTopLeft: {
    flex: 1,
  },
  header: {
    marginBottom: scaler(8),
  },
  title: {
    lineHeight: scaler(22),
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaler(8),
  },
  source: {
    color: COLORS.darkGray,
  },
  dot: {
    color: COLORS.darkGray,
    marginHorizontal: scaler(4),
  },
  readTime: {
    color: COLORS.darkGray,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: scaler(4),
  },
  favoriteContainer: {
    marginRight: scaler(8),
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: scaler(8),
    paddingVertical: scaler(4),
    borderRadius: scaler(12),
    marginRight: scaler(8),
    marginBottom: scaler(4),
  },
  tagText: {
    color: COLORS.darkGray,
    marginLeft: scaler(4),
  },
  menuButton: {
    marginLeft: 'auto',
    padding: scaler(4),
  },
  thumbnailContainer: {
    width: scaler(80),
    height: scaler(55),
    borderRadius: scaler(4),
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  date: {
    color: COLORS.darkGray,
  },
});

// Enhance the component to observe the 'item' and its 'tags'
const enhance = withObservables(['item'], ({ item }: { item: Item }) => ({
  item: item.observe(),
  tags: item.tags.observe(),
}));

export default enhance(ArticleCardComponent);
