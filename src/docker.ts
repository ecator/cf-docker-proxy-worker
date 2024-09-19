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
    // https://auth.docker.io/token?scope=repository%3Alibrary%2Fubuntu%3Apull&service=registry.docker.io
    return await fetch(url, { method: "GET", headers: headers });
}

const target = "https://registry-1.docker.io";

export default {
    parseAuthenticate,
    fetchToken,
    target
}