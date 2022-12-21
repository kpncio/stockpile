// Expects: https://app.kpnc.io/trader/retrieve/<store>/<key>/:
// https://app.kpnc.io/trader/retrieve/

addEventListener('fetch', event => {
	event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  request = event.request;

  text = {
    headers: {
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Origin': '*',
      'content-type': 'text/plain',
      'status': 404
    },
  };

  json = {
    headers: {
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Origin': '*',
      'content-type': 'application/json',
      'status': 200
    },
  };

  try {
    let path = new URL(request.url).pathname.substring(1).toUpperCase().replace('TRADER/RETRIEVE/', '').replace('FAVICON.ICO', '').split('/');
    
    switch (path[0]) {
      case '':
        return new Response('Missing request...\n', text);
      
      case 'META':
        if (await kv_meta.get(path[1]) == null)
          break;
        data = await kv_meta.get(path[1]);
        return new Response(await data, json);
      
      case 'INDEX':
        if (await kv_index.get(path[1]) == null)
          break;
        data = await kv_index.get(path[1]);
        return new Response(await data, json);
    
      case 'INTRA':
        if (await kv_intra.get(path[1]) == null)
          break;
        data = await kv_intra.get(path[1]);
        return new Response(await data, json);
  
      case 'DAILY':
        if (await kv_daily.get(path[1]) == null)
          break;
        data = await kv_daily.get(path[1]);
        return new Response(await data, json);

      case 'PREVIEW':
        if (await kv_preview.get(path[1]) == null)
          break;
        data = await kv_preview.get(path[1]);
        return new Response(await data, json);

      case 'EXTRA':
        if (await kv_extra.get(path[1]) == null)
          break;
        data = await kv_extra.get(path[1]);
        return new Response(await data, json);

      default:
        return new Response('Malformed request...\n', text);
    }

    return new Response(`Unknown key (${path[0]}:${path[1]})...\n`, text);
  } catch (error) {
    return new Response('FATAL ERROR!', {
      headers: { 'content-type': 'text/plain', 'status': 500 }
    });
  }
}
