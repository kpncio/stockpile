import requests
import time
import json
import os

import m_cloudflare
import m_utilities
import m_headers

def get_iex_prices():
    # Get iex (https://www.iexcloud.io/) prices (extra info)

    m_utilities.log('[NASDAQ/NYSE/BATS (IEX): Started]')

    url = f"https://cloud.iexapis.com/stable/stock/market/batch?token={os.getenv('iex_api')}&types=quote&symbols="
    array = m_cloudflare.kv_get('index', 'RETRIEVE')['STOCK']
    chunks = list(m_utilities.calc_chunks(array, 80))

    packet = []

    for chunk in chunks:
        print(f"{url}{','.join(chunk).replace('-', '.')}")

        data = requests.get(f"{url}{','.join(chunk).replace('-', '.')}", headers = m_headers.iex).json()

        for symbol in data:
            pack = {}

            pack['market'] = data[symbol]['quote']['marketCap'] if data[symbol]['quote']['marketCap'] else 0
            pack['ratio'] = round(data[symbol]['quote']['peRatio'] if data[symbol]['quote']['peRatio'] else 0, 4)
            pack['52high'] = round(data[symbol]['quote']['week52High'] if data[symbol]['quote']['week52High'] else 0, 4)
            pack['52low'] = round(data[symbol]['quote']['week52Low'] if data[symbol]['quote']['week52Low'] else 0, 4)
            pack['ytd'] = round(data[symbol]['quote']['ytdChange'] if data[symbol]['quote']['ytdChange'] else 0, 4)

            packet.append({'key': symbol.replace('.', '-'), 'value': json.dumps(pack)})

        m_utilities.log('Chunk completed...')
        time.sleep(1)

    m_utilities.log(f"Packed and Uploading ({round(len(json.dumps(packet).encode('utf-8')) / 1000, 1)}K)...")
    m_cloudflare.kv_put('extra', packet)

    m_utilities.log('[NASDAQ/NYSE/BATS (IEX): Finished]')
