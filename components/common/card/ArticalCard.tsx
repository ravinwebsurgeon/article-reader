import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '@/assets';
import { Item } from '@/types/item';
import { Ionicons } from '@expo/vector-icons';

interface ArticleCardProps {
  item: Item;
  onPress: () => void;
  onMenuPress: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ item, onPress, onMenuPress }) => {
  console.log('ArticleCard', item);
  const formatReadTime = (minutes: number) => {
    return `${minutes} min`;
  };

  // Calculate approximate read time based on word count (average 200-250 words per minute)
  const calculateReadTime = (wordCount: number) => {
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} min`;
  };

  // Format publish date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text numberOfLines={2} style={styles.title}>
            {item.title}
          </Text>
        </View>
        <View style={styles.metaContainer}>
          <Text style={styles.source}>{item.site_name || item.domain}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.readTime}>{calculateReadTime(item.word_count)}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.date}>{formatDate(item.published_at)}</Text>
        </View>
        <View style={styles.tagsContainer}>
          {item.favorite && (
            <View style={styles.favoriteContainer}>
              <Ionicons name="star" size={16} color={COLORS.yellow} />
            </View>
          )}
          
          {item.tags && item.tags.map((tag, index) => (
            <View key={index} style={styles.tagContainer}>
              <Ionicons name="pricetag-outline" size={14} color={COLORS.darkGray} />
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={onMenuPress}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>
      </View>
      
      {item.image_url && (
        <View style={styles.thumbnailContainer}>
          <Image 
            source={{ uri: item.image_url }} 
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
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.colorTextInputBorder,
    backgroundColor: COLORS.white,
  },
  contentContainer: {
    flex: 1,
    marginRight: 12,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 22,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  source: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  dot: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginHorizontal: 4,
  },
  readTime: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
  },
  favoriteContainer: {
    marginRight: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  menuButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 4,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
});

export default ArticleCard;