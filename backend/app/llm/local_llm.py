# app/llm/local_llm.py
from llama_cpp import Llama
from sentence_transformers import SentenceTransformer
import os

class LegalAI:
    def __init__(self):
        # ໂຫລດ LLM model
        self.llm = Llama(
            model_path="./models/mistral-7b-instruct-v0.1.Q4_K_M.gguf",
            n_ctx=2048,
            n_threads=4
        )
        
        # ໂຫລດ embedding model
        self.embedder = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
    
    def generate_answer(self, question: str) -> str:
        # ສ້າງ prompt ສຳຫຼັບການຖາມຄຳຖາມດ້ານກົດໝາຍ
        prompt = f"""
        [INST] ທ່ານເປັນຜູ້ຊ່ຽວຊານດ້ານກົດໝາຍລາວ. 
        ກະລຸນາຕອບຄຳຖາມດ້ານກົດໝາຍດ້ວຍພາສາລາວຢ່າງຊັດເຈນ ແລະ ເປັນທາງການ.
        
        ຄຳຖາມ: {question}
        ຄຳຕອບ: [/INST]
        """
        
        # ສົ່ງຄຳຖາມໄປຫາ LLM
        response = self.llm.create_completion(
            prompt,
            max_tokens=1000,
            temperature=0.7,
            stop=["</s>"]
        )
        
        return response["choices"][0]["text"].strip()