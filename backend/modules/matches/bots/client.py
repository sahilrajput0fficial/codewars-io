import os
import re
from typing import List, Optional
from langchain_core.messages import SystemMessage, HumanMessage
from config import Credentials
from core.logger import logger
from .prompts import get_bot_system_prompt
from .schemas import CodeResponse


def get_llm_client():
    provider = (Credentials.LLM_PROVIDER or "groq").lower()
    
    if provider == "groq" or (Credentials.GROQ_API_KEY and provider != "gemini"):
        try:
            from langchain_groq import ChatGroq
            api_key = Credentials.GROQ_API_KEY or os.environ.get("GROQ_API_KEY")
            return ChatGroq(
                model="llama-3.3-70b-versatile",
                api_key=api_key,
                temperature=0.2,
            )
        except Exception as e:
            logger.warning(f"[BotClient] Failed to initialize ChatGroq: {e}. Falling back...")

    if provider == "gemini" or Credentials.GEMINI_API_KEY:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            api_key = Credentials.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
            return ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                google_api_key=api_key,
                temperature=0.2,
            )
        except Exception as e:
            logger.warning(f"[BotClient] Failed to initialize ChatGoogleGenerativeAI: {e}")

    # Fallback to local Ollama if available
    try:
        from langchain_ollama import ChatOllama
        return ChatOllama(model="qwen2.5-coder:7b", temperature=0.2)
    except Exception as e:
        logger.error(f"[BotClient] No suitable LLM client could be initialized: {e}")
        return None


def clean_generated_code(raw_code: str) -> str:
    """
    Sanitize generated code to ensure only raw executable text remains.
    """
    if not raw_code:
        return ""
    
    code = raw_code.strip()
    
    # Strip markdown code fence markers (```python ... ``` or ```cpp ... ``` or ``` ... ```)
    if code.startswith("```"):
        lines = code.splitlines()
        # Remove first line if it contains the starting fence
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        # Remove last line if it contains the closing fence
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        code = "\n".join(lines).strip()
        
    return code


async def generate_bot_solution(
    problem_title: str,
    problem_description: str,
    input_format: str = "",
    output_format: str = "",
    constraints: Optional[List[str]] = None,
    starter_code: str = "",
    language: str = "python",
    tier: str = "balanced",
) -> str:
    """
    Generate an executable source code solution for a DSA problem using the AI Bot.
    
    Parameters:
    - problem_title: Title of the problem
    - problem_description: Full markdown problem statement
    - input_format: Expected stdin format
    - output_format: Expected stdout format
    - constraints: List of input/time/memory constraints
    - starter_code: Language-specific starter code template
    - language: Target language ('python' | 'cpp' | 'javascript')
    - tier: Persona tier ('junior' | 'senior' | 'grandmaster')
    
    Returns:
    - Cleaned executable source code string.
    """
    system_prompt_text = get_bot_system_prompt(tier=tier, language=language)
    
    # Format the problem context cleanly for the LLM
    constraints_text = "\n".join(f"- {c}" for c in (constraints or []))
    problem_payload = f"""
Problem Title: {problem_title}

Problem Statement:
{problem_description}

Input Format:
{input_format or "Standard input as specified in problem statement."}

Output Format:
{output_format or "Standard output as specified in problem statement."}

Constraints:
{constraints_text or "Standard competitive programming constraints."}

Target Programming Language:
{language.capitalize()}

Starter Code Template:
{starter_code or "None provided. Implement the complete standalone solution with standard I/O."}
"""

    llm = get_llm_client()
    if not llm:
        logger.error("[BotClient] LLM client is unavailable. Returning empty solution.")
        return ""

    try:
        # Request structured output to ensure predictable schema
        structured_llm = llm.with_structured_output(CodeResponse)
        messages = [
            SystemMessage(content=system_prompt_text),
            HumanMessage(content=problem_payload),
        ]
        
        # Invoke LLM asynchronously
        response: CodeResponse = await structured_llm.ainvoke(messages)
        if response and response.code:
            return clean_generated_code(response.code)
    except Exception as structured_err:
        logger.warning(f"[BotClient] Structured invocation failed ({structured_err}), trying standard text completion...")
        try:
            # Fallback to direct text prompt if structured output isn't supported by the model
            messages = [
                SystemMessage(content=system_prompt_text),
                HumanMessage(content=problem_payload),
            ]
            raw_response = await llm.ainvoke(messages)
            content = raw_response.content if hasattr(raw_response, "content") else str(raw_response)
            return clean_generated_code(content)
        except Exception as fallback_err:
            logger.error(f"[BotClient] Standard completion also failed: {fallback_err}")
            return ""

    return ""