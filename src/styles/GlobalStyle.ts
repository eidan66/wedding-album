import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  body {
    height: 100vh;
    width: 100vw;
    margin: 0;
    padding: 0;
    font-family: 'SuezOne', Inter, sans-serif;
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.primaryText};
    transition: all 0.3s ease;
    direction: rtl;
    text-align: right;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
  font-family: 'SuezOne', Inter, sans-serif;
}
  
`;