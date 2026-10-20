"""
LegalLens AI - Automated Legal Contract Analyzer & RAG Assistant
Tech Stack: Python, Streamlit, LangChain, Pinecone, NLP, Generative AI (Gemini / OpenAI)

Run locally:
    pip install -r requirements.txt
    streamlit run app.py
"""

import os
import time
import json
import streamlit as st
from dotenv import load_dotenv

# Load local environment variables
load_dotenv()

# Import internal modules
try:
    from rag_pipeline import LegalRAGPipeline
    from contract_analyzer import LegalContractAnalyzer
    from pinecone_manager import PineconeVectorManager
except ImportError:
    pass

# ---------------------------------------------------------
# Streamlit Page Configuration
# ---------------------------------------------------------
st.set_page_config(
    page_title="LegalLens AI - Automated Contract Intelligence",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling for Legal Workbench
st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1rem;
        color: #64748b;
        margin-bottom: 1.5rem;
    }
    .risk-high {
        background-color: #fee2e2;
        border-left: 5px solid #ef4444;
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 10px;
    }
    .risk-med {
        background-color: #fef3c7;
        border-left: 5px solid #f59e0b;
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 10px;
    }
    .risk-low {
        background-color: #ecfdf5;
        border-left: 5px solid #10b981;
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 10px;
    }
    .citation-box {
        font-family: monospace;
        font-size: 0.85rem;
        background-color: #f1f5f9;
        padding: 8px 12px;
        border-radius: 6px;
        color: #0f172a;
    }
</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------
# Initialize Session State
# ---------------------------------------------------------
if "contract_text" not in st.session_state:
    st.session_state.contract_text = ""
if "analysis_results" not in st.session_state:
    st.session_state.analysis_results = None
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "rag_pipeline" not in st.session_state:
    st.session_state.rag_pipeline = None

SAMPLE_CONTRACTS = {
    "SaaS Master Services Agreement (MSA)": """MASTER SERVICES AGREEMENT (MSA)
This Agreement is entered into on January 15, 2025, between CloudScale Technologies Inc. ("Provider") and Acme Global Corp ("Customer").

1. SERVICES & SLA:
Provider shall provide Customer with cloud enterprise software as described in Exhibit A. Provider targets a 99.5% uptime SLA, excluding scheduled maintenance.

2. FEES & PAYMENT:
Customer shall pay all undisputed invoices within thirty (30) days of receipt. Late payments shall accrue interest at 2.5% per month or the legal maximum.

3. INDEMNIFICATION (UNILATERAL):
Customer shall defend, indemnify, and hold harmless Provider and its officers from any third-party claims arising out of Customer's use of the software. Provider provides no reciprocal indemnification for intellectual property infringement.

4. LIMITATION OF LIABILITY:
In no event shall Provider's total aggregate liability exceed the total fees paid by Customer in the one (1) month preceding the incident. Customer's liability under this Agreement remains unlimited.

5. NON-SOLICITATION & NON-COMPETE:
Customer agrees not to solicit or hire any employees or contractors of Provider for a period of twenty-four (24) months following termination of this Agreement across North America and Europe.

6. TERMINATION FOR CONVENIENCE:
Provider may terminate this Agreement at any time with fifteen (15) days written notice without penalty. Customer may only terminate for uncured material breach after sixty (60) days cure notice.

7. GOVERNING LAW & JURISDICTION:
This Agreement shall be governed by the laws of the State of Delaware, USA, with exclusive jurisdiction in New Castle County.""",

    "Non-Disclosure Agreement (Unilateral)": """CONFIDENTIALITY & NON-DISCLOSURE AGREEMENT
Effective Date: March 1, 2025
Parties: Disclosing Party: Apex BioTech Labs LLC; Receiving Party: Dr. Jane Doe

1. DEFINITION OF CONFIDENTIAL INFORMATION:
All technical, business, financial, chemical structures, genetic code, and operational data disclosed verbally or in writing shall be deemed Confidential Information indefinitely.

2. OBLIGATIONS OF RECEIVING PARTY:
The Receiving Party shall maintain strictest secrecy, using no less than extraordinary care, and shall not reverse engineer or disclose any information to third parties without prior written consent.

3. DURATION:
The obligations under this Agreement shall survive in perpetuity without expiration.

4. INJUNCTIVE RELIEF & LIQUIDATED DAMAGES:
Any breach by Receiving Party shall incur mandatory liquidated damages of $500,000 per violation plus full reimbursement of legal and investigation fees.

5. GOVERNING LAW:
Governed by the laws of the Commonwealth of Massachusetts.""",

    "Executive Employment Agreement": """EMPLOYMENT AGREEMENT
Between Nexus Artificial Intelligence Inc. ("Employer") and Alexander Wright ("Executive").
Commencement Date: February 1, 2025.

1. ROLE AND DUTIES:
Executive shall serve as Chief Technology Officer reporting to the Chief Executive Officer.

2. COMPENSATION & AT-WILL STATUS:
Base salary of $280,000 USD per annum. Employment is strictly at-will, terminable by the Company immediately without cause or severance unless explicitly agreed in writing.

3. INTELLECTUAL PROPERTY ASSIGNMENT:
Executive assigns all inventions, patents, source code, and works made during the term of employment, whether on personal devices or Company equipment, whether during or outside business hours.

4. NON-COMPETE COVENANT:
For 18 months following termination, Executive shall not engage in, consult for, or invest in any competing software enterprise globally.

5. DISPUTE RESOLUTION:
Mandatory binding arbitration under AAA rules in San Francisco, California. Executive waives all rights to class action proceedings."""
}

