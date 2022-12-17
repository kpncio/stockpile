# Expects: Cron "*/30 * * * *":
# https://app.kpnc.io/trader/extract/

from bs4 import BeautifulSoup as beautiful
from dotenv import load_dotenv
import cloudscraper
import traceback
import threading
import yfinance
import requests
import datetime
import json
import time
import os

load_dotenv()

tiingo = {
    'Content-Type': 'application/json',
    'Authorization': 'Token ' + os.getenv('tiingo_api')
}

yahoo = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/605.0 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/605.0'
}

flare = {
    'Content-Type': 'application/json',
    'X-Auth-Email': os.getenv('cf_email'),
    'X-Auth-Key': os.getenv('cf_api_key')
}

completed = 0

epoch = round(time.time()) * 1000

def log(t, s = True):
    if s:
        if t[0] != '[':
            print('   ' + t)
        else:
            print(t)

    if not os.path.exists('logs'):
        os.makedirs('logs')

    file = open(f'logs/{epoch}.log', 'a')
    file.write(t + '\n')
    file.close()

def logger_end():
    logged = []
    with open(f'logs/{epoch}.log', 'r') as file:
        while (line := file.readline()):
            logged.append(line)
    url = f"https://api.cloudflare.com/client/v4/accounts/{os.getenv('cf_account')}/storage/kv/namespaces/{os.getenv('cf_kv_log')}/bulk"
    requests.request('PUT', url, json = [{ 'base64': False, 'key': 'trader:extract:' + str(epoch), 'value': json.dumps(logged) }], headers = flare)

def strip(p, v = None):
    if v == None:
        symbols = []
        for each in p:
            symbols.append(each[0])

        return symbols
    else:
        for each in p:
            v[each[0]] = each[1]
            v[each[1]] = each[0]

        return v

def daysago(d):
    now = datetime.datetime.now()
    ago = datetime.timedelta(days = d)
    date = now - ago
    return str(date).split()[0]

def kv_get(n, k, j = True):
    url = f"https://api.cloudflare.com/client/v4/accounts/{os.getenv('cf_account')}/storage/kv/namespaces/{os.getenv('cf_kv_' + n)}/values/{k}"
    response = requests.request('GET', url, headers = flare)

    if j:
        return json.loads(response.text)
    else:
        return response.text

def kv_put(n, d):
    try:
        url = f"https://api.cloudflare.com/client/v4/accounts/{os.getenv('cf_account')}/storage/kv/namespaces/{os.getenv('cf_kv_' + n)}/bulk"
        requests.request('PUT', url, json = d, headers = flare)
    except:
        log('Could not upload packet, trying once more...')

        url = f"https://api.cloudflare.com/client/v4/accounts/{os.getenv('cf_account')}/storage/kv/namespaces/{os.getenv('cf_kv_' + n)}/bulk"
        requests.request('PUT', url, json = d, headers = flare)

def calc_chunks(l, n):
    for i in range(0, len(l), n):
        yield l[i:i + n]

def calc_dixie(e, y, p, c, k, f):
    return round(50.14348112 * (e ** -0.576) * (y ** 0.136) * (p ** -0.119) * (c ** 0.091) * (k ** 0.042) * (f ** 0.036), 3)

def parse_date(opt, date):
    match opt:
        case 0:
            parts = date.split(' ')
            d = parts[0].split('-')
            t = parts[1].split('-')[0].split(':')
            return round(datetime.datetime(int(d[0]), int(d[1]), int(d[2]), int(t[0]), int(t[1]), int(t[2])).timestamp())
        case 1:
            parts = date.split('.')[0]
            d = parts.split('T')[0].split('-')
            t = parts.split('T')[1].split(':')
            return round(datetime.datetime(int(d[0]), int(d[1]), int(d[2]), int(t[0]), int(t[1]), int(t[2])).timestamp())
        case 2:
            parts = date.split('.')[0]
            d = parts.split('+')[0].split('T')[0].split('-')
            t = parts.split('+')[0].split('T')[1].split(':')
            return round(datetime.datetime(int(d[0]), int(d[1]), int(d[2]), int(t[0]), int(t[1]), int(t[2])).timestamp())

def parse_indices(u):
    scraper = cloudscraper.create_scraper()
    data = scraper.get(u).text
    soup = beautiful(data, 'html.parser')
    table = soup.select_one('table:nth-of-type(1)')

    rows = []
    for row in table.tbody.find_all('tr'):
        columns = row.find_all('td')
        
        if(columns != []):
            rank = columns[0].text.strip()
            company = columns[1].text.strip()
            symbol = columns[2].text.strip().replace('.', '-')
            weight = columns[3].text.strip()
            price = columns[4].text.strip().replace('\xa0\xa0', '').replace(',', '')
            change = columns[5].text.strip()
            percent = columns[6].text.strip('(%)')

            rows.append([rank, company, symbol, weight, price, change, percent])

    return rows

def parse_index():
    scraper = cloudscraper.create_scraper()
    data = scraper.get('https://www.slickcharts.com/').text
    soup = beautiful(data, 'html.parser')
    table = soup.select_one('table:nth-of-type(1)')

    rows = []
    for row in table.tbody.find_all('tr'):
        columns = row.find_all('td')
        
        if(columns != []):
            index = columns[0].text.strip().replace('S&P 500', 'spx').replace('Nasdaq 100', 'ndx').replace('Dow Jones', 'djia')
            value = columns[1].text.strip().replace('\xa0\xa0', '').replace(',', '').replace('*', '')
            change = columns[2].text.strip()
            percent = columns[3].text.strip('(%)')

            rows.append([index, value, change, percent])

    return rows

