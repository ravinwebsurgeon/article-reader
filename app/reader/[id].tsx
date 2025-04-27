import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Share,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/theme';
import { useAppSelector } from '@/redux/hook';
import { selectActiveTheme } from '@/redux/utils';
import { withObservables } from '@nozbe/watermelondb/react';
import { useDatabase } from '@/database/provider/DatabaseProvider';
import Item from '@/database/models/ItemModel';
import { RenderHTML } from 'react-native-render-html';
import { marked } from 'marked';

// Font sizes
const FONT_SIZES = {
  small: 16,
  medium: 18,
  large: 20,
  xlarge: 22,
};

// Reader themes
const READER_THEMES = {
  light: {
    backgroundColor: '#FFFFFF',
    textColor: '#212121',
  },
  sepia: {
    backgroundColor: '#F8F1E3',
    textColor: '#5B4636',
  },
  dark: {
    backgroundColor: '#121212',
    textColor: '#E0E0E0',
  },
};

// Get window width for content sizing
const { width } = Dimensions.get('window');

// Base component that receives the item as a prop
const ReaderComponent = ({ item }: { item: Item }) => {
  const router = useRouter();
  const activeTheme = useAppSelector(selectActiveTheme);
  const systemIsDark = activeTheme === 'dark';

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);

  // State
  const [fontSize, setFontSize] = useState<keyof typeof FONT_SIZES>('medium');
  const [readerTheme, setReaderTheme] = useState<keyof typeof READER_THEMES>(
    systemIsDark ? 'dark' : 'light',
  );
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(item.progress || 0);

  // Current theme colors
  const currentTheme = READER_THEMES[readerTheme];

  // Process markdown content
  const processedContent = useMemo(() => {
    return marked.parse(item.content || '') as string;
  }, [item.content]);

  // Handle navigation back
  const handleBack = async () => {
    // Save reading progress before navigating back
    await item.setProgress(progress);
    router.back();
  };

  // Handle scroll to track reading progress
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

    if (contentSize.height > 0) {
      const newProgress = Math.min(
        Math.max(0, contentOffset.y / (contentSize.height - layoutMeasurement.height)),
        1,
      );

      // Only update if significant change (avoid too many API calls)
      if (Math.abs(newProgress - progress) > 0.01) {
        setProgress(newProgress);
      }
    }
  };

  // Handle screen tap to toggle controls
  const handleToggleControls = () => {
    setShowControls(!showControls);
  };

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    await item.toggleFavorite();
  };

  // Handle archive toggle
  const handleArchiveToggle = async () => {
    await item.toggleArchived();
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

  // Handle font size change
  const handleFontSizeChange = (size: keyof typeof FONT_SIZES) => {
    setFontSize(size);
  };

  // Handle theme change
  const handleThemeChange = (theme: keyof typeof READER_THEMES) => {
    setReaderTheme(theme);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <StatusBar style={readerTheme === 'dark' ? 'light' : 'dark'} />

      {/* Header controls - shown only when controls are visible */}
      {showControls && (
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={currentTheme.textColor} />
          </TouchableOpacity>

          <View style={styles.headerRightActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleFavoriteToggle}>
              <Ionicons
                name={item.favorite ? 'star' : 'star-outline'}
                size={24}
                color={item.favorite ? COLORS.favorite : currentTheme.textColor}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerActionButton} onPress={handleArchiveToggle}>
              <Ionicons name="archive-outline" size={24} color={currentTheme.textColor} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerActionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color={currentTheme.textColor} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Article content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        onScroll={handleScroll}
        scrollEventThrottle={400} // Throttle to avoid too many events
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleToggleControls}
          style={styles.contentTouchable}
        >
          <Text
            style={[
              styles.title,
              {
                color: currentTheme.textColor,
                fontSize: FONT_SIZES[fontSize] + 6,
              },
            ]}
          >
            {item.title}
          </Text>

          <View style={styles.metaContainer}>
            {item.siteName && (
              <Text
                style={[
                  styles.metaText,
                  {
                    color: currentTheme.textColor,
                    opacity: 0.7,
                    fontSize: FONT_SIZES[fontSize] - 2,
                  },
                ]}
              >
                {item.siteName}
              </Text>
            )}

            {/* Markdown content rendering */}
            <RenderHTML
              source={{ html: processedContent }}
              contentWidth={width - 40} // 20px padding on each side
              baseStyle={{
                color: currentTheme.textColor,
                fontSize: FONT_SIZES[fontSize],
                lineHeight: FONT_SIZES[fontSize] * 1.5,
              }}
              tagsStyles={{
                p: { marginBottom: 16 },
                h1: {
                  fontSize: FONT_SIZES[fontSize] * 1.5,
                  marginBottom: 16,
                  marginTop: 24,
                  color: currentTheme.textColor,
                },
                h2: {
                  fontSize: FONT_SIZES[fontSize] * 1.3,
                  marginBottom: 16,
                  marginTop: 24,
                  color: currentTheme.textColor,
                },
                h3: {
                  fontSize: FONT_SIZES[fontSize] * 1.2,
                  marginBottom: 16,
                  marginTop: 20,
                  color: currentTheme.textColor,
                },
                a: { color: COLORS.primary.main },
                img: { marginVertical: 16 },
                ul: { marginBottom: 16, marginLeft: 16 },
                ol: { marginBottom: 16, marginLeft: 16 },
                li: { marginBottom: 8 },
                blockquote: {
                  borderLeftWidth: 2,
                  borderLeftColor: COLORS.primary.main,
                  paddingLeft: 16,
                  marginLeft: 0,
                  marginRight: 0,
                  marginVertical: 16,
                  fontStyle: 'italic',
                },
                figure: { marginVertical: 16 },
                figcaption: {
                  fontSize: FONT_SIZES[fontSize] - 2,
                  opacity: 0.7,
                  fontStyle: 'italic',
                },
              }}
              defaultTextProps={{
                selectable: true,
              }}
            />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer controls - shown only when controls are visible */}
      {showControls && (
        <View style={styles.footer}>
          {/* Font size controls */}
          <View style={styles.fontSizeControls}>
            <TouchableOpacity
              style={[styles.fontSizeButton, fontSize === 'small' && styles.activeFontSizeButton]}
              onPress={() => handleFontSizeChange('small')}
            >
              <Text
                style={[
                  styles.fontSizeButtonText,
                  { color: currentTheme.textColor },
                  fontSize === 'small' && styles.activeFontSizeButtonText,
                ]}
              >
                A
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fontSizeButton, fontSize === 'medium' && styles.activeFontSizeButton]}
              onPress={() => handleFontSizeChange('medium')}
            >
              <Text
                style={[
                  styles.fontSizeButtonText,
                  { color: currentTheme.textColor, fontSize: 18 },
                  fontSize === 'medium' && styles.activeFontSizeButtonText,
                ]}
              >
                A
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fontSizeButton, fontSize === 'large' && styles.activeFontSizeButton]}
              onPress={() => handleFontSizeChange('large')}
            >
              <Text
                style={[
                  styles.fontSizeButtonText,
                  { color: currentTheme.textColor, fontSize: 20 },
                  fontSize === 'large' && styles.activeFontSizeButtonText,
                ]}
              >
                A
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fontSizeButton, fontSize === 'xlarge' && styles.activeFontSizeButton]}
              onPress={() => handleFontSizeChange('xlarge')}
            >
              <Text
                style={[
                  styles.fontSizeButtonText,
                  { color: currentTheme.textColor, fontSize: 22 },
                  fontSize === 'xlarge' && styles.activeFontSizeButtonText,
                ]}
              >
                A
              </Text>
            </TouchableOpacity>
          </View>

          {/* Theme buttons */}
          <View style={styles.themeButtons}>
            <TouchableOpacity
              style={[
                styles.themeButton,
                readerTheme === 'light' && styles.activeThemeButton,
                { backgroundColor: READER_THEMES.light.backgroundColor },
              ]}
              onPress={() => handleThemeChange('light')}
            />

            <TouchableOpacity
              style={[
                styles.themeButton,
                readerTheme === 'sepia' && styles.activeThemeButton,
                { backgroundColor: READER_THEMES.sepia.backgroundColor },
              ]}
              onPress={() => handleThemeChange('sepia')}
            />

            <TouchableOpacity
              style={[
                styles.themeButton,
                readerTheme === 'dark' && styles.activeThemeButton,
                { backgroundColor: READER_THEMES.dark.backgroundColor },
              ]}
              onPress={() => handleThemeChange('dark')}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

// Enhanced component that observes the item from the database
interface EnhancedReaderProps {
  id: string;
  database: any; // TODO: Import proper Database type from WatermelonDB
}

const EnhancedReader = withObservables(['id'], ({ id, database }: EnhancedReaderProps) => ({
  item: database.collections.get('items').findAndObserve(id),
}))(ReaderComponent);

// Wrapper component that provides the database context
export default function ReaderScreen() {
  const { id } = useLocalSearchParams();
  const database = useDatabase();

  if (!id) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No article ID provided</Text>
      </View>
    );
  }

  return <EnhancedReader id={id} database={database} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 60,
  },
  contentTouchable: {
    padding: 20,
  },
  title: {
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 38,
  },
  metaContainer: {
    marginBottom: 24,
  },
  metaText: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fontSizeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    marginRight: 8,
  },
  activeFontSizeButton: {
    backgroundColor: COLORS.primary.main,
  },
  fontSizeButtonText: {
    fontWeight: '600',
  },
  activeFontSizeButtonText: {
    color: COLORS.white,
  },
  themeButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  activeThemeButton: {
    borderWidth: 2,
    borderColor: COLORS.primary.main,
  },
});
