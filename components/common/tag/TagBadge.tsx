import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ThemeText } from '@/components/core';
import { SvgIcon } from '@/components/SvgIcon';
import { useColors } from '@/theme/hooks';
import { scaler } from '@/utils';

export interface TagBadgeProps {
  label: string;
  onPress?: () => void;
  onRemove?: () => void;
  color?: string;
  backgroundColor?: string;
  size?: 'small' | 'medium' | 'large';
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
  size = 'medium',
  style,
  textStyle,
  removable = true,
}) => {
  const colors = useColors();
  
  // Default colors if not provided
  const badgeColor = color || colors.primary.main;
  const badgeBgColor = backgroundColor || colors.primary.light;
  
  // Get dynamic styles based on size
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: {
            paddingHorizontal: scaler(8),
            paddingVertical: scaler(4),
            borderRadius: scaler(12),
          },
          text: {
            fontSize: scaler(12),
          },
          icon: 14,
        };
      case 'large':
        return {
          container: {
            paddingHorizontal: scaler(16),
            paddingVertical: scaler(8),
            borderRadius: scaler(20),
          },
          text: {
            fontSize: scaler(16),
          },
          icon: 18,
        };
      default: // medium
        return {
          container: {
            paddingHorizontal: scaler(12),
            paddingVertical: scaler(6),
            borderRadius: scaler(16),
          },
          text: {
            fontSize: scaler(14),
          },
          icon: 16,
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        sizeStyles.container,
        { backgroundColor: badgeBgColor },
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <ThemeText
        style={[
          styles.text,
          sizeStyles.text,
          { color: badgeColor },
          textStyle,
        ]}
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
          <SvgIcon
            name="close"
            size={sizeStyles.icon}
            color={badgeColor}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: scaler(8),
    marginBottom: scaler(8),
  },
  text: {
    fontWeight: '500',
  },
  removeButton: {
    marginLeft: scaler(4),
  },
});

export default TagBadge;