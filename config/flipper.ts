// src/config/flipper.js

// import { Platform } from "react-native";
// import AsyncStorage from '@react-native-async-storage/async-storage';

// // Set up Flipper plugins
// export const setupFlipper = () => {
//   if (__DEV__) {
    
//     try {
//       // AsyncStorage debugger
//       const { addPlugin } = require('react-native-flipper');
//       // const { createAsyncStoragePlugin } = require('flipper-plugin-async-storage-advanced');
//       // addPlugin(createAsyncStoragePlugin(AsyncStorage));
      
//       const { default: RNPerfMonitor } = require('react-native-performance');
//       // RNPerfMonitor.start();

//       // Only import in dev mode to avoid bundling in production
//       const { createNetworkFlipperPlugin } = require('react-native-flipper-network-plugin');
//       const networkFlipperPlugin = createNetworkFlipperPlugin();
//       addPlugin(networkFlipperPlugin);
      
//       // Store plugin globally for use with fetchBaseQuery
//       global.networkFlipperPlugin = networkFlipperPlugin;
//     } catch (error) {
//       console.warn('Could not setup Flipper Network plugin', error);
//     }
    
//   }
// };

// src/config/flipper.js
import React from "react";
import { Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set up Flipper plugins
export const setupFlipper = async () => {
  if (__DEV__) {
    try {
      // Dynamically import the modules only when in dev mode
      // This approach uses dynamic imports instead of require
      
      // For Flipper core
      const flipperModule = await import('react-native-flipper').catch(err => {
        console.warn('Could not import react-native-flipper', err);
        return { addPlugin: () => {} };
      });
      
      const addPlugin = flipperModule.addPlugin;
      
      // For AsyncStorage plugin (commented out but fixed)
      /* 
      const asyncStoragePlugin = await import('flipper-plugin-async-storage-advanced').catch(err => {
        console.warn('Could not import AsyncStorage plugin', err);
        return { createAsyncStoragePlugin: () => {} };
      });
      
      if (asyncStoragePlugin.createAsyncStoragePlugin) {
        addPlugin(asyncStoragePlugin.createAsyncStoragePlugin(AsyncStorage));
      }
      */
      
      // For Performance Monitor
      const perfModule = await import('react-native-performance').catch(err => {
        console.warn('Could not import react-native-performance', err);
        return { default: { start: () => {} } };
      });
      
      // Uncomment to use it
      // perfModule.default.start();
      
      // For Network plugin (commented out but fixed)
      /*
      const networkPlugin = await import('react-native-flipper-network-plugin').catch(err => {
        console.warn('Could not import network plugin', err);
        return { createNetworkFlipperPlugin: () => {} };
      });
      
      if (networkPlugin.createNetworkFlipperPlugin) {
        const networkFlipperPlugin = networkPlugin.createNetworkFlipperPlugin();
        addPlugin(networkFlipperPlugin);
        
        // Store plugin globally for use with fetchBaseQuery
        global.networkFlipperPlugin = networkFlipperPlugin;
      }
      */
      
    } catch (error) {
      console.warn('Could not setup Flipper plugins', error);
    }
  }
};