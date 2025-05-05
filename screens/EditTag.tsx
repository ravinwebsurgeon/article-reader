import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme, useColors, useTypography } from '@/theme/hooks';
import { scaler } from '@/utils';
import { ThemeText, ThemeView } from '@/components/core';
import Tag from '@/database/models/TagModel';
import Item from '@/database/models/ItemModel';
import { SvgIcon } from '@/components/SvgIcon';
import { useTagManagement } from '@/utils/hooks';
import { TagBadge, TagList } from '@/components/common/tag';

/**
 * TagEditor component allows users to manage tags for an article
 * Features:
 * - Search existing tags
 * - Add new tags
 * - Select/deselect tags for the current article
 * - View tags in categorized sections (Recent, Other)
 */

// Define component props
export interface TagEditorProps {
  visible: boolean;
  onClose: () => void;
  item: Item;
}

const TagEditor: React.FC<TagEditorProps> = ({ visible, onClose, item }) => {
  const theme = useTheme();
  const colors = useColors();
  const typography = useTypography();

  // Input state
  const [tagText, setTagText] = useState('');
  const [searchResults, setSearchResults] = useState<Tag[]>([]);
  
  // Use the tag management hook
  const {
    allTags,
    recentTags,
    otherTags,
    selectedTagIds,
    isLoading,
    loadData,
    toggleTag,
    createTag,
    searchTags
  } = useTagManagement(item);
  
  // Load data when component mounts and is visible
  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, loadData]);
  
  // Update search results when input changes
  useEffect(() => {
    if (tagText.trim()) {
      setSearchResults(searchTags(tagText));
    } else {
      setSearchResults([]);
    }
  }, [tagText, searchTags]);
  
  // Handle tag creation
  const handleCreateTag = useCallback(async () => {
    if (!tagText.trim()) return;
    
    await createTag(tagText, true);
    setTagText(''); // Clear input field
  }, [tagText, createTag]);

  // Simple handlers
  const handleTextChange = useCallback((text: string) => {
    setTagText(text);/////
  }, []);

  const handleSubmit = useCallback(() => {
    handleCreateTag();
  }, [handleCreateTag]);

  // Filter displayed tags based on search state
  const displayedRecentTags = useMemo(() => 
    tagText.trim() ? [] : recentTags,
  [tagText, recentTags]);

  const displayedOtherTags = useMemo(() => 
    tagText.trim() ? [] : otherTags,
  [tagText, otherTags]);

  // Button state for add button
  const isAddButtonEnabled = useMemo(() => 
    tagText.trim().length > 0,
  [tagText]);

  // Get selected tags
  const selectedTags = useMemo(() => 
    allTags.filter(tag => selectedTagIds.has(tag.id)),
  [allTags, selectedTagIds]);

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <View style={[
            styles.container,
            { backgroundColor: colors.background.paper },
          ]}>
            {/* Header */}
            <View style={styles.header}>
              <ThemeText style={[styles.title, typography.h6]}>
                Edit Tags
              </ThemeText>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <ThemeText style={[styles.closeText, { color: colors.primary.main }]}>
                  Done
                </ThemeText>
              </TouchableOpacity>
            </View>

            {/* Search/Input Area */}
            <View style={[
              styles.searchContainer,
              { borderColor: colors.primary.light }
            ]}>
              <SvgIcon name="tag" size={20} color={colors.gray[500]} style={styles.searchIcon} />
              <TextInput
                style={[
                  styles.input,
                  typography.body1,
                  { color: colors.text.primary }
                ]}
                placeholder="Enter a Tag Name"
                placeholderTextColor={colors.gray[400]}
                value={tagText}
                onChangeText={handleTextChange}
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
                autoCorrect={false}
              />
            </View>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <View style={styles.selectedTagsContainer}>
                <FlatList
                  data={selectedTags}
                  renderItem={({ item }) => (
                    <TagBadge
                      key={item.id}
                      label={item.name}
                      onRemove={() => toggleTag(item)}
                    />
                  )}
                  keyExtractor={item => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.selectedTagsList}
                />
              </View>
            )}

            {/* Content */}
            <View style={styles.content}>
              {/* Show loading indicator when loading */}
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ThemeText>Loading tags...</ThemeText>
                </View>
              ) : (
                <>
                  {/* Search Results */}
                  {searchResults.length > 0 ? (
                    <TagList
                      tags={searchResults}
                      selectedTagIds={selectedTagIds}
                      onTagPress={toggleTag}
                      title="Search Results"
                      emptyMessage="No matching tags found"
                    />
                  ) : (
                    <>
                      {/* Recent Tags */}
                      {displayedRecentTags.length > 0 && (
                        <TagList
                          tags={displayedRecentTags}
                          selectedTagIds={selectedTagIds}
                          onTagPress={toggleTag}
                          title="Recent Tags"
                          emptyMessage="No recent tags found"
                        />
                      )}

                      {/* Other Tags */}
                      {displayedOtherTags.length > 0 && (
                        <TagList
                          tags={displayedOtherTags}
                          selectedTagIds={selectedTagIds}
                          onTagPress={toggleTag}
                          title="Other Tags"
                          emptyMessage="No other tags found"
                          maxHeight={scaler(300)}
                        />
                      )}
                    </>
                  )}
                </>
              )}
            </View>

            {/* Add Button (Keyboard Accessory View) */}
            <View style={[
              styles.keyboardAccessory,
              { backgroundColor: colors.gray[100] }
            ]}>
              <View style={styles.keyboardAccessoryContent}>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    isAddButtonEnabled
                      ? { backgroundColor: colors.primary.main }
                      : { backgroundColor: colors.gray[300] }
                  ]}
                  onPress={handleSubmit}
                  disabled={!isAddButtonEnabled}
                >
                  <ThemeText
                    style={[
                      styles.addButtonText,
                      { color: colors.white }
                    ]}
                  >
                    Add
                  </ThemeText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    marginTop: scaler(50),
    borderTopLeftRadius: scaler(20),
    borderTopRightRadius: scaler(20),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaler(16),
    paddingVertical: scaler(16),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontWeight: '600',
  },
  closeButton: {
    padding: scaler(4),
  },
  closeText: {
    fontSize: scaler(16),
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: scaler(16),
    paddingHorizontal: scaler(12),
    paddingVertical: scaler(8),
    borderWidth: 1,
    borderRadius: scaler(24),
  },
  searchIcon: {
    marginRight: scaler(8),
  },
  input: {
    flex: 1,
    padding: 0,
    height: scaler(40),
  },
  selectedTagsContainer: {
    paddingHorizontal: scaler(16),
    paddingBottom: scaler(8),
  },
  selectedTagsList: {
    paddingVertical: scaler(4),
  },
  content: {
    flex: 1,
    paddingHorizontal: scaler(16),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAccessory: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    paddingBottom: Platform.OS === 'ios' ? scaler(24) : scaler(8),
  },
  keyboardAccessoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaler(8),
    paddingHorizontal: scaler(16),
  },
  addButton: {
    paddingHorizontal: scaler(32),
    paddingVertical: scaler(10),
    borderRadius: scaler(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontWeight: '600',
  },
});

export default TagEditor;