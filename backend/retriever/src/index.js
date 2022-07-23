// Expects: URI encoded username and password headers (X-KPNC-AUTH-USER and X-KPNC-AUTH-PASS) and requested data:
// https://app.kpnc.io/trader/retriever/quotes/AAPL

async function handleRequest(request) {
	let path = new URL(request.url).pathname.substring(1).replace('trader/retriever/', '').split('/');

	if (path == ['']) {
		return new Response('Missing request...\n', {
			headers: { 'content-type': 'text/plain', 'status' : 403 },
		})
	}

	const user = request.headers.get('X-KPNC-AUTH-USER');
	const pass = request.headers.get('X-KPNC-AUTH-PASS');

	if (user == null || pass == null) {
		return new Response('Missing authentication...\n', {
			headers: { 'content-type': 'text/plain', 'status' : 403 },
		})
	}

	const data = await AUTH.fetch(request.clone());

	if (data.status !== 200) {
		return new Response('Incorrect credentials...\n', {
			headers: { 'content-type': 'text/plain', 'status' : 403 },
		})
	}

	switch(path[0]) {
		case 'quotes':
			return new Response(`{"data":[${await kv_quotes.get(path[1])}]}\n`, {
				headers: { 'content-type': 'application/json;charset=UTF-8', 'status' : 200 },
			})

		case 'symbols':
			return new Response(await kv_symbols.get('current') + '\n', {
				headers: { 'content-type': 'application/json;charset=UTF-8', 'status' : 200 },
			})

		case 'names':
			return new Response(await kv_names.get('current') + '\n', {
				headers: { 'content-type': 'application/json;charset=UTF-8', 'status' : 200 },
			})

		default:
			return new Response('Malformed request...\n', {
				headers: { 'content-type': 'text/plain', 'status' : 400 },
			})
	}
}

addEventListener('fetch', event => {
	event.respondWith(handleRequest(event.request))
})