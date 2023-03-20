import requests
import json
import os

import m_utilities
import m_headers

def kv_get(n, k, j = True):
    url = f"https://api.cloudflare.com/client/v4/accounts/{os.getenv('cf_account')}/storage/kv/namespaces/{os.getenv('cf_kv_' + n)}/values/{k}"
    response = requests.request('GET', url, headers = m_headers.flare)

    if j:
        return json.loads(response.text)
    else:
        return response.text

def kv_put(n, d):
    try:
        url = f"https://api.cloudflare.com/client/v4/accounts/{os.getenv('cf_account')}/storage/kv/namespaces/{os.getenv('cf_kv_' + n)}/bulk"
        requests.request('PUT', url, json = d, headers = m_headers.flare)
    except:
        m_utilities.log('Could not upload packet, trying once more...')

        url = f"https://api.cloudflare.com/client/v4/accounts/{os.getenv('cf_account')}/storage/kv/namespaces/{os.getenv('cf_kv_' + n)}/bulk"
        requests.request('PUT', url, json = d, headers = m_headers.flare)
        