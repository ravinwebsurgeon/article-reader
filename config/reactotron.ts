// src/config/reactotron.js - additional configuration for Expo
import { Platform } from 'react-native';
import Constants from 'expo-constants';

let host = 'localhost';
if (__DEV__) {
  const { manifest } = Constants;
  host = (manifest?.debuggerHost || '').split(':')[0];
}

// Use this host in the configure method
