import React, { useMemo, useRef, useState, useCallback } from "react";
import { StyleSheet, TouchableOpacity, ViewStyle, StyleProp, View, ScrollView } from "react-native";
import { Image } from "expo-image";
import Item from "@/database/models/ItemModel";
import Tag from "@/database/models/TagModel";
import { useDarkMode, useTheme, type Theme } from "@/theme";
import { ThemeText } from "@/components/primitives";
import { withObservables } from "@nozbe/watermelondb/react";
import Svg, { Path, Rect } from "react-native-svg";
import { SvgIcon } from "@/components/SvgIcon";
import { createMenuPosition } from "@/components/shared/menu/menuAnimationPresents";
import ArticleActionMenu from "@/components/shared/menu/ArticleActionMenu";
import { LinearGradient } from "expo-linear-gradient";
import { hexToRgba } from "@/utils/colors";
import { withItemTags } from "@/database/hooks/withTags";

// Export a fixed height constant for use in FlatList
export const ITEM_CARD_HEIGHT = 143;

interface MenuPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  position?: "top" | "bottom" | "left" | "right" | "center";
  align?: "start" | "center" | "end";
}

/**
 * Props for the ItemCard component
 * @property {Item} item - The item to display
 * @property {Tag[]} itemTags - Tags associated with the item
 * @property {StyleProp<ViewStyle>} [style] - Optional style overrides for the card container
 * @property {() => void} onPress - Callback when the card is pressed
 */
interface ItemCardProps {
  item: Item;
  itemTags: Tag[];
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
}

const makeStyles = (theme: Theme, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 0.5,
      height: ITEM_CARD_HEIGHT,
      borderBottomColor: theme.colors.divider,
    },
    contentContainer: {
      flex: 1,
    },
    cardTop: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 8,
    },
    cardTopLeft: {
      flex: 1,
    },
    header: {
      marginBottom: 8,
    },
    metaContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    sourceText: {
      maxWidth: 200,
      color: theme.colors.text.subtle,
    },
    dotText: {
      color: theme.colors.text.subtle,
      marginHorizontal: 4,
    },
    readTimeText: {
      color: theme.colors.text.subtle,
    },
    tagsAndMenuContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 0,
    },
    leftSectionOfTagsAndMenu: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      overflow: "hidden",
    },
    favoriteContainer: {
      marginRight: 4,
    },
    tagsContainerWrapper: {
      position: "relative",
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      overflow: "hidden",
      marginRight: 8,
    },
    tagsScrollContent: {
      flexDirection: "row",
      alignItems: "center",
      paddingRight: 40,
    },
    tagItemContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.gray[200],
      height: 24,
      paddingLeft: 8,
      paddingRight: 10,
      borderRadius: 4,
      marginBottom: 4,
      marginRight: 4,
    },
    tagIconSvg: {
      marginRight: 2,
    },
    tagText: {
      marginLeft: 4,
      lineHeight: 14,
    },
    menuButton: {
      paddingLeft: 8,
    },
    thumbnail: {
      width: 100,
      height: 75,
      borderRadius: 4,
      backgroundColor: theme.colors.gray[100],
    },
    tagsGradient: {
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      width: 60,
      zIndex: 1,
      pointerEvents: "none",
    },
  });

/**
 * Renders a tag item with icon and name
 */
