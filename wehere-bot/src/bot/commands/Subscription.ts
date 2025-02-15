import { InlineKeyboard } from "grammy";
import { CommandBuilder } from "wehere-bot/src/classes/CommandBuilder";
import type { BotContext } from "wehere-bot/src/types";
import { PersistentThread } from "wehere-bot/src/typing/server";
import { nonNullable } from "wehere-bot/src/utils/assert";
import type { InjectedContext$WithTranslate } from "wehere-bot/src/utils/error";
import { formatThread, html } from "wehere-bot/src/utils/format";
import { getWehereUrlV2 } from "wehere-bot/src/utils/parse";

import { collections } from "../operations";
import { getRole } from "../operations/role";

async function checkAngelRole(ctx: BotContext & InjectedContext$WithTranslate) {
  const from = nonNullable(ctx.from);
  const role = await getRole(ctx, from.id);
  if (role !== "mortal") return;
  ctx.replyHtml(ctx.t("html-you-not-angel", { user: html.literal(from.id) }));
  throw false;
}

const $ = new CommandBuilder("subscription");

$.route("/", async (ctx) => {
  await checkAngelRole(ctx);
  const chat = nonNullable(ctx.chat);
  const angel = await collections.angel_subscription.findOne(ctx, {
    chatId: chat.id,
  });
  if (!angel) {
    await ctx.replyHtml(ctx.t("html-you-not-subscribing"), {
      reply_markup: new InlineKeyboard().text(
        ctx.t("text-subscribe"),
        getWehereUrlV2("subscription", "/subscribe")
      ),
    });
    throw false;
  }

  if (!angel.replyingToThreadId) {
    await ctx.replyHtml(ctx.t("html-you-subscribed-but-replying"), {
      reply_markup: new InlineKeyboard().text(
        ctx.t("text-unsubscribe"),
        getWehereUrlV2("subscription", "/unsubscribe")
      ),
    });
    throw false;
  }

  const thread = await ctx.db
    .collection("thread")
    .findOne(angel.replyingToThreadId)
    .then((doc) => PersistentThread.parse(doc));

  await ctx.replyHtml(
    ctx.t(
      "html-you-subscribed-and-replying-to",
      { thread: html.literal(formatThread(thread)) } //
    ),
    {
      reply_markup: new InlineKeyboard()
        .text(
          ctx.t("text-stop-replying", { thread: formatThread(thread) }),
          getWehereUrlV2("subscription", "/renew")
        )
        .text(
          ctx.t("text-unsubscribe"), //
          getWehereUrlV2("subscription", "/unsubscribe")
        ),
    }
  );
});

$.route("/subscribe", async (ctx) => {
  await checkAngelRole(ctx);
  const chat = nonNullable(ctx.chat);

  await collections.angel_subscription.upsertOne(
    ctx,
    { chatId: chat.id },
    { $set: { replyingToThreadId: null } }
  );

  await ctx.replyHtml(ctx.t("html-alright-you-subscribing"), {
    reply_markup: new InlineKeyboard().text(
      ctx.t("text-unsubscribe"),
      getWehereUrlV2("subscription", "/unsubscribe")
    ),
  });
});

$.route("/unsubscribe", async (ctx) => {
  await checkAngelRole(ctx);
  const chat = nonNullable(ctx.chat);
  await collections.angel_subscription.deleteOne(ctx, { chatId: chat.id });

  await ctx.replyHtml(ctx.t("html-done-you-unsubscribed"), {
    reply_markup: new InlineKeyboard().text(
      ctx.t("text-subscribe"),
      getWehereUrlV2("subscription", "/subscribe")
    ),
  });
});

$.route("/renew", async (ctx) => {
  await checkAngelRole(ctx);
  const chat = nonNullable(ctx.chat);
  await collections.angel_subscription.upsertOne(
    ctx,
    { chatId: chat.id },
    { replyingToThreadId: null }
  );
  await ctx.replyHtml(ctx.t("html-alright-you-stopped-replying"), {
    reply_markup: new InlineKeyboard().text(
      ctx.t("text-unsubscribe"),
      getWehereUrlV2("subscription", "/unsubscribe")
    ),
  });
});

const Subscription = $.build();
export default Subscription;
