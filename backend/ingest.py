# backend/ingest.py
import os
import re
import docx
from langchain.docstore.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings

# --- Configuration ---
SOURCE_DIRECTORY = "../source_documents/current_raw_2025" 
PERSIST_DIRECTORY = "db_vector" 
EMBEDDING_MODEL = "intfloat/multilingual-e5-large"

def process_document_by_articles(filepath):
    """
    ອ່ານໄຟລ໌ .docx ແລະ ສະກັດຂໍ້ຄວາມໂດຍແຍກຕາມ "ມາດຕາ".
    """
    try:
        # ຂ້າມໄຟລ໌ຊົ່ວຄາວຂອງ Word
        if os.path.basename(filepath).startswith('~$') or not filepath.endswith('.docx'):
            return []
        
        doc = docx.Document(filepath)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]

        documents = []
        current_article_title = "ພາກທົ່ວໄປ"
        current_article_content = ""
        
        # **Regex ທີ່ປັບປຸງໃໝ່:** ຮອງຮັບຍະຫວ່າງ ແລະ ຮູບແບບທີ່ຫຼາກຫຼາຍ
        article_pattern = re.compile(r'^(ມາດຕາ\s*ທີ?\s*\d+.*)')

        for para in paragraphs:
            clean_para = para.strip()
            match = article_pattern.match(clean_para)
            
            if match:
                if current_article_content:
                    documents.append(Document(
                        page_content=current_article_content.strip(),
                        metadata={
                            'source': os.path.basename(filepath),
                            'article': current_article_title
                        }
                    ))
                
                current_article_title = match.group(0).strip()
                current_article_content = clean_para.replace(current_article_title, "", 1).strip()
            else:
                current_article_content += "\n" + clean_para

        if current_article_content:
            documents.append(Document(
                page_content=current_article_content.strip(),
                metadata={
                    'source': os.path.basename(filepath),
                    'article': current_article_title
                }
            ))
            
        # **ເພີ່ມ:** ລາຍງານຜົນການສະກັດຂໍ້ມູນ
        if documents and not (len(documents) == 1 and documents[0].metadata['article'] == "ພາກທົ່ວໄປ"):
            print(f"  -> ສະກັດໄດ້ {len(documents)} ມາດຕາ ຈາກ {os.path.basename(filepath)}")
        else:
            print(f"  -> ຄຳເຕືອນ: ບໍ່ພົບມາດຕາໃນ {os.path.basename(filepath)}. ຈະລວມເປັນເອກະສານດຽວ.")
            # Fallback: ຖ້າບໍ່ພົບມາດຕາ, ໃຫ້ລວມເນື້ອໃນທັງໝົດ
            full_text = "\n".join(paragraphs)
            return [Document(
                page_content=full_text,
                metadata={
                    'source': os.path.basename(filepath),
                    'article': 'ເນື້ອໃນທັງໝົດ'
                }
            )]

        return documents
    except Exception as e:
        print(f"  -> ເກີດຂໍ້ຜິດພາດ: ບໍ່ສາມາດປະມວນຜົນໄຟລ໌ {os.path.basename(filepath)}: {e}")
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
            print(f"- ກำลังประมวลผล: {filename}")
            processed_docs = process_document_by_articles(filepath)
            all_processed_docs.extend(processed_docs)
    
    print(f"ປະມວນຜົນສຳເລັດ, ໄດ້ທັງໝົດ {len(all_processed_docs)} ເອກະສານ/ມາດຕາ.")
    return all_processed_docs

def main():
    documents = load_and_process_documents(SOURCE_DIRECTORY)
    if not documents:
        print("ບໍ່ພົບເອກະສານທີ່ສາມາດປະມວນຜົນໄດ້.")
        return

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    texts = text_splitter.split_documents(documents)
    print(f"ຕັດຂໍ້ຄວາມສຳເລັດ, ໄດ້ທັງໝົດ {len(texts)} ທ່ອນຂໍ້ມູນ.")

    print(f"ກຳລັງໂຫຼດ Embedding Model: {EMBEDDING_MODEL}")
    embeddings = SentenceTransformerEmbeddings(model_name=EMBEDDING_MODEL)

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
