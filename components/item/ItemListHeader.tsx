import React, { memo, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme";
import { Images } from "@/assets";
import Svg, { Path } from "react-native-svg";

const ItemListHeader = memo(() => {
  const router = useRouter();
  const theme = useTheme();

  const navigateToSearch = useCallback(() => {
    router.push("/search");
  }, [router]);

  const navigateToAddArticle = useCallback(() => {
    router.push("/add-article");
  }, [router]);

  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        {theme.mode === "dark" ? (
          <Image style={styles.logoIcon} source={Images.pa_dark_logo} />
        ) : (
          <Image style={styles.logoIcon} source={Images.pa_logo} />
        )}
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.iconButton} onPress={navigateToSearch}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
              d="M10.5 1.99994C5.80558 1.99994 2 5.80552 2 10.4999C2 15.1944 5.80558 18.9999 10.5 18.9999C12.5772 18.9999 14.4803 18.2549 15.9568 17.0174L20.7203 21.7809C21.0132 22.0738 21.488 22.0738 21.7809 21.7809C22.0738 21.488 22.0738 21.0131 21.7809 20.7202L17.0174 15.9567C18.2549 14.4803 19 12.5771 19 10.4999C19 5.80552 15.1944 1.99994 10.5 1.99994ZM3.5 10.4999C3.5 6.63395 6.63401 3.49994 10.5 3.49994C14.366 3.49994 17.5 6.63395 17.5 10.4999C17.5 14.3659 14.366 17.4999 10.5 17.4999C6.63401 17.4999 3.5 14.3659 3.5 10.4999Z"
              fill={theme.colors.icon}
              fillOpacity="0.84"
            />
          </Svg>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={navigateToAddArticle}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
              d="M12.25 2.99995C12.6642 2.99995 13 3.33574 13 3.74995V11H20.5C20.9142 11 21.25 11.3358 21.25 11.75C21.25 12.1642 20.9142 12.5 20.5 12.5H13V19.75C13 20.1642 12.6642 20.5 12.25 20.5C11.8358 20.5 11.5 20.1642 11.5 19.75V12.5H4C3.58579 12.5 3.25 12.1642 3.25 11.75C3.25 11.3358 3.58579 11 4 11H11.5V3.74995C11.5 3.33574 11.8358 2.99995 12.25 2.99995Z"
              fill={theme.colors.icon}
              fillOpacity="0.84"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );
});

ItemListHeader.displayName = "ItemListHeader";

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 50,
    height: 30,
  },
  logoIcon: {
    width: 120,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 20,
    padding: 4,
  },
});

export default ItemListHeader;
