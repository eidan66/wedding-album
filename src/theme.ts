import type { DefaultTheme } from 'styled-components';

export const sageTheme: DefaultTheme = {
  name: 'sage',
  colors: {
    background: '#000',
    modalBackground:'#000',
    primaryText: '#fff', 
    secondaryText: '#A8C3A4',
    border: '#B2C8BA',
    button: '#A8C3A4',
    buttonText: '#fff',
  },
};

export type ThemeType = typeof sageTheme;