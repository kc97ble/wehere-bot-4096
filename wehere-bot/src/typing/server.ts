import { ObjectId } from "mongodb";
import * as Telegram from "wehere-bot/src/typing/telegram";
import { z } from "zod";

import {
  ChatId,
  Emoji,
  Locale,
  MessageDirection,
  MessageId,
  Role,
  TemplateKey,
  ThreadPlatform,
  Timestamp,
  UserId,
} from "./common";

export type PersistentObjectId = z.infer<typeof PersistentObjectId>;
export const PersistentObjectId = z
  .union([z.string(), z.number(), z.instanceof(ObjectId)])
  .transform((input) => {
    switch (typeof input) {
      case "number":
        return ObjectId.createFromTime(input);
      case "string":
        return ObjectId.createFromHexString(input);
      case "object":
        return input;
      default:
        throw new TypeError("invalid object id");
    }
  });

export type PersistentThread = z.infer<typeof PersistentThread>;
export const PersistentThread = z.object({
  _id: PersistentObjectId,
  name: z.string().nullish(), // unique
  emoji: z.string().nullish(),
  createdAt: Timestamp.nullish(),
  platform: ThreadPlatform.nullish(),
  password: z.string().uuid().nullish(),
});

/**
 * A Pusher subscription requires the bot to notify pusher.com
 * when there are new events. One `pusherChannelId` can subscribe
 * to at most `threadId`.
 */
export type PersistentPusherSubscription = z.infer<
  typeof PersistentPusherSubscription
>;
export const PersistentPusherSubscription = z.object({
  _id: PersistentObjectId,
  pusherChannelId: z.string().uuid(), // primary key
  threadId: PersistentObjectId.nullish(),
  createdAt: Timestamp.nullish(),
});

/**
 * A mortal subscription is a subscription from a mortal user to a thread.
 * Technically, it indicates a relationship between a `chatId` and a `threadId`.
 * One `chatId` can connect to at most one `threadId`.
 */
export type PersistentMortalSubscription = z.infer<
  typeof PersistentMortalSubscription
>;
export const PersistentMortalSubscription = z.object({
  _id: PersistentObjectId,
  chatId: ChatId, // primary key
  threadId: z.instanceof(ObjectId).nullish(),
  updatedAt: Timestamp.nullish(),
});

export type PersistentTinyurl = z.infer<typeof PersistentTinyurl>;
export const PersistentTinyurl = z.object({
  _id: PersistentObjectId,
  url: z.string(),
  updatedAt: Timestamp.nullish(),
});

export type PersistentTemplate = z.infer<typeof PersistentTemplate>;
export const PersistentTemplate = z.object({
  _id: PersistentObjectId,
  key: TemplateKey,
  text: z.string().nullish(),
  entities: Telegram.MessageEntity.array().nullish(),
  createdAt: Timestamp.nullish(),
});

export type PersistentDeadMessage = z.infer<typeof PersistentDeadMessage>;
export const PersistentDeadMessage = z.object({
  _id: PersistentObjectId,
  text: z.string().nullish(),
  entities: Telegram.MessageEntity.array().nullish(),
  createdAt: Timestamp.nullish(),
});

export type PersistentAngelSubscription = z.infer<
  typeof PersistentAngelSubscription
>;
export const PersistentAngelSubscription = z.object({
  _id: PersistentObjectId,
  chatId: ChatId, // primary key
  replyingToThreadId: z.instanceof(ObjectId).nullish(),
  updatedAt: Timestamp.nullish(),
});

export type PersistentThreadMessage = z.infer<typeof PersistentThreadMessage>;
export const PersistentThreadMessage = z.object({
  _id: PersistentObjectId,
  threadId: PersistentObjectId,
  direction: MessageDirection,
  originChatId: ChatId.nullish(),
  originMessageId: MessageId.nullish(),
  text: z.string().nullish(),
  entities: Telegram.MessageEntity.array().nullish(),
  angelEmoji: Emoji.nullish(), // emoji from angel (at most one)
  mortalEmoji: Emoji.nullish(), // emoji from mortal (at most one)
  plainText: z.boolean().nullish(),
  createdAt: Timestamp, // unique
});

export type PersistentSentMessage = z.infer<typeof PersistentSentMessage>;
export const PersistentSentMessage = z.object({
  _id: PersistentObjectId,
  chatId: ChatId, // composite primary key
  messageId: MessageId, // composite primary key
  threadMessageId: PersistentObjectId,
});

export type PersistentChat = z.infer<typeof PersistentChat>;
export const PersistentChat = z.object({
  _id: PersistentObjectId,
  chatId: ChatId,
  locale: Locale.nullish(),
  updatedAt: Timestamp.nullish(),
});

export type PersistentRole = z.infer<typeof PersistentRole>;
export const PersistentRole = z.object({
  userId: UserId,
  role: Role.nullish(),
  updatedAt: Timestamp.nullish(),
});

export type PersistentAvailability = z.infer<typeof PersistentAvailability>;
export const PersistentAvailability = z.object({
  _id: PersistentObjectId,
  createdAt: Timestamp, // primary key
  value: z.boolean(),
});
