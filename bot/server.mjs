import { createServer } from "node:http";

const BOT_TOKEN = process.env.BOT_TOKEN?.trim();
const APP_URL = process.env.APP_URL?.trim().replace(/\/$/, "");
const PORT = Number(process.env.PORT || 3000);
const MINI_APP_SHORT_NAME = process.env.MINI_APP_SHORT_NAME?.trim() || "";

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is required");
}

if (!APP_URL || !APP_URL.startsWith("https://")) {
  throw new Error("APP_URL must be a public HTTPS URL");
}

const telegramApiBaseUrl = process.env.TELEGRAM_API_BASE_URL?.trim().replace(/\/$/, "") || "https://api.telegram.org";
const apiUrl = `${telegramApiBaseUrl}/bot${BOT_TOKEN}`;
const startedAt = new Date().toISOString();
let botReady = false;
let botUsername = "";
let lastUpdateAt = null;
let lastError = null;
let stopping = false;

const roleContent = {
  partner: {
    path: "/partner",
    title: "кабінет партнера",
    greeting: "Вітаємо в кабінеті партнера «Гід туриста»! Тут ви можете керувати закладом, бронюваннями, працівниками та фінансами.",
  },
  ambassador: {
    path: "/ambassador",
    title: "кабінет амбасадора",
    greeting: "Вітаємо в кабінеті амбасадора! Переглядайте реферальне посилання, залучення, статистику та статус винагород.",
  },
  regional: {
    path: "/regional",
    title: "кабінет регіонального менеджера",
    greeting: "Вітаємо в кабінеті регіонального менеджера! Тут доступні партнери, контент і статистика вашого регіону.",
  },
  admin: {
    path: "/admin",
    title: "головну адмінпанель",
    greeting: "Вітаємо в головній адмінпанелі «Гід туриста»! Тут доступні керування платформою, модерація, аналітика та фінансові операції.",
  },
};

const commandAliases = new Map([
  ["start", "start"],
  ["tourist", "start"],
  ["турист", "start"],
  ["partner", "partner"],
  ["партнер", "partner"],
  ["regional", "regional"],
  ["region", "regional"],
  ["регіональний", "regional"],
  ["менеджер", "regional"],
  ["admin", "admin"],
  ["адмін", "admin"],
]);

function appLink(path) {
  return `${APP_URL}${path}`;
}

function startKeyboard(startParam = "") {
  const safeStart = startParam.trim().slice(0, 64);
  const fallbackUrl = new URL(appLink("/tourist/welcome"));
  if (safeStart) fallbackUrl.searchParams.set("startapp", safeStart);

  if (safeStart && botUsername && MINI_APP_SHORT_NAME) {
    return {
      inline_keyboard: [[
        {
          text: "Старт",
          url: `https://t.me/${botUsername}/${MINI_APP_SHORT_NAME}?startapp=${encodeURIComponent(safeStart)}`,
        },
      ]],
    };
  }

  return {
    inline_keyboard: [[
      {
        text: "Старт",
        web_app: { url: fallbackUrl.toString() },
      },
    ]],
  };
}

function roleKeyboard(role, chatType) {
  const url = appLink(roleContent[role].path);

  if (role === "partner") {
    if (chatType === "private") {
      return {
        inline_keyboard: [[
          { text: "Відкрити в Telegram", web_app: { url } },
        ]],
      };
    }

    return {
      inline_keyboard: [[
        { text: "Відкрити чат з ботом", url: `https://t.me/${botUsername}` },
      ]],
    };
  }

  if (role === "admin") {
    return {
      inline_keyboard: [[
        { text: "Відкрити на комп’ютері", url },
      ]],
    };
  }

  const mobileButton = chatType === "private"
    ? { text: "Відкрити в Telegram", web_app: { url } }
    : { text: "Відкрити мобільну версію", url };

  return {
    inline_keyboard: [
      [{ text: "Відкрити на комп’ютері", url }],
      [mobileButton],
    ],
  };
}

