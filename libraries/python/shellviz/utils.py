from .utils_serialize import to_json_string
import inspect
import re
import os
import types
import sys

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


def get_stack_trace():
    shellviz_dir = os.path.dirname(os.path.abspath(__file__))
    cwd = os.getcwd()
    stack = inspect.stack()[1:]  # skip this function's frame
    trace = []

    # Known REPL/IPython internals
    ipython_internals = {
       '_', '__', '___', '__builtins__', '__doc__', '__loader__', '__name__', '__package__', '__spec__', '__file__', '__cached__', 'In', 'Out'
    }

    def is_user_code(filename):
        # Always include frames whose basename starts with '<' (e.g. <ipython-input-*>, <stdin>, <console>, etc.)
        if os.path.basename(str(filename)).startswith('<'):
            return True
        filename = os.path.abspath(filename)
        if shellviz_dir in filename:
            return False
        if '/site-packages/' in filename or '/dist-packages/' in filename:
            return False
        if '/lib/python' in filename:
            return False
        if 'IPython' in filename or 'ipython' in filename:
            return False
        # Include all other frames
        return True

    def is_interactive():
        try:
            from IPython import get_ipython
            if get_ipython():
                return True
        except ImportError:
            pass
        if hasattr(sys, 'ps1') or getattr(sys.flags, 'interactive', 0):
            return True
        return False

    interactive = is_interactive()

    for frame_info in stack:
        frame = frame_info.frame
        filename = os.path.abspath(frame_info.filename)
        if not is_user_code(filename):
            continue
        # Filter locals: only user-defined variables
        filtered_locals = {}
        for name, value in frame.f_locals.items():
            # Skip dunder names
            if name.startswith('__') and name.endswith('__'):
                continue
            # Skip IPython internals and all _i* and _o* patterns if interactive
            if name in ipython_internals:
                continue
            if interactive and (re.match(r'^_i.*$', name) or re.match(r'^_o.*$', name) or re.match(r'^_d.*$', name)):
                continue
            # Skip imported modules
            if isinstance(value, types.ModuleType):
                continue
            # Skip functions and classes
            if isinstance(value, (types.FunctionType, types.BuiltinFunctionType, type)):
                continue
            # Skip callables
            if callable(value):
                continue
            filtered_locals[name] = to_json_string(value)
        trace.insert(0, {
            "function": frame_info.function,
            "filename": frame_info.filename,
            "lineno": frame_info.lineno,
            "code": frame_info.code_context[0].strip() if frame_info.code_context else None,
            "locals": filtered_locals
        })
    return trace