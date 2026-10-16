import type { HTMLAttributes, ReactNode } from 'react';
import { usePicture } from '../picture-context.js';
import './heading.css';

type HeadingProps = HTMLAttributes<HTMLElement> & {
  level: 1 | 2 | 3;
  children: ReactNode;
  'data-block'?: boolean;
  'data-keep-with-next'?: boolean;
};

/** A heading — or, in a picture, a `div` drawn like one (`heading.css`). */
export function Heading({ level, ...props }: HeadingProps) {
  if (usePicture()) return <div data-h={level} {...props} />;
  const Tag = `h${level}` as const;
  return <Tag {...props} />;
}
