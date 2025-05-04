# Project: ML Workstation Setup & MLX Framework Insights

This repository contains a setup script (`mlx-startup.sh`) and summarizes key considerations for setting up a powerful Machine Learning (ML) workstation, specifically targeting Apple Silicon 128GB+ Unified Memory configurations and leveraging the MLX framework.

## `mlx-startup.sh` Script

### Purpose

The `mlx-startup.sh` script automates the initial setup of a macOS machine for ML development, focusing on:

*   **Environment Consistency:** Installs essential development tools, libraries, and specific versions of Python and ML packages.
*   **MLX Focus:** Sets up the MLX framework, MLX-LM, related Hugging Face libraries, and custom projects like CSM-MLX and Sesame CSM UI.
*   **Python Management:** Uses `pyenv` for Python version management and `uv` for fast package installation and virtual environment creation.
*   **Workflow Tools:** Installs common tools for development workflows (Git, Ruff, Pytest, W&B, etc.).
*   **Networking:** Installs tools for secure networking (Cloudflare ZeroTrust, Zerotier-One).

### Requirements

*   **OS:** macOS (tested on macOS 15.0+)
*   **Hardware:** Apple Silicon Mac (optimized for M-series chips, especially with high RAM for large models).
*   **Shell:** ZSH (the script *must* be run with `zsh mlx-startup.sh`).
*   **Homebrew:** Must be pre-installed. The script will update it but not install it from scratch.
*   **Permissions:** Sudo privileges may be needed for some Homebrew operations, and write access to the user's home directory is required.

### Usage

1.  **Ensure Homebrew is installed:** Visit [https://brew.sh/](https://brew.sh/) if needed.
2.  **Clone this repository** or download the `mlx-startup.sh` script.
3.  **Make the script executable:** `chmod +x mlx-startup.sh`
4.  **Run the script using ZSH:** `zsh mlx-startup.sh`
5.  **Follow Post-Installation Steps:** Carefully read and execute the steps printed at the end of the script, especially restarting the terminal.

### Key Features & Structure

1.  **Homebrew Check & Update:** Ensures Brew is present and updated.
2.  **Brew Package Installation:** Installs a comprehensive list of command-line tools, libraries (including build dependencies like `openssl@3`, `readline`, etc.), and applications (`cloudflared`, `zerotier-one`).
3.  **Pyenv Setup:** Installs `pyenv` and configures `~/.zshrc` for managing Python versions. Installs a specific Python version (default: 3.12.3).
4.  **UV Configuration:** Sets up `uv`, the fast package manager/installer.
5.  **Project Directory & Venv:** Creates `~/ml-projects` and a `.venv` within it using `uv`.
6.  **Core ML Installation:** Installs fundamental ML packages (NumPy, SciPy, Pandas, MLX, MLX-LM, Transformers, etc.) into the `.venv`.
7.  **Custom Project Setup:** Clones and installs dependencies for `csm-mlx` and `sesame-csm-ui`.
8.  **Workflow Tools Installation:** Installs linters, formatters, testing tools, etc. into the `.venv`.
9.  **Directory Prep:** Creates a directory for voice samples.
10. **Git Configuration:** Sets up a global `.gitignore`.
11. **Post-Installation Guide:** Provides crucial manual steps required after the script finishes.

### Post-Installation Steps (Summary)

*   **Restart Terminal:** Essential for `pyenv` initialization.
*   **Activate Venv:** `cd ~/ml-projects && source .venv/bin/activate` before running Python projects.
*   **Login to Services:** `gh auth login`, `cloudflared access login`, Zerotier One app login.
*   **Download Models:** Manually download large models like `csm-1b-mlx` if needed.
*   **Test Installations:** Run provided test commands for MLX-LM.
*   **(Optional) Change Global Python:** Use `pyenv global <version>` if needed.

---

## MLX Framework & Ecosystem Insights (Summary from Session)

This section captures key learnings and considerations discussed regarding the use of MLX, particularly on high-spec Apple Silicon hardware.

### 1. Technology Stack Assessment

*   **Hardware:** New Apple Silicon platforms, especially M2/M3 Ultra (with up to 512GB RAM) and M3/M4 Max are highly suitable for ML Tasks due to its massive **Unified Memory**, allowing large models to reside entirely in vRAM accessible by both CPU and GPU cores efficiently.
*   **Operating System:** macOS (e.g., 15.3) provides a stable base. ZSH is often the preferred shell.
*   **MLX vs. PyTorch:** MLX demonstrates significant performance advantages over PyTorch (via MPS backend) on Apple Silicon, especially for inference and fine-tuning tasks that leverage the Unified Memory architecture.
*   **Python Environment:** Robust management is critical.
    *   **Tools:** `pyenv` (version management), `uv` (fast installation/venv), `conda`, `venv` are options. `uv` combined with `pyenv` offers a modern, fast approach.
    *   **Dependency Pinning:** Crucial for reproducibility (using `requirements.txt` or `pyproject.toml` managed by `uv`).
*   **Scripting:** Ensure scripts explicitly use the intended interpreter (e.g., `#!/bin/zsh`) and handle environment sourcing correctly (e.g., using `eval "$(brew --prefix)/bin/brew shellenv"` instead of sourcing entire `.zshrc`).

### 2. Shared Workstation & LLM Host

*   **Suitability:** The high RAM and compute power make the Mac Studio M3 Ultra technically capable of serving as both a shared ML development machine and a host for large models (like Llama 4.0 Maverick).
*   **Challenges:** Primarily organizational and resource management, not raw capability.
    *   **Shared Environment Management:** Lack of established best practices for Macs as shared *nodes*. Requires clear strategies for:
        *   **Access:** SSH, Screen Sharing, VNC? User accounts?
        *   **Environment Isolation:** Single shared venv (managed via `uv sync`), multiple user venvs, or containerization (e.g., OrbStack, Docker Desktop)?
        *   **Resource Allocation:** How to manage concurrent usage (CPU, GPU, RAM)? Queuing systems? Scheduling? Monitoring is key.
    *   **LLM Serving:**
        *   **Tools:** LM Studio, Ollama, MLX-LM server (via FastAPI), Exo. Each has pros and cons regarding ease of use, performance, and configuration.
        *   **Resource Conflicts:** Serving a large LLM consumes significant RAM/compute, potentially conflicting with users running intensive training/fine-tuning jobs. Prioritization or scheduling might be needed.
    *   **Data Management:** Shared directories, permissions, backup strategies are vital.

### 3. Networking and Daily Workflow

*   **Secure Access:** Tools like **ZeroTier** (creates virtual LANs) and **Cloudflare ZeroTrust** (`cloudflared` tunnels) are effective for providing secure remote access to the workstation without exposing it directly to the internet.
*   **Version Control:** **Git** (with **Git LFS** for large files/models) is standard and essential. A global `.gitignore` helps keep repositories clean.
*   **Code Quality & Testing:** Linters (`Ruff`), formatters, and testing frameworks (`pytest`) are crucial for maintaining code quality, especially in shared or complex projects.
*   **Experiment Tracking:** Tools like **WandB** (Weights & Biases) are valuable for logging metrics, parameters, and outputs during ML experiments.

---

This summary reflects the state of discussion and planning as of April 9, 2025. The ML landscape evolves rapidly, so continued evaluation and adaptation are necessary.
