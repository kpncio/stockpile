// Expects: URI encoded username and password headers (X-KPNC-AUTH-USER and X-KPNC-AUTH-PASS):
// https://app.kpnc.io/trader/authenticator/
// curl -i -H "X-KPNC-AUTH-USER: " -H "X-KPNC-AUTH-PASS: " https://app.kpnc.io/trader/authenticator/

async function handleRequest(request, epoch) {
	let create = new URL(request.url).pathname.substring(1).replace('trader/authenticator/', '') === 'create' ? true : false;

	const user = decodeURIComponent(request.headers.get('X-KPNC-AUTH-USER')).toLowerCase();
	const pass = decodeURIComponent(request.headers.get('X-KPNC-AUTH-PASS'));

	if (user == null || pass == null) {
		return new Response(`{"status":400,"message":"Missing input...","verified":false}\n`, {
			headers: {
				'Access-Control-Allow-Headers': '*',
				'Access-Control-Allow-Origin': '*',
				'content-type': 'text/plain',
				'status' : 400
			},
		})
	}

	if (create == true) {
		if (await kv_users.get(user) == null) {
			const url = await fetch(
				`https://csprng.xyz/v1/api`, {
					headers: {
						'content-type': 'application/json;charset=UTF-8',
					},
				});
			const csprng = await url.json();
	
			let value = { 
				'hash': await hasher(csprng.Data + pass),
				'salt': csprng.Data,
				'name': decodeURIComponent(request.headers.get('X-KPNC-AUTH-USER')),
				'epoch': epoch
			};
	
			await kv_users.put(user, JSON.stringify(value));
	
			return new Response(`{"status":200,"message":"Created credentials...","verified":true}\n`, {
				headers: {
					'Access-Control-Allow-Headers': '*',
					'Access-Control-Allow-Origin': '*',
					'content-type': 'text/plain',
					'status' : 200
				},
			})
		} else {
			return new Response(`{"status":403,"message":"User already exists...","verified":false}\n`, {
				headers: {
					'Access-Control-Allow-Headers': '*',
					'Access-Control-Allow-Origin': '*',
					'content-type': 'text/plain',
					'status' : 403
				},
			})
		}
	}

	if (await kv_users.get(user) != null) {
		const data = JSON.parse(await kv_users.get(user));

		const hash = await hasher(data.salt + pass);

		if (hash === data.hash) {
			return new Response(`{"status":200,"message":"Authenticated...","name":"${data.name}","verified":true}\n`, {
				headers: {
					'Access-Control-Allow-Headers': '*',
					'Access-Control-Allow-Origin': '*',
					'content-type': 'text/plain',
					'status' : 200
				},
			})
		} else {
			return new Response(`{"status":403,"message":"Incorrect credentials...","verified":false}\n`, {
				headers: {
					'Access-Control-Allow-Headers': '*',
					'Access-Control-Allow-Origin': '*',
					'content-type': 'text/plain',
					'status' : 403
				},
			})
		}
	} else {
		return new Response(`{"status":403,"message":"Incorrect credentials...","verified":false}\n`, {
			headers: {
				'Access-Control-Allow-Headers': '*',
				'Access-Control-Allow-Origin': '*',
				'content-type': 'text/plain',
				'status' : 403
			},
		})
	}
}

async function hasher(data) {
    const utf8 = new TextEncoder().encode(data);

    const digest = await crypto.subtle.digest('SHA-256', utf8);

    const array = Array.from(new Uint8Array(digest));         

    const hash = array.map(b => b.toString(16).padStart(2, '0')).join('');

    return hash;
}

addEventListener('fetch', event => {
	let epoch = Date.now();

	event.respondWith(handleRequest(event.request, epoch))
})