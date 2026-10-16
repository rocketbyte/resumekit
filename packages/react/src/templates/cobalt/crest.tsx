import type { ResumeObject } from '@cvgs/core';
import { monogram } from '../../kit/monogram.js';

/* Drawn, not CSS: a clip-path would clip the stroke. */
const CREST_POLYGON =
  '27.18,0.92 79.82,0.92 106.13,46.5 79.82,92.08 27.18,92.08 0.87,46.5';

/** Cobalt's crest: the candidate's initials inside a hexagon. */
export function CobaltCrest({ resume }: { resume: ResumeObject }) {
  return (
    <div className="tpl-cob__crest">
      <svg
        className="tpl-cob__crest-shape"
        viewBox="0 0 107 93"
        aria-hidden="true"
        focusable="false"
      >
        <polygon
          points={CREST_POLYGON}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      {/* HTML text, not SVG `<text>`, so the initials extract with the page. */}
      <p className="tpl-cob__initials" aria-hidden="true">
        {monogram(resume.name)}
      </p>
    </div>
  );
}
