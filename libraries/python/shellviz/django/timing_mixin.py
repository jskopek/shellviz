import time
import functools
from .. import table


class TimingMixin:
    """
    A mixin that automatically times public method calls (non-private methods that don't start with '_') 
    using shellviz.table.
    
    This mixin can be added to any class to automatically track method execution times.
    All public methods will be timed and logged to a shellviz table, but only if they exceed
    the minimum timing threshold.
    
    Usage:
        class MyClass(TimingMixin):
            # Optional: override the minimum timing threshold (default is 0.05 seconds / 50ms)
            min_timing_threshold = 0.1  # Only log methods that take 100ms or longer
            
            def public_method(self):
                # This will be timed if it takes longer than min_timing_threshold
                time.sleep(0.1)
                return "result"
            
            def _private_method(self):
                # This will NOT be timed (starts with _)
                pass
            
            def __special_method__(self):
                # This will NOT be timed (dunder method)
                pass
    
    The timing data is logged to shellviz using a table with the ID "timing_{ClassName}".
    Each row shows [method_name, execution_time_seconds].
    
    Attributes:
        min_timing_threshold (float): Minimum execution time in seconds before a method
            is logged to the timing table. Defaults to 0.05 (50ms). Can be overridden
            by subclasses.
    """
    
    # Default minimum timing threshold: 5ms
    min_timing_threshold = 0.005
    timing_id = None
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.timing_id:
            self.timing_id = f"timing_{self.__class__.__name__}"

        # reset the table
        table([[]], id=self.timing_id)
        
    def __getattribute__(self, name):
        """Intercept method calls to add timing functionality."""
        attr = super().__getattribute__(name)
        
        # Only wrap instance methods that are:
        # 1. Callable
        # 2. Don't start with underscore (public methods only)
        # 3. Are not already wrapped
        # 4. Are not class/static methods or properties
        if (callable(attr) and 
            not name.startswith('_') and 
            not hasattr(attr, '_timing_wrapped') and
            hasattr(attr, '__self__') and attr.__self__ is self):
            
            # Create a timing wrapper
            @functools.wraps(attr)
            def timed_method(*args, **kwargs):
                # Record start time
                start_time = time.time()
                
                # Call the original method
                result = attr(*args, **kwargs)
                
                # Calculate execution time
                end_time = time.time()
                execution_time = end_time - start_time
                
                # Only log if execution time exceeds the threshold
                if not self.min_timing_threshold or execution_time >= self.min_timing_threshold:
                    table([name, f"{execution_time:.6f}s"], id=self.timing_id, append=True)
                
                return result
                               
            # Mark as wrapped to avoid double wrapping
            timed_method._timing_wrapped = True
            return timed_method
        
        return attr
