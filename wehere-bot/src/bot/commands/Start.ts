import { InlineKeyboard } from "grammy";
import { getAngelSubscription } from "wehere-bot/src/bot/operations/angel";
import { getChatLocale } from "wehere-bot/src/bot/operations/chat_";
import { getThread_givenMortalChatId } from "wehere-bot/src/bot/operations/thread_";
import type { Command } from "wehere-bot/src/types";
import type { Role } from "wehere-bot/src/typing/common";
import { PersistentRole, PersistentThread } from "wehere-bot/src/typing/server";
import { parseDocs } from "wehere-bot/src/utils/array";
import { nonNullable } from "wehere-bot/src/utils/assert";
import { withDefaultErrorHandler } from "wehere-bot/src/utils/error";
import { formatThread, html } from "wehere-bot/src/utils/format";
import { getWehereUrl } from "wehere-bot/src/utils/parse";

const handleMessage = withDefaultErrorHandler(async (ctx) => {
  const msg0 = nonNullable(ctx.message);
  const locale = await getChatLocale(ctx, msg0.chat.id);

  const roles = await ctx.db
    .collection("role")
    .find()
    .toArray()
    .then(parseDocs(PersistentRole));

  const greetFirstUser = async () => {
    await ctx.api.sendMessage(
      msg0.chat.id,
      ctx.i18n.withLocale(locale)("html-hello-you-alone", {
        user: html.strong(html.literal(msg0.from.id)),
      }),
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().text(
          ctx.i18n.withLocale(locale)("html-make-me-an-admin"),
          `wehere:/set_role?user=${msg0.from.id}&role=admin`
        ),
      }
    );
  };

  const greetAdmin = async () => {
    await ctx.api.sendMessage(
      msg0.chat.id,
      ctx.i18n.withLocale(locale)(
        "html-hello-admin",
        { user: html.strong(html.literal(msg0.from.id)) } //
      ),
      { parse_mode: "HTML" }
    );
  };

  const greetAngel = async () => {
    const angelSub = await getAngelSubscription(ctx, { chatId: msg0.chat.id });
    if (!angelSub) {
      await ctx.api.sendMessage(
        msg0.chat.id,
        [
          ctx.i18n.withLocale(locale)("html-hello-angel", {
            user: html.strong(html.literal(msg0.from.id)),
          }),
          ctx.i18n.withLocale(locale)("html-you-not-subscribing"),
        ].join("\n\n"),
        {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard().text(
            ctx.i18n.withLocale(locale)("text-subscribe"),
            getWehereUrl(["subscription", "subscribe"])
          ),
        }
      );
    } else if (!angelSub.replyingToThreadId) {
      await ctx.api.sendMessage(
        msg0.chat.id,
        [
          ctx.i18n.withLocale(locale)(
            "html-hello-angel",
            { user: html.strong(html.literal(msg0.from.id)) } //
          ),
          ctx.i18n.withLocale(locale)("html-you-subscribed-but-replying"),
        ].join("\n\n"),
        {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard().text(
            ctx.i18n.withLocale(locale)("text-unsubscribe"),
            getWehereUrl(["subscription", "unsubscribe"])
          ),
        }
      );
    } else {
      const thread = await ctx.db
        .collection("thread")
        .findOne(angelSub.replyingToThreadId)
        .then((doc) => PersistentThread.parse(doc));
      await ctx.api.sendMessage(
        msg0.chat.id,
        [
          ctx.i18n.withLocale(locale)(
            "html-hello-angel",
            { user: html.strong(html.literal(msg0.from.id)) } //
          ),
          ctx.i18n.withLocale(locale)(
            "html-you-subscribed-and-replying-to",
            { thread: html.strong(html.literal(formatThread(thread))) } //
          ),
        ].join("\n\n"),
        {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard().text(
            ctx.i18n.withLocale(locale)(
              "text-stop-replying",
              { thread: formatThread(thread) } //
            ),
            getWehereUrl(["subscription", "unsubscribe"])
          ),
        }
      );
    }
  };

  const greetMortal = async () => {
    const thread = await getThread_givenMortalChatId(ctx, msg0.chat.id);
    await ctx.api.sendMessage(
      msg0.chat.id,
      ctx.i18n.withLocale(locale)(
        "html-hello-mortal",
        { user: html.strong(html.literal(formatThread(thread))) } //
      ),
      { parse_mode: "HTML" }
    );
  };

  const senderRole: Role =
    roles.find((r) => r.userId === msg0.from.id)?.role || "mortal";

  if (!roles.some((r) => r.role === "admin")) {
    await greetFirstUser();
  } else {
    switch (senderRole) {
      case "admin":
        await greetAdmin();
        await greetAngel();
        break;
      case "angel":
        await greetAngel();
        break;
      case "mortal":
        await greetMortal();
        break;
    }
  }
});

const Start: Command = {
  commandName: "start",
  handleMessage,
};

export default Start;
