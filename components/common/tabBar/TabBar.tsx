// src/components/common/TabBar/TabBar.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {  typography, spacing } from '../../../styles';
import { COLORS as colors} from '@/assets';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTabId: string;
  onTabPress: (tabId: string) => void;
  scrollable?: boolean;
  tabStyle?: 'default' | 'pill';
}

// Mock icon component for tabs
const TabIcon: React.FC<{ name: string; color?: string; size?: number }> = ({ 
  name, 
  color = '#9E9E9E', 
  size = 16 
}) => {
  return (
    <View style={{ 
      width: size, 
      height: size, 
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: color
    }}>
      <Text style={{ fontSize: size / 2, color }}>{name[0]}</Text>
    </View>
  );
};

// Default style tabs (with and without icons)
export const defaultTabItems: TabItem[] = [
  {
    id: 'all',
    label: 'All',
    icon: <TabIcon name="All" />
  },
  {
    id: 'favorites',
    label: 'Favorites',
    icon: <TabIcon name="Favorites" />
  },
  {
    id: 'recent',
    label: 'Recent',
    icon: <TabIcon name="Recent" />
  },
  {
    id: 'downloads',
    label: 'Downloads',
    icon: <TabIcon name="Downloads" />
  }
];

// Text-only tabs for default style
export const textOnlyTabItems: TabItem[] = [
  {
    id: 'today',
    label: 'Today'
  },
  {
    id: 'thisWeek',
    label: 'This Week'
  },
  {
    id: 'thisMonth',
    label: 'This Month'
  },
  {
    id: 'thisYear',
    label: 'This Year'
  }
];

// Pills style tab items
export const pillTabItems: TabItem[] = [
  {
    id: 'trending',
    label: 'Trending'
  },
  {
    id: 'popular',
    label: 'Popular'
  },
  {
    id: 'newReleases',
    label: 'New Releases'
  },
  {
    id: 'forYou',
    label: 'For You'
  },
  {
    id: 'recommended',
    label: 'Recommended'
  }
];

// Category pills (for longer scrollable tabs)
export const categoryPillItems: TabItem[] = [
  { id: 'all', label: 'All' },
  { id: 'music', label: 'Music' },
  { id: 'podcasts', label: 'Podcasts' },
  { id: 'audiobooks', label: 'Audiobooks' },
  { id: 'news', label: 'News' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'education', label: 'Education' },
  { id: 'technology', label: 'Technology' },
  { id: 'business', label: 'Business' },
  { id: 'health', label: 'Health' }
];

// Usage examples
export const tabBarExamples = {
  default: {
    tabs: defaultTabItems,
    activeTabId: 'all',
    onTabPress: (tabId: string) => console.log(`Pressed tab: ${tabId}`),
    scrollable: false,
    tabStyle: 'default' as const
  },
  textOnly: {
    tabs: textOnlyTabItems,
    activeTabId: 'today',
    onTabPress: (tabId: string) => console.log(`Pressed tab: ${tabId}`),
    scrollable: false,
    tabStyle: 'default' as const
  },
  pills: {
    tabs: pillTabItems,
    activeTabId: 'trending',
    onTabPress: (tabId: string) => console.log(`Pressed tab: ${tabId}`),
    scrollable: true,
    tabStyle: 'pill' as const
  },
  categories: {
    tabs: categoryPillItems,
    activeTabId: 'all',
    onTabPress: (tabId: string) => console.log(`Pressed tab: ${tabId}`),
    scrollable: true,
    tabStyle: 'pill' as const
  }
};

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabPress,
  scrollable = false,
  tabStyle = 'default',
}) => {
  const TabsContainer = scrollable ? ScrollView : View;
  const scrollableProps = scrollable
    ? {
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        contentContainerStyle: styles.scrollableContent,
      }
    : {};

  const renderTab = (tab: TabItem) => {
    const isActive = tab.id === activeTabId;
    
    return (
      <TouchableOpacity
        key={tab.id}
        style={[
          styles.tab,
          tabStyle === 'pill' && styles.pillTab,
          isActive && styles.activeTab,
          isActive && tabStyle === 'pill' && styles.activePillTab,
        ]}
        onPress={() => onTabPress(tab.id)}
        activeOpacity={0.7}
      >
        {tab.icon && (
          <View style={styles.iconContainer}>
            {tab.icon}
          </View>
        )}
        
        <Text
          style={[
            styles.tabLabel,
            isActive && styles.activeTabLabel,
          ]}
        >
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TabsContainer {...scrollableProps} style={styles.tabsContainer}>
        {tabs.map(renderTab)}
      </TabsContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  tabsContainer: {
    flexDirection: 'row',
  },
  scrollableContent: {
    paddingHorizontal: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    position: 'relative',
  },
  pillTab: {
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colors.gray[200],
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  activePillTab: {
    borderBottomWidth: 0,
    backgroundColor: colors.primary,
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  tabLabel: {
    ...typography.button,
    color: colors.text.secondary,
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
});