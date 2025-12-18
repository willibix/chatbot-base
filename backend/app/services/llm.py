"""LLM service using LangChain and Ollama."""

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

from app.core.config import settings
from app.models.chat import Message, MessageRole


class LLMService:
    """Service for LLM interactions using LangChain and Ollama."""

    def __init__(self):
        self.llm = ChatOllama(
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.OLLAMA_MODEL,
            temperature=0.7,
        )
        self.system_prompt = (
            "You are a helpful AI assistant. Be concise, accurate, and friendly. "
            "If you don't know something, say so honestly."
        )

    def _convert_messages(
        self, history: list[Message]
    ) -> list[SystemMessage | HumanMessage | AIMessage]:
        """Convert database messages to LangChain message format."""
        messages: list[SystemMessage | HumanMessage | AIMessage] = [
            SystemMessage(content=self.system_prompt)
        ]

        for msg in history:
            if msg.role == MessageRole.USER:
                messages.append(HumanMessage(content=msg.content))
            elif msg.role == MessageRole.ASSISTANT:
                messages.append(AIMessage(content=msg.content))
            elif msg.role == MessageRole.SYSTEM:
                messages.append(SystemMessage(content=msg.content))

        return messages

    async def generate_response(self, history: list[Message]) -> str:
        """Generate a response based on conversation history."""
        messages = self._convert_messages(history)

        try:
            response = await self.llm.ainvoke(messages)
            return str(response.content)
        except Exception as e:
            # Log the error in production
            return f"I apologize, but I'm having trouble connecting to the AI service. Error: {e!s}"
