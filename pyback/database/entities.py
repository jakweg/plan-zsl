def extract_fields(object, names):
    tmp = {}
    for n in names:
        value = object.attrib[n.lower()].strip()
        tmp[n] = value
    return tmp


def period_from_xml(object):
    return extract_fields(object, ['name', 'short', 'period', 'startTime', 'endTime'])


def daydef_from_xml(object):
    return extract_fields(object, ['id', 'name', 'short', 'days', ])


def subject_from_xml(object):
    return extract_fields(object, ['id', 'name', 'short', ])


def teacher_from_xml(object):
    return extract_fields(object, ['id', 'firstName', 'lastName', 'name', 'short', 'gender', 'color'])


def classroom_from_xml(object):
    return extract_fields(object, ['id', 'name', 'short', 'capacity'])


def class_from_xml(object):
    o = extract_fields(
        object, ['id', 'name', 'short', 'teacherId', 'classroomIds'])
    o['classroomId'] = o['classroomIds']
    return o


def group_from_xml(object):
    o = extract_fields(
        object, ['id', 'name', 'classId', 'entireClass', 'divisionTag', 'studentCount'])
    o['entireClass'] = o['entireClass'] != '0'
    o['divisionTag'] = int(o['divisionTag'])
    o['studentCount'] = int(o['studentCount']) if len(
        o['studentCount']) > 0 else 0
    return o


def lesson_from_xml(object):
    o = extract_fields(
        object, ['id', 'classIds', 'subjectId', 'teacherIds', 'classroomIds', 'groupIds', 'daysdefId'])
    o['teacherId'] = o['teacherIds']
    o['classIds'] = o['classIds'].split(',')
    o['classroomIds'] = o['classroomIds'].split(',')
    o['groupIds'] = o['groupIds'].split(',')
    return o


def card_from_xml(object):
    o = extract_fields(
        object, ['lessonId', 'classroomIds', 'period', 'days', ])
    o['classroomId'] = o['classroomIds']
    o['day'] = o['days']
    return o
