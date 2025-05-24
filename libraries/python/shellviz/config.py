import os


def _get_django_setting(key: str):
    """
    Try to get a setting from Django settings if Django is available.
    Returns None if Django is not available or the setting doesn't exist.
    """
    try:
        from django.conf import settings
        if hasattr(settings, 'configured') and settings.configured:
            return getattr(settings, key, None)
    except (ImportError, Exception):
        pass
    return None


def _str_to_bool(value):
    """Convert string representation to boolean."""
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', '1', 'yes', 'on')
    return None


def _str_to_int(value):
    """Convert string representation to integer."""
    if value is None:
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def _get_config_value(django_key: str, env_key: str, converter=None):
    """
    Get configuration value with Django settings -> environment variable fallback.
    Returns None if neither is found (letting classes use their own defaults).
    """
    # Try Django settings first
    value = _get_django_setting(django_key)
    if value is not None:
        return converter(value) if converter else value
    
    # Try environment variable
    value = os.environ.get(env_key)
    if value is not None:
        return converter(value) if converter else value
    
    # Return None if neither found
    return None


# Compute configuration values once on import
SHELLVIZ_PORT = _get_config_value('SHELLVIZ_PORT', 'SHELLVIZ_PORT', _str_to_int)
SHELLVIZ_SHOW_URL = _get_config_value('SHELLVIZ_SHOW_URL', 'SHELLVIZ_SHOW_URL', _str_to_bool)
SHELLVIZ_URL = _get_config_value('SHELLVIZ_URL', 'SHELLVIZ_URL') 