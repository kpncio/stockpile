import threading
import requests
import json
import time

import m_cloudflare
import m_utilities
import m_headers
import t_slick

def get_metadata_fill():
    # Get metadata (https://api.tiingo.com/) prices

    m_utilities.log('[Priming Actions: Started]')
    m_utilities.log('Priming mode actived: Retrieving all required metadata...')
    m_utilities.log('This can be disabled within your environment (.env) file...')

    m_utilities.log('Scraping indices...')

    spx = t_slick.parse_indices('https://www.slickcharts.com/sp500')
    ndx = t_slick.parse_indices('https://www.slickcharts.com/nasdaq100')
    djia = t_slick.parse_indices('https://www.slickcharts.com/dowjones')

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

    m_utilities.log('Requesting metadata (stocks)...')

    global completed

    threads = []
    lock = threading.Lock()

    completed = 0
    print(f'   ({completed}/{len(all)})          ', end='\r')
    def metadata(chunk):
        global completed

        for symbol in chunk:
            data = requests.get('https://api.tiingo.com/tiingo/daily/' + symbol, headers = m_headers.tiingo).json()
            
            value = {'name': data['name'], 'description': data['description'], 'exchange': data['exchangeCode'], 'joined': data['startDate'], 'intra': True}
            with lock:
                values.append({'key': symbol, 'value': json.dumps(value)})

            with lock:
                completed += 1
                m_utilities.log(f'(Requested {completed}/{len(all)})', False)
                print(f'   (Requested {completed}/{len(all)})          ', end = '\r')

    chunks = list(m_utilities.calc_chunks(all, 10))

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

    retrieve['STOCK'] = m_utilities.strip(predefined)
    search = m_utilities.strip(predefined, search)

    m_utilities.log('Requesting metadata (forex)...')

    predefined = [
        ['EUR', 'EUR/USD Forex', '1984-02-24', '[€]: The euro came into existence on 1 January 1999, although it had been a goal of the European Union (EU) and its predecessors since the 1960s. After tough negotiations, the Maastricht Treaty entered into force in 1993 with the goal of creating an economic and monetary union by 1999 for all EU states except the UK and Denmark (even though Denmark has a fixed exchange rate policy with the euro).'],
        ['JPY', 'USD/JPY Forex', '1984-02-27', '[¥]: The yen (円) is the official currency of Japan. It is the third-most traded currency in the foreign exchange market, after the United States dollar and the euro. It is also widely used as a third reserve currency after the US dollar and the euro.'],
        ['GBP', 'GBP/USD Forex', '1984-02-27', '[£]: Sterling is the currency of the United Kingdom and nine of its associated territories. The pound is the main unit of sterling, and the word "pound" is also used to refer to the British currency generally, often qualified in international contexts as the British pound or the pound sterling. Sterling is the world\'s oldest currency that is still in use and that has been in continuous use since its inception. It is currently the fourth most-traded currency in the foreign exchange market, after the United States dollar, the euro, and the Japanese yen.'],
        ['CAD', 'USD/CAD Forex', '1984-02-24', '[CA$]: In Canada during the period of French colonization, coins were introduced, as well as one of the first examples of paper currency by a western government. During the period of British colonization, additional coinage was introduced, as well as banknotes. The Canadian colonies gradually moved away from the British pound and adopted currencies linked to the United States dollar. With Confederation in 1867, the Canadian dollar was established. By the mid-20th century, the Bank of Canada was the sole issuer of paper currency, and banks ceased to issue banknotes.'],
        ['SEK', 'USD/SEK Forex', '2019-01-24', '[Kr]: The krona is the official currency of Sweden. In English, the currency is sometimes referred to as the Swedish crown, as krona means "crown" in Swedish. The Swedish krona was the ninth-most traded currency in the world by value in April 2016.'],
        ['CHF', 'USD/CHF Forex', '1984-02-24', '[₣]: The Swiss franc is the currency and legal tender of Switzerland and Liechtenstein. It is also legal tender in the Italian exclave of Campione d\'Italia which is surrounded by Swiss territory. The Swiss National Bank (SNB) issues banknotes and the federal mint Swissmint issues coins.'],
        ['AUD', 'AUD/USD Forex', '0000-00-00', '[AU$]: The Australian dollar is the official currency of Australia, its external territories, and even three other sovern islands in the south east pacific ocean. It was the fifth most traded currency in 2016.'],
        ['BYN', 'USD/BYN Forex', '0000-00-00', '[Br]: Throughout the past three decades, Belarus has officially supported three different ruble currencies. These currencies include the BYB which exchanged for 10 Soviet Rubles, the BYR which exchanged for 1,000 BYB, and finally the BYN which is the current currency for Belarus and exchanged for 10,000 BYR.'],
        ['CNH', 'USD/CNH Forex', '0000-00-00', '[¥]: The Chinese yuan (CNY) or Renminbi (RMB) are the official currencies used within China; however, the Chinese currency that is used outside of China has a different value and market associated with it. For example: CNT (a derivative of Renminbi) is used when dealing with chinese currency Taiwan. Currenty Trader only has access to CNH (the currency used for unspecific offshore transactions like in Hong Kong, Indonesia, or the United Kingdom) and is usually quite close to the mainland currency (CNY).'],
        ['CZK', 'USD/CZK Forex', '0000-00-00', '[Kč]: The Czech koruna is the offical currency of the Czech Republic and is one of the European Union\'s eight currencies. The Czech Republic is legally bound to fully adopt the euro, but the target date has yet to be determinded.'],
        ['DKK', 'USD/DKK Forex', '0000-00-00', '[DKr]: The Danish krone is the official currency of Denmark, Greenland, and the Faroe Islands. Like other krone/krona/koruna terms, the term krone translates to crown and may be used when refering to it in english. The krone is attached to the euro and full adoption is favored by some major parties in the Denmark.'],
        ['DOLLAR', 'DOLLAR/USD Forex', '0000-00-00', '[Dollar Basket]: The US currency basket (DXY or USDX) is an index comprised of five major competing currencies including the Euro at 57.6%, Japanese yen at 13.6%, British pound at 11.9%, Canadian dollar at 9.1%, Swedish krona at 4.2%, and the Swiss franc at 3.6%. The US Dollar Index (or basket) started in 1973 with a base of 100, and values since then are realtive to this base.'],
        ['HKD', 'USD/HKD Forex', '0000-00-00', '[HK$]: The Hong Kond dollar is the official currency of the Hong Kong Special Administrative Region (like the Norvinsk Special Economic Zone in Russia). While Hong Kong is incredibly small in size, their economic power is known across the world with the Hong Kong dollar being the ninth most traded currency in the world.'],
        ['HUF', 'USD/HUF Forex', '0000-00-00', '[Ft]: The Hungarian forint is the official currency of Hungary and was created to stablize the post-World War II Hungarian Economy; however, while transitioning to a market economy the forint became very inflated in the 1980s and 1990s. The forint is currently stable and declared fully convertible.'],
        ['MXN', 'USD/MXN Forex', '0000-00-00', '[Mex$]: The Mexican peso is the offical currency of Mexico and shares a common origin with the dollar as they had both derived from the 16th-19th century Spanish Dollar. This is why both the Mexican peso and United States dollar officially use the $ and ¢ symbols while the Philippine peso uses the more sensible ₱ symbol.'],
        ['NOK', 'USD/NOK Forex', '0000-00-00', '[NKr]: The Norwegian krone (or crown) is the official curency of the Kingdom of Norway (inlcuding Svalbard). The currency can be subdivided into 100 øre; however, like similar countries, Norway has withdrawn the last coin denominated øre in 2012 as coinage like the US Penny are no longer economically viable.'],
        ['NZD', 'NZD/USD Forex', '0000-00-00', '[NZ$]: The New Zealand dollar is the official currency of New Zealand,its four dependent territories, and even one British overseas territory. Like the US dollar may be called a buck, the NZ dollar may be called a kiwi dollar as a kiwi (a flightless bird) is depicted on its one-dollar coin. The kiwi dollar is the tenth most traded currency in the world.'],
        ['PLN', 'USD/PLN Forex', '0000-00-00', '[zł]: The Polish złoty is the official currency of Poland and is the twenty-first most traded currency in the world. Złoty translates to golden and was introduced to replace the Polish marka after World War I and had seen redenomination in the 1990s changing from PLZ to PLN at a ratio of 10,000 old złoty for 1 new złoty.'],
        ['SGD', 'USD/SGD Forex', '0000-00-00', '[S$]: The Singapore dollar is the official currency of the Republic of Singapore and punches above its size like Hong Kong as it is the 13th most traded currency in the world.'],
        ['TRY', 'USD/TRY Forex', '0000-00-00', '[₺]: The Turkish lira is official curreny of both Turkey and Northern Cyprus. The Turkish lira followed the Ottoman lira after the fall of the Ottoman empire and saw a couple of renditions like other currencies and economies in the eastern european/asia minor area.'],
        ['XAG', 'XAG/USD Forex', '0000-00-00', '[Ag]: The exchange rate of silver to US dollars.'],
        ['XAU', 'XAU/USD Forex', '0000-00-00', '[Au]: The exchange rate of gold to US dollars.'],
        ['XPD', 'XPD/USD Forex', '0000-00-00', '[Pd]: The exchange rate of palladium to US dollars.'],
        ['XPT', 'XPT/USD Forex', '0000-00-00', '[Pt]: The exchange rate of platinum to US dolarrs.'],
        ['ZAR', 'USD/ZAR Forex', '0000-00-00', '[R]: The South African rand iis the official currency of the Southern African Common Monetary Area and includes South Africa, Nimibia, Lesotho, and Eswantini. The rand is used along side other CMA currencies including the Namibian dollar, Lesotho loti, and the Swazi lilangeni. Many lesser economies around South Africa also use the currency including Angola, Matawi, Zambia, and Zimbabwe.']
    ]

    retrieve['FOREX'] = m_utilities.strip(predefined)
    search = m_utilities.strip(predefined, search)

    completed = 0
    print(f'   ({completed}/{len(predefined)})          ', end = '\r')
    for each in predefined:
        value = {'name': each[1], 'description': each[3], 'exchange': 'TIINGO', 'joined': each[2], 'intra': True}
        values.append({'key': each[0].replace('USD', ''), 'value': json.dumps(value)})

        completed += 1
        m_utilities.log(f'({completed}/{len(predefined)})', False)
        print(f'   ({completed}/{len(predefined)})          ', end = '\r')

    m_utilities.log('Requesting metadata (crypto)...')

    predefined = [
        ['BTC', 'Bitcoin', '2011-08-19', 'Bitcoin was created in 2009 by a person or group of people using the pseudonym Satoshi Nakamoto, the name which appeared on the original 2008 Bitcoin white paper that first described the blockchain system that would serve as the backbone of the entire cryptocurrency market.'],
        ['ETH', 'Ethereum', '2015-08-08', 'Ethereum was initially described in late 2013 in a white paper by Vitalik Buterin, a programmer and co-founder of Bitcoin Magazine, that described a way to build decentralized applications.'],
        ['BNB', 'Binance Coin', '2021-08-03', 'Binance Coin was created in July 2017 and initially worked on the ethereum blockchain with the token ERC-20 before it became the native currency of Binance\'s own blockchain, the Binance Chain.'],
        ['XRP', 'Ripple', '2015-02-26', 'The XRP Ledger first launched in June 2012. Shortly thereafter, they were joined by Chris Larsen, and the group started the Company NewCoin in September 2012 (quickly renamed OpenCoin and now named Ripple). The XRPL founders gifted 80 billion XRP, the platform\'s native currency, to the company.'],
        ['ADA', 'Cardano', '2017-12-29', 'Cardano is a public blockchain platform. It is open-source and decentralized, with consensus achieved using proof of stake. It can facilitate peer-to-peer transactions with its internal cryptocurrency, ADA. Cardano\'s development began in 2015, led by Ethereum co-founder Charles Hoskinson.'],
        ['DOGE', 'Dogecoin', '2017-03-09', 'The Dogecoin (DOGE) was launched in December 2013 by two software engineers (Jackson Palmer and Billy Markus), who created the payment system as a sarcastic meme coin (a type of cryptocurrency that originated from an online meme or viral image).'],
        ['MATIC', 'Polygon', '2019-06-07', 'Polygon was created in India in 2017 and was originally called the Matic Network. It was the brainchild of experienced Ethereum developers—Jaynti Kanani, Sandeep Nailwal, and Anurag Arjun, as well as Mihailo Bjelic.'],
        ['DOT', 'Polkadot', '2017-03-09', 'Polkadot is the brainchild of Dr. Gavin Wood, who is one of the co-founders of Ethereum and the inventor of the Solidity smart contract language. Dr. Wood started working on his idea to “design a sharded version of Ethereum” in mid-2016 and released the first draft of the Polkadot white paper in Oct.'],
        ['TRX', 'Tron', '2017-10-07', 'Tron was established in March 2014 by Justin Sun and since 2017 has been overseen and supervised by the TRON Foundation, a non-profit organization in Singapore, established in the same year. It was originally an Ethereum-based ERC-20 token, which switched its protocol to its own blockchain in 2018.'],
        ['LTC', 'Litecoin', '2015-03-31', 'Litecoin is a decentralized peer-to-peer cryptocurrency and open-source software project released under the MIT/X11 license. Inspired by Bitcoin, Litecoin was among the earliest altcoins, starting in October 2011.'],
        ['AVAX', 'Avalanche', '2021-05-12', 'Avalanche was first conceptualized and shared on InterPlanetary File System (aka IPFS) in May 2018 by a pseudonymous group of enthusiasts named "Team Rocket." Later it was developed by a dedicated team of researchers from Cornell University.'],
        ['ATOM', 'Cosmos', '2019-06-07', 'Cosmos is a network of sovereign blockchains that communicate via IBC, an interoperability protocol modeled after TCP/IP, for secure data and value transfer. The Cosmos Hub, also known as "Gaia," is a proof of stake chain with a native token, ATOM, that serves as a hub for IBC packet routing among blockchains within the Cosmos network. The Cosmos Hub, like the majority of blockchains in the Cosmos network, is secured by the Byzantine Fault-Tolerant (BFT) Proof-of-Stake consensus algorithm, Tendermint.'],
        ['XMR', 'Monero', '2015-02-17', 'Monero (XMR) is a decentralized digital currency. Users can trade Monero securely and at a low cost for goods, services, and other cryptocurrencies. The price of Monero rises when demand exceeds supply and falls when supply exceeds demand. Besides this, Monero provides users with the privacy and anonymity of their transactions. Monero is untraceable since every transaction is private.'],
        ['RVN', 'Ravencoin', '2018-10-24', 'Ravencoin was launched on the ninth anniversary of the launch of Bitcoin, which was on January 3, 2018. However, the announcement for Ravencoin was made on October 31, 2017. There was no ICO or pre-mine, and no coins were reserved for founders\' or developers\' rewards.']
    ]

    retrieve['CRYPTO'] = m_utilities.strip(predefined)
    search = m_utilities.strip(predefined, search)

    completed = 0
    print(f'   ({completed}/{len(predefined)})          ', end = '\r')
    for each in predefined:
        value = {'name': each[1], 'description': each[3], 'exchange': 'TIINGO', 'joined': each[2], 'intra': True}
        values.append({'key': each[0].replace('USD', ''), 'value': json.dumps(value)})

        completed += 1
        m_utilities.log(f'({completed}/{len(predefined)})', False)
        print(f'   ({completed}/{len(predefined)})          ', end = '\r')

    m_utilities.log('Requesting metadata (metals)...')

    predefined = [
        ['GC-F', 'Gold Futures', '2000-08-30', 'COMEX', True, '[Au⁹⁷]: Gold was generally used for a couple thousand years solely to create things such as jewelry and idols for worship. This was until around 1500 BC when the ancient empire of Egypt, which benefited greatly from its gold-bearing region, Nubia, made gold the first official medium of exchange for international trade. Today gold can be used more practically in important electronics as a conductor that does not easily corrode.'],
        ['SI-F', 'Silver Futures', '2000-08-30', 'COMEX', True, '[Ag¹⁰⁸]: Silver  is used for jewellery and tableware, where appearance is important. Silver is used to make mirrors, as it is the best reflector of visible light known, although it does tarnish with time. It is also used in dental alloys, solder and brazing alloys, electrical contacts and batteries. Silver paints are used for making printed circuits. Silver bromide and iodide were important in the history of photography, because of their sensitivity to light.'],
        ['PL-F', 'Platinum Futures', '2000-01-04', 'NYMEX', True, '[Pt⁷⁸]: First discovered in Colombia, platinum was eventually found in Russia\'s Ural Mountains and became more available than ever being used only as jewelry at the time. Since the early 1900s, scientists had discovered different uses for platinum, including catalytic converters in vehicle engines, dental work, computers, pacemakers, and chemotherapy. Platinum was first used as currency in Russia when coins were minted in the late 1820s.'],
        ['PA-F', 'Palladium Futures', '2000-01-04', 'NYMEX', True, '[Pd⁴⁶]: Palladium is one of a number of metals starting to be used in the fuel cells to power a host of things including cars and buses. Palladium is also widely used in catalytic reactions in industry, such as in hydrogenation of unsaturated hydrocarbons, as well as in jewellery and in dental fillings and crowns.'],
        ['ALI-F', 'Aluminium Futures', '2014-05-06', 'COMEX', True, '[Al¹³]: The history of aluminium was shaped by the usage of its compound alum. The first written record of alum was in the 5th century BCE by Greek historian Herodotus. The ancients used it as a dyeing mordant, in medicine, in chemical milling, and as a fire-resistant coating for wood to protect fortresses from enemy arson. Nowadays aluminium is used everywhere from powerlines and high-rise building to spacecraft and motor vehicles as it is light, durable, and inexpensive.'],
        ['HG-F', 'Copper Futures', '2000-08-30', 'COMEX', True, '[Cu²⁵]:  Copper was probably the first metal used by ancient cultures, and the oldest artefacts made with it date to the Neolithic period. The shiny red-brown metal was used for jewellery, tools, sculpture, bells, vessels, lamps, amulets, and death masks, amongst other things. Modern uses of the conductive copper include electrical wire, musical instruments, plumbing, tableware, electric motors, and jewelry.'],
        ['LICO-F', 'Lithium Carbonate Futures', '2017-05-10', 'SHFE', False, '[Li₂CO₃]: Lithium Carbonate is a versatile and demanded alloy for its medical and electrical properties. In 1843, lithium carbonate was used to treat stones in the bladder. In 1859, some doctors recommended a therapy with lithium salts for a number of ailments, including gout, urinary calculi, rheumatism, mania, depression, and headache. In 1948, John Cade discovered the anti-manic effects of lithium ions. However, more recently we have used this alloy to power our many portable electronic devices from your smart phone to your new electric car. With the significant prospects of electric vehicles in the future and the scarcity of lithium carbonate, this material has skyrocketed in price in recent times.']
    ]

    retrieve['METALS'] = m_utilities.strip(predefined)
    search = m_utilities.strip(predefined, search)

    completed = 0
    print(f'   ({completed}/{len(predefined)})          ', end = '\r')
    for each in predefined:
        value = {'name': each[1], 'description': each[5], 'exchange': each[3], 'joined': each[2], 'intra': each[4]}
        values.append({'key': each[0], 'value': json.dumps(value)})

        completed += 1
        m_utilities.log(f'({completed}/{len(predefined)})', False)
        print(f'   ({completed}/{len(predefined)})          ', end = '\r')

    m_utilities.log('Requesting metadata (energy)...')

    predefined = [
        ['CL-F', 'WTI Crude Oil Futures', '2000-08-23', 'West Texas Intermediate (WTI) crude oil is a specific grade of crude oil and one of the main three benchmarks in oil pricing, along with Brent and Dubai Crude. WTI is known as a light sweet oil because it contains between 0.24%% and 0.34%% sulfur, making it "sweet," and has a low density (specific gravity), making it "light." This oil is extracted in the Texas, Oklahoma, and North Dakota states of America.'],
        ['BZ-F', 'Brent Crude Oil Futures', '2007-07-30', 'Brent Crude is more ubiquitous, and most oil is priced using Brent Crude as the benchmark, akin to two-thirds of all oil pricing. Brent Crude is produced near the sea, so transportation costs are significantly lower. In contrast, West Texas Intermediate is produced in landlocked areas, making transportation costs more onerous. The Organization of the Petroleum Exporting Countries (OPEC) controls most of the oil production and distribution, often dictating costs for not only oil suppliers but countries as well. Most nations factor oil prices into their budgets, so OPEC has been considered a leading geopolitical force.'],
        ['RB-F', 'RBOB Gasoline Futures', '2000-11-01', '"Reformulated Gasoline Blendstock for Oxygenate Blending" (RBOB) is motor gasoline blending components intended for blending with oxygenates to produce finished reformulated gasoline. RB (CME Group) supplies 30%% of the US market with gasoline.'],
        ['HO-F', 'Heating Oil Futures', '2000-09-01', 'Heating oil is mainly used for space heating. Some homes and residential commercial buildings also use heating oil to heat water but in much smaller amounts than what they use for space heating. Because cold weather affects heating demand, most heating oil use occurs during the heating season—October through March according to the EIA.'],
        ['NG-F', 'Natural Gas Futures', '2000-08-30', 'Compared to other similar fossil fuels, natural gas is much cleaning producing 60%% less carbon dioxide than coal counterparts and 30%% less in power plants that use oil derivatives. Natural gas is versatile being used as a fuel for process heating, in combined heat and power systems, as a raw material (feedstock) to produce chemicals, fertilizer, and hydrogen, as lease and plant fuel, space heating, water heating, outdoor lighting, and in highly efficient motor vehicles.']
    ]

    retrieve['ENERGY'] = m_utilities.strip(predefined)
    search = m_utilities.strip(predefined, search)

    completed = 0
    print(f'   ({completed}/{len(predefined)})          ', end = '\r')
    for each in predefined:
        value = {'name': each[1], 'description': each[3], 'exchange': 'NYMEX', 'joined': each[2], 'access': True}
        values.append({'key': each[0], 'value': json.dumps(value)})

        completed += 1
        m_utilities.log(f'({completed}/{len(predefined)})', False)
        print(f'   ({completed}/{len(predefined)})          ', end = '\r')

    m_utilities.log('Uploading to Cloudflare...')

    m_cloudflare.kv_put('meta', values)

    m_cloudflare.kv_put('index', [{'key': 'RETRIEVE', 'value': json.dumps(retrieve)}])
    m_cloudflare.kv_put('index', [{'key': 'SEARCH', 'value': json.dumps(search)}])

    m_utilities.log('[Priming Actions: Finished]')