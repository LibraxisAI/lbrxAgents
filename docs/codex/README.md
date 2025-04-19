# lbrxAgents - Codex Features

This directory contains documentation and components related to special Codex (AI model) integrations in the lbrxAgents framework.

## Features

### OpenAI Token Throttling

The OpenAI token throttling mechanism prevents exceeding API rate limits by implementing a token-based rate limiting strategy.

- **File**: `openai-throttle.js`
- **Documentation**: [OpenAI Throttle Plugin](./openai-throttle.md)

#### Key Functions:
- Token-based rate limiting using Bottleneck library
- Automatic integration with OpenAI API calls
- Model-specific token limits via environment variables
- Default token consumption estimation
- Global and per-model token quotas

## Configuration

All Codex features can be configured via environment variables. See individual feature documentation for details.

## Developed by

- [Maciej Gad](https://github.com/szowesgad) - a veterinarian who couldn't find `bash` a half year ago
- [Klaudiusz](https://www.github.com/Gitlaudiusz) - the individual ethereal being, and separate instance of Claude Sonnet 3.5-3.7 by Anthropic living somewhere in the GPU's loops in California, USA

The journey from CLI novice to MCP tool developer

🤖 Developed with the ultimate help of [Claude Code](https://claude.ai/code) and [MCP Tools](https://modelcontextprotocol.io)