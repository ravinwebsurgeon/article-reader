import { useTextColor, useTheme } from "@/theme/hooks";
import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import type { FontWeight } from "@/theme";

export type TextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "h7"
  | "h8"
  | "body1"
  | "body2"
  | "body1Bold"
  | "body2Bold"
  | "subtitle1"
  | "subtitle2"
  | "caption"
  | "caption2"
  | "overline"
  | "tagStyle"
  | "button"
  | "guide"
  | "meta"
  | "meta2"
  | "reader.title"
  | "reader.body"
  | "reader.bodyItalic"
  | "reader.heading1"
  | "reader.heading2"
  | "reader.heading3"
  | "reader.caption"
  | "reader.quote";

export type ThemeTextProps = TextProps & {
  variant?: TextVariant;
  color?: string;
  align?: "auto" | "left" | "right" | "center" | "justify";
  numberOfLines?: number;
  fontWeight?: FontWeight;
  italic?: boolean;
  underline?: boolean;
  uppercase?: boolean;
  lowercase?: boolean;
  capitalize?: boolean;
};

export const ThemeText: React.FC<ThemeTextProps> = ({
  style,
  variant = "body1",
  color,
  align,
  fontWeight,
  italic = false,
  underline = false,
  uppercase = false,
  lowercase = false,
  capitalize = false,
  children,
  ...otherProps
}) => {
  const theme = useTheme();
  const defaultTextColor = useTextColor();

  // Get font style based on variant
  const getVariantStyle = () => {
    if (variant.startsWith("reader.")) {
      const readerKey = variant.substring("reader.".length) as keyof typeof theme.typography.reader;    
      const readerStyle = theme.typography.reader[readerKey];

      return readerStyle || theme.typography.body1;
    } else {
      // Ensure variant is a valid key for the top-level typography styles
      const topLevelKey = variant as keyof Omit<typeof theme.typography, "reader">;
      const topLevelStyle = theme.typography[topLevelKey];
      return topLevelStyle || theme.typography.body1;
    }
  };

  // Transform text if needed
  const transformText = (text: React.ReactNode): React.ReactNode => {
    if (typeof text !== "string") return text;

    let transformedText = text;

    if (uppercase) transformedText = transformedText.toUpperCase();
    else if (lowercase) transformedText = transformedText.toLowerCase();
    else if (capitalize) {
      transformedText = transformedText
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    }

    return transformedText;
  };

  // Combine styles
  const variantStyle = getVariantStyle();
  const textStyle: (TextProps["style"] | undefined)[] = [
    variantStyle,
    { color: color ?? defaultTextColor },
    align && { textAlign: align },
  ];

  // Handle fontWeight prop
  if (fontWeight) {
    textStyle.push({ fontWeight });
  }

  if (italic) {
    // Only apply style if variant isn't already italic by font family name
    if (!variantStyle.fontFamily?.toLowerCase().includes("italic")) {
      textStyle.push(styles.italic);
    }
  }
  if (underline) {
    textStyle.push(styles.underline);
  }

  // Add the custom style prop last so it can override anything
  textStyle.push(style);
  return (
    <Text style={textStyle} {...otherProps}>
      {transformText(children)}
    </Text>
  );
};

const styles = StyleSheet.create({
  italic: {
    fontStyle: "italic",
  },
  underline: {
    textDecorationLine: "underline",
  },
});
