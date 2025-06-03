import React, { useState, useRef, useMemo, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";

// Import themed components
import { ThemeView } from "@/components/primitives";
import { useTheme, useDarkMode } from "@/theme/hooks";

// Import WatermelonDB components
import { withObservables } from "@nozbe/watermelondb/react";
import { useDatabase } from "@/database/provider/DatabaseProvider";
import Item from "@/database/models/ItemModel";
import ItemContent from "@/database/models/ItemContentModel";
import { map, switchMap } from "rxjs/operators";
import { of as observableOf } from "rxjs";

// Import new reader components
import { Header, MetaData, Content, AfterReading, UpNext } from "@/components/reader";

// Base component that receives the item and its content as props
const ReaderComponent = ({ item, content }: { item: Item; content: ItemContent | null }) => {
  const theme = useTheme();
  const isDarkMode = useDarkMode();

  // State
  const [progress, setProgress] = useState(item.progress);
  const [isUserScrolled, setIsUserScrolled] = useState(false);
  const [browserMode, setBrowserMode] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);

  // Handle progress change from scroll tracking
  const handleProgressChange = (newProgress: number) => {
    if (Math.abs(newProgress - (progress ?? 0)) > 0.01) {
      setProgress(newProgress);
    }
  };

  // Handle user scrolled
  const handleUserScrolled = () => {
    setIsUserScrolled(true);
  };

  // Handle toggling between reader and browser views
  const handleToggleView = () => {
    setBrowserMode(!browserMode);
    // Reset loading states when toggling
    if (!browserMode) {
      setLoadingProgress(0);
      setIsLoadingComplete(false);
    }
  };

  // Reset state when item changes
  useEffect(() => {
    setIsUserScrolled(false);
    setProgress(item.progress);
  }, [item.id, item.progress]);

  return (
    <ThemeView style={{ flex: 1 }} backgroundColor={theme.colors.background.paper}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />

        <Header
          item={item}
          browserMode={browserMode}
          onToggleView={handleToggleView}
          progress={progress}
          isUserScrolled={isUserScrolled}
        />

        {browserMode && item.url ? (
          <View style={styles.browserContainer}>
            {/* Progress bar */}
            {!isLoadingComplete && (
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${loadingProgress * 100}%` }]} />
              </View>
            )}

            <WebView
              source={{ uri: item.url }}
              style={styles.webView}
              pullToRefreshEnabled={true}
              allowsBackForwardNavigationGestures={true}
              onLoadProgress={({ nativeEvent }) => {
                setLoadingProgress(nativeEvent.progress);
              }}
              onLoadEnd={() => {
                setIsLoadingComplete(true);
              }}
              onLoadStart={() => {
                setIsLoadingComplete(false);
              }}
            />
          </View>
        ) : (
          <ScrollView
            style={styles.articleContainer}
            contentContainerStyle={styles.articleContent}
            showsVerticalScrollIndicator={true}
          >
            <MetaData item={item} content={content} />

            <Content
              item={item}
              content={content}
              onProgressChange={handleProgressChange}
              onUserScrolled={handleUserScrolled}
            />

            <AfterReading item={item} />

            <UpNext item={item} />
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

const styles = StyleSheet.create({
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
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    zIndex: 10,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#2196F3",
  },
  webView: {
    flex: 1,
  },
  articleContainer: {
    flex: 1,
  },
  articleContent: {
    paddingBottom: 40,
  },
});
