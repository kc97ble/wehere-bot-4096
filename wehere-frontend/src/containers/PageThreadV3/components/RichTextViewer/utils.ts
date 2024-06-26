import type { Node } from "prosemirror-model";
import { Schema } from "prosemirror-model";
import type { Step } from "prosemirror-transform";
import { AddMarkStep } from "prosemirror-transform";
import type * as Telegram from "wehere-bot/src/typing/telegram";
import { doesExist } from "wehere-frontend/src/utils/shared";

// https://prosemirror.net/docs/guide/#schema
// https://github.dev/prosemirror/prosemirror-schema-basic
// https://core.telegram.org/bots/api#html-style
// wehere-bot/src/typing/telegram.ts#CommonMessageEntity
export const schema = new Schema({
  nodes: {
    doc: {
      content: "block+",
    },
    message: {
      group: "block",
      content: "inline*",
      parseDOM: [{ tag: "p" }],
      toDOM: () => ["p", 0],
    },
    text: {
      group: "inline",
      inline: true,
    },
  },
  marks: {
    bold: {
      parseDOM: [{ tag: "b" }, { tag: "strong" }],
      toDOM: () => ["b", 0],
    },
    italic: {
      parseDOM: [{ tag: "i" }, { tag: "em" }],
      toDOM: () => ["i", 0],
    },
    underline: {
      parseDOM: [{ tag: "u" }, { tag: "ins" }],
      toDOM: () => ["u", 0],
    },
    url: {
      toDOM: () => ["a", 0],
    },
    text_link: {
      attrs: {
        href: {},
        title: { default: null },
      },
      inclusive: false,
      parseDOM: [
        {
          tag: "a[href]",
          getAttrs(dom: HTMLElement) {
            return {
              href: dom.getAttribute("href"),
              title: dom.getAttribute("title"),
            };
          },
        },
      ],
      toDOM(node) {
        const { href, title } = node.attrs;
        return [
          "a",
          {
            href,
            title,
            rel:
              href.startsWith("/") && !href.startsWith("//")
                ? undefined
                : "noreferrer",
          },
          0,
        ];
      },
    },
  },
});

function toStep(entity: Telegram.MessageEntity): Step | undefined {
  const from = entity.offset;
  const to = entity.offset + entity.length;

  switch (entity.type) {
    case "bold":
      return new AddMarkStep(from, to, schema.mark("bold"));
    case "italic":
      return new AddMarkStep(from, to, schema.mark("italic"));
    case "underline":
      return new AddMarkStep(from, to, schema.mark("underline"));
    case "text_link":
      return new AddMarkStep(
        from,
        to,
        schema.mark("text_link", { href: entity.url })
      );
    case "url":
      return new AddMarkStep(from, to, schema.mark("url"));
  }
}

export function toDoc(text: string, entities: Telegram.MessageEntity[]): Node {
  if (!text) {
    return schema.node("doc", null, schema.node("message", null, []));
  }
  let node = schema.node("message", null, [schema.text(text)]);
  const steps = entities.map(toStep).filter(doesExist);
  for (const step of steps) {
    const result = step.apply(node);
    if (result.failed) {
      throw new Error(result.failed);
    } else if (result.doc) {
      node = result.doc;
    }
  }
  return schema.node("doc", null, [node]);
}
