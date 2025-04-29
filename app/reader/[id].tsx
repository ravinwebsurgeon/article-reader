// src/screens/ReaderScreen.tsx
import React, { useState, useRef, useMemo } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
  Platform,
  Button,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { marked } from 'marked';
import { RenderHTML } from 'react-native-render-html';
import { MenuView } from '@react-native-menu/menu';

// Import themed components
import { ThemeView, ThemeText, ThemeTouchable } from '@/components/core';
import { useTheme, useDarkMode } from '@/theme/hooks';

// Import WatermelonDB components
import { withObservables } from '@nozbe/watermelondb/react';
import { useDatabase } from '@/database/provider/DatabaseProvider';
import Item from '@/database/models/ItemModel';
import { scaler } from '@/utils';
import RecommendedArticles from './RecommendedArticles';
import { SvgIcon } from '@/components/SvgIcon';
import Svg from 'react-native-svg';

// Get window width for content sizing
const { width } = Dimensions.get('window');

// Base component that receives the item as a prop
const ReaderComponent = ({ item }: { item: Item }) => {
  const router = useRouter();
  const theme = useTheme();
  const isDarkMode = useDarkMode();
  const menuAnchorRef = useRef<typeof TouchableOpacity>(null);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);

  // State
  const [progress, setProgress] = useState(item.progress || 0);
  const [showMenu, setShowMenu] = useState(false);

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

      // Only update if significant change (avoid too many database operations)
      if (Math.abs(newProgress - progress) > 0.01) {
        setProgress(newProgress);
      }
    }
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

  // Handle menu open
  const handleOpenMenu = () => {
    setShowMenu(true);
  };

  // Custom header rendering for the specific design
  const renderCustomHeader = () => {
    return (
      <ThemeView style={styles.customHeader} row backgroundColor={theme.colors.background.paper}>
        <ThemeView style={styles.headerLeft} row centered>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.colors.text.primary} />
          </TouchableOpacity>

          <ThemeText variant="body1" style={styles.savesText}>
            Saves
          </ThemeText>
        </ThemeView>

        <ThemeView style={styles.headerRight} row>
          <TouchableOpacity style={styles.headerIconButton}>
            <SvgIcon name="listen" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerIconButton}>
            <SvgIcon name="compass" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            // ref={menuAnchorRef}
            style={styles.headerIconButton}
            // onPress={handleOpenMenu}
            onPress={() => menuAnchorRef.current?.show()}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>

          {['ios', 'android'].includes(Platform.OS) && showMenu && (
            <></>
            // <MenuView
            //   onOpenMenu={showMenu}
            //   onRequestClose={() => setShowMenu(false)}
            //   anchor={menuAnchorRef.current || undefined}
            //   actions={[
            //     {
            //       id: 'share',
            //       title: 'Share',
            //       titleColor: theme.colors.text.primary,
            //       image: 'square.and.arrow.up',
            //       imageColor: theme.colors.text.primary,
            //     },
            //     {
            //       id: 'favorite',
            //       title: item.favorite ? 'Unfavorite' : 'Favorite',
            //       titleColor: theme.colors.text.primary,
            //       image: item.favorite ? 'star.fill' : 'star',
            //       imageColor: item.favorite ? theme.colors.favorite : theme.colors.text.primary,
            //     },
            //     {
            //       id: 'archive',
            //       title: item.archived ? 'Unarchive' : 'Archive',
            //       titleColor: theme.colors.text.primary,
            //       image: 'archivebox',
            //       imageColor: theme.colors.text.primary,
            //     },
            //   ]}
            //   onPressAction={({ nativeEvent }) => {
            //     setShowMenu(false);
            //     switch (nativeEvent.event) {
            //       case 'share':
            //         handleShare();
            //         break;
            //       case 'favorite':
            //         handleFavoriteToggle();
            //         break;
            //       case 'archive':
            //         handleArchiveToggle();
            //         break;
            //     }
            //   }}
            // />
          )}
        </ThemeView>
      </ThemeView>
    );
  };

  return (
    <ThemeView style={{ flex: 1 }} backgroundColor={theme.colors.background.paper}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      {renderCustomHeader()}

      {/* Article content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        <ThemeText variant="h2" style={styles.title}>
          {item.title}
        </ThemeText>

        <ThemeView style={styles.metaContainer}>
          {item.siteName && (
            <ThemeText variant="meta" color={theme.colors.text.secondary} style={styles.metaText}>
              {item.siteName}
            </ThemeText>
          )}

          {/* Markdown content rendering */}
          <RenderHTML
            source={{ html: processedContent }}
            contentWidth={width - scaler(40)}
            baseStyle={{
              color: theme.colors.text.primary,
              fontSize: scaler(18),
              lineHeight: scaler(27),
            }}
            tagsStyles={{
              p: { marginBottom: scaler(16) },
              h1: {
                fontSize: scaler(24),
                marginBottom: scaler(14),
                marginTop: scaler(22),
                color: theme.colors.text.primary,
                fontWeight: 'bold',
              },
              h2: {
                fontSize: scaler(22),
                marginBottom: scaler(14),
                marginTop: scaler(22),
                color: theme.colors.text.primary,
                fontWeight: 'bold',
              },
              h3: {
                fontSize: scaler(19),
                marginBottom: scaler(14),
                marginTop: scaler(18),
                color: theme.colors.text.primary,
                fontWeight: 'bold',
              },
              a: { color: theme.colors.primary.main },
              img: { marginVertical: scaler(14) },
              ul: { marginBottom: scaler(14), marginLeft: scaler(14) },
              ol: { marginBottom: scaler(14), marginLeft: scaler(14) },
              li: { marginBottom: scaler(8) },
              blockquote: {
                borderLeftWidth: scaler(2),
                borderLeftColor: theme.colors.primary.main,
                paddingLeft: scaler(16),
                marginLeft: 0,
                marginRight: 0,
                marginVertical: scaler(16),
                fontStyle: 'italic',
              },
              figure: { marginVertical: scaler(16) },
              figcaption: {
                fontSize: scaler(14),
                opacity: 0.7,
                fontStyle: 'italic',
              },
            }}
            defaultTextProps={{
              selectable: true,
            }}
          />
        </ThemeView>
        <ThemeView style={styles.afterReadingSection}>
          <ThemeView style={styles.afterReadingSec} backgroundColor={theme.colors.background.paper}>
            <ThemeView
              style={styles.afterReading}
              backgroundColor={theme.colors.background.paper}
              row
            >
              <SvgIcon name="goto" size={18} color={theme.colors.text.secondary} />

              <ThemeText
                variant="guide"
                color={theme.colors.text.secondary}
                style={styles.afterReadingText}
              >
                After Reading
              </ThemeText>
            </ThemeView>
          </ThemeView>

          <ThemeView style={styles.footerActions} row centered>
            <TouchableOpacity
              style={[styles.footerButton, { backgroundColor: theme.colors.background.default }]}
              onPress={handleFavoriteToggle}
            >
              <SvgIcon
                name={item.favorite ? 'favorite' : 'favorite'}
                size={22}
                color={theme.colors.text.primary}
                style={styles.footerIcon}
              />
              <ThemeText variant="body2">{item.favorite ? 'Favorited' : 'Favorite'}</ThemeText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.footerButton,
                { backgroundColor: theme.colors.background.default, alignItems: 'center' },
              ]}
              onPress={handleArchiveToggle}
            >
              <SvgIcon
                name="archive"
                size={22}
                color={theme.colors.text.primary}
                style={styles.footerIcon}
              />

              <ThemeText variant="body2">Archive</ThemeText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.footerButton, { backgroundColor: theme.colors.background.default }]}
              onPress={handleShare}
            >
              <SvgIcon
                name="share"
                size={22}
                color={theme.colors.text.primary}
                style={styles.footerIcon}
              />
              <ThemeText variant="body2">Share</ThemeText>
            </TouchableOpacity>
          </ThemeView>
        </ThemeView>
        <ThemeView style={styles.upNextSection} backgroundColor={theme.colors.background.paper}>
          <ThemeView
            style={styles.upNextHeader}
            backgroundColor={theme.colors.background.paper}
            row
          >
            <SvgIcon name="up-next" size={18} color={theme.colors.text.secondary} />
            <ThemeText
              variant="guide"
              color={theme.colors.text.secondary}
              style={styles.upNextText}
            >
              Up Next
            </ThemeText>
          </ThemeView>
          <RecommendedArticles currentItem={item} />
        </ThemeView>
      </ScrollView>
    </ThemeView>
  );
};

