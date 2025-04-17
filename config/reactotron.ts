// src/config/reactotron.js
import Reactotron from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';
import { createReactotronEnhancer } from 'reactotron-redux';

let reactotron;

// Get IP address for connecting in dev
let host = 'localhost';
if (__DEV__) {
  const { scriptURL } = NativeModules.SourceCode;
  const scriptHostname = scriptURL.split('://')[1].split(':')[0];
  host = scriptHostname;
}

if (__DEV__) {
  reactotron = Reactotron
    .setAsyncStorageHandler(AsyncStorage)
    .configure({
      name: 'Pocket App',
      host,
    })
    .useReactNative({
      asyncStorage: false, // We already set up the async storage handler above
      networking: {
        ignoreUrls: /symbolicate/,
      },
      editor: false,
      errors: { veto: (stackFrame) => false },
      overlay: false,
    })
    .use(reactotronRedux())
    .connect();

  // Clear the Reactotron console on start
  reactotron.clear();

  // Make Reactotron available globally for debugging
  console.tron = reactotron;
}

export default reactotron;