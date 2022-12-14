// Expects: https://app.kpnc.io/trader/retrieve/<store>/<key>/:
// https://app.kpnc.io/trader/retrieve/

addEventListener('fetch', event => {
  let epoch = Date.now();
	event.respondWith(handleRequest(event, epoch));
});

let logged = [];
let request;
let date;

async function logger(text) {
  text = text[0] == '[' ? text : '   ' + text;

  console.log(text);
  logged.push(text);
}

async function logger_end() {
  await kv_log.put('trader:retrieve:' + date.getTime(), JSON.stringify(logged));
}

async function handleRequest(event, epoch) {
  request = event.request;
  date = new Date(epoch);

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
    logger('[Retrieve Data: Started]');

    logger('* Country:   ' + request.cf.country);
    logger('* Region:    ' + request.cf.region);
    logger('* ISP:       ' + request.cf.asOrganization);
    logger('* IP:        ' + request.headers.get('cf-connecting-ip'));

    let path = new URL(request.url).pathname.substring(1).toUpperCase().replace('TRADER/RETRIEVE/', '').replace('FAVICON.ICO', '').split('/');
    logger(`Parsed: ${request.url} => ${path.join('/')}`)
    logger('Store:  ' + path[0]);
    logger('Key:    ' + path[1]);
    
    switch (path[0]) {
      case '':
        logger('[Missing request...]');

        await logger_end();
        return new Response('Missing request...\n', text);
      
      case 'META':
        if (await kv_meta.get(path[1]) == null)
          break;
        data = await kv_meta.get(path[1]);

        logger('[Retrieve Data: Finished]');

        await logger_end();
        return new Response(await data, json);
      
      case 'INDEX':
        if (await kv_index.get(path[1]) == null)
          break;
        data = await kv_index.get(path[1]);

        logger('[Retrieve Data: Finished]');

        await logger_end();
        return new Response(await data, json);
    
      case 'INTRA':
        if (await kv_intra.get(path[1]) == null)
          break;
        data = await kv_intra.get(path[1]);

        logger('[Retrieve Data: Finished]');

        await logger_end();
        return new Response(await data, json);
  
      case 'DAILY':
        if (await kv_daily.get(path[1]) == null)
          break;
        data = await kv_daily.get(path[1]);

        logger('[Retrieve Data: Finished]');

        await logger_end();
        return new Response(await data, json);

      case 'PREVIEW':
        if (await kv_preview.get(path[1]) == null)
          break;
        data = await kv_preview.get(path[1]);

        logger('[Retrieve Data: Finished]');

        await logger_end();
        return new Response(await data, json);

      default:
        logger('[Malformed request...]');

        await logger_end();
        return new Response('Malformed request...\n', text);
    }

    logger(`[Uknown file  (${path[0]}:${path[1]})...]`);

    await logger_end();
    return new Response(`Unknown key (${path[0]}:${path[1]})...\n`, text);
  } catch (error) {
    logger('[ERROR!]: ' + error.message);

    await logger_end();
    return new Response('ERROR! Logs are available in KV...', {
      headers: { 'content-type': 'text/plain', 'status': 500 }
    })
  }
}
