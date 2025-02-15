import { Env, Ftl } from "wehere-bot";
import en from "wehere-bot/dist/resources/locales/en.json";
import vi from "wehere-bot/dist/resources/locales/vi.json";
import { percentDecode } from "wehere-bot/src/utils/parse";

export const ENV = Env.parse({
  TELEGRAM_BOT_TOKEN: percentDecode(process.env.TELEGRAM_BOT_TOKEN),
  TELEGRAM_BOT_API_SECRET_TOKEN: percentDecode(
    process.env.TELEGRAM_BOT_API_SECRET_TOKEN
  ),
  MONGODB_URI: percentDecode(process.env.MONGODB_URI),
  MONGODB_DBNAME: percentDecode(process.env.MONGODB_DBNAME),
  PORT: percentDecode(process.env.PORT),
  HOST: percentDecode(process.env.HOST),
  PUSHER_URI: percentDecode(process.env.PUSHER_URI),
});

export const FTL = Ftl.parse({ en, vi });
