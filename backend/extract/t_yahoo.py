import yfinance
import json

import m_cloudflare
import m_utilities

def get_yahoo_intra_prices():
    # Get future (https://finance.yahoo.com/) prices

    m_utilities.log('[COMEX/NYMEX Futures (Intra): Started]')

    m_utilities.log('Requesting/scraping COMEX/NYMEX prices...')

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
            
            prices[m_utilities.parse_date(0, str(index))] = {
                'close': round(rows.Close, 3), 'open': round(rows.Open, 3),
                'high': round(rows.High, 3), 'low': round(rows.Low, 3),
                'volume': round(rows.Volume, 3), 'change': round(change, 3),
                'percent': round(percent, 3), 'dividend': 0.0, 'split': 1.0
            }

        m_cloudflare.kv_put('intra', [{'key': symbol, 'value': json.dumps(prices)}])

        completed += 1
        m_utilities.log(f'(Processing {completed}/{len(symbols)})', False)
        print(f'   (Processing {completed}/{len(symbols)})          ', end = '\r')

    m_utilities.log('[COMEX/NYMEX Futures: Finished]')

def get_yahoo_daily_prices():
    # Get future (https://finance.yahoo.com/) prices

    m_utilities.log('[COMEX/NYMEX Futures (Daily): Started]')

    m_utilities.log('Requesting/scraping COMEX/NYMEX prices...')

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

        m_cloudflare.kv_put('preview', [{'key': symbol, 'value': json.dumps(preview[-30:])}])
        m_cloudflare.kv_put('daily', [{'key': symbol, 'value': json.dumps(prices)}])

        completed += 1
        m_utilities.log(f'(Processing {completed}/{len(symbols)})', False)
        print(f'   (Processing {completed}/{len(symbols)})          ', end = '\r')

    m_utilities.log('[COMEX/NYMEX Futures: Finished]')
