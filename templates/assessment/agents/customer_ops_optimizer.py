# ============================================================================
# Customer Ops Optimizer Agent – Software/Tech companies >$500M revenue
# ============================================================================
# Assesses optimization potential for Professional Services, Customer Success,
# and Customer Support using productivity, AI/agentic, and offshoring levers.
# ============================================================================

from __future__ import annotations

from agents.base import AgentSpec, BaseAgent
from llm.client import Settings, get_model_client


def create_customer_ops_optimizer(settings: Settings, system_prompt: str) -> BaseAgent:
    """Create the Customer Ops Optimizer agent with given settings and prompt."""
    model_name = settings.defaults.get("customer_ops_optimizer_model", "primary")
    client = get_model_client(settings, model_name)
    spec = AgentSpec(
        name="customer_ops_optimizer",
        system_prompt=system_prompt,
        model_name=model_name,
        tools={},
    )
    return BaseAgent(spec, client)