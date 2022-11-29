// Expects: Cron */15 * * * *:
// https://app.kpnc.io/trader/extract/

let logged = [];
let minutes;
let start;
let date;

async function logger(text) {
  text = text[0] == '[' ? text : '   ' + text;

  console.log(text);
  logged.push(text);
}

async function logger_end() {
  await kv_log.put('trader:extract:' + date.getTime(), JSON.stringify(logged));
}

async function tiingo(url, sym, day, opt, srt = start) {
  completed = 0;
  for (const symbol of sym) {
    const main = symbol.replace('USD', '');
    const data = await fetch(url[0] + symbol + url[1] + srt + url[2], {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Token ' + TIINGO_API
      }
    });

    if ('detail' in await data.json()) {
      logger('[ERROR!]: Tiingo ' + await data.json()['detail']);
  
      await logger_end();
      return new Response('ERROR! Logs are available in KV... (Tiingo)\n', {
        headers: { 'content-type': 'text/plain', 'status': 429 }
      });
    }

    const table = opt == 2 ? await data.json()[0]['priceData'] : await data.json();

    let preview = [];
    let prices = {};
    let last = 0;

    if (start != '1800-01-01') {
      if (day) {
        prices = await kv_daily.get(main);
      } else {
        prices = await kv_intra.get(main);
      }

      last = prices[Object.keys(prices)[Object.keys(prices).length - 1]]['close']
    }

    for (const row of table) {
      let price = [];
      switch (opt) {
        case 0:
          price = [row['adjClose'], row['adjOpen'], row['adjHigh'], row['adjLow'], row['adjVolume'], row['divCash'], row['splitFactor']]
          break;

        case 1:
          price = [row['close'], row['open'], row['high'], row['low'], 0, 0.0, 1.0]
          break;

        case 2:
        case 3:
          price = [row['close'], row['open'], row['high'], row['low'], row['volume'], 0.0, 1.0]
          break;
      }

      let change = 0;
      let percent = 0;
      if (last != 0) {
        change = price[0] - last;
        percent = change / last * 100;
      }
      last = price[0];

      prices[row['date']] = {
        'close': rounder(price[0]),
        'open': rounder(price[1]),
        'high': rounder(price[2]),
        'low': rounder(price[3]),
        'volume': rounder(price[4]),
        'change': rounder(change),
        'percent': rounder(percent),
        'dividend': rounder(price[5]),
        'split': rounder(price[6])
      }
    }

    for (const point of Object.keys(prices).slice(-30)) {
      preview.push(prices[point]['close'])
    }

    if (day) {
      await kv_preview.put(main, JSON.stringify({'30day': preview}));
      await kv_daily.put(main, JSON.stringify(prices));
    } else {
      await kv_intra.put(main, JSON.stringify(prices));
    }

    completed++;
    logger(`   Retrieved ${completed} of ${sym.length} (${main})...`);
  }
}

function rounder(num) {
  return Math.round((num + Number.EPSILON) * 1000) / 1000;
}

function daysago(days, date) {
  const ago = new Date(date.getTime());
  ago.setDate(date.getDate() - days);
  return ago.toISOString().split('T')[0];
}

