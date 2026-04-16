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

try:
    from openai import OpenAI
    _OPENAI_AVAILABLE = True
except ImportError:
    _OPENAI_AVAILABLE = False

try:
    import anthropic as _anthropic_module
    _ANTHROPIC_AVAILABLE = True
except ImportError:
    _ANTHROPIC_AVAILABLE = False


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
    elif provider.lower() == "qdrant":
        format_instructions = """Return ONLY a valid JSON object — no explanation, no markdown fences, no extra text.
Rules:
  - Always include "collection" (string) and "limit" (int, default 10)
  - For field filters use "filter": {"must": [{"key": "fieldName", "match": {"value": "someValue"}}]}
  - Multiple conditions: add more objects to the "must" array
  - For pagination use "offset": int
  - Do NOT use "where" or "$eq" — Qdrant uses "filter.must" syntax"""
        example = '{"collection": "Products", "filter": {"must": [{"key": "category", "match": {"value": "Electronics"}}]}, "limit": 10}'
    else:
        # ChromaDB and FAISS share the $eq / where syntax
        format_instructions = f"""Return ONLY a valid JSON object — no explanation, no markdown fences, no extra text.
Rules:
  - Always include "collection" (string) and "limit" (int, default 10)
  - For field filters use "where": {{"fieldName": {{"$eq": "value"}}}}
  - For vector/semantic search use "query_vector": [array of floats] with "limit"
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


# ── Low-level callers (one per provider) ─────────────────────────────────────

def _chat_groq(prompt: str, max_tokens: int) -> str:
    if not _GROQ_AVAILABLE:
        raise RuntimeError("groq package not installed — run: pip install groq")
    if not settings.GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not set in .env")
    client = Groq(api_key=settings.GROQ_API_KEY)
    resp = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=min(max_tokens, settings.GROQ_MAX_TOKENS),
        temperature=0.1,
    )
    return resp.choices[0].message.content.strip()


def _chat_openai(prompt: str, max_tokens: int) -> str:
    if not _OPENAI_AVAILABLE:
        raise RuntimeError("openai package not installed — run: pip install openai")
    if not settings.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not set in .env")
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    resp = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=0.1,
    )
    return resp.choices[0].message.content.strip()


def _chat_anthropic(prompt: str, max_tokens: int) -> str:
    if not _ANTHROPIC_AVAILABLE:
        raise RuntimeError("anthropic package not installed — run: pip install anthropic")
    if not settings.ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY is not set in .env")
    client = _anthropic_module.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    msg = client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text.strip()


def _chat_ollama(prompt: str, max_tokens: int) -> str:
    import json as _json
    import urllib.request as _req
    payload = _json.dumps({
        "model": settings.OLLAMA_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "options": {"num_predict": max_tokens},
    }).encode()
    req = _req.Request(
        f"{settings.OLLAMA_BASE_URL}/api/chat",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    with _req.urlopen(req, timeout=60) as r:
        data = _json.loads(r.read())
    return data["message"]["content"].strip()


# ── Service class ──────────────────────────────────────────────────────────────

class AIService:
    """Thin façade — delegates to the active AI_PROVIDER backend."""

    @property
    def available(self) -> bool:
        p = settings.AI_PROVIDER
        if p == "groq":      return _GROQ_AVAILABLE and bool(settings.GROQ_API_KEY)
        if p == "openai":    return _OPENAI_AVAILABLE and bool(settings.OPENAI_API_KEY)
        if p == "anthropic": return _ANTHROPIC_AVAILABLE and bool(settings.ANTHROPIC_API_KEY)
        if p == "ollama":    return True   # local — always try; fails gracefully at call time
        return False

    def _chat(self, prompt: str, max_tokens: int = 512) -> str:
        p = settings.AI_PROVIDER
        if p == "groq":      return _chat_groq(prompt, max_tokens)
        if p == "openai":    return _chat_openai(prompt, max_tokens)
        if p == "anthropic": return _chat_anthropic(prompt, max_tokens)
        if p == "ollama":    return _chat_ollama(prompt, max_tokens)
        raise ValueError(f"Unknown AI_PROVIDER '{p}'. Choose: groq | openai | anthropic | ollama")

    def _not_configured_msg(self) -> str:
        hints = {
            "groq":      "Add GROQ_API_KEY to .env (free at console.groq.com)",
            "openai":    "Add OPENAI_API_KEY to .env (platform.openai.com)",
            "anthropic": "Add ANTHROPIC_API_KEY to .env (console.anthropic.com)",
            "ollama":    "Start Ollama: ollama serve  (ollama.com)",
        }
        return f"AI not configured. {hints.get(settings.AI_PROVIDER, 'Set AI_PROVIDER in .env')}"

    def nl_to_query(
        self,
        natural_language: str,
        provider: str,
        query_language: str,
        schema_classes: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Convert a natural language request to a provider-native query string."""
        if not self.available:
            return {"error": self._not_configured_msg()}
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
            return {"error": self._not_configured_msg()}
        try:
            prompt = _explain_prompt(query, results, provider)
            explanation = self._chat(prompt, max_tokens=300)
            return {"explanation": explanation}
        except Exception as exc:
            return {"error": str(exc)}


ai_service = AIService()
