from __future__ import annotations

import json
import re
import yaml
from pathlib import Path
from typing import Optional, Literal, Dict, List, Any
from dataclasses import dataclass

from agents.catchall import create_catchall
from agents.electricalarch import create_electricalarch
from agents.customer_ops_optimizer import create_customer_ops_optimizer
from llm.client import Settings, get_model_client


@dataclass
class AgentRoute:
    """Configuration for agent routing"""
    name: str
    keywords: List[str]
    description: str


def load_prompt(path: str) -> str:
    """
    Load a prompt file from the specified path.
    
    Args:
        path: Path to the prompt file
        
    Returns:
        The prompt content as a string
    """
    with open(path, "r", encoding="utf-8") as f:
        return f.read().strip()


def load_routing_config(path: str = "configs/routing.yaml") -> List[AgentRoute]:
    """
    Load agent routing configuration from YAML file.

    Args:
        path: Path to routing configuration file

    Returns:
        List of AgentRoute objects defining routing rules
    """
    with open(path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    routes = []
    for agent_config in config.get("routing", {}).get("agents", []):
        routes.append(AgentRoute(
            name=agent_config["name"],
            keywords=agent_config.get("keywords", []),
            description=agent_config.get("description", "")
        ))

    return routes


def load_reference_dictionaries(reference_dir: str = "reference/electricalarch") -> str:
    """
    Load all JSON reference dictionaries from the specified directory.
    Returns a formatted string containing all reference design information.
    
    Args:
        reference_dir: Path to the directory containing JSON reference dictionaries
        
    Returns:
        Formatted string with all reference designs, or empty string if none found
    """
    reference_path = Path(reference_dir)
    
    if not reference_path.exists():
        return ""
    
    # Find all JSON files in the directory
    json_files = sorted(reference_path.glob("*.json"))
    
    if not json_files:
        return ""
    
    formatted_refs = ["=== REFERENCE DESIGN DICTIONARIES ===\n"]
    
    for json_file in json_files:
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # Extract reference name from metadata if available
            ref_name = None
            if "metadata" in data and isinstance(data["metadata"], dict):
                metadata = data["metadata"]
                vehicle = metadata.get("vehicle", "")
                category = metadata.get("category", "")
                if vehicle and category:
                    ref_name = f"{vehicle} {category}"
                elif vehicle:
                    ref_name = vehicle
                elif category:
                    ref_name = category
            
            # Fallback: try to extract from structured_data.component_type
            if not ref_name and "structured_data" in data:
                structured = data["structured_data"]
                if isinstance(structured, dict) and "component_type" in structured:
                    component_type = structured["component_type"]
                    # Try to extract vehicle/model name from component_type string
                    match = re.search(r"for\s+([A-Za-z0-9\s]+?)(?:\s+Long\s+Range|\s+Performance|\s+\d{4}|$)", component_type, re.IGNORECASE)
                    if match:
                        ref_name = match.group(1).strip()
            
            # Last fallback: use filename (cleaned up)
            if not ref_name:
                ref_name = json_file.stem.replace("_", " ").title()
            
            # Prefer raw_analysis if available, otherwise format the structured data
            if "raw_analysis" in data and data["raw_analysis"]:
                content = data["raw_analysis"]
            elif "structured_data" in data and data["structured_data"]:
                # Fallback: format structured data as JSON string
                content = json.dumps(data["structured_data"], indent=2)
            else:
                # Last resort: use the whole JSON (excluding images_analyzed for brevity)
                content_data = {k: v for k, v in data.items() if k != "images_analyzed"}
                content = json.dumps(content_data, indent=2)
            
            formatted_refs.append(f"\n--- {ref_name} ---\n")
            formatted_refs.append(content)
            formatted_refs.append("\n")
            
        except json.JSONDecodeError as e:
            # Log and skip files that can't be parsed
            import logging
            logging.warning(f"Failed to parse JSON file {json_file}: {e}")
            continue
        except IOError as e:
            # Log and skip files that can't be read
            import logging
            logging.warning(f"Failed to read file {json_file}: {e}")
            continue
    
    if len(formatted_refs) == 1:  # Only header, no actual references
        return ""
    
    return "\n".join(formatted_refs)


def load_customer_ops_reference(reference_dir: str = "reference/customer_ops_optimizer") -> str:
    """
    Load benchmarks and lever JSONs for the Customer Ops Optimizer agent.
    Returns a formatted string for use as retrieved_context.
    """
    reference_path = Path(reference_dir)
    if not reference_path.exists():
        return ""
    parts = ["=== CUSTOMER OPS OPTIMIZER REFERENCE (Benchmarks & Levers) ===\n"]
    for name in ("benchmarks", "ai_agentic_levers", "offshoring_levers"):
        path = reference_path / f"{name}.json"
        if not path.is_file():
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            parts.append(f"\n--- {name} ---\n")
            parts.append(json.dumps(data, indent=2))
            parts.append("\n")
        except (json.JSONDecodeError, IOError) as e:
            import logging
            logging.warning(f"Failed to load {path}: {e}")
    if len(parts) == 1:
        return ""
    return "\n".join(parts)


class KnowledgeWorkflow:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.catchall_prompt = load_prompt("configs/prompts/catchall.system.txt")
        self.electricalarch_prompt = load_prompt("configs/prompts/electricalarch.system.txt")
        self.customer_ops_optimizer_prompt = load_prompt("configs/prompts/customer_ops_optimizer.system.txt")
        self.catchall = create_catchall(settings, self.catchall_prompt)
        self.electricalarch = create_electricalarch(settings, self.electricalarch_prompt)
        self.customer_ops_optimizer = create_customer_ops_optimizer(settings, self.customer_ops_optimizer_prompt)
        # Get routing client (use primary model for routing decisions)
        routing_model = settings.defaults.get("routing_model", "primary")
        self.routing_client = get_model_client(settings, routing_model)
        # Load routing configuration
        self.routing_config = load_routing_config("configs/routing.yaml")

    def run(
        self,
        objective: str,
        inputs_dir: str,
        max_turns: int = 1,
        rag_chunk_chars: Optional[int] = None,
        rag_chunk_overlap: Optional[int] = None,
        agent: Optional[str] = None,
    ) -> str:
        # Tools removed: run without retrieval/context for maximum simplicity.
        retrieved_context = ""

        # Route to a specific subsystem or fall back to catch-all.
        # If agent is specified, use it directly; otherwise, use intelligent routing.
        if agent:
            agent_choice: Literal["electricalarch", "customer_ops_optimizer", "catchall"] = agent  # type: ignore
        else:
            agent_choice = self.choose_agent(objective)

        if agent_choice == "electricalarch":
            reference_context = load_reference_dictionaries()
            full_context = f"{retrieved_context}\n{reference_context}" if retrieved_context else reference_context
            return self.electricalarch.run(
                objective=objective,
                working_notes="",
                retrieved_context=full_context,
                hints="The expert will refine this agent's domain-specific logic for electrical architecture cost optimization.",
            )
        if agent_choice == "customer_ops_optimizer":
            reference_context = load_customer_ops_reference()
            full_context = f"{retrieved_context}\n{reference_context}" if retrieved_context else reference_context
            return self.customer_ops_optimizer.run(
                objective=objective,
                working_notes="",
                retrieved_context=full_context,
                hints="Use the provided benchmarks and lever definitions to ground recommendations.",
            )
        return self.catchall.run(
            objective=objective,
            working_notes="",
            retrieved_context=retrieved_context,
            hints="The expert will define the catch-all logic for any automotive component/system.",
        )

    def choose_agent(self, objective: str) -> Literal["electricalarch", "customer_ops_optimizer", "catchall"]:
        """
        Uses routing configuration and LLM to intelligently route the objective to the most appropriate agent.
        First checks for keyword matches, then uses LLM-based routing if needed.
        """
        objective_lower = objective.lower()

        # First pass: Check for keyword matches (excluding catchall)
        for route in self.routing_config:
            if route.keywords:  # Skip agents with empty keywords (like catchall)
                for keyword in route.keywords:
                    if keyword.lower() in objective_lower:
                        return route.name  # type: ignore

        # Second pass: Use LLM to determine the best agent
        # Build routing prompt dynamically from routing config
        agent_descriptions = []
        valid_agent_names = []

        for i, route in enumerate(self.routing_config, 1):
            valid_agent_names.append(route.name)
            keywords_str = ", ".join(route.keywords) if route.keywords else "(default fallback)"
            agent_descriptions.append(
                f"{i}. **{route.name}**: {route.description}\n"
                f"   Keywords: {keywords_str}"
            )

        routing_prompt = f"""You are an intelligent routing agent.

Available agents:
{chr(10).join(agent_descriptions)}

Your task: Analyze the objective and respond with ONLY the agent name: {" or ".join(f'"{name}"' for name in valid_agent_names)}.

Be specific: Match the objective to the agent whose description and keywords best fit the task.
If no specialized agent matches, choose the catchall/default agent."""

        try:
            response = self.routing_client.generate(
                system_prompt=routing_prompt,
                messages=[("user", f"Objective: {objective}")],
                temperature=0.1,  # Low temperature for consistent routing
                max_tokens=50,  # Short response expected
            )

            # Extract agent name from response (case-insensitive, strip whitespace)
            response_clean = response.strip().lower()

            # Try to find one of the valid agent names
            for route in self.routing_config:
                if route.name.lower() in response_clean:
                    return route.name  # type: ignore

            # Fallback: try regex to extract any valid agent name
            pattern = r'\b(' + '|'.join(re.escape(route.name) for route in self.routing_config) + r')\b'
            match = re.search(pattern, response_clean, re.IGNORECASE)
            if match:
                return match.group(1).lower()  # type: ignore

            # If LLM response is unclear, default to catchall (last agent in config)
            return self.routing_config[-1].name  # type: ignore
        except Exception as e:
            # Log routing failure and default to catchall (last agent in config)
            import logging
            logging.warning(f"Routing failed, defaulting to catchall: {type(e).__name__}: {e}")
            return self.routing_config[-1].name  # type: ignore