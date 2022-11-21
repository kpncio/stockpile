# Expects: Cron "*/10 * * * *" and Cron "0 9 * * *":
# https://app.kpnc.io/trader/scrape/

from bs4 import BeautifulSoup as beautiful
from dotenv import load_dotenv
import mysql.connector
import cloudscraper
import requests
import json
import time
import os

load_dotenv()

def log(text):
    print(text)

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

tiingo = {
    'Content-Type': 'application/json',
    'Authorization' : 'Token ' + os.getenv('tiingo_api')
}

cloudflare = {
    "Content-Type": "application/json",
    "X-Auth-Email": os.getenv('cf_email'),
    "X-Auth-Key": os.getenv('cf_api_key')
}

if int(time.strftime('%w')) != 0 and int(time.strftime('%w')) != 6:
    if int(time.strftime('%H%M')) > 855 and int(time.strftime('%H%M')) < 905:
        db = mysql.connector.connect(
            host=os.getenv('db_host'),
            user=os.getenv('db_user'),
            password=os.getenv('db_pass'),
            database=os.getenv('db_name')
        )
        cursor = db.cursor()

        spx = parse('https://www.slickcharts.com/sp500')
        ndx = parse('https://www.slickcharts.com/nasdaq100')
        djia = parse('https://www.slickcharts.com/dowjones')

        url = f"https://api.cloudflare.com/client/v4/accounts/{os.getenv('cf_account')}/storage/kv/namespaces/{os.getenv('cf_kv_index')}/bulk"

        cursor.execute('DELETE FROM `index_spx`;', '')
        db.commit()
        cursor.execute('CREATE TABLE IF NOT EXISTS `index_spx` (`rank` INT(4) NOT NULL , `symbol` VARCHAR(10) NOT NULL , `weight` FLOAT NOT NULL , INDEX (`rank`) , UNIQUE (`symbol`)) ENGINE = InnoDB;', '')
        db.commit()

        cursor.execute('DELETE FROM `index_ndx`;', '')
        db.commit()
        cursor.execute('CREATE TABLE IF NOT EXISTS `index_ndx` (`rank` INT(4) NOT NULL , `symbol` VARCHAR(10) NOT NULL , `weight` FLOAT NOT NULL , INDEX (`rank`) , UNIQUE (`symbol`)) ENGINE = InnoDB;', '')
        db.commit()

        cursor.execute('DELETE FROM `index_djia`;', '')
        db.commit()
        cursor.execute('CREATE TABLE IF NOT EXISTS `index_djia` (`rank` INT(4) NOT NULL , `symbol` VARCHAR(10) NOT NULL , `weight` FLOAT NOT NULL , INDEX (`rank`) , UNIQUE (`symbol`)) ENGINE = InnoDB;', '')
        db.commit()

        rows = {}
        table = []
        for row in spx:
            key = row[2]
            value = {'rank': row[0], 'weight': row[3]}
            rows[key] = value
            table.append((row[0], row[2], row[3]))
        requests.request("PUT", url, json=[{ "base64": False, "key": "SPX", "value": json.dumps(rows) }], headers=cloudflare)
        cursor.executemany('INSERT INTO `index_spx` (`rank`, `symbol`, `weight`) VALUES (%s, %s, %s)', table)
        db.commit()

        rows = {}
        table = []
        for row in ndx:
            key = row[2]
            value = {'rank': row[0], 'weight': row[3]}
            rows[key] = value
            table.append((row[0], row[2], row[3]))
        requests.request("PUT", url, json=[{ "base64": False, "key": "NDX", "value": json.dumps(rows) }], headers=cloudflare)
        cursor.executemany('INSERT INTO `index_ndx` (`rank`, `symbol`, `weight`) VALUES (%s, %s, %s)', table)
        db.commit()

        rows = {}
        table = []
        for row in djia:
            key = row[2]
            value = {'rank': row[0], 'weight': row[3]}
            rows[key] = value
            table.append((row[0], row[2], row[3]))
        requests.request("PUT", url, json=[{ "base64": False, "key": "DJIA", "value": json.dumps(rows) }], headers=cloudflare)
        cursor.executemany('INSERT INTO `index_djia` (`rank`, `symbol`, `weight`) VALUES (%s, %s, %s)', table)
        db.commit()

        db.close()

    if int(time.strftime('%H%M')) > 925 and int(time.strftime('%H%M')) < 1605:
        db = mysql.connector.connect(
            host=os.getenv('db_host'),
            user=os.getenv('db_user'),
            password=os.getenv('db_pass'),
            database=os.getenv('db_name')
        )
        cursor = db.cursor()

        indices = index()
        btc = requests.get("https://api.tiingo.com/tiingo/crypto/prices?tickers=btcusd", headers=tiingo).json()
        btc = round(btc[0]['priceData'][-1]['close'], 2)
        forex = requests.get("https://api.tiingo.com/tiingo/fx/top?tickers=eurusd,usdjpy,gbpusd,usdcad,usdsek,usdchf", headers=tiingo).json()
        usdx = dixie(forex[0]['midPrice'], forex[1]['midPrice'], forex[2]['midPrice'], forex[3]['midPrice'], forex[4]['midPrice'], forex[5]['midPrice'])
        metals = requests.get("https://api.metals.live/v1/spot").json()
        gold = metals[0]['gold']

        values = {
            'SPX': indices[0][1],
            'NDX': indices[1][1],
            'DJIA': indices[2][1],
            'FOREX': json.dumps(usdx),
            'CRYPTO': json.dumps(btc),
            'METALS': gold
        }

        url = f"https://api.cloudflare.com/client/v4/accounts/{os.getenv('cf_account')}/storage/kv/namespaces/{os.getenv('cf_kv_index')}/bulk"
        requests.request("PUT", url, json=[{ "base64": False, "key": "ROOT", "value": json.dumps(values) }], headers=cloudflare)

        cursor.execute('DELETE FROM `index`;', '')
        db.commit()
        cursor.execute('CREATE TABLE IF NOT EXISTS `index` (`symbol` VARCHAR(10) NOT NULL , `value` FLOAT NOT NULL , UNIQUE (`symbol`)) ENGINE = InnoDB;', '')
        db.commit()
        cursor.executemany('INSERT INTO `index` (`symbol`, `value`) VALUES (%s, %s)', [
            ('SPX', indices[0][1]),
            ('NDX', indices[1][1]),
            ('DJIA', indices[2][1]),
            ('FOREX', usdx),
            ('CRYPTO', btc),
            ('METALS', gold)
        ])
        db.commit()

        db.close()

if os.getenv('prime'):
    # db = mysql.connector.connect(
    #     host=os.getenv('db_host'),
    #     user=os.getenv('db_user'),
    #     password=os.getenv('db_pass'),
    #     database=os.getenv('db_name')
    # )
    # cursor = db.cursor()

    log('Scraping active symbols...')

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

    log('Requesting metadata and company history...')
    # https://api.tiingo.com/tiingo/daily/<ticker>

    log('Requesting historic daily data...')
    # https://api.tiingo.com/tiingo/daily/<ticker>/prices?startDate=1800-01-01&columns=open,high,low,close,volume,divCash,splitFactor

    log('Requesting historic daily (adjusted) data...')
    # https://api.tiingo.com/tiingo/daily/<ticker>/prices?startDate=1800-01-01&columns=adjOpen,adjHigh,adjLow,adjClose,adjVolume,divCash,splitFactor

    log('Requesting historic intraday data (5min sampling)...')
    # https://api.tiingo.com/iex/<ticker>/prices?startDate=1800-01-01&resampleFreq=5min&columns=open,high,low,close,volume

    # db.close()