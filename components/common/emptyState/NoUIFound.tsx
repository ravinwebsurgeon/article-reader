// src/components/NoItemsFound.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/assets';
import { Ionicons } from '@expo/vector-icons';
import { ItemFilter } from '@/types/item';

interface NoItemsFoundProps {
  filter: ItemFilter;
}

const NoItemsFound: React.FC<NoItemsFoundProps> = ({ filter }) => {
  const getMessage = () => {
    switch (filter) {
      case 'favorites':
        return "You haven't favorited any articles yet";
      case 'tagged':
        return "You don't have any tagged articles";
      case 'archived':
        return "You haven't archived any articles yet";
      case 'short':
        return "No short articles found";
      case 'long':
        return "No long articles found";
      default:
        return "You don't have any saved articles yet";
    }
  };

  const getIcon = () => {
    switch (filter) {
      case 'favorites':
        return "star-outline";
      case 'tagged':
        return "pricetag-outline";
      case 'archived':
        return "archive-outline";
      case 'short':
      case 'long':
        return "book-outline";
      default:
        return "bookmark-outline";
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons 
        name={getIcon() as any} 
        size={64} 
        color={COLORS.lightGray} 
      />
      <Text style={styles.message}>{getMessage()}</Text>
      <Text style={styles.subMessage}>
        Add content using the + button or share to Pocket from other apps
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
});

export default NoItemsFound;