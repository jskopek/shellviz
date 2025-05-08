import subprocess
import os
import sys
from pathlib import Path
import shutil

def run_client_build():
    client_dir = Path(__file__).parent.parent.parent / "client"
    print("Running npm install...")
    npm_install = subprocess.run(["npm", "install"], cwd=client_dir)
    if npm_install.returncode != 0:
        print("Warning: npm install exited with errors, but continuing...")

    print("Running npm run build...")
    npm_build = subprocess.run(["npm", "run", "build"], cwd=client_dir)
    if npm_build.returncode != 0:
        print("Warning: npm run build exited with errors, but continuing...")

def copy_client_files():
    root_dir = Path(__file__).parent.parent.parent
    client_dist = root_dir / "client" / "dist"
    package_dir = root_dir / "python" / "shellviz" / "dist"
    required_files = [
        "index.html",
        "static/js/main.js",
        "static/css/main.css"
    ]
    missing = []
    for file in required_files:
        src = client_dist / file
        dst = package_dir / file
        if not src.exists():
            missing.append(str(src))
            continue
        os.makedirs(dst.parent, exist_ok=True)
        shutil.copy2(src, dst)
    readme_source = root_dir / "README.md"
    shutil.copy2(readme_source, package_dir / "README.md")
    if missing:
        print("\nERROR: The following required files are missing after client build:")
        for f in missing:
            print("  -", f)
        print("Aborting build.")
        sys.exit(1)

def run_poetry_build():
    python_dir = Path(__file__).parent
    subprocess.check_call(["poetry", "build"], cwd=python_dir)

if __name__ == "__main__":
    print("Building with latest client...")
    run_client_build()
    print("Copying client files...")
    copy_client_files()
    print("Running poetry build...")
    run_poetry_build()
    print("Done!")