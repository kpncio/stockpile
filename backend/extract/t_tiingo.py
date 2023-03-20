import threading
import requests
import json

import m_cloudflare
import m_utilities
import m_headers

def get_tiingo_prices(url, sym, day, opt, srt):
    # Get tiingo (https://api.tiingo.com/) prices

    m_utilities.log('Start Date: ' + srt)

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
            data = requests.get(f'{url[0]}{symbol}{url[1]}{srt}{url[2]}', headers = m_headers.tiingo).json()

            table = data[0]['priceData'] if opt == 2 else data

            preview = []
            prices = {}
            last = 0

            try:
                if srt != '1800-01-01':
                    if day:
                        prices = m_cloudflare.kv_get('daily', main)
                        last = list(prices.values())[-1]['close']
                    else:
                        prices = m_cloudflare.kv_get('intra', main)
                        last = list(prices.values())[-1]['close']

                previous += len(json.dumps(prices).encode('utf-8'))
            except:
                prices = {}
                last = 0

                m_utilities.log('Discarded starting value...')

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
                    date = m_utilities.parse_date(2, row['date'])
                else:
                    date = m_utilities.parse_date(1, row['date'])

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
                m_utilities.log(f'(Requested {completed}/{len(sym)}) ({main})', False)
                print(f'   (Requested {completed}/{len(sym)}) ({main})          ', end = '\r')
                
        m_utilities.log(f"Data packed (Pre: {round(len(json.dumps(previewed).encode('utf-8')) / 1000, 1)}K) (Pri: {round(len(json.dumps(priced).encode('utf-8')) / 1000000, 1)}M) (New: {round((len(json.dumps(priced).encode('utf-8')) - previous) / 1000000, 1)}M)...")

        with lock:
            extracted.append([round((len(json.dumps(previewed).encode('utf-8')) + len(json.dumps(priced).encode('utf-8'))) / 1000000, 1), previewed, priced])

    chunks = list(m_utilities.calc_chunks(sym, 20))

    for chunk in chunks:
        threads.append(threading.Thread(target = tiingler, args = (chunk,)))

    for thread in threads:
        thread.start()

    for thread in threads:
        thread.join()

    for job in extracted:
        if (day):
            m_cloudflare.kv_put('preview', job[1])
            m_cloudflare.kv_put('daily', job[2])
        else:
            m_cloudflare.kv_put('intra', job[2])

        m_utilities.log(f"Packet uploaded ({job[0]}M)...")

def get_tiingo_daily():
    # Get tiingo (https://api.tiingo.com/) prices

    m_utilities.log('[CRYPTO/FOREX/NASDAQ/NYSE/BATS: Started]')

    start = m_cloudflare.kv_get('index', 'DATE-DAILY', False)

    m_utilities.log('Retrieving stock prices...')
    url = ['https://api.tiingo.com/tiingo/daily/', '/prices?startDate=', '&columns=adjOpen,adjHigh,adjLow,adjClose,adjVolume,divCash,splitFactor']
    array = m_cloudflare.kv_get('index', 'RETRIEVE')['STOCK']
    get_tiingo_prices(url, array, True, 0, start)

    m_utilities.log('Retrieving forex prices...')
    url = ['https://api.tiingo.com/tiingo/fx/prices?tickers=', '&startDate=', '&resampleFreq=1day']
    array = ["EURUSD", "USDJPY", "GBPUSD", "USDCAD", "USDSEK", "USDCHF", "AUDUSD", "USDBYN", "USDCNH", "USDCZK", "USDDKK", "DOLLARUSD", "USDHKD", "USDHUF", "USDMXN", "USDNOK", "NZDUSD", "USDPLN", "USDSGD", "USDTRY", "XAGUSD", "XAUUSD", "XPDUSD", "XPTUSD", "USDZAR"]
    get_tiingo_prices(url, array, True, 1, start)

    m_utilities.log('Retrieving crypto prices...')
    srt = start if start != '1800-01-01' else m_utilities.daysago(12 * 365)
    url = ['https://api.tiingo.com/tiingo/crypto/prices?tickers=', '&startDate=', '&resampleFreq=1day']
    array = ["BTCUSD", "ETHUSD", "BNBUSD", "XRPUSD", "ADAUSD", "DOGEUSD", "MATICUSD", "DOTUSD", "TRXUSD", "LTCUSD", "AVAXUSD", "ATOMUSD", "XMRUSD", "RVNUSD"]
    get_tiingo_prices(url, array, True, 2, srt)

    m_utilities.log(f'New Date: ' + m_utilities.daysago(1))
    m_cloudflare.kv_put('index', [{'key': 'DATE-DAILY', 'value': m_utilities.daysago(1)}])

    m_utilities.log('[CRYPTO/FOREX/NASDAQ/NYSE/BATS: Finished]')

def get_tiingo_intra():
    # Get tiingo (https://api.tiingo.com/) prices

    m_utilities.log('[CRYPTO/FOREX/NASDAQ/NYSE/BATS: Started]')

    start = m_cloudflare.kv_get('index', 'DATE-INTRA', False)

    m_utilities.log('Retrieving stock prices...')
    url = ['https://api.tiingo.com/iex/', '/prices?startDate=', '&resampleFreq=5min&columns=open,high,low,close,volume']
    array = m_cloudflare.kv_get('index', 'RETRIEVE')['STOCK']
    get_tiingo_prices(url, array, False, 3, start)

    m_utilities.log('Retrieving forex prices...')
    srt = start if start != '1800-01-01' else m_utilities.daysago(30)
    url = ['https://api.tiingo.com/tiingo/fx/prices?tickers=', '&startDate=', '&resampleFreq=5min']
    array = ["EURUSD", "USDJPY", "GBPUSD", "USDCAD", "USDSEK", "USDCHF", "AUDUSD", "USDBYN", "USDCNH", "USDCZK", "USDDKK", "DOLLARUSD", "USDHKD", "USDHUF", "USDMXN", "USDNOK", "NZDUSD", "USDPLN", "USDSGD", "USDTRY", "XAGUSD", "XAUUSD", "XPDUSD", "XPTUSD", "USDZAR"]
    get_tiingo_prices(url, array, False, 1, srt)

    m_utilities.log('Retrieving crypto prices...')
    srt = start if start != '1800-01-01' else m_utilities.daysago(15)
    url = ['https://api.tiingo.com/tiingo/crypto/prices?tickers=', '&startDate=', '&resampleFreq=5min']
    array = ["BTCUSD", "ETHUSD", "BNBUSD", "XRPUSD", "ADAUSD", "DOGEUSD", "MATICUSD", "DOTUSD", "TRXUSD", "LTCUSD", "AVAXUSD", "ATOMUSD", "XMRUSD", "RVNUSD"]
    get_tiingo_prices(url, array, False, 2, srt)

    m_utilities.log(f'New Date: ' + m_utilities.daysago(1))
    m_cloudflare.kv_put('index', [{'key': 'DATE-INTRA', 'value': m_utilities.daysago(1)}])

    m_utilities.log('[CRYPTO/FOREX/NASDAQ/NYSE/BATS: Finished]')