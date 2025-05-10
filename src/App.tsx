import styled, { ThemeProvider } from 'styled-components';

import { GlobalStyle } from './styles/GlobalStyle';
import { sageTheme } from './theme';
import { Hero } from './components/Hero';
import { PhotoGrid } from './components/PhotoGrid';
import { Footer } from './components/Footer';

const PhotoGallery = styled.main``;

const App = () => {
  return (
    <ThemeProvider theme={sageTheme}>
      <GlobalStyle />
      <Hero />
      <PhotoGallery>
        <PhotoGrid />
      </PhotoGallery>
      <Footer />
    </ThemeProvider>
  );
};

export default App;