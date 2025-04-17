// src/config/flipper.js
import { Platform } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// Set up Flipper plugins
export const setupFlipper = () => {
  if (__DEV__) {
    // AsyncStorage debugger
    // const { addPlugin } = require('react-native-flipper');
    // const { createAsyncStoragePlugin } = require('flipper-plugin-async-storage-advanced');
    
    // addPlugin(createAsyncStoragePlugin(AsyncStorage));

    // Performance plugin
  // const { default: RNPerfMonitor } = require('react-native-performance');
  // RNPerfMonitor.start();
    
    // Add more Flipper plugins here as needed
  }
};