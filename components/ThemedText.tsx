import * as React from 'react';
import { Text } from 'react-native';

interface ThemedTextProps {
  children: React.ReactNode;
}

export const ThemedText: React.FC<ThemedTextProps> = ({ children }) => {
  return <Text>{children}</Text>;
};
