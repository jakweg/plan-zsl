
import json
import xml.etree.ElementTree as ET

import database.entities

DAY_IDS = [
    ['monday', '10000'],
    ['tuesday', '01000'],
    ['wednesday', '00100'],
    ['thursday', '00010'],
    ['friday', '00001'],
]


def from_xml(file_content):

    def mapByXmlEntities(group_name, constructor, group_key='id'):
        tmp = {}
        tmp_list = []
        for item in root.findall(f'./{group_name}/*'):
            parsed = constructor(item)
            tmp_list.append(parsed)
            if group_key in parsed:
                tmp[parsed[group_key]] = parsed
        return tmp if len(tmp) > 0 else tmp_list

    root = ET.fromstring(file_content)

    db = {
        'periods': mapByXmlEntities('periods', database.entities.period_from_xml),
        'daydefs': mapByXmlEntities('daysdefs', database.entities.daydef_from_xml),
        'subjects': mapByXmlEntities('subjects', database.entities.subject_from_xml),
        'teachers': mapByXmlEntities('teachers', database.entities.teacher_from_xml),
        'classrooms': mapByXmlEntities('classrooms', database.entities.classroom_from_xml),
        'classes': mapByXmlEntities('classes', database.entities.class_from_xml),
        'groups': mapByXmlEntities('groups', database.entities.group_from_xml),
        'lessons': mapByXmlEntities('lessons', database.entities.lesson_from_xml),
        'cards': mapByXmlEntities('cards', database.entities.card_from_xml),
    }

    return db


def group_by_selector(array, selector):
    grouped = {}
    for it in array:
        key = selector(it)
        if key not in grouped:
            grouped[key] = []
        grouped[key].append(it)
    return grouped


def get_grouped_classes(db):
    output_array = []

    classes = []
    for [_, c] in db['classes'].items():
        if c['short'][0] >= '0' and c['short'] <= '9':
            classes.append(c)

    grouped = group_by_selector(classes, lambda x: x['short'][0])
    for [year, onYear] in grouped.items():
        grouped_by_profiles = group_by_selector(
            onYear, lambda x: x['short'][1])
        for [profileId, profiles] in list(grouped_by_profiles.items()):
            grouped_by_profiles[profileId] = list(map(
                lambda x: x['short'], profiles))
            # TODO sort it?
        output_array.append({
            'year': int(year),
            'profiles': grouped_by_profiles,
        })

    return output_array


def get_teacher_shorts_and_names(db):
    output_array = {}
    for teacher in db['teachers'].values():
        output_array[teacher['short']] = teacher['name']
    return output_array


def get_classroomShortsAndNames(db):
    output_array = {}
    for room in db['classrooms'].values():
        output_array[room['short']] = room['name']
    return output_array


def get_subjectsShortsAndNames(db):
    output_array = {}
    for subject in db['subjects'].values():
        output_array[subject['short']] = subject['name']
    return output_array


def get_shorts_for_everything(db):
    return {
        'groupedClasses': get_grouped_classes(db),
        'teachers': get_teacher_shorts_and_names(db),
        'classrooms': get_classroomShortsAndNames(db),
        'subjects': get_subjectsShortsAndNames(db),
    }


def get_timetable_by_class_id(db, class_id):
    clazz = db['classes'][class_id]
    response_object = {
        'type': 'C',
        'fullName': clazz['name'],
        'teacherName': db['teachers'].get(clazz['teacherId'], {'name': ''})['name'],
        'periods': list(map(lambda x: {'num': x['period'], 'start': x['startTime'], 'end': x['endTime']}, db['periods']))
    }

    for [keyName, dayId] in DAY_IDS:
        found_lessons = []
        for [lessonId, lesson] in db['lessons'].items():
            if class_id not in lesson['classIds']:
                continue

            cards = filter(
                lambda it: it['day'] == dayId,
                filter(
                    lambda it: it['lessonId'] == lessonId,
                    db['cards']
                )
            )

            subject = db['subjects'][lesson['subjectId']]
            teacher = db['teachers'][lesson['teacherId']]

            for card in cards:
                classroom = db['classrooms'][lesson['classroomId']
                                             ] if lesson['classroomId'] in db['classrooms'] else None

                for groupId in lesson['groupIds']:
                    group = db['groups'][groupId]
                    if group['classId'] != class_id:
                        continue

                    found_lessons.append({
                        'subject': subject['short'],
                        'period': card['period'],
                        'classroom': classroom['short'] if classroom is not None else '',
                        'teacher': teacher['short'],
                        'entireClass': group['entireClass'],
                        'groupNum': group['groupNumber'],
                        'group': group['name'],
                    })

        grouped_by_period = group_by_selector(
            found_lessons, lambda g: g['period'])
        output_array = []
        for period in db['periods']:
            if period['name'] in grouped_by_period:
                array = grouped_by_period[period['name']]  # sort it?
            else:
                array = None
            output_array.append(array)

        response_object[keyName] = output_array

    return response_object


