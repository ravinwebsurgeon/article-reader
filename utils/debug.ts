// src/utils/debug.ts
import { Platform } from 'react-native';

/**
 * Log to Reactotron if available (development)
 * Falls back to console.log
 */
export const log = (message: any, ...optionalParams: any[]) => {
  if (__DEV__) {
    if (console.tron) {
      console.tron.log(message, ...optionalParams);
    } else {
      console.log(message, ...optionalParams);
    }
  }
};

/**
 * Log warning to Reactotron if available (development)
 * Falls back to console.warn
 */
export const warn = (message: any, ...optionalParams: any[]) => {
  if (__DEV__) {
    if (console.tron) {
      console.tron.warn(message, ...optionalParams);
    } else {
      console.warn(message, ...optionalParams);
    }
  }
};

/**
 * Log error to Reactotron if available (development)
 * Falls back to console.error
 */
export const error = (message: any, ...optionalParams: any[]) => {
  if (__DEV__) {
    if (console.tron) {
      console.tron.error(message, ...optionalParams);
    } else {
      console.error(message, ...optionalParams);
    }
  }
};

/**
 * Special function to display important info in Reactotron
 */
export const display = (name: string, value: any, options: any = {}) => {
  if (__DEV__ && console.tron) {
    console.tron.display({
      name,
      value,
      ...options,
    });
  } else {
    console.log(`[${name}]`, value);
  }
};