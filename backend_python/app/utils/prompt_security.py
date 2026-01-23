"""
Prompt Security Utilities
Schützt vor Prompt Injection Angriffen durch Input Sanitization
"""
import re
from typing import Optional


# Gefährliche Patterns die entfernt werden sollen
DANGEROUS_PATTERNS = [
    r'(?i)ignore\s+all\s+previous',
    r'(?i)forget\s+everything',
    r'(?i)you\s+are\s+now',
    r'(?i)system\s*:',
    r'(?i)###\s*instruction',
    r'(?i)override\s+system',
    r'(?i)new\s+instructions',
    r'(?i)disregard\s+previous',
    r'(?i)act\s+as\s+if',
    r'(?i)pretend\s+to\s+be',
    r'(?i)roleplay\s+as',
    r'(?i)you\s+must\s+now',
    r'(?i)from\s+now\s+on',
    r'(?i)forget\s+all',
    r'(?i)clear\s+memory',
    r'(?i)reset\s+context',
    r'(?i)new\s+system\s+prompt',
    r'(?i)execute\s+command',
    r'(?i)run\s+code',
    r'(?i)show\s+me\s+the\s+prompt',
    r'(?i)reveal\s+your\s+instructions',
    r'(?i)what\s+are\s+your\s+instructions',
    r'(?i)print\s+your\s+system\s+message',
    r'(?i)repeat\s+after\s+me',
    r'(?i)say\s+exactly',
    r'(?i)output\s+verbatim',
]

# Maximale Länge für User-Input
MAX_MESSAGE_LENGTH = 2000
MAX_CONTEXT_LENGTH = 100


def sanitize_user_input(message: str, max_length: int = MAX_MESSAGE_LENGTH) -> str:
    """
    Sanitized User-Input um Prompt Injection zu verhindern.
    
    Args:
        message: Der zu sanitizierende User-Input
        max_length: Maximale Länge des Inputs
        
    Returns:
        Sanitized Message
    """
    if not message:
        return ""
    
    # Entferne gefährliche Patterns
    sanitized = message
    for pattern in DANGEROUS_PATTERNS:
        sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE)
    
    # Entferne mehrfache Leerzeichen
    sanitized = re.sub(r'\s+', ' ', sanitized)
    
    # Trim Whitespace
    sanitized = sanitized.strip()
    
    # Längenlimit anwenden
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized


def sanitize_context(context: Optional[str], max_length: int = MAX_CONTEXT_LENGTH) -> str:
    """
    Sanitized Context-String.
    
    Args:
        context: Der zu sanitizierende Context
        max_length: Maximale Länge
        
    Returns:
        Sanitized Context
    """
    if not context:
        return "smart-pantry"
    
    # Context sollte nur erlaubte Werte enthalten
    allowed_contexts = ["smart-pantry", "recipe", "grocery", "shopping-list"]
    if context.lower() in allowed_contexts:
        return context.lower()
    
    # Falls nicht erlaubt, auf Default setzen
    return "smart-pantry"


def validate_message_length(message: str, max_length: int = MAX_MESSAGE_LENGTH) -> bool:
    """
    Validiert ob Message-Länge innerhalb der Limits ist.
    
    Args:
        message: Die zu validierende Message
        max_length: Maximale erlaubte Länge
        
    Returns:
        True wenn gültig, False sonst
    """
    return len(message) <= max_length and len(message) > 0


def escape_for_prompt(text: str) -> str:
    """
    Escaped Text für sichere Verwendung in Prompts.
    Entfernt/Ersetzt Zeichen die Prompt-Injection ermöglichen könnten.
    
    Args:
        text: Der zu escapende Text
        
    Returns:
        Escaped Text
    """
    if not text:
        return ""
    
    # Ersetze gefährliche Zeichen
    escaped = text.replace('\n', ' ').replace('\r', ' ')
    escaped = escaped.replace('```', '').replace('`', '')
    escaped = escaped.replace('---', '-').replace('===', '=')
    
    # Entferne mehrfache Leerzeichen
    escaped = re.sub(r'\s+', ' ', escaped)
    
    return escaped.strip()