def get_timetable_by_teacher_id(db, teacher_id):
    teacher = db['teachers'][teacher_id]
    response_object = {
        'type': 'T',
        'fullName': teacher['name'],
        'periods': list(map(lambda x: {'num': x['period'], 'start': x['startTime'], 'end': x['endTime']}, db['periods']))
    }

    for [keyName, dayId] in DAY_IDS:
        found_lessons = []
        for [lessonId, lesson] in db['lessons'].items():
            if lesson['teacherId'] != teacher_id:
                continue

            cards = filter(
                lambda it: it['day'] == dayId,
                filter(
                    lambda it: it['lessonId'] == lessonId,
                    db['cards']
                )
            )

            subject = db['subjects'][lesson['subjectId']]

            for card in cards:
                classroom = db['classrooms'][lesson['classroomId']
                                             ] if lesson['classroomId'] in db['classrooms'] else None

                for groupId in lesson['groupIds']:
                    group = db['groups'][groupId]

                    found_lessons.append({
                        'class': '' if group is None else db['classes'][group['classId']]['short'],
                        'subject': subject['short'],
                        'period': card['period'],
                        'classroom': classroom['short'] if classroom is not None else '',
                        'teacher': teacher['short'],
                        'entireClass': group['entireClass'],
                        'groupNum': group['groupNumber'],
                        'group': group['name'],
                    })

        grouped_by_period = group_by_selector(
            found_lessons, lambda g: g['period'])
        output_array = []
        for period in db['periods']:
            if period['name'] in grouped_by_period:
                array = grouped_by_period[period['name']]  # sort it?
            else:
                array = None
            output_array.append(array)

        response_object[keyName] = output_array

    return response_object


def get_timetable_by_classroom_id(db, classroom_id):
    classroom = db['classrooms'][classroom_id]
    response_object = {
        'type': 'R',
        'fullName': classroom['name'],
        'periods': list(map(lambda x: {'num': x['period'], 'start': x['startTime'], 'end': x['endTime']}, db['periods']))
    }

    for [keyName, dayId] in DAY_IDS:
        found_lessons = []
        for [lessonId, lesson] in db['lessons'].items():
            if classroom_id not in lesson['classroomIds']:
                continue

            cards = filter(
                lambda it: it['day'] == dayId,
                filter(
                    lambda it: it['lessonId'] == lessonId,
                    filter(
                        lambda it: it['classroomId'] == classroom_id,
                        db['cards']
                    )
                )
            )

            subject = db['subjects'][lesson['subjectId']]
            teacher = db['teachers'][lesson['teacherId']]

            for card in cards:
                for groupId in lesson['groupIds']:
                    group = db['groups'][groupId]

                    found_lessons.append({
                        'class': '' if group is None else db['classes'][group['classId']]['short'],
                        'subject': subject['short'],
                        'period': card['period'],
                        'teacher': teacher['short'],
                        'entireClass': group['entireClass'],
                        'group': group['name'],
                    })

        grouped_by_period = group_by_selector(
            found_lessons, lambda g: g['period'])
        output_array = []
        for period in db['periods']:
            if period['name'] in grouped_by_period:
                array = grouped_by_period[period['name']]  # sort it?
            else:
                array = None
            output_array.append(array)

        response_object[keyName] = output_array

    return response_object


def generate_json_for_everything(db):
    every_timetable = {}

    for [id, obj] in db['classes'].items():
        every_timetable[obj['short']] = get_timetable_by_class_id(db, id)

    for [id, obj] in db['teachers'].items():
        every_timetable[obj['short']] = get_timetable_by_teacher_id(db, id)

    for [id, obj] in db['classrooms'].items():
        every_timetable[obj['short']] = get_timetable_by_classroom_id(db, id)

    return every_timetable


def dump_self_into_folder(path: str, db):
    import shutil
    try:
        shutil.rmtree(path)
    except:
        print('Error deleting directory')

    import os
    os.makedirs(path)
    os.makedirs(f'{path}/plans')

    with open(f'{path}/database.json', 'w') as f:
        json.dump(db, f)

    with open(f'{path}/summary.json', 'w') as f:
        json.dump(get_shorts_for_everything(db), f)

    everything = generate_json_for_everything(db)
    for [k, v] in everything.items():
        with open(f'{path}/plans/{k.lower()}', 'w') as f:
            json.dump(v, f)