const TagItem = ({
  tag,
  theme,
  styles,
}: {
  tag: Tag;
  theme: Theme;
  styles: ReturnType<typeof makeStyles>;
}) => (
  <View style={styles.tagItemContainer}>
    <Svg width="16" height="16" viewBox="0 0 18 18" fill="none" style={styles.tagIconSvg}>
      <Path
        d="M11.1912 4.08891C10.9959 3.89364 10.6794 3.89364 10.4841 4.08891C10.2888 4.28417 10.2888 4.60075 10.4841 4.79601L11.1912 5.50312C11.3865 5.69838 11.703 5.69838 11.8983 5.50312C12.0936 5.30786 12.0936 4.99127 11.8983 4.79601L11.1912 4.08891Z"
        fill={theme.colors.icon}
        fillOpacity={0.84}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.1241 1.77936C12.6084 1.26364 11.9089 0.973907 11.1795 0.973907H9.08119C8.35185 0.973907 7.65238 1.26364 7.13665 1.77936L1.51121 7.40481C0.437264 8.47875 0.437264 10.22 1.51121 11.2939L4.70173 14.4844C5.77134 15.554 7.504 15.559 8.5797 14.4955L14.2307 8.90853C14.7609 8.38434 15.0556 7.66733 15.0471 6.9218L15.0229 4.78634C15.0148 4.06783 14.7258 3.38104 14.2177 2.87294L13.1241 1.77936ZM11.1795 2.22391C11.5774 2.22391 11.9589 2.38194 12.2402 2.66325L13.3338 3.75682C13.6109 4.03397 13.7686 4.40858 13.773 4.8005L13.7972 6.93595C13.8018 7.3426 13.6411 7.7337 13.3519 8.01962L7.70087 13.6066C7.11413 14.1867 6.16904 14.184 5.58561 13.6005L2.39509 10.41C1.8093 9.82423 1.8093 8.87448 2.39509 8.28869L8.02053 2.66325C8.30184 2.38194 8.68337 2.22391 9.08119 2.22391H11.1795Z"
        fill={theme.colors.icon}
        fillOpacity={0.84}
      />
    </Svg>
    <ThemeText
      numberOfLines={1}
      style={styles.tagText}
      variant="tagStyle"
      color={theme.colors.text.dark}
    >
      {tag.name}
    </ThemeText>
  </View>
);

TagItem.displayName = "TagItem";

/**
 * Renders the favorite icon if the item is favorited
 */
const FavoriteIcon = ({
  theme,
  styles,
}: {
  theme: Theme;
  styles: ReturnType<typeof makeStyles>;
}) => (
  <View style={styles.favoriteContainer}>
    <Svg width="36" height="28" viewBox="0 0 36 28" fill="none">
      <Rect width="36" height="24" rx="6" fill={theme.colors.favorite} />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.0419 5.35035C16.7722 3.61747 19.2278 3.61747 19.9582 5.35035L20.9914 7.80169C21.0767 8.00415 21.2621 8.14693 21.4796 8.17776L24.1661 8.55846C25.9397 8.8098 26.6257 11.0082 25.3097 12.2235L23.2641 14.1128C23.1119 14.2533 23.0392 14.4601 23.0701 14.6649L23.5036 17.5456C23.7761 19.3566 21.7831 20.6411 20.2463 19.645L18.34 18.4092C18.1332 18.2751 17.8669 18.2751 17.6601 18.4092L15.7537 19.645C14.217 20.6411 12.224 19.3566 12.4965 17.5456L12.93 14.6649C12.9608 14.4601 12.8882 14.2533 12.736 14.1128L10.6903 12.2235C9.37437 11.0082 10.0603 8.8098 11.8339 8.55846L14.5204 8.17776C14.7379 8.14693 14.9233 8.00415 15.0086 7.80169L16.0419 5.35035ZM18.8063 5.83584C18.5056 5.12231 17.4945 5.12231 17.1937 5.83584L16.1605 8.28719C15.9045 8.89456 15.3484 9.32292 14.6958 9.4154L12.0093 9.7961C11.279 9.89959 10.9966 10.8048 11.5384 11.3052L13.5841 13.1945C14.0406 13.6161 14.2585 14.2365 14.1661 14.851L13.7326 17.7316C13.6204 18.4773 14.441 19.0063 15.0738 18.5961L16.9801 17.3603C17.6006 16.9581 18.3995 16.9581 19.0199 17.3603L20.9263 18.5961C21.5591 19.0063 22.3797 18.4773 22.2675 17.7316L21.834 14.851C21.7415 14.2365 21.9595 13.6161 22.416 13.1945L24.4616 11.3052C25.0035 10.8048 24.7211 9.89959 23.9907 9.7961L21.3043 9.4154C20.6517 9.32292 20.0955 8.89456 19.8395 8.28719L18.8063 5.83584Z"
        fill={theme.colors.black}
      />
    </Svg>
  </View>
);

