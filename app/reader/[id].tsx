import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  ScrollView,
  TouchableOpacity,
  Share,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
  Platform,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { marked } from "marked";
import { createMenuPosition } from "@/components/shared/menu/menuAnimationPresents";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";

// Import themed components
import { ThemeView, ThemeText } from "@/components/primitives";
import { useTheme, useDarkMode } from "@/theme/hooks";

// Import WatermelonDB components
import { withObservables } from "@nozbe/watermelondb/react";
import { useDatabase } from "@/database/provider/DatabaseProvider";
import Item from "@/database/models/ItemModel";
import ItemContent from "@/database/models/ItemContentModel";
import RecommendedItems from "@/components/item/RecommendedItems";
import { withRecommendedItems } from "@/database/hooks/withRecommendedItems";
import { SvgIcon } from "@/components/SvgIcon";
import { ActionMenuPosition } from "@/components/shared/menu/ReusableActionMenu";
import ReaderActionMenu from "@/components/shared/menu/ReaderActionMenu";
import { useTranslation } from "react-i18next";
import HTMLViewer from "@/components/HTMLviewer";
import { map, switchMap } from "rxjs/operators";
import { of as observableOf } from "rxjs";
import { Image } from "expo-image";
import Svg, { Path } from "react-native-svg";

interface Highlight {
  id: string;
  text: string;
  range: {
    startContainer: string; // xpath
    startOffset: number;
    endContainer: string; // xpath
    endOffset: number;
  };
  color?: string;
}