def get_index_contituents():
    # Get index (https://slickcharts.com/) constituents

    log('[Index Constituents: Started]')

    log('Scraping indices...')

    'string'
    12
    True
    [1, 2, 3, 4]
    {'one': 1, 'two': 2}


    indices = {
        'SPX': parse_indices('https://www.slickcharts.com/sp500'),
        'NDX': parse_indices('https://www.slickcharts.com/nasdaq100'),
        'DJIA': parse_indices('https://www.slickcharts.com/dowjones'),
        'FOREX': [
            ['1', 'EUR/USD Forex', 'EUR', '57.6', '-', '-', '-'],
            ['2', 'USD/JPY Forex', 'JPY', '13.6', '-', '-', '-'],
            ['3', 'GBP/USD Forex', 'GBP', '11.9', '-', '-', '-'],
            ['4', 'USD/CAD Forex', 'CAD', '9.1', '-', '-', '-'],
            ['5', 'USD/SERK Forex', 'SEK', '4.2', '-', '-', '-'],
            ['6', 'USD/CHF Forex', 'CHF', '3.6', '-', '-', '-']
        ],
        'CRYPTO': [
            ['1', 'Bitcoin', 'BTC', '20', '-', '-', '-'],
            ['2', 'Ethereum', 'ETH', '15', '-', '-', '-'],
            ['3', 'Monero', 'XMR', '10', '-', '-', '-'],
            ['4', 'Ripple', 'XRP', '10', '-', '-', '-'],
            ['5', 'Dogecoin', 'DOGE', '7', '-', '-', '-'],
            ['6', 'Litecoin', 'LTC', '7', '-', '-', '-'],
            ['7', 'Cardano', 'ADA', '5', '-', '-', '-'],
            ['8', 'Polygon', 'MATIC', '5', '-', '-', '-'],
            ['9', 'Cosmos', 'ATOM', '5', '-', '-', '-'],
            ['10', 'Tron', 'TRX', '5', '-', '-', '-'],
            ['11', 'Ravencoin', 'RVN', '5', '-', '-', '-'],
            ['12', 'Binance Coin', 'BNB', '2', '-', '-', '-'],
            ['13', 'Polkadot', 'DOT', '2', '-', '-', '-'],
            ['14', 'Avalanche', 'AVAX', '2', '-', '-', '-']
        ],
        'METALS': [
            ['1', 'Gold Futures', 'GC-F', '20', '-', '-', '-'],
            ['2', 'Lithium Carbonate Futures', 'LICO-F', '20', '-', '-', '-'],
            ['3', 'Aluminium Futures', 'ALI-F', '20', '-', '-', '-'],
            ['4', 'Copper Futures', 'HG-F', '15', '-', '-', '-'],
            ['5', 'Silver Futures', 'SI-F', '10', '-', '-', '-'],
            ['6', 'Platinum Futures', 'PL-F', '10', '-', '-', '-'],
            ['7', 'Palladium Futures', 'PA-F', '5', '-', '-', '-']
        ],
        'ENERGY': [
            ['1', 'Brent Crude Oil Futures', 'BZ-F', '30', '-', '-', '-'],
            ['2', 'WTI Crude Oil Futures', 'CL-F', '25', '-', '-', '-'],
            ['3', 'RBOB Gasoline Futures', 'RB-F', '20', '-', '-', '-'],
            ['5', 'Natural Gas Futures', 'NG-F', '20', '-', '-', '-'],
            ['4', 'Heating Oil Futures', 'HO-F', '5', '-', '-', '-']
        ],
        'PORTFOLIO': [
            ['1', 'NVIDIA Corp', 'NVDA', '70', '-', '-', '-'],
            ['4', 'Lithium Carbonate Futures', 'LICO-F', '62', '-', '-', '-'],
            ['3', 'GrafTech International Ltd', 'EAF', '29', '-', '-', '-'],
            ['2', 'CSX Corp', 'CSX', '12', '-', '-', '-'],
            ['5', 'RBOB Gasoline Futures', 'RB-F', '1', '-', '-', '-']
        ]
    }

    for each in indices:
        rows = {}
        table = []

        log(f'Parsing {each}...')

        for row in indices[each]:
            key = row[2]
            value = {'rank': row[0], 'name': row[1], 'weight': row[3]}
            rows[key] = value
            table.append((row[0], row[2], row[1], row[3]))

        log(f'Uploading {each}...')

        kv_put('index', [{'key': each, 'value': json.dumps(rows)}])

    log('[Index Constituents: Finished]')

