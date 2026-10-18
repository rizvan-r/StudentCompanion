import os
import asyncio
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
        self.primary_model = getattr(settings, "GEMINI_MODEL", "gemini-3.7-flash") or "gemini-3.7-flash"
        raw_candidates = [self.primary_model, "gemini-3.7-flash", "gemini-2.5-flash", "gemini-2.5-pro"]
        self.candidate_models = []
        for m in raw_candidates:
            if m and m not in self.candidate_models:
                self.candidate_models.append(m)
        self.client = None
        self._init_client()

    def _init_client(self):
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Google Gemini Client initialized successfully with candidate models: %s", self.candidate_models)
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

        # Call live Gemini with candidate models
        if self.client:
            for model_name in self.candidate_models:
                try:
                    response = await asyncio.to_thread(
                        self.client.models.generate_content,
                        model=model_name,
                        contents=prompt,
                    )
                    answer_text = (response.text or "").strip()
                    if answer_text:
                        logger.info("Successfully generated grounded answer using model: %s", model_name)
                        return {
                            "answer": answer_text,
                            "citations": citations,
                            "has_sufficient_context": True,
                        }
                except Exception as e:
                    logger.warning("Gemini model %s failed for document Q&A: %s. Trying next candidate...", model_name, e)

        # Fallback / Offline development response with citations
        sample_cite = citations[0] if citations else None
        cite_str = f" [Source: {sample_cite['document_title']}, Page {sample_cite['page_number']}]" if sample_cite else ""
        
        answer_text = (
            f"Based on your course materials in **{sample_cite['document_title'] if sample_cite else 'your documents'}**, "
            f"here is the relevant excerpt regarding '{query}':\n\n"
            f"• **Key Excerpt**: {retrieved_chunks[0]['content'][:320]}...{cite_str}\n\n"
            f"*(Note: Live AI synthesis fallback mode active. Check your Gemini API quota or network connection).* "
        )

        return {
            "answer": answer_text,
            "citations": citations,
            "has_sufficient_context": True,
        }

    async def answer_general_study_question(self, query: str) -> str:
        """General academic study tutoring without document context."""
        system_instruction = (
            "You are Student Companion AI, an intelligent, friendly academic tutor for college students. "
            "Help the student understand concepts clearly, provide structured explanations, equations, "
            "code examples, or step-by-step reasoning where applicable."
        )

        if self.client:
            for model_name in self.candidate_models:
                try:
                    response = await asyncio.to_thread(
                        self.client.models.generate_content,
                        model=model_name,
                        contents=f"{system_instruction}\n\nStudent: {query}\nTutor:",
                    )
                    answer = (response.text or "").strip()
                    if answer:
                        logger.info("Successfully generated general tutor answer using model: %s", model_name)
                        return answer
                except Exception as e:
                    logger.warning("Gemini model %s failed for general tutor: %s. Trying next candidate...", model_name, e)

        return (
            f"Regarding your query **\"{query}\"**:\n\n"
            f"• Live AI generation could not be reached. Please check that `GEMINI_API_KEY` is configured in your backend environment variables.\n"
            f"• You can also upload related textbooks or notes to the **Document Library** for grounded question answering."
        )

gemini_service = GeminiService()
