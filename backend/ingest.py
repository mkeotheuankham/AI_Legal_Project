# backend/ingest.py
import os
import re
import torch # **ເພີ່ມ:** import torch ເພື່ອກວດສອບ GPU
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain.docstore.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings

# --- Configuration ---
SOURCE_DIRECTORY = "../pdf_documents/current_raw_2025" 
PERSIST_DIRECTORY = "db_vector" 
EMBEDDING_MODEL = "intfloat/multilingual-e5-large"

def process_document_by_articles(filepath):
    """
    ອ່ານໄຟລ໌ .docx ແລະ ສະກັດຂໍ້ຄວາມໂດຍແຍກຕາມ "ມາດຕາ".
    """
    try:
        if not filepath.endswith('.docx'):
            print(f"  [Skipping] Not a .docx file: {os.path.basename(filepath)}")
            return []
        
        import docx
        doc = docx.Document(filepath)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]

        documents = []
        current_article_title = "ພາກທົ່ວໄປ"
        current_article_content = ""
        
        article_pattern = re.compile(r'^(ມາດຕາທີ?\s+\d+[\.:]?\s*.*)')

        for para in paragraphs:
            match = article_pattern.match(para.strip())
            if match:
                if current_article_content:
                    documents.append(Document(
                        page_content=current_article_content.strip(),
                        metadata={
                            'source': os.path.basename(filepath),
                            'article': current_article_title
                        }
                    ))
                
                current_article_title = match.group(1).strip()
                current_article_content = para.strip().replace(current_article_title, "", 1).strip()
            else:
                current_article_content += "\n" + para.strip()

        if current_article_content:
            documents.append(Document(
                page_content=current_article_content.strip(),
                metadata={
                    'source': os.path.basename(filepath),
                    'article': current_article_title
                }
            ))
            
        return documents
    except Exception as e:
        print(f"  [Error] Could not process file {os.path.basename(filepath)}: {e}")
        return []

def load_and_process_documents(directory_path):
    """
    ໂຫຼດ ແລະ ປະມວນຜົນເອກະສານທັງໝົດໃນໂຟເດີ
    """
    all_processed_docs = []
    print(f"ກຳລັງປະມວນຜົນເອກະສານຈາກ: {directory_path}")
    for filename in os.listdir(directory_path):
        filepath = os.path.join(directory_path, filename)
        if os.path.isfile(filepath):
            print(f"- Processing: {filename}")
            processed_docs = process_document_by_articles(filepath)
            all_processed_docs.extend(processed_docs)
    
    print(f"ປະມວນຜົນສຳເລັດ, ພົບ {len(all_processed_docs)} ມາດຕາ.")
    return all_processed_docs

def main():
    documents = load_and_process_documents(SOURCE_DIRECTORY)
    if not documents:
        print("ບໍ່ພົບເອກະສານທີ່ສາມາດປະມວນຜົນໄດ້.")
        return

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    texts = text_splitter.split_documents(documents)
    print(f"ຕັດຂໍ້ຄວາມສຳເລັດ, ໄດ້ທັງໝົດ {len(texts)} ທ່ອນຂໍ້ມູນ.")

    # **ແກ້ໄຂ:** ກວດສອບ ແລະ ກຳນົດໃຫ້ໃຊ້ GPU (cuda) ຖ້າມີ
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"ກຳລັງໃຊ້ Device: {device}")

    print(f"ກຳລັງໂຫຼດ Embedding Model: {EMBEDDING_MODEL}")
    embeddings = SentenceTransformerEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={'device': device} # ບອກໃຫ້ Model ໃຊ້ device ທີ່ເຮົາກວດສອບ
    )

    print(f"ກຳລັງສ້າງ Vector Database...")
    vectordb = Chroma.from_documents(
        documents=texts,
        embedding=embeddings,
        persist_directory=PERSIST_DIRECTORY
    )
    vectordb.persist()
    print("ສ້າງ Vector Database ສຳເລັດ!")

if __name__ == "__main__":
    main()
