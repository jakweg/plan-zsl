from django.urls import path
from timetable import views

urlpatterns = [
    path('status', views.status, name='status'),
    path('list', views.list, name='list'),
    path('<int:timetableId>/list', views.timetable_list, name='timetable-list'),
    path('<int:timetableId>/get/<str:planId>', views.get_plan, name='get-plan'),
]
