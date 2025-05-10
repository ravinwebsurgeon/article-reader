import React, { useMemo } from "react";
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from "react-native";
import { useTheme, type Theme } from "@/theme";

interface TagProps extends TouchableOpacityProps {
  label: string;
  active?: boolean;
  onClose?: () => void;
}

export const Tag: React.FC<TagProps> = ({ label, active = false, onClose, style, ...rest }) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <TouchableOpacity
      style={[styles.container, active && styles.containerActive, style]}
      activeOpacity={0.7}
      {...rest}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>

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

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: 16,
      backgroundColor: theme.colors.gray[200],
      marginRight: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    containerActive: {
      backgroundColor: theme.colors.primary.main,
    },
    label: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
    },
    labelActive: {
      color: theme.colors.primary.contrast,
    },
    closeButton: {
      marginLeft: theme.spacing.xs,
    },
    closeIcon: {
      ...theme.typography.caption,
      fontWeight: "bold",
      color: theme.colors.icon,
    },
  });
