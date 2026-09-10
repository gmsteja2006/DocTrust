from __future__ import annotations

import os
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.rag_pipeline import get_rag_pipeline

router = APIRouter(prefix="", tags=["settings"])


class ProviderUpdateRequest(BaseModel):
    provider: Literal["ollama", "groq"]


class SettingsResponse(BaseModel):
    provider: str
    model: str
    ollama_base_url: str
    ollama_model: str
    groq_model: str
    groq_configured: bool


@router.get("/settings", response_model=SettingsResponse)
async def get_settings() -> SettingsResponse:
    """Return the current LLM provider configuration."""
    pipeline = get_rag_pipeline()
    return SettingsResponse(
        provider=pipeline.llm_provider,
        model=pipeline.active_model,
        ollama_base_url=pipeline.ollama_base_url,
        ollama_model=pipeline.ollama_model,
        groq_model=pipeline.groq_model,
        groq_configured=bool(pipeline.groq_api_key),
    )


@router.post("/settings/provider", response_model=SettingsResponse)
async def set_provider(body: ProviderUpdateRequest) -> SettingsResponse:
    """Switch the active LLM provider at runtime without restarting the server."""
    pipeline = get_rag_pipeline()
    pipeline.llm_provider = body.provider

    if body.provider == "ollama":
        pipeline.llm_model = pipeline.ollama_model
        pipeline.llm_api_url = f"{pipeline.ollama_base_url.rstrip('/')}/v1/chat/completions"
    else:
        pipeline.llm_model = pipeline.groq_model
        from app.services.rag_pipeline import GROQ_API_URL
        pipeline.llm_api_url = GROQ_API_URL

    return SettingsResponse(
        provider=pipeline.llm_provider,
        model=pipeline.active_model,
        ollama_base_url=pipeline.ollama_base_url,
        ollama_model=pipeline.ollama_model,
        groq_model=pipeline.groq_model,
        groq_configured=bool(pipeline.groq_api_key),
    )
