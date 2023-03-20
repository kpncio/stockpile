import datetime
import time
import os

epoch = round(time.time()) * 1000

def log(t, s = True):
    if s:
        if t[0] != '[':
            print('   ' + t)
        else:
            print(t)

    if not os.path.exists('logs'):
        os.makedirs('logs')

    file = open(f'logs/{epoch}.log', 'a')
    file.write(t + '\n')
    file.close()

def strip(p, v = None):
    if v == None:
        symbols = []
        for each in p:
            symbols.append(each[0])

        return symbols
    else:
        for each in p:
            v[each[0]] = each[1]
            v[each[1]] = each[0]

        return v

def daysago(d):
    now = datetime.datetime.now()
    ago = datetime.timedelta(days = d)
    date = now - ago
    return str(date).split()[0]

def calc_chunks(l, n):
    for i in range(0, len(l), n):
        yield l[i:i + n]

def calc_dixie(e, y, p, c, k, f):
    return round(50.14348112 * (e ** -0.576) * (y ** 0.136) * (p ** -0.119) * (c ** 0.091) * (k ** 0.042) * (f ** 0.036), 3)

def parse_date(opt, date):
    match opt:
        case 0:
            parts = date.split(' ')
            d = parts[0].split('-')
            t = parts[1].split('-')[0].split(':')
            return round(datetime.datetime(int(d[0]), int(d[1]), int(d[2]), int(t[0]), int(t[1]), int(t[2])).timestamp())
        case 1:
            parts = date.split('.')[0]
            d = parts.split('T')[0].split('-')
            t = parts.split('T')[1].split(':')
            return round(datetime.datetime(int(d[0]), int(d[1]), int(d[2]), int(t[0]), int(t[1]), int(t[2])).timestamp())
        case 2:
            parts = date.split('.')[0]
            d = parts.split('+')[0].split('T')[0].split('-')
            t = parts.split('+')[0].split('T')[1].split(':')
            return round(datetime.datetime(int(d[0]), int(d[1]), int(d[2]), int(t[0]), int(t[1]), int(t[2])).timestamp())
            