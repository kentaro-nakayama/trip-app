export {};

declare global {
  interface UserPublicMetadata {
    /** In-app display name, set on first login and editable afterwards. */
    displayName?: string;
  }
}
