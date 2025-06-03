import React from "react";
import { TouchableOpacity, StyleSheet, Share } from "react-native";
import { useTranslation } from "react-i18next";
import Svg, { Path } from "react-native-svg";
import { ThemeView, ThemeText } from "@/components/primitives";
import { SvgIcon } from "@/components/SvgIcon";
import { useTheme } from "@/theme/hooks";
import Item from "@/database/models/ItemModel";

interface ReaderAfterReadingProps {
  item: Item;
}

export const ReaderAfterReading: React.FC<ReaderAfterReadingProps> = ({ item }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    await item.toggleFavorite();
  };

  // Handle archive toggle
  const handleArchiveToggle = async () => {
    await item.toggleArchived();
  };

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

  return (
    <ThemeView style={styles.container}>
      <ThemeView style={styles.sectionHeader} backgroundColor={theme.colors.background.paper}>
        <ThemeView style={styles.headerContent} backgroundColor={theme.colors.background.paper} row>
          <SvgIcon name="goto" size={18} color={theme.colors.text.secondary} />
          <ThemeText variant="guide" color={theme.colors.text.secondary} style={styles.headerText}>
            {t("reader.afterReading")}
          </ThemeText>
        </ThemeView>
      </ThemeView>

      <ThemeView style={styles.actions} row centered>
        <TouchableOpacity
          style={[
            styles.actionButton,
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
              name="favorite"
              size={22}
              color={theme.colors.text.primary}
              style={styles.actionIcon}
            />
          )}
          <ThemeText variant="body2">
            {item.favorite ? t("reader.favorited") : t("reader.favorite")}
          </ThemeText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
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
              style={styles.actionIcon}
            />
          )}
          <ThemeText variant="body2">{t("reader.archive")}</ThemeText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
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
            style={styles.actionIcon}
          />
          <ThemeText variant="body2">{t("menu.share")}</ThemeText>
        </TouchableOpacity>
      </ThemeView>
    </ThemeView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    position: "relative",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  headerContent: {
    alignItems: "center",
    marginBottom: 12,
    position: "absolute",
    top: -12,
  },
  headerText: {
    marginLeft: 8,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingVertical: 12,
    gap: 8,
    marginVertical: 16,
  },
  actionButton: {
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flex: 1,
    flexBasis: "40%",
    borderRadius: 8,
  },
  actionIcon: {
    // Optional icon styling
  },
});

export default ReaderAfterReading;
