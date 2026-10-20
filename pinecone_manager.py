"""
LegalLens AI - Pinecone Vector Store Manager
Handles Index lifecycle, dense embeddings upserts, namespace segmentation, and hybrid filtering.
"""

import os
from typing import List, Dict, Any, Optional
from pinecone import Pinecone, ServerlessSpec

class PineconeVectorManager:
    def __init__(
        self,
        index_name: str = "legal-contracts-index",
        dimension: int = 768,
        metric: str = "cosine"
    ):
        self.api_key = os.getenv("PINECONE_API_KEY", "")
        self.index_name = index_name
        self.dimension = dimension
        self.metric = metric
        self.pc = Pinecone(api_key=self.api_key) if self.api_key else None
        self.index = None
        if self.pc:
            self._ensure_index()

    def _ensure_index(self):
        existing = [i.name for i in self.pc.list_indexes()]
        if self.index_name not in existing:
            self.pc.create_index(
                name=self.index_name,
                dimension=self.dimension,
                metric=self.metric,
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )
        self.index = self.pc.Index(self.index_name)

    def upsert_contract_vectors(
        self,
        vectors: List[Dict[str, Any]],
        namespace: str
    ) -> int:
        if not self.index:
            return 0
        formatted = [
            (v["id"], v["values"], v["metadata"])
            for v in vectors
        ]
        self.index.upsert(vectors=formatted, namespace=namespace)
        return len(vectors)

    def similarity_search(
        self,
        query_vector: List[float],
        namespace: str,
        top_k: int = 4,
        filter_criteria: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        if not self.index:
            return []
        
        response = self.index.query(
            vector=query_vector,
            top_k=top_k,
            namespace=namespace,
            filter=filter_criteria,
            include_metadata=True
        )
        return response.matches
