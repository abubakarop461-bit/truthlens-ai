import os
import uuid
import json
import fitz  # PyMuPDF
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import re

try:
    embed_model = SentenceTransformer("all-MiniLM-L6-v2")
    embed_dim = embed_model.get_sentence_embedding_dimension()
except Exception as e:
    print(f"Warning: Could not load sentence-transformers model. {e}")

TRIGGER_PHRASES = [
    "committed to", "carbon neutral", "net zero", "reduced by", "invested",
    "achieved", "compliant", "zero emissions", "100% renewable", "offset"
]

def classify_document(text: str, source_name: str) -> str:
    text_lower = text.lower()[:5000]
    name_lower = source_name.lower()
    
    if "10-k" in name_lower or "financial" in name_lower or "annual report" in text_lower:
        return "financial_filing"
    elif "sustainability" in name_lower or "esg" in name_lower or "emissions" in text_lower:
        return "sustainability_report"
    elif "press release" in text_lower or "news" in name_lower:
        return "press_release"
    elif "disclosure" in name_lower or "regulatory" in name_lower:
        return "regulatory_disclosure"
    return "news_article"

def is_quantified(sentence: str) -> bool:
    return bool(re.search(r'\d+%|\$\d+|\d+\s*(million|billion|tonnes|metric|kg|kwh|mwh)', sentence.lower()))

def extract_claims(sentences: list, doc_type: str, source_name: str, page_num: int) -> list:
    claims = []
    for sent in sentences:
        sent_lower = sent.lower()
        if any(phrase in sent_lower for phrase in TRIGGER_PHRASES):
            cat = "general"
            if "emission" in sent_lower or "carbon" in sent_lower or "net zero" in sent_lower:
                cat = "emissions"
            elif "water" in sent_lower or "waste" in sent_lower:
                cat = "water_waste"
            elif "labor" in sent_lower or "diversity" in sent_lower:
                cat = "labor"
            elif "board" in sent_lower or "governance" in sent_lower:
                cat = "governance"

            claim = {
                "claim_id": str(uuid.uuid4()),
                "source_type": doc_type,
                "source_name": source_name,
                "page_number": page_num,
                "claim_text": sent.strip(),
                "claim_category": cat,
                "is_quantified": is_quantified(sent),
                "extraction_confidence": 0.94
            }
            claims.append(claim)
    return claims

def split_into_sentences(text: str) -> list:
    sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', text.replace('\n', ' '))
    return [s for s in sentences if len(s.strip()) > 10]

def process_raw_text(raw_text: str, source_name: str, doc_type: str, audit_id: str):
    all_sentences = [(s, 1) for s in split_into_sentences(raw_text)]
    
    extracted_claims = []
    for sent, p_num in all_sentences:
        ext = extract_claims([sent], doc_type, source_name, p_num)
        extracted_claims.extend(ext)

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=50,
        length_function=len,
    )
    chunks = text_splitter.split_text(raw_text)

    if chunks:
        embeddings = embed_model.encode(chunks)
        index_path = f"faiss_{audit_id}.index"
        
        if os.path.exists(index_path):
            index = faiss.read_index(index_path)
        else:
            index = faiss.IndexFlatL2(embed_dim)
            
        index.add(np.array(embeddings).astype('float32'))
        faiss.write_index(index, index_path)

    return extracted_claims, len(chunks)

def process_document(source: str, is_pdf: bool, audit_id: str):
    raw_text = ""
    source_name = os.path.basename(source) if is_pdf else source
    
    if is_pdf:
        try:
            doc = fitz.open(source)
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                raw_text += page.get_text() + "\n"
        except Exception as e:
            print(f"Error reading PDF {source}: {e}")
            return None
    else:
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(source, timeout=30000)
                html = page.content()
                browser.close()
            soup = BeautifulSoup(html, "html.parser")
            raw_text = soup.get_text(separator=' ', strip=True)
        except Exception as e:
            print(f"Error reading URL {source}: {e}")
            return None

    if not raw_text.strip():
        return None

    doc_type = classify_document(raw_text, source_name)

    extracted_claims, chunk_count = process_raw_text(raw_text, source_name, doc_type, audit_id)

    metadata = {
        "audit_id": audit_id,
        "source": source_name,
        "doc_type": doc_type,
        "claims_extracted": len(extracted_claims),
        "chunk_count": chunk_count,
        "claims": extracted_claims
    }
    
    with open(f"metadata_{source_name.replace('/', '_')}_{audit_id}.json", "w") as f:
        json.dump(metadata, f, indent=2)

    return metadata
