# OpenAI Throttle Plugin for Codex CLI

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

- **OPENAI_TOKEN_LIMIT**: Maximum number of tokens per minute. Overrides the default 30000 tokens/min.
- **OPENAI_DEFAULT_MAX_TOKENS**: Tokens assumed for calls that do not set `max_tokens`. Overrides default of 1024.

## How it works

When you run any Codex CLI command:

1. `cli.js` checks for `openai-throttle.js` in the current working directory.
2. If found, it `require()`s the plugin, which:
   - Wraps the `OpenAI` class from the `openai` module.
   - Replaces the `chat.completions.create` method to use a Bottleneck token bucket.
3. Every call to `create()` consumes `max_tokens` (or default) from the bucket.
4. The bucket refills to `OPENAI_TOKEN_LIMIT` every minute.

Now your Codex CLI sessions will respect your token rate limits automatically.