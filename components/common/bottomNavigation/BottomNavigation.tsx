// src/components/common/BottomNavigation/BottomNavigation.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { colors, typography, spacing, shadows } from '../../../styles';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

interface BottomNavigationProps {
  items: NavItem[];
  activeItemId: string;
  onItemPress: (itemId: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  activeItemId,
  onItemPress,
}) => {
  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.content}>
        {items.map((item) => {
          const isActive = item.id === activeItemId;
          
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.navItem}
              onPress={() => onItemPress(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                {isActive && item.activeIcon ? item.activeIcon : item.icon}
              </View>
              
              <Text
                style={[
                  styles.label,
                  isActive && styles.activeLabel,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    ...shadows.top,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  iconContainer: {
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  activeLabel: {
    color: colors.primary,
    fontWeight: '500',
  },
});