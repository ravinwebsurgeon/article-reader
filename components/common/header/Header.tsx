// src/components/common/Header/Header.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar 
} from 'react-native';
import { colors, typography, spacing, shadows } from '../../../styles';
import { BackIcon, SearchIcon, MoreIcon } from '../Icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showMenu?: boolean;
  onBackPress?: () => void;
  onSearchPress?: () => void;
  onMenuPress?: () => void;
  renderLeft?: () => React.ReactNode;
  renderRight?: () => React.ReactNode;
  backgroundColor?: string;
  titleColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  showSearch = false,
  showMenu = false,
  onBackPress,
  onSearchPress,
  onMenuPress,
  renderLeft,
  renderRight,
  backgroundColor = colors.white,
  titleColor = colors.text.primary,
}) => {
  const renderLeftContent = () => {
    if (renderLeft) {
      return renderLeft();
    }
    
    if (showBack) {
      return (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onBackPress}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <BackIcon size={24} color={colors.text.primary} />
        </TouchableOpacity>
      );
    }
    
    return null;
  };
  
  const renderRightContent = () => {
    if (renderRight) {
      return renderRight();
    }
    
    return (
      <View style={styles.rightContainer}>
        {showSearch && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onSearchPress}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <SearchIcon size={24} color={colors.text.primary} />
          </TouchableOpacity>
        )}
        
        {showMenu && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onMenuPress}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <MoreIcon size={24} color={colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={backgroundColor}
        translucent={false}
      />
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          {renderLeftContent()}
        </View>
        
        {title && (
          <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
            {title}
          </Text>
        )}
        
        {renderRightContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    width: '100%',
    zIndex: 10,
    ...shadows.small,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    height: 56,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
  },
  title: {
    flex: 1,
    ...typography.h6,
    textAlign: 'center',
  },
  iconButton: {
    padding: spacing.xs,
    marginHorizontal: spacing.xs,
  },
});