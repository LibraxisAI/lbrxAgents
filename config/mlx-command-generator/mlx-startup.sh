#!/bin/zsh
# STARTUP.SH - Final English Version (April 9, 2025)
# Initial setup script for new machines for ML, CSM/Sesame, and daily work.
# Compatible with MLX-LM on Apple Silicon (macOS 15.0+), Cursor, Cloudflare ZeroTrust, Zerotier-One
#
# Note: This script REQUIRES ZSH as the interpreter. Run it in a ZSH environment
#       where you have installation privileges and write access to your home directory.
# Remember - certain steps (like GitHub CLI login, Cloudflare/Zerotier config)
#       and the full pyenv initialization will require user interaction or a new terminal session.
# Assumes Homebrew is already installed.

set -euo pipefail

# === CONFIGURATION VARIABLES ===
ML_PROJECTS_DIR="$HOME/ml-projects"
PYTHON_VERSION="3.12.3" # Default Python version to install and set globally

# === HELPER FUNCTIONS ===
ensure_brew_package() {
  local pkg=$1
  # Extract package name without version specifier if present (e.g., openssl@3 -> openssl)
  local pkg_name=${pkg%%@*}
  if ! brew list --formula | grep -q "^${pkg_name}"; then
    echo "--> Installing Brew package: $pkg..."
    brew install "$pkg"
  else
    echo "--> Brew package $pkg_name is already installed."
  fi
}

ensure_brew_cask() {
  local cask=$1
  if ! brew list --cask | grep -q "^$cask"; then
    echo "--> Installing Brew Cask application: $cask..."
    brew install --cask "$cask"
  else
    echo "--> Brew Cask application $cask is already installed."
  fi
}

echo "=== STARTING SYSTEM SETUP (ZSH Required) ==="

##############################
# 1. Check & Update Homebrew
##############################
echo "[1/15] Checking and Updating Homebrew..."
if ! command -v brew &>/dev/null; then
  echo "[ERROR] Homebrew is not installed or not in PATH. Please install Homebrew first and re-run this script." >&2
  echo "Visit https://brew.sh/ for installation instructions." >&2
  exit 1
else
  echo "--> Homebrew found. Updating Homebrew and formulae..."
  brew update
  # Ensure Brew environment is set for the CURRENT script session
  if [[ -x "$(brew --prefix)/bin/brew" ]]; then
      eval "$("$(brew --prefix)/bin/brew" shellenv)"
      # Ensure Brew env is configured in ~/.zshrc for future sessions (add if not present)
      if ! grep -q 'eval \"\$(\$(brew --prefix)/bin/brew shellenv)\"' ~/.zshrc; then
          echo "--> Adding Brew configuration to ~/.zshrc (for future sessions)..."
          (echo; echo 'eval \"\$($(brew --prefix)/bin/brew shellenv)\"') >> ~/.zshrc
      fi
  else
      echo "[WARNING] 'brew' command found, but not in the expected path $(brew --prefix)." >&2
  fi
fi

##############################
# 2. Install Brew Packages (Essentials)
##############################
echo "[2/15] Installing essential Brew packages..."

# General, dev, and build tools
ensure_brew_package "git"
ensure_brew_package "git-lfs"
ensure_brew_package "gh" # GitHub CLI
ensure_brew_package "wget"
ensure_brew_package "curl"
ensure_brew_package "jq"   # JSON processor
ensure_brew_package "rclone"
ensure_brew_package "rsync"
ensure_brew_package "htop"
ensure_brew_package "tree"
ensure_brew_package "zstd" # Compression
ensure_brew_package "xz"   # Compression

# Development and compilation tools
ensure_brew_package "cmake"
ensure_brew_package "ninja"
ensure_brew_package "llvm" # Needed for some Python packages
ensure_brew_package "gcc"  # May be needed
ensure_brew_package "pkg-config"
ensure_brew_package "autoconf"
ensure_brew_package "automake"
ensure_brew_package "libtool"

# Key libraries (often needed for compiling Python/packages)
ensure_brew_package "openssl@3" # Often required
ensure_brew_package "readline"
ensure_brew_package "sqlite"
ensure_brew_package "xz" # Already listed, but ensures it's checked
ensure_brew_package "zlib"
ensure_brew_package "libffi" # For ctypes

# Multimedia and scientific libraries
ensure_brew_package "ffmpeg"
ensure_brew_package "libsndfile"
ensure_brew_package "libogg"
ensure_brew_package "libvorbis"
ensure_brew_package "libsamplerate"
ensure_brew_package "openblas" # NumPy/SciPy dependency
ensure_brew_package "libjpeg"
ensure_brew_package "libpng"

# Python and package management
ensure_brew_package "pyenv" # To manage Python versions
ensure_brew_package "uv"    # Fast Python package installer

# ZeroTrust and VPN tools
echo "[2/15a] Installing Cloudflare ZeroTrust (cloudflared) and Zerotier-One..."
ensure_brew_package "cloudflared"
ensure_brew_cask "zerotier-one"

