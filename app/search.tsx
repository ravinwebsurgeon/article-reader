import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
  ViewStyle,
  TextStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme";
import ArticleCard from "@/components/shared/card/ArticleCard";
import ItemModel from "@/database/models/ItemModel";
import { withSearch } from "@/database/hooks/withItems";
import { useTranslation } from "react-i18next";

// Base component without database connection
const SearchScreenComponent = ({
  items = [],
  searchQuery,
  onSearchQueryChange,
}: {
  items?: ItemModel[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}) => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const isDarkMode = theme.mode === "dark";

  // State
  // Determine if we should show results or empty/no-results state
  const shouldShowResults = searchQuery.trim().length > 0;

  // Clear input and dismiss keyboard
  const handleClearSearch = () => {
    onSearchQueryChange("");
    Keyboard.dismiss();
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Navigate to article detail
  const navigateToArticle = (item: ItemModel) => {
    router.push({
      pathname: "/reader/[id]" as const,
      params: { id: item.id },
    });
  };

  // Render article item
  const renderItem = ({ item }: { item: ItemModel }) => (
    <ArticleCard item={item} onPress={() => navigateToArticle(item)} />
  );

  const dynamicStyles: {
    container: ViewStyle;
    searchInput: TextStyle;
    emptyStateText: TextStyle;
    logoText: TextStyle;
    noResultsText: TextStyle;
    noResultsSubtext: TextStyle;
    cancelText: TextStyle;
  } = {
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.default,
    },
    searchInput: {
      flex: 1,
      height: 40,
      fontSize: 16,
      color: theme.colors.text.primary,
    },
    emptyStateText: {
      fontSize: 20,
      fontWeight: "600" as const,
      color: theme.colors.text.secondary,
    },
    logoText: {
      fontSize: 24,
      fontWeight: "700" as const,
      color: theme.colors.text.primary,
    },
    noResultsText: {
      fontSize: 20,
      fontWeight: "600" as const,
      color: theme.colors.text.primary,
    },
    noResultsSubtext: {
      fontSize: 16,
      color: theme.colors.text.secondary,
      marginTop: 8,
    },
    cancelText: {
      fontSize: 16,
      color: theme.colors.primary.main,
      marginLeft: 12,
    },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.text.secondary}
            style={styles.searchIcon}
          />

          <TextInput
            style={dynamicStyles.searchInput}
            placeholder={t("search.placeholder")}
            placeholderTextColor={theme.colors.text.disabled}
            value={searchQuery}
            onChangeText={onSearchQueryChange}
            autoFocus
            returnKeyType="search"
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={handleBack}>
          <Text style={dynamicStyles.cancelText}>{t("common.cancel")}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {!shouldShowResults ? (
        // Initial Empty search state
        <View style={styles.emptyStateContainer}>
          <Text style={dynamicStyles.emptyStateText}>{t("search.emptyState")}</Text>

          <View style={styles.logoContainer}>
            <View style={[styles.logoIcon, { backgroundColor: theme.colors.primary.main }]}>
              <View style={styles.logoHeart} />
            </View>
            <Text style={dynamicStyles.logoText}>{t("app.name")}</Text>
          </View>
        </View>
      ) : items && items.length === 0 ? (
        // No results state (only shown if shouldShowResults is true)
        <View style={styles.noResultsContainer}>
          <Text style={dynamicStyles.noResultsText}>
            {t("search.noResults.title", { query: searchQuery })}
          </Text>
          <Text style={dynamicStyles.noResultsSubtext}>{t("search.noResults.subtitle")}</Text>
        </View>
      ) : (
        // Results list (only shown if shouldShowResults is true and items exist)
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

// Define props for SearchScreenComponent to use with rest spread
interface SearchScreenComponentProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

// Create the enhanced component ONCE outside the main component
// It receives the raw `items` observable based on the `query` prop
const EnhancedSearchScreen = withSearch()(
  ({ items, ...props }: { items: ItemModel[] } & SearchScreenComponentProps) => (
    <SearchScreenComponent items={items} {...props} />
  ),
);

// Wrapper component that provides the search query state
export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    // Pass the changing searchQuery as a prop to the stable EnhancedSearchScreen
    <EnhancedSearchScreen
      query={searchQuery}
      searchQuery={searchQuery} // Pass to SearchScreenComponent for display/input
      onSearchQueryChange={setSearchQuery}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(142, 142, 147, 0.12)",
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  clearButton: {
    padding: 4,
  },
  cancelButton: {
    padding: 8,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  logoHeart: {
    width: 16,
    height: 16,
    backgroundColor: "white",
    borderRadius: 8,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  listContainer: {
    padding: 16,
  },
});
