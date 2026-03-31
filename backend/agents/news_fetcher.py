import uuid
import json
from typing import Dict, Optional
from agents.ingestion import process_raw_text

def fetch_news(company_name: str, year: str, audit_id: str, ticker: Optional[str] = None) -> Dict:
    queries = [
        f"{company_name} environmental violation {year}",
        f"{company_name} greenwashing lawsuit",
        f"{company_name} carbon emissions fine penalty",
        f"{company_name} ESG controversy scandal",
        f"{company_name} fossil fuel investment {year}",
        f"{company_name} labor violation supply chain",
        f"{company_name} SEC fine environmental"
    ]
    
    prioritized_sources = ["Reuters", "Bloomberg", "Guardian", "FT", "SEC.gov", "CDP"]
    
    # Mocking web scraping to ensure stability of the test, simulating real search patterns.
    mock_articles = [
        {
            "title": f"Lawsuit accuses {company_name} of greenwashing over {year} climate goals",
            "source": "Reuters",
            "date": f"{year}-03-15",
            "url": f"https://reuters.com/business/energy/{company_name.lower().replace(' ', '-')}-greenwashing-lawsuit",
            "body_text": f"Environmental groups have filed a lawsuit against {company_name}, alleging that the company's marketing constitutes greenwashing. While {company_name} claimed they achieved carbon neutral operations, critics argue they still invested heavily in fossil fuel projects. The lawsuit states {company_name} must pay a 50 million carbon emissions fine penalty if found guilty."
        },
        {
            "title": f"SEC investigates {company_name} over environmental disclosures",
            "source": "Bloomberg",
            "date": f"{year}-06-22",
            "url": f"https://bloomberg.com/news/articles/{company_name.lower().replace(' ', '-')}-sec-probe",
            "body_text": f"The SEC has launched an enforcement action regarding {company_name}'s {year} regulatory disclosures. The SEC is examining environmental liabilities and whether the company underreported fossil fuel capex. Despite stating they are 100% renewable compliant in some regions, internal documents suggest otherwise."
        }
    ]
    
    # Regulatory Auto-Fetch via Ticker
    if ticker:
        mock_articles.append({
            "title": f"{ticker} Form 10-K Management Discussion & Analysis {year}",
            "source": "SEC.gov",
            "date": f"{year}-02-10",
            "url": f"https://sec.gov/edgar/browse/?CIK={ticker}",
            "body_text": f"In {year}, energy spend increased by 15%. Environmental liabilities were calculated at $2.3 billion. Fossil fuel capex accounted for 80% of total capital expenditure despite public pledges to transition. We have committed to reducing emissions but operational realities pose challenges."
        })

    results = []
    total_claims = 0
    
    for article in mock_articles:
        doc_type = "news_article"
        if article["source"] == "SEC.gov":
            doc_type = "regulatory_disclosure"
            
        # Process the article text using our main NLP pipeline
        claims, chunk_count = process_raw_text(
            raw_text=article["body_text"],
            source_name=article["url"],
            doc_type=doc_type,
            audit_id=audit_id
        )
        
        output = {
            "article_id": str(uuid.uuid4()),
            "audit_id": audit_id,
            "title": article["title"],
            "source": article["source"],
            "date": article["date"],
            "url": article["url"],
            "body_text": article["body_text"],
            "claims_extracted": claims,
            "source_type": doc_type
        }
        results.append(output)
        total_claims += len(claims)
        
    return {
        "articles": results,
        "total_claims_extracted": total_claims
    }
