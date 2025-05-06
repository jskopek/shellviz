import json
import datetime
import decimal
import uuid
from pathlib import Path

# Optional Django support
try:
    from django.db.models.query import QuerySet
    from django.db.models import Model
    from django.utils.functional import Promise
except ImportError:
    QuerySet = type('QuerySet', (), {})
    Model = type('Model', (), {})
    Promise = type('Promise', (), {})

def to_json_safe(data):
    def convert(obj):
        if isinstance(obj, (str, int, float, bool)) or obj is None:
            return obj
        elif isinstance(obj, decimal.Decimal):
            return float(obj)
        elif isinstance(obj, (datetime.datetime, datetime.date, datetime.time)):
            return obj.isoformat()
        elif isinstance(obj, uuid.UUID):
            return str(obj)
        elif isinstance(obj, (set, frozenset)):
            return [convert(i) for i in obj]
        elif isinstance(obj, Path):
            return str(obj)
        elif isinstance(obj, QuerySet):
            return [convert(item) for item in obj]
        elif isinstance(obj, Model):
            return {
                k: convert(v)
                for k, v in obj.__dict__.items()
                if not k.startswith('_') and not callable(v)
            }
        elif isinstance(obj, Promise):
            return str(obj)
        elif isinstance(obj, dict):
            return {convert(k): convert(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [convert(i) for i in obj]
        else:
            try:
                return str(obj)
            except Exception:
                return repr(obj)

    return convert(data)

def to_json_string(data):
    return json.dumps(to_json_safe(data), ensure_ascii=False)