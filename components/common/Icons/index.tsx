import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

/**
 * Props for icon components
 */
interface IconProps {
  /** Size of the icon in pixels */
  size?: number;
  /** Color of the icon */
  color?: string;
  /** Additional styles to apply to the icon container */
  style?: ViewStyle;
}

/**
 * Helper function to create icon components
 * @param renderPaths - Function that renders the SVG paths
 * @param defaultSize - Default size of the icon
 * @param defaultColor - Default color of the icon
 */
const createIcon = (
  renderPaths: (props: { size: number; color: string }) => React.ReactNode,
  defaultSize = 24,
  defaultColor = '#000'
) => {
  return ({ size = defaultSize, color = defaultColor, style }: IconProps) => (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {renderPaths({ size, color })}
      </Svg>
    </View>
  );
};

/**
 * Back arrow icon component
 */
export const BackIcon = createIcon(({ color }) => (
  <Path
    d="M19 12H5M12 19L5 12L12 5"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
));

/**
 * Search icon component
 */
export const SearchIcon = createIcon(({ color }) => (
  <Path
    d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
));

/**
 * More options icon component (three dots)
 */
export const MoreIcon = createIcon(({ color }) => (
  <>
    <Circle cx="12" cy="12" r="1" fill={color} />
    <Circle cx="19" cy="12" r="1" fill={color} />
    <Circle cx="5" cy="12" r="1" fill={color} />
  </>
));

/**
 * Close/X icon component
 */
export const CloseIcon = createIcon(({ color }) => (
  <Path
    d="M18 6L6 18M6 6L18 18"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
));
