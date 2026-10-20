"""
LegalLens AI - Contract NLP Analyzer & Entity Extraction Engine
Tech Stack: Python, spaCy, Regex, NLP Rule-based + LLM Extraction
"""

import re
from typing import Dict, List, Any

class LegalContractAnalyzer:
    CLAUSE_PATTERNS = {
        "Indemnity": [r"indemnif\w+", r"hold harmless", r"defend and hold harmless"],
        "Limitation of Liability": [r"limitation of liability", r"aggregate liability", r"consequential damages"],
        "Termination": [r"termination for convenience", r"termination for cause", r"notice of termination"],
        "Non-Compete / Non-Solicit": [r"non-compete", r"covenant not to compete", r"non-solicitation", r"solicit or hire"],
        "Confidentiality": [r"confidential information", r"non-disclosure", r"proprietary information"],
        "Governing Law": [r"governed by the laws of", r"jurisdiction of", r"exclusive venue"]
    }

    @classmethod
    def extract_entities(cls, text: str) -> Dict[str, Any]:
        date_match = re.search(r"(?:effective date|entered into on|dated as of)[:\s]+([A-Za-z]+ \d{1,2}, \d{4})", text, re.IGNORECASE)
        effective_date = date_match.group(1) if date_match else "Not explicitly specified"

        law_match = re.search(r"(?:laws of(?: the State of| the Commonwealth of)?)\s+([A-Za-z\s]+?)(?:,|\.|\sand\b)", text, re.IGNORECASE)
        governing_law = law_match.group(1).strip() if law_match else "Not found"

        amounts = re.findall(r"\$\s?[\d,]+(?:\.\d{2})?|\b\d+\s?USD\b", text)
        notice_periods = re.findall(r"\b(\d{1,3})\s+(?:days?|business days|months?)\s+(?:written\s+)?notice\b", text, re.IGNORECASE)

        return {
            "effective_date": effective_date,
            "governing_law": governing_law,
            "monetary_values": list(set(amounts)),
            "notice_periods": list(set(notice_periods))
        }

    @classmethod
    def analyze_risks(cls, text: str) -> Dict[str, Any]:
        risks = []
        overall_score = 30

        if re.search(r"customer shall (?:defend|indemnify)", text, re.IGNORECASE):
            if not re.search(r"provider shall (?:defend|indemnify)", text, re.IGNORECASE):
                risks.append({
                    "clause": "Indemnification",
                    "severity": "HIGH",
                    "issue": "Unilateral indemnification obligation imposed exclusively on Customer.",
                    "explanation": "Standard B2B SaaS agreements require the Provider to indemnify against intellectual property infringement claims.",
                    "redline": "Make indemnification bilateral; Provider must defend against third-party IP infringement."
                })
                overall_score += 25

        if re.search(r"one \(1\) month|30 days fees", text, re.IGNORECASE) and "liability" in text.lower():
            risks.append({
                "clause": "Limitation of Liability",
                "severity": "HIGH",
                "issue": "Provider's liability is capped at merely 1 month of fees; Customer's liability is uncapped.",
                "explanation": "Market standard is mutual liability capped at 12 months fees paid. A 1-month cap leaves Customer unprotected in case of major breach or data loss.",
                "redline": "Establish mutual liability cap of 12 months fees paid; exempt IP indemnity and confidentiality breaches from cap."
            })
            overall_score += 25

        if re.search(r"provider may terminate.*convenience", text, re.IGNORECASE):
            if not re.search(r"customer may terminate.*convenience", text, re.IGNORECASE):
                risks.append({
                    "clause": "Termination for Convenience",
                    "severity": "MEDIUM",
                    "issue": "Provider has unilateral right to cancel with short notice, causing vendor lock-in and business disruption.",
                    "explanation": "Customer invests substantial onboarding cost; unilateral provider termination creates operational fragility.",
                    "redline": "Require either mutual 60-day notice for convenience or remove convenience termination entirely."
                })
                overall_score += 15

        duration_match = re.search(r"(\d+)\s+months\s+(?:following|after)\s+termination", text, re.IGNORECASE)
        if duration_match and int(duration_match.group(1)) > 12:
            risks.append({
                "clause": "Restrictive Covenant (Non-Compete)",
                "severity": "MEDIUM",
                "issue": f"{duration_match.group(1)}-month restrictive covenant is excessively restrictive.",
                "explanation": "Courts frequently void non-competes longer than 12 months unless accompanied by substantial garden leave compensation.",
                "redline": "Reduce restrictive covenant to 12 months and limit strictly to direct competitors."
            })
            overall_score += 10

        return {
            "risk_score": min(overall_score, 100),
            "risk_tier": "HIGH" if overall_score >= 70 else ("MEDIUM" if overall_score >= 45 else "LOW"),
            "flagged_clauses": risks
        }
