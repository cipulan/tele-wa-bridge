// telegram-to-wa.js
require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

const {
  TELEGRAM_BOT_TOKEN,
  ALLOWED_CHAT_IDS,
  WA_API_URL,
  WA_API_KEY,
  WA_GROUP_ID
} = process.env;

if (!TELEGRAM_BOT_TOKEN || !WA_API_URL || !WA_API_KEY || !WA_GROUP_ID) {
  console.error('Missing env vars. Required: TELEGRAM_BOT_TOKEN, WA_API_URL, WA_API_KEY, WA_GROUP_ID');
  process.exit(1);
}

const allowed = new Set((ALLOWED_CHAT_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean));

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// Health state for the /health endpoint (Docker HEALTHCHECK / monitoring)
const health = {
  startedAt: new Date().toISOString(),
  lastTelegramUpdate: null,
  lastForwardOk: null,
  lastForwardError: null,
};

function applyEntityFormatting(text, entities) {
  if (!entities || !entities.length) return text;

  const sorted = [...entities].sort((a, b) => b.offset - a.offset);
  let result = text;

  const insert = (str, index, value) => {
    return str.slice(0, index) + value + str.slice(index);
  };

  for (const entity of sorted) {
    const { offset, length, type } = entity;
    const end = offset + length;

    let prefix = '';
    let suffix = '';

    switch (type) {
      case 'bold':
        prefix = '*';
        suffix = '*';
        break;
      case 'italic':
        prefix = '_';
        suffix = '_';
        break;
      case 'strikethrough':
        prefix = '~';
        suffix = '~';
        break;
      case 'code':
        prefix = '```';
        suffix = '```';
        break;
      case 'pre':
        prefix = '```\n';
        suffix = '\n```';
        break;
      case 'text_link':
        suffix = ` (${entity.url})`;
        break;
      default:
        continue;
    }

    result = insert(result, end, suffix);
    result = insert(result, offset, prefix);
  }

  return result;
}

function pickText(u) {
  if (u.message?.text) {
    return applyEntityFormatting(u.message.text, u.message.entities);
  }
  if (u.channel_post?.text) {
    return applyEntityFormatting(u.channel_post.text, u.channel_post.entities);
  }
  if (u.message?.caption) {
    return applyEntityFormatting(u.message.caption, u.message.caption_entities);
  }
  if (u.channel_post?.caption) {
    return applyEntityFormatting(u.channel_post.caption, u.channel_post.caption_entities);
  }
  return null;
}

async function forwardToWA(message, meta = {}) {
  try {
    const { status, data } = await axios.post(
      WA_API_URL,
      {
        chatId: WA_GROUP_ID,
        text: message,
        reply_to: null,
        linkPreview: false,
        linkPreviewHighQuality: false,
        session: 'default'
      },
      {
        headers: {
          'accept': 'application/json',
          'X-Api-Key': WA_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    console.log(new Date().toISOString(), 'WA OK', status, JSON.stringify({ meta, resp: data }));
    health.lastForwardOk = new Date().toISOString();
  } catch (err) {
    console.error(
      new Date().toISOString(),
      'WA ERR',
      err.response?.status || '',
      err.response?.data || err.message
    );
    health.lastForwardError = new Date().toISOString();
  }
}

// Limit to certain chats if ALLOWED_CHAT_IDS provided
bot.use(async (ctx, next) => {
  health.lastTelegramUpdate = new Date().toISOString();
  const chat = ctx.chat || ctx.update?.channel_post?.chat || ctx.update?.message?.chat;
  const chatId = chat?.id?.toString();
  if (allowed.size && chatId && !allowed.has(chatId)) return;
  await next();
});

// Handle channel posts
bot.on('channel_post', async (ctx) => {
  const text = pickText(ctx.update);
  if (!text) return;
  const title = ctx.update.channel_post.chat?.title || 'Channel';
  await forwardToWA(text, { type: 'channel_post', chatId: ctx.update.channel_post.chat?.id });
});

// Handle messages in groups/supergroups
bot.on('message', async (ctx) => {
  const text = pickText(ctx.update);
  if (!text) return;
  const chat = ctx.chat;
  const title =
    chat?.title ||
    [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(' ') ||
    ctx.from?.username ||
    'Chat';
  await forwardToWA(text, { type: 'message', chatId: chat?.id });
});

// Lightweight health endpoint (no extra dependencies).
// Used by the Docker HEALTHCHECK and can be scraped by external monitoring.
const HEALTH_PORT = parseInt(process.env.HEALTH_PORT || '3000', 10);
http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      uptimeSec: Math.floor(process.uptime()),
      ...health,
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(HEALTH_PORT, '127.0.0.1', () => {
  console.log(`Health endpoint listening on 127.0.0.1:${HEALTH_PORT}`);
});

bot.launch()
  .then(() => console.log('Bridge started. Listening for Telegram updates…'))
  .catch((e) => { console.error('Failed to start bot:', e.message); process.exit(1); });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

