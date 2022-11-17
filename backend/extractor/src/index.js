// Expects: Cron */30 * * * *:
// https://app.kpnc.io/trader/extractor/

async function handleScheduled(request, epoch) {
	let date = new Date(epoch);
	let time = (date.getHours() * 60) + date.getMinutes();

	if (date.getDay() == 0 || date.getDay() == 6) {
		return new Response('[NASDAQ Open] Monday - Friday...', {
			headers: { 'content-type': 'text/plain', 'status' : 200 }
		})
	}

	if (time < 565 || time > 995) {
		return new Response('[NASDAQ Open] 9:30 AM - 4:00 PM EST...', {
			headers: { 'content-type': 'text/plain', 'status' : 200 }
		})
	}

	function sleep(milliseconds) {
		return new Promise(r=>setTimeout(r, milliseconds));
	}

	
	//NDX:  https://financialmodelingprep.com/api/v3/nasdaq_constituent?apikey=
	//DJIA: https://financialmodelingprep.com/api/v3/dowjones_constituent?apikey=

	const nasdaq = await fetch(
		`https://api.nasdaq.com/api/quote/list-type/nasdaq100`, {
			headers: {
				'accept': 'application/json;charset=UTF-8',
				'content-type': 'application/json;charset=UTF-8'
			}
		});
	const index = await nasdaq.json();

	let symbols = {};
	index.data.data.rows.forEach(component => { symbols[component.symbol] = component.companyName });
	await kv_symbols.put('current', JSON.stringify(symbols));

	let names = {};
	index.data.data.rows.forEach(component => { names[component.companyName] = component.symbol });
	await kv_names.put('current', JSON.stringify(names));

	let one = []; let two = []; let iter = 0;
	index.data.data.rows.forEach(component => {
		++iter;

		if (iter <= 50) {
			one.push(component.symbol);
		} else {
			two.push(component.symbol);
		}
	});
	
	let quotes = {};

	const iexOne = await fetch(
		`https://cloud.iexapis.com/stable/stock/market/batch?token=${IEX_API_KEY}&symbols=${one.join()}&types=quote`, {
			headers: {
				'accept': 'application/json;charset=UTF-8',
				'content-type': 'application/json;charset=UTF-8'
			}
		});
	const componentsOne = await iexOne.json();

	for (const ticker of one) {
		let quoted = {};

		quoted['symbol'] = componentsOne[ticker].quote.symbol;
		quoted['name'] = componentsOne[ticker].quote.companyName;
		quoted['change'] = componentsOne[ticker].quote.change;
		quoted['percent'] = componentsOne[ticker].quote.changePercent;
		quoted['cap'] = componentsOne[ticker].quote.marketCap;
		quoted['price'] = componentsOne[ticker].quote.latestPrice;
		quoted['high'] = componentsOne[ticker].quote.high;
		quoted['low'] = componentsOne[ticker].quote.low;
		quoted['high52'] = componentsOne[ticker].quote.week52High;
		quoted['low52'] = componentsOne[ticker].quote.week52Low;
		quoted['pe'] = componentsOne[ticker].quote.peRatio;
		quoted['volume'] = componentsOne[ticker].quote.volume;
		quoted['open'] = componentsOne[ticker].quote.isUSMarketOpen;
		quoted['time'] = date;

		if (await kv_quotes.get(quoted.symbol) != null) {
			let merged = JSON.stringify(quoted) + ', ' + await kv_quotes.get(quoted.symbol);
			await kv_quotes.put(quoted.symbol, merged);
		} else {
			await kv_quotes.put(quoted.symbol, JSON.stringify(quoted));
		}

		quotes[componentsOne[ticker].quote.symbol] = quoted;
	}

	sleep(20);

	const iexTwo = await fetch(
		`https://sandbox.iexapis.com/stable/stock/market/batch?token=Tsk_6338354694ab47aaa558c7f3cb5f22b0&symbols=${two.join()}&types=quote`, {
			headers: {
				'accept': 'application/json;charset=UTF-8',
				'content-type': 'application/json;charset=UTF-8'
			}
		});
	const componentsTwo = await iexTwo.json();

	for (const ticker of two) {
		let quoted = {};

		quoted['symbol'] = componentsTwo[ticker].quote.symbol;
		quoted['name'] = componentsTwo[ticker].quote.companyName;
		quoted['change'] = componentsTwo[ticker].quote.change;
		quoted['percent'] = componentsTwo[ticker].quote.changePercent;
		quoted['cap'] = componentsTwo[ticker].quote.marketCap;
		quoted['price'] = componentsTwo[ticker].quote.latestPrice;
		quoted['high'] = componentsTwo[ticker].quote.high;
		quoted['low'] = componentsTwo[ticker].quote.low;
		quoted['high52'] = componentsTwo[ticker].quote.week52High;
		quoted['low52'] = componentsTwo[ticker].quote.week52Low;
		quoted['pe'] = componentsTwo[ticker].quote.peRatio;
		quoted['volume'] = componentsTwo[ticker].quote.volume;
		quoted['open'] = componentsTwo[ticker].quote.isUSMarketOpen;
		quoted['time'] = date;

		if (await kv_quotes.get(quoted.symbol) != null) {
			let merged = JSON.stringify(quoted) + ', ' + await kv_quotes.get(quoted.symbol);
			await kv_quotes.put(quoted.symbol, merged);
		} else {
			await kv_quotes.put(quoted.symbol, JSON.stringify(quoted));
		}

		quotes[componentsTwo[ticker].quote.symbol] = quoted;
	}
	
	return new Response('Success... ' + JSON.stringify(quotes), {
		headers: { 'content-type': 'text/plain', 'status' : 200 }
	})
}

addEventListener('scheduled', event => {
	let epoch = Date.now() - 14400000;

	event.waitUntil(handleScheduled(event, epoch));
})