async function handleScheduled(event, epoch = 0) {
  date = epoch != 0 ? new Date(epoch) : new Date(event.scheduledTime);
  minutes = date.getHours() * 60 + date.getMinutes();
  logger(`[UTC Timestamp]: ${date} (${minutes})`);

  sway = minutes % 2 == 0 ? 'even' : 'odd';
  logger('[Current Sway]: ' + sway);

  try {
    if (date.getDay() == 0 || date.getDay() == 6) { // Business Days
      logger('[Markets are closed today...]')
  
      await logger_end();
      return new Response('Markets are closed today...\n', {
        headers: { 'content-type': 'text/plain', 'status': 200 }
      })
    }
  
    if (await kv_index.get('DATE') != null) {
      start = daysago(1, new Date(await kv_index.get('DATE')[sway]));
    } else {
      start = '1800-01-01'
    }
    logger('[Start Date]: ' + start);

    let stocks = JSON.parse(await kv_index.get('RETRIEVE'))['STOCK'];
    const halfway = Math.ceil(await stocks.length / 2);
    stocks = sway == 'even' ? await stocks.slice(0, halfway) : await stocks.slice(halfway);

    let forex = ['EURUSD', 'USDJPY', 'GBPUSD', 'USDCAD', 'USDSEK', 'USDCHF'];

    let crypto = ['BTCUSD', 'ETHUSD', 'BNBUSD', 'XRPUSD', 'ADAUSD', 'DOGEUSD', 'MATICUSD', 'DOTUSD', 'TRXUSD', 'LTCUSD', 'AVAXUSD', 'ATOMUSD', 'XMRUSD', 'RVNUSD'];
  
    let url = ['https://api.tiingo.com/'];
    let srt = start;

    if (minutes == 775 || minutes == 780) { // About 9:00am
      logger('[Tiingo Prices (Daily): Started]');

      logger('Retrieving stock prices...');
      url = ['https://api.tiingo.com/tiingo/daily/','/prices?startDate=','&columns=adjOpen,adjHigh,adjLow,adjClose,adjVolume,divCash,splitFactor'];
      await tiingo(url, stocks, True, 0);

      logger('Retrieving forex prices...');
      url = ['https://api.tiingo.com/tiingo/fx/prices?tickers=', '&startDate=', '&resampleFreq=1day'];
      await tiingo(url, forex, True, 1);

      logger('Retrieving crypto prices...');
      srt = start == '1800-01-01' ? daysago(12 * 365, date) : start;
      url = ['https://api.tiingo.com/tiingo/crypto/prices?tickers=', '&startDate=', '&resampleFreq=1day'];
      await tiingo(url, crypto, True, 2, srt);

      logger('[Tiingo Prices (Daily): Finished]');
  
      await logger_end();
      return new Response('Daily/preview data extracted...\n', {
        headers: { 'content-type': 'text/plain', 'status': 200 }
      });
    }
  
    if (minutes >= 810 && minutes <= 1260) { // Between About 9:30am and 4:00pm
      logger('[Tiingo Prices (Intra): Started]');

      logger('Retrieving stock prices...');
      url = ['https://api.tiingo.com/iex/', '/prices?startDate=', '&resampleFreq=5min&columns=open,high,low,close,volume'];
      await tiingo(url, stocks, False, 3);

      logger('Retrieving forex prices...');
      srt = start == '1800-01-01' ? daysago(30, date) : start;
      url = ['https://api.tiingo.com/tiingo/fx/prices?tickers=', '&startDate=', '&resampleFreq=5min'];
      await tiingo(url, forex, False, 1, srt);

      logger('Retrieving crypto prices...');
      srt = start == '1800-01-01' ? daysago(15, date) : start;
      url = ['https://api.tiingo.com/tiingo/crypto/prices?tickers=', '&startDate=', '&resampleFreq=5min'];
      await tiingo(url, crypto, False, 2, srt);

      logger('[Tiingo Prices (Intra): Finished]');
  
      await logger_end();
      return new Response('Intraday data extracted...\n', {
        headers: { 'content-type': 'text/plain', 'status': 200 }
      });
    }
    
    logger('[Markets are closed right now]')
    
    await logger_end();
    return new Response('Markets are closed right now...\n', {
      headers: { 'content-type': 'text/plain', 'status': 200 }
    })
  } catch (error) {
    logger('[ERROR!]: ' + error.message);

    await logger_end();
    return new Response('ERROR! Logs are available in KV...\n', {
      headers: { 'content-type': 'text/plain', 'status': 500 }
    })
  }
}

addEventListener('scheduled', event => {
	event.waitUntil(handleScheduled(event));
});

// addEventListener('fetch', event => {
//   let epoch = Date.now();
//   event.waitUntil(handleScheduled(event, epoch));
// });