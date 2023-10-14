/** @param { URL | import("node-fetch").RequestInfo } url
 *  @param { import("node-fetch").RequestInit } [init]
 *  @return { Promise<Response> }
 */
export function fetchWithDiscordAuth(url, init = {})
{
    return fetch(url, {
        ...init,
        headers: {
            "Authorization": `Bot ${process.env.AUTH_TOKEN}`
        }
    })
}