import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SvgIcon } from '@/components/SvgIcon';
import { ThemeText } from '@/components/core';
import { useColors, useTypography } from '@/theme/hooks';
import { scaler } from '@/utils';
import Tag from '@/database/models/TagModel';

export interface TagListProps {
  tags: Tag[];
  selectedTagIds?: Set<string>;
  onTagPress?: (tag: Tag) => void;
  title?: string;
  maxHeight?: number;
  emptyMessage?: string;
}

/**
 * Reusable component for displaying a list of tags
 * Features:
 * - Optional selection state
 * - Optional section title
 * - Customizable empty state message
 * - Consistent styling
 */
const TagList: React.FC<TagListProps> = ({
  tags,
  selectedTagIds,
  onTagPress,
  title,
  maxHeight,
  emptyMessage = 'No tags found',
}) => {
  const colors = useColors();
  const typography = useTypography();

  // Render a single tag item
  const renderTagItem = useCallback(
    ({ item }: { item: Tag }) => {
      const isSelected = selectedTagIds?.has(item.id) || false;

      return (
        <TouchableOpacity
          style={styles.tagItem}
          onPress={() => onTagPress?.(item)}
          activeOpacity={0.7}
          disabled={!onTagPress}
        >
          <ThemeText style={[styles.tagText, typography.body2]}>{item.name}</ThemeText>

          {onTagPress && (
            <View style={styles.iconContainer}>
              {isSelected ? (
                <View style={[styles.selectedCircle, { backgroundColor: colors.primary.main }]}>
                  <SvgIcon name="check" size={14} color={colors.white} />
                </View>
              ) : (
                <View style={[styles.circle, { borderColor: colors.gray[300] }]}>
                  <SvgIcon name="circle-plus" size={24} color={colors.gray[500]} />
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [onTagPress, selectedTagIds, colors, typography],
  );

  // Display empty state if no tags
  const renderEmptyComponent = useCallback(() => {
    return (
      <View style={styles.emptyContainer}>
        <ThemeText style={[styles.emptyText, { color: colors.gray[400] }]}>
          {emptyMessage}
        </ThemeText>
      </View>
    );
  }, [emptyMessage, colors.gray]);

  return (
    <View>
      {/* Optional Section Title */}
      {title && (
        <ThemeText style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {title}
        </ThemeText>
      )}

      {/* Tag List */}
      <View style={[styles.listContainer, maxHeight && { maxHeight }]}>
        {tags.length === 0 ? (
          renderEmptyComponent()
        ) : (
          <FlatList
            data={tags}
            renderItem={renderTagItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            scrollEnabled={tags.length > 5}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    width: '100%',
  },
  listContent: {
    paddingBottom: scaler(8),
  },
  sectionTitle: {
    fontSize: scaler(16),
    fontWeight: '600',
    lineHeight:scaler(24),
    marginVertical: scaler(8),
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaler(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  tagText: {
    flex: 1,
  },
  iconContainer: {
    marginLeft: scaler(8),
  },
  selectedCircle: {
    width: scaler(24),
    height: scaler(24),
    borderRadius: scaler(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: scaler(24),
    height: scaler(24),
    borderRadius: scaler(12),
    // borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: scaler(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: scaler(14),
    fontStyle: 'italic',
  },
});

export default TagList;
