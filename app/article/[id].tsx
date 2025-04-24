// src/app/article/[id].tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, lightColors } from "@/theme";
import { useAppSelector } from "@/redux/hook";
import { selectActiveTheme } from "@/redux/utils";
import {
  useToggleFavoriteMutation,
  useToggleArchiveMutation,
} from "@/redux/services/itemsApi";
import { useGetItemQuery } from "@/redux/services/itemsApi";
// import { formatDate } from "@/utils/formatter";

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Helper function to calculate read time
const calculateReadTime = (wordCount) => {
  if (!wordCount) return 0;
  return Math.ceil(wordCount / 200); // Assuming average reading speed of 200 words per minute
};

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams();
  console.log("Article ID:", id);
  const router = useRouter();
  const activeTheme = useAppSelector(selectActiveTheme);
  const isDarkMode = activeTheme === "dark";

  // State
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);

  // Get item data
  const { data, isLoading, error } = useGetItemQuery(id, {
    // If we have an error, don't keep refetching
    skip: !!error,
  });

  console.log("Item data:", data);

  // Mutations
  const [toggleFavorite, { isLoading: isTogglingFavorite }] =
    useToggleFavoriteMutation();
  const [toggleArchive, { isLoading: isTogglingArchive }] =
    useToggleArchiveMutation();

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Handle read article
  const handleReadArticle = () => {
    if (data?.item) {
      router.push(`/reader/${data.item.id}`);
    }
  };

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    if (data?.item) {
      try {
        await toggleFavorite({
          id: data.item.id,
          favorite: !data.item.favorite,
        }).unwrap();
      } catch (error) {
        Alert.alert("Error", "Failed to update favorite status");
      }
    }
  };

  // Handle archive toggle
  const handleArchiveToggle = async () => {
    if (data?.item) {
      try {
        await toggleArchive({
          id: data.item.id,
          archived: !data.item.archived,
        }).unwrap();
      } catch (error) {
        Alert.alert("Error", "Failed to update archive status");
      }
    }
  };

  // Handle share
  const handleShare = async () => {
    if (data?.item) {
      try {
        await Share.share({
          message: `Check out this article: ${data.item.title} - ${data.item.url}`,
          url: data.item.url,
        });
      } catch (error) {
        console.error("Error sharing article:", error);
      }
    }
  };

  // Toggle action menu
  const toggleActionMenu = () => {
    setIsActionMenuVisible(!isActionMenuVisible);
  };

  // If loading, show loading indicator
  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            backgroundColor: isDarkMode
              ? COLORS.darkBackground
              : lightColors.background.default,
          },
        ]}
      >
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <ActivityIndicator size="large" color={COLORS.primary.main} />
      </View>
    );
  }

  // If error, show error message
  if (error || !data?.item) {
    return (
      <View
        style={[
          styles.errorContainer,
          {
            backgroundColor: isDarkMode
              ? COLORS.darkBackground
              : lightColors.background.default,
          },
        ]}
      >
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <Text
          style={[
            styles.errorText,
            { color: isDarkMode ? COLORS.white : COLORS.text },
          ]}
        >
          Could not load the article. Please try again.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const item = data.item;
  const readTime = calculateReadTime(item.word_count);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode
            ? COLORS.darkBackground
            : lightColors.background.default,
        },
      ]}
    >
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkMode ? COLORS.white : COLORS.text}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleActionMenu}>
          <Ionicons
            name="ellipsis-horizontal"
            size={24}
            color={isDarkMode ? COLORS.white : COLORS.text}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView}>
        {item.image_url && (
          <Image
            source={{ uri: item.image_url }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { color: isDarkMode ? COLORS.white : COLORS.text },
            ]}
          >
            {item.title}
          </Text>

          <View style={styles.metaContainer}>
            {item.site_name && (
              <Text style={styles.metaText}>{item.site_name}</Text>
            )}

            <Text style={styles.dotSeparator}>•</Text>

            <Text style={styles.metaText}>{formatDate(item.published_at)}</Text>

            {readTime > 0 && (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.metaText}>{readTime} min read</Text>
              </>
            )}
          </View>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.map((tag, index) => (
                <View key={index} style={styles.tagItem}>
                  <Ionicons
                    name="pricetag-outline"
                    size={14}
                    color={COLORS.darkGray}
                  />
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Progress indicator */}
          {item.progress && parseFloat(item.progress) > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${parseFloat(item.progress) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(parseFloat(item.progress) * 100)}% read
              </Text>
            </View>
          )}
          

          {/* Article excerpt */}
          <Text
            style={[
              styles.excerpt,
              { color: isDarkMode ? COLORS.lightGray : COLORS.darkGray },
            ]}
          >
            {item.description}
          </Text>
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: isDarkMode
              ? COLORS.darkBackground
              : lightColors.background.default,
            borderTopColor: isDarkMode ? COLORS.darkBorder : COLORS.lightBorder,
          },
        ]}
      >
        <TouchableOpacity style={styles.readButton} onPress={handleReadArticle}>
          <Text style={styles.readButtonText}>Read</Text>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleFavoriteToggle}
            disabled={isTogglingFavorite}
          >
            <Ionicons
              name={item.favorite ? "star" : "star-outline"}
              size={24}
              color={
                item.favorite
                  ? COLORS.favorite
                  : isDarkMode
                  ? COLORS.white
                  : COLORS.text
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleArchiveToggle}
            disabled={isTogglingArchive}
          >
            <Ionicons
              name="archive-outline"
              size={24}
              color={isDarkMode ? COLORS.white : COLORS.text}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons
              name="share-outline"
              size={24}
              color={isDarkMode ? COLORS.white : COLORS.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Menu (conditionally rendered) */}
      {isActionMenuVisible && (
        <View style={styles.actionMenuOverlay}>
          <TouchableOpacity
            style={styles.actionMenuBackdrop}
            onPress={toggleActionMenu}
            activeOpacity={1}
          />

          <View
            style={[
              styles.actionMenu,
              { backgroundColor: isDarkMode ? COLORS.darkGray : COLORS.white },
            ]}
          >
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                handleShare();
                toggleActionMenu();
              }}
            >
              <Ionicons
                name="share-outline"
                size={22}
                color={isDarkMode ? COLORS.white : COLORS.text}
              />
              <Text
                style={[
                  styles.actionMenuText,
                  { color: isDarkMode ? COLORS.white : COLORS.text },
                ]}
              >
                Share
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                handleFavoriteToggle();
                toggleActionMenu();
              }}
            >
              <Ionicons
                name={item.favorite ? "star" : "star-outline"}
                size={22}
                color={
                  item.favorite
                    ? COLORS.favorite
                    : isDarkMode
                    ? COLORS.white
                    : COLORS.text
                }
              />
              <Text
                style={[
                  styles.actionMenuText,
                  { color: isDarkMode ? COLORS.white : COLORS.text },
                ]}
              >
                {item.favorite ? "Unfavorite" : "Favorite"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                handleArchiveToggle();
                toggleActionMenu();
              }}
            >
              <Ionicons
                name="archive-outline"
                size={22}
                color={isDarkMode ? COLORS.white : COLORS.text}
              />
              <Text
                style={[
                  styles.actionMenuText,
                  { color: isDarkMode ? COLORS.white : COLORS.text },
                ]}
              >
                {item.archived ? "Unarchive" : "Archive"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={toggleActionMenu}
            >
              <Ionicons name="trash-outline" size={22} color={COLORS.error.main} />
              <Text style={[styles.actionMenuText, { color: COLORS.error.main }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: COLORS.primary.main,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  thumbnail: {
    width: "100%",
    height: 240,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    lineHeight: 32,
  },
  metaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 16,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  dotSeparator: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginHorizontal: 6,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  excerpt: {
    fontSize: 16,
    lineHeight: 24,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  readButton: {
    backgroundColor: COLORS.primary.main,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 24,
  },
  readButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
  },
  actionButton: {
    marginLeft: 20,
    padding: 4,
  },
  actionMenuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  actionMenuBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  actionMenu: {
    width: "80%",
    borderRadius: 12,
    padding: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  actionMenuText: {
    fontSize: 16,
    marginLeft: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.lightGray,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary.main,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
});
