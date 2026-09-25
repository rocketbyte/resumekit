import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  formatFor,
  type DocumentStyle,
  type FieldFormat,
  type ResumeFormats,
} from '@cvgs/core';

/**
 * How the document is presented, delivered by context rather than by props.
 *
 * This is not a style preference — it is the only thing that works. `<Frame>`
 * children are Craft.js's INITIAL node tree: props are read off that JSX once,
 * when the nodes are created, and thereafter live in Craft's own store. Passing
 * `style` and `formats` down through `<Element>` therefore froze them at mount,
 * and every formatting change stayed invisible until something forced a remount.
 *
 * Context sidesteps the node store entirely: a change re-renders the components
 * that read it, immediately, without touching Craft's state at all. Which is
 * also the correct model — formatting is presentation OVER the document, not
 * part of it. The document is the text, and only the text is Craft's to hold.
 */
export interface DocumentPresentation {
  style?: DocumentStyle;
  formats?: ResumeFormats;
  /** The document's language, which its printed words follow. Absent is English. */
  language?: string;
}

const PresentationContext = createContext<DocumentPresentation>({});

export function DocumentPresentationProvider({
  style,
  formats,
  language,
  children,
}: DocumentPresentation & { children: ReactNode }) {
  // Keyed on the values themselves, so a parent re-render that changed neither
  // does not cascade a new context object through the whole document.
  const value = useMemo(
    () => ({ style, formats, language }),
    [style, formats, language],
  );
  return (
    <PresentationContext.Provider value={value}>
      {children}
    </PresentationContext.Provider>
  );
}

/** The document's style, or undefined for the template's own typography. */
export function useDocumentStyle(): DocumentStyle | undefined {
  return useContext(PresentationContext).style;
}

/**
 * Every field's formatting, for the one reader that needs the whole list.
 *
 * `useFieldFormat` answers for a path and is what a node should ask; this is
 * for `useSpace`, which reaches the same record for a different question and
 * would otherwise need a second copy of the formats threaded to it.
 */
export function useDocumentLanguage(): string | undefined {
  return useContext(PresentationContext).language;
}

export function useDocumentFormats(): ResumeFormats | undefined {
  return useContext(PresentationContext).formats;
}

/**
 * The formatting for one field, as bounded values a node may accept.
 *
 * Returns the format WITHOUT its path: a node already knows which field it is,
 * and passing the path back in would invite a node to read a different field's
 * formatting than its own.
 */
export function useFieldFormat(path: string): Omit<FieldFormat, 'path'> {
  const { formats } = useContext(PresentationContext);
  return useMemo(() => {
    const found = formatFor(formats, path);
    if (!found) return {};
    const { path: _unused, ...rest } = found;
    return rest;
  }, [formats, path]);
}
