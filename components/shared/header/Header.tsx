import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

// Import themed components and hooks
import { ThemeView, ThemeText, ThemeTouchable } from "@/components/primitives";
import { useTheme } from "@/theme/hooks";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showMenu?: boolean;
  onBackPress?: () => void;
  onSearchPress?: () => void;
  onMenuPress?: () => void;
  renderLeft?: () => React.ReactNode;
  renderRight?: () => React.ReactNode;
  backgroundColor?: string;
  titleColor?: string;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  showSearch = false,
  showMenu = false,
  onBackPress,
  onSearchPress,
  onMenuPress,
  renderLeft,
  renderRight,
  backgroundColor,
  titleColor,
  elevation = 1,
}) => {
  const theme = useTheme();

  // Default colors from theme if not specified
  const bgColor = backgroundColor ?? theme.colors.background.default;
  const txtColor = titleColor ?? theme.colors.text.primary;

  const renderLeftContent = () => {
    if (renderLeft) {
      return renderLeft();
    }

    if (showBack) {
      return (
        <ThemeTouchable style={styles.iconButton} onPress={onBackPress}>
          <Ionicons name="arrow-back-outline" size={24} color={theme.colors.text.primary} />
        </ThemeTouchable>
      );
    }

    return null;
  };

  const renderRightContent = () => {
    if (renderRight) {
      return renderRight();
    }

    return (
      <ThemeView style={styles.rightContainer} row>
        {showSearch && (
          <ThemeTouchable style={styles.iconButton} onPress={onSearchPress}>
            <Ionicons name="search-outline" size={24} color={theme.colors.text.primary} />
          </ThemeTouchable>
        )}

        {showMenu && (
          <ThemeTouchable style={styles.iconButton} onPress={onMenuPress}>
            <Ionicons
              name="ellipsis-horizontal-outline"
              size={24}
              color={theme.colors.text.primary}
            />
          </ThemeTouchable>
        )}
      </ThemeView>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ThemeView style={styles.container} row backgroundColor={bgColor} elevation={elevation}>
        <ThemeView style={styles.leftContainer}>{renderLeftContent()}</ThemeView>

        {title && (
          <ThemeText variant="h6" color={txtColor} style={styles.title} numberOfLines={1}>
            {title}
          </ThemeText>
        )}

        {renderRightContent()}
      </ThemeView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    width: "100%",
    zIndex: 10,
  },
  container: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 40,
  },
  rightContainer: {
    alignItems: "center",
    minWidth: 40,
  },
  title: {
    flex: 1,
    textAlign: "center",
  },
  iconButton: {
    padding: 4,
    marginHorizontal: 4,
  },
});
