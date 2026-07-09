import { z } from 'zod'

/**
 * Reach the inner `ZodString` of a drizzle-zod-derived column, past any
 * optional/nullable wrappers, so hand-written refinements (url, email, min…)
 * can be chained on top of the drizzle-derived length constraint. This keeps
 * the Drizzle table as the single source of truth for column lengths.
 */
export function derivedString(schema: z.ZodTypeAny): z.ZodString {
  let inner: z.ZodTypeAny = schema
  while (inner instanceof z.ZodOptional || inner instanceof z.ZodNullable) {
    inner = inner.unwrap() as z.ZodTypeAny
  }
  return inner as z.ZodString
}
