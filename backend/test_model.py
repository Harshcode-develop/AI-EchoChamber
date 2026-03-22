from google import genai
import os
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))
test_models = ['gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-flash-lite-latest']
for m in test_models:
    try:
        response = client.models.generate_content(
            model=m,
            contents="test"
        )
        print(f"Success: {m}")
    except Exception as e:
        print(f"Error {m}: {e}")
