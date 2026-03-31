from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, FileResponse
import asyncio
import uuid
import os
import shutil
from typing import Optional, List, Dict
from pydantic import BaseModel
from agents.ingestion import process_document
from agents.news_fetcher import fetch_news
from agents.contradiction import detect_contradictions, detect_contradictions_from_news_result
from agents.scorer import compute_esg_score
from agents.report_generator import generate_pdf

app = FastAPI(title="TruthLens AI Backend API")
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
audit_status = {}

class NewsFetchRequest(BaseModel):
    company_name: str
    year: str
    ticker: Optional[str] = None

@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}

@app.post("/api/audit/start")
def start_audit():
    audit_id = str(uuid.uuid4())
    audit_status[audit_id] = {"status": "initialized", "documents": []}
    return {"audit_id": audit_id, "status": "initialized"}

def run_ingestion(file_path: str, is_pdf: bool, audit_id: str):
    audit_status[audit_id]["status"] = "processing"
    try:
        result = process_document(file_path, is_pdf, audit_id)
        if result:
            audit_status[audit_id]["status"] = "completed"
            audit_status[audit_id]["result"] = result
        else:
            audit_status[audit_id]["status"] = "failed"
    except Exception as e:
        audit_status[audit_id]["status"] = f"error: {str(e)}"

@app.post("/api/audit/{id}/upload-document")
async def upload_document(id: str, background_tasks: BackgroundTasks, file: Optional[UploadFile] = File(None), url: Optional[str] = Form(None)):
    if id not in audit_status:
        audit_status[id] = {"status": "initialized", "documents": []}
        
    if file:
        os.makedirs("uploads", exist_ok=True)
        file_path = f"uploads/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        audit_status[id]["documents"].append(file.filename)
        background_tasks.add_task(run_ingestion, file_path, True, id)
        return {"message": "PDF uploaded and processing started", "audit_id": id}
        
    elif url:
        audit_status[id]["documents"].append(url)
        background_tasks.add_task(run_ingestion, url, False, id)
        return {"message": "URL received and processing started", "audit_id": id}
        
    return JSONResponse(status_code=400, content={"message": "Must provide either file or url"})

@app.post("/api/audit/{id}/fetch-news")
def fetch_news_api(id: str, request: NewsFetchRequest):
    if id not in audit_status:
        return JSONResponse(status_code=404, content={"message": "Audit ID not found"})
        
    result = fetch_news(request.company_name, request.year, id, request.ticker)
    # Persist so downstream endpoints (scorer) can reuse
    audit_status[id]["news_result"] = result
    return result


class ContradictionRequest(BaseModel):
    claims: Optional[List[Dict]] = None   # supply raw claims directly
    run_on_news: bool = False              # re-use last fetch-news result
    min_score: float = 0.25


@app.post("/api/audit/{id}/detect-contradictions")
def detect_contradictions_api(id: str, request: ContradictionRequest):
    """
    Phase 6 — Contradiction Detection.
    Accepts either:
      - A list of raw claim dicts (from ingestion / news-fetcher)
      - run_on_news=true to auto-pull claims stored on the audit's news result
    """
    if id not in audit_status:
        return JSONResponse(status_code=404, content={"message": "Audit ID not found"})

    claims_to_check = request.claims or []

    # If caller wants to reuse the stored news result
    if request.run_on_news:
        news_result = audit_status[id].get("news_result")
        if not news_result:
            return JSONResponse(
                status_code=400,
                content={"message": "No news result stored for this audit. Run fetch-news first."}
            )
        result = detect_contradictions_from_news_result(news_result, id, request.min_score)
        audit_status[id]["contradiction_result"] = result
        return result

    if not claims_to_check:
        return JSONResponse(
            status_code=400,
            content={"message": "Provide 'claims' list or set 'run_on_news': true."}
        )

    result = detect_contradictions(claims_to_check, id, request.min_score)
    # Persist for scorer
    audit_status[id]["contradiction_result"] = result
    return result

