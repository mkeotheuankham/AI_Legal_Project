# backend/ingest.py
import os
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings

# --- Configuration ---
# ທີ່ຢູ່ຂອງໂຟເດີເກັບໄຟລ໌ກົດໝາຍ
SOURCE_DIRECTORY = "../source_documents/current_raw_2025/temp_docs" 
# ທີ່ຢູ່ຂອງ Vector Database ທີ່ຈະສ້າງ
PERSIST_DIRECTORY = "db_vector" 
# ຊື່ຂອງ Model ທີ່ຈະໃຊ້ສ້າງ Embedding (ຮອງຮັບພາສາລາວ)
EMBEDDING_MODEL = "intfloat/multilingual-e5-large"

def load_documents(directory_path):
    """
    ອ່ານໄຟລ໌ .pdf ແລະ .docx ທັງໝົດຈາກໂຟເດີที่ระบุ
    """
    documents = []
    print(f"ກຳລັງໂຫຼດເອກະສານຈາກ: {directory_path}")
    for filename in os.listdir(directory_path):
        filepath = os.path.join(directory_path, filename)
        if filename.endswith('.pdf'):
            loader = PyPDFLoader(filepath)
            documents.extend(loader.load())
        elif filename.endswith('.docx'):
            loader = Docx2txtLoader(filepath)
            documents.extend(loader.load())
    print(f"ໂຫຼດສຳເລັດ, ພົບ {len(documents)} ໜ້າ/ເອກະສານ.")
    return documents

def main():
    """
    ຂະບວນການหลักในการสร้าง Vector Database
    """
    # 1. ໂຫຼດເອກະສານ
    documents = load_documents(SOURCE_DIRECTORY)
    if not documents:
        print("ບໍ່ພົບເອກະສານ, ກະລຸນາກວດສອບທີ່ຢູ່ SOURCE_DIRECTORY")
        return

    # 2. ຕັດຂໍ້ຄວາມອອກເປັນທ່ອນນ້ອຍໆ (Chunking)
    print("ກຳລັງຕັດຂໍ້ຄວາມ...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    texts = text_splitter.split_documents(documents)
    print(f"ຕັດຂໍ້ຄວາມສຳເລັດ, ໄດ້ທັງໝົດ {len(texts)} ທ່ອນ.")

    # 3. ໂຫຼດ Embedding Model
    print(f"ກຳລັງໂຫຼດ Embedding Model: {EMBEDDING_MODEL}")
    embeddings = SentenceTransformerEmbeddings(model_name=EMBEDDING_MODEL)

    # 4. ສ້າງ ແລະ ບັນທຶກ Vector Database
    print(f"ກຳລັງສ້າງ Vector Database ແລະ ບັນທຶກໄປທີ່: {PERSIST_DIRECTORY}")
    vectordb = Chroma.from_documents(
        documents=texts,
        embedding=embeddings,
        persist_directory=PERSIST_DIRECTORY
    )
    vectordb.persist()
    print("ສ້າງ Vector Database ສຳເລັດ!")

if __name__ == "__main__":
    main()