##############################
# 3. Configure pyenv in ~/.zshrc (for future sessions)
##############################
echo "[3/15] Configuring pyenv in ~/.zshrc (for future sessions)..."
# Note: Full pyenv initialization requires a new terminal session!
if ! grep -q 'export PYENV_ROOT="$HOME/.pyenv"' ~/.zshrc; then
  echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
fi
if ! grep -q 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' ~/.zshrc; then
  echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
fi
if ! grep -q 'eval "$(pyenv init -)"' ~/.zshrc; then
  echo 'eval "$(pyenv init -)"' >> ~/.zshrc
fi
# Set PYENV_ROOT for the current script session
export PYENV_ROOT="$HOME/.pyenv"
# Add pyenv shims and bin to PATH for the current script session
export PATH="$PYENV_ROOT/shims:$PYENV_ROOT/bin:$PATH"


##############################
# 4. Install Python $PYTHON_VERSION using pyenv
##############################
echo "[4/15] Installing Python $PYTHON_VERSION via pyenv..."
if ! pyenv versions --bare | grep -q "^$PYTHON_VERSION$"; then
  echo "--> Starting Python $PYTHON_VERSION installation..."
  # Simplified installation without CFLAGS/LDFLAGS - should work in most cases
  # If compilation fails, uncomment and adjust the flags below as needed:
  # CFLAGS="-I$(brew --prefix openssl@3)/include -I$(brew --prefix readline)/include -I$(brew --prefix sqlite)/include -I$(brew --prefix xz)/include -I$(brew --prefix zlib)/include"
  # LDFLAGS="-L$(brew --prefix openssl@3)/lib -L$(brew --prefix readline)/lib -L$(brew --prefix sqlite)/lib -L$(brew --prefix xz)/lib -L$(brew --prefix zlib)/lib"
  # env CFLAGS="$CFLAGS" LDFLAGS="$LDFLAGS" pyenv install $PYTHON_VERSION
  pyenv install $PYTHON_VERSION
  echo "--> Python $PYTHON_VERSION installation complete."
else
  echo "--> Python $PYTHON_VERSION is already installed via pyenv."
fi
echo "--> Setting global Python version to $PYTHON_VERSION..."
pyenv global $PYTHON_VERSION
pyenv rehash # Ensure shims are up-to-date

##############################
# 5. Configure UV
##############################
echo "[5/15] Configuring uv..."
mkdir -p ~/.config/uv
# Use heredoc with quoted EOF to prevent variable expansion
cat > ~/.config/uv/config.toml << 'EOF'
[python]
implementation = "cpython"
version = "3.12" # Matches the installed version

[cache]
max_size = "10GB"
dir = "~/.cache/uv"

[venv]
location = "standard" # Creates .venv in project dir
pip = false # uv manages packages

[index]
url = "https://pypi.org/simple"
EOF

##############################
# 6. Create ML projects directory and virtual environment
##############################
echo "[6/15] Creating directory $ML_PROJECTS_DIR and virtual environment..."
mkdir -p "$ML_PROJECTS_DIR"
cd "$ML_PROJECTS_DIR"
if [ ! -d ".venv" ]; then
    echo "--> Creating virtual environment .venv using uv..."
    uv venv --python=$PYTHON_VERSION
    echo "--> Virtual environment .venv created."
else
    echo "--> Virtual environment .venv already exists."
fi
# Note: The environment is NOT activated within this script.
# Activate it manually in your terminal: source $ML_PROJECTS_DIR/.venv/bin/activate
# Or use 'uv run ...'

##############################
# 7. Install Core Python ML packages (into venv)
##############################
echo "[7/15] Installing core Python ML dependencies into .venv..."
# Use uv to install into the detected .venv in the current directory
uv pip install --upgrade pip wheel setuptools # Good practice
uv pip install \
    numpy==1.26.4 \
    scipy==1.15.0 \
    pandas==2.2.3 \
    matplotlib==3.10.0 \
    ipython jupyter jupyterlab

##############################
# 8. Install MLX and Hugging Face dependencies (into venv)
##############################
echo "[8/15] Installing MLX and HuggingFace dependencies into .venv..."
uv pip install \
    mlx==0.24.2 \
    mlx-lm==0.22.4 \
    llm-mlx==0.3.0 \
    transformers==4.44.2 \
    tokenizers==0.19.1 \
    huggingface-hub==0.27.1 \
    hf_transfer \
    accelerate==1.2.1 \
    safetensors==0.5.2 \
    datasets==3.2.0 \
    evaluate==0.4.3

##############################
# 9. Setup CSM-MLX (clone and install locally)
##############################
CSM_MLX_DIR="$ML_PROJECTS_DIR/csm-mlx"
echo "[9/15] Cloning and setting up CSM-MLX in $CSM_MLX_DIR..."
if [ ! -d "$CSM_MLX_DIR" ]; then
    git clone https://github.com/senstella/csm-mlx.git "$CSM_MLX_DIR"
else
    echo "--> Directory $CSM_MLX_DIR already exists, skipping clone."
fi
cd "$CSM_MLX_DIR"
echo "--> Installing csm-mlx in editable mode and extra dependencies..."
uv pip install -e .
# Additional dependencies for CSM
uv pip install \
    soundfile==0.13.0 \
    librosa==0.9.2 \
    pydub==0.25.1 \
    SpeechRecognition==3.14.2 \
    gradio==5.12.0

