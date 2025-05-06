import type React from "react"
import { TouchableOpacity, View, StyleSheet, type ViewStyle, type TextStyle } from "react-native"
import { ThemeText } from "@/components/core"
import { SvgIcon } from "@/components/SvgIcon"
import { scaler } from "@/utils"

export interface CustomTagBadgeProps {
  label: string
  onRemove?: () => void
  style?: ViewStyle
  textStyle?: TextStyle
}

/**
 * CustomTagBadge component displays a tag in the exact style from the design
 * with a pink background and white text
 */
const CustomTagBadge: React.FC<CustomTagBadgeProps> = ({ label, onRemove, style, textStyle }) => {
  return (
    <View style={[styles.container, style]}>
      <ThemeText style={[styles.text, textStyle]} numberOfLines={1}>
        {label}
      </ThemeText>

      {onRemove && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <SvgIcon name="close" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF8A8A",
    paddingHorizontal: scaler(12),
    paddingVertical: scaler(6),
    borderRadius: scaler(16),
    marginRight: scaler(8),
    marginBottom: scaler(8),
  },
  text: {
    fontWeight: "500",
    fontSize: scaler(14),
    color: "#FFFFFF",
  },
  removeButton: {
    marginLeft: scaler(4),
  },
})

export default CustomTagBadge
