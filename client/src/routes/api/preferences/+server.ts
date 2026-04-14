import type { RequestHandler } from './$types'
import { json } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { viewMode } = await request.json()
  if (viewMode === 'grid' || viewMode === 'table') {
    cookies.set('viewMode', viewMode, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  }
  return json({ ok: true })
}
