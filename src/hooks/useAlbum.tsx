import { useContext } from "react";
import { AlbumContext } from "../context/AlbumCreateContext";
import type { AlbumContextType } from "../types/context";


export const useAlbum = (): AlbumContextType => {
  const context = useContext(AlbumContext);
  if (!context) {
    throw new Error('useAlbum must be used within an AlbumProvider');
  }
  return context;
};