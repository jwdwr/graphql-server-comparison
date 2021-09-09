import express from "express";
import { graphqlHTTP } from "express-graphql";
import { GraphQLSchema, GraphQLNonNull, GraphQLInt, GraphQLString, GraphQLList, GraphQLObjectType } from "graphql";

import * as fs from "fs";
import * as schemaAstPlugin from "@graphql-codegen/schema-ast";
import * as typescriptPlugin from "@graphql-codegen/typescript";

import { parse, printSchema } from "graphql";

import { Types } from "@graphql-codegen/plugin-helpers";
import { codegen } from "@graphql-codegen/core";
import path from "path";

import { Comment as DbComment, User as DbUser, Post as DbPost, getConnection } from "./typeorm";
import { User, Post, Comment } from "./generated";
import { Connection } from "typeorm";

/* graphql defs */

const UserType: GraphQLObjectType = new GraphQLObjectType({
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
      resolve: (user, _, context: {connection: Connection}) => {
        return context.connection
          .getRepository(DbPost)
          .createQueryBuilder("post")
          .where("post.userId = :userId", {userId: user.userId})
          .getMany();
      }
    },
  }),
});

const PostType: GraphQLObjectType = new GraphQLObjectType({
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
      resolve: (post, _, context: {connection: Connection}): Promise<User | undefined> => {
        return context.connection
          .getRepository(DbUser)
          .createQueryBuilder("user")
          .where("user.userId = :userId", {userId: post.userId})
          .getOne();
      }
    },
    comments: {
      type: new GraphQLList(CommentType),
      resolve: (post, _, context: {connection: Connection}): Promise<Comment[]> => {
        return context.connection
          .getRepository(DbComment)
          .createQueryBuilder("comment")
          .where("comment.postId = :postId", {postId: post.postId})
          .getMany();
      }
    },
  }),
});

const CommentType: GraphQLObjectType = new GraphQLObjectType({
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
      type: new GraphQLNonNull(GraphQLInt),
      description: "ID of post commented on",
    },
    content: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Comment content",
    },
    user: {
      type: UserType,
      resolve: (comment, _, context: {connection: Connection}): Promise<User | undefined> => {
        return context.connection
          .getRepository(DbUser)
          .createQueryBuilder("user")
          .where("user.userId = :userId", {userId: comment.userId})
          .getOne();
      }
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
            async resolve(_, __, context: {connection: Connection}): Promise<User[]> {
              return context.connection
                .getRepository(DbUser)
                .createQueryBuilder("user")
                .getMany();
            },
          },
          user: {
            type: UserType,
            async resolve(_, {userId}, context): Promise<User | undefined> {
              return context.connection
                .getRepository(DbUser)
                .createQueryBuilder("user")
                .where("user.userId = :userId", {userId})
                .getOne();
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
            async resolve(_, __, context: {connection: Connection}): Promise<Post[]> {
              return context.connection
                .getRepository(DbPost)
                .createQueryBuilder("post")
                .getMany();
            },
          },
          post: {
            type: PostType,
            async resolve(_, {postId}, context: {connection: Connection}): Promise<Post | undefined> {
              return context.connection
                .getRepository(DbPost)
                .createQueryBuilder("post")
                .where("post.postId = :postId", {postId})
                .getOne();
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
            async resolve(_, __, context: {connection: Connection}): Promise<Comment[]> {
              return context.connection
                .getRepository(DbComment)
                .createQueryBuilder("comment")
                .getMany();
            },
          },
          comment: {
            type: CommentType,
            async resolve(_source, {commentId}, context: {connection: Connection}): Promise<Comment | undefined> {
              return context.connection
                .getRepository(DbComment)
                .createQueryBuilder("comment")
                .where("comment.commentId = :commentId", {commentId})
                .getOne();
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

/* codegen stuff */

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

/* typeorm entities */

/* start server */

async function serve(): Promise<void> {
  const connection = await getConnection();

  const app = express();
  app.use("/graphql", graphqlHTTP({
    schema: schema,
    graphiql: true,
    context: {connection}
  }));

  app.listen(4000);
  console.log("Running a GraphQL API server at http://localhost:4000/graphql");
}

serve();