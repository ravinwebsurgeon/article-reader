import React from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { ThemeText } from '@/components/primitives';
import { useTheme } from '@/theme/hooks';
import { SvgIcon } from '@/components/SvgIcon';

export interface TextSelectionMenuProps {
  position: { top: number, left: number };
  visible: boolean;
  onHighlight: () => void;
  onRemoveHighlight?: () => void;
  onCopy: () => void;
  onNote?: () => void;
  onQuote?: () => void;
  onPlay?: () => void;
  onCoReader?: () => void;
  onSelectText?: () => void;
  isHighlighted: boolean; // To determine which menu to show
}

const TextSelectionMenu: React.FC<TextSelectionMenuProps> = ({
  position,
  visible,
  onHighlight,
  onRemoveHighlight,
  onCopy,
  onNote,
  onQuote,
  onPlay,
  onCoReader,
  onSelectText,
  isHighlighted
}) => {
  const theme = useTheme();
  
  // Return null if not visible
  if (!visible) return null;

  // Determine which menu to show based on whether text is already highlighted
  const renderMenu = () => {
    if (isHighlighted) {
      // Menu for highlighted text (right side in the image)
      return (
        <View style={[styles.menuContainer, { backgroundColor: theme.colors.background.paper }]}>
          {onNote && (
            <TouchableOpacity style={styles.menuItem} onPress={onNote}>
              <ThemeText variant="body2">Note</ThemeText>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.menuItem} onPress={onCopy}>
            <ThemeText variant="body2">Copy</ThemeText>
          </TouchableOpacity>
          {onCoReader && (
            <TouchableOpacity style={styles.menuItem} onPress={onCoReader}>
              <ThemeText variant="body2">Co-Reader</ThemeText>
            </TouchableOpacity>
          )}
          {onRemoveHighlight && (
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={onRemoveHighlight}
            >
              <ThemeText variant="body2" color={theme.colors.error.main}>Remove</ThemeText>
            </TouchableOpacity>
          )}
        </View>
      );
    } else {
      // Menu for normal text selection (left side in the image)
      return (
        <View style={[styles.menuContainer, { backgroundColor: theme.colors.background.paper }]}>
          {onPlay && (
            <TouchableOpacity style={styles.menuItem} onPress={onPlay}>
              <ThemeText variant="body2">Play</ThemeText>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.menuItem} onPress={onHighlight}>
            <ThemeText variant="body2">Highlight</ThemeText>
          </TouchableOpacity>
          {onQuote && (
            <TouchableOpacity style={styles.menuItem} onPress={onQuote}>
              <ThemeText variant="body2">Quote</ThemeText>
            </TouchableOpacity>
          )}
          {onSelectText && (
            <TouchableOpacity style={styles.menuItem} onPress={onSelectText}>
              <ThemeText variant="body2">Select Text</ThemeText>
            </TouchableOpacity>
          )}
        </View>
      );
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          top: position.top,
          left: position.left,
        }
      ]}
    >
      {renderMenu()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default TextSelectionMenu;