# Expects: Cron "*/30 * * * *":
# https://app.kpnc.io/trader/extract/

import traceback
import time
import os

import m_utilities
import t_invest
import t_tiingo
import t_yahoo
import t_index
import t_meta
import t_iex

m_utilities.log('[Starting log]: ' + time.strftime(f'%Y-%m-%dT%H:%M:%S.000Z'))
m_utilities.log('[Current Date]: ' + m_utilities.daysago(0))

try:
    if int(time.strftime('%w')) != 0 and int(time.strftime('%w')) != 6: # Business Days
        if int(time.strftime('%H%M')) > 855 and int(time.strftime('%H%M')) < 905: # About 9:00am
            t_index.get_index_contituents()
            t_yahoo.get_yahoo_daily_prices()
            t_invest.get_investing_prices()
            t_tiingo.get_tiingo_daily()
            # t_iex.get_iex_prices()

        if int(time.strftime('%H%M')) > 925 and int(time.strftime('%H%M')) < 1605: # Between About 9:30am and 4:00pm
            t_index.get_index_prices()
            t_yahoo.get_yahoo_intra_prices()
            t_tiingo.get_tiingo_intra()

    if os.getenv('prime') == 'true': # If prime (.env) is true
        t_meta.get_metadata_fill()

except Exception as error:
    m_utilities.log('[ERROR!]: ' + traceback.format_exc())
