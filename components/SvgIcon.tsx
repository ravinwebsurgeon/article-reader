import { ICONS } from "../assets/Icons";
import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

export type SvgIconName = keyof typeof ICONS;

/**
 * Custom SVG icon component that uses the provided SVG paths for each icon.
 */
export function SvgIcon({
  name,
  size = 24,
  color,
  style,
}: {
  name: SvgIconName;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}) {
  const iconData = ICONS[name];

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width="100%" height="100%" viewBox={iconData?.viewBox} fill="none">
        <Path fillRule="evenodd" clipRule="evenodd" d={iconData?.path} fill={color} />
      </Svg>
    </View>
  );
}
