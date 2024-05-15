import { Fluent } from "@moebius/fluent";
import type { WithoutId } from "mongodb";
import { MongoClient, ObjectId } from "mongodb";
import { ENV, FTL } from "wehere-backend/src/env";
import { Api } from "wehere-bot";
import { getThread_givenThreadId } from "wehere-bot/src/bot/operations/Thread";
import {
  createMessage,
  notifyNewMessage,
} from "wehere-bot/src/bot/operations/ThreadMessage";
import type { PersistentThreadMessage } from "wehere-bot/src/typing/server";
import * as Telegram from "wehere-bot/src/typing/telegram";
import { formatErrorAsObject } from "wehere-bot/src/utils/format";
import { z } from "zod";

export async function POST(request: Request): Promise<Response> {
  // TODO: db and api should be provided by wehere-bot
  // Let's create class WeHereBot
  const client = await MongoClient.connect(ENV.MONGODB_URI);
  const db = client.db(ENV.MONGODB_DBNAME);
  const api = new Api(ENV.TELEGRAM_BOT_TOKEN);

  const fluent = new Fluent();
  await fluent.addTranslation({ locales: "en", source: FTL.en });
  await fluent.addTranslation({ locales: "vi", source: FTL.vi });

  try {
    if (request.headers.get("Content-Type") !== "application/json") {
      return new Response(
        JSON.stringify({ message: "invalid Content-Type" }, null, 2),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await request.json();
    const params = z
      .object({
        threadId: z.string(),
        threadPassword: z.string().nullish(),
        text: z.string(),
        entities: Telegram.MessageEntity.array().nullish(),
      })
      .parse(data);

    const thread = await getThread_givenThreadId(
      { db },
      ObjectId.createFromHexString(params.threadId)
    );

    if (!thread) {
      return new Response(
        JSON.stringify({ message: "thread not found" }), //
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (thread.password && !params.threadPassword) {
      return new Response(
        JSON.stringify({ message: "password required" }), //
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (thread.password && thread.password !== params.threadPassword) {
      return new Response(
        JSON.stringify({ message: "forbidden" }), //
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const message: WithoutId<PersistentThreadMessage> = {
      threadId: ObjectId.createFromHexString(params.threadId),
      direction: "from_mortal",
      originChatId: undefined,
      originMessageId: undefined,
      text: params.text,
      entities: params.entities,
      plainText: true,
      createdAt: Date.now(),
    };

    const threadMessage = await createMessage({ db }, { message });
    await notifyNewMessage(
      { db, api, withLocale: fluent.withLocale.bind(fluent) },
      { message }
    );

    return new Response(
      JSON.stringify({ threadMessage }, null, 2), //
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify(formatErrorAsObject(error)), //
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await client.close();
  }
}