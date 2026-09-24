export const githubFetch = (
  path: string,
  init: RequestInit = {}
): Promise<Response> => {
  const headers = new Headers(init.headers);
  const token = import.meta.env.WXT_GH_TOKEN;

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers
  })
}
