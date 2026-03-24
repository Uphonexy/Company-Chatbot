# Company Policy Chatbot

A comprehensive local chatbot application answering questions based solely on uploaded company policies. It features local AI execution, full PDF/DOCX indexing with pgvector embeddings, abuse detection, and a stunning React frontend.

## Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Python 3.10+**
- **Node.js** (v18+)
- **PostgreSQL** running locally
- **Ollama** installed from [ollama.com](https://ollama.com)

## Setup Instructions

### 1. PostgreSQL & pgvector Setup
Ensure your local PostgreSQL database is running. Connect to your database using `psql` or pgAdmin and run:
```sql
CREATE DATABASE postgres; -- Or use default
\c postgres
CREATE EXTENSION IF NOT EXISTS vector;
```
*Note: Make sure your `config/settings.py` reflects your DB user and password (defaults are postgres/password).*

### 2. Ollama Setup
Pull the required LLaMA-3 model to run locally:
```bash
ollama pull llama3
```
*Ensure the Ollama service is running in the background before interacting with the chatbot.*

### 3. Backend Setup (Django)
Open a terminal in the root directory:

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install django djangorestframework psycopg2-binary pgvector langchain langchain-community langchain-core langchain-text-splitters langchain-postgres langchain-huggingface sentence-transformers transformers torch pypdf python-docx docx2txt django-cors-headers requests
   ```

3. Navigate to `backend/` and run migrations to initialize the database:
   ```bash
   cd backend
   python manage.py makemigrations chatbot
   python manage.py migrate
   ```

4. Create an admin superuser:
   ```bash
   python manage.py createsuperuser
   ```

5. Start the Django server:
   ```bash
   python manage.py runserver
   ```

### 4. Frontend Setup (React)
Open a separate terminal in the `frontend/` directory:

1. Install Node modules:
   ```bash
   npm install
   ```
*(Note: axios, react-router-dom, and uuid have been added)*

2. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Usage
- **Employee Chat Portal**: Navigate to `http://localhost:5173/` to interact with the Chatbot. Use it to ask anything about uploaded policies.
- **Admin Dashboard**: Navigate to `http://localhost:5173/admin/login`, log in with the superuser credentials, and upload policy files (.pdf or .docx) to index them into the local LLaMA3 knowledgebase.

*Note on first load: The HuggingFace sentence-transformers and toxic-BERT models will download locally upon the first backend launch or API request, which might take a few moments.*