FavoriteIcon.displayName = "FavoriteIcon";

/**
 * Renders the tags section with horizontal scrolling
 */
const TagsSection = ({
  tags,
  theme,
  styles,
}: {
  tags: Tag[];
  theme: Theme;
  styles: ReturnType<typeof makeStyles>;
}) => (
  <View style={styles.tagsContainerWrapper}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tagsScrollContent}
      scrollEventThrottle={16}
    >
      {tags.map((tag, index) => (
        <TagItem key={index} tag={tag} theme={theme} styles={styles} />
      ))}
    </ScrollView>
    <LinearGradient
      colors={[hexToRgba(theme.colors.background.default, 0), theme.colors.background.default]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.tagsGradient, { width: 24 }]}
      locations={[0.3, 1]}
    />
  </View>
);

TagsSection.displayName = "TagsSection";

const ItemCardComponent = ({ item, itemTags, onPress, style }: ItemCardProps) => {
  const theme = useTheme();
  const isDarkMode = useDarkMode();
  const styles = useMemo(() => makeStyles(theme, isDarkMode), [theme, isDarkMode]);

  const menuButtonRef = useRef<View>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({} as MenuPosition);

  const formatReadTime = useCallback((minutes: number) => {
    return `${minutes} min`;
  }, []);

  const handleMenuPressInternal = useCallback(() => {
    if (menuButtonRef.current) {
      menuButtonRef.current.measure(
        (_x: number, _y: number, width: number, height: number, pageX: number, pageY: number) => {
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

  // Show URL as fallback if no title
  const displayTitle = item?.title ?? item?.url ?? "Untitled";

  const readTime = item.readTime;

  return (
    <>
      <TouchableOpacity style={[styles.container, style]} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.contentContainer}>
          <View style={styles.cardTop}>
            <View style={styles.cardTopLeft}>
              <View style={styles.header}>
                <ThemeText numberOfLines={item.title ? 2 : 3} variant="h6">
                  {displayTitle}
                </ThemeText>
              </View>
              {(item.source ?? readTime > 0) && (
                <View style={styles.metaContainer}>
                  {item.source && (
                    <ThemeText numberOfLines={1} style={styles.sourceText} variant="caption2">
                      {item.source}
                    </ThemeText>
                  )}
                  {item.source && readTime > 0 && (
                    <ThemeText variant="caption2" style={styles.dotText}>
                      •
                    </ThemeText>
                  )}
                  {readTime > 0 && (
                    <ThemeText variant="caption2" style={styles.readTimeText}>
                      {formatReadTime(readTime)}
                    </ThemeText>
                  )}
                </View>
              )}
            </View>
            {item.imageUrl && (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.thumbnail}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={item.id}
                transition={100}
              />
            )}
          </View>

          <View style={styles.tagsAndMenuContainer}>
            <View style={styles.leftSectionOfTagsAndMenu}>
              {item.favorite && <FavoriteIcon theme={theme} styles={styles} />}
              {itemTags.length > 0 && <TagsSection tags={itemTags} theme={theme} styles={styles} />}
            </View>
            <TouchableOpacity
              ref={menuButtonRef}
              style={styles.menuButton}
              onPress={handleMenuPressInternal}
            >
              <SvgIcon name="menu-dots" size={26} color={theme.colors.text.subtle} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
      {menuVisible && (
        <ArticleActionMenu
          item={item}
          visible={menuVisible}
          position={menuPosition}
          onClose={handleCloseMenu}
        />
      )}
    </>
  );
};

const enhance = withObservables(["item"], ({ item }: { item: Item }) => ({
  item: item.observe(),
}));

export default enhance(withItemTags()(ItemCardComponent));
