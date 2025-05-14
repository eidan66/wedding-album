import { createContext } from "react";
import type { AlbumContextType } from "../types/context";

export const AlbumContext = createContext<AlbumContextType | undefined>(undefined);
