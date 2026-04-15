"""
AI service — Groq-backed natural language helpers for VecAdmin.

Capabilities
────────────
  nl_to_query()      — convert plain English to a provider-native query
  explain_results()  — summarise query results in plain English

Provider awareness
──────────────────
  Generates GraphQL for Weaviate, JSON for Qdrant / ChromaDB / FAISS.
  Schema is injected into the prompt so the model uses real collection/field names.
"""

import json
from typing import Any, Dict, List, Optional

from app.config import settings

try:
    from groq import Groq
    _GROQ_AVAILABLE = True
except ImportError:
    _GROQ_AVAILABLE = False


# ── Prompt builders ────────────────────────────────────────────────────────────

def _schema_summary(schema: List[Dict[str, Any]]) -> str:
    """Turn the /schema classes list into a compact text block for the prompt."""
    lines = []
    for cls in schema[:10]:  # cap to avoid huge context
        props = ", ".join(p["name"] for p in cls.get("properties", [])[:10])
        lines.append(f"  - {cls['name']} (fields: {props})")
    return "\n".join(lines) if lines else "  (no collections found)"


def _nl_to_query_prompt(
    natural_language: str,
    provider: str,
    query_language: str,
    schema_classes: List[Dict[str, Any]],
) -> str:
    schema_text = _schema_summary(schema_classes)

    if query_language == "graphql":
        format_instructions = """Return ONLY valid Weaviate GraphQL — no explanation, no markdown fences, no extra text.
Rules:
  - Use Get {{ ... }} for list queries
  - Use Aggregate {{ ... }} for counts
  - Always include _additional {{ id }} in Get queries
  - Use nearText for semantic search
  - Limit to 10 unless user specifies otherwise"""
        example = '{\n  Get {\n    Products(limit: 10) {\n      name\n      _additional { id }\n    }\n  }\n}'
    else:
        format_instructions = f"""Return ONLY a valid JSON object — no explanation, no markdown fences, no extra text.
Rules:
  - Always include "collection" (string) and "limit" (int, default 10)
  - For field filters use "where": {{"fieldName": {{"$eq": "value"}}}}
  - For vector search use "query_vector": [array of floats] with "limit"
  - For pagination use "offset": int
  - Provider is {provider}"""
        example = '{"collection": "Products", "limit": 10}'

    return f"""You are a database query assistant for {provider} ({query_language.upper()}).

Available collections:
{schema_text}

{format_instructions}

Example output:
{example}

User request: {natural_language}

Query:"""


def _explain_prompt(
    query: str,
    results: Dict[str, Any],
    provider: str,
) -> str:
    # Truncate results so we don't blow the context window
    results_str = json.dumps(results, indent=2)
    if len(results_str) > 3000:
        results_str = results_str[:3000] + "\n... (truncated)"

    return f"""You are a helpful data analyst assistant.

A user ran the following {provider} query:
{query}

Results returned:
{results_str}

Write a concise plain-English summary (3–5 sentences max) that:
1. States how many records were returned and from which collection
2. Highlights key patterns, values, or noteworthy items in the data
3. Mentions anything unusual or empty

Be friendly and direct. No markdown, no bullet points — just clear prose."""


# ── Service class ──────────────────────────────────────────────────────────────

class AIService:
    def __init__(self) -> None:
        self._client: Optional[Any] = None

    @property
    def available(self) -> bool:
        return _GROQ_AVAILABLE and bool(settings.GROQ_API_KEY)

    def _get_client(self):
        if not _GROQ_AVAILABLE:
            raise RuntimeError("groq package not installed. Run: pip install groq")
        if not settings.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is not set in .env")
        if self._client is None:
            self._client = Groq(api_key=settings.GROQ_API_KEY)
        return self._client

    def _chat(self, prompt: str, max_tokens: int = 512) -> str:
        client = self._get_client()
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=min(max_tokens, settings.GROQ_MAX_TOKENS),
            temperature=0.1,  # low temp = deterministic, correct queries
        )
        return response.choices[0].message.content.strip()

    def nl_to_query(
        self,
        natural_language: str,
        provider: str,
        query_language: str,
        schema_classes: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Convert a natural language request to a provider-native query string."""
        if not self.available:
            return {"error": "AI not configured. Add GROQ_API_KEY to .env"}
        try:
            prompt = _nl_to_query_prompt(
                natural_language, provider, query_language, schema_classes
            )
            raw = self._chat(prompt, max_tokens=400)

            # Strip accidental markdown fences if model adds them
            raw = raw.strip()
            if raw.startswith("```"):
                raw = "\n".join(
                    line for line in raw.splitlines()
                    if not line.startswith("```")
                ).strip()

            return {"query": raw}
        except Exception as exc:
            return {"error": str(exc)}

    def explain_results(
        self,
        query: str,
        results: Dict[str, Any],
        provider: str,
    ) -> Dict[str, Any]:
        """Return a plain-English explanation of query results."""
        if not self.available:
            return {"error": "AI not configured. Add GROQ_API_KEY to .env"}
        try:
            prompt = _explain_prompt(query, results, provider)
            explanation = self._chat(prompt, max_tokens=300)
            return {"explanation": explanation}
        except Exception as exc:
            return {"error": str(exc)}


ai_service = AIService()
