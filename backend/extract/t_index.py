import requests
import json

import m_cloudflare
import m_utilities
import m_headers
import t_slick

def get_index_contituents():
    # Get index (https://slickcharts.com/) constituents

    m_utilities.log('[Index Constituents: Started]')

    m_utilities.log('Scraping indices...')

    indices = {
        'SPX': t_slick.parse_indices('https://www.slickcharts.com/sp500'),
        'NDX': t_slick.parse_indices('https://www.slickcharts.com/nasdaq100'),
        'DJIA': t_slick.parse_indices('https://www.slickcharts.com/dowjones'),
        'FOREX': [
            ['1', 'EUR/USD Forex', 'EUR', '57.6', '-', '-', '-'],
            ['2', 'USD/JPY Forex', 'JPY', '13.6', '-', '-', '-'],
            ['3', 'GBP/USD Forex', 'GBP', '11.9', '-', '-', '-'],
            ['4', 'USD/CAD Forex', 'CAD', '9.1', '-', '-', '-'],
            ['5', 'USD/SEK Forex', 'SEK', '4.2', '-', '-', '-'],
            ['6', 'USD/CHF Forex', 'CHF', '3.6', '-', '-', '-'],
            ['7', 'AUD/USD Forex', 'AUD', '0', '-', '-', '-'],
            ['8', 'USD/BYN Forex', 'BYN', '0', '-', '-', '-'],
            ['9', 'USD/CNH Forex', 'CNH', '0', '-', '-', '-'],
            ['10', 'USD/CZK Forex', 'CZK', '0', '-', '-', '-'],
            ['11', 'USD/DKK Forex', 'DKK', '0', '-', '-', '-'],
            ['12', 'DOLLAR/USD Forex', 'DOLLAR', '0', '-', '-', '-'],
            ['13', 'USD/HKD Forex', 'HKD', '0', '-', '-', '-'],
            ['14', 'USD/HUF Forex', 'HUF', '0', '-', '-', '-'],
            ['15', 'USD/MXN Forex', 'MXN', '0', '-', '-', '-'],
            ['16', 'USD/NOK Forex', 'NOK', '0', '-', '-', '-'],
            ['17', 'NZD/USD Forex', 'NZD', '0', '-', '-', '-'],
            ['18', 'USD/PLN Forex', 'PLN', '0', '-', '-', '-'],
            ['19', 'USD/SGD Forex', 'SGD', '0', '-', '-', '-'],
            ['20', 'USD/TRY Forex', 'TRY', '0', '-', '-', '-'],
            ['21', 'XAG/USD Forex', 'XAG', '0', '-', '-', '-'],
            ['22', 'XAU/USD Forex', 'XAU', '0', '-', '-', '-'],
            ['23', 'XPD/USD Forex', 'XPD', '0', '-', '-', '-'],
            ['24', 'XPT/USD Forex', 'XPT', '0', '-', '-', '-'],
            ['25', 'USD/ZAR Forex', 'ZAR', '0', '-', '-', '-']
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

        m_utilities.log(f'Parsing {each}...')

        for row in indices[each]:
            key = row[2]
            value = {'rank': row[0], 'name': row[1], 'weight': row[3]}
            rows[key] = value
            table.append((row[0], row[2], row[1], row[3]))

        m_utilities.log(f'Uploading {each}...')

        m_cloudflare.kv_put('index', [{'key': each, 'value': json.dumps(rows)}])

    m_utilities.log('[Index Constituents: Finished]')

def get_index_prices():
    # Get index (https://slickcharts.com/ and https://api.tiingo.com/ and https://finance.yahoo.com/) prices

    m_utilities.log('[Index Prices: Started]')

    m_utilities.log('Requesting/scraping index prices...')

    indices = t_slick.parse_index()

    crypto = requests.get(f'https://api.tiingo.com/tiingo/crypto/prices?tickers=btcusd&startDate={m_utilities.daysago(5)}&resampleFreq=1day', headers = m_headers.tiingo).json()
    btc_price = round(crypto[0]['priceData'][-1]['close'], 2)
    btc_change = round(crypto[0]['priceData'][-2]['close'] - crypto[0]['priceData'][-1]['close'], 2)
    btc_percent = round((crypto[0]['priceData'][-2]['close'] - crypto[0]['priceData'][-1]['close']) / crypto[0]['priceData'][-1]['close'] * 100, 2)

    forex = requests.get(f'https://api.tiingo.com/tiingo/fx/prices?tickers=eurusd,usdjpy,gbpusd,usdcad,usdsek,usdchf&startDate={m_utilities.daysago(5)}&resampleFreq=1day', headers = m_headers.tiingo).json()
    usdx = {'eurusd': [], 'usdjpy': [], 'gbpusd': [], 'usdcad': [], 'usdsek': [], 'usdchf': []}
    for each in forex:
        usdx[each['ticker']].append(each['close'])
    usdx_price = m_utilities.calc_dixie(usdx['eurusd'][-1], usdx['usdjpy'][-1], usdx['gbpusd'][-1], usdx['usdcad'][-1], usdx['usdsek'][-1], usdx['usdchf'][-1])
    usdx_change = round(usdx_price - m_utilities.calc_dixie(usdx['eurusd'][-2], usdx['usdjpy'][-2], usdx['gbpusd'][-2], usdx['usdcad'][-2], usdx['usdsek'][-2], usdx['usdchf'][-2]), 2)
    usdx_percent = round(usdx_change / usdx_price * 100, 2)

    metals = requests.get('https://query1.finance.yahoo.com/v7/finance/quote?symbols=GC=F', headers = m_headers.yahoo).json()
    gold_price = round(metals['quoteResponse']['result'][0]['regularMarketPrice'], 2)
    gold_change = round(metals['quoteResponse']['result'][0]['regularMarketChange'], 2)
    gold_percent = round(metals['quoteResponse']['result'][0]['regularMarketChangePercent'], 2)

    brent = requests.get('https://query1.finance.yahoo.com/v7/finance/quote?symbols=BZ=F', headers = m_headers.yahoo).json()
    oil_price = round(brent['quoteResponse']['result'][0]['regularMarketPrice'], 3)
    oil_change = round(brent['quoteResponse']['result'][0]['regularMarketChange'], 3)
    oil_percent = round(brent['quoteResponse']['result'][0]['regularMarketChangePercent'], 3)

    stock = requests.get('https://api.tiingo.com/iex/?tickers=nvda,csx,eaf', headers = m_headers.tiingo).json()
    why = {}
    for each in stock:
        why[each['ticker']] = each['last']
    portfolio_price = round((why['NVDA'] * 70) + (why['CSX'] * 12) + (why['EAF'] * 29), 2)
    portfolio_change = round((why['NVDA'] * 70) + (why['CSX'] * 12) + (why['EAF'] * 29) - 10000, 2)
    portfolio_percent = round((((why['NVDA'] * 70) + (why['CSX'] * 12) + (why['EAF'] * 29) - 10000) / 10000) * 100, 2)

    m_utilities.log('Uploading to Cloudflare...')

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
    m_cloudflare.kv_put('index', jayson)

    m_utilities.log('[Index Prices: Finished]')
