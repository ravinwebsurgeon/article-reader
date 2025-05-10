import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { useTheme } from "@/theme";
import { SearchIcon, CloseIcon } from "../Icons";

interface SearchInputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  onClear?: () => void;
  onSearch?: (text: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search...",
  containerStyle,
  onClear,
  onSearch,
  value,
  onChangeText,
  ...rest
}) => {
  const [text, setText] = useState(value ?? "");
  const theme = useTheme();

  const handleChangeText = (newText: string) => {
    setText(newText);
    onChangeText?.(newText);
  };

  const handleClear = () => {
    setText("");
    onClear?.();
    onChangeText?.("");
  };

  const handleSubmit = () => {
    onSearch?.(text);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.inputBackground }, containerStyle]}
    >
      <SearchIcon size={20} color={theme.colors.icon} style={styles.searchIcon} />

      <TextInput
        style={[styles.input, theme.typography.body2, { color: theme.colors.text.primary }]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.hint}
        value={text}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
        clearButtonMode="never"
        {...rest}
      />

      {text.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <CloseIcon size={16} color={theme.colors.icon} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: "100%",
    padding: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
});
