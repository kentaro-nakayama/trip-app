export { cn } from "cn";

// Internal status codes several API routes return as `{ error: "..." }` —
// not meant for display, so extractErrorMessage falls back instead of
// showing these verbatim.
const INTERNAL_ERROR_CODES = new Set([
  "unauthorized",
  "forbidden",
  "not_found",
  "day_not_found",
]);

/**
 * Pulls a user-facing message out of an API error response: a plain
 * `{ error: "..." }` string (unless it's one of our internal status
 * codes above), or the first message from a zod `.flatten()` shape
 * (`fieldErrors`/`formErrors`). Falls back to a generic message when
 * the body doesn't match either shape.
 */
export async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.error === "string" && !INTERNAL_ERROR_CODES.has(body.error)) {
      return body.error;
    }

    const fieldErrors = body?.error?.fieldErrors;
    if (fieldErrors && typeof fieldErrors === "object") {
      for (const messages of Object.values(fieldErrors)) {
        if (Array.isArray(messages) && typeof messages[0] === "string") return messages[0];
      }
    }

    const formErrors = body?.error?.formErrors;
    if (Array.isArray(formErrors) && typeof formErrors[0] === "string") return formErrors[0];
  } catch {
    // response wasn't JSON, or didn't match either shape — use fallback
  }
  return fallback;
}
