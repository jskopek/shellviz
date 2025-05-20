import logging
from typing import Optional, Dict, Any
from . import _global_shellviz, Shellviz

class ShellvizHandler(logging.Handler):
    """
    A Django logging handler that sends logs to Shellviz.
    
    This handler can be used to send Django logs to Shellviz for visualization.
    It's designed to be used as an optional integration - if Django is not being used,
    this handler won't affect anything.
    
    Example usage in Django settings.py:
    
    LOGGING = {
        'version': 1,
        'handlers': {
            'shellviz': {
                'class': 'shellviz.django.logging.ShellvizHandler',
                'level': 'INFO',
                'formatter': 'verbose',
            },
        },
        'loggers': {
            'django': {
                'handlers': ['shellviz'],
                'level': 'INFO',
                'propagate': True,
            },
        },
    }
    """
    
    def __init__(self, level: int = logging.NOTSET, 
                 shellviz_instance: Optional[Shellviz] = None,
                 log_id: str = 'log'):
        """
        Initialize the handler.
        
        Args:
            level: The logging level for this handler
            shellviz_instance: Optional Shellviz instance to use. If not provided,
                             a new instance will be created.
            log_id: The ID to use for the log entries in Shellviz
        """
        super().__init__(level)
        self.shellviz = shellviz_instance or _global_shellviz()
        self.log_id = log_id
        
    def emit(self, record: logging.LogRecord) -> None:
        """
        Emit a log record to Shellviz.
        
        Args:
            record: The log record to emit
        """
        try:
            # Create a structured log entry
            # log_entry = {
            #     'timestamp': record.created,
            #     'level': record.levelname,
            #     'message': record.getMessage(),
            #     'module': record.module,
            #     'function': record.funcName,
            #     'line': record.lineno,
            # }
            log_entry = record.getMessage()
            
            # Add extra fields if they exist
            if hasattr(record, 'extra'):
                log_entry.update(record.extra)
                
            # Send to Shellviz using the log view
            self.shellviz.log(log_entry, id=self.log_id)
            
        except Exception:
            self.handleError(record)