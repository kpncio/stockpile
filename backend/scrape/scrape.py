# Expects: Cron "*/10 * * * *" and Cron "0 9 * * *":
# https://app.kpnc.io/trader/scrape/

from bs4 import BeautifulSoup as beautiful
from dotenv import load_dotenv
import mysql.connector
import cloudscraper
import threading
import requests
import json
import time
import os

load_dotenv()

tiingo = {
    'Content-Type': 'application/json',
    'Authorization' : 'Token ' + os.getenv('tiingo_api')
}

cloudflare = {
    "Content-Type": "application/json",
    "X-Auth-Email": os.getenv('cf_email'),
    "X-Auth-Key": os.getenv('cf_api_key')
}

def log(text, show=True):
    if show:
        print(text)

def chunks(l, n):
    for i in range(0, len(l), n):
        yield l[i:i + n]

def parse(url):
    scraper = cloudscraper.create_scraper()
    data = scraper.get(url).text
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

def index():
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

def dixie(eurusd, usdjpy, gbpusd, usdcad, usdsek, usdchf):
    return round(50.14348112 * (eurusd ** -0.576) * (usdjpy ** 0.136) * (gbpusd ** -0.119) * (usdcad ** 0.091) * (usdsek ** 0.042) * (usdchf ** 0.036), 3)

# Get index information (Cron: Business days)
if int(time.strftime('%w')) != 0 and int(time.strftime('%w')) != 6:
    # Get index constituents (Cron: Every 9:00am)
    if int(time.strftime('%H%M')) > 855 and int(time.strftime('%H%M')) < 905:
        log('Connecting to Cloudflare and MySQL...\n')

        db = mysql.connector.connect(
            host=os.getenv('db_host'),
            user=os.getenv('db_user'),
            password=os.getenv('db_pass'),
            database='trader'
        )
        db.autocommit = True
        cursor = db.cursor()

        log('Scraping indices...\n')

        indices = {
            'spx': parse('https://www.slickcharts.com/sp500'),
            'ndx': parse('https://www.slickcharts.com/nasdaq100'),
            'djia': parse('https://www.slickcharts.com/dowjones')
        }

        url = f"https://api.cloudflare.com/client/v4/accounts/{os.getenv('cf_account')}/storage/kv/namespaces/{os.getenv('cf_kv_index')}/bulk"

        for each in indices:
            rows = {}
            table = []

            log("Parsing index chart\n")

            for row in indices[each]:
                key = row[2]
                value = {'rank': row[0], 'weight': row[3]}
                rows[key] = value
                table.append((row[0], row[2], row[3]))

            log("Uploading to Cloudflare and MySQL\n")

            requests.request("PUT", url, json=[{ "base64": False, "key": each, "value": json.dumps(rows) }], headers=cloudflare)
            cursor.execute(f'CREATE TABLE IF NOT EXISTS `index_{each}` (`rank` INT(4) NOT NULL , `symbol` VARCHAR(10) NOT NULL , `weight` FLOAT NOT NULL , INDEX (`rank`) , UNIQUE (`symbol`)) ENGINE = InnoDB;', '')
            cursor.execute(f'DELETE FROM `index_{each}`;', '')
            cursor.executemany(f'INSERT INTO `index_{each}` (`rank`, `symbol`, `weight`) VALUES (%s, %s, %s)', table)
        
        log("Closing connections\n")

        db.close()

    # Get index prices (Cron: 10 minutes between 9:30am and 4:00pm)
    if int(time.strftime('%H%M')) > 925 and int(time.strftime('%H%M')) < 1605:
        log('Connecting to Cloudflare and MySQL...\n')

        url = f"https://api.cloudflare.com/client/v4/accounts/{os.getenv('cf_account')}/storage/kv/namespaces/{os.getenv('cf_kv_index')}/bulk"
        db = mysql.connector.connect(
            host=os.getenv('db_host'),
            user=os.getenv('db_user'),
            password=os.getenv('db_pass'),
            database='trader'
        )
        db.autocommit = True
        cursor = db.cursor()

        log("Requesting/scraping index prices...\n")

        indices = index()
        btc = requests.get("https://api.tiingo.com/tiingo/crypto/prices?tickers=btcusd", headers=tiingo).json()
        btc = round(btc[0]['priceData'][-1]['close'], 2)
        forex = requests.get("https://api.tiingo.com/tiingo/fx/top?tickers=eurusd,usdjpy,gbpusd,usdcad,usdsek,usdchf", headers=tiingo).json()
        usdx = dixie(forex[0]['midPrice'], forex[1]['midPrice'], forex[2]['midPrice'], forex[3]['midPrice'], forex[4]['midPrice'], forex[5]['midPrice'])
        metals = requests.get("https://api.metals.live/v1/spot").json()
        gold = metals[0]['gold']

        log("Uploading to Cloudflare and MySQL\n")

        requests.request("PUT", url, json=[{ "base64": False, "key": "ROOT", "value": json.dumps({
            'SPX': indices[0][1],
            'NDX': indices[1][1],
            'DJIA': indices[2][1],
            'FOREX': json.dumps(usdx),
            'CRYPTO': json.dumps(btc),
            'METALS': gold
        }) }], headers=cloudflare)

        cursor.execute('CREATE TABLE IF NOT EXISTS `index` (`symbol` VARCHAR(10) NOT NULL , `value` FLOAT NOT NULL , UNIQUE (`symbol`)) ENGINE = InnoDB;', '')
        cursor.execute('DELETE FROM `index`;', '')
        cursor.executemany('INSERT INTO `index` (`symbol`, `value`) VALUES (%s, %s)', [
            ('SPX', indices[0][1]),
            ('NDX', indices[1][1]),
            ('DJIA', indices[2][1]),
            ('FOREX', usdx),
            ('CRYPTO', btc),
            ('METALS', gold)
        ])

        log("Closing connections\n")

        db.close()

