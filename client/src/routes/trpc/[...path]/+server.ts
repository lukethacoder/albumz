import type { RequestHandler } from './$types'
import { env } from '$env/dynamic/private'

const proxy: RequestHandler = async ({ request, params, url }) => {
  const target = `${env.API_URL}/trpc/${params.path}${url.search}`

  return fetch(target, {
    method: request.method,
    headers: request.headers,
    body:
      request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.arrayBuffer()
        : undefined,
  })
}

export const GET = proxy
export const POST = proxy
