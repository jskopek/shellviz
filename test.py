from shellviz import Shellviz
import random, time



def test_logging():
    while True:
        s.send('this is a sample log value\n', id='log', append=True)
        time.sleep(1)


def test_content_input():
    while True:
        try:
            content = input("Enter content: ")
            s.send(content, id='woo', append=True)
        except KeyboardInterrupt:
            break


def test_profiling():
    id = random.random()
    while True:
        t0 = time.time()
        time.sleep(random.random() * 3)
        # s.clear()
        s.send([{
            'time': time.time() - t0,
            'label': 'Step 1',
        }], id=id, visualization='table')
        time.sleep(random.random() * 2)
        s.send([{
            'time': time.time() - t0,
            'label': 'Step 2'
        }], id=id, visualization='table', append=True)
        time.sleep(random.random() * 2)
        s.send([{
            'time': time.time() - t0,
            'label': 'Step 3'
        }], id=id, visualization='table', append=True)


def test_progress():
    while True:
        s.send(random.random(), id='progress')
        time.sleep(5)


# Usage example
if __name__ == "__main__":
    # Start server instance
    s = Shellviz(show_url=True)

    # test_logging()
    # test_content_input()
    test_profiling()
    # test_progress()

