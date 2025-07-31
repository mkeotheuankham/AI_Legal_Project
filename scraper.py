import requests
from bs4 import BeautifulSoup
import pandas as pd
import os

def scrape_legal_data(url):
    """
    Scrapes data from a given URL, focusing on titles and paragraphs.
    This is a generic example and might need adjustments for specific websites.
    """
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for HTTP errors (4xx or 5xx)
    except requests.exceptions.RequestException as e:
        print(f"Error accessing {url}: {e}")
        return None

    soup = BeautifulSoup(response.text, 'html.parser')

    # This part needs to be customized based on the website's HTML structure
    # For demonstration, let's try to extract common elements like titles and paragraphs
    data = []

    # Example 1: Extracting all <h2> titles and their following paragraphs
    for title_tag in soup.find_all('h2'):
        title = title_tag.get_text(strip=True)
        content_parts = []
        next_sibling = title_tag.find_next_sibling()
        while next_sibling and next_sibling.name not in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            if next_sibling.name == 'p':
                content_parts.append(next_sibling.get_text(strip=True))
            next_sibling = next_sibling.find_next_sibling()
        
        if title or content_parts: # Only add if there's actual data
            data.append({
                'title': title,
                'content': "\n".join(content_parts)
            })

    # Example 2: More specific extraction if we know the CSS selector (e.g., from a news list)
    # If the website has specific classes for legal documents, e.g., <div class="legal-document">
    # for doc_div in soup.find_all('div', class_='legal-document'):
    #     doc_title = doc_div.find('h3', class_='doc-title').get_text(strip=True) if doc_div.find('h3', class_='doc-title') else ''
    #     doc_content = doc_div.find('p', class_='doc-content').get_text(strip=True) if doc_div.find('p', class_='doc-content') else ''
    #     data.append({'title': doc_title, 'content': doc_content})

    if not data:
        print(f"No specific data extracted from {url} using general rules. "
              "You might need to inspect the website's HTML structure to write more targeted selectors.")
        # As a fallback, try to get all paragraph text
        all_paragraphs = [p.get_text(strip=True) for p in soup.find_all('p') if p.get_text(strip=True)]
        if all_paragraphs:
            data.append({'title': 'General Content', 'content': "\n".join(all_paragraphs)})


    return pd.DataFrame(data) if data else None

def save_data_to_csv(dataframe, filename="legal_data.csv"):
    """Saves the DataFrame to a CSV file."""
    if dataframe is not None and not dataframe.empty:
        # Check if file exists to handle header writing
        file_exists = os.path.isfile(filename)
        dataframe.to_csv(filename, mode='a', index=False, header=not file_exists, encoding='utf-8-sig')
        print(f"Data saved to {filename}")
    else:
        print("No data to save.")

if __name__ == "__main__":
    # Example URL (replace with actual legal document URLs or list pages)
    # You will likely need to find the specific URLs that list legal documents or contain their full text.
    # For demonstration, let's use a placeholder.
    target_url = "https://www.moj.gov.la/" # This is an example, you need to find a page with actual laws.

    print(f"Attempting to scrape from: {target_url}")
    df_legal = scrape_legal_data(target_url)

    if df_legal is not None:
        print("\n--- Scraped Data Sample ---")
        print(df_legal.head())
        save_data_to_csv(df_legal, "raw_legal_documents.csv")
    else:
        print("Failed to scrape data or no data found.")

    print("\n--- Next Steps ---")
    print("1. Identify specific URLs for legal documents (e.g., lists of laws, individual law pages).")
    print("2. Inspect the HTML structure of those pages (using browser's developer tools) to identify appropriate CSS selectors for titles, articles, and content.")
    print("3. Modify the 'scrape_legal_data' function to target these specific selectors for more accurate extraction.")
    print("4. Consider implementing pagination if the legal documents are spread across multiple pages.")