# Backfilling metadata (Should run occationally) (Makes over 500 requests)...
if os.getenv('prime') == 'true':
    log('Priming mode actived. Metadata backfill will begin (over 500 calls).')
    log('This can be disabled within your environment (.env) file...\n')

    log('Connecting to Cloudflare and MySQL...\n')

    url = f"https://api.cloudflare.com/client/v4/accounts/{os.getenv('cf_account')}/storage/kv/namespaces/{os.getenv('cf_kv_meta')}/bulk"
    db = mysql.connector.connect(
        host=os.getenv('db_host'),
        user=os.getenv('db_user'),
        password=os.getenv('db_pass'),
        database='trader'
    )
    db.autocommit = True
    cursor = db.cursor()

    log('Scraping indices...\n')

    spx = parse('https://www.slickcharts.com/sp500')
    ndx = parse('https://www.slickcharts.com/nasdaq100')
    djia = parse('https://www.slickcharts.com/dowjones')

    poors = []
    for each in spx:
        poors.append(each[2])

    daq = []
    for each in ndx:
        poors.append(each[2])

    jones = []
    for each in djia:
        poors.append(each[2])

    all = sorted(list(set(poors + daq + jones)))

    values_cf = []
    values_db = []

    log('Requesting metadata (stocks)...\n')

    threads = []
    lock = threading.Lock()

    completed = 0
    print(f'({completed}/{len(all)})', end="\r")
    def metadata(chunk):
        global completed

        for symbol in chunk:
            data = requests.get("https://api.tiingo.com/tiingo/daily/" + symbol, headers=tiingo).json()
            
            value = {'name': data['name'], 'description': data['description'], 'exchange': data['exchangeCode'], 'joined': data['startDate']}
            with lock:
                values_cf.append({'key': symbol, 'value': json.dumps(value)})
                values_db.append((symbol, data['name'], data['description'], data['exchangeCode'], data['startDate']))

            with lock:
                completed += 1
                log(f'(Requested {completed}/{len(all)})', False)
                print(f'(Requested {completed}/{len(all)})', end="\r")

    chunked = list(chunks(all, 10))

    for chunk in chunked:
        threads.append(threading.Thread(target=metadata, args=(chunk,)))
    
    for thread in threads:
        time.sleep(0.1)
        thread.start()

    for thread in threads:
        thread.join()

    log('Requesting metadata (crypto)...\n')

    predefined = [
        ['BTC', 'Bitcoin'],
        ['ETH', 'Ethereum'],
        ['BNB', 'Binance Coin'],
        ['XRP', 'Ripple'],
        ['ADA', 'Cardano'],
        ['DOGE', 'Dogecoin'],
        ['MATIC', 'Polygon'],
        ['DOT', 'Polkadot'],
        ['TRX', 'Tron'],
        ['LTC', 'Litecoin'],
        ['AVAX', 'Avalanche'],
        ['ATOM', 'Cosmos'],
        ['XMR', 'Monero'],
        ['RVN', 'Ravencoin']
    ]

    completed = 0
    print(f'({completed}/{len(predefined)})', end="\r")
    for symbol in predefined:
        value = {'name': symbol[1], 'description': f'Multi-exchange tether ({symbol[0]}/USD)', 'exchange': 'Tiingo', 'joined': '2000-01-01'}
        values_cf.append({'key': symbol[0], 'value': json.dumps(value)})
        values_db.append((symbol[0], symbol[1], f'Multi-exchange tether ({symbol[0]}/USD)', 'Tiingo', '2000-01-01'))

        completed += 1
        log(f'({completed}/{len(predefined)})', False)
        print(f'({completed}/{len(predefined)})', end="\r")

    log("Uploading to Cloudflare and MySQL\n")

    requests.request("PUT", url, json=values_cf, headers=cloudflare)
    cursor.execute('CREATE TABLE  IF NOT EXISTS `metadata` (`symbol` VARCHAR(10) NOT NULL , `company` VARCHAR(100) NOT NULL , `description` TEXT NOT NULL , `exchange` VARCHAR(10) NOT NULL , `joined` DATE NOT NULL , UNIQUE (`symbol`)) ENGINE = InnoDB;', '')
    cursor.execute('DELETE FROM `metadata`;', '')
    cursor.executemany('INSERT INTO `metadata` (`symbol`, `company`, `description`, `exchange`, `joined`) VALUES (%s, %s, %s, %s, %s)', values_db)

    log("Closing connections\n")

    db.close()