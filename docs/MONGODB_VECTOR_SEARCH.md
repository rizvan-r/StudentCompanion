# MongoDB Atlas Vector Search Configuration Guide

This guide documents the setup, schema, index definition, and query pipeline for **MongoDB Atlas Vector Search**, the primary semantic retrieval engine for Student Companion AI.

---

## 1. MongoDB Atlas Cluster Provisioning

1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create or select a project (e.g., `StudentCompanion`).
3. Deploy an **M0 (Free)** or higher tier cluster.
4. Under **Network Access**, add your backend's IP address (or `0.0.0.0/0` with secure credentials during initial development).
5. Under **Database Access**, create a database user (e.g., `student_app_user`) with read/write permissions to the `student_companion` database.
6. Copy the connection string format:
   ```
   mongodb+srv://student_app_user:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```

---

## 2. Collection Schema: `study_chunks`

Inside the `student_companion` database, chunks are stored in the `study_chunks` collection:

```json
{
  "_id": "doc_a1b2c3d4-e5f6-7890-abcd-ef1234567890_chunk_0001",
  "document_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "chunk_id": "doc_a1b2c3d4-e5f6-7890-abcd-ef1234567890_chunk_0001",
  "chunk_index": 1,
  "content": "Operating Systems: Virtual Memory and Paging. Paging is a memory management scheme that eliminates the need for contiguous allocation of physical memory...",
  "embedding": [0.0125, -0.0432, 0.0891, 0.0034],
  "title": "OS_Lecture_4_Virtual_Memory.pdf",
  "page_number": 4,
  "department_id": "00000000-0000-0000-0000-000000000010",
  "visibility": "department",
  "is_active": true,
  "embedding_model": "models/text-embedding-004",
  "created_at": "2026-10-18T12:00:00Z"
}
```

> [!NOTE]
> Embedding vectors have **768 dimensions** when using Google Gemini's `text-embedding-004`. Real embedding vectors are never replaced with placeholders.

---

## 3. Atlas Vector Search Index Definition

In the MongoDB Atlas web console:
1. Navigate to **Atlas Search** > **Vector Search** on the `study_chunks` collection.
2. Click **Create Vector Search Index**.
3. Choose the **JSON Editor** and name the index: **`vector_index`**.
4. Paste the following configuration:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "document_id"
    },
    {
      "type": "filter",
      "path": "department_id"
    },
    {
      "type": "filter",
      "path": "visibility"
    },
    {
      "type": "filter",
      "path": "is_active"
    }
  ]
}
```

---

## 4. Semantic Search Pipeline (`$vectorSearch`)

FastAPI executes vector queries through PyMongo's aggregation pipeline using `$vectorSearch`:

```python
pipeline = [
    {
        "$vectorSearch": {
            "index": "vector_index",
            "path": "embedding",
            "queryVector": query_embedding,
            "numCandidates": 50,
            "limit": 6,
            "filter": {
                "$and": [
                    {"is_active": {"$eq": True}},
                    {"document_id": {"$in": allowed_document_ids}},
                    {
                        "$or": [
                            {"visibility": "public"},
                            {"department_id": user_department_id},
                            {"visibility": "private", "owner_id": user_id}
                        ]
                    }
                ]
            }
        }
    },
    {
        "$project": {
            "_id": 0,
            "chunk_id": 1,
            "document_id": 1,
            "title": 1,
            "content": 1,
            "page_number": 1,
            "score": {"$meta": "vectorSearchScore"}
        }
    }
]
```

---

## 5. Environment Variables (`backend/.env`)

```ini
# MongoDB Atlas Vector Search
MONGODB_URI=mongodb+srv://student_app_user:YourSecurePassword@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=student_companion
MONGODB_VECTOR_COLLECTION=study_chunks
MONGODB_VECTOR_INDEX=vector_index

# Embedding Provider
EMBEDDING_PROVIDER=gemini
EMBEDDING_MODEL=models/text-embedding-004
EMBEDDING_DIMENSIONS=768
```
