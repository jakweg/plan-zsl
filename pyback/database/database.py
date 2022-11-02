
import json
import xml.etree.ElementTree as ET

import database.entities


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

    # with open('/Users/jakub/db.json', 'w') as f:
    with open('/tmp/db.json', 'w') as f:
        json.dump(db, f)

    return db
