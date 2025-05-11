import type React from "react";
import { TouchableOpacity, View, StyleSheet, type ViewStyle, type TextStyle } from "react-native";
import { ThemeText } from "@/components/primitives";
import { SvgIcon } from "@/components/SvgIcon";
import { useTheme } from "@/theme";

export interface CustomTagBadgeProps {
  label: string;
  onRemove?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * CustomTagBadge component displays a tag in the exact style from the design
 * with a pink background and white text
 */
const CustomTagBadge: React.FC<CustomTagBadgeProps> = ({ label, onRemove, style, textStyle }) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <ThemeText style={[styles.text, { color: theme.colors.white }, textStyle]} numberOfLines={1}>
        {label}
      </ThemeText>

      {onRemove && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <SvgIcon name="close" size={16} color={theme.colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF8A8A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  text: {
    fontWeight: "500",
    fontSize: 14,
  },
  removeButton: {
    marginLeft: 4,
  },
});

export default CustomTagBadge;
