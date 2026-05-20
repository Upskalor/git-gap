"""LLM Mentor Engine - converts structured findings into human mentorship via Groq."""
from typing import List, Dict, Any, Optional
import httpx
import structlog
import os

from app.core.config import settings

logger = structlog.get_logger()


class MentorService:
    """Service for AI-powered mentorship on code analysis findings using Groq."""

    def __init__(self):
        self.api_key = settings.groq_api_key or os.getenv("GROQ_API_KEY")
        self.model = "llama-3.3-70b-versatile"
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"

    async def _call_groq(self, messages: List[Dict[str, str]], max_tokens: int = 2048) -> str:
        """Call Groq chat completions API."""
        if not self.api_key:
            logger.warning("Groq API key not configured, using fallback mentorship")
            raise ValueError("Groq API key not configured")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.7
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(self.api_url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def generate_mentorship(
        self,
        findings: List[Dict[str, Any]],
        repository_name: str,
        analysis_type: str = "general",
        goals: Optional[str] = None,
    ) -> str:
        """Generate mentorship content from analysis findings, tailored to user goals."""
        try:
            prompt = self._build_mentorship_prompt(
                findings, repository_name, analysis_type, goals
            )
            
            messages = [
                {
                    "role": "system",
                    "content": "You are a senior developer and encouraging code mentor. You teach best practices, point out mistakes constructively, and help users achieve their learning goals through code quality."
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ]
            
            return await self._call_groq(messages, max_tokens=2048)
        except Exception as e:
            logger.error(f"Error generating mentorship from Groq: {e}")
            return self._fallback_mentorship(findings)

    async def answer_question(
        self,
        question: str,
        findings: List[Dict[str, Any]],
        repository_name: str,
        goals: Optional[str] = None,
    ) -> str:
        """Answer a specific question about code analysis findings, aligned with user goals."""
        try:
            findings_summary = self._format_findings(findings)
            
            prompt = f"""
You are an expert code mentor analyzing the repository '{repository_name}'.
"""
            if goals:
                prompt += f"\nUser's Personal Learning/Development Goals:\n{goals}\n"
                
            prompt += f"""
Recent analysis findings:
{findings_summary}

User question: {question}

Provide a helpful, constructive, and educational response that teaches best practices, resolves their question, and links it back to their learning goals if relevant.
"""
            
            messages = [
                {
                    "role": "system",
                    "content": "You are an expert code mentor explaining code issues and answering questions to help developers improve."
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ]
            
            return await self._call_groq(messages, max_tokens=1536)
        except Exception as e:
            logger.error(f"Error answering question: {e}")
            return "I encountered an error while processing your question. Please try again."

    def _build_mentorship_prompt(
        self,
        findings: List[Dict[str, Any]],
        repository_name: str,
        analysis_type: str,
        goals: Optional[str],
    ) -> str:
        """Build the prompt for mentorship generation."""
        findings_summary = self._format_findings(findings)
        
        prompt = f"""
You are an expert code mentor. You have analyzed a GitHub repository called '{repository_name}'.

Analysis Type: {analysis_type}
"""
        if goals:
            prompt += f"\nUser's Personal Learning/Development Goals:\n{goals}\n"
            
        prompt += f"""
Findings from automated analysis:
{findings_summary}

Please provide:
1. A brief overview of the code quality and main issues
2. The top 3 priority items to address (specifically aligned with their learning goals if relevant, otherwise the most critical issues)
3. Constructive suggestions for improvement (with concrete code snippets illustrating before/after)
4. Best practices recommendations to help them achieve their goals
5. Positive aspects of the codebase

Be encouraging but honest. Focus on learning and improvement rather than criticism. Format the response in beautiful Markdown.
"""
        return prompt

    @staticmethod
    def _format_findings(findings: List[Dict[str, Any]]) -> str:
        """Format findings into a readable summary."""
        if not findings:
            return "No issues found - the code looks good!"
        
        summary = []
        grouped = {}
        
        for finding in findings:
            category = finding.get("category", "unknown")
            if category not in grouped:
                grouped[category] = []
            grouped[category].append(finding)
        
        for category, items in grouped.items():
            summary.append(f"\n{category.upper()}:")
            for item in items[:5]:  # Limit to 5 per category
                severity = item.get("severity", "unknown")
                description = item.get("description", "")
                location = item.get("location", "")
                summary.append(f"  [{severity}] {description}")
                if location:
                    summary.append(f"    Location: {location}")
        
        return "\n".join(summary)

    @staticmethod
    def _fallback_mentorship(findings: List[Dict[str, Any]]) -> str:
        """Provide fallback mentorship when API fails."""
        if not findings:
            return "Great job! No major issues detected in your code analysis."
        
        critical = [f for f in findings if f.get("severity") == "critical"]
        high = [f for f in findings if f.get("severity") == "high"]
        
        mentorship = "## Code Mentorship Report\n\n"
        
        if critical:
            mentorship += f"### ⚠️ Critical Issues ({len(critical)})\n"
            for finding in critical[:3]:
                mentorship += f"- {finding.get('description', 'Issue detected')}\n"
        
        if high:
            mentorship += f"\n### ⚠️ High Priority Issues ({len(high)})\n"
            for finding in high[:3]:
                mentorship += f"- {finding.get('description', 'Issue detected')}\n"
        
        mentorship += """
### 💡 General Recommendations
- Address critical issues first before deploying
- Set up linting and automated code quality checks
- Implement comprehensive error handling
- Add type hints and documentation
- Consider code review processes
        """
        
        return mentorship

