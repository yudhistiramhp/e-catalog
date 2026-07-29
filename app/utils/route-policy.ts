const PUBLIC_ROUTES = new Set(['/', '/login', '/catalog'])

export const isPublicRoute = (path: string) =>
  PUBLIC_ROUTES.has(path) || path.startsWith('/products/')
