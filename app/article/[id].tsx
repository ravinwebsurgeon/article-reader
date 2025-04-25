// src/screens/ArticleDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Share, Alert, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

// Import themed components and hooks
import { ThemeView, ThemeText, ThemeTouchable, ThemeButton, ThemeImage } from '@/components/core';
import { useTheme, useDarkMode } from '@/theme/hooks';

// Import database hooks
import { useDatabase } from '@/database/provider/DatabaseProvider';
import { updateItem, deleteItem } from '@/database/hooks/useItems';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withObservables } from '@nozbe/watermelondb/react';
import { ScrollView } from 'react-native-gesture-handler';
import { COLORS } from '@/theme';

// ItemDetailComponent receives the item from the HOC below
const ItemDetailComponent = ({ item, onBack }) => {
  const router = useRouter();
  const theme = useTheme();
  const isDarkMode = useDarkMode();

  // State
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);

  // Helper functions
  const formatDate = (date) => {
    if (!date) return '';
    return format(new Date(date), 'MMM d, yyyy');
  };

  // Calculate read time
  const calculateReadTime = (wordCount) => {
    if (!wordCount) return 0;
    return Math.ceil(wordCount / 200); // Assuming average reading speed of 200 words per minute
  };

  const readTime = calculateReadTime(item.wordCount);

  // Handle back navigation
  const handleBack = () => {
    onBack ? onBack() : router.back();
  };

  // Handle read article
  const handleReadArticle = () => {
    router.push(`/reader/${item.id}`);
  };

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    try {
      await updateItem(item.id, { favorite: !item.favorite });
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  // Handle archive toggle
  const handleArchiveToggle = async () => {
    try {
      await updateItem(item.id, { archived: !item.archived });
    } catch (error) {
      Alert.alert('Error', 'Failed to update archive status');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    Alert.alert('Delete Article', 'Are you sure you want to delete this article?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(item.id);
            router.back();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete article');
          }
        },
      },
    ]);
  };

  // Handle share
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this article: ${item.title} - ${item.url}`,
        url: item.url,
      });
    } catch (error) {
      console.error('Error sharing article:', error);
    }
  };

  // Toggle action menu
  const toggleActionMenu = () => {
    setIsActionMenuVisible(!isActionMenuVisible);
  };

  if (!item) {
    return (
      <ThemeView style={{ flex: 1 }} centered>
        <ThemeText>Article not found</ThemeText>
        <ThemeButton title="Go Back" onPress={handleBack} style={{ marginTop: 16 }} />
      </ThemeView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background.default,
      }}
      edges={['top']}
    >
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Header */}
      <ThemeView style={styles.header} row>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleActionMenu}>
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </ThemeView>

      {/* Content */}
      <ThemeView style={styles.scrollView}>
        {item.imageUrl && <ThemeImage source={{ uri: item.imageUrl }} style={styles.thumbnail} size="fill" />}

        <ThemeView style={styles.content} padded="lg">
          <ThemeText variant="h4" style={styles.title}>
            {item.title}
          </ThemeText>

          <ThemeView style={styles.metaContainer} row>
            {item.siteName && (
              <ThemeText variant="body2" color={theme.colors.text.secondary}>
                {item.siteName}
              </ThemeText>
            )}

            <ThemeText variant="body2" color={theme.colors.text.secondary} style={styles.dotSeparator}>
              •
            </ThemeText>

            <ThemeText variant="body2" color={theme.colors.text.secondary}>
              {formatDate(item.publishedAt)}
            </ThemeText>

            {readTime > 0 && (
              <>
                <ThemeText variant="body2" color={theme.colors.text.secondary} style={styles.dotSeparator}>
                  •
                </ThemeText>
                <ThemeText variant="body2" color={theme.colors.text.secondary}>
                  {readTime} min read
                </ThemeText>
              </>
            )}
          </ThemeView>

          {/* Progress indicator */}
          {item.progress && parseFloat(item.progress) > 0 && (
            <ThemeView style={styles.progressContainer}>
              <ThemeView style={styles.progressBar}>
                <ThemeView
                  style={[
                    styles.progressFill,
                    {
                      width: `${parseFloat(item.progress) * 100}%`,
                      backgroundColor: theme.colors.primary.main,
                    },
                  ]}
                />
              </ThemeView>
              <ThemeText variant="caption" color={theme.colors.text.secondary}>
                {Math.round(parseFloat(item.progress) * 100)}% read
              </ThemeText>
            </ThemeView>
          )}

          {/* Article excerpt */}
          <ThemeText variant="body1" color={theme.colors.text.secondary} style={styles.excerpt}>
            {item.description || 'No description available.'}
          </ThemeText>
        </ThemeView>
      </ThemeView>

      {/* Action buttons */}
      <ThemeView style={styles.actionBar} row backgroundColor={theme.colors.background.paper} elevation={2}>
        <ThemeButton
          title="Read"
          variant="filled"
          size="md"
          color="primary"
          onPress={handleReadArticle}
          style={styles.readButton}
        />

        <ThemeView style={styles.actionButtons} row>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleFavoriteToggle}
            // disabled={isTogglingFavorite}
          >
            <Ionicons
              name={item.favorite ? 'star' : 'star-outline'}
              size={24}
              color={item.favorite ? theme.colors.favorite : theme.colors.text.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleArchiveToggle}
            // disabled={isTogglingArchive}
          >
            <Ionicons name="archive-outline" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>

          <ThemeTouchable style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color={theme.colors.text.primary} />
          </ThemeTouchable>

          <TouchableOpacity style={styles.actionMenuItem} onPress={toggleActionMenu}>
            <Ionicons name="trash-outline" size={22} color={COLORS.error.main} />
          </TouchableOpacity>
        </ThemeView>
      </ThemeView>

      {/* Action Menu Modal */}
      {isActionMenuVisible && (
        <ThemeView style={styles.actionMenuOverlay}>
          <ThemeTouchable style={styles.actionMenuBackdrop} onPress={toggleActionMenu} activeOpacity={1} />

          <ThemeView
            style={styles.actionMenu}
            backgroundColor={theme.colors.background.paper}
            rounded="md"
            elevation={3}
          >
            <ThemeTouchable
              style={styles.actionMenuItem}
              onPress={() => {
                handleShare();
                toggleActionMenu();
              }}
            >
              <Ionicons name="share-outline" size={22} color={theme.colors.text.primary} />
              <ThemeText variant="body1" style={styles.actionMenuText}>
                Share
              </ThemeText>
            </ThemeTouchable>

            <ThemeTouchable
              style={styles.actionMenuItem}
              onPress={() => {
                handleFavoriteToggle();
                toggleActionMenu();
              }}
            >
              <Ionicons
                name={item.favorite ? 'star' : 'star-outline'}
                size={22}
                color={item.favorite ? theme.colors.favorite : theme.colors.text.primary}
              />
              <ThemeText variant="body1" style={styles.actionMenuText}>
                {item.favorite ? 'Unfavorite' : 'Favorite'}
              </ThemeText>
            </ThemeTouchable>

            <ThemeTouchable
              style={styles.actionMenuItem}
              onPress={() => {
                handleArchiveToggle();
                toggleActionMenu();
              }}
            >
              <Ionicons name="archive-outline" size={22} color={theme.colors.text.primary} />
              <ThemeText variant="body1" style={styles.actionMenuText}>
                {item.archived ? 'Unarchive' : 'Archive'}
              </ThemeText>
            </ThemeTouchable>

            <ThemeTouchable
              style={styles.actionMenuItem}
              onPress={() => {
                toggleActionMenu();
                handleDelete();
              }}
            >
              <Ionicons name="trash-outline" size={22} color={theme.colors.error.main} />
              <ThemeText variant="body1" style={styles.actionMenuText} color={theme.colors.error.main}>
                Delete
              </ThemeText>
            </ThemeTouchable>
          </ThemeView>
        </ThemeView>
      )}
    </SafeAreaView>
  );
};

// HOC to observe a single item from the database
const enhanced = withObservables(['id'], ({ id, database }) => ({
  item: database.collections.get('items').findAndObserve(id),
}));

const EnhancedItemDetailComponent = enhanced(ItemDetailComponent);

// Wrapper component to handle params and provide database
export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams();
  const database = useDatabase();
  const router = useRouter();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [exists, setExists] = useState(true);

  // Check if the item exists
  useEffect(() => {
    const checkItem = async () => {
      try {
        await database.collections.get('items').find(id.toString());
        setExists(true);
      } catch (error) {
        console.error('Item not found:', error);
        setExists(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkItem();
  }, [id, database]);

  if (isLoading) {
    return (
      <ThemeView style={{ flex: 1 }} centered>
        <ThemeText>Loading article...</ThemeText>
      </ThemeView>
    );
  }

  if (!exists) {
    return (
      <ThemeView style={{ flex: 1 }} centered>
        <ThemeText>Article not found</ThemeText>
        <ThemeButton title="Go Back" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </ThemeView>
    );
  }

  return <EnhancedItemDetailComponent id={id.toString()} database={database} onBack={() => router.back()} />;
}

const styles = StyleSheet.create({
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  scrollView: {
    flex: 1,
  },
  thumbnail: {
    width: '100%',
    height: 240,
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: 16,
    lineHeight: 32,
  },
  metaContainer: {
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 16,
  },
  dotSeparator: {
    marginHorizontal: 6,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  excerpt: {
    lineHeight: 24,
    marginTop: 16,
  },
  actionBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  readButton: {
    paddingHorizontal: 30,
  },
  actionButtons: {
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 20,
    padding: 4,
  },
  actionMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  actionMenuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  actionMenu: {
    width: '80%',
    padding: 8,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionMenuText: {
    marginLeft: 16,
  },
});
