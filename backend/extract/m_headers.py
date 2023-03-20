import dotenv
import os

dotenv.load_dotenv()

tiingo = {
    'Content-Type': 'application/json',
    'Authorization': 'Token ' + os.getenv('tiingo_api')
}

iex = {
    'Content-Type': 'application/json'
}

yahoo = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/605.0 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/605.0'
}

flare = {
    'Content-Type': 'application/json',
    'X-Auth-Email': os.getenv('cf_email'),
    'X-Auth-Key': os.getenv('cf_api_key')
}
