import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { ThemeView, ThemeText } from "@/components/primitives";
import { SvgIcon } from "@/components/SvgIcon";
import { useTheme } from "@/theme/hooks";
import RecommendedItems from "@/components/item/RecommendedItems";
import { withRecommendedItems } from "@/database/hooks/withRecommendedItems";
import Item from "@/database/models/ItemModel";

interface UpNextProps {
  item: Item;
}

export const UpNext: React.FC<UpNextProps> = ({ item }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  // Memoize the EnhancedRecommendedItems component
  const EnhancedRecommendedItems = useMemo(
    () =>
      withRecommendedItems({ currentItem: item })(({ recommendedItems }) => (
        <RecommendedItems items={recommendedItems} />
      )),
    [item], // Include the entire item object in dependencies
  );

  return (
    <ThemeView style={styles.container} backgroundColor={theme.colors.background.paper}>
      <ThemeView style={styles.header} backgroundColor={theme.colors.background.paper} row>
        <SvgIcon name="up-next" size={18} color={theme.colors.text.secondary} />
        <ThemeText variant="guide" color={theme.colors.text.secondary} style={styles.headerText}>
          {t("reader.upNext")}
        </ThemeText>
      </ThemeView>
      <EnhancedRecommendedItems />
    </ThemeView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    position: "relative",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 12,
    position: "absolute",
    top: -12,
  },
  headerText: {
    marginLeft: 8,
  },
});

export default UpNext;
