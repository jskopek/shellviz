from shellviz import Shellviz
import time

def cli():
    s = Shellviz(show_url=True)
    while True:
        time.sleep(1)

if __name__ == '__main__':
    cli()