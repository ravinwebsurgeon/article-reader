import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { ThemeText } from '@/components/core';
import { SvgIcon } from '@/components/SvgIcon';
import { useColors } from '@/theme/hooks';
import TagBadge from './TagBadge';
import { scaler } from '@/utils';
import Item from '@/database/models/ItemModel';
import Tag from '@/database/models/TagModel';
import { useTagManagement } from '@/utils/hooks';
import TagEditor from '@/screens/EditTag';

export interface TagSelectorProps {
  item: Item;
  onTagsChanged?: () => void;
  containerStyle?: any;
  title?: string;
  maxTags?: number;
  showAddButton?: boolean;
}

/**
 * TagSelector is a component for displaying and managing tags associated with an item
 * 
 * Features:
 * - Shows current tags as badges
 * - Ability to remove tags
 * - Opens TagEditor for adding/managing tags
 * - Optional limit on number of tags displayed
 */
const TagSelector: React.FC<TagSelectorProps> = ({
  item,
  onTagsChanged,
  containerStyle,
  title = 'Tags',
  maxTags,
  showAddButton = true,
}) => {
  const colors = useColors();
  
  // Tag state
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagEditorVisible, setTagEditorVisible] = useState(false);
  
  // Use tag management hook
  const { getItemTags } = useTagManagement(item);
  
  // Load tags for the item
  const loadTags = useCallback(async () => {
    try {
      setLoading(true);
      const itemTags = await getItemTags(item);
      setTags(itemTags);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  }, [item, getItemTags]);
  
  // Load tags when component mounts or item changes
  useEffect(() => {
    loadTags();
  }, [loadTags, item.id]);
  
  // Open tag editor
  const openTagEditor = useCallback(() => {
    setTagEditorVisible(true);
  }, []);
  
  // Close tag editor and refresh tags
  const closeTagEditor = useCallback(() => {
    setTagEditorVisible(false);
    loadTags();
    onTagsChanged?.();
  }, [loadTags, onTagsChanged]);
  
  // Remove a tag from the item
  const removeTag = useCallback(async (tag: Tag) => {
    try {
      await item.removeTag(tag);
      // Update local state for immediate UI feedback
      setTags(prev => prev.filter(t => t.id !== tag.id));
      onTagsChanged?.();
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  }, [item, onTagsChanged]);
  
  // Render tags or loading state
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary.main} />
        </View>
      );
    }
    
    if (tags.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ThemeText style={[styles.emptyText, { color: colors.gray[400] }]}>
            No tags yet
          </ThemeText>
        </View>
      );
    }
    
    // Limit tags if maxTags is specified
    const displayTags = maxTags && tags.length > maxTags
      ? tags.slice(0, maxTags)
      : tags;
    
    return (
      <View style={styles.tagsContainer}>
        {displayTags.map(tag => (
          <TagBadge
            key={tag.id}
            label={tag.name}
            onRemove={() => removeTag(tag)}
            size="medium"
          />
        ))}
        
        {/* Show count of hidden tags if maxTags is specified */}
        {maxTags && tags.length > maxTags && (
          <TouchableOpacity
            style={[
              styles.moreTagsButton,
              { backgroundColor: colors.gray[200] }
            ]}
            onPress={openTagEditor}
          >
            <ThemeText
              style={[styles.moreTagsText, { color: colors.text.secondary }]}
            >
              +{tags.length - maxTags} more
            </ThemeText>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  return (
    <>
      <View style={[styles.container, containerStyle]}>
        <View style={styles.headerContainer}>
          <ThemeText style={styles.title}>{title}</ThemeText>
          
          {showAddButton && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={openTagEditor}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <SvgIcon name="plus-circle" size={24} color={colors.primary.main} />
            </TouchableOpacity>
          )}
        </View>
        
        {renderContent()}
      </View>
      
      {/* Tag Editor Modal */}
      <TagEditor
        visible={tagEditorVisible}
        onClose={closeTagEditor}
        item={item}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: scaler(8),
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaler(8),
  },
  title: {
    fontSize: scaler(16),
    fontWeight: '600',
  },
  addButton: {
    padding: scaler(4),
  },
  loadingContainer: {
    height: scaler(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyContainer: {
    height: scaler(40),
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: scaler(14),
    fontStyle: 'italic',
  },
  moreTagsButton: {
    paddingHorizontal: scaler(12),
    paddingVertical: scaler(6),
    borderRadius: scaler(16),
    marginRight: scaler(8),
    marginBottom: scaler(8),
  },
  moreTagsText: {
    fontSize: scaler(14),
    fontWeight: '500',
  },
});

export default TagSelector;