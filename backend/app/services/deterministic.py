"""Deterministic analyzer engine - the real technical brain."""
import re
import ast
from typing import List, Dict, Any, Optional
import structlog

logger = structlog.get_logger()


class Finding:
    """Represents a single code finding."""
    
    def __init__(
        self,
        category: str,
        severity: str,
        description: str,
        location: Optional[str] = None,
        code_snippet: Optional[str] = None,
    ):
        self.category = category
        self.severity = severity
        self.description = description
        self.location = location
        self.code_snippet = code_snippet

    def to_dict(self) -> Dict[str, Any]:
        return {
            "category": self.category,
            "severity": self.severity,
            "description": self.description,
            "location": self.location,
            "code_snippet": self.code_snippet,
        }


class DeterministicAnalyzer:
    """Deterministic code analysis engine."""

    def __init__(self):
        self.findings: List[Finding] = []
        self.issues_by_severity = {"critical": 0, "high": 0, "medium": 0, "low": 0}

    async def analyze_repository(self, files: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze repository files."""
        self.findings = []
        
        for file_info in files:
            file_path = file_info.get("path", "")
            content = file_info.get("content", "")
            
            if file_path.endswith(".py"):
                self._analyze_python(content, file_path)
            elif file_path.endswith((".js", ".ts")):
                self._analyze_javascript(content, file_path)
            elif file_path.endswith(".java"):
                self._analyze_java(content, file_path)

        return {
            "findings": [f.to_dict() for f in self.findings],
            "summary": self._generate_summary(),
        }

    def _analyze_python(self, content: str, file_path: str):
        """Analyze Python code."""
        try:
            tree = ast.parse(content)
            
            # Check for common issues
            for node in ast.walk(tree):
                # Detect bare except
                if isinstance(node, ast.ExceptHandler) and node.type is None:
                    self.findings.append(Finding(
                        category="exception_handling",
                        severity="high",
                        description="Bare 'except' clause - catches all exceptions including SystemExit",
                        location=f"{file_path}:{node.lineno}",
                    ))
                
                # Detect hardcoded credentials
                if isinstance(node, ast.Constant):
                    if isinstance(node.value, str):
                        if self._contains_secret(node.value):
                            self.findings.append(Finding(
                                category="security",
                                severity="critical",
                                description="Potential hardcoded secret/credential detected",
                                location=f"{file_path}:{node.lineno}",
                            ))
        except SyntaxError as e:
            logger.warning(f"Syntax error in {file_path}: {e}")

        # Pattern-based checks
        self._check_patterns(content, file_path, "python")

    def _analyze_javascript(self, content: str, file_path: str):
        """Analyze JavaScript/TypeScript code."""
        # Pattern-based analysis
        patterns = {
            r"eval\s*\(": "Unsafe eval() usage - security risk",
            r"with\s*\(": "Deprecated 'with' statement",
            r"var\s+\w+\s*=": "Use 'const' or 'let' instead of 'var'",
        }
        
        for pattern, description in patterns.items():
            if re.search(pattern, content):
                self.findings.append(Finding(
                    category="code_style",
                    severity="medium",
                    description=description,
                    location=file_path,
                ))

    def _analyze_java(self, content: str, file_path: str):
        """Analyze Java code."""
        # Check for common Java issues
        if "printStackTrace()" in content:
            self.findings.append(Finding(
                category="error_handling",
                severity="medium",
                description="printStackTrace() used instead of proper logging",
                location=file_path,
            ))

    def _check_patterns(self, content: str, file_path: str, language: str):
        """Check for common security and style patterns."""
        patterns = {
            r"TODO|FIXME": ("code_quality", "low", "Unresolved TODO/FIXME comment"),
            r"pass\s*#.*type:\s*ignore": ("type_checking", "medium", "Type checking ignored"),
        }
        
        for pattern, (category, severity, desc) in patterns.items():
            for match in re.finditer(pattern, content):
                line_num = content[:match.start()].count("\n") + 1
                self.findings.append(Finding(
                    category=category,
                    severity=severity,
                    description=desc,
                    location=f"{file_path}:{line_num}",
                ))

    @staticmethod
    def _contains_secret(value: str) -> bool:
        """Check if string contains potential secrets."""
        secret_patterns = [
            r"password\s*=",
            r"api[_-]?key",
            r"secret",
            r"token",
        ]
        return any(re.search(pattern, value, re.IGNORECASE) for pattern in secret_patterns)

    def _generate_summary(self) -> Dict[str, Any]:
        """Generate analysis summary."""
        summary = {"total_findings": len(self.findings)}
        
        for finding in self.findings:
            severity = finding.severity
            self.issues_by_severity[severity] += 1
        
        summary.update(self.issues_by_severity)
        return summary
