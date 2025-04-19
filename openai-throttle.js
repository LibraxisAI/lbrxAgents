/*
 * openai-throttle.js
 * Plugin to throttle OpenAI token usage via Bottleneck.
 * Safe for global preload: if 'openai' module is absent, script will no-op.
 */
try {
  const Bottleneck = require('bottleneck');
  const openaiMod = require('openai');
  const OriginalOpenAI = openaiMod.OpenAI;

  // Token limit per minute (default: 30000, override via OPENAI_TOKEN_LIMIT env var)
  const TOKEN_LIMIT = parseInt(process.env.OPENAI_TOKEN_LIMIT || '30000', 10);
  // Default max_tokens for calls that don't set it explicitly
  const DEFAULT_MAX_TOKENS = parseInt(process.env.OPENAI_DEFAULT_MAX_TOKENS || '1024', 10);

  const limiter = new Bottleneck({
    reservoir: TOKEN_LIMIT,
    reservoirRefreshAmount: TOKEN_LIMIT,
    reservoirRefreshInterval: 60 * 1000 // refresh every minute
  });

  class ThrottledOpenAI extends OriginalOpenAI {
    constructor(opts) {
      super(opts);
      const chatApi = this.chat.completions;
      const origCreate = chatApi.create.bind(chatApi);
      chatApi.create = async (params = {}) => {
        const weight = typeof params.max_tokens === 'number'
          ? params.max_tokens
          : DEFAULT_MAX_TOKENS;
        return limiter.schedule({ weight }, () => origCreate(params));
      };
    }
  }

  // Override the OpenAI class
  openaiMod.OpenAI = ThrottledOpenAI;
} catch (e) {
  // Bottleneck or openai module not found, skip throttle
}