class ScorerRequest(BaseModel):
    claims: Optional[List[Dict]] = None          # override claim list
    contradictions: Optional[List[Dict]] = None  # override contradiction list
    metadata: Optional[Dict] = None              # manual flags (big4, sbti, cdp_a, scope3)


@app.post("/api/audit/{id}/score")
def score_audit(id: str, request: ScorerRequest):
    """
    Phase 7 — ESG Integrity Scorer.
    Pulls claims + contradictions from previous pipeline steps stored on
    audit_status, or accepts them directly in the request body.

    Pipeline order: start → fetch-news → detect-contradictions → score
    """
    if id not in audit_status:
        return JSONResponse(status_code=404, content={"message": "Audit ID not found"})

    # ── Resolve claims ───────────────────────────────────────────────────────
    claims = request.claims
    if claims is None:
        # Try ingestion result first, fall back to news result
        ingestion_result = audit_status[id].get("result", {})
        news_result      = audit_status[id].get("news_result", {})

        claims = ingestion_result.get("claims", [])
        if not claims:
            for article in news_result.get("articles", []):
                claims.extend(article.get("claims_extracted", []))

    if not claims:
        return JSONResponse(
            status_code=400,
            content={"message": "No claims available. Run fetch-news or upload-document first."}
        )

    # ── Resolve contradictions ───────────────────────────────────────────────
    contradictions = request.contradictions
    if contradictions is None:
        con_result = audit_status[id].get("contradiction_result", {})
        contradictions = con_result.get("contradictions", [])
        # Auto-run contradiction detection if not already done
        if not contradictions and claims:
            con_result = detect_contradictions(claims, id)
            audit_status[id]["contradiction_result"] = con_result
            contradictions = con_result.get("contradictions", [])

    # ── Score ────────────────────────────────────────────────────────────────
    result = compute_esg_score(
        claims=claims,
        contradictions=contradictions,
        audit_id=id,
        metadata=request.metadata,
    )
    audit_status[id]["score_result"] = result
    return result


class ReportRequest(BaseModel):
    company_name: str
    industry: str = "Not specified"
    report_year: str = ""


@app.post("/api/audit/{id}/report/pdf")
def generate_report_pdf(id: str, request: ReportRequest):
    """
    Phase 8 — Forensic Report Generator.
    Generates a Big-4-quality ESG forensic PDF report.

    Requires: score endpoint must have been called first (or score is auto-computed).

    Returns the PDF as a downloadable file attachment.
    """
    if id not in audit_status:
        return JSONResponse(status_code=404, content={"message": "Audit ID not found"})

    score_result = audit_status[id].get("score_result")

    # Auto-compute score if not already done
    if not score_result:
        # Gather claims
        claims: List[Dict] = []
        ingestion_result = audit_status[id].get("result", {})
        news_result      = audit_status[id].get("news_result", {})
        claims = ingestion_result.get("claims", [])
        if not claims:
            for article in news_result.get("articles", []):
                claims.extend(article.get("claims_extracted", []))

        if not claims:
            return JSONResponse(
                status_code=400,
                content={"message": "No claims found. Run fetch-news or upload-document first."}
            )

        # Gather / compute contradictions
        con_result     = audit_status[id].get("contradiction_result", {})
        contradictions = con_result.get("contradictions", [])
        if not contradictions:
            con_result     = detect_contradictions(claims, id)
            contradictions = con_result.get("contradictions", [])
            audit_status[id]["contradiction_result"] = con_result

        score_result = compute_esg_score(claims, contradictions, id)
        audit_status[id]["score_result"] = score_result

    # Gather all claims for appendix
    all_claims: List[Dict] = []
    for article in audit_status[id].get("news_result", {}).get("articles", []):
        all_claims.extend(article.get("claims_extracted", []))
    ingestion_claims = audit_status[id].get("result", {}).get("claims", [])
    all_claims.extend(ingestion_claims)

    docs_reviewed = len(audit_status[id].get("documents", []))

    try:
        pdf_path = generate_pdf(
            score_result=score_result,
            company_name=request.company_name,
            audit_id=id,
            industry=request.industry,
            report_year=request.report_year,
            documents_reviewed=docs_reviewed,
            extra_claims=all_claims,
        )
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"PDF generation failed: {str(e)}"})

    safe_name = request.company_name.lower().replace(" ", "_")[:20]
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"truthlens_esg_report_{safe_name}.pdf",
        headers={"Content-Disposition": f'attachment; filename="truthlens_esg_report_{safe_name}.pdf"'},
    )


