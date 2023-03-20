from bs4 import BeautifulSoup as beautiful
import cloudscraper

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
            index = columns[0].text.strip().replace('SPY', 'spx').replace('QQQ', 'ndx').replace('DIA', 'djia')
            etf = columns[1].text.strip()
            value = columns[2].text.strip().replace('\xa0\xa0', '').replace(',', '').replace('*', '')
            change = columns[3].text.strip()
            percent = columns[4].text.strip('(%)')

            rows.append([index, value, change, percent])

    return rows
