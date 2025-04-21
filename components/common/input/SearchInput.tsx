// src/components/common/Input/SearchInput.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors, typography, spacing } from '../../../styles';
import { SearchIcon, CloseIcon } from '../Icons';

interface SearchInputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  onClear?: () => void;
  onSearch?: (text: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  containerStyle,
  onClear,
  onSearch,
  value,
  onChangeText,
  ...rest
}) => {
  const [text, setText] = useState(value || '');
  
  const handleChangeText = (newText: string) => {
    setText(newText);
    if (onChangeText) {
      onChangeText(newText);
    }
  };
  
  const handleClear = () => {
    setText('');
    if (onClear) {
      onClear();
    }
    if (onChangeText) {
      onChangeText('');
    }
  };
  
  const handleSubmit = () => {
    if (onSearch) {
      onSearch(text);
    }
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      <SearchIcon size={20} color={colors.gray[500]} style={styles.searchIcon} />
      
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.gray[500]}
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
          <CloseIcon size={16} color={colors.gray[500]} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[200],
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
    ...typography.body2,
    color: colors.text.primary,
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
});