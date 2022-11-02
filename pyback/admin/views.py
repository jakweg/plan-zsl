import json

from database.database import dump_self_into_folder, from_xml
from django import forms
from django.http import HttpResponse
from pyback.configuration import (delete_timetable, get_config_bool,
                                  get_config_int, get_config_string,
                                  get_timetables_list, set_config,
                                  timetable_exists)


def status(request):
    is_admin = 'admin' in request.session and request.session['admin'] == True
    return HttpResponse(json.dumps({'signedIn': is_admin}))


def authorize(request):
    body = json.loads(request.body.decode("utf-8"))
    if 'login' in body and 'password' in body and \
            body['login'] == get_config_string('adminLogin') and \
            body['password'] == get_config_string('adminPassword'):
        request.session['signedIn'] = True
        request.session['admin'] = True
        request.session['login'] = body['login']
        request.session['csrfToken'] = 'none'
        return HttpResponse(status=204)
    return HttpResponse(status=401)


def logout(request):
    request.session['signedIn'] = False
    request.session['admin'] = False
    request.session['login'] = None
    request.session['csrfToken'] = 'none'
    return HttpResponse(status=204)


def list_timetables(request):
    if not ('admin' in request.session and request.session['admin']):
        return HttpResponse(status=401)

    def mapper(timetable):
        obj = timetable.clone()
        obj['active'] = obj['id'] == get_config_int('currentTimetableId')
        return obj

    return HttpResponse(json.dumps(list(map(mapper, get_timetables_list()))))


def server_settings(request):
    if not ('admin' in request.session and request.session['admin']):
        return HttpResponse(status=401)

    current = list(filter(lambda x: x['id'] == get_config_int(
        'currentTimetableId'), get_timetables_list()))

    return HttpResponse(json.dumps({
        'token': 'none',
        'currentName': None if len(current) == 0 else current[0]['name'],
        'currentId': None if len(current) == 0 else current[0]['id'],
        'rotationEnabled': get_config_bool('autoTimetableRotation'),
        'timetableCacheDuration': 0,
        'useIpFilter': False,
        'whitelistedIps': [],
    }))


def set_server_settings(request):
    if not ('admin' in request.session and request.session['admin']):
        return HttpResponse(status=401)

    body = json.loads(request.body.decode("utf-8"))
    if body['key'] == 'auto-rotation':
        if body['value'] == '1':
            set_config('autoTimetableRotation', True)
        elif body['value'] == '0':
            set_config('autoTimetableRotation', False)
        else:
            return HttpResponse(400)
    elif body['key'] == 'timetable-info-cache-duration':
        set_config('currentTimetableCacheSeconds', int(body['value']))

    return HttpResponse(status=201)


def timetable_info(request, timetableId: int):
    if not ('admin' in request.session and request.session['admin']):
        return HttpResponse(status=401)

    current = list(
        filter(lambda x: x['id'] == timetableId, get_timetables_list()))
    if len(current) == 0:
        return HttpResponse(status=400)

    return HttpResponse(json.dumps({
        'name': current[0]['name'],
        'id': current[0]['id'],
        'isValidFrom': current[0]['isValidFrom'],
        'selected': get_config_int('currentTimetableId') == timetableId,
        'autoEnabled': get_config_bool('autoTimetableRotation'),
        'token': 'none',
    }))


def update_timetable_info(request, timetableId: int):
    if not ('admin' in request.session and request.session['admin']):
        return HttpResponse(status=401)

    body = json.loads(request.body.decode("utf-8"))
    current = list(
        filter(lambda x: x['id'] == timetableId, get_timetables_list()))

    if len(current) == 0:
        return HttpResponse(status=400)

    if 'name' in body:
        current[0]['name'] = body['name']

    if 'date' in body:
        current[0]['inValidFrom'] = int(body['date'])

    return HttpResponse(status=204)


def select_timetable(request, timetableId: int):
    if not ('admin' in request.session and request.session['admin']):
        return HttpResponse(status=401)

    if get_config_bool('autoTimetableRotation') == True:
        return HttpResponse(status=405)

    if not timetable_exists(timetableId):
        return HttpResponse(status=400)

    set_config('currentTimetableId', int(timetableId))
    return HttpResponse(status=204)


def post_delete_timetable(request, timetableId: int):
    if not ('admin' in request.session and request.session['admin']):
        return HttpResponse(status=401)

    if not timetable_exists(timetableId):
        return HttpResponse(status=400)

    if delete_timetable(timetableId):
        return HttpResponse(status=204)
    else:
        return HttpResponse(status=400)


class UploadFileForm(forms.Form):
    name = forms.CharField(max_length=100)
    file = forms.FileField()
    isValidFrom = forms.IntegerField()


def new_timetable(request):
    if not ('admin' in request.session and request.session['admin']):
        return HttpResponse(status=401)

    form = UploadFileForm(request.POST, request.FILES)

    name = request.POST['name']
    [year, month, day] = map(int, request.POST['isValidFrom'].split('-'))
    import datetime
    isValidFrom = int(datetime.datetime(year, month, day).timestamp() * 1000)
    file = request.FILES['file']
    with open('/tmp/timetable-upload-file', 'wb') as f:
        for chunk in file.chunks():
            f.write(chunk)

    with open('/tmp/timetable-upload-file', 'rb') as f:
        file_content = f.read().decode('windows-1250')

    db = from_xml(file_content)
    dump_self_into_folder('./tmp-plan', db)

    return HttpResponse(status=400)
