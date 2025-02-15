import type { Db } from "mongodb";
import { Locale, type ChatId } from "wehere-bot/src/typing/common";
import { PersistentAngelSubscription } from "wehere-bot/src/typing/server";

export async function readAngelLocale(
  ctx: { db: Db },
  chatId: ChatId
): Promise<Locale | undefined> {
  const angel = await ctx.db
    .collection("angel_subscription")
    .findOne({ chatId })
    .then((doc) => PersistentAngelSubscription.parse(doc))
    .catch(() => undefined);
  return angel?.locale || undefined;
}

export async function getAngelLocale(
  ctx: { db: Db },
  chatId: ChatId
): Promise<Locale> {
  const locale = await readAngelLocale(ctx, chatId);
  return Locale.orDefault(locale);
}
