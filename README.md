# Shellviz

![shellviz](https://github.com/jskopek/shellviz-next/blob/main/public/icon.png).

# Installation

Requirements
- Node
- Supabase

1. Install the app
```
npm install
cp .env.example .env
```

2. Install Supabase
3. Update .env with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_KEY` connection strings
4. Run the server:
```
npm start
```

5. Install python package
```
pip install shellviz
```

# Getting Started

```
ipython
from shellviz import Shellviz

# Simple visualization using the default https://shellviz.com server
Shellviz().visualize('hello world')

# Customizing the domain to run locally
sv = Shellviz(domain='http://localhost:3000')
sv.visualize([1,2,3,4])
sv.visualize({'hello': 'world'}, id='data-i-will-update')
sv.visualize({'hello': 'modified world'}, id='data-i-will-update')
```

# Additional Information

- [Docs](https://shellviz.com)
- [Release Notes](RELEASES.md)
