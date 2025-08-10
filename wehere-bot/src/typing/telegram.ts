import type * as GrammyTypes from "grammy/types";
import { z } from "zod";

export type User = z.infer<typeof User>;
export const User = z.object({
  id: z.number(),
  is_bot: z.boolean(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
  is_premium: z.literal(true).optional(),
  added_to_attachment_menu: z.literal(true).optional(),
});

export type MessageEntity = z.infer<typeof MessageEntity>;
export const MessageEntity = z.custom<GrammyTypes.MessageEntity>((val) =>
  [
    // MessageEntity.CommonMessageEntity
    "mention",
    "hashtag",
    "cashtag",
    "bot_command",
    "url",
    "email",
    "phone_number",
    "bold",
    "italic",
    "underline",
    "strikethrough",
    "spoiler",
    "blockquote",
    "expandable_blockquote",
    "code",
    // MessageEntity.CustomEmojiMessageEntity
    "custom_emoji",
    // MessageEntity.PreMessageEntity
    "pre",
    // MessageEntity.TextLinkMessageEntity
    "text_link",
    // MessageEntity.TextMentionMessageEntity
    "text_mention",
  ].includes(val?.type)
);

export type ReactionType = GrammyTypes.ReactionType;
export const ReactionType = z.custom<ReactionType>((obj) => {
  return ["emoji", "custom_emoji", "paid"].includes(obj?.type);
});
