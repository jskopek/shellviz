from shellviz import log, stack, table, json, clear, wait, Shellviz
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
            }], id=id, view='table')
        time.sleep(random.random() * 2)
        s.send([{
            'time': time.time() - t0,
            'label': 'Step 2'
            }], id=id, view='table', append=True)
        time.sleep(random.random() * 2)
        s.send([{
            'time': time.time() - t0,
            'label': 'Step 3'
            }], id=id, view='table', append=True)


def test_progress():
    while True:
        s.send(random.random(), id='progress')
        time.sleep(5)

def test_area():
    s.send([{"x": "0", "y": 179}, {"x": "helicopter", "y": 15}, {"x": "boat", "y": 281}], wait=True)
    s.send([
        {
            "country": "AD",
            "hot dog": 105,
            "burger": 129,
            "sandwich": 37,
            "kebab": 119,
            "fries": 53,
            "donut": 69,
            },
        {
            "country": "AE",
            "hot dog": 41,
            "burger": 14,
            "sandwich": 181,
            "kebab": 166,
            "fries": 36,
            "donut": 105,
            },
        ], wait=True)

def test_log():
    id = str(random.random())
    i = 0
    for i in range(10):
        log(f"Log message {i}", id=id)
        time.sleep(random.random())
    #while True:
    #    s.log(f"Log message {i}", id=id)
    #    i += 1
    #    time.sleep(0.5)

def test_stack():
    def level_three():
        z = [1, 2, 3]
        stack()

    def level_two():
        y = "hello"
        level_three()

    def level_one():
        x = 42
        level_two()

    level_one()

# Usage example
if __name__ == "__main__":

    #table([['one','two']], id='table', append=True)
    #table([['three','four'], ['five','six']], id='table', append=True)

    # log('one')
    # log(random.random())
    # wait()




    # Start server instance

    # x = 123123
    # def level_two():
    #     y = {'a': 1, 'b': 2}
    #     s.stack()
    # level_two()

    log('Hello from Python')
    wait()
    print('Connected!')
    print('Sending example stack...')
    test_stack()
    wait()

    time.sleep(.5)
    print('Sending example logs...')
    test_log()
    # s.send('hello world')
    #while True:
    #    time.sleep(1)
    time.sleep(1)
    print('Sending example JSON data...')
    json({
        "glossary": {
            "title": "example glossary",
            "GlossDiv": {
                "title": "S",
                "GlossList": {
                    "GlossEntry": {
                        "ID": "SGML",
                        "SortAs": "SGML",
                        "GlossTerm": "Standard Generalized Markup Language",
                        "Acronym": "SGML",
                        "Abbrev": "ISO 8879:1986",
                        "GlossDef": {
                            "para": "A meta-markup language, used to create markup languages such as DocBook.",
                            "GlossSeeAlso": ["GML", "XML"]
                            },
                        "GlossSee": "markup"
                        }
                    }
                }
            }
        })
wait()
print('All done!')

    # # test_logging()
    # # test_content_input()
    # # test_profiling()
    #test_progress()

    # test_area()