async function telegram(method, payload = {}, timeoutMs = 15000) {
  const response = await fetch(`${apiUrl}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.description || `Telegram API error: ${response.status}`);
  }

  return result.result;
}

async function sendMessage(chatId, text, replyMarkup) {
  await telegram("sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: replyMarkup,
    disable_web_page_preview: true,
  });
}

function readStartParam(text) {
  const parts = text.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ").trim().slice(0, 64) : "";
}

function readCommand(text) {
  const firstWord = text.trim().toLowerCase().split(/\s+/)[0] || "";
  const withSlash = firstWord.startsWith("\\") ? `/${firstWord.slice(1)}` : firstWord;
  const command = withSlash.startsWith("/") ? withSlash.slice(1) : withSlash;
  return command.split("@")[0];
}

async function handleMessage(message) {
  const text = message.text;
  if (!text || !message.chat?.id) return;

  const command = commandAliases.get(readCommand(text));

  if (command === "start") {
    await sendMessage(
      message.chat.id,
      "Вітаємо в «Гід туриста»! Знаходьте цікаві місця, заклади, маршрути, бронювання та бонуси в одному застосунку.",
      startKeyboard(readStartParam(text)),
    );
    return;
  }

  if (command && roleContent[command]) {
    const content = roleContent[command];
    await sendMessage(
      message.chat.id,
      content.greeting,
      roleKeyboard(command, message.chat.type),
    );
    return;
  }

  await sendMessage(
    message.chat.id,
    "Оберіть потрібний розділ командою:\n/start — застосунок туриста\n/partner — кабінет партнера\n/regional — регіональний менеджер\n/admin — адміністратор",
  );
}

async function configureBot() {
  const me = await telegram("getMe");
  botUsername = me.username || "";

  await telegram("deleteWebhook", { drop_pending_updates: false });
  await telegram("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "Старт",
      web_app: { url: appLink("/tourist/welcome") },
    },
  });
  await telegram("setMyCommands", {
    commands: [
      { command: "start", description: "Відкрити застосунок туриста" },
      { command: "partner", description: "Кабінет партнера" },
      { command: "regional", description: "Регіональний менеджер" },
      { command: "admin", description: "Головна адмінпанель" },
    ],
  });
  await telegram("setMyDescription", {
    description: "Офіційний бот платформи «Гід туриста»: туристичний застосунок і робочі кабінети.",
  });
  await telegram("setMyShortDescription", {
    short_description: "Туристичний застосунок і робочі кабінети",
  });

  botReady = true;
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function pollUpdates() {
  let offset = 0;

  while (!stopping) {
    try {
      const updates = await telegram("getUpdates", {
        offset,
        timeout: 25,
        allowed_updates: ["message"],
      }, 35000);

      lastError = null;
      for (const update of updates) {
        offset = update.update_id + 1;
        lastUpdateAt = new Date().toISOString();
        if (update.message) {
          await handleMessage(update.message);
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown polling error";
      console.error(`[bot] ${lastError}`);
      await delay(1800);
    }
  }
}

const server = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(botReady ? 200 : 503, { "content-type": "application/json" });
    response.end(JSON.stringify({
      status: botReady ? "ok" : "starting",
      service: "gid-tourist-bot",
      bot: botUsername,
      startedAt,
      lastUpdateAt,
      lastError,
    }));
    return;
  }

  response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  response.end("Гід туриста — Telegram bot");
});

server.listen(PORT, "0.0.0.0", async () => {
  try {
    await configureBot();
    console.log(`[bot] @${botUsername} is ready on port ${PORT}`);
    await pollUpdates();
  } catch (error) {
    console.error("[bot] Failed to start", error instanceof Error ? error.message : error);
    process.exit(1);
  }
});

function shutdown() {
  stopping = true;
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
