# ============================================================================
# EXAMPLE AGENT - Automotive Industry (Template/Fallback)
# ============================================================================
# This is an example catchall/fallback agent for automotive cost optimization.
# This serves as a template for creating your own catchall agent.
# See SETUP.md and .cursor/rules/ for instructions on generating new agents.
# ============================================================================

from __future__ import annotations

from agents.base import AgentSpec, BaseAgent
from llm.client import Settings, get_model_client


def create_catchall(settings: Settings, system_prompt: str) -> BaseAgent:
    model_name = settings.defaults.get("catchall_model", "primary")
    client = get_model_client(settings, model_name)
    spec = AgentSpec(
        name="catchall",
        system_prompt=system_prompt,
        model_name=model_name,
        tools={},
    )
    return BaseAgent(spec, client)