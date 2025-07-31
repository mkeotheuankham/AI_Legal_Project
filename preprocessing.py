import pandas as pd
import re
import os

def clean_text(text):
    """
    Cleans the input text by removing unwanted characters, extra spaces, etc.
    This is a preliminary cleaning step.
    """
    if not isinstance(text, str):
        return "" # Return empty string for non-string inputs

    # 1. Remove URLs
    text = re.sub(r'http\S+|www.\S+', '', text)
    # 2. Remove HTML tags (e.g., <p>, <a>)
    text = re.sub(r'<.*?>', '', text)
    # 3. Remove non-Lao/English/number characters and common symbols, but keep basic punctuation
    #    Moved '-' to the end of the character set to treat it as a literal hyphen.
    #    Escaped '.' as '\.' to treat it as a literal dot.
    #    The order inside [] for .,!?():; should be fine.
    text = re.sub(r'[^\u0E80-\u0EFFa-zA-Z0-9,\.!?():;\s-]', '', text) # \u0E80-\u0EFF covers Lao unicode range
    # 4. Remove extra whitespace (tabs, newlines, multiple spaces)
    text = re.sub(r'\s+', ' ', text).strip()
    # 5. Handle specific legal document artifacts if known (e.g., "Page X of Y")
    text = re.sub(r'(?i)Page \d+ of \d+', '', text) # (?i) for case-insensitive
    text = re.sub(r'^\d+\.\s*', '', text) # Remove leading numbers with dot (e.g., "1. " or "2. ") often found in lists

    return text

def preprocess_legal_data(input_filename="raw_legal_documents.csv", output_filename="preprocessed_legal_documents.csv"):
    """
    Loads raw legal data, cleans it, and saves the preprocessed data.
    """
    if not os.path.exists(input_filename):
        print(f"Error: Input file '{input_filename}' not found. Please run scraper.py first.")
        return

    try:
        df = pd.read_csv(input_filename, encoding='utf-8-sig')
        print(f"Loaded {len(df)} rows from {input_filename}")
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return

    # Apply cleaning function to relevant text columns
    # Assuming 'title' and 'content' columns exist from scraping
    if 'title' in df.columns:
        df['cleaned_title'] = df['title'].apply(clean_text)
    else:
        print("Warning: 'title' column not found in input data.")
        df['cleaned_title'] = "" # Add an empty column if not found

    if 'content' in df.columns:
        df['cleaned_content'] = df['content'].apply(clean_text)
    else:
        print("Warning: 'content' column not found in input data.")
        df['cleaned_content'] = "" # Add an empty column if not found


    # You might want to remove rows where both cleaned_title and cleaned_content are empty
    initial_rows = len(df)
    df.replace('', pd.NA, inplace=True) # Replace empty strings with NaN for proper dropna handling
    df.dropna(subset=['cleaned_title', 'cleaned_content'], how='all', inplace=True)
    rows_removed = initial_rows - len(df)
    if rows_removed > 0:
        print(f"Removed {rows_removed} rows with empty title and content after cleaning.")

    # Save the preprocessed data
    df.to_csv(output_filename, index=False, encoding='utf-8-sig')
    print(f"Preprocessed data saved to {output_filename}")
    print("\n--- Sample of Preprocessed Data ---")
    print(df[['cleaned_title', 'cleaned_content']].head())


if __name__ == "__main__":
    # Ensure you are in D:\AI_Legal_Project when running this script
    # The input file raw_legal_documents.csv should be in the same directory
    preprocess_legal_data()