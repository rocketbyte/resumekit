import type { SkillGroup } from '@cvgs/core';

/**
 * Which skills group, if any, names the candidate's spoken languages.
 *
 * This predicate exists because two templates print a **Languages** section
 * that `ResumeObject` has no field for. Adding one would change the writer's
 * structured-output contract — a prompt change, a cost change, and a new
 * fabrication surface — so the section is read from the `skills` group whose
 * category names it, and that group is then kept out of the technical rail so
 * it is not printed twice. Settled in `executive-template` (#32), re-stated in
 * `meridian-template` (#45).
 *
 * Shared rather than private to a template, because both templates' specs
 * require the same behaviour and two copies would be two answers to one
 * question — they would come apart the first time somebody handles
 * `Spoken Languages`.
 */
export function isLanguages(group: SkillGroup): boolean {
  return /^\s*languages?\b/i.test(group.category);
}
