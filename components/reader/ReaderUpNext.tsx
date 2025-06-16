import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { ThemeView, ThemeText } from "@/components/primitives";
import { SvgIcon } from "@/components/SvgIcon";
import { useTheme, useSpacing } from "@/theme/hooks";
import RecommendedItems from "@/components/item/RecommendedItems";
import { withNextItems } from "@/database/hooks/withRecommendedItems";
import Item from "@/database/models/ItemModel";

interface UpNextProps {
  item: Item;
}

export const ReaderUpNext: React.FC<UpNextProps> = ({ item }) => {
  const theme = useTheme();
  const spacing = useSpacing();
  const { t } = useTranslation();

  // Memoize styles to prevent recreation on every render
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginTop: spacing.xl + spacing.sm, // 40px equivalent
          paddingTop: spacing.md,
          paddingHorizontal: spacing.lg - spacing.xs, // 20px equivalent
        },
        sectionHeader: {
          position: "relative",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.divider,
        },
        headerContent: {
          alignItems: "center",
          marginBottom: spacing.md - spacing.xs, // 12px equivalent
          position: "absolute",
          top: -(spacing.md - spacing.xs), // -12px equivalent
          paddingRight: spacing.md, // Add more space on the right
        },
        headerText: {
          marginLeft: spacing.sm,
        },
      }),
    [theme.colors.divider, spacing],
  );

  // Memoize the EnhancedNextItems component
  const EnhancedNextItems = useMemo(
    () =>
      withNextItems(item)(({ nextItems }: { nextItems: Item[] }) => {
        // Hide the entire section if there are no next items
        if (!nextItems || nextItems.length === 0) {
          return null;
        }

        return (
          <ThemeView style={styles.container}>
            <ThemeView style={styles.sectionHeader} backgroundColor={theme.colors.background.paper}>
              <ThemeView
                style={styles.headerContent}
                backgroundColor={theme.colors.background.paper}
                row
              >
                <SvgIcon name="up-next" size={18} color={theme.colors.text.secondary} />
                <ThemeText
                  variant="guide"
                  color={theme.colors.text.secondary}
                  style={styles.headerText}
                >
                  {t("reader.upNext")}
                </ThemeText>
              </ThemeView>
            </ThemeView>
            <RecommendedItems items={nextItems} />
          </ThemeView>
        );
      }),
    [item, styles, theme.colors, t],
  );

  return <EnhancedNextItems />;
};

export default ReaderUpNext;
