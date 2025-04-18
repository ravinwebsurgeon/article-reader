import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

// Helper to create icon components
const createIcon = (
  renderPaths: (props: { size: number; color: string }) => React.ReactNode,
  defaultSize = 24,
  defaultColor = "#000"
) => {
  return ({
    size = defaultSize,
    color = defaultColor,
    style,
  }: {
    size?: number;
    color?: string;
    style?: any;
  }) => (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {renderPaths({ size, color })}
      </Svg>
    </View>
  );
};

// Back Icon
export const BackIcon = createIcon(({ color }) => (
  <Path
    d="M19 12H5M12 19L5 12L12 5"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
));

// Search Icon
export const SearchIcon = createIcon(({ color }) => (
  <Path
    d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
));

// More/Detail Icon
export const MoreIcon = createIcon(({ color }) => (
  <>
    <Circle cx="12" cy="12" r="1" fill={color} />
    <Circle cx="19" cy="12" r="1" fill={color} />
    <Circle cx="5" cy="12" r="1" fill={color} />
  </>
));
