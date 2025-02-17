import type { TranslationContext } from "@moebius/fluent";
import type { RawApi } from "grammy";
import type { BotContext } from "wehere-bot/src/types";

import { collections } from "../bot/operations";
import { getMortalLocale } from "../bot/operations/mortal";
import { getRole } from "../bot/operations/role";
import { Locale } from "../typing/common";

import { nonNullable } from "./assert";
import { html } from "./format";

export function withDefaultErrorHandler(handler: (ctx: BotContext) => void) {
  return async (ctx: BotContext) => {
    try {
      await Promise.resolve(handler(ctx));
    } catch (error) {
      if (error === false) {
        return; // shortcut to gracefully stop
      }
      if (error instanceof Error) {
        const chatId = nonNullable(ctx.chat?.id);
        await ctx.api.sendMessage(
          chatId,
          html.pre(html.literal(error.message)),
          { parse_mode: "HTML" }
        );
      }
      throw error;
    }
  };
}

export type Translate = (path: string, context?: TranslationContext) => string;

export type ReplyHtml = RawApi["sendMessage"] extends (
  arg0: infer T0
) => Promise<infer R>
  ? (
      text: string,
      other?: Omit<T0, "chat_id" | "text" | "parse_mode">
    ) => Promise<R>
  : never;

export type InjectedContext$WithTranslate = {
  t: Translate;
  replyHtml: ReplyHtml;
};

export function withReplyHtml<OtherArgs extends unknown[]>(
  handler: (
    ctx: BotContext & InjectedContext$WithTranslate,
    ...otherArgs: OtherArgs
  ) => void
) {
  return async (ctx: BotContext, ...otherArgs: OtherArgs) => {
    const chat = nonNullable(ctx.chat);
    // TODO: use a middleware to store the cached locale and role
    const role = ctx.from?.id ? await getRole(ctx, ctx.from.id) : "mortal";
    const locale =
      role === "mortal"
        ? await getMortalLocale(ctx, chat.id)
        : await collections.angel_subscription
            .findOne(ctx, { chatId: chat.id })
            .then((angel) => Locale.orDefault(angel?.locale));
    const t = ctx.i18n.withLocale(locale);
    const replyHtml: ReplyHtml = (text, other) =>
      ctx.api.sendMessage(chat.id, text, { parse_mode: "HTML", ...other });
    await Promise.resolve(
      handler(Object.assign(ctx, { t, replyHtml }), ...otherArgs)
    );
  };
}
