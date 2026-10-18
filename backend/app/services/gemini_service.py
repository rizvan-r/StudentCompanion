import os
import logging
from typing import List, Dict, Any, Optional
from ..core.config import settings

logger = logging.getLogger(__name__)

class GeminiService:
    """
    Orchestrates Google Gemini AI interactions for Student Companion AI.
    Handles grounded document Q&A with citations as well as general academic study tutoring.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        self._init_client()

    def _init_client(self):
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Google Gemini Client initialized successfully.")
            except Exception as e:
                logger.warning("Could not initialize google-genai Client: %s", e)

    async def answer_document_question(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Synthesizes an answer grounded exclusively in authorized document chunks.
        Appends source citations indicating document title and page number.
        """
        citations = []
        for c in retrieved_chunks:
            citations.append({
                "document_id": c.get("document_id", ""),
                "document_title": c.get("document_title", "Study Document"),
                "page_number": c.get("page_number", 1),
                "snippet": c.get("content", "")[:140] + "...",
            })

        if not retrieved_chunks:
            return {
                "answer": (
                    "I could not find sufficient information in your authorized study documents "
                    "to answer this question. Please ensure relevant course notes or textbook chapters "
                    "are uploaded to your library."
                ),
                "citations": [],
                "has_sufficient_context": False,
            }

        # Format context for Gemini
        context_blocks = []
        for c in retrieved_chunks:
            doc_title = c.get("document_title", "Document")
            page = c.get("page_number", 1)
            content = c.get("content", "").strip()
            context_blocks.append(
                f'<document_context title="{doc_title}" page="{page}">\n{content}\n</document_context>'
            )
        formatted_context = "\n\n".join(context_blocks)

        prompt = f"""You are Student Companion AI, an academic study assistant.
Answer the student's question accurately using ONLY the reference excerpts provided below.

INSTRUCTIONS:
1. Base your answer strictly on the facts present in the reference documents.
2. For each key point or factual explanation, cite the source using the format: [Source: <title>, Page <page>].
3. If the reference excerpts do not contain enough information to fully answer the question, state clearly that the reference material is insufficient.
4. Do NOT make assumptions or hallucinate information outside the provided text.

REFERENCE DOCUMENTS:
{formatted_context}

STUDENT QUESTION:
{query}

YOUR ANSWER:"""

        # Call live Gemini if client is ready
        if self.client:
            try:
                response = self.client.models.generate_content(
                    model="gemini-3.8-flash",
                    contents=prompt,
                )
                answer_text = response.text or ""
                return {
                    "answer": answer_text,
                    "citations": citations,
                    "has_sufficient_context": True,
                }
            except Exception as e:
                logger.error("Gemini API call failed: %s. Falling back to structured response.", e)

        # Fallback / Offline development response with citations
        sample_cite = citations[0] if citations else None
        cite_str = f" [Source: {sample_cite['document_title']}, Page {sample_cite['page_number']}]" if sample_cite else ""
        
        answer_text = (
            f"Based on your course materials in **{sample_cite['document_title'] if sample_cite else 'your documents'}**, "
            f"here is the key explanation:\n\n"
            f"• **Key Concept**: {retrieved_chunks[0]['content'][:260]}...{cite_str}\n\n"
            f"This summary is grounded in your uploaded study notes."
        )

        return {
            "answer": answer_text,
            "citations": citations,
            "has_sufficient_context": True,
        }

    async def answer_general_study_question(self, query: str) -> str:
        """General academic study tutoring without document context."""
        system_instruction = (
            "You are Student Companion AI, a friendly, encouraging academic tutor. "
            "Help college students understand academic concepts, break down complex topics "
            "into clear intuitive steps, and provide illustrative code or math examples where helpful."
        )

        if self.client:
            try:
                response = self.client.models.generate_content(
                    model="gemini-3.8-flash",
                    contents=f"{system_instruction}\n\nStudent: {query}\nTutor:",
                )
                return response.text or ""
            except Exception as e:
                logger.error("Gemini general tutor call failed: %s", e)

        return (
            f"Here is an explanation of '{query}':\n\n"
            f"1. **Core Concept**: Break the problem down into fundamental sub-problems.\n"
            f"2. **Practical Approach**: Apply standard algorithmic or mathematical principles to analyze edge cases.\n"
            f"3. **Next Steps**: Test your understanding with practice problem sets."
        )

gemini_service = GeminiService()
