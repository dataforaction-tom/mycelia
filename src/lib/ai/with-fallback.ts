/**
 * Try `primary`; if it throws, try `fallback`. Throws a combined error
 * only if both fail, so the caller can see what went wrong on each side.
 */
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  try {
    return await primary();
  } catch (primaryError) {
    try {
      return await fallback();
    } catch (fallbackError) {
      const primaryMessage =
        primaryError instanceof Error ? primaryError.message : String(primaryError);
      const fallbackMessage =
        fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      throw new Error(
        `Both providers failed. Primary: ${primaryMessage}. Fallback: ${fallbackMessage}`
      );
    }
  }
}
