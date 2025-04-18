// src/components/common/Tag/Tag.tsx
import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet,
  TouchableOpacityProps
} from 'react-native';
import { colors, typography, spacing } from '../../../styles';

interface TagProps extends TouchableOpacityProps {
  label: string;
  active?: boolean;
  onClose?: () => void;
}

export const Tag: React.FC<TagProps> = ({
  label,
  active = false,
  onClose,
  style,
  ...rest
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        active && styles.containerActive,
        style
      ]}
      activeOpacity={0.7}
      {...rest}
    >
      <Text style={[
        styles.label,
        active && styles.labelActive
      ]}>
        {label}
      </Text>
      
      {onClose && (
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Text style={styles.closeIcon}>×</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.gray[200],
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  containerActive: {
    backgroundColor: colors.primary,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  labelActive: {
    color: colors.white,
  },
  closeButton: {
    marginLeft: spacing.xs,
  },
  closeIcon: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.text.secondary,
  },
});