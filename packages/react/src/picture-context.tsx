import { createContext, useContext, type ReactNode } from 'react';

/**
 * A document drawn as a picture of itself: links are text, headings are not
 * part of the host page's outline, and nothing an editor reads is emitted.
 * For previews embedded in another page, never for the document itself.
 */
const PictureContext = createContext(false);

export function PictureProvider({ children }: { children: ReactNode }) {
  return (
    <PictureContext.Provider value={true}>{children}</PictureContext.Provider>
  );
}

export function usePicture(): boolean {
  return useContext(PictureContext);
}