# Model download moved to post-install section

##############################
# 10. Setup Sesame CSM UI (clone and install)
##############################
SESAME_UI_DIR="$ML_PROJECTS_DIR/sesame-csm-ui"
echo "[10/15] Cloning Sesame CSM UI in $SESAME_UI_DIR..."
if [ ! -d "$SESAME_UI_DIR" ]; then
    git clone https://github.com/akashjss/sesame-csm.git "$SESAME_UI_DIR"
else
    echo "--> Directory $SESAME_UI_DIR already exists, skipping clone."
fi
cd "$SESAME_UI_DIR"
if [ -f "requirements-mlx.txt" ]; then
    echo "--> Installing dependencies for Sesame CSM UI (mlx)..."
    uv pip install -r requirements-mlx.txt
else
    echo "[WARNING] requirements-mlx.txt not found in $SESAME_UI_DIR." >&2
fi

##############################
# 11. Install Daily Workflow Tools (into venv)
##############################
echo "[11/15] Installing workflow tools into .venv..."
cd "$ML_PROJECTS_DIR" # Go back to the main project dir
uv pip install \
    ruff==0.9.1 \
    rich==13.9.4 \
    typer==0.15.1 \
    pytest==8.3.4 \
    psutil==6.1.1 \
    tqdm==4.67.1 \
    wandb==0.19.2 \
    python-dotenv \
    openai \
    anthropic

##############################
# 12. Prepare Directory for Polish Voice Samples (CSM)
##############################
SAMPLES_DIR="$ML_PROJECTS_DIR/csm-mlx/samples/polish_voice"
echo "[12/15] Creating directory for Polish voice samples: $SAMPLES_DIR..."
mkdir -p "$SAMPLES_DIR"

##############################
# 13. Configure Global Git .gitignore
##############################
echo "[13/15] Configuring global Git settings and ~/.gitignore..."
git config --global core.excludesFile ~/.gitignore
# Use heredoc with quoted EOF
cat > ~/.gitignore << 'EOF'
# macOS
.DS_Store
.AppleDouble
.LSOverride

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.env
.venv/
env/
venv/
ENV/
env.bak/
venv.bak/

# Build artifacts
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
pip-wheel-metadata/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Jupyter Notebook
.ipynb_checkpoints

# IDE / Editor
.vscode/
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Cache
.pytest_cache/
.mypy_cache/
.ruff_cache/
.uv_cache/ # If uv cache is placed locally
EOF

##############################
# 14. Post-installation Recommendations and Configuration
##############################
echo "[14/15] === IMPORTANT: POST-INSTALLATION STEPS ==="
echo "--------------------------------------------------"
echo "1. RESTART YOUR TERMINAL for changes in ~/.zshrc (pyenv) to take full effect."
echo "2. ACTIVATE THE VIRTUAL ENVIRONMENT before working on projects:"
echo "   cd $ML_PROJECTS_DIR"
echo "   source .venv/bin/activate"
echo "   (To exit: deactivate)"
echo "3. Log in to GitHub CLI:"
echo "   gh auth login"
echo "4. Download the CSM-1B-MLX model (if needed):"
echo "   cd $ML_PROJECTS_DIR/csm-mlx"
echo "   mkdir -p models"
echo "   echo 'Downloading CSM model (this may take a while)...'"
echo "   HF_HUB_ENABLE_HF_TRANSFER=1 python -c \"from huggingface_hub import snapshot_download; snapshot_download('senstella/csm-1b-mlx', local_dir='models/csm-1b-mlx')\""
echo "5. Clone the MLX-Examples repository (if needed):"
echo "   cd $ML_PROJECTS_DIR"
echo "   git clone https://github.com/ml-explore/mlx-examples.git"
echo "6. Test MLX-LM (requires activated .venv):"
echo "   python -m mlx_lm.generate --model mlx-community/Marcoro14-7B-4bit --prompt \"Write a short story about a cat learning to code.\" --max-tokens 100"
echo "7. Test Sesame CSM: See README in $SESAME_UI_DIR (requires activated .venv)."
echo "8. Configure Cloudflare ZeroTrust:"
echo "   cloudflared access login (follow prompts)"
echo "9. Configure Zerotier-One:"
echo "   Open the Zerotier One application, log in, and join your network ID."
echo "10. Add Voice Samples for CSM:"
echo "    Place 3-10 recordings (5-10 seconds, WAV, 16kHz) in $SAMPLES_DIR"
echo "11. (Optional) Change Global Python Version:"
echo "    If you install other Python versions with 'pyenv install <version>', you can switch the global default using:"
echo "    pyenv global <version>"
echo "    Example: pyenv global 3.11.8"
echo "    Remember to run 'pyenv rehash' after changing."
echo "--------------------------------------------------"

##############################
# 15. Finish
##############################
echo "[15/15] Basic setup completed."
echo "Remember to perform the post-installation steps after restarting your terminal."
echo "Enjoy your super-fast ML workstation!"
echo "=== SCRIPT FINISHED ==="