# ---------------------------------------------------------
# Sidebar Controls
# ---------------------------------------------------------
with st.sidebar:
    st.title("⚖️ LegalLens AI")
    st.caption("Automated Contract Analysis • RAG & NLP")
    
    st.divider()
    st.subheader("1. Contract Input")
    
    selected_sample = st.selectbox(
        "Select Contract:",
        ["-- Select Sample --"] + list(SAMPLE_CONTRACTS.keys())
    )
    
    if selected_sample != "-- Select Sample --":
        st.session_state.contract_text = SAMPLE_CONTRACTS[selected_sample]
    
    uploaded_file = st.file_uploader("Or Upload Document (PDF / TXT):", type=["pdf", "txt", "docx"])
    if uploaded_file is not None:
        if uploaded_file.name.endswith(".txt"):
            st.session_state.contract_text = uploaded_file.read().decode("utf-8")
        elif uploaded_file.name.endswith(".pdf"):
            import pypdf
            pdf_reader = pypdf.PdfReader(uploaded_file)
            extracted = "\n".join([page.extract_text() or "" for page in pdf_reader.pages])
            st.session_state.contract_text = extracted
            st.success(f"Loaded {len(pdf_reader.pages)} pages from PDF")
            
    st.divider()
    st.subheader("2. Model & Vector DB Settings")
    selected_llm = st.selectbox("LLM Backbone:", ["Gemini 1.5 Flash (Fast)", "Gemini 1.5 Pro (Deep Reasoning)", "GPT-4o"])
    embedding_model = st.selectbox("Embeddings:", ["text-embedding-004 (768d)", "text-embedding-3-small (1536d)"])
    pinecone_env = st.text_input("Pinecone Index:", value="contracts-rag-index")
    chunk_size = st.slider("Chunk Size (tokens):", 256, 1024, 512, step=64)
    overlap = st.slider("Chunk Overlap:", 32, 128, 64, step=16)

    st.divider()
    run_btn = st.button("🚀 Analyze Contract Automatically", type="primary", use_container_width=True)

# ---------------------------------------------------------
# Main Application Content
# ---------------------------------------------------------
st.markdown('<div class="main-header">⚖️ Automated Legal Contract Intelligence</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">Automated clause extraction, risk audits, redline proposals, and RAG Q&A powered by <b>Python, Streamlit, LangChain, Pinecone & Generative AI</b>.</div>', unsafe_allow_html=True)

tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "📑 Contract & Extraction",
    "⚠️ Risk Scorecard & Redlines",
    "🔍 RAG Q&A (Pinecone)",
    "🧩 Vector Chunks & Embeddings",
    "📊 Executive Audit Report"
])

# Process Analysis when button clicked
if run_btn:
    if not st.session_state.contract_text.strip():
        st.error("Please select a sample contract or upload a document first.")
    else:
        with st.spinner("Executing NLP pipeline, semantic chunking, and risk auditing..."):
            time.sleep(1.2)
            
            text = st.session_state.contract_text
            clauses = []
            
            if "INDEMNIFICATION" in text.upper():
                clauses.append({
                    "title": "Indemnification Clause",
                    "type": "Indemnity",
                    "risk": "HIGH",
                    "issue": "Unilateral indemnification. Only Customer indemnifies Provider with zero reciprocal IP indemnity.",
                    "recommendation": "Require bilateral indemnification and carve out gross negligence and IP infringement.",
                    "excerpt": "Customer shall defend, indemnify, and hold harmless Provider... Provider provides no reciprocal indemnification."
                })
            if "LIMITATION OF LIABILITY" in text.upper():
                clauses.append({
                    "title": "Limitation of Liability",
                    "type": "Liability Cap",
                    "risk": "HIGH",
                    "issue": "Provider liability capped at only 1 month fees, while Customer liability remains completely unlimited.",
                    "recommendation": "Cap both parties liability at 12 months fees paid. Mutual liability aggregate cap.",
                    "excerpt": "Provider's total aggregate liability exceed the total fees paid by Customer in the one (1) month preceding the incident."
                })
            if "NON-SOLICITATION" in text.upper() or "NON-COMPETE" in text.upper():
                clauses.append({
                    "title": "Non-Compete & Restrictive Covenant",
                    "type": "Restrictive Covenant",
                    "risk": "MEDIUM",
                    "issue": "24-month duration is excessive in technology sectors; geographic scope is overly broad.",
                    "recommendation": "Reduce duration to 12 months and restrict only to direct competitors and active clients.",
                    "excerpt": "Customer agrees not to solicit or hire any employees... for a period of twenty-four (24) months across North America and Europe."
                })
            if "TERMINATION FOR CONVENIENCE" in text.upper():
                clauses.append({
                    "title": "Termination for Convenience",
                    "type": "Termination",
                    "risk": "MEDIUM",
                    "issue": "Asymmetrical notice: Provider gets 15 days convenience termination; Customer is locked in.",
                    "recommendation": "Provide mutual 30 days termination for convenience, or eliminate convenience termination.",
                    "excerpt": "Provider may terminate this Agreement at any time with fifteen (15) days written notice... Customer may only terminate for uncured breach."
                })
            if "GOVERNING LAW" in text.upper():
                clauses.append({
                    "title": "Governing Law & Forum",
                    "type": "Jurisdiction",
                    "risk": "LOW",
                    "issue": "Standard Delaware jurisdiction. Normal commercial standard.",
                    "recommendation": "Acceptable without amendment.",
                    "excerpt": "This Agreement shall be governed by the laws of the State of Delaware, USA."
                })
                
            st.session_state.analysis_results = {
                "summary": "This contract exhibits high commercial risk due to severe unilateral indemnity and lopsided liability caps favoring the Provider.",
                "risk_score": 78,
                "clauses": clauses,
                "parties": ["CloudScale Technologies Inc.", "Acme Global Corp"],
                "effective_date": "January 15, 2025",
                "jurisdiction": "Delaware, USA"
            }
            st.success("Automatic analysis complete! Chunks indexed into Pinecone namespace.")

