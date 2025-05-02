import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  LayoutChangeEvent,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { COLORS, darkColors, lightColors, useTheme } from '@/theme';
import { ThemeText, ThemeView } from '@/components/core';
import { scaler } from '@/utils';
import { useAppSelector } from '@/redux/hook';
import { selectActiveTheme } from '@/redux/utils';
import { SvgIcon, SvgIconName } from '@/components/SvgIcon';
import Svg, { Path } from 'react-native-svg';

export interface ActionMenuItem {
  id: string;
  label: string;
  // Optional icon from SvgIcon component or custom component
  icon?: SvgIconName | React.ReactNode;
  // Optional custom icon color
  iconColor?: string;
  // Optional text color (for things like "Delete" in red)
  textColor?: string;
  // Optional handler for this item
  onPress: () => void;
  // Optional for destructive actions
  destructive?: boolean;
  // Optional divider after this item
  dividerAfter?: boolean;
  // Optional checkbox/radio selection
  selected?: boolean;
  // Optional to disable item
  disabled?: boolean;
}

export interface ActionMenuPosition {
  // Targeted anchor position (from TouchableOpacity that triggers the menu)
  x?: number;
  y?: number;
  // Width of the anchor element
  width?: number;
  // Height of the anchor element
  height?: number;
  // If provided, overrides automatic positioning logic
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  // Optional alignment for the menu
  align?: 'start' | 'center' | 'end';
}

export interface ActionMenuProps {
  // Visible state
  visible: boolean;
  // Menu items array
  items: ActionMenuItem[];
  // Close handler
  onClose: () => void;
  // Position config
  position?: ActionMenuPosition;
  // Optional title for the menu
  title?: string;
  // Optional custom width
  width?: number | string;
  // Optional custom max height
  maxHeight?: number;
  // Optional animation type
  animationType?: 'none' | 'fade' | 'slide';
  // Optional header component
  headerComponent?: React.ReactNode;
  // Optional footer component
  footerComponent?: React.ReactNode;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const DEFAULT_MENU_WIDTH = scaler(240);
const DEFAULT_MAX_HEIGHT = scaler(400);
const MENU_PADDING = scaler(8);
const SAFE_AREA_PADDING = scaler(16);

const ReusableActionMenu: React.FC<ActionMenuProps> = ({
  visible,
  items,
  onClose,
  position = {},
  title,
  width = DEFAULT_MENU_WIDTH,
  maxHeight = DEFAULT_MAX_HEIGHT,
  animationType = 'fade',
  headerComponent,
  footerComponent,
}) => {
  const activeTheme = useAppSelector(selectActiveTheme);
  const isDarkMode = activeTheme === 'dark';
  const theme = useTheme();

  // Refs for measuring
  const menuRef = useRef<View>(null);

  // State for menu dimensions and positioning
  const [menuHeight, setMenuHeight] = useState(0);
  const [menuWidth, setMenuWidth] = useState(
    typeof width === 'number' ? width : DEFAULT_MENU_WIDTH,
  );
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  // Calculate menu position based on anchor position
  const calculateMenuPosition = () => {
    if (!position.x && !position.y) {
      // If no position is provided, center the menu on screen
      return setMenuPosition({
        top: (SCREEN_HEIGHT - menuHeight) / 2,
        left: (SCREEN_WIDTH - menuWidth) / 2,
      });
    }

    const anchorX = position.x || 0;
    const anchorY = position.y || 0;
    const anchorWidth = position.width || 0;
    const anchorHeight = position.height || 0;

    // Default to showing below the anchor if not specified
    const preferredPosition = position.position || 'bottom';
    const preferredAlign = position.align || 'center';

    let top = 0;
    let left = 0;

    // Vertical positioning
    if (preferredPosition === 'bottom') {
      top = anchorY + anchorHeight;

      // Check if menu would go off screen bottom
      if (top + menuHeight + SAFE_AREA_PADDING > SCREEN_HEIGHT) {
        // Place above instead
        top = anchorY - menuHeight;
      }
    } else if (preferredPosition === 'top') {
      top = anchorY - menuHeight;

      // Check if menu would go off screen top
      if (top < SAFE_AREA_PADDING) {
        // Place below instead
        top = anchorY + anchorHeight;
      }
    } else if (preferredPosition === 'center') {
      top = anchorY + anchorHeight / 2 - menuHeight / 2;
    }

    // Horizontal positioning
    if (preferredAlign === 'center') {
      left = anchorX + anchorWidth / 2 - menuWidth / 2;
    } else if (preferredAlign === 'start') {
      left = anchorX;
    } else if (preferredAlign === 'end') {
      left = anchorX + anchorWidth - menuWidth;
    }

    // Ensure menu stays within screen bounds horizontally
    if (left < SAFE_AREA_PADDING) {
      left = SAFE_AREA_PADDING;
    } else if (left + menuWidth + SAFE_AREA_PADDING > SCREEN_WIDTH) {
      left = SCREEN_WIDTH - menuWidth - SAFE_AREA_PADDING;
    }

    // Ensure menu stays within screen bounds vertically
    if (top < SAFE_AREA_PADDING) {
      top = SAFE_AREA_PADDING;
    } else if (top + menuHeight + SAFE_AREA_PADDING > SCREEN_HEIGHT) {
      // If too large for screen, make it scrollable
      setIsScrollable(true);
      const availableHeight = SCREEN_HEIGHT - SAFE_AREA_PADDING * 2;
      setMenuHeight(availableHeight);
      top = SAFE_AREA_PADDING;
    }

    setMenuPosition({ top, left });
    setIsPositioned(true);
  };

  // Measure menu height when loaded
  const onMenuLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;

    // Only update if height changed significantly
    if (Math.abs(height - menuHeight) > 1) {
      setMenuHeight(height);

      // Check if scrolling is needed
      if (height > maxHeight) {
        setIsScrollable(true);
        setMenuHeight(maxHeight);
      } else {
        setIsScrollable(false);
      }
    }

    // Update width if it's different
    if (typeof width === 'number' && Math.abs(width - menuWidth) > 1) {
      setMenuWidth(width);
    }

    if (!isPositioned) {
      calculateMenuPosition();
    }
  };

