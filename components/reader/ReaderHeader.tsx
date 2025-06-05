import React, { useRef } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemeView, ThemeText } from "@/components/primitives";
import { SvgIcon } from "@/components/SvgIcon";
import { useTheme } from "@/theme/hooks";
import { createMenuPosition } from "@/components/shared/menu/menuAnimationPresents";
import { ActionMenuPosition } from "@/components/shared/menu/ReusableActionMenu";
import ReaderActionMenu from "@/components/shared/menu/ReaderActionMenu";
import Item from "@/database/models/ItemModel";

interface HeaderProps {
  item: Item;
  browserMode: boolean;
  onToggleView: () => void;
  progress?: number;
  isUserScrolled?: boolean;
}

export const ReaderHeader: React.FC<HeaderProps> = ({
  item,
  browserMode,
  onToggleView,
  progress,
  isUserScrolled,
}) => {
  const router = useRouter();
  const theme = useTheme();
  const menuButtonRef = useRef<View>(null);

  // State
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState<ActionMenuPosition>({});

  // Handle navigation back
  const handleBack = async () => {
    // Only save if progress has changed from initial value
    if (isUserScrolled && progress !== item.progress) {
      console.log("Saving progress:", progress);
      await item
        .setProgress(progress as number)
        .catch((error) => console.error("Error saving progress:", error));
    }
    router.back();
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

  return (
    <>
      <ThemeView style={styles.header} row backgroundColor={theme.colors.background.paper}>
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

          <TouchableOpacity onPress={onToggleView} style={styles.headerIconButton}>
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

      <ReaderActionMenu
        item={item}
        visible={menuVisible}
        position={menuPosition}
        onClose={() => setMenuVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
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
});

export default ReaderHeader;
