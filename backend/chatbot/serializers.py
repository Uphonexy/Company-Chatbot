from rest_framework import serializers
from .models import ChatHistory, PolicyDocument

class ChatHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatHistory
        fields = ['question', 'answer', 'timestamp']

class PolicyDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PolicyDocument
        fields = ['id', 'filename', 'uploaded_at', 'is_active']
