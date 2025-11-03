import type { CodegenConfig } from "@graphql-codegen/cli";

// AniList GraphQL endpoint requires POST; Codegen supports specifying method
const config: CodegenConfig = {
  schema: [
    {
      "https://graphql.anilist.co": {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    },
  ],
  documents: ["lib/graphql/**/*.graphql"],
  generates: {
    "lib/__generated__/types.generated.ts": {
      plugins: ["typescript", "typescript-operations"],
      config: {
        immutableTypes: true,
        avoidOptionals: true,
        nonOptionalTypename: true,
        preResolveTypes: true,
        scalars: {
          Date: "string",
          DateTime: "string",
          Json: "unknown",
        },
      },
    },
  },
};

export default config;