def get_index_prices():
    # Get index (https://slickcharts.com/ and https://api.tiingo.com/ and https://finance.yahoo.com/) prices

    log('[Index Prices: Started]')

    log('Requesting/scraping index prices...')

    indices = parse_index()

    crypto = requests.get(f'https://api.tiingo.com/tiingo/crypto/prices?tickers=btcusd&startDate={daysago(5)}&resampleFreq=1day', headers = tiingo).json()
    btc_price = round(crypto[0]['priceData'][-1]['close'], 2)
    btc_change = round(crypto[0]['priceData'][-2]['close'] - crypto[0]['priceData'][-1]['close'], 2)
    btc_percent = round((crypto[0]['priceData'][-2]['close'] - crypto[0]['priceData'][-1]['close']) / crypto[0]['priceData'][-1]['close'] * 100, 2)

    forex = requests.get(f'https://api.tiingo.com/tiingo/fx/prices?tickers=eurusd,usdjpy,gbpusd,usdcad,usdsek,usdchf&startDate={daysago(5)}&resampleFreq=1day', headers = tiingo).json()
    usdx = {'eurusd': [], 'usdjpy': [], 'gbpusd': [], 'usdcad': [], 'usdsek': [], 'usdchf': []}
    for each in forex:
        usdx[each['ticker']].append(each['close'])
    usdx_price = calc_dixie(usdx['eurusd'][-1], usdx['usdjpy'][-1], usdx['gbpusd'][-1], usdx['usdcad'][-1], usdx['usdsek'][-1], usdx['usdchf'][-1])
    usdx_change = round(usdx_price - calc_dixie(usdx['eurusd'][-2], usdx['usdjpy'][-2], usdx['gbpusd'][-2], usdx['usdcad'][-2], usdx['usdsek'][-2], usdx['usdchf'][-2]), 2)
    usdx_percent = round(usdx_change / usdx_price * 100, 2)

    metals = requests.get('https://query1.finance.yahoo.com/v7/finance/quote?symbols=GC=F', headers = yahoo).json()
    gold_price = round(metals['quoteResponse']['result'][0]['regularMarketPrice'], 2)
    gold_change = round(metals['quoteResponse']['result'][0]['regularMarketChange'], 2)
    gold_percent = round(metals['quoteResponse']['result'][0]['regularMarketChangePercent'], 2)

    brent = requests.get('https://query1.finance.yahoo.com/v7/finance/quote?symbols=BZ=F', headers = yahoo).json()
    oil_price = round(brent['quoteResponse']['result'][0]['regularMarketPrice'], 3)
    oil_change = round(brent['quoteResponse']['result'][0]['regularMarketChange'], 3)
    oil_percent = round(brent['quoteResponse']['result'][0]['regularMarketChangePercent'], 3)

    stock = requests.get('https://api.tiingo.com/iex/?tickers=nvda,csx,eaf', headers = tiingo).json()
    why = {}
    for each in stock:
        why[each['ticker']] = each['last']
    portfolio_price = round((why['NVDA'] * 70) + (why['CSX'] * 12) + (why['EAF'] * 29), 2)
    portfolio_change = round((why['NVDA'] * 70) + (why['CSX'] * 12) + (why['EAF'] * 29) - 10000, 2)
    portfolio_percent = round((((why['NVDA'] * 70) + (why['CSX'] * 12) + (why['EAF'] * 29) - 10000) / 10000) * 100, 2)

    log('Uploading to Cloudflare...')

    jayson = [{'key': 'ROOT', 'value': json.dumps({
        'SPX': {'price': indices[0][1], 'change': indices[0][2], 'percent': indices[0][3]},
        'NDX': {'price': indices[1][1], 'change': indices[1][2], 'percent': indices[1][3]},
        'DJIA': {'price': indices[2][1], 'change': indices[2][2], 'percent': indices[2][3]},
        'FOREX': {'price': usdx_price, 'change': usdx_change, 'percent': usdx_percent},
        'CRYPTO': {'price': btc_price, 'change': btc_change, 'percent': btc_percent},
        'METALS': {'price': gold_price, 'change': gold_change, 'percent': gold_percent},
        'ENERGY': {'price': oil_price, 'change': oil_change, 'percent': oil_percent},
        'PORTFOLIO': {'price': portfolio_price, 'change': portfolio_change, 'percent': portfolio_percent}
    })}]
    kv_put('index', jayson)

    log('[Index Prices: Finished]')

def get_yahoo_intra_prices():
    # Get future (https://finance.yahoo.com/) prices

    log('[COMEX/NYMEX Futures (Intra): Started]')

    log('Requesting/scraping COMEX/NYMEX prices...')

    symbols = ['CL-F', 'BZ-F', 'RB-F', 'HO-F', 'NG-F', 'GC-F', 'SI-F', 'PL-F', 'PA-F', 'ALI-F', 'HG-F']

    completed = 0
    print(f'   ({completed}/{len(symbols)})          ', end = '\r')
    for symbol in symbols:
        last = 0
        prices = {}
        
        data = yfinance.Ticker(symbol.replace('-', '=')).history(period = '1mo', interval = '15m')
        data.iloc[::-1]

        for index, rows in data.iterrows():
            change = 0
            percent = 0
            if last != 0:
                change = rows.Close - last
                percent = change / last * 100
            last = rows.Close
            
            prices[parse_date(0, str(index))] = {
                'close': round(rows.Close, 3), 'open': round(rows.Open, 3),
                'high': round(rows.High, 3), 'low': round(rows.Low, 3),
                'volume': round(rows.Volume, 3), 'change': round(change, 3),
                'percent': round(percent, 3), 'dividend': 0.0, 'split': 1.0
            }

        kv_put('intra', [{'key': symbol, 'value': json.dumps(prices)}])

        completed += 1
        log(f'(Processing {completed}/{len(symbols)})', False)
        print(f'   (Processing {completed}/{len(symbols)})          ', end = '\r')

    log('[COMEX/NYMEX Futures: Finished]')

