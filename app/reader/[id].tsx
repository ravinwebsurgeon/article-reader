import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
  Platform,
  View,
  TextStyle,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { marked } from "marked";
import { RenderHTML } from "react-native-render-html";
import { createMenuPosition } from "@/components/common/menu/menuAnimationPresents";

// Import themed components
import { ThemeView, ThemeText } from "@/components/core";
import { useTheme, useDarkMode } from "@/theme/hooks";

// Import WatermelonDB components
import { withObservables } from "@nozbe/watermelondb/react";
import { useDatabase } from "@/database/provider/DatabaseProvider";
import Item from "@/database/models/ItemModel";
import RecommendedArticles from "./RecommendedArticles";
import { SvgIcon } from "@/components/SvgIcon";
import { ActionMenuPosition } from "@/components/common/menu/ReusableActionMenu";
import ReaderActionMenu from "@/components/common/menu/ReaderActionMenu";
import { getLiterataVariableStyle } from "@/theme";
import { useTranslation } from "react-i18next";

// Get window width for content sizing
const { width } = Dimensions.get("window");

function omitCursor(style: TextStyle | undefined) {
  if (!style) return style;
  const { cursor, overflow, ...rest } = style;
  // Only add overflow back if it's not 'scroll'
  const filtered = overflow === "scroll" ? rest : { ...rest, ...(overflow ? { overflow } : {}) };
  // Remove any properties with value null
  return Object.fromEntries(Object.entries(filtered).filter(([_, v]) => v !== null));
}

// Base component that receives the item as a prop
const ReaderComponent = ({ item }: { item: Item }) => {
  const router = useRouter();
  const theme = useTheme();
  const isDarkMode = useDarkMode();
  const { t } = useTranslation();

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const menuButtonRef = useRef<View>(null);

  // State
  const [progress, setProgress] = useState(item.progress);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<ActionMenuPosition>({});
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [hasRestoredPosition, setHasRestoredPosition] = useState(false);

  // Restore scroll position when component mounts
  useEffect(() => {
    if (
      !hasRestoredPosition &&
      contentHeight > 0 &&
      scrollViewHeight > 0 &&
      scrollViewRef.current &&
      item.progress
    ) {
      // Calculate scroll position based on progress
      const maxScrollPosition = contentHeight - scrollViewHeight;
      const scrollToPosition = Math.max(
        0,
        Math.min(item.progress * maxScrollPosition, maxScrollPosition),
      );

      // Add a small delay to ensure the content is properly rendered
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: scrollToPosition,
          animated: true,
        });
        setHasRestoredPosition(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [contentHeight, scrollViewHeight, item.progress, hasRestoredPosition]);

  // Process markdown content
  const processedContent = useMemo(() => {
    return marked.parse(item.content ?? "") as string;
  }, [item.content]);

  // Handle navigation back
  const handleBack = async () => {
    // Save reading progress before navigating back
    console.log("Saving progress:", progress);
    await item
      .setProgress(progress)
      .catch((error) => console.error("Error saving progress:", error));
    router.back();
  };

  // Handle scroll to track reading progress
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

    // Save sizes for scroll position calculation
    if (scrollViewHeight === 0) {
      setScrollViewHeight(layoutMeasurement.height);
    }

    if (contentHeight === 0) {
      setContentHeight(contentSize.height);
    }

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
      console.error("Error sharing article:", error);
    }
  };

  // Handle opening the action menu
  const handleOpenMenu = () => {
    if (menuButtonRef.current) {
      menuButtonRef.current.measure(
        (
          x: number,
          y: number,
          width: number,
          height: number,
          pageX: number,
          pageY: number,
        ): void => {
          setMenuPosition({
            x: pageX,
            y: pageY,
            width,
            height,
            ...createMenuPosition("bottomRight"),
          });
          setMenuVisible(true);
        },
      );
    }
  };

  // Custom header rendering for the specific design
  const renderCustomHeader = () => {
    return (
      <ThemeView style={styles.customHeader} row backgroundColor={theme.colors.background.paper}>
        <ThemeView style={styles.headerLeft} row centered>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.colors.text.primary} />
            <ThemeText variant="body1" style={styles.savesText}>
              Saves
            </ThemeText>
          </TouchableOpacity>
        </ThemeView>

        <ThemeView style={styles.headerRight} row>
          <TouchableOpacity style={styles.headerIconButton}>
            <SvgIcon name="listen" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerIconButton}>
            <SvgIcon name="compass" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            ref={menuButtonRef}
            style={styles.headerIconButton}
            onPress={handleOpenMenu}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </ThemeView>
      </ThemeView>
    );
  };

  return (
    <ThemeView style={{ flex: 1 }} backgroundColor={theme.colors.background.paper}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {renderCustomHeader()}

      {/* Article content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        onContentSizeChange={(width, height) => {
          setContentHeight(height);
        }}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setScrollViewHeight(height);
        }}
      >
        <ThemeText variant="h2" style={styles.title}>
          {item.title}
        </ThemeText>

        <ThemeView style={styles.metaContainer}>
          {item.source && (
            <ThemeText variant="meta" color={theme.colors.text.secondary} style={styles.metaText}>
              {item.source}
            </ThemeText>
          )}

          {/* Markdown content rendering */}
          <RenderHTML
            source={{ html: processedContent }}
            contentWidth={width - 40}
            baseStyle={{
              color: theme.colors.text.primary,
              fontSize: 18,
              lineHeight: 27,
              ...omitCursor(getLiterataVariableStyle(400, 18, false)),
            }}
            tagsStyles={{
              p: {
                marginBottom: 16,
              },
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
                {t("reader.afterReading")}
              </ThemeText>
            </ThemeView>
          </ThemeView>

          <ThemeView style={styles.footerActions} row centered>
            <TouchableOpacity
              style={[styles.footerButton, { backgroundColor: theme.colors.background.default }]}
              onPress={handleFavoriteToggle}
            >
              <SvgIcon
                name={item.favorite ? "favorite" : "favorite"}
                size={22}
                color={theme.colors.text.primary}
                style={styles.footerIcon}
              />
              <ThemeText variant="body2">
                {item.favorite ? t("reader.favorited") : t("reader.favorite")}
              </ThemeText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.footerButton,
                { backgroundColor: theme.colors.background.default, alignItems: "center" },
              ]}
              onPress={handleArchiveToggle}
            >
              <SvgIcon
                name="archive"
                size={22}
                color={theme.colors.text.primary}
                style={styles.footerIcon}
              />

              <ThemeText variant="body2">{t("reader.archive")}</ThemeText>
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
              <ThemeText variant="body2">{t("menu.share")}</ThemeText>
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
              {t("reader.upNext")}
            </ThemeText>
          </ThemeView>
          <RecommendedArticles currentItem={item} />
        </ThemeView>
      </ScrollView>
      {/* Reader Action Menu */}
      <ReaderActionMenu
        item={item}
        visible={menuVisible}
        position={menuPosition}
        onClose={() => setMenuVisible(false)}
      />
    </ThemeView>
  );
};

