# ໄຟລ໌: backend/app/llm/local_llm.py

import os
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

# ໂຫຼດຕົວແປຈາກ .env
load_dotenv()

def get_llm():
    """
    ສ້າງ ແລະ ສົ່ງຄືນ instance ຂອງ Gemini model ຜ່ານ LangChain.
    """
    
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY ບໍ່ພົບເຫັນ. ກະລຸນາກວດສອບໄຟລ໌ .env ຂອງທ່ານ.")

    # ຕັ້ງຄ່າ Gemini model
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro-latest",
        google_api_key=api_key,
        temperature=0.2, # ຫຼຸດອຸນຫະພູມລົງ ເພື່ອຄຳຕອບກົດໝາຍທີ່ຊັດເຈນ
        convert_system_message_to_human=True
    )
    
    return llm