  // Update position when relevant props change
  useEffect(() => {
    if (visible && menuHeight > 0) {
      calculateMenuPosition();
    } else if (!visible) {
      setIsPositioned(false);
    }
  }, [visible, menuHeight, position.x, position.y, maxHeight]);

  // Reset scroll position when menu opens
  useEffect(() => {
    if (!visible) {
      setIsScrollable(false);
    }
  }, [visible]);

  // Render each menu item
  const renderMenuItem = (item: ActionMenuItem, index: number) => {
    const textColor = item.destructive
      ? COLORS.error.main
      : item.textColor || (isDarkMode ? lightColors.gray[200] : theme.colors.text.dark);

    const iconColor = item.destructive
      ? COLORS.error.main
      : item.iconColor || (isDarkMode ? lightColors.gray[200] : theme.colors.text.dark);

    return (
      <React.Fragment key={item.id || index}>
        <TouchableOpacity
          style={[styles.menuItem, item.disabled && styles.disabledItem]}
          onPress={() => {
            if (!item.disabled) {
              item.onPress();
              onClose();
            }
          }}
          activeOpacity={item.disabled ? 1 : 0.7}
          disabled={item.disabled}
        >
          {/* Selected indicator for checkable items */}
          {item.selected && (
            <View style={styles.selectedIndicator}>
              <Svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <Path
                  d="M6.29004 15.4692C5.84733 15.4692 5.47103 15.2783 5.16113 14.8965L0.861328 9.60059C0.739583 9.45671 0.651042 9.31559 0.595703 9.17725C0.545898 9.0389 0.520996 8.89502 0.520996 8.74561C0.520996 8.41357 0.631673 8.13965 0.853027 7.92383C1.07438 7.70801 1.35384 7.6001 1.69141 7.6001C2.07324 7.6001 2.39421 7.76335 2.6543 8.08984L6.25684 12.6553L13.2876 1.51562C13.4315 1.29427 13.5809 1.13932 13.7358 1.05078C13.8908 0.956706 14.0845 0.909668 14.3169 0.909668C14.6545 0.909668 14.9312 1.01481 15.147 1.2251C15.3628 1.43538 15.4707 1.70378 15.4707 2.03027C15.4707 2.16309 15.4486 2.2959 15.4043 2.42871C15.36 2.56152 15.2909 2.69987 15.1968 2.84375L7.42725 14.8633C7.16162 15.2673 6.78255 15.4692 6.29004 15.4692Z"
                  fill={isDarkMode ? "#ffffff" : "#1C1F21"}
                />
              </Svg>
            </View>
          )}

          {/* Text part */}
          <ThemeText
            style={[styles.menuText, item.disabled && styles.disabledText]}
            color={textColor}
            variant="body1"
          >
            {item.label}
          </ThemeText>

          {/* Icon part */}
          {item.icon && (
            <View style={styles.iconContainer}>
              {typeof item.icon === 'string' ? (
                <SvgIcon name={item.icon} size={24} color={iconColor} />
              ) : (
                item.icon
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Optional divider */}
        {item.dividerAfter && (
          <View
            style={[
              styles.divider,
              { backgroundColor: isDarkMode ? darkColors.divider : lightColors.divider },
            ]}
          />
        )}
      </React.Fragment>
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <ThemeView
              ref={menuRef}
              style={[
                styles.menuContainer,
                {
                  backgroundColor: isDarkMode
                    ? darkColors.background.paper
                    : lightColors.background.paper,
                  top: menuPosition.top,
                  left: menuPosition.left,
                  width: typeof width === 'string' ? width : scaler(width),
                  maxHeight: isScrollable ? maxHeight : undefined,
                },
                theme.shadows[3],
              ]}
              onLayout={onMenuLayout}
            >
              {/* Optional title */}
              {(title || headerComponent) && (
                <View style={styles.menuHeader}>
                  {headerComponent || (
                    <ThemeText
                      variant="subtitle2"
                      style={styles.menuTitle}
                      color={isDarkMode ? lightColors.gray[200] : darkColors.text.secondary}
                    >
                      {title}
                    </ThemeText>
                  )}
                </View>
              )}

              {/* Menu items */}
              {isScrollable ? (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {items.map(renderMenuItem)}
                </ScrollView>
              ) : (
                <View>{items.map(renderMenuItem)}</View>
              )}

              {/* Optional footer */}
              {footerComponent && <View style={styles.menuFooter}>{footerComponent}</View>}
            </ThemeView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    borderRadius: scaler(12),
    paddingHorizontal: MENU_PADDING,
    elevation: scaler(5),
    overflow: 'hidden',
  },
  menuHeader: {
    paddingHorizontal: scaler(8),
    paddingVertical: scaler(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.lightBorder,
  },
  menuTitle: {
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: scaler(4),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaler(8),
    paddingHorizontal: scaler(8),
    minHeight: scaler(48),
  },
  disabledItem: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
  iconContainer: {
    // marginRight: scaler(16),
    width: scaler(24),
    height: scaler(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: scaler(16),
    flex: 1,
  },
  selectedIndicator: {
    marginRight: scaler(1),
    width: scaler(14),
    height: scaler(14),
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    // marginVertical: scaler(4),
    // marginHorizontal: scaler(16),
  },
  menuFooter: {
    paddingHorizontal: scaler(8),
    paddingVertical: scaler(8),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.lightBorder,
  },
});

export default ReusableActionMenu;
