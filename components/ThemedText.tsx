import * as React from "react";
import { Text, type TextProps } from "react-native";
import { useTextColor } from "@/theme";

// Define available text variants, matching useTextColor
export type TextVariant = "primary" | "secondary" | "disabled" | "hint" | "subtle";

export type ThemedTextProps = TextProps & {
  variant?: TextVariant;
};

export const ThemedText: React.FC<ThemedTextProps> = ({
  children,
  style,
  variant = "primary",
  ...rest
}) => {
  const textColor = useTextColor(variant);

  return (
    <Text style={[{ color: textColor }, style]} {...rest}>
      {children}
    </Text>
  );
};
