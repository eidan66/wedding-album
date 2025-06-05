import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { Gallery } from './Pages/Gallery';
import { Upload } from './Pages/Upload';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/wedding-album/" element={<Layout />}>
          <Route index element={<Navigate to="/wedding-album/gallery" replace />} />
          <Route path="/wedding-album/gallery" element={<Gallery />} />
          <Route path="/wedding-album/upload" element={<Upload />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
