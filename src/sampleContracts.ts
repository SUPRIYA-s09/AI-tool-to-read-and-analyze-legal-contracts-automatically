export interface SampleContract {
  id: string;
  name: string;
  category: string;
  text: string;
  expectedRisks: string[];
}

export const SAMPLE_CONTRACTS: SampleContract[] = [
  {
    id: 'saas-msa',
    name: 'SaaS Master Services Agreement (MSA)',
    category: 'Commercial / B2B Software',
    expectedRisks: ['Unilateral Indemnity', '1-Month Liability Cap', '24-Month Non-Compete'],
    text: `MASTER SERVICES AGREEMENT (MSA)
This Agreement is entered into on January 15, 2025, between CloudScale Technologies Inc., a Delaware corporation ("Provider") and Acme Global Corp, a California corporation ("Customer").

1. SERVICES & SERVICE LEVELS:
Provider shall make the Cloud Enterprise Platform available to Customer pursuant to this Agreement and applicable Order Forms. Provider targets a 99.5% uptime SLA, excluding scheduled maintenance windows announced with 24 hours notice.

2. FEES, INVOICING & TAXES:
Customer shall pay all fees specified in Order Forms within thirty (30) days of receipt of invoice. Overdue payments shall accrue interest at the rate of 2.5% per month or the maximum rate permitted by law. Customer is responsible for all applicable taxes.

3. INDEMNIFICATION (UNILATERAL):
Customer shall defend, indemnify, and hold harmless Provider, its affiliates, and their respective directors, officers, and employees from and against any and all claims, losses, damages, liabilities, and expenses (including reasonable attorneys' fees) arising out of or related to Customer's use of the Platform or breach of this Agreement. Provider provides no reciprocal indemnification for third-party intellectual property infringement.

4. LIMITATION OF LIABILITY & DAMAGES EXCLUSION:
(a) In no event shall Provider's total aggregate liability arising out of or related to this Agreement exceed the total fees paid by Customer in the one (1) month immediately preceding the incident giving rise to liability.
(b) Customer's liability under this Agreement shall remain unlimited.
(c) Neither party shall be liable for indirect, incidental, special, or consequential damages, except for Customer's indemnity obligations.

5. NON-SOLICITATION & NON-COMPETE COVENANTS:
Customer covenants and agrees that during the term of this Agreement and for a period of twenty-four (24) months following termination or expiration, Customer shall not, directly or indirectly, solicit, hire, or engage any employee or contractor of Provider across North America and Europe.

6. TERMINATION FOR CONVENIENCE:
Provider may terminate this Agreement or any Order Form at any time for convenience with fifteen (15) days prior written notice to Customer without penalty or refund. Customer may only terminate this Agreement upon ninety (90) days prior written notice solely in the event of an uncured material breach by Provider.

7. INTELLECTUAL PROPERTY RIGHTS:
Provider retains all right, title, and interest in and to the Platform, including all intellectual property, updates, and feedback provided by Customer. Customer grants Provider an irrevocable, perpetual, royalty-free license to utilize Customer data for machine learning model training.

8. GOVERNING LAW & VENUE:
This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to conflict of law principles. Exclusive venue for any dispute shall be the state and federal courts located in New Castle County, Delaware.`
  },
  {
    id: 'nda',
    name: 'Unilateral Non-Disclosure Agreement (NDA)',
    category: 'Confidentiality / M&A',
    expectedRisks: ['Perpetual Confidentiality Term', 'Mandatory Liquidated Damages', 'Overbroad Scope'],
    text: `CONFIDENTIALITY AND PROPRIETARY INFORMATION AGREEMENT
Effective Date: March 1, 2025
Disclosing Party: Apex BioTech Labs LLC ("Company")
Receiving Party: Dr. Jane Doe ("Evaluator")

1. DEFINITION OF CONFIDENTIAL INFORMATION:
"Confidential Information" shall mean all technical data, trade secrets, research papers, chemical compounds, genetic sequences, business methods, customer lists, and financial projections disclosed orally, visually, or in writing. Any information disclosed without marking shall nevertheless be presumed confidential.

2. RECEIVING PARTY OBLIGATIONS:
The Receiving Party shall maintain strictest secrecy, using no less than extraordinary care, and shall not copy, disassemble, decompile, or reverse engineer any materials. Receiving Party shall not disclose any part of the information to any third party without prior unanimous written consent of Company's Board.

3. TERM AND DURATION:
The obligations of confidentiality, non-disclosure, and non-use set forth herein shall survive indefinitely and continue in perpetuity from the Effective Date without expiration.

4. REMEDIES & MANDATORY LIQUIDATED DAMAGES:
Receiving Party acknowledges that any disclosure causes irreparable harm. Receiving Party agrees to pay liquidated damages in the predetermined amount of $500,000 USD per violation, plus full indemnification for all legal fees, forensic investigations, and court costs.

5. GOVERNING LAW & JURISDICTION:
This Agreement shall be governed exclusively by the laws of the Commonwealth of Massachusetts, with mandatory venue in Suffolk County Superior Court.`
  },
  {
    id: 'employment',
    name: 'Executive Employment Agreement',
    category: 'HR / Employment',
    expectedRisks: ['Global Non-Compete', '24/7 IP Assignment', 'At-Will with No Severance'],
    text: `EXECUTIVE EMPLOYMENT AGREEMENT
This Executive Employment Agreement is made between Nexus Artificial Intelligence Inc. ("Employer") and Alexander Wright ("Executive").
Effective Date: February 1, 2025.

1. POSITION AND RESPONSIBILITIES:
Executive is employed as Chief Technology Officer (CTO). Executive agrees to devote 100% of productive time, attention, and effort to Employer's business.

2. COMPENSATION & TERMINATION:
Base salary shall be $280,000 annually. Employment is strictly "at-will." Employer may terminate Executive at any time, with or without cause or advance notice. Executive is not entitled to any severance, bonus vesting, or accelerated equity upon termination without cause.

3. COMPREHENSIVE IP ASSIGNMENT:
Executive hereby irrevocably assigns to Employer all inventions, discoveries, designs, software, algorithms, and works of authorship created or conceived during employment, whether on Employer premises, at home, on personal devices, or during non-working hours, whether related or unrelated to Employer's current business.

4. RESTRICTIVE COVENANTS (NON-COMPETE):
During employment and for eighteen (18) months following termination for any reason, Executive shall not directly or indirectly own, manage, advise, consult with, or be employed by any enterprise engaged in generative AI, machine learning, or software development globally.

5. ARBITRATION & CLASS ACTION WAIVER:
Any controversy or claim arising out of or relating to this Agreement shall be settled by binding arbitration in San Francisco, California under JAMS rules. Executive expressly waives any right to participate in a class or representative action.`
  }
];
