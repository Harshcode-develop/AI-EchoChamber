from google import genai
import os
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))
models = client.models.list()
with open("models_utf8.txt", "w", encoding="utf-8") as f:
    for m in models:
        f.write(m.name + "\n")