def get_yahoo_daily_prices():
    # Get future (https://finance.yahoo.com/) prices

    log('[COMEX/NYMEX Futures (Daily): Started]')

    log('Requesting/scraping COMEX/NYMEX prices...')

    symbols = ['CL-F', 'BZ-F', 'RB-F', 'HO-F', 'NG-F', 'GC-F', 'SI-F', 'PL-F', 'PA-F', 'ALI-F', 'HG-F']

    completed = 0
    print(f'   ({completed}/{len(symbols)})          ', end = '\r')
    for symbol in symbols:
        last = 0
        preview = []
        prices = {}

        data = yfinance.Ticker(symbol.replace('-', '=')).history(period = 'max', interval = '1d')
        data.iloc[::-1]

        for index, rows in data.iterrows():
            change = 0
            percent = 0
            if last != 0:
                change = rows.Close - last
                percent = change / last * 100
            last = rows.Close

            preview.append(rows.Close)
            prices[str(index).split()[0]] = {
                'close': round(rows.Close, 3), 'open': round(rows.Open, 3),
                'high': round(rows.High, 3), 'low': round(rows.Low, 3),
                'volume': round(rows.Volume, 3), 'change': round(change, 3),
                'percent': round(percent, 3), 'dividend': 0.0, 'split': 1.0
            }

        kv_put('preview', [{'key': symbol, 'value': json.dumps(preview[-30:])}])
        kv_put('daily', [{'key': symbol, 'value': json.dumps(prices)}])

        completed += 1
        log(f'(Processing {completed}/{len(symbols)})', False)
        print(f'   (Processing {completed}/{len(symbols)})          ', end = '\r')

    log('[COMEX/NYMEX Futures: Finished]')

