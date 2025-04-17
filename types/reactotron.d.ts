// src/types/reactotron.d.ts
import { ReactotronCore } from 'reactotron-core-client';
import { ReactotronReactNative } from 'reactotron-react-native';

declare global {
  interface Console {
    tron: ReactotronReactNative & ReactotronCore;
  }
}