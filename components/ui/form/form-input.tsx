import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';

// Custom Input Component for reusability
export const FormInput = ({ 
  control, 
  name, 
  rules = {}, 
  placeholder, 
  secureTextEntry = false, 
  icon,
  keyboardType = 'default'
}) => {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View style={styles.inputContainer}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            secureTextEntry={secureTextEntry}
            style={[styles.input, error && styles.inputError]}
            keyboardType={keyboardType}
            placeholderTextColor="#9E9E9E"
          />
          {error && (
            <Text style={styles.errorText}>{error.message}</Text>
          )}
        </View>
      )}
    />
  );
};

// Colors from the palette
const COLORS = {
  primary: '#1e40af', // Deep blue from image
  primaryLight: '#3b82f6', // Light blue from image
  accent: '#ef3e55', // Amaranth from image
  accentLight: '#f34f4f', // Lighter red (Carnation) from image
  background: '#f8f9fa',
  text: '#333333',
  placeholder: '#9E9E9E',
  error: '#ef3e55',
  buttonText: '#FFFFFF',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  logoHeart: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.placeholder,
    marginBottom: 16,
  },
  formContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  iconContainer: {
    position: 'absolute',
    left: 12,
    top: 15,
    zIndex: 1,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 45,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  signInButtonText: {
    color: COLORS.buttonText,
    fontSize: 18,
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signUpText: {
    color: COLORS.text,
    fontSize: 16,
  },
  signUpLinkText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
