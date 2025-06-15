import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { View, StyleSheet, ScrollView, DimensionValue } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";

// Import themed components
import { ThemeView } from "@/components/primitives";
import { useTheme, useSpacing } from "@/theme/hooks";
import { useScrollProgress } from "@/hooks/useScrollProgress";

// Import WatermelonDB components
import { withObservables } from "@nozbe/watermelondb/react";
import { useDatabase } from "@/database/provider/DatabaseProvider";
import Item from "@/database/models/ItemModel";
import ItemContent from "@/database/models/ItemContentModel";
import { map, switchMap } from "rxjs/operators";
import { of as observableOf } from "rxjs";

// Import network status
import { useNetworkStatus } from "@/utils/hooks";

// Import new reader components
import {
  ReaderHeader,
  ReaderMetaData,
  ReaderContent,
  ReaderAfterReading,
  ReaderUpNext,
} from "@/components/reader";

// Base component that receives the item and its content as props
const ReaderComponent = ({ item, content }: { item: Item; content: ItemContent | null }) => {
  const theme = useTheme();
  const spacing = useSpacing();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { isConnected } = useNetworkStatus();

  // Determine the recommended display mode (memoized to avoid repeated calculations)
  const recommendedMode = useMemo(() => {
    return item.getDisplayMode(content, isConnected ?? undefined);
  }, [item, content, isConnected]);

  // State
  const [browserMode, setBrowserMode] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);

  // Use the scroll progress hook
  const {
    progress,
    isUserScrolled,
    handleScrollChange,
    handleContentLoaded,
    handleContentSizeChange,
    handleLayoutChange,
    saveProgress,
  } = useScrollProgress({
    item,
    scrollViewRef,
  });

  // Set initial browser mode based on recommended display mode
  useEffect(() => {
    setBrowserMode(recommendedMode === "webview");
  }, [recommendedMode]);

  // Mark item as viewed when component mounts
  useEffect(() => {
    const markAsViewed = async () => {
      if (!item.viewed) {
        await item.setViewed(true);
      }
    };
    markAsViewed();
  }, [item]);

  // Handle navigation back with saving
  const handleBack = useCallback(async () => {
    await saveProgress();
    router.back();
  }, [saveProgress, router]);

  // Handle toggling between reader and browser views
  const handleToggleView = useCallback(() => {
    setBrowserMode(!browserMode);
    if (!browserMode) {
      setLoadingProgress(0);
      setIsLoadingComplete(false);
    }
  }, [browserMode]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        browserContainer: {
          flex: 1,
          position: "relative",
        },
        progressBarContainer: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: theme.colors.gray[200],
          zIndex: 10,
        },
        progressBar: {
          height: "100%",
          backgroundColor: theme.colors.primary.main,
        },
        webView: {
          flex: 1,
        },
        articleContainer: {
          flex: 1,
        },
        articleContent: {
          paddingBottom: spacing.lg,
        },
      }),
    [theme.colors, spacing],
  );

  const progressBarStyle = useMemo(
    () => [styles.progressBar, { width: `${loadingProgress * 100}%` as DimensionValue }],
    [styles.progressBar, loadingProgress],
  );

  // WebView callbacks (must be outside conditional rendering to avoid hook order issues)
  const handleLoadProgress = useCallback(
    ({ nativeEvent }: { nativeEvent: { progress: number } }) => {
      setLoadingProgress(Number(nativeEvent.progress));
    },
    [],
  );

  const handleLoadEnd = useCallback(() => {
    setIsLoadingComplete(true);
  }, []);

  const handleLoadStart = useCallback(() => {
    setIsLoadingComplete(false);
  }, []);

  const handleSwitchToWebView = useCallback(() => setBrowserMode(true), []);

  return (
    <ThemeView style={{ flex: 1 }} backgroundColor={theme.colors.background.paper}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ReaderHeader
          item={item}
          browserMode={browserMode}
          onToggleView={handleToggleView}
          progress={progress}
          isUserScrolled={isUserScrolled}
          onBack={handleBack}
        />
        {browserMode && item.url ? (
          <View style={styles.browserContainer}>
            {/* Progress bar */}
            {!isLoadingComplete && (
              <View style={styles.progressBarContainer}>
                <View style={progressBarStyle} />
              </View>
            )}
            <WebView
              source={{ uri: item.url }}
              style={styles.webView}
              pullToRefreshEnabled={true}
              allowsBackForwardNavigationGestures={true}
              onLoadProgress={handleLoadProgress}
              onLoadEnd={handleLoadEnd}
              onLoadStart={handleLoadStart}
            />
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.articleContainer}
            contentContainerStyle={styles.articleContent}
            showsVerticalScrollIndicator={true}
            onScroll={handleScrollChange}
            onContentSizeChange={handleContentSizeChange}
            onLayout={handleLayoutChange}
            scrollEventThrottle={100}
          >
            <ReaderMetaData item={item} content={content} />
            <ReaderContent
              item={item}
              content={content}
              onLoadComplete={handleContentLoaded}
              onSwitchToWebView={handleSwitchToWebView}
            />
            <ReaderAfterReading item={item} />
            <ReaderUpNext item={item} />
          </ScrollView>
        )}
      </SafeAreaView>
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

  const EnhancedReader = withObservables(["id"], ({ id }: { id: string }) => {
    const item$ = database?.collections.get<Item>("items").findAndObserve(id);

    return {
      item: item$,
      content: item$.pipe(
        switchMap((item) => {
          if (!item) {
            return observableOf(null);
          }
          return item.itemContentQuery ? item.itemContentQuery.observe() : observableOf([]);
        }),
        map((contents) => {
          return contents && contents.length > 0 ? contents[0] : null;
        }),
      ),
    };
  })(ReaderComponent);

  return <EnhancedReader id={id} />;
}
