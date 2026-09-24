export {};

declare global {
  interface UserPublicMetadata {
    /** In-app display name, set on first login and editable afterwards. */
    displayName?: string;
    /** IDs of onboarding hint bubbles this user has already dismissed. */
    seenHints?: string[];
  }
}