// Base component that receives the item and its content as props
const ReaderComponent = ({ item, content }: { item: Item; content: ItemContent | null }) => {
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
  //browser state
  const [browserMode, setBrowserMode] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedText, setSelectedText] = useState<string>("");

  console.log("Selected text:", selectedText, "Highlights:", highlights);

  // Handle highlight added
  const handleHighlightAdded = (id: any, text: string, color: string) => {
    setHighlights((prev: any) => [...prev, { id, text, color }]);
  };

  // Handle highlight removed
  const handleHighlightRemoved = (id: any) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  };

  // Handle selection change
  const handleSelectionChange = (text: string) => {
    setSelectedText(text);
  };

  const handleShareSelectedText = async (text: any) => {
    try {
      await Share.share({
        message: text,
      });
    } catch (error) {
      console.error("Error sharing text:", error);
    }
  };

  // Memoize the EnhancedRecommendedItems component
  const EnhancedRecommendedItems = useMemo(
    () =>
      withRecommendedItems({ currentItem: item })(({ recommendedItems }) => (
        <RecommendedItems items={recommendedItems} />
      )),
    [item], // Include the entire item object in dependencies
  );

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
    return marked.parse(content?.content ?? "") as string;
  }, [content?.content]);

  const contentHasImage = useMemo(() => {
    // Look for various types of image elements in the processed HTML
    const imagePatterns = [
      /<img[^>]+>/i, // Standard img tags
      /<figure[^>]*>[\s\S]*?<img[^>]+>/i, // Figure elements with images
      /<picture[^>]*>[\s\S]*?<img[^>]+>/i, // Picture elements with images
      /<svg[^>]*>[\s\S]*?<\/svg>/i, // SVG elements
    ];

    // Return true if any pattern is found in the content
    return imagePatterns.some((pattern) => pattern.test(processedContent));
  }, [processedContent]);

  // Log for debugging
  useEffect(() => {
    console.log("Content has image:", contentHasImage);
  }, [contentHasImage]);

  // Handle navigation back
  const handleBack = async () => {
    // Only save if progress has changed from initial value
    if (progress !== item.progress) {
      console.log("Saving progress:", progress);
      await item
        .setProgress(progress as number)
        .catch((error) => console.error("Error saving progress:", error));
    }
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
      if (Math.abs(newProgress - (progress ?? 0)) > 0.01) {
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
  // console.log(item.favorite)
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

  // Handle opening the in-app browser
  // const handleOpenBrowser = async () => {
  //   if (item.url) {
  //     try {
  //       await WebBrowser.openBrowserAsync(item.url);
  //     } catch (error) {
  //       console.error("Error opening browser:", error);
  //     }
  //   }
  // };

  // Handle toggling between reader and browser views
  const handleToggleView = () => {
    setBrowserMode(!browserMode);
    // Reset loading states when toggling
    if (!browserMode) {
      setLoadingProgress(0);
      setIsLoadingComplete(false);
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
          console.log("Menu true or not ", menuVisible);
        },
      );
    }
  };

  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

          <TouchableOpacity onPress={handleToggleView} style={styles.headerIconButton}>
            <SvgIcon
              name={browserMode ? "reader" : "compass"}
              size={24}
              color={theme.colors.text.primary}
            />
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

  console.log("item in the article detail", item?.dek);

  return (
    <ThemeView style={{ flex: 1 }} backgroundColor={theme.colors.background.paper}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        {renderCustomHeader()}
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
              // startInLoadingState={true}
              // renderLoading={renderWebViewLoading}
              pullToRefreshEnabled={true}
              allowsBackForwardNavigationGestures={true}
              onLoadProgress={({ nativeEvent }) => {
                console.log("Loading progress:", nativeEvent.progress);
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
          <>
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
              {item.source && (
                <ThemeText
                  variant="meta"
                  color={theme.colors.text.secondary}
                  style={styles.metaText}
                >
                  {item.source}
                </ThemeText>
              )}
              <ThemeText variant="reader.title" style={styles.title}>
                {item.title}
              </ThemeText>

              <ThemeView style={styles.metaContainer}>
                {content?.dek && (
                  <ThemeText
                    variant="meta"
                    color={theme.colors.text.secondary}
                    style={[styles.dekText]}
                  >
                    {content.dek}
                  </ThemeText>
                )}

                {content?.author && (
                  <ThemeText variant="meta" style={styles.authorText}>
                    {content.author}
                  </ThemeText>
                )}

                {item.publishedAt && (
                  <ThemeText
                    variant="meta"
                    color={theme.colors.text.secondary}
                    style={styles.publishedAt}
                  >
                    {formatDate(item.publishedAt)} {item.readTime && `• ${item.readTime} min`}
                  </ThemeText>
                )}
              </ThemeView>

              {/* Display the feature image if available */}
              {item.imageUrl && !contentHasImage && (
                <ThemeView style={styles.imageContainer}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.featureImage}
                    resizeMode="cover"
                    placeholder={
                      item.imageThumbHash
                        ? { uri: `data:image/png;base64,${item.imageThumbHash}` }
                        : undefined
                    }
                  />
                </ThemeView>
              )}
              <HTMLViewer
                html={processedContent}
                style={styles.webView}
                onHighlightAdded={handleHighlightAdded}
                onHighlightRemoved={handleHighlightRemoved}
                onSelectionChange={handleSelectionChange}
                onShare={handleShareSelectedText}
                // onScroll={handleScroll}
                onContentSizeChange={(width, height) => {
                  setContentHeight(height);
                }}
                onLayout={(event: any) => {
                  const { height }: { height: number } = event.nativeEvent.layout;
                  setScrollViewHeight(height);
                }}
              />
              <ThemeView style={styles.afterReadingSection}>
                <ThemeView
                  style={styles.afterReadingSec}
                  backgroundColor={theme.colors.background.paper}
                >
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
                    style={[
                      styles.footerButton,
                      {
                        backgroundColor: item.favorite
                          ? "rgba(251, 215, 73, 1)"
                          : theme.colors.background.default,
                      },
                    ]}
                    onPress={handleFavoriteToggle}
                  >
                    {item.favorite ? (
                      <Svg width="20" height="20" viewBox="0 0 21 20" fill="none">
                        <Path
                          d="M8.44123 1.28389C9.28785 -0.414948 11.7117 -0.414941 12.5583 1.2839L14.1974 4.57299C14.3146 4.80802 14.5396 4.97061 14.7995 5.00801L18.4397 5.53184C20.3331 5.80432 21.0858 8.13457 19.7095 9.46317L18.5207 10.6107C18.0246 10.3544 17.4846 10.1714 16.9149 10.076L18.6677 8.38397C19.1464 7.92185 18.8846 7.11132 18.226 7.01655L14.5858 6.49272C13.8386 6.38518 13.1916 5.91775 12.8549 5.24204L11.2158 1.95294C10.9213 1.36204 10.0782 1.36204 9.78376 1.95294L8.14464 5.24204C7.8079 5.91775 7.16098 6.38518 6.41371 6.49272L2.77354 7.01655C2.11494 7.11132 1.85315 7.92185 2.33186 8.38396L4.94664 10.9081C5.49507 11.4375 5.74557 12.2043 5.61549 12.9554L4.99561 16.5346C4.88261 17.1871 5.56596 17.6865 6.15332 17.3807L9.43762 15.6708C9.77068 15.4974 10.1356 15.4107 10.5005 15.4108C10.5 15.4406 10.4998 15.4704 10.4998 15.5002C10.4998 15.996 10.5653 16.4764 10.6883 16.9333C10.5023 16.8882 10.3039 16.9109 10.1303 17.0012L6.84603 18.7112C5.15738 19.5904 3.19273 18.1545 3.51761 16.2787L4.1375 12.6994C4.18274 12.4381 4.09561 12.1714 3.90485 11.9873L1.29007 9.46317C-0.0862333 8.13457 0.66644 5.80432 2.55988 5.53184L6.20005 5.00801C6.45997 4.97061 6.68499 4.80802 6.80212 4.57299L8.44123 1.28389Z"
                          fill="#1C1F21"
                        />
                        <Path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M20.4998 15.5002C20.4998 17.9855 18.485 20.0002 15.9998 20.0002C13.5145 20.0002 11.4998 17.9855 11.4998 15.5002C11.4998 13.015 13.5145 11.0002 15.9998 11.0002C18.485 11.0002 20.4998 13.015 20.4998 15.5002ZM15.2497 16.5431L18.1462 13.6467L18.8533 14.3538L15.2497 17.9573L13.3961 16.1038L14.1032 15.3967L15.2497 16.5431Z"
                          fill="#1C1F21"
                        />
                      </Svg>
                    ) : (
                      <SvgIcon
                        name={item.favorite ? "favorite" : "favorite"}
                        size={22}
                        color={theme.colors.text.primary}
                        style={styles.footerIcon}
                      />
                    )}
                    <ThemeText variant="body2">
                      {item.favorite ? t("reader.favorited") : t("reader.favorite")}
                    </ThemeText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.footerButton,
                      {
                        backgroundColor: item.archived
                          ? "rgba(251, 215, 73, 1)"
                          : theme.colors.background.default,
                      },
                    ]}
                    onPress={handleArchiveToggle}
                  >
                    {item.archived ? (
                      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <Path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M2 4.75098C2 3.78396 2.78431 3.00025 3.75132 3.00098L20.2513 3.01341C21.2173 3.01414 22 3.79743 22 4.76341V6.75022C22 7.44832 21.5912 8.05095 21 8.33181V13.2572C20.5537 12.8886 20.0482 12.589 19.5 12.3749V8.50022H4.5V16C4.5 17.933 6.067 19.5 8 19.5H12.3749C12.589 20.0482 12.8886 20.5537 13.2572 21H8C5.23857 21 3 18.7614 3 16V8.33181C2.40876 8.05095 2 7.44832 2 6.75022V4.75098ZM3.75019 4.50098C3.61204 4.50087 3.5 4.61283 3.5 4.75098V6.75022C3.5 6.88829 3.61193 7.00022 3.75 7.00022H20.25C20.3881 7.00022 20.5 6.88829 20.5 6.75022V4.76341C20.5 4.62541 20.3882 4.51352 20.2502 4.51341L3.75019 4.50098Z"
                          fill="#1C1F21"
                        />
                        <Path
                          d="M10 10.5C9.58579 10.5 9.25 10.8358 9.25 11.25C9.25 11.6642 9.58579 12 10 12H14C14.4142 12 14.75 11.6642 14.75 11.25C14.75 10.8358 14.4142 10.5 14 10.5H10Z"
                          fill="#1C1F21"
                        />
                        <Path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M22 17.5C22 19.9853 19.9853 22 17.5 22C15.0147 22 13 19.9853 13 17.5C13 15.0147 15.0147 13 17.5 13C19.9853 13 22 15.0147 22 17.5ZM16.75 18.5429L19.6464 15.6465L20.3535 16.3536L16.75 19.9571L14.8964 18.1036L15.6035 17.3965L16.75 18.5429Z"
                          fill="#1C1F21"
                        />
                      </Svg>
                    ) : (
                      <SvgIcon
                        name="archive"
                        size={22}
                        color={theme.colors.text.primary}
                        style={styles.footerIcon}
                      />
                    )}
                    <ThemeText variant="body2">{t("reader.archive")}</ThemeText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.footerButton,
                      {
                        borderColor: "rgba(28, 31, 33, 0.09)",
                        borderWidth: 1,
                        borderStyle: "solid",
                      },
                    ]}
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
              <ThemeView
                style={styles.upNextSection}
                backgroundColor={theme.colors.background.paper}
              >
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
                <EnhancedRecommendedItems />
              </ThemeView>
            </ScrollView>
          </>
        )}
        <ReaderActionMenu
          item={item}
          visible={menuVisible}
          position={menuPosition}
          onClose={() => {
            setMenuVisible(false);
          }}
        />
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
            // This case should ideally not happen if findAndObserve throws or resolves for a valid id
            return observableOf(null);
          }
          // item.itemContentQuery is Query<ItemContent>
          // item.itemContentQuery.observe() is Observable<ItemContent[]>
          return item.itemContentQuery ? item.itemContentQuery.observe() : observableOf([]);
        }),
        map((contents) => (contents && contents.length > 0 ? contents[0] : null)),
      ),
    };
  })(ReaderComponent);

  return <EnhancedReader id={id} />;
}

