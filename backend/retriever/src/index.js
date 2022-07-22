// Expects: URI encoded username and password headers (X-KPNC-AUTH-USER and X-KPNC-AUTH-PASS) and requested data:
// https://app.kpnc.io/trader/retriever/quotes/AAPL

async function handleRequest(request, epoch) {
	const user = decodeURIComponent(request.headers.get('X-KPNC-AUTH-USER'));
	const pass = decodeURIComponent(request.headers.get('X-KPNC-AUTH-PASS'));

	if (user == null || pass == null) {
		return new Response('Missing authentication...', {
			headers: { 'content-type': 'application/json;charset=UTF-8', 'status' : 403 },
		})
	}


}

addEventListener('fetch', event => {
	let epoch = Date.now();

	event.respondWith(handleRequest(event.request, epoch))
})