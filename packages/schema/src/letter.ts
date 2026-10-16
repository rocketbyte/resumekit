/**
 * The content a letter document draws: who it is addressed to, its body and its
 * sign-off. A shape, not a schema — whoever produces the letter validates it,
 * and anything wider (a generator's notes, say) is still a `Letter`.
 */
export interface Letter {
  recipient?: string;
  greeting: string;
  paragraphs: string[];
  closing: string;
  signature: string;
}