// Enhanced component that observes the item from the database
interface EnhancedReaderProps {
  id: string;
  database: any; // TODO: Import proper Database type from WatermelonDB
}

// Enhanced component that observes the item from the database
const EnhancedReader = withObservables(['id'], ({ id, database }: EnhancedReaderProps) => ({
  item: database.collections.get('items').findAndObserve(id),
}))(ReaderComponent);

// Wrapper component that provides the database context
export default function ReaderScreen() {
  const { id } = useLocalSearchParams();
  const database = useDatabase();
  const theme = useTheme();

  if (!id) {
    return (
      <ThemeView style={{ flex: 1 }} centered>
        <ThemeText>No article ID provided</ThemeText>
      </ThemeView>
    );
  }

  return <EnhancedReader id={id.toString()} database={database} />;
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  customHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaler(8),
    paddingVertical: scaler(12),
    paddingTop: scaler(50),
    borderBottomWidth: scaler(1),
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    ...Platform.select({
      ios: {
        paddingTop: scaler(50),
      },
      android: {
        paddingTop: scaler(30),
      },
    }),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: scaler(4),
  },
  savesText: {
    marginLeft: scaler(4),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    padding: scaler(8),
    marginLeft: scaler(8),
  },
  // Menu styles
  androidMenu: {
    position: 'absolute',
    top: scaler(50),
    right: scaler(10),
    borderRadius: scaler(8),
    padding: scaler(8),
    width: scaler(180),
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scaler(12),
  },
  menuItemText: {
    marginLeft: scaler(12),
  },
  contentContainer: {
    paddingHorizontal: scaler(20),
    paddingTop: scaler(20),
    paddingBottom: scaler(40),
  },
  title: {
    fontWeight: '700',
    marginBottom: scaler(16),
  },
  metaContainer: {
    marginBottom: scaler(24),
  },
  metaText: {
    marginBottom: scaler(16),
  },
  // After Reading section
  afterReadingSection: {
    marginTop: scaler(40),
    paddingTop: scaler(16),
  },
  afterReadingText: {
    // marginBottom: scaler(16),
    marginLeft: scaler(8),

  },
  footerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: scaler(12),
    gap: scaler(8),
    marginVertical: scaler(16),
  },
  footerButton: {
    paddingVertical: scaler(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaler(8),
    flex: 1,
    flexBasis: '40%',
    borderRadius: scaler(8),
  },
  footerIcon: {
    // marginBottom: scaler(6),
  },
  // Up Next section
  upNextSection: {
    marginTop: scaler(40),
    position: 'relative',
    paddingTop: scaler(16),
    borderTopWidth: scaler(1),
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  upNextHeader: {
    alignItems: 'center',
    marginBottom: scaler(12),
    position: 'absolute',
    top: scaler(-12),
  },
  upNextText: {
    marginLeft: scaler(8),
  },
  afterReadingSec: {
    position: 'relative',
    borderTopWidth: scaler(1),
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  afterReading:{
    alignItems: 'center',
    marginBottom: scaler(12),
    position: 'absolute',
    top: scaler(-12),
  }
});
