from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional, Tuple

from llm.client import LLMClient


Tool = Callable[[str, Dict[str, Any]], str]


@dataclass
class AgentSpec:
    name: str
    system_prompt: str
    model_name: str
    tools: Optional[Dict[str, Tool]] = None


class BaseAgent:
    def __init__(self, spec: AgentSpec, model_client: LLMClient):
        self.spec = spec
        self.client = model_client

    def call_tool(self, tool_name: str, query: str, context: Dict[str, Any]) -> str:
        if not self.spec.tools or tool_name not in self.spec.tools:
            return ""
        return self.spec.tools[tool_name](query, context)

    def run(
        self,
        objective: str,
        working_notes: str,
        retrieved_context: str = "",
        hints: Optional[str] = None,
    ) -> str:
        messages: List[Tuple[str, str]] = [
            ("user", f"Objective:\n{objective}"),
            ("user", f"Working notes so far:\n{working_notes or '(none)'}"),
        ]
        if retrieved_context:
            messages.append(("user", f"Relevant context from files:\n{retrieved_context}"))
        if hints:
            messages.append(("user", f"Hints:\n{hints}"))
        return self.client.generate(system_prompt=self.spec.system_prompt, messages=messages)