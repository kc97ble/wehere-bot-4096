import fs from "fs";

import { config } from "dotenv";

import { createBot, createDb, createI18n, createPusher } from "./bot";
import { Env, Ftl } from "./typing/common";
import { percentDecode } from "./utils/parse";

config();

export const ENV = Env.parse({
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  MONGODB_URI: percentDecode(process.env.MONGODB_URI),
  MONGODB_DBNAME: percentDecode(process.env.MONGODB_DBNAME),
  PUSHER_URI: percentDecode(process.env.PUSHER_URI),
});

export const FTL = Ftl.parse({
  en: fs.readFileSync("src/resources/locales/en.ftl", "utf-8"),
  vi: fs.readFileSync("src/resources/locales/vi.ftl", "utf-8"),
});

async function main() {
  const [db] = await createDb(ENV);
  const i18n = await createI18n(FTL);
  const pusher = await createPusher(ENV);
  const bot = await createBot(ENV.TELEGRAM_BOT_TOKEN, { db, i18n, pusher });
  await bot.start({
    allowed_updates: ["message", "callback_query", "message_reaction"],
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
