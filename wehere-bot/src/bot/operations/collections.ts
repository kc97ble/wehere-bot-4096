import type {
  Db,
  DeleteResult,
  Document,
  Filter,
  UpdateFilter,
  UpdateResult,
} from "mongodb";
import { PersistentAngelSubscription } from "wehere-bot/src/typing/server";
import { parseDocs } from "wehere-bot/src/utils/array";
import type { ZodType, ZodTypeDef } from "zod";

function makeCollection<T extends Document>(
  name: string,
  schema: ZodType<T, ZodTypeDef, unknown>
) {
  return {
    findMany: async function (ctx: { db: Db }): Promise<T[]> {
      return await ctx.db
        .collection<T>(name)
        .find()
        .toArray()
        .then((docs) => parseDocs(schema)(docs));
    },

    findOne: async function (
      ctx: { db: Db },
      filter: Filter<T>
    ): Promise<T | undefined> {
      return await ctx.db
        .collection<T>(name)
        .findOne(filter)
        .then((doc) => schema.parse(doc))
        .catch(() => undefined);
    },

    deleteOne: async function (
      ctx: { db: Db },
      filter: Filter<T>
    ): Promise<DeleteResult> {
      return await ctx.db //
        .collection<T>(name)
        .deleteOne(filter);
    },

    upsertOne: async function (
      ctx: { db: Db },
      filter: Filter<T>,
      update: UpdateFilter<T>
    ): Promise<UpdateResult<T>> {
      return await ctx.db //
        .collection<T>(name)
        .updateOne(filter, update, { upsert: true });
    },
  };
}

export const angel_subscription = makeCollection(
  "angel_subscription",
  PersistentAngelSubscription
);
