import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    name: 'light' | 'sage';
    colors: {
      background: string;
      modalBackground: string;
      primaryText: string;
      secondaryText: string;
      border: string;
      button: string;
      buttonText: string;
    };
  }
}