def get_investing_prices():
    # Get future (https://www.investing.com/) prices

    log('[SHFE Futures: Started]')

    log('Requesting/scraping SHFE prices...')

    scraper = cloudscraper.create_scraper()
    source = 'https://in.investing.com/commodities/lithium-carbonate-99-min-china-futures-historical-data?end_date=4102462800&st_date=946702800&interval_sec=daily'
    data = scraper.get(source).text
    soup = beautiful(data, 'html.parser')
    table = soup.find('table', class_ = 'common-table medium js-table')

    preview = []
    prices = {}
    for row in table.tbody.find_all('tr'):
        columns = row.find_all('span')
        
        month = {'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10,'Nov': 11, 'Dec': 12}

        if(columns != []):
            date = columns[0].text.strip().replace(',', '').split()
            close = float(columns[1].text.strip().replace(',', ''))
            open = float(columns[2].text.strip().replace(',', ''))
            high = float(columns[3].text.strip().replace(',', ''))
            low = float(columns[4].text.strip().replace(',', ''))
            volume = int(columns[5].text.strip().replace(',', ''))
            percent = float(columns[6].text.strip().replace('%', ''))
            change = close - (100 * close) / (100 + percent)
            dividend = 0.0
            split = 1.0

            preview.append(close)
            prices[f'{date[2]}-{str(month[date[0]]).zfill(2)}-{date[1]}'] = {
                'close': close, 'open': open, 'high': high, 'low': low, 'volume': volume, 'change': change, 'percent': percent, 'dividend': dividend, 'split': split
            }

    log('Uploading to Cloudflare...')

    preview = preview[::-1]
    prices = dict(reversed(list(prices.items())))

    kv_put('preview', [{'key': 'LICO-F', 'value': json.dumps(preview[-30:])}])
    kv_put('daily', [{'key': 'LICO-F', 'value': json.dumps(prices)}])

    log('[SHFE Futures: Finished]')

def get_tiingo_prices(url, sym, day, opt, srt):
    # Get tiingo (https://api.tiingo.com/) prices

    log('Start Date: ' + srt)

    global completed

    extracted = []

    threads = []
    lock = threading.Lock()

    completed = 0
    print(f'   ({completed}/{len(sym)})          ', end = '\r')
    def tiingler(chunk):
        global completed

        previewed = []
        priced = []
        previous = 0

        for symbol in chunk:
            main = symbol.replace('USD', '')
            data = requests.get(f'{url[0]}{symbol}{url[1]}{srt}{url[2]}', headers = tiingo).json()

            table = data[0]['priceData'] if opt == 2 else data

            preview = []
            prices = {}
            last = 0

            try:
                if srt != '1800-01-01':
                    if day:
                        prices = kv_get('daily', main)
                        last = list(prices.values())[-1]['close']
                    else:
                        prices = kv_get('intra', main)
                        last = list(prices.values())[-1]['close']

                previous += len(json.dumps(prices).encode('utf-8'))
            except:
                prices = {}
                last = 0

                log('Discarded starting value...')

            for row in table:
                price = []
                match opt:
                    case 0:
                        price = [row['adjClose'], row['adjOpen'], row['adjHigh'], row['adjLow'], row['adjVolume'], row['divCash'], row['splitFactor']]
                    case 1:
                        price = [row['close'], row['open'], row['high'], row['low'], 0, 0.0, 1.0]
                    case 2:
                        price = [row['close'], row['open'], row['high'], row['low'], row['volume'], 0.0, 1.0]
                    case 3:
                        price = [row['close'], row['open'], row['high'], row['low'], row['volume'], 0.0, 1.0]

                change = 0
                percent = 0
                if last != 0:
                    change = price[0] - last
                    percent = change / last * 100
                last = price[0]

                date = ''
                if day:
                    date = row['date'].split('T')[0]
                elif opt == 2:
                    date = parse_date(2, row['date'])
                else:
                    date = parse_date(1, row['date'])

                preview.append(round(price[0], 3))
                prices[date] = {
                    'close': round(price[0], 3),
                    'open': round(price[1], 3),
                    'high': round(price[2], 3),
                    'low': round(price[3], 3),
                    'volume': round(price[4], 3),
                    'change': round(change, 3),
                    'percent': round(percent, 3),
                    'dividend': round(price[5], 3),
                    'split': round(price[6], 3)
                }

            for key in prices.keys():
                preview.append(prices[key]['close'])

            previewed.append({'key': main, 'value': json.dumps(preview[-30:])})
            priced.append({'key': main, 'value': json.dumps(prices)})

            with lock:
                completed += 1
                log(f'(Requested {completed}/{len(sym)}) ({main})', False)
                print(f'   (Requested {completed}/{len(sym)}) ({main})          ', end = '\r')
                
        log(f"Data packed (Pre: {round(len(json.dumps(previewed).encode('utf-8')) / 1000, 1)}K) (Pri: {round(len(json.dumps(priced).encode('utf-8')) / 1000000, 1)}M) (New: {round((len(json.dumps(priced).encode('utf-8')) - previous) / 1000000, 1)}M)...")

        with lock:
            extracted.append([round((len(json.dumps(previewed).encode('utf-8')) + len(json.dumps(priced).encode('utf-8'))) / 1000000, 1), previewed, priced])

    chunks = list(calc_chunks(sym, 20))

    for chunk in chunks:
        threads.append(threading.Thread(target = tiingler, args = (chunk,)))

    for thread in threads:
        thread.start()

    for thread in threads:
        thread.join()

    for job in extracted:
        if (day):
            kv_put('preview', job[1])
            kv_put('daily', job[2])
        else:
            kv_put('intra', job[2])

        log(f"Packet uploaded ({job[0]}M)...")

def get_tiingo_daily():
    # Get tiingo (https://api.tiingo.com/) prices

    log('[CRYPTO/FOREX/NASDAQ/NYSE/BATS: Started]')

    start = kv_get('index', 'DATE-DAILY', False)

    log('Retrieving stock prices...')
    url = ['https://api.tiingo.com/tiingo/daily/', '/prices?startDate=', '&columns=adjOpen,adjHigh,adjLow,adjClose,adjVolume,divCash,splitFactor']
    array = kv_get('index', 'RETRIEVE')['STOCK']
    get_tiingo_prices(url, array, True, 0, start)

    log('Retrieving forex prices...')
    url = ['https://api.tiingo.com/tiingo/fx/prices?tickers=', '&startDate=', '&resampleFreq=1day']
    array = ["EURUSD", "USDJPY", "GBPUSD", "USDCAD", "USDSEK", "USDCHF"]
    get_tiingo_prices(url, array, True, 1, start)

    log('Retrieving crypto prices...')
    srt = start if start != '1800-01-01' else daysago(12 * 365)
    url = ['https://api.tiingo.com/tiingo/crypto/prices?tickers=', '&startDate=', '&resampleFreq=1day']
    array = ["BTCUSD", "ETHUSD", "BNBUSD", "XRPUSD", "ADAUSD", "DOGEUSD", "MATICUSD", "DOTUSD", "TRXUSD", "LTCUSD", "AVAXUSD", "ATOMUSD", "XMRUSD", "RVNUSD"]
    get_tiingo_prices(url, array, True, 2, srt)

    log(f'New Date: ' + daysago(1))
    kv_put('index', [{'key': 'DATE-DAILY', 'value': daysago(1)}])

    log('[CRYPTO/FOREX/NASDAQ/NYSE/BATS: Finished]')

def get_tiingo_intra():
    # Get tiingo (https://api.tiingo.com/) prices

    log('[CRYPTO/FOREX/NASDAQ/NYSE/BATS: Started]')

    start = kv_get('index', 'DATE-INTRA', False)

    log('Retrieving stock prices...')
    url = ['https://api.tiingo.com/iex/', '/prices?startDate=', '&resampleFreq=5min&columns=open,high,low,close,volume']
    array = kv_get('index', 'RETRIEVE')['STOCK']
    get_tiingo_prices(url, array, False, 3, start)

    log('Retrieving forex prices...')
    srt = start if start != '1800-01-01' else daysago(30)
    url = ['https://api.tiingo.com/tiingo/fx/prices?tickers=', '&startDate=', '&resampleFreq=5min']
    array = ["EURUSD", "USDJPY", "GBPUSD", "USDCAD", "USDSEK", "USDCHF"]
    get_tiingo_prices(url, array, False, 1, srt)

    log('Retrieving crypto prices...')
    srt = start if start != '1800-01-01' else daysago(15)
    url = ['https://api.tiingo.com/tiingo/crypto/prices?tickers=', '&startDate=', '&resampleFreq=5min']
    array = ["BTCUSD", "ETHUSD", "BNBUSD", "XRPUSD", "ADAUSD", "DOGEUSD", "MATICUSD", "DOTUSD", "TRXUSD", "LTCUSD", "AVAXUSD", "ATOMUSD", "XMRUSD", "RVNUSD"]
    get_tiingo_prices(url, array, False, 2, srt)

    log(f'New Date: ' + daysago(1))
    kv_put('index', [{'key': 'DATE-INTRA', 'value': daysago(1)}])

    log('[CRYPTO/FOREX/NASDAQ/NYSE/BATS: Finished]')

def get_metadata_fill():
    # Get metadata (https://api.tiingo.com/) prices

    log('[Priming Actions: Started]')
    log('Priming mode actived: Retrieving all required metadata...')
    log('This can be disabled within your environment (.env) file...')

    log('Scraping indices...')

    spx = parse_indices('https://www.slickcharts.com/sp500')
    ndx = parse_indices('https://www.slickcharts.com/nasdaq100')
    djia = parse_indices('https://www.slickcharts.com/dowjones')

    poors = []
    for each in spx:
        poors.append(each[2])

    daq = []
    for each in ndx:
        poors.append(each[2])

    jones = []
    for each in djia:
        poors.append(each[2])

    all = sorted(list(set(poors + daq + jones + ['EAF'])))

    values = []
    retrieve = {}
    search = {}

    log('Requesting metadata (stocks)...')

    global completed

    threads = []
    lock = threading.Lock()

    completed = 0
    print(f'   ({completed}/{len(all)})          ', end='\r')
    def metadata(chunk):
        global completed

        for symbol in chunk:
            data = requests.get('https://api.tiingo.com/tiingo/daily/' + symbol, headers = tiingo).json()
            
            value = {'name': data['name'], 'description': data['description'], 'exchange': data['exchangeCode'], 'joined': data['startDate'], 'intra': True}
            with lock:
                values.append({'key': symbol, 'value': json.dumps(value)})

            with lock:
                completed += 1
                log(f'(Requested {completed}/{len(all)})', False)
                print(f'   (Requested {completed}/{len(all)})          ', end = '\r')

    chunks = list(calc_chunks(all, 10))

    for chunk in chunks:
        threads.append(threading.Thread(target = metadata, args = (chunk,)))

    for thread in threads:
        time.sleep(0.1)
        thread.start()

    for thread in threads:
        thread.join()

    predefined = []
    for each in values:
        value = json.loads(each['value'])
        predefined.append([each['key'], value['name'], value['exchange'], value['description']])

    retrieve['STOCK'] = strip(predefined)
    search = strip(predefined, search)

    log('Requesting metadata (forex)...')

    predefined = [
        ['EUR', 'EUR/USD Forex', 'The European Central Bank', '[€]: The euro came into existence on 1 January 1999, although it had been a goal of the European Union (EU) and its predecessors since the 1960s. After tough negotiations, the Maastricht Treaty entered into force in 1993 with the goal of creating an economic and monetary union by 1999 for all EU states except the UK and Denmark (even though Denmark has a fixed exchange rate policy with the euro).'],
        ['JPY', 'USD/JPY Forex', 'Bank of Japan', '[¥]: The yen (円) is the official currency of Japan. It is the third-most traded currency in the foreign exchange market, after the United States dollar and the euro. It is also widely used as a third reserve currency after the US dollar and the euro.'],
        ['GBP', 'GBP/USD Forex', 'The Bank of England', '[£]: Sterling is the currency of the United Kingdom and nine of its associated territories. The pound is the main unit of sterling, and the word "pound" is also used to refer to the British currency generally, often qualified in international contexts as the British pound or the pound sterling. Sterling is the world\'s oldest currency that is still in use and that has been in continuous use since its inception. It is currently the fourth most-traded currency in the foreign exchange market, after the United States dollar, the euro, and the Japanese yen.'],
        ['CAD', 'USD/CAD Forex', 'The Bank of Canada', '[CA$]: In Canada during the period of French colonization, coins were introduced, as well as one of the first examples of paper currency by a western government. During the period of British colonization, additional coinage was introduced, as well as banknotes. The Canadian colonies gradually moved away from the British pound and adopted currencies linked to the United States dollar. With Confederation in 1867, the Canadian dollar was established. By the mid-20th century, the Bank of Canada was the sole issuer of paper currency, and banks ceased to issue banknotes.'],
        ['SEK', 'USD/SEK Forex', 'Swedish Central Bank', '[kr]: The krona is the official currency of Sweden. In English, the currency is sometimes referred to as the Swedish crown, as krona means "crown" in Swedish. The Swedish krona was the ninth-most traded currency in the world by value in April 2016.'],
        ['CHF', 'USD/CHF Forex', 'The Swiss National Bank', '[₣]: The Swiss franc is the currency and legal tender of Switzerland and Liechtenstein. It is also legal tender in the Italian exclave of Campione d\'Italia which is surrounded by Swiss territory. The Swiss National Bank (SNB) issues banknotes and the federal mint Swissmint issues coins.']
    ]

    retrieve['FOREX'] = strip(predefined)
    search = strip(predefined, search)

    completed = 0
    print(f'   ({completed}/{len(predefined)})          ', end = '\r')
    for each in predefined:
        value = {'name': each[1], 'description': each[3], 'exchange': each[2], 'joined': '2000-01-01', 'intra': True}
        values.append({'key': each[0].replace('USD', ''), 'value': json.dumps(value)})

        completed += 1
        log(f'({completed}/{len(predefined)})', False)
        print(f'   ({completed}/{len(predefined)})          ', end = '\r')

    log('Requesting metadata (crypto)...')

    predefined = [
        ['BTC', 'Bitcoin', 'Bitcoin was created in 2009 by a person or group of people using the pseudonym Satoshi Nakamoto, the name which appeared on the original 2008 Bitcoin white paper that first described the blockchain system that would serve as the backbone of the entire cryptocurrency market.'],
        ['ETH', 'Ethereum', 'Ethereum was initially described in late 2013 in a white paper by Vitalik Buterin, a programmer and co-founder of Bitcoin Magazine, that described a way to build decentralized applications.'],
        ['BNB', 'Binance Coin', 'Binance Coin was created in July 2017 and initially worked on the ethereum blockchain with the token ERC-20 before it became the native currency of Binance\'s own blockchain, the Binance Chain.'],
        ['XRP', 'Ripple', 'The XRP Ledger first launched in June 2012. Shortly thereafter, they were joined by Chris Larsen, and the group started the Company NewCoin in September 2012 (quickly renamed OpenCoin and now named Ripple). The XRPL founders gifted 80 billion XRP, the platform\'s native currency, to the company.'],
        ['ADA', 'Cardano', 'Cardano is a public blockchain platform. It is open-source and decentralized, with consensus achieved using proof of stake. It can facilitate peer-to-peer transactions with its internal cryptocurrency, ADA. Cardano\'s development began in 2015, led by Ethereum co-founder Charles Hoskinson.'],
        ['DOGE', 'Dogecoin', 'The Dogecoin (DOGE) was launched in December 2013 by two software engineers (Jackson Palmer and Billy Markus), who created the payment system as a sarcastic meme coin (a type of cryptocurrency that originated from an online meme or viral image).'],
        ['MATIC', 'Polygon', 'Polygon was created in India in 2017 and was originally called the Matic Network. It was the brainchild of experienced Ethereum developers—Jaynti Kanani, Sandeep Nailwal, and Anurag Arjun, as well as Mihailo Bjelic.'],
        ['DOT', 'Polkadot', 'Polkadot is the brainchild of Dr. Gavin Wood, who is one of the co-founders of Ethereum and the inventor of the Solidity smart contract language. Dr. Wood started working on his idea to “design a sharded version of Ethereum” in mid-2016 and released the first draft of the Polkadot white paper in Oct.'],
        ['TRX', 'Tron', 'Tron was established in March 2014 by Justin Sun and since 2017 has been overseen and supervised by the TRON Foundation, a non-profit organization in Singapore, established in the same year. It was originally an Ethereum-based ERC-20 token, which switched its protocol to its own blockchain in 2018.'],
        ['LTC', 'Litecoin', 'Litecoin is a decentralized peer-to-peer cryptocurrency and open-source software project released under the MIT/X11 license. Inspired by Bitcoin, Litecoin was among the earliest altcoins, starting in October 2011.'],
        ['AVAX', 'Avalanche', 'Avalanche was first conceptualized and shared on InterPlanetary File System (aka IPFS) in May 2018 by a pseudonymous group of enthusiasts named "Team Rocket." Later it was developed by a dedicated team of researchers from Cornell University.'],
        ['ATOM', 'Cosmos', 'Cosmos is a network of sovereign blockchains that communicate via IBC, an interoperability protocol modeled after TCP/IP, for secure data and value transfer. The Cosmos Hub, also known as "Gaia," is a proof of stake chain with a native token, ATOM, that serves as a hub for IBC packet routing among blockchains within the Cosmos network. The Cosmos Hub, like the majority of blockchains in the Cosmos network, is secured by the Byzantine Fault-Tolerant (BFT) Proof-of-Stake consensus algorithm, Tendermint.'],
        ['XMR', 'Monero', 'Monero (XMR) is a decentralized digital currency. Users can trade Monero securely and at a low cost for goods, services, and other cryptocurrencies. The price of Monero rises when demand exceeds supply and falls when supply exceeds demand. Besides this, Monero provides users with the privacy and anonymity of their transactions. Monero is untraceable since every transaction is private.'],
        ['RVN', 'Ravencoin', 'Ravencoin was launched on the ninth anniversary of the launch of Bitcoin, which was on January 3, 2018. However, the announcement for Ravencoin was made on October 31, 2017. There was no ICO or pre-mine, and no coins were reserved for founders\' or developers\' rewards.']
    ]

    retrieve['CRYPTO'] = strip(predefined)
    search = strip(predefined, search)

    completed = 0
    print(f'   ({completed}/{len(predefined)})          ', end = '\r')
    for each in predefined:
        value = {'name': each[1], 'description': each[2], 'exchange': 'Tiingo', 'joined': '2000-01-01', 'intra': True}
        values.append({'key': each[0].replace('USD', ''), 'value': json.dumps(value)})

        completed += 1
        log(f'({completed}/{len(predefined)})', False)
        print(f'   ({completed}/{len(predefined)})          ', end = '\r')

    log('Requesting metadata (metals)...')

    predefined = [
        ['GC-F', 'Gold Futures', 'COMEX', True, '[Au⁹⁷]: Gold was generally used for a couple thousand years solely to create things such as jewelry and idols for worship. This was until around 1500 BC when the ancient empire of Egypt, which benefited greatly from its gold-bearing region, Nubia, made gold the first official medium of exchange for international trade. Today gold can be used more practically in important electronics as a conductor that does not easily corrode.'],
        ['SI-F', 'Silver Futures', 'COMEX', True, '[Ag¹⁰⁸]: Silver  is used for jewellery and tableware, where appearance is important. Silver is used to make mirrors, as it is the best reflector of visible light known, although it does tarnish with time. It is also used in dental alloys, solder and brazing alloys, electrical contacts and batteries. Silver paints are used for making printed circuits. Silver bromide and iodide were important in the history of photography, because of their sensitivity to light.'],
        ['PL-F', 'Platinum Futures', 'NYMEX', True, '[Pt⁷⁸]: First discovered in Colombia, platinum was eventually found in Russia\'s Ural Mountains and became more available than ever being used only as jewelry at the time. Since the early 1900s, scientists had discovered different uses for platinum, including catalytic converters in vehicle engines, dental work, computers, pacemakers, and chemotherapy. Platinum was first used as currency in Russia when coins were minted in the late 1820s.'],
        ['PA-F', 'Palladium Futures', 'NYMEX', True, '[Pd⁴⁶]: Palladium is one of a number of metals starting to be used in the fuel cells to power a host of things including cars and buses. Palladium is also widely used in catalytic reactions in industry, such as in hydrogenation of unsaturated hydrocarbons, as well as in jewellery and in dental fillings and crowns.'],
        ['ALI-F', 'Aluminium Futures', 'COMEX', True, '[Al¹³]: The history of aluminium was shaped by the usage of its compound alum. The first written record of alum was in the 5th century BCE by Greek historian Herodotus. The ancients used it as a dyeing mordant, in medicine, in chemical milling, and as a fire-resistant coating for wood to protect fortresses from enemy arson. Nowadays aluminium is used everywhere from powerlines and high-rise building to spacecraft and motor vehicles as it is light, durable, and inexpensive.'],
        ['HG-F', 'Copper Futures', 'COMEX', True, '[Cu²⁵]:  Copper was probably the first metal used by ancient cultures, and the oldest artefacts made with it date to the Neolithic period. The shiny red-brown metal was used for jewellery, tools, sculpture, bells, vessels, lamps, amulets, and death masks, amongst other things. Modern uses of the conductive copper include electrical wire, musical instruments, plumbing, tableware, electric motors, and jewelry.'],
        ['LICO-F', 'Lithium Carbonate Futures', 'SHFE', False, '[Li₂CO₃]: Lithium Carbonate is a versatile and demanded alloy for its medical and electrical properties. In 1843, lithium carbonate was used to treat stones in the bladder. In 1859, some doctors recommended a therapy with lithium salts for a number of ailments, including gout, urinary calculi, rheumatism, mania, depression, and headache. In 1948, John Cade discovered the anti-manic effects of lithium ions. However, more recently we have used this alloy to power our many portable electronic devices from your smart phone to your new electric car. With the significant prospects of electric vehicles in the future and the scarcity of lithium carbonate, this material has skyrocketed in price in recent times.']
    ]

    retrieve['METALS'] = strip(predefined)
    search = strip(predefined, search)

    completed = 0
    print(f'   ({completed}/{len(predefined)})          ', end = '\r')
    for each in predefined:
        value = {'name': each[1], 'description': each[4], 'exchange': each[2], 'joined': '2000-01-01', 'intra': each[3]}
        values.append({'key': each[0], 'value': json.dumps(value)})

        completed += 1
        log(f'({completed}/{len(predefined)})', False)
        print(f'   ({completed}/{len(predefined)})          ', end = '\r')

    log('Requesting metadata (energy)...')

    predefined = [
        ['CL-F', 'WTI Crude Oil Futures', 'West Texas Intermediate (WTI) crude oil is a specific grade of crude oil and one of the main three benchmarks in oil pricing, along with Brent and Dubai Crude. WTI is known as a light sweet oil because it contains between 0.24%% and 0.34%% sulfur, making it "sweet," and has a low density (specific gravity), making it "light." This oil is extracted in the Texas, Oklahoma, and North Dakota states of America.'],
        ['BZ-F', 'Brent Crude Oil Futures', 'Brent Crude is more ubiquitous, and most oil is priced using Brent Crude as the benchmark, akin to two-thirds of all oil pricing. Brent Crude is produced near the sea, so transportation costs are significantly lower. In contrast, West Texas Intermediate is produced in landlocked areas, making transportation costs more onerous. The Organization of the Petroleum Exporting Countries (OPEC) controls most of the oil production and distribution, often dictating costs for not only oil suppliers but countries as well. Most nations factor oil prices into their budgets, so OPEC has been considered a leading geopolitical force.'],
        ['RB-F', 'RBOB Gasoline Futures', '"Reformulated Gasoline Blendstock for Oxygenate Blending" (RBOB) is motor gasoline blending components intended for blending with oxygenates to produce finished reformulated gasoline. RB (CME Group) supplies 30%% of the US market with gasoline.'],
        ['HO-F', 'Heating Oil Futures', 'Heating oil is mainly used for space heating. Some homes and residential commercial buildings also use heating oil to heat water but in much smaller amounts than what they use for space heating. Because cold weather affects heating demand, most heating oil use occurs during the heating season—October through March according to the EIA.'],
        ['NG-F', 'Natural Gas Futures', 'Compared to other similar fossil fuels, natural gas is much cleaning producing 60%% less carbon dioxide than coal counterparts and 30%% less in power plants that use oil derivatives. Natural gas is versatile being used as a fuel for process heating, in combined heat and power systems, as a raw material (feedstock) to produce chemicals, fertilizer, and hydrogen, as lease and plant fuel, space heating, water heating, outdoor lighting, and in highly efficient motor vehicles.']
    ]

    retrieve['ENERGY'] = strip(predefined)
    search = strip(predefined, search)

    completed = 0
    print(f'   ({completed}/{len(predefined)})          ', end = '\r')
    for each in predefined:
        value = {'name': each[1], 'description': each[2], 'exchange': 'NYMEX', 'joined': '2000-01-01', 'access': True}
        values.append({'key': each[0], 'value': json.dumps(value)})

        completed += 1
        log(f'({completed}/{len(predefined)})', False)
        print(f'   ({completed}/{len(predefined)})          ', end = '\r')

    log('Uploading to Cloudflare...')

    kv_put('meta', values)

    kv_put('index', [{'key': 'RETRIEVE', 'value': json.dumps(retrieve)}])
    kv_put('index', [{'key': 'SEARCH', 'value': json.dumps(search)}])

    log('[Priming Actions: Finished]')

log('[Starting log]: ' + time.strftime(f'%Y-%m-%dT%H:%M:%S.000Z'))
log('[Current Date]: ' + daysago(0))

try:
    if int(time.strftime('%w')) != 0 and int(time.strftime('%w')) != 6: # Business Days
        if int(time.strftime('%H%M')) > 855 and int(time.strftime('%H%M')) < 905: # About 9:00am
            get_index_contituents()
            get_yahoo_daily_prices()
            get_investing_prices()
            get_tiingo_daily()

        if int(time.strftime('%H%M')) > 925 and int(time.strftime('%H%M')) < 1605: # Between About 9:30am and 4:00pm
            get_index_prices()
            get_yahoo_intra_prices()
            get_tiingo_intra()

    if os.getenv('prime') == 'true': # If prime (.env) is true
        get_metadata_fill()

except Exception as error:
    log('[ERROR!]: ' + traceback.format_exc())

logger_end()
