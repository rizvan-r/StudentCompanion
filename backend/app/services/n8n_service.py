import logging
from typing import Dict, Any, List, Optional
import httpx
from ..core.config import settings
from .gemini_service import gemini_service

logger = logging.getLogger(__name__)

class N8nService:
    """
    Orchestration gateway connecting FastAPI with the n8n AI Agent Workflow.
    Sends student query, conversation context, and authorized passages to n8n.
    Verifies structured response contract and provides resilient fallback to Gemini.
    """

    async def invoke_agent_workflow(
        self,
        conversation_id: str,
        user_id: str,
        message: str,
        user_role: str = "student",
        department_id: Optional[str] = None,
        retrieved_passages: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        retrieved_passages = retrieved_passages or []

        # 1. Resolve and check n8n webhook URL
        webhook_url = (
            getattr(settings, "N8N_WEBHOOK_URL", "")
            or getattr(settings, "N8N_WEBHOOK_URI", "")
            or "http://localhost:5678/webhook/student-chat"
        ).strip()

        if webhook_url:
            candidate_urls = [webhook_url]
            # If production webhook URL, also prepare test URL as auto-fallback if 404
            if "/webhook/" in webhook_url:
                candidate_urls.append(webhook_url.replace("/webhook/", "/webhook-test/"))
            elif "/webhook-test/" in webhook_url:
                candidate_urls.append(webhook_url.replace("/webhook-test/", "/webhook/"))

            headers = {
                "Content-Type": "application/json",
                settings.N8N_AUTH_HEADER_NAME: settings.N8N_WEBHOOK_SECRET,
                "X-Internal-Key": settings.INTERNAL_API_KEY,
            }
            payload = {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "user_role": user_role,
                "department_id": department_id,
                "message": message,
                "retrieved_passages": retrieved_passages,
            }

            for target_url in candidate_urls:
                try:
                    logger.info("Calling n8n AI Agent webhook at %s", target_url)
                    async with httpx.AsyncClient(timeout=60.0) as client:
                        res = await client.post(
                            target_url,
                            headers=headers,
                            json=payload,
                        )
                        if res.status_code == 200:
                            data = res.json()
                            if isinstance(data, list) and len(data) > 0:
                                data = data[0].get("json", data[0]) if isinstance(data[0], dict) else {}
                            
                            answer = data.get("answer") or data.get("output") or data.get("text", "")
                            raw_sources = data.get("sources") or []
                            formatted_sources = self._normalize_sources(raw_sources, retrieved_passages)

                            return {
                                "conversation_id": conversation_id,
                                "answer": answer,
                                "sources": formatted_sources,
                                "status": "completed",
                            }
                        elif res.status_code == 404 and target_url != candidate_urls[-1]:
                            logger.info("Webhook %s returned 404, attempting alternate candidate URL...", target_url)
                            continue
                        else:
                            logger.warning("n8n webhook returned HTTP %s. Details: %s", res.status_code, res.text[:200])
                            break
                except Exception as e:
                    logger.warning("Failed to invoke n8n webhook at %s: %s", target_url, e)
                    break

        # 2. Resilient fallback: direct Gemini model execution
        return await self._fallback_gemini_generation(
            conversation_id=conversation_id,
            message=message,
            retrieved_passages=retrieved_passages,
        )

    async def _fallback_gemini_generation(
        self,
        conversation_id: str,
        message: str,
        retrieved_passages: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Executes study tutoring or grounded Q&A directly via Gemini model when n8n is offline.
        """
        if retrieved_passages:
            # Map passages to chunk format expected by gemini_service
            chunks_for_gemini = [
                {
                    "document_id": p.get("document_id"),
                    "document_title": p.get("title") or p.get("document_title", "Study Material"),
                    "page_number": p.get("page_number", 1),
                    "content": p.get("content", ""),
                }
                for p in retrieved_passages
            ]

            result = await gemini_service.answer_document_question(
                query=message,
                retrieved_chunks=chunks_for_gemini,
            )

            formatted_sources = [
                {
                    "document_id": p.get("document_id", ""),
                    "title": p.get("title") or p.get("document_title", "Study Material"),
                    "page": p.get("page_number", 1),
                }
                for p in retrieved_passages
            ]

            return {
                "conversation_id": conversation_id,
                "answer": result.get("answer", ""),
                "sources": formatted_sources,
                "status": "completed",
            }
        else:
            general_answer = await gemini_service.answer_general_study_question(message)
            return {
                "conversation_id": conversation_id,
                "answer": general_answer,
                "sources": [],
                "status": "completed",
            }

    def _normalize_sources(self, raw_sources: List[Any], retrieved_passages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not raw_sources and retrieved_passages:
            raw_sources = retrieved_passages

        sources = []
        for s in raw_sources:
            if isinstance(s, dict):
                sources.append({
                    "document_id": s.get("document_id", ""),
                    "title": s.get("title") or s.get("document_title", "Study Document"),
                    "page": s.get("page") or s.get("page_number", 1),
                })
        return sources

n8n_service = N8nService()
