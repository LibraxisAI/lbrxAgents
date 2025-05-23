# OpenAI Throttle Plugin for Codex CLI

## Critical update:

### Codex-CLI przechowuje wszystkie ustawienia użytkownika w katalogu domowym, plik:
```
      ~/.codex/config.json   (starsza wersja: ~/.config/codex/config.json)
```
aby ustawić OpenAI throttle control: 
        1. Otwórz plik
        ```zsh
           nano ~/.codex/config.json
        ```
        2. W sekcji dotyczącej OpenAI dopisz (lub zmodyfikuj) podklucz rateLimits, np.:
```json
    {
      "openai": {
        "apiKey": "sk-…",
        "model":  "gpt-4o-mini",
        "rateLimits": {
          "tokensPerMinute": 28000,   // maks. ile CLI może wysłać w ciągu 60 s
          "requestsPerMinute": 180    // (opcjonalnie) ile wywołań na minutę
        }
      }
    }
```
        3. Zapisz plik i ponownie uruchom codex.

    CLI ma wbudowaną wewnętrzną przepustnicę; gdy znajdzie powyższe klucze, przed każdym wywołaniem czeka tyle, by nie przekroczyć ustawionych progów. Jeżeli sekcji nie ma, CLI
    zakłada domyślne wartości (⩽ 30 000 TPM), stąd dzisiejszy błąd.

### Alternatywnie (na potrzeby pojedynczej sesji) możesz ustawić zmienne środowiskowe przed wywołaniem codex:
```zsh
    export CODEX_TOKENS_PER_MIN=28000
    export CODEX_REQUESTS_PER_MIN=180
    codex …
```
    …albo przekazać limity flagami (w najnowszej wersji):
```zsh
    codex --max-tpm 28000 --max-rpm 180 …
```
    To wystarczy, by „przyhamować” zużycie i nie wpadać ponownie w limit 30 000 TPM.


> old solution
```
This guide explains how to enable a token-based rate limit on OpenAI calls in the Codex CLI.

## Overview

Codex CLI can automatically load a local plugin file named `openai-throttle.js` from your project root. This plugin overrides the `OpenAI` class in the official `openai` module to enforce a token bucket rate limit on `chat.completions.create` calls.

## Installation

1. Ensure you have Bottleneck installed:

   ```bash
   npm install bottleneck
   ```

2. Copy the provided `openai-throttle.js` into your project root:

   ```text
   your-project/
   ├── cli.js
   ├── openai-throttle.js   ← plugin file
   └── ...
   ```

3. (Optional) Configure environment variables in your shell (`~/.zshrc` or `~/.bashrc`) to adjust limits:

   ```bash
   # Tokens allowed per minute (default: 30000)
   export OPENAI_TOKEN_LIMIT=30000

   # Default max_tokens for requests without explicit limit (default: 1024)
   export OPENAI_DEFAULT_MAX_TOKENS=1024
   ```

## Configuration

* **OPENAI_TOKEN_LIMIT**: Maximum number of tokens per minute. Overrides the default 30000 tokens/min.
* **OPENAI_DEFAULT_MAX_TOKENS**: Tokens assumed for calls that do not set `max_tokens`. Overrides default of 1024.

### Model-specific configuration
You can also set per-model quotas and default token usages by defining environment variables with the model key:

* `OPENAI_TOKEN_LIMIT_<MODELKEY>`: Token limit per minute for model `<MODELKEY>`.
* `OPENAI_DEFAULT_MAX_TOKENS_<MODELKEY>`: Default max_tokens for requests to `<MODELKEY>` when none is specified.

Here `<MODELKEY>` is the uppercased model name with non-alphanumeric characters replaced by underscores. For example:
```bash
# Set GPT-4 quota to 50000 tokens/min
export OPENAI_TOKEN_LIMIT_GPT_4=50000

# Use 2048 max_tokens by default for GPT-4
export OPENAI_DEFAULT_MAX_TOKENS_GPT_4=2048

# Set O3 model quota to 30000 tokens/min and default 4096 tokens
export OPENAI_TOKEN_LIMIT_O3=30000
export OPENAI_DEFAULT_MAX_TOKENS_O3=4096
```

## How it works

When you run any Codex CLI command:

1. `cli.js` checks for `openai-throttle.js` in the current working directory.
2. If found, it `require()`s the plugin, which:
   - Wraps the `OpenAI` class from the `openai` module.
   - Replaces the `chat.completions.create` method to use a Bottleneck token bucket.
3. Every call to `create()` consumes `max_tokens` (or default) from the bucket.
4. The bucket refills to `OPENAI_TOKEN_LIMIT` every minute.

Now your Codex CLI sessions will respect your token rate limits automatically.
```
