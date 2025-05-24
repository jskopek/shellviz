from shellviz import Shellviz
import time

def cli():
    s = Shellviz(show_url=True)
    try:
        print("Shellviz CLI started. Press Ctrl+C to exit.")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Shellviz CLI stopped.")
        s.shutdown()

if __name__ == '__main__':
    cli()