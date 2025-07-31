import os
from pdf2image import convert_from_path
import pytesseract
import pandas as pd

# --- Configuration (MUST BE UPDATED BY YOU) ---
# Replace this with the actual path to your Tesseract executable
# Example: r'C:\Program Files\Tesseract-OCR\tesseract.exe'
# Remember to use a raw string (r'...') or double backslashes (\\)
TESSERACT_PATH = r'C:\Program Files\Tesseract-OCR\tesseract.exe' # <--- UPDATE THIS!

# Replace this with the actual path to your Poppler bin directory
# Example: r'D:\poppler-25.07.0\Library\bin'
POPPLER_PATH = r'D:\Release-24.08.0-0\poppler-24.08.0\Library\bin' # <--- UPDATE THIS!

# Set the Tesseract command path (pytesseract needs to know where Tesseract is)
pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

def ocr_pdf(pdf_path, lang='lao+eng'):
    """
    Performs OCR on a PDF file and returns the extracted text.
    Args:
        pdf_path (str): The full path to the PDF file.
        lang (str): Language code for Tesseract (e.g., 'lao', 'eng', 'lao+eng').
    Returns:
        str: The extracted text from the PDF, or None if an error occurs.
    """
    if not os.path.exists(pdf_path):
        print(f"Error: PDF file not found at {pdf_path}")
        return None

    try:
        # Convert PDF to a list of images (one image per page)
        # Use poppler_path to specify the location of Poppler utilities
        images = convert_from_path(pdf_path, poppler_path=POPPLER_PATH)
        
        extracted_text = []
        for i, image in enumerate(images):
            print(f"  Processing page {i+1}/{len(images)} of {os.path.basename(pdf_path)}...")
            # Perform OCR on each image
            page_text = pytesseract.image_to_string(image, lang=lang)
            extracted_text.append(page_text)
        
        return "\n".join(extracted_text)
    except Exception as e:
        print(f"Error during OCR of {pdf_path}: {e}")
        print("Please ensure Tesseract and Poppler are installed correctly and their paths are set in this script.")
        return None

def process_pdfs_in_directory(input_dir="pdf_documents", output_csv="ocr_legal_documents.csv", append_mode=False):
    """
    Processes all PDF files in a given directory, performs OCR, and saves the text to a CSV.
    """
    if not os.path.exists(input_dir):
        print(f"Creating directory: {input_dir}")
        os.makedirs(input_dir)
        print(f"Please place your PDF files into the '{input_dir}' directory.")
        return

    pdf_files = [f for f in os.listdir(input_dir) if f.lower().endswith('.pdf')]
    if not pdf_files:
        print(f"No PDF files found in '{input_dir}'. Please place your PDF files there.")
        return

    all_ocr_data = []
    for pdf_file in pdf_files:
        full_pdf_path = os.path.join(input_dir, pdf_file)
        print(f"Performing OCR on: {pdf_file}")
        text = ocr_pdf(full_pdf_path, lang='lao+eng') # Specify language as Lao + English

        if text:
            # You might want to extract title/date from filename or the first few lines of text
            title_candidate = os.path.splitext(pdf_file)[0] # Use filename as a temporary title
            all_ocr_data.append({'filename': pdf_file, 'title_candidate': title_candidate, 'full_text': text})
    
    if all_ocr_data:
        df_ocr = pd.DataFrame(all_ocr_data)
        mode = 'a' if append_mode and os.path.exists(output_csv) else 'w'
        header = not (append_mode and os.path.exists(output_csv))
        
        df_ocr.to_csv(output_csv, index=False, encoding='utf-8-sig', mode=mode, header=header)
        print(f"\nOCR processed data saved to {output_csv}")
        print("\n--- Sample of OCR Data ---")
        print(df_ocr.head())
    else:
        print("No text extracted from any PDF files.")


if __name__ == "__main__":
    # Create a directory to store your PDF documents
    # Make sure this directory exists or is created automatically
    pdf_input_directory = "pdf_documents" # This folder will be inside D:\AI_Legal_Project

    print(f"--- Starting PDF OCR Process ---")
    print(f"Ensure TESSERACT_PATH is set to your Tesseract executable.")
    print(f"Ensure POPPLER_PATH is set to your Poppler 'bin' directory.")
    print(f"Place your PDF files in the '{pdf_input_directory}' folder within your project directory.")

    # You can set append_mode=True if you want to add to an existing CSV
    # Otherwise, it will overwrite the file.
    process_pdfs_in_directory(input_dir=pdf_input_directory, append_mode=False)

    print("\n--- Next Step ---")
    print("After OCR, you will likely need to apply the same cleaning (preprocessing.py) to 'full_text' column.")
    print("You might also need to parse structured information from the OCR text (e.g., Article numbers, dates).")