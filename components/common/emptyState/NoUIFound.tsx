import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { ItemFilter } from '@/types/item';
import { SvgIcon } from '@/components/SvgIcon';
import { ThemeText } from '@/components/core';
import { scaler } from '@/utils';
 
interface NoItemsFoundProps {
  filter: ItemFilter;
}
 
const NoItemsFound: React.FC<NoItemsFoundProps> = ({ filter }) => {
  const theme = useTheme();
  const getMessage = () => {
    switch (filter) {
      case 'favorites':
        return "You haven't favorited any articles yet";
      case 'tagged':
        return "You don't have any tagged articles";
      case 'archived':
        return "You haven't archived any articles yet";
      case 'short':
        return 'No short articles found';
      case 'long':
        return 'No long articles found';
      default:
        return "You don't have any saved articles yet";
    }
  };
 
  const getIcon = () => {
    switch (filter) {
      case 'favorites':
        return 'favorite';
      case 'tagged':
        return 'tag';
      case 'archived':
        return 'archive';
      case 'short':
      case 'long':
        return 'time-long';
      default:
        return 'saves';
    }
  };
 
  return (
    <View style={styles.container}>
      <SvgIcon name={getIcon() as any} size={64} color={theme.colors.text.primary} />
      <ThemeText style={styles.message}>{getMessage()}</ThemeText>
      {/* <ThemeText style={styles.subMessage}>
        Add content using the + button or share to Pocket from other apps
      </ThemeText> */}
    </View>
  );
};
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaler(40),
  },
  message: {
    fontSize: scaler(14),
    fontWeight: '600',
    // color: COLORS.text,
    marginTop: scaler(16),
    textAlign: 'center',
    marginBottom: scaler(8),
  },
  subMessage: {
    fontSize: scaler(14),
    color: COLORS.darkGray,
    textAlign: 'center',
  },
});
 
export default NoItemsFound;