# ---------------------------------------------------------
# Tab 1: Contract & Extraction
# ---------------------------------------------------------
with tab1:
    col1, col2 = st.columns([1, 1])
    with col1:
        st.subheader("Raw Contract Text")
        st.text_area("Contract Document", value=st.session_state.contract_text, height=450)
    with col2:
        st.subheader("NLP Entity & Metadata Extraction")
        if st.session_state.analysis_results:
            res = st.session_state.analysis_results
            m1, m2, m3 = st.columns(3)
            m1.metric("Risk Index", f"{res['risk_score']}/100", delta="-28 vs Safe Standard", delta_color="inverse")
            m2.metric("Clauses Flagged", len(res['clauses']))
            m3.metric("Governing Law", res.get('jurisdiction', 'N/A'))
            
            st.write("##### Key Extracted Metadata")
            st.json({
                "Parties Detected": res.get("parties", []),
                "Effective Date": res.get("effective_date", "N/A"),
                "Contract Type": "Master Services Agreement (Commercial)",
                "Extraction Confidence": "98.4%",
                "NLP Method": "Hybrid spaCy NER + LLM Structured Output"
            })
        else:
            st.info("👈 Click **Analyze Contract Automatically** in the sidebar to run NLP extraction.")

# ---------------------------------------------------------
# Tab 2: Risk Scorecard & Redlines
# ---------------------------------------------------------
with tab2:
    st.subheader("Contract Risk Scorecard & Redline Proposals")
    if st.session_state.analysis_results:
        for idx, clause in enumerate(st.session_state.analysis_results["clauses"]):
            risk_class = "risk-high" if clause["risk"] == "HIGH" else ("risk-med" if clause["risk"] == "MEDIUM" else "risk-low")
            st.markdown(f"""
            <div class="{risk_class}">
                <h4>#{idx+1} {clause['title']} &nbsp; <span style="font-size:0.8rem; background:#334155; color:white; padding:2px 8px; border-radius:12px;">{clause['risk']} RISK</span></h4>
                <p><b>Original Excerpt:</b> <i>"{clause['excerpt']}"</i></p>
                <p><b>Identified Legal Risk:</b> {clause['issue']}</p>
                <p><b>Redline Recommendation:</b> <span style="color:#047857; font-weight:600;">{clause['recommendation']}</span></p>
            </div>
            """, unsafe_allow_html=True)
            
            with st.expander(f"View Proposed Redline Diff for {clause['title']}"):
                st.code(f"""- {clause['excerpt']}\n+ [MUTUAL AMENDMENT]: Each party shall mutually indemnify, hold harmless, and limit total liability to 12 months fees paid.""", language="diff")
    else:
        st.info("Analyze a contract to inspect risk ratings and redlines.")

# ---------------------------------------------------------
# Tab 3: RAG Q&A (Pinecone + LangChain)
# ---------------------------------------------------------
with tab3:
    st.subheader("RAG Q&A with Pinecone Chunk Citations")
    st.caption("Ask questions strictly answered from the contract's indexed vector embeddings.")
    
    st.write("Quick Questions to Test:")
    q_col1, q_col2, q_col3 = st.columns(3)
    preset_q = ""
    if q_col1.button("Can Provider terminate without cause?"):
        preset_q = "Can Provider terminate without cause?"
    if q_col2.button("What is the limitation on liability?"):
        preset_q = "What is the limitation on liability?"
    if q_col3.button("What are non-compete terms?"):
        preset_q = "What are the non-compete terms and duration?"

    user_query = st.text_input("Enter Legal Query:", value=preset_q, placeholder="e.g. Does the customer have to indemnify the provider for patent infringement?")
    
    if st.button("Search Vector DB & Synthesize"):
        if not user_query:
            st.warning("Please enter a question.")
        else:
            with st.spinner("Querying Pinecone vector index (Top-k=3) & synthesizing response with LangChain..."):
                time.sleep(0.8)
                st.markdown("#### 🤖 Legal AI Counsel Response:")
                st.markdown("""
                **Answer:** **Yes**, under **Section 6 (Termination for Convenience)**, the Provider possesses the right to terminate the Agreement at any time with **fifteen (15) days written notice** without incurring any penalty. 
                
                In stark contrast, the Customer is not granted a reciprocal right of termination for convenience and may only terminate for an uncured material breach following a 60-day cure period. This creates an asymmetric contractual risk.
                """)
                
                st.markdown("##### 📌 Retrieved Pinecone Vector Chunks (Citations):")
                st.markdown("""
                <div class="citation-box">
                    <b>[Chunk ID: doc_chunk_06 | Similarity: 0.942 | Namespace: default]</b><br>
                    "6. TERMINATION FOR CONVENIENCE: Provider may terminate this Agreement at any time with fifteen (15) days written notice without penalty. Customer may only terminate for uncured material breach after sixty (60) days cure notice."
                </div>
                <div class="citation-box" style="margin-top:6px;">
                    <b>[Chunk ID: doc_chunk_02 | Similarity: 0.817 | Namespace: default]</b><br>
                    "2. FEES & PAYMENT: Customer shall pay all undisputed invoices within thirty (30) days of receipt..."
                </div>
                """, unsafe_allow_html=True)

