import express from "express";
import { graphqlHTTP } from "express-graphql";
import { GraphQLSchema, GraphQLObjectType, GraphQLNonNull, GraphQLInt, GraphQLString, GraphQLList, GraphQLInterfaceType } from "graphql";

import * as fs from "fs";
import * as schemaAstPlugin from "@graphql-codegen/schema-ast";
import * as typescriptPlugin from "@graphql-codegen/typescript";

import { parse, printSchema } from "graphql";

import { Types } from "@graphql-codegen/plugin-helpers";
import { codegen } from "@graphql-codegen/core";
import path from "path";

const knex = require("knex");
const client = knex({
  client: "mysql",
  connection: {
    host     : "localhost",
    user     : "graphql",
    password : "graphql",
    database : "blog"
  }
});

const UserType: GraphQLInterfaceType = new GraphQLInterfaceType({
  name: "User",
  description: "Blog user",
  fields: () => ({
    userId: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "User ID",
    },
    email: {
      type: new GraphQLNonNull(GraphQLString),
      description: "User email address",
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      description: "User name",
    },
    posts: {
      type: new GraphQLList(PostType),
      resolve: (user: any) => client("post").select("*").where({userId: user.userId})
    },
  }),
});

const PostType: GraphQLInterfaceType = new GraphQLInterfaceType({
  name: "Post",
  description: "Blog post",
  fields: () => ({
    postId: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "Post ID",
    },
    userId: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "ID of user who posted the blog",
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Post title",
    },
    content: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Post content",
    },
    user: {
      type: UserType,
      resolve: (post) => client("user").select("*").where({userId: post.userId}).first()
    },
    comments: {
      type: new GraphQLList(CommentType),
      resolve: (post) => client("comment").select("*").where({postId: post.postId})
    },
  }),
});

const CommentType: GraphQLInterfaceType = new GraphQLInterfaceType({
  name: "comment",
  description: "Blog comment",
  fields: () => ({
    commentId: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "Comment ID",
    },
    userId: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "ID of user who posted the comment",
    },
    postId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of post commented on",
    },
    content: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Comment content",
    },
    user: {
      type: UserType,
      resolve: (comment) => client("user").select("*").where({userId: comment.userId}).first()
    }
  }),
});

// Construct a schema, using GraphQL schema language
const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: "Query",
        description: "The root query",
        fields: {
          users: {
            type: new GraphQLList(UserType),
            async resolve(_source) {
              return client('user').select("*");
            },
          },
          user: {
            type: UserType,
            async resolve(_source, {userId}) {
              return client('user').select("*").where({userId}).first();
            },
            args: {
              userId: {
                description: "User ID",
                type: new GraphQLNonNull(GraphQLInt),
              },
            },
          },
          posts: {
            type: new GraphQLList(PostType),
            async resolve(_source) {
              return client('post').select("*");
            },
          },
          post: {
            type: PostType,
            async resolve(_source, {postId}) {
              return client('post').select("*").where({postId}).first();
            },
            args: {
              postId: {
                description: "Post ID",
                type: new GraphQLNonNull(GraphQLInt),
              },
            },
          },
          comments: {
            type: new GraphQLList(CommentType),
            async resolve(_source) {
              return client('comment').select("*");
            },
          },
          comment: {
            type: CommentType,
            async resolve(_source, {commentId}) {
              return client('comment').select("*").where({commentId}).first();
            },
            args: {
              commentId: {
                description: "Comment ID",
                type: new GraphQLNonNull(GraphQLInt),
              },
            },
          },
        },
    })
});


async function performCodegen(options: Types.GenerateOptions): Promise<void> {
  const output = await codegen(options);
  fs.writeFile(path.join(__dirname, options.filename), output, () => {
    console.log("Outputs generated!");
  });
}

export async function performAstCodegen(): Promise<void> {
  const options: Types.GenerateOptions = {
    config: { numericEnums: true },
    documents: [],
    filename: "generated.graphql",
    schema: parse(printSchema(schema)),
    plugins: [{ "schema-ast": {} }],
    pluginMap: {
      "schema-ast": schemaAstPlugin,
    },
  };
  performCodegen(options);
}

export async function performTypeScriptCodegen(): Promise<void> {
  const options: Types.GenerateOptions = {
    config: { numericEnums: true },
    documents: [],
    filename: "generated.ts",
    schema: parse(printSchema(schema)),
    plugins: [{ typescript: {} }],
    pluginMap: {
      typescript: typescriptPlugin,
    },
  };
  performCodegen(options);
}

performAstCodegen();
performTypeScriptCodegen();

const app = express();
app.use("/graphql", graphqlHTTP({
  schema: schema,
  graphiql: true,
}));

app.listen(4000);
console.log("Running a GraphQL API server at http://localhost:4000/graphql");
