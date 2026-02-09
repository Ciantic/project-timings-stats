import { parse, stringify } from "devalue";

export const transformer = {
  // deno-lint-ignore no-explicit-any
  deserialize: (o: any) => parse(o),
  serialize: (o: object) => stringify(o),
};
