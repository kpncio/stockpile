// Expects: Cron */5 * * * *:
// https://app.kpnc.io/trader/extract/

let logged = []

function logger(text) {
  if (text[0] == '[') {
    console.log(text);
  } else {
    console.log(`   ${text}`);
  }

  logged.push(text)

  if (text == 'END') {
    
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
  let date = (epoch != 0) ? new Date(epoch) : new Date(event.scheduledTime);
  let minutes = (date.getHours() * 60) + date.getMinutes();
  logger(`[UTC Timestamp]: ${date}`);

	if (date.getDay() == 0 || date.getDay() == 6) { // Business Days
		return new Response('Markets are closed today...', {
			headers: { 'content-type': 'text/plain', 'status' : 200 }
		})
	}

  const retrieve = await kv_index.get('RETRIEVE');
  let stocks = await JSON.parse(retrieve)['STOCK'];
  const halfway = Math.ceil(await stocks.length / 2)
  stocks = (minutes % 2 == 0) ? await stocks.slice(0, halfway) : await stocks.slice(halfway);

  if (minutes == 775 || minutes == 780) { // About 9:00am
    logger('[Tiingo Prices (Daily): Started]');
    logger('Retrieving stock prices...');

    let completed = 0;
    for (const symbol of stocks) {
      const data = await fetch(`https://api.tiingo.com/tiingo/daily/${symbol}/prices?startDate=1800-01-01&columns=adjOpen,adjHigh,adjLow,adjClose,adjVolume,divCash,splitFactor`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ' + TIINGO_API
        }
      });

      let preview = [];
      let prices = {};
      let last = 0;
      for (const row of await data.json()) {
        let change = 0;
        let percent = 0;
        if (last != 0) {
          change = row['adjClose'] - last;
          percent = change / last * 100;
        }
        last = row['adjClose'];

        preview.push(rounder(row['adjClose']));
        prices[row['date'].split('T')[0]] = {
          'close': rounder(row['adjClose']),
          'open': rounder(row['adjOpen']),
          'high': rounder(row['adjHigh']),
          'low': rounder(row['adjLow']),
          'volume': rounder(row['adjVolume']),
          'change': rounder(change),
          'percent': rounder(percent),
          'dividend': rounder(row['divCash']),
          'split': rounder(row['splitFactor'])
        }
      }

      await kv_preview.put(symbol, JSON.stringify({'30day': preview.slice(-30)}));
      await kv_daily.put(symbol, JSON.stringify(prices));

      completed++;
      logger(`Retrieved stock: ${completed} of ${stocks.length} (${symbol})...`);
    }

    logger('Retrieving forex prices...');

    const forex = {
      'symbols': ['eurusd', 'usdjpy', 'gbpusd', 'usdcad', 'usdsek', 'usdchf'],
      'eurusd': 'EUR',
      'usdjpy': 'JPY',
      'gbpusd': 'GBP',
      'usdcad': 'CAD',
      'usdsek': 'SEK',
      'usdchf': 'CHF'
    }

    completed = 0;
    for (const symbol of forex['symbols']) {
      const data = await fetch(`https://api.tiingo.com/tiingo/fx/prices?tickers=${symbol}&startDate=1800-01-01&resampleFreq=1day`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ' + TIINGO_API
        }
      });

      let preview = [];
      let prices = {};
      let last = 0;
      for (const row of await data.json()) {
        let change = 0;
        let percent = 0;
        if (last != 0) {
          change = row['close'] - last;
          percent = change / last * 100;
        }
        last = row['close'];

        preview.push(rounder(row['close']));
        prices[row['date'].split('T')[0]] = {
          'close': rounder(row['close']),
          'open': rounder(row['open']),
          'high': rounder(row['high']),
          'low': rounder(row['low']),
          'volume': 0,
          'change': rounder(change),
          'percent': rounder(percent),
          'dividend': 0.0,
          'split': 1.0
        }
      }

      await kv_preview.put(symbol, JSON.stringify({'30day': preview.slice(-30)}));
      await kv_daily.put(symbol, JSON.stringify(prices));

      completed++;
      logger(`Retrieved forex: ${completed} of ${forex['symbols'].length}...`);
    }

    logger('Retrieving crypto prices...');

    const crypto = ['btcusd', 'ethusd', 'bnbusd', 'xrpusd', 'adausd', 'dogeusd', 'maticusd', 'dotusd', 'trxusd', 'ltcusd', 'avaxusd', 'atomusd', 'xmrusd', 'rvnusd'];

    const data = await fetch(`https://api.tiingo.com/tiingo/crypto/prices?tickers=${crypto.join()}&startDate=${daysago((12 * 365), date)}&resampleFreq=1day`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Token ' + TIINGO_API
      }
    });

    completed = 0;
    for (const symbol of await data.json()) {
      let preview = [];
      let prices = {};
      let last = 0;
      for (const row of symbol['priceData']) {
        let change = 0;
        let percent = 0;
        if (last != 0) {
          change = row['close'] - last;
          percent = change / last * 100;
        }
        last = row['close'];

        preview.push(rounder(row['close']));
        prices[row['date'].split('T')[0]] = {
          'close': rounder(row['close']),
          'open': rounder(row['open']),
          'high': rounder(row['high']),
          'low': rounder(row['low']),
          'volume': rounder(row['volume']),
          'change': rounder(change),
          'percent': rounder(percent),
          'dividend': 0.0,
          'split': 1.0
        }
      }

      await kv_preview.put(symbol['baseCurrency'].toUpperCase(), JSON.stringify({'30day': preview.slice(-30)}));
      await kv_daily.put(symbol['baseCurrency'].toUpperCase(), JSON.stringify(prices));

      completed++;
      logger(`Retrieved crypto: ${completed} of 14...`);
    }

    logger('[Tiingo Prices (Daily): Finished]');

		return new Response('Daily/preview data extracted...', {
			headers: { 'content-type': 'text/plain', 'status' : 200 }
		})
	}

	if (minutes >= 810 && minutes <= 1260) { // Between About 9:30am and 4:00pm
    logger('[Tiingo Prices (Intra): Started]');
    logger('Retrieving stock prices...');

    let completed = 0;
    for (const symbol of stocks) {
      const data = await fetch(`https://api.tiingo.com/iex/${symbol}/prices?startDate=1800-01-01&resampleFreq=5min&columns=open,high,low,close,volume`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ' + TIINGO_API
        }
      });

      let preview = [];
      let prices = {};
      let last = 0;
      for (const row of await data.json()) {
        let change = 0;
        let percent = 0;
        if (last != 0) {
          change = row['close'] - last;
          percent = change / last * 100;
        }
        last = row['close'];

        preview.push(rounder(row['close']));
        prices[Math.round(new Date(row['date']).getTime() / 1000)] = {
          'close': rounder(row['close']),
          'open': rounder(row['open']),
          'high': rounder(row['high']),
          'low': rounder(row['low']),
          'volume': rounder(row['volume']),
          'change': rounder(change),
          'percent': rounder(percent),
          'dividend': 0.0,
          'split': 1.0
        }
      }

      await kv_intra.put(symbol, JSON.stringify(prices));

      completed++;
      logger(`Retrieved stock: ${completed} of ${stocks.length} (${symbol})...`);
    }

    logger('Retrieving forex prices...');

    const forex = {
      'symbols': ['eurusd', 'usdjpy', 'gbpusd', 'usdcad', 'usdsek', 'usdchf'],
      'eurusd': 'EUR',
      'usdjpy': 'JPY',
      'gbpusd': 'GBP',
      'usdcad': 'CAD',
      'usdsek': 'SEK',
      'usdchf': 'CHF'
    }

    completed = 0;
    for (const symbol of forex['symbols']) {
      const data = await fetch(`https://api.tiingo.com/tiingo/fx/prices?tickers=${symbol}&startDate=${daysago(30, date)}&resampleFreq=5min`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ' + TIINGO_API
        }
      });

      let preview = [];
      let prices = {};
      let last = 0;
      for (const row of await data.json()) {
        let change = 0;
        let percent = 0;
        if (last != 0) {
          change = row['close'] - last;
          percent = change / last * 100;
        }
        last = row['close'];

        preview.push(rounder(row['close']));
        prices[Math.round(new Date(row['date']).getTime() / 1000)] = {
          'close': rounder(row['close']),
          'open': rounder(row['open']),
          'high': rounder(row['high']),
          'low': rounder(row['low']),
          'volume': 0,
          'change': rounder(change),
          'percent': rounder(percent),
          'dividend': 0.0,
          'split': 1.0
        }
      }

      await kv_preview.put(symbol, JSON.stringify({'30day': preview.slice(-30)}));
      await kv_daily.put(symbol, JSON.stringify(prices));

      completed++;
      logger(`Retrieved forex: ${completed} of ${forex['symbols'].length}...`);
    }

    logger('Retrieving crypto prices...');

    const crypto = ['btcusd', 'ethusd', 'bnbusd', 'xrpusd', 'adausd', 'dogeusd', 'maticusd', 'dotusd', 'trxusd', 'ltcusd', 'avaxusd', 'atomusd', 'xmrusd', 'rvnusd'];

    const data = await fetch(`https://api.tiingo.com/tiingo/crypto/prices?tickers=${crypto.join()}&startDate=${daysago(15, date)}&resampleFreq=5min`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Token ' + TIINGO_API
      }
    });

    completed = 0;
    for (const symbol of await data.json()) {
      let preview = [];
      let prices = {};
      let last = 0;
      for (const row of symbol['priceData']) {
        let change = 0;
        let percent = 0;
        if (last != 0) {
          change = row['close'] - last;
          percent = change / last * 100;
        }
        last = row['close'];

        preview.push(rounder(row['close']));
        prices[Math.round(new Date(row['date']).getTime() / 1000)] = {
          'close': rounder(row['close']),
          'open': rounder(row['open']),
          'high': rounder(row['high']),
          'low': rounder(row['low']),
          'volume': rounder(row['volume']),
          'change': rounder(change),
          'percent': rounder(percent),
          'dividend': 0.0,
          'split': 1.0
        }
      }

      await kv_intra.put(symbol['baseCurrency'].toUpperCase(), JSON.stringify(prices));

      completed++;
      logger(`Retrieved crypto: ${completed} of 14...`);
    }

    logger('[Tiingo Prices (Intra): Finished]');

		return new Response('Intraday data extracted...', {
			headers: { 'content-type': 'text/plain', 'status' : 200 }
		})
	}

  return new Response('Markets are closed right now...', {
    headers: { 'content-type': 'text/plain', 'status' : 200 }
  })
}

addEventListener('scheduled', event => {
	event.waitUntil(handleScheduled(event));
});

addEventListener('fetch', event => {
  let epoch = Date.now();
	event.waitUntil(handleScheduled(event, epoch));
});