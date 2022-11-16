import bs4 as beautiful
import requests
import pandas

def parse(url):
    data = requests.get(url).text
    soup = beautiful(data, "html.parser")
    table = soup.select_one("table:nth-of-type(1)")

    # Defining of the dataframe
    df = pd.DataFrame(columns=['Neighborhood', 'Zone', 'Area', 'Population', 'Density', 'Homes_count'])

    # Collecting Ddata
    for row in table.tbody.find_all('tr'):    
        # Find all data for each column
        columns = row.find_all('td')
        
        if(columns != []):
            index = columns[0]

            neighborhood = columns[0].text.strip()
            zone = columns[1].text.strip()
            area = columns[2].span.contents[0].strip('&0.')
            population = columns[3].span.contents[0].strip('&0.')
            density = columns[4].span.contents[0].strip('&0.')
            homes_count = columns[5].span.contents[0].strip('&0.')

            df = df.append({'Neighborhood': neighborhood,  'Zone': zone, 'Area': area, 'Population': population, 'Density': density, 'Homes_count': homes_count}, ignore_index=True)


parse("https://www.slickcharts.com/sp500")
parse("https://www.slickcharts.com/nasdaq100")
parse("https://www.slickcharts.com/dowjones")