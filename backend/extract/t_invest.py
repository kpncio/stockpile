from bs4 import BeautifulSoup as beautiful
import cloudscraper
import json

import m_cloudflare
import m_utilities

def get_investing_prices():
    # Get future (https://www.investing.com/) prices

    m_utilities.log('[SHFE Futures: Started]')

    m_utilities.log('Requesting/scraping SHFE prices...')

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

    m_utilities.log('Uploading to Cloudflare...')

    preview = preview[::-1]
    prices = dict(reversed(list(prices.items())))

    m_cloudflare.kv_put('preview', [{'key': 'LICO-F', 'value': json.dumps(preview[-30:])}])
    m_cloudflare.kv_put('daily', [{'key': 'LICO-F', 'value': json.dumps(prices)}])

    m_utilities.log('[SHFE Futures: Finished]')
