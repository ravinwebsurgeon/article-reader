export const spacing = {
  // Base spacing unit (4px)
  unit: 4,

  // Predefined spacing values
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  // Function to get custom spacing (in units of 4px)
  get: (multiplier: number) => multiplier * 4,
};
