import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  systemPrefersDark: boolean;
}

const initialState: ThemeState = {
  mode: 'system',
  systemPrefersDark: false,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
    },
    setSystemPrefersDark(state, action: PayloadAction<boolean>) {
      state.systemPrefersDark = action.payload;
    },
  },
});

export const { setThemeMode, setSystemPrefersDark } = themeSlice.actions;

export default themeSlice.reducer;
