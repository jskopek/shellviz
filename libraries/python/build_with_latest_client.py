import subprocess
import os
import sys
from pathlib import Path
import shutil

def run_client_build():
    client_dir = Path(__file__).parent.parent.parent / "client"

    print("Running npm run build...")
    npm_build = subprocess.run(["npm", "run", "build"], cwd=client_dir)
    if npm_build.returncode != 0:
        print("Warning: npm run build exited with errors, but continuing...")

def copy_client_files():
    root_dir = Path(__file__).parent.parent.parent
    client_dist = root_dir / "client" / "build"
    package_dir = root_dir / "libraries" / "python" / "shellviz" / "static" / "shellviz"
    # empty the package dir before copying
    if package_dir.exists():
        shutil.rmtree(package_dir)
    # Recursively copy all files and directories from client_dist to package_dir
    shutil.copytree(client_dist, package_dir, dirs_exist_ok=True)

def run_poetry_build():
    python_dir = Path(__file__).parent
    subprocess.check_call(["poetry", "build"], cwd=python_dir)

def toggle_rule_in_gitignore(rule, gitignore_path):
    """
    Toggles a rule in a gitignore file.
    """
    with open(gitignore_path, "r") as f:
        lines = f.readlines()
    with open(gitignore_path, "w") as f:
        for line in lines:
            stripped = line.strip()
            if stripped.lstrip("# ").startswith(rule):
                if stripped.startswith("#"):
                    # Uncomment the rule
                    new_line = stripped.lstrip("# ").rstrip() + "\n"
                else:
                    # Comment the rule
                    new_line = "# " + stripped + "\n"
                f.write(new_line)
            else:
                f.write(line)

if __name__ == "__main__":
    print("Building with latest client...")
    run_client_build()
    print("Copying client files...")
    copy_client_files()
    print("Running poetry build...")
    root_dir = Path(__file__).parent.parent.parent
    gitignore_path = root_dir / ".gitignore"
    toggle_rule_in_gitignore("libraries/python/shellviz/static/shellviz", gitignore_path) # This is a bit of a hack, as the poetry build stage seems to be ignorning files and folders that are in the .gitignore file.
    run_poetry_build()
    toggle_rule_in_gitignore("libraries/python/shellviz/static/shellviz", gitignore_path) # This is a bit of a hack, as the poetry build stage seems to be ignorning files and folders that are in the .gitignore file.
    print("Done!")