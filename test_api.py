import requests
from requests.auth import HTTPBasicAuth
import os
from dotenv import load_dotenv

load_dotenv(r"c:\Users\mandy\OneDrive - SOCIEDADE BRASILEIRA CAMINHO DE DAMASCO\Apps\Kanbanapp\.env")

BASE_URL = os.getenv("VITE_ORIS_BASE_URL")
USER = os.getenv("VITE_ORIS_USERNAME")
PASS = os.getenv("VITE_ORIS_PASSWORD")

# Test with a known ID from the database
id_to_test = "36821" 
url = f"{BASE_URL}/json/funcionarios/obterFuncionario?id={id_to_test}"

print(f"Testing URL: {url}")
resp = requests.get(url, auth=HTTPBasicAuth(USER, PASS))
print(f"Status: {resp.status_code}")
print(f"Response: {resp.text}")
