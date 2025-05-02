import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
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
  Animated,
  Easing,
} from 'react-native';
import { COLORS, darkColors, lightColors, useTheme } from '@/theme';
import { ThemeText, ThemeView } from '@/components/core';
import { scaler } from '@/utils';
import { useAppSelector } from '@/redux/hook';
import { selectActiveTheme } from '@/redux/utils';
import { SvgIcon, SvgIconName } from '@/components/SvgIcon';
import { max } from 'date-fns';

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
  animationDuration?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const DEFAULT_MENU_WIDTH = scaler(240);
const DEFAULT_MAX_HEIGHT = scaler(400);
const MENU_PADDING = scaler(8);
const SAFE_AREA_PADDING = scaler(16);
const DEFAULT_ANIMATION_DURATION = 200;

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
  animationDuration = DEFAULT_ANIMATION_DURATION,
}) => {
  const activeTheme = useAppSelector(selectActiveTheme);
  const isDarkMode = activeTheme === 'dark';
  const theme = useTheme();

  // Refs for measuring
  const menuRef = useRef<View>(null);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(visible);

  // State for menu dimensions and positioning
  const [menuHeight, setMenuHeight] = useState(0);
  const [menuWidth, setMenuWidth] = useState(
    typeof width === 'number' ? scaler(width) : DEFAULT_MENU_WIDTH,
  );
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      // Only show modal after we have a position
      if (menuPosition.top !== 0 || menuPosition.left !== 0) {
        setModalVisible(true);
        // Reset animation value before starting
        scaleAnim.setValue(0);

        // Start animation
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: animationDuration,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }).start();
      }
    } else {
      // When closing, we don't immediately hide the modal
      // We'll do that after the animation completes
      if (modalVisible) {
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: animationDuration * 0.75, // Slightly faster closing animation
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          setModalVisible(false);
          // Reset position when closed
          setMenuPosition({ top: 0, left: 0 });
        });
      }
    }
  }, [visible, menuPosition, scaleAnim, animationDuration]);

  console.log(position, 'position in ReusableActionMenu');
  console.log(menuPosition, 'menuPosition in ReusableActionMenu');

  // Calculate menu position based on anchor position
  const calculateMenuPosition = useCallback(() => {
    if (!position.x && !position.y) {
      // If no position is provided, center the menu on screen
      console.log('is code going here');
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
      console.log('preferredAlign', preferredAlign);
      left = anchorX + anchorWidth / 2 - menuWidth / 2;
    } else if (preferredAlign === 'start') {
      console.log('preferredAlign', preferredAlign);

      left = anchorX;
    } else if (preferredAlign === 'end') {
      console.log('preferredAlign', preferredAlign, anchorX, anchorWidth, menuWidth);

      left = anchorX + anchorWidth - menuWidth;
    }

    // Ensure menu stays within screen bounds horizontally
    if (left < SAFE_AREA_PADDING) {
      left = SAFE_AREA_PADDING;
      console.log(left, 'SAFE_AREA_PADDING', SAFE_AREA_PADDING);
    } else if (left + menuWidth + SAFE_AREA_PADDING > SCREEN_WIDTH) {
      left = SCREEN_WIDTH - menuWidth - SAFE_AREA_PADDING;
      console.log('or the code in this else if', left);
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
  }, [
    position.x,
    position.y,
    position.width,
    position.height,
    position.position,
    position.align,
    menuHeight,
    menuWidth,
  ]);

  // Measure menu height when loaded
  const onMenuLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height, width: measuredWidth } = event.nativeEvent.layout;

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
        console.log('width in onMenuLayout', width, menuWidth);
        setMenuWidth(width);
      }

      if (!isPositioned) {
        calculateMenuPosition();
      }
    },
    [menuHeight, menuWidth, maxHeight, isPositioned, calculateMenuPosition],
  );

  // Update position when relevant props change
  useEffect(() => {
    // Only calculate position if menu is visible and we have dimensions
    if (visible && menuHeight > 0 && !isPositioned) {
      calculateMenuPosition();
    } else if (!visible) {
      // Reset positioned flag when menu is hidden
      setIsPositioned(false);
    }
  }, [visible, menuHeight, calculateMenuPosition, isPositioned]);

  // Reset scroll position when menu opens
  useEffect(() => {
    if (!visible) {
      setIsScrollable(false);
    }
  }, [visible]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 150,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [scaleAnim, onClose]);

  // Render each menu item
  const renderMenuItem = useCallback(
    (item: ActionMenuItem, index: number) => {
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
                handleClose();
              }
            }}
            activeOpacity={item.disabled ? 1 : 0.7}
            disabled={item.disabled}
          >
            {/* Selected indicator for checkable items */}
            {item.selected && (
              <View style={styles.selectedIndicator}>
                <SvgIcon name="check" size={20} color={COLORS.primary.main} />
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
    },
    [isDarkMode, theme.colors.text.dark, handleClose],
  );

  const animatedStyle = useMemo(() => {
    // Determine transform origin based on alignment
    const transformOriginX = (() => {
      if (position.align === 'end') return 1; // Right aligned
      if (position.align === 'start') return 0; // Left aligned
      return 0.5; // Center aligned (default)
    })();

    // Determine transform origin based on position
    const transformOriginY = (() => {
      if (position.position === 'top') return 1; // Bottom of the menu (when positioned above)
      if (position.position === 'bottom') return 0; // Top of the menu (when positioned below)
      return 0.5; // Center of the menu (when centered)
    })();

    return {
      opacity: scaleAnim,
      transform: [
        // Apply scaling with the correct origin point
        {
          translateX: scaleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [menuWidth * transformOriginX * 0.2, 0], // 20% scale means 20% of the width offset
          }),
        },
        {
          translateY: scaleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [menuHeight * transformOriginY * 0.2 + scaler(10), 0], // Include the small upward movement
          }),
        },
        {
          scale: scaleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }),
        },
      ],
    };
  }, [scaleAnim, position.align, position.position, menuWidth, menuHeight]);

  const animatedStyle2 = {
    opacity: scaleAnim,
    transform: [
      {
        scale: scaleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
      // Add a slight vertical movement for a more polished feel
      {
        translateY: scaleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [scaler(10), 0],
        }),
      },
    ],
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType={'none'}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.modalOverlay, { opacity: scaleAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
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
                animatedStyle2,
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
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    // backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    position: 'absolute',
    borderRadius: scaler(12),
    paddingHorizontal: MENU_PADDING,
    elevation: scaler(5),
    overflow: 'hidden',
    // Add origin for scale animations
    backfaceVisibility: 'hidden',
    // Add shadow styles for iOS
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowOffset: { width: 0, height: scaler(3) },
        shadowOpacity: 0.6,
        shadowRadius: scaler(8),
      },
    }),
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
    marginLeft: scaler(8),
    marginRight: scaler(8),
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
