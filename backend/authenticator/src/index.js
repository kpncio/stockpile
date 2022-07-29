// Expects: URI encoded username and password headers (X-KPNC-AUTH-USER and X-KPNC-AUTH-PASS):
// https://app.kpnc.io/trader/authenticator/
// curl -i -H "X-KPNC-AUTH-USER: " -H "X-KPNC-AUTH-PASS: " https://app.kpnc.io/trader/authenticator/

async function handleRequest(request, epoch) {
	const user = decodeURIComponent(request.headers.get('X-KPNC-AUTH-USER') != null ? request.headers.get('X-KPNC-AUTH-USER') : '').toLowerCase();
	const pass = decodeURIComponent(request.headers.get('X-KPNC-AUTH-PASS') != null ? request.headers.get('X-KPNC-AUTH-PASS') : '');
	const info = decodeURIComponent(request.headers.get('X-KPNC-AUTH-INFO') != null ? request.headers.get('X-KPNC-AUTH-INFO') : '');
	const path = new URL(request.url).pathname.substring(1).replace('trader/authenticator/', '');

	if (user.length === 0 || pass.length === 0) {
		return new Response(`{"status"400,"message":"Missing authentication headers...","verified":false}\n`, {
			headers: {
				'Access-Control-Allow-Headers': '*',
				'Access-Control-Allow-Origin': '*',
				'content-type': 'text/plain',
				'status' : 400
			},
		})
	}

	switch(path) {
		case 'display':
			if (await kv_users.get(user) != null && info.length !== 0) {
				const data = JSON.parse(await kv_users.get(user));
				const hash = await hasher(data.salt + pass);
		
				if (hash === data.hash) {
					const credentials = { 
						'hash': data.hash,
						'salt': data.salt,
						'name': info,
						'lobby': data.lobby,
						'epoch': data.epoch
					};
			
					await kv_users.put(user, JSON.stringify(credentials));

					return new Response(`{"status":200,"message":"Updated display name...","verified":true}\n`, {
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
			}
			break;

		case 'password':
			if (await kv_users.get(user) != null && info.length !== 0) {
				const data = JSON.parse(await kv_users.get(user));
				const hash = await hasher(data.salt + pass);
		
				if (hash === data.hash) {
					const url = await fetch(`https://csprng.xyz/v1/api`, {headers: {'content-type': 'application/json;charset=UTF-8'}});
					const csprng = await url.json();

					const credentials = { 
						'hash': await hasher(csprng.Data + info),
						'salt': csprng.Data,
						'name': data.name,
						'lobby': data.lobby,
						'epoch': data.epoch
					};
			
					await kv_users.put(user, JSON.stringify(credentials));

					return new Response(`{"status":200,"message":"Updated password...","verified":true}\n`, {
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
			}
			break;

		case 'lobby':
			if (await kv_users.get(user) != null && info.length !== 0) {
				const data = JSON.parse(await kv_users.get(user));
				const hash = await hasher(data.salt + pass);
		
				if (hash === data.hash) {
					const credentials = { 
						'hash': data.hash,
						'salt': data.salt,
						'name': data.name,
						'lobby': info,
						'epoch': data.epoch
					};
			
					await kv_users.put(user, JSON.stringify(credentials));

					return new Response(`{"status":200,"message":"Updated lobby code...","verified":true}\n`, {
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
			}
			break;

		case 'delete':
			if (await kv_users.get(user) != null) {
				const data = JSON.parse(await kv_users.get(user));
				const hash = await hasher(data.salt + pass);
		
				if (hash === data.hash) {
					await kv_users.delete(user);

					return new Response(`{"status":200,"message":"Deleted account...","verified":true}\n`, {
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
			}
			break;

		case 'create':
			if (await kv_users.get(user) == null) {
				const url = await fetch(`https://csprng.xyz/v1/api`, {headers: {'content-type': 'application/json;charset=UTF-8'}});
				const csprng = await url.json();
		
				const credentials = { 
					'hash': await hasher(csprng.Data + pass),
					'salt': csprng.Data,
					'name': decodeURIComponent(request.headers.get('X-KPNC-AUTH-USER')),
					'lobby': 'none',
					'epoch': epoch
				};
		
				await kv_users.put(user, JSON.stringify(credentials));
		
				return new Response(`{"status":200,"message":"Created account...","verified":true}\n`, {
					headers: {
						'Access-Control-Allow-Headers': '*',
						'Access-Control-Allow-Origin': '*',
						'content-type': 'text/plain',
						'status' : 200
					},
				})
			} else {
				return new Response(`{"status":403,"message":"Username already exists...","verified":false}\n`, {
					headers: {
						'Access-Control-Allow-Headers': '*',
						'Access-Control-Allow-Origin': '*',
						'content-type': 'text/plain',
						'status' : 403
					},
				})
			}

		default:
			if (await kv_users.get(user) != null) {
				const data = JSON.parse(await kv_users.get(user));
				const hash = await hasher(data.salt + pass);
		
				if (hash === data.hash) {
					return new Response(`{"status":200,"message":"Authenticated...","verified":true,"display":"${data.name}","lobby":"${data.lobby}"}\n`, {
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
				return new Response(`{"status":403,"message":"User does not exist...","verified":false}\n`, {
					headers: {
						'Access-Control-Allow-Headers': '*',
						'Access-Control-Allow-Origin': '*',
						'content-type': 'text/plain',
						'status' : 403
					},
				})
			}
	}

	return new Response(`{"status":403,"message":"Bad request...","verified":false}\n`, {
		headers: {
			'Access-Control-Allow-Headers': '*',
			'Access-Control-Allow-Origin': '*',
			'content-type': 'text/plain',
			'status' : 403
		},
	})
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