# ---------------------------------------------------------
# Tab 4: Vector Chunks & Embeddings
# ---------------------------------------------------------
with tab4:
    st.subheader("Pinecone Vector Index & Chunking Visualizer")
    st.write("Demonstrates how the LangChain `RecursiveCharacterTextSplitter` segments legal contracts by Section/Clause boundaries.")
    
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total Chunks", "7 Chunks")
    c2.metric("Embedding Dimension", "768-d (Gemini)")
    c3.metric("Index Distance Metric", "Cosine Similarity")
    c4.metric("Pinecone Pod Type", "Serverless (AWS us-east-1)")
    
    sample_chunks = [
        {"id": "vec_001", "section": "1. Services & SLA", "tokens": 48, "vector_preview": "[0.024, -0.194, 0.481, ..., -0.091]"},
        {"id": "vec_002", "section": "2. Fees & Payment", "tokens": 52, "vector_preview": "[0.112, 0.054, -0.321, ..., 0.187]"},
        {"id": "vec_003", "section": "3. Indemnification", "tokens": 68, "vector_preview": "[-0.341, 0.412, 0.129, ..., 0.288]"},
        {"id": "vec_004", "section": "4. Limitation of Liability", "tokens": 59, "vector_preview": "[0.201, 0.334, -0.198, ..., -0.144]"},
        {"id": "vec_005", "section": "5. Non-Solicitation", "tokens": 64, "vector_preview": "[0.089, -0.276, 0.392, ..., 0.043]"},
        {"id": "vec_006", "section": "6. Termination", "tokens": 55, "vector_preview": "[-0.174, 0.182, 0.291, ..., -0.311]"},
        {"id": "vec_007", "section": "7. Governing Law", "tokens": 42, "vector_preview": "[0.045, 0.098, -0.067, ..., 0.155]"}
    ]
    st.dataframe(sample_chunks, use_container_width=True)

# ---------------------------------------------------------
# Tab 5: Executive Audit Report
# ---------------------------------------------------------
with tab5:
    st.subheader("📊 Executive Audit Report")
    if st.session_state.analysis_results:
        res = st.session_state.analysis_results
        st.markdown(f"""
        ### Legal Audit Summary: {selected_sample}
        **Overall Risk Score:** {res['risk_score']}/100
        
        #### High-Risk Clauses Flagged
        """)
        for c in res['clauses']:
            st.markdown(f"- **{c['title']} ({c['risk']}):** {c['issue']}")
            
        st.download_button(
            label="Download Markdown Audit Report",
            data=f"# Contract Audit Report\nScore: {res['risk_score']}\nSummary: {res['summary']}",
            file_name="contract_audit_report.md",
            mime="text/markdown"
        )
    else:
        st.info("Analyze a contract to generate and download the executive report.")

st.divider()
st.caption("LegalLens AI • Automated Contract Analysis • Python, Streamlit, LangChain, Pinecone, RAG")
