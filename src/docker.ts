function parseAuthenticate(authenticateStr: string): WWWAuthenticate {
    // sample: Bearer realm="https://auth.ipv6.docker.com/token",service="registry.docker.io"
    // match strings after =" and before "
    const re = /(?<=\=")(?:\\.|[^"\\])*(?=")/g;
    const matches = authenticateStr.match(re);
    if (matches == null || matches.length < 2) {
        throw new Error(`invalid Www-Authenticate Header: ${authenticateStr}`);
    }
    return {
        realm: matches[0],
        service: matches[1],
    };
}
function responseUnauthorized(url: URL) {
    const headers = new Headers();
    headers.set(
        "Www-Authenticate",
        `Bearer realm="https://${url.hostname}/v2/auth",service="cloudflare-docker-proxy"`
    );
    return new Response(JSON.stringify({ message: "UNAUTHORIZED" }), {
        status: 401,
        headers: headers,
    });
}
async function fetchToken(wwwAuthenticate: WWWAuthenticate, scope: string | null, authorization: string | null): Promise<Response> {
    const url = new URL(wwwAuthenticate.realm);
    if (wwwAuthenticate.service.length) {
        url.searchParams.set("service", wwwAuthenticate.service);
    }
    if (scope) {
        url.searchParams.set("scope", scope);
    }
    let headers = new Headers();
    if (authorization) {
        headers.set("Authorization", authorization);
    }
    return await fetch(url, { method: "GET", headers: headers });
}

const target = "https://registry-1.docker.io";

export default {
    parseAuthenticate,
    responseUnauthorized,
    fetchToken,
    target
}