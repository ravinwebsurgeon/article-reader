// src/components/common/BottomNavigation/BottomNavigation.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { typography, spacing, shadows } from '../../../styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS as colors} from '@/assets';


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

// src/data/mockNavigationData.tsx


// Mock icon component that accepts color prop
const MockIcon: React.FC<{ name: string; color?: string; size?: number }> = ({ 
  name, 
  color = '#000000', 
  size = 24 
}) => {
  // This is a simple mock icon implementation
  return (
    <View style={{ 
      width: size, 
      height: size, 
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: size / 2,
      borderWidth: 1,
      borderColor: color
    }}>
      <Text style={{ fontSize: size / 2, color }}>{name[0]}</Text>
    </View>
  );
};

// Mock navigation items
 const mockNavigationItems: any[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <MockIcon name="home" color="#9E9E9E" />,
    activeIcon: <MockIcon name="home" color="#6200EE" size={28} />,
  },
  {
    id: 'explore',
    label: 'Explore',
    icon: <MockIcon name="explore" color="#9E9E9E" />,
    activeIcon: <MockIcon name="explore" color="#6200EE" size={28} />,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <MockIcon name="bell" color="#9E9E9E" />,
    activeIcon: <MockIcon name="bell" color="#6200EE" size={28} />,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: <MockIcon name="user" color="#9E9E9E" />,
    activeIcon: <MockIcon name="user" color="#6200EE" size={28} />,
  },
];

// Usage example
export const bottomNavigationExample = {
  items: mockNavigationItems,
  activeItemId: 'home',
  onItemPress: (itemId: string) => console.log(`Pressed item: ${itemId}`)
};

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  activeItemId,
  onItemPress,
}) => {
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
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
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    // zIndex: 1000,
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