const styles = StyleSheet.create({
  publishedAt: {
    fontWeight: 400,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0,
    textAlign: "left",
    color: "rgba(28, 31, 33, 0.72)",
    fontFamily: "Inter-Regular",
    marginBottom: 0,
  },
  dekText: {
    fontWeight: 400,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
    textAlign: "left",
    color: "#1C1F21",
    fontFamily: "Inter-Regular",
    marginBottom: 16,
  },
  authorText: {
    fontWeight: 400,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0,
    textAlign: "left",
    color: "#1C1F21",
    fontFamily: "Inter-Regular",
    marginBottom: 4,
  },
  scrollView: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  customHeader: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
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
    minHeight: "100%",
  },
  title: {
    fontWeight: 100,
    marginBottom: 16,
    fontFamily: "Literata-ExtraBold",
    lineHeight: 38,
    letterSpacing: -0.2,
    fontSize: 32,
    color: "#1C1F21",
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
    backgroundColor: "#2196F3", // You can use theme colors
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  clearButton: {
    backgroundColor: "#ff3b30",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  clearButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: "column",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
  },
  statsText: {
    fontSize: 14,
    color: "#666",
    marginVertical: 2,
  },
  imageContainer: {
    marginBottom: 24,
    width: "100%",
    borderRadius: 0,
    overflow: "hidden",
  },
  featureImage: {
    width: "100%",
    height: 300,
    borderRadius: 0,
  },
});
