import os
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .models import ChatHistory, PolicyDocument
from .serializers import ChatHistorySerializer, PolicyDocumentSerializer
from .ai_pipeline import get_answer, update_policy, delete_old_chunks

@api_view(['POST'])
@permission_classes([AllowAny])
def chat_api(request):
    question = request.data.get('question')
    session_id = request.data.get('session_id')
    
    if not question or not session_id:
        return Response({"error": "question and session_id are required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        answer = get_answer(question, session_id)
        if answer == "Please keep your questions respectful.":
            return Response({"error": answer}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"answer": answer})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def chat_history_api(request):
    session_id = request.query_params.get('session_id')
    if not session_id:
        return Response({"error": "session_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
    history = ChatHistory.objects.filter(session_id=session_id).order_by('timestamp')
    serializer = ChatHistorySerializer(history, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_upload_policy(request):
    file_obj = request.FILES.get('file')
    if not file_obj:
        return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
    filename = file_obj.name
    if not (filename.endswith('.pdf') or filename.endswith('.docx')):
        return Response({"error": "File must be a .pdf or .docx"}, status=status.HTTP_400_BAD_REQUEST)
        
    file_type = 'pdf' if filename.endswith('.pdf') else 'docx'
    
    # Save file to media/policies/ folder
    policies_dir = os.path.join(settings.MEDIA_ROOT, 'policies')
    os.makedirs(policies_dir, exist_ok=True)
    
    file_path = f"policies/{filename}"
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    
    with open(full_path, 'wb+') as destination:
        for chunk in file_obj.chunks():
            destination.write(chunk)
            
    try:
        update_policy(file_path, filename, file_type)
        return Response({
            "message": "Policy uploaded and indexed successfully",
            "filename": filename
        })
    except ValueError as e:
        # File has no extractable text
        os.remove(full_path)
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_list_policies(request):
    policies = PolicyDocument.objects.all().order_by('-uploaded_at')
    serializer = PolicyDocumentSerializer(policies, many=True)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete_policy(request, pk):
    try:
        policy = PolicyDocument.objects.get(pk=pk)
    except PolicyDocument.DoesNotExist:
        return Response({"error": "Policy not found"}, status=status.HTTP_404_NOT_FOUND)
        
    # Delete chunks from PGVector
    delete_old_chunks(policy.filename)
    
    # Delete physical file
    full_path = os.path.join(settings.MEDIA_ROOT, policy.file_path)
    if os.path.exists(full_path):
        os.remove(full_path)
        
    # Delete model instance
    policy.delete()
    
    return Response({"message": "Policy deleted successfully"})
