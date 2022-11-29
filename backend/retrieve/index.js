// Expects: https://app.kpnc.io/trader/retrieve/<store>/<key>/:
// https://app.kpnc.io/trader/retrieve/

let logged = [];
let date;

async function logger(text) {
  if (text[0] == '[') {
    console.log(text);
  } else {
    console.log(`   ${text}`);
  }

  logged.push(text);

  if (text == 'END') {
    await kv_log.put(`trader:retrieve:${date.getTime()}`, JSON.stringify(logged));
  }
}

async function handleRequest(request, epoch) {
  date = new Date(epoch);

  logger('[Retrieving data]');

  logger(`* Connection IP:        ${request.headers.get('cf-connecting-ip')}`);
  logger(`* Connection ISP:       ${request.cf.asOrganization}`);
  logger(`* Connection Region:    ${request.cf.region}`);
  logger(`* Connection Country:   ${request.cf.country}`);

  let path = new URL(request.url).pathname.substring(1).replace('trader/retriever/', '').split('/');
  logger(`Parsed: ${request.url} --> ${path.join('/')}`)
  
  logger()
  
  logger('END')
  return new Response('Uknown path...', {
    headers: { 'content-type': 'text/plain', 'status' : 404 }
  })
}

addEventListener('fetch', event => {
  let epoch = Date.now();
	event.responeWith(handleRequest(event.request, epoch));
});