import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { ThemeText } from "@/components/primitives";
import { SvgIcon } from "@/components/SvgIcon";
import { useColors } from "@/theme/hooks";

export interface TagBadgeProps {
  label: string;
  onPress?: () => void;
  onRemove?: () => void;
  color?: string;
  backgroundColor?: string;
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
  textStyle?: TextStyle;
  removable?: boolean;
}

/**
 * TagBadge component displays a tag in a chip/badge format
 *
 * Features:
 * - Customizable colors
 * - Different size options
 * - Optional remove button
 * - Press handler for the entire badge
 */
const TagBadge: React.FC<TagBadgeProps> = ({
  label,
  onPress,
  onRemove,
  color,
  backgroundColor,
  size = "medium",
  style,
  textStyle,
  removable = true,
}) => {
  const colors = useColors();

  // Default colors if not provided
  const badgeColor = color ?? colors.primary.main;
  const badgeBgColor = backgroundColor ?? colors.secondary.main;

  // Get dynamic styles based on size
  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          container: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
          },
          text: {
            fontSize: 12,
          },
          icon: 14,
        };
      case "medium":
        return {
          container: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
          },
          text: {
            fontSize: 12,
          },
          icon: 16,
        };
      case "large":
        return {
          container: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          },
          text: {
            fontSize: 16,
          },
          icon: 18,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[styles.container, sizeStyles.container, { backgroundColor: badgeBgColor }, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <ThemeText
        style={[styles.text, sizeStyles.text, { color: badgeColor }, textStyle]}
        numberOfLines={1}
      >
        {label}
      </ThemeText>

      {removable && onRemove && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <SvgIcon name="close" size={sizeStyles.icon} color={badgeColor} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: 8,
    marginBottom: 8,
  },
  text: {
    fontWeight: "600",
    marginBottom: -2,
  },
  removeButton: {
    marginLeft: 4,
  },
});

export default TagBadge;
