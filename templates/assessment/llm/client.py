from __future__ import annotations

import os
import re
from typing import Dict, List, Optional, Tuple

import yaml
from pydantic import BaseModel

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None  # type: ignore

try:
    import anthropic
except ImportError:
    anthropic = None  # type: ignore


class ModelConfig(BaseModel):
    provider: str  # "openai" | "anthropic" | "openai_compatible"
    model: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    temperature: float = 0.2
    max_tokens: int = 1024


class Settings(BaseModel):
    models: Dict[str, ModelConfig]
    defaults: Dict[str, str] = {}
    rag: Dict[str, int] = {}

    @staticmethod
    def load(path: str) -> "Settings":
        with open(path, "r", encoding="utf-8") as f:
            raw = yaml.safe_load(f)
        # Expand env vars like ${KEY} anywhere in strings
        def expand_env_all(val: Optional[str]) -> Optional[str]:
            if not isinstance(val, str):
                return val
            return re.sub(r"\$\{([^}]+)\}", lambda m: os.getenv(m.group(1), m.group(0)), val)
        models: Dict[str, ModelConfig] = {}
        for name, cfg in raw.get("models", {}).items():
            cfg["api_key"] = expand_env_all(cfg.get("api_key"))
            cfg["base_url"] = expand_env_all(cfg.get("base_url"))
            models[name] = ModelConfig(**cfg)
        return Settings(
            models=models,
            defaults=raw.get("defaults", {}),
            rag=raw.get("rag", {}),
        )


class LLMClient:
    def __init__(self, model_config: ModelConfig):
        self.cfg = model_config
        provider = self.cfg.provider.lower()
        self.provider = provider
        if provider in ("openai", "openai_compatible"):
            if OpenAI is None:
                raise RuntimeError("openai package not installed")
            self.client = OpenAI(api_key=self.cfg.api_key, base_url=self.cfg.base_url)  # type: ignore
        elif provider == "anthropic":
            if anthropic is None:
                raise RuntimeError("anthropic package not installed")
            # Respect custom base_url if provided (enterprise gateways)
            if getattr(self.cfg, "base_url", None):
                self.client = anthropic.Anthropic(api_key=self.cfg.api_key, base_url=self.cfg.base_url)  # type: ignore
            else:
                self.client = anthropic.Anthropic(api_key=self.cfg.api_key)  # type: ignore
        else:
            raise ValueError(f"Unknown provider: {self.cfg.provider}")

    def generate(
        self,
        system_prompt: str,
        messages: List[Tuple[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        temp = temperature if temperature is not None else self.cfg.temperature
        max_toks = max_tokens if max_tokens is not None else self.cfg.max_tokens
        if self.provider in ("openai", "openai_compatible"):
            assert OpenAI is not None
            chat_messages = [{"role": "system", "content": system_prompt}]
            for role, content in messages:
                chat_messages.append({"role": role, "content": content})
            resp = self.client.chat.completions.create(  # type: ignore
                model=self.cfg.model,
                messages=chat_messages,
                temperature=temp,
                max_tokens=max_toks,
            )
            return (resp.choices[0].message.content or "").strip()
        elif self.provider == "anthropic":
            assert anthropic is not None
            # Anthropic expects system + messages[user/assistant]
            user_contents = []
            for role, content in messages:
                if role == "user":
                    user_contents.append({"type": "text", "text": content})
                elif role == "assistant":
                    # keep assistant turns in context by alternating
                    user_contents.append({"type": "text", "text": f"[assistant]\n{content}"})
                else:
                    user_contents.append({"type": "text", "text": content})
            response = self.client.messages.create(  # type: ignore
                model=self.cfg.model,
                system=system_prompt,
                max_tokens=max_toks,
                temperature=temp,
                messages=[{"role": "user", "content": user_contents}],
            )
            return "".join([b.text for b in response.content if getattr(b, "type", "") == "text"]).strip()
        raise RuntimeError("Unsupported provider branch")


def get_model_client(settings: Settings, model_name: str) -> LLMClient:
    cfg = settings.models.get(model_name)
    if not cfg:
        raise KeyError(f"Model '{model_name}' not found in settings")
    return LLMClient(cfg)