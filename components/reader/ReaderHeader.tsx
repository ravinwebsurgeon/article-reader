import React, { useRef, useCallback } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemeView, ThemeText } from "@/components/primitives";
import { SvgIcon } from "@/components/SvgIcon";
import { useTheme, useSpacing } from "@/theme/hooks";
import { createMenuPosition } from "@/components/shared/menu/menuAnimationPresents";
import { ActionMenuPosition } from "@/components/shared/menu/ReusableActionMenu";
import ReaderActionMenu from "@/components/shared/menu/ReaderActionMenu";
import Item from "@/database/models/ItemModel";

// Constants
const ICON_SIZE = 24;
const CHEVRON_SIZE = 28;

interface HeaderProps {
  item: Item;
  browserMode: boolean;
  onToggleView: () => void;
  progress?: number;
  isUserScrolled?: boolean;
  onBack: () => void;
}

export const ReaderHeader: React.FC<HeaderProps> = ({
  item,
  browserMode,
  onToggleView,
  onBack,
}) => {
  const theme = useTheme();
  const spacing = useSpacing();
  const menuButtonRef = useRef<View>(null);

  // State
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState<ActionMenuPosition>({});

  // Create styles using theme values
  const styles = StyleSheet.create({
    header: {
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.md - spacing.xs, // 12px equivalent
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.divider,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.xs,
    },
    savesText: {
      marginLeft: spacing.xs,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerIconButton: {
      padding: spacing.sm,
      marginLeft: spacing.sm,
    },
  });

  // Handle opening the action menu
  const handleOpenMenu = useCallback(() => {
    if (menuButtonRef.current) {
      menuButtonRef.current.measure(
        (
          _x: number,
          _y: number,
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
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  return (
    <>
      <ThemeView style={styles.header} row backgroundColor={theme.colors.background.default}>
        <ThemeView style={styles.headerLeft} row centered>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back to saves"
            accessibilityHint="Returns to the previous screen and saves reading progress"
          >
            <Ionicons
              name="chevron-back-outline"
              size={CHEVRON_SIZE}
              color={theme.colors.text.primary}
            />
            <ThemeText variant="body1" style={styles.savesText}>
              Saves
            </ThemeText>
          </TouchableOpacity>
        </ThemeView>

        <ThemeView style={styles.headerRight} row>
          <TouchableOpacity
            style={styles.headerIconButton}
            accessibilityRole="button"
            accessibilityLabel="Listen to article"
            accessibilityHint="Start audio playback of the article"
          >
            <SvgIcon name="listen" size={ICON_SIZE} color={theme.colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onToggleView}
            style={styles.headerIconButton}
            accessibilityRole="button"
            accessibilityLabel={browserMode ? "Switch to reader view" : "Switch to browser view"}
            accessibilityHint="Toggle between reader and browser viewing modes"
          >
            <SvgIcon
              name={browserMode ? "reader" : "compass"}
              size={ICON_SIZE}
              color={theme.colors.icon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            ref={menuButtonRef}
            style={styles.headerIconButton}
            onPress={handleOpenMenu}
            accessibilityRole="button"
            accessibilityLabel="More options"
            accessibilityHint="Open menu with additional article options"
          >
            <Ionicons
              name="ellipsis-horizontal-outline"
              size={ICON_SIZE}
              color={theme.colors.icon}
            />
          </TouchableOpacity>
        </ThemeView>
      </ThemeView>

      <ReaderActionMenu
        item={item}
        visible={menuVisible}
        position={menuPosition}
        onClose={handleCloseMenu}
      />
    </>
  );
};

export default ReaderHeader;
