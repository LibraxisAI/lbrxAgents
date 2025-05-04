/*
 * openai-throttle.js
 * Plugin to throttle OpenAI token usage via Bottleneck.
 * Safe for global preload: if 'openai' module is absent, script will no-op.
 */
try {
  const Bottleneck = require('bottleneck');
  const openaiMod = require('openai');
  const OriginalOpenAI = openaiMod.OpenAI;

  // Global token limit per minute (default: 30000, override via OPENAI_TOKEN_LIMIT env var)
  const GLOBAL_TOKEN_LIMIT = parseInt(process.env.OPENAI_TOKEN_LIMIT || '30000', 10);
  // Default max_tokens for calls that don't set it explicitly (override via OPENAI_DEFAULT_MAX_TOKENS)
  const GLOBAL_DEFAULT_MAX_TOKENS = parseInt(process.env.OPENAI_DEFAULT_MAX_TOKENS || '1024', 10);

  // Create a global limiter
  const globalLimiter = new Bottleneck({
    reservoir: GLOBAL_TOKEN_LIMIT,
    reservoirRefreshAmount: GLOBAL_TOKEN_LIMIT,
    reservoirRefreshInterval: 60 * 1000
  });

  // Parse model-specific limits from env vars:
  // OPENAI_TOKEN_LIMIT_<MODELKEY> and OPENAI_DEFAULT_MAX_TOKENS_<MODELKEY>
  const modelLimiterMap = {};
  const modelDefaultMaxMap = {};
  const tokenEnvPrefix = 'OPENAI_TOKEN_LIMIT_';
  const maxEnvPrefix = 'OPENAI_DEFAULT_MAX_TOKENS_';
  Object.keys(process.env).forEach(key => {
    if (key.startsWith(tokenEnvPrefix) && key !== 'OPENAI_TOKEN_LIMIT') {
      const modelKey = key.slice(tokenEnvPrefix.length);
      const limit = parseInt(process.env[key], 10);
      if (!isNaN(limit)) {
        modelLimiterMap[modelKey] = new Bottleneck({
          reservoir: limit,
          reservoirRefreshAmount: limit,
          reservoirRefreshInterval: 60 * 1000
        });
      }
    }
    if (key.startsWith(maxEnvPrefix) && key !== 'OPENAI_DEFAULT_MAX_TOKENS') {
      const modelKey = key.slice(maxEnvPrefix.length);
      const maxTok = parseInt(process.env[key], 10);
      if (!isNaN(maxTok)) {
        modelDefaultMaxMap[modelKey] = maxTok;
      }
    }
  });

  class ThrottledOpenAI extends OriginalOpenAI {
    constructor(opts) {
      super(opts);
      const chatApi = this.chat.completions;
      const origCreate = chatApi.create.bind(chatApi);
      chatApi.create = async (params = {}) => {
        // Determine model key: uppercase, non-alphanumeric to '_'
        const modelName = (params.model || '').toString();
        const modelKey = modelName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        // Choose limiter: model-specific or global
        const limiterToUse = modelLimiterMap[modelKey] || globalLimiter;
        // Determine default max_tokens: model-specific or global
        const defaultMax = modelDefaultMaxMap[modelKey] || GLOBAL_DEFAULT_MAX_TOKENS;
        // Weight = explicit max_tokens or default
        const weight = typeof params.max_tokens === 'number'
          ? params.max_tokens
          : defaultMax;
        return limiterToUse.schedule({ weight }, () => origCreate(params));
      };
    }
  }

  // Override the OpenAI class
  openaiMod.OpenAI = ThrottledOpenAI;
} catch (e) {
  // Bottleneck or openai module not found, skip throttle
}