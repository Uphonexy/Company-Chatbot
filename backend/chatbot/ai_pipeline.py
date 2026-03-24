import os
import requests
from django.conf import settings
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_postgres.vectorstores import PGVector
from transformers import pipeline
from .models import ChatHistory, PolicyDocument

# Initialize models once at startup
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
toxic_classifier = pipeline("text-classification", model="unitary/toxic-bert")

# PGVector setup
DB_URL = f"postgresql://{settings.DATABASES['default']['USER']}:{settings.DATABASES['default']['PASSWORD']}@{settings.DATABASES['default']['HOST']}:{settings.DATABASES['default']['PORT']}/{settings.DATABASES['default']['NAME']}"
COLLECTION_NAME = "company_policies"

def extract_text(file_path, file_type):
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    if file_type == 'pdf':
        loader = PyPDFLoader(full_path)
    elif file_type == 'docx':
        loader = Docx2txtLoader(full_path)
    else:
        return []
        
    documents = loader.load()
    # Add source metadata to every document
    for doc in documents:
        doc.metadata['source'] = os.path.basename(file_path)
    return documents

def split_documents(documents):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,
        chunk_overlap=100,
        length_function=len,
        add_start_index=True
    )
    return text_splitter.split_documents(documents)

def store_chunks(chunks):
    PGVector.from_documents(
        embedding=embeddings,
        documents=chunks,
        collection_name=COLLECTION_NAME,
        connection=DB_URL,
    )

def delete_old_chunks(filename):
    store = PGVector(
        embeddings=embeddings,
        collection_name=COLLECTION_NAME,
        connection=DB_URL,
    )
    try:
        store.delete(filter={"source": filename})
    except Exception as e:
        print(f"Error deleting old chunks: {e}")

def update_policy(file_path, filename, file_type):
    delete_old_chunks(filename)
    documents = extract_text(file_path, file_type)
    if not documents:
        raise ValueError("No extractable text found in file.")
    chunks = split_documents(documents)
    store_chunks(chunks)
    
    # Save or update PolicyDocument record in Django DB
    PolicyDocument.objects.update_or_create(
        filename=filename,
        defaults={'file_path': file_path, 'is_active': True}
    )

def is_abusive(text):
    results = toxic_classifier(text)
    if results:
        best_result = results[0]
        if best_result['label'] == 'toxic' and best_result['score'] > 0.8:
            return True
    return False

def search_similar_chunks(question, top_k=3):
    store = PGVector(
        embeddings=embeddings,
        collection_name=COLLECTION_NAME,
        connection=DB_URL,
    )
    results = store.similarity_search_with_relevance_scores(question, k=top_k)
    # Filter out results with score below 0.3
    filtered_chunks = [doc.page_content for doc, score in results if score >= 0.3]
    return filtered_chunks

def build_prompt(question, context_chunks):
    context = "\n---\n".join(context_chunks)
    prompt = f"""You are a helpful company policy assistant. Answer the user's question ONLY using the provided policy context. 
If the answer is not in the context provided below, you must respond exactly with: "I don't have information about that in the company policies".

Context:
{context}

Question:
{question}

Answer:"""
    return prompt

def ask_ollama(prompt):
    url = "http://localhost:11434/api/generate"
    data = {
        "model": "llama3",
        "prompt": prompt,
        "stream": False,
        "num_predict": 500
    }
    try:
        response = requests.post(url, json=data)
        response.raise_for_status()
        return response.json()['response']
    except requests.exceptions.RequestException:
        return "The AI service is temporarily unavailable. Please make sure Ollama is running."

def get_answer(question, session_id):
    if is_abusive(question):
        return "Please keep your questions respectful."
        
    context_chunks = search_similar_chunks(question)
    
    if not context_chunks:
        answer = "I don't have information about that in the company policies"
    else:
        prompt = build_prompt(question, context_chunks)
        answer = ask_ollama(prompt)
        
    ChatHistory.objects.create(
        session_id=session_id,
        question=question,
        answer=answer
    )
    
    return answer
