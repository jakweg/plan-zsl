from admin import views
from django.urls import path

urlpatterns = [
    path('status', views.status, name='status'),
    path('authorize', views.authorize, name='authorize'),
    path('logout', views.logout, name='logout'),
    path('list-timetables', views.list_timetables, name='list-timetables'),
    path('server-settings', views.server_settings, name='server-settings'),
    path('set-server-setting', views.set_server_setting,
         name='set-server-setting'),
    path('timetable-info/<int:timetableId>', views.timetable_info,
         name='timetable-info'),
    path('update-timetable-info/<int:timetableId>', views.update_timetable_info,
         name='update-timetable-info'),
    path('select-timetable/<int:timetableId>', views.select_timetable,
         name='select-timetable'),
    path('delete-timetable/<int:timetableId>', views.post_delete_timetable,
         name='delete-timetable'),
    path('new-timetable', views.new_timetable,
         name='new-timetable'),
]
