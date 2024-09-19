
import dockerHub from './docker';

export default {
	async fetch(request, env, ctx): Promise<Response> {

		// parse into 2-dim array like [[source,target]..]
		let routes = (env.ROUTES ? env.ROUTES.split(",") : []).map(i => i.split("="));
		function routeByHosts(host: string) {
			for (let [source, target] of routes) {
				if (source == host) {
					return target;
				}
			}
			return dockerHub.target;
		}

		const url = new URL(request.url);
		const upstream = routeByHosts(url.hostname);

		const isDockerHub = upstream == dockerHub.target;
		const authorization = request.headers.get("Authorization");
		// get token
		if (url.pathname == "/token") {
			const newUrl = new URL(upstream + "/v2/");
			const resp = await fetch(newUrl.toString(), {
				method: "GET",
				redirect: "follow",
			});
			if (resp.status !== 401) {
				return resp;
			}
			const authenticateStr = resp.headers.get("WWW-Authenticate");
			if (authenticateStr === null) {
				return resp;
			}
			const wwwAuthenticate = dockerHub.parseAuthenticate(authenticateStr);
			let scope = url.searchParams.get("scope");
			// autocomplete repo part into scope for DockerHub library images
			// Example: repository:busybox:pull => repository:library/busybox:pull
			if (scope && isDockerHub) {
				let scopeParts = scope.split(":");
				if (scopeParts.length == 3 && !scopeParts[1].includes("/")) {
					scopeParts[1] = "library/" + scopeParts[1];
					scope = scopeParts.join(":");
				}
			}
			return dockerHub.fetchToken(wwwAuthenticate, scope, authorization);
		}
		// redirect for DockerHub library images
		// Example: /v2/busybox/manifests/latest => /v2/library/busybox/manifests/latest
		if (isDockerHub) {
			const pathParts = url.pathname.split("/");
			if (pathParts.length == 5) {
				pathParts.splice(2, 0, "library");
				const redirectUrl = new URL(url);
				redirectUrl.pathname = pathParts.join("/");
				return Response.redirect(redirectUrl.toString(), 301);
			}
		}
		// foward requests
		const newUrl = new URL(upstream + url.pathname);
		const newReq = new Request(newUrl, {
			method: request.method,
			headers: request.headers,
			redirect: "follow",
		});
		const resp = await fetch(newReq);
		// check if need to authenticate
		if (resp.status === 401) {
			const headers = new Headers(resp.headers);
			headers.set(
				"Www-Authenticate",
				`Bearer realm="https://${url.hostname}/token",service="cloudflare-docker-proxy"`
			);
			return new Response(resp.body, {
				status: 401,
				headers: headers,
			});
		} else {
			return resp;
		}


	},
} satisfies ExportedHandler<Env>;