@app.get("/api/audit/{id}/status")
def get_audit_status(id: str):
    if id in audit_status:
        return audit_status[id]
    return JSONResponse(status_code=404, content={"message": "Audit ID not found"})


import json

@app.get("/api/red-flags")
def get_red_flags():
    """
    Phase 11 — Returns the ESG Red Flags heuristics database.
    """
    try:
        db_path = os.path.join(os.path.dirname(__file__), "data", "esg_red_flags.json")
        with open(db_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Failed to load red flags database: {e}"})

@app.get("/api/audit/{id}/results")
def get_audit_results(id: str):
    """
    Phase 10 — Results Dashboard endpoint.
    Aggregates the final forensic data into a clean structure for the React UI.
    """
    # Demo Mock Endpoint Data
    if id == "demo-001":
        return {
            "audit_id": "demo-001",
            "overall_score": 52,
            "integrity_label": "LOW INTEGRITY",
            "summary": "Multiple contradictions found in recent 10-K and sustainability reports compared to NGO documentation.",
            "metrics": {
                "claims_analyzed": 142,
                "contradictions_found": 2,
                "vague_claims": 2,
                "documents_reviewed": 5
            },
            "category_scores": [
                {"key": "climate", "display_name": "Climate & Emissions", "score": 45, "claims_count": 0, "contradictions_count": 0, "notes": []},
                {"key": "water", "display_name": "Water Security", "score": 60, "claims_count": 0, "contradictions_count": 0, "notes": []},
                {"key": "labor", "display_name": "Fair Labor", "score": 55, "claims_count": 0, "contradictions_count": 0, "notes": []},
                {"key": "governance", "display_name": "Governance Ethics", "score": 40, "claims_count": 0, "contradictions_count": 0, "notes": []},
                {"key": "supply", "display_name": "Supply Chain", "score": 60, "claims_count": 0, "contradictions_count": 0, "notes": []}
            ],
            "contradictions": [
                {
                    "contradiction_id": "c-001",
                    "severity": "CRITICAL",
                    "contradiction_score": 0.95,
                    "reasons": ["The company's press release claims 100% renewable energy, while the SEC 10-K explicitly lists 60% fossil fuel dependency for operations."],
                    "claim_a": {
                        "claim_id": "ca1",
                        "text": "Acme Energy Corp is powered by 100% renewable energy across all North American operations.",
                        "source": "2024 Sustainability Press Release",
                        "source_type": "press_release",
                        "category": "Emissions"
                    },
                    "claim_b": {
                        "claim_id": "cb1",
                        "text": "Operations rely heavily on local grid electricity which is composed of 60% coal and natural gas.",
                        "source": "SEC Form 10-K",
                        "source_type": "financial_filing",
                        "category": "Emissions"
                    }
                },
                {
                    "contradiction_id": "c-002",
                    "severity": "HIGH",
                    "contradiction_score": 0.88,
                    "reasons": ["Company claims conflict-free minerals, but recent Reuters investigation linked Tier-2 suppliers to high-risk zones."],
                    "claim_a": {
                        "claim_id": "ca2",
                        "text": "We ensure 100% conflict-free minerals in our electronics supply chain.",
                        "source": "Supplier Code of Conduct",
                        "source_type": "sustainability_report",
                        "category": "Supply Chain"
                    },
                    "claim_b": {
                        "claim_id": "cb2",
                        "text": "Acme Energy's primary cobalt broker was recently sanctioned for sourcing from unregulated conflict mines.",
                        "source": "Reuters Global Investigation",
                        "source_type": "news_article",
                        "category": "Supply Chain"
                    }
                }
            ],
            "vague_claims_list": [
                {"claim_text": "We are committed to exploring options to reduce our environmental footprint in the future."},
                {"claim_text": "We aim to be a leader in sustainable eco-friendly infrastructure by 2050."}
            ]
        }

    if id not in audit_status:
        return JSONResponse(status_code=404, content={"message": "Audit ID not found"})

    state = audit_status[id]
    score_result = state.get("score_result")

    if not score_result:
        return JSONResponse(status_code=400, content={"message": "Audit has not been scored yet."})

    # Metrics
    all_claims = []
    if "result" in state:
        all_claims.extend(state["result"].get("claims", []))
    if "news_result" in state:
        for article in state["news_result"].get("articles", []):
            all_claims.extend(article.get("claims_extracted", []))

    vague_claims = []
    # Identify vague claims by matching deduction reasons or scanning the list
    # Reusing the basic keyword flagger from report generator to send them to UI
    vague_phrases = ["committed to", "we aim", "we aspire", "we plan", "working towards", "we believe", "we strive", "we hope", "in the future"]
    for c in all_claims:
        text = c.get("claim_text", "").lower()
        if any(p in text for p in vague_phrases):
            vague_claims.append(c)

    contradictions = state.get("contradiction_result", {}).get("contradictions", [])

    return {
        "audit_id": id,
        "overall_score": score_result.get("overall_score", 0),
        "integrity_label": score_result.get("integrity_label", "UNKNOWN"),
        "summary": score_result.get("summary", "No summary available."),
        "metrics": {
            "claims_analyzed": len(all_claims),
            "contradictions_found": len(contradictions),
            "vague_claims": len(vague_claims),
            "documents_reviewed": len(state.get("documents", []))
        },
        "category_scores": score_result.get("category_scores", []),
        "contradictions": score_result.get("top_risk_contradictions", []),
        "vague_claims_list": vague_claims
    }


@app.websocket("/ws/audit/{id}/progress")
async def audit_progress_ws(websocket: WebSocket, id: str):
    """
    Phase 9 — Live Audit WebSocket.
    Streams progress strings and cumulative stats to frontend iteratively.
    """
    await websocket.accept()
    try:
        while True:
            # Audit missing
            if id not in audit_status:
                await websocket.send_json({
                    "stage": "Waiting for audit to begin...",
                    "progress_percent": 0,
                    "claims_found": 0,
                    "contradictions_found": 0,
                    "documents_reviewed": 0,
                    "news_fetched": 0
                })
                await asyncio.sleep(1)
                continue

            state = audit_status[id]
            
            # Derived counts
            claims_count = 0
            # Docs
            if "result" in state:
                claims_count += len(state["result"].get("claims", []))
            # News
            news_count = 0
            if "news_result" in state:
                articles = state["news_result"].get("articles", [])
                news_count = len(articles)
                for a in articles:
                    claims_count += len(a.get("claims_extracted", []))
                    
            docs_count = len(state.get("documents", []))
            
            con_count = 0
            if "contradiction_result" in state:
                con_count = len(state["contradiction_result"].get("contradictions", []))
                
            # Derived stage and progress percent
            import datetime
            # Heuristic stage logic
            # Start from latest back to earliest
            if "score_result" in state:
                stage = "📋 Generating forensic report..."
                prog = 95
            elif "contradiction_result" in state:
                stage = "📊 Calculating integrity score..."
                prog = 75
            elif "news_result" in state:
                stage = "🧠 Analyzing contradictions..."
                prog = 50
            elif state.get("status") == "completed":
                stage = "📰 Fetching live news..."
                prog = 35
            elif state.get("status") == "processing":
                stage = "🔍 Extracting ESG claims..."
                prog = 20
            else:
                stage = "📄 Parsing documents..."
                prog = 5

            await websocket.send_json({
                "stage": stage,
                "progress_percent": prog,
                "claims_found": claims_count,
                "contradictions_found": con_count,
                "documents_reviewed": docs_count,
                "news_fetched": news_count
            })
            await asyncio.sleep(1)

    except WebSocketDisconnect:
        print(f"[WS] Client disconnected from audit {id}")
    except Exception as e:
        print(f"[WS] Error on audit {id}: {str(e)}")
        try:
            await websocket.close()
        except:
            pass
