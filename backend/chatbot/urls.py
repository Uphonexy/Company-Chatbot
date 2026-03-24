from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.chat_api, name='chat_api'),
    path('history/', views.chat_history_api, name='chat_history_api'),
    path('admin/upload/', views.admin_upload_policy, name='admin_upload_policy'),
    path('admin/policies/', views.admin_list_policies, name='admin_list_policies'),
    path('admin/policies/<int:pk>/', views.admin_delete_policy, name='admin_delete_policy'),
]
