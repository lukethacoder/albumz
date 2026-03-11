export const DRIZZLE_CLIENT = Symbol('DRIZZLE_CLIENT')

// Separate the pool into its own provider so we can access it for cleanup
export const PG_POOL = Symbol('PG_POOL')
