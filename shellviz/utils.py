def append_data(source_data, new_data):
    """
    Tries to append new data to the existing values
    Will append to a list, update a dictionary, or concatenate a string
    """
    if not source_data:
        source_data = new_data
    elif isinstance(source_data, list) and isinstance(new_data, list):
        source_data += new_data
    elif isinstance(source_data, list):
        source_data.append(new_data)
    elif isinstance(source_data, dict) and isinstance(new_data, dict):
        source_data.update(new_data)
    elif isinstance(source_data, str):
        source_data += new_data
    else:
        try:
            source_data += new_data
        except TypeError:
            source_data = new_data
    return source_data