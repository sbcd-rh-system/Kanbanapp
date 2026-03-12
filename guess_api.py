import requests
from requests.auth import HTTPBasicAuth
import os
from dotenv import load_dotenv

load_dotenv(r"c:\Users\mandy\OneDrive - SOCIEDADE BRASILEIRA CAMINHO DE DAMASCO\Apps\Kanbanapp\.env")

BASE_URL = os.getenv("VITE_ORIS_BASE_URL")
USER = os.getenv("VITE_ORIS_USERNAME")
PASS = os.getenv("VITE_ORIS_PASSWORD")

# Try to find a way to search by Matricula (2045)
# Common Oris patterns:
endpoints = [
    "/json/funcionarios/obterFuncionarioRegistro?registro=2045",
    "/json/funcionarios/obterFuncionarioMatricula?matricula=2045",
    "/json/funcionarios/obterFuncionarioRE?re=2045",
    "/json/funcionarios/obterFuncionarioCpf?cpf=...", # won't test without a real CPF
]

for ep in endpoints:
    url = f"{BASE_URL}{ep}"
    print(f"Testing Guess: {url}")
    resp = requests.get(url, auth=HTTPBasicAuth(USER, PASS))
    print(f"  Result: {resp.status_code}")
