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
    o['groupNumber'] = 0 if o['entireClass'] else int('0' +
                                                      ''.join(filter(lambda x: x.isnumeric(), list(o['name']))))
    return o


def lesson_from_xml(object):
    o = extract_fields(
        object, ['id', 'classIds', 'subjectId', 'teacherIds', 'classroomIds', 'groupIds', 'daysdefId'])
    o['teacherId'] = o['teacherIds']
    o['classIds'] = o['classIds'].split(',')
    o['classroomId'] = o['classroomIds'].split(',')
    o['classroomId'] = o['classroomId'][0] if len(
        o['classroomId']) > 0 else None
    o['groupIds'] = o['groupIds'].split(',')
    return o


def card_from_xml(object):
    o = extract_fields(
        object, ['lessonId', 'classroomIds', 'period', 'days', ])
    o['classroomId'] = o['classroomIds']
    o['day'] = o['days']
    return o
