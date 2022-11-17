import json
import os

from pyback.settings import BASE_DIR

__CONFIG_OBJECT = {}
__TIMETABLES_MAP = {}
__CONFIG_PATH = './config.json'


def __get_config_value(key: str, type_):
    value = __CONFIG_OBJECT[key]
    assert type(value) == type_
    return value


def get_config_string(key: str) -> str:
    return __get_config_value(key, str)


def get_config_int(key: str) -> int:
    return __get_config_value(key, int)


def get_config_bool(key: str) -> bool:
    return __get_config_value(key, bool)


def set_config(key: str, value: any):
    changed = __CONFIG_OBJECT[key] != value if key in __CONFIG_OBJECT else True
    if not changed:
        return

    __CONFIG_OBJECT[key] = value

    with open(BASE_DIR.joinpath(__CONFIG_PATH), 'w') as f:
        json.dump(__CONFIG_OBJECT, f)


with open(BASE_DIR.joinpath(__CONFIG_PATH), 'r') as f:
    __CONFIG_OBJECT = json.load(f)

try:
    os.makedirs(BASE_DIR.joinpath(get_config_string('timetablesPath')))
except FileExistsError:
    pass


try:
    with open(BASE_DIR.joinpath(get_config_string('timetablesPath')).joinpath('.config.json'), 'r') as f:
        __TIMETABLES_MAP = json.load(f)
except IOError:
    print('Failed to load existing timetables data, file probably absent')


def __save_timetables_config():
    with open(BASE_DIR.joinpath(get_config_string('timetablesPath')).joinpath('.config.json'), 'w') as f:
        json.dump(__TIMETABLES_MAP, f)


def new_id() -> int:
    import random
    import time
    return time.time_ns() % random.randint(0, 10000000)


def register_new_timetable(name: str, activate_since: int):
    info = {
        'id': new_id(),
        'name': name,
        'isValidFrom': activate_since,
    }
    __TIMETABLES_MAP[info['id']] = info
    __save_timetables_config()
    return info


def delete_timetable(id: int) -> bool:
    id = str(id)
    if id not in __TIMETABLES_MAP:
        return False
    if get_config_int('currentTimetableId') == int(id):
        return False

    del __TIMETABLES_MAP[id]
    __save_timetables_config()
    return True


def get_timetables_list():
    return list(sorted(list(__TIMETABLES_MAP.values()), key=lambda x: x['isValidFrom']))


def timetable_exists(id: int) -> bool:
    return str(id) in __TIMETABLES_MAP


def get_timetable_path_by_id(id: int) -> bool:
    return BASE_DIR.joinpath(get_config_string('timetablesPath')).joinpath(str(id))
