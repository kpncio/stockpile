// Expects: URI encoded username and password headers (X-KPNC-AUTH-USER and X-KPNC-AUTH-PASS) and requested data:
// https://app.kpnc.io/trader/retriever/quote/AAPL

async function handleRequest(request) {
	let path = new URL(request.url).pathname.substring(1).replace('trader/retriever/', '').split('/');

	if (path == ['']) {
		return new Response('Missing request...\n', {
			headers: {
				'Access-Control-Allow-Headers': '*',
				'Access-Control-Allow-Origin': '*',
				'content-type': 'text/plain',
				'status' : 403
			},
		})
	}

	switch(path[0]) {
		case 'quote':
			return new Response(`{"data":[${await kv_quotes.get(path[1])}]}\n`, {
				headers: {
					'Access-Control-Allow-Headers': '*',
					'Access-Control-Allow-Origin': '*',
					'content-type': 'text/plain',
					'status' : 200
				},
			})

		case 'symbols':
			return new Response(await kv_symbols.get('current') + '\n', {
				headers: {
					'Access-Control-Allow-Headers': '*',
					'Access-Control-Allow-Origin': '*',
					'content-type': 'text/plain',
					'status' : 200
				},
			})

		case 'names':
			return new Response(await kv_names.get('current') + '\n', {
				headers: {
					'Access-Control-Allow-Headers': '*',
					'Access-Control-Allow-Origin': '*',
					'content-type': 'text/plain',
					'status' : 200
				},
			})

		default:
			return new Response('Malformed request...\n', {
				headers: {
					'Access-Control-Allow-Headers': '*',
					'Access-Control-Allow-Origin': '*',
					'content-type': 'text/plain',
					'status' : 403
				},
			})
	}
}

addEventListener('fetch', event => {
	event.respondWith(handleRequest(event.request))
})