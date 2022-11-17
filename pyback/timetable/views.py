import json

from django.http import HttpResponse

from pyback.configuration import (get_config_int, get_timetable_path_by_id,
                                  get_timetables_list, timetable_exists)


def status(request):
    return HttpResponse(json.dumps({
        'currentTimetableId': get_config_int('currentTimetableId'),
    }))


def list(request):
    timetables = get_timetables_list()

    return HttpResponse(json.dumps(timetables))


def timetable_list(request, timetableId):
    if timetableId == 0:
        timetableId = get_config_int('currentTimetableId')

    if not timetable_exists(timetableId):
        return HttpResponse(status=400)

    path = get_timetable_path_by_id(timetableId)
    with open(str(path) + '/summary.json', 'r') as f:
        return HttpResponse(f.read())


def get_plan(request, timetableId, planId):
    if timetableId == 0:
        timetableId = get_config_int('currentTimetableId')

    if not timetable_exists(timetableId):
        return HttpResponse(status=400)

    if '..' in planId or '/' in planId:
        return HttpResponse(status=400)

    path = get_timetable_path_by_id(timetableId)
    with open(str(path) + '/plans/' + planId, 'r') as f:
        return HttpResponse(f.read())
