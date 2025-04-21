// src/components/common/TabBar/TabBar.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing } from '../../../styles';

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