// Wrapper component that provides the database context
export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { database } = useDatabase();

  if (!id) {
    return null;
  }

  const EnhancedReader = withObservables(["id"], ({ id }: { id: string }) => ({
    item: database.collections.get<Item>("items").findAndObserve(id),
  }))(ReaderComponent);

  return <EnhancedReader id={id} />;
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  customHeader: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    ...Platform.select({
      ios: {
        paddingTop: 50,
      },
      android: {
        paddingTop: 30,
      },
    }),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  savesText: {
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconButton: {
    padding: 8,
    marginLeft: 8,
  },
  // Menu styles
  androidMenu: {
    position: "absolute",
    top: 50,
    right: 10,
    borderRadius: 8,
    padding: 8,
    width: 180,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  menuItemText: {
    marginLeft: 12,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontWeight: "700",
    marginBottom: 16,
  },
  metaContainer: {
    marginBottom: 24,
  },
  metaText: {
    marginBottom: 16,
  },
  // After Reading section
  afterReadingSection: {
    marginTop: 40,
    paddingTop: 16,
  },
  afterReadingText: {
    // marginBottom: 16,
    marginLeft: 8,
  },
  footerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingVertical: 12,
    gap: 8,
    marginVertical: 16,
  },
  footerButton: {
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flex: 1,
    flexBasis: "40%",
    borderRadius: 8,
  },
  footerIcon: {
    // marginBottom: 6,
  },
  // Up Next section
  upNextSection: {
    marginTop: 40,
    position: "relative",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  upNextHeader: {
    alignItems: "center",
    marginBottom: 12,
    position: "absolute",
    top: -12,
  },
  upNextText: {
    marginLeft: 8,
  },
  afterReadingSec: {
    position: "relative",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  afterReading: {
    alignItems: "center",
    marginBottom: 12,
    position: "absolute",
    top: -12,
  },
});
