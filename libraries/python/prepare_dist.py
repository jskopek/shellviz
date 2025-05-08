import os
import shutil
from pathlib import Path

def build():
    """Poetry build hook that prepares the dist directory with all necessary files."""
    # Get the project root directory
    root_dir = Path(__file__).parent.parent.parent
    client_dist = root_dir / "client" / "dist"
    package_dir = root_dir / "python" / "shellviz" / "dist"
    
    # Check if client/dist exists and has required files
    required_files = [
        "index.html",
        "static/js/main.js",
        "static/css/main.css"
    ]
    
    missing_files = []
    for file in required_files:
        if not (client_dist / file).exists():
            missing_files.append(file)
    
    if missing_files:
        raise FileNotFoundError(
            "Missing required client/dist files. Please run the client build script first.\n"
            f"Missing files: {', '.join(missing_files)}\n"
            f"Folder: {client_dist}"
        )
    
    # Create necessary directories
    for file in required_files:
        target_path = package_dir / file
        os.makedirs(target_path.parent, exist_ok=True)
        print(f"Copying {client_dist / file} to {target_path}")
        shutil.copy2(client_dist / file, target_path)
    
    # Copy README.md from root
    readme_source = root_dir / "README.md"
    if not readme_source.exists():
        raise FileNotFoundError("README.md not found in project root directory")
    
    shutil.copy2(readme_source, package_dir / "README.md")

# This is the function that Poetry will call
build_hook = build 

if __name__ == "__main__":
    build()