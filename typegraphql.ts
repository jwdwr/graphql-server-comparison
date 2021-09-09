import "reflect-metadata";

import express from "express";
import { graphqlHTTP } from "express-graphql";
import { Arg, Args, ArgsType, buildSchema, Field, ID, Mutation, ObjectType, Query, Resolver, Root } from "type-graphql";

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

@ObjectType()
class User {
  @Field(type => Number, {description: "User ID"})
  userId!: number;

  @Field({description: "User email address"})
  email!: string;

  @Field({description: "User name"})
  name!: string;

  @Field(type => [Post], {description: "Posts by user"})
  posts(@Root() user: User): Post[] {
    return client("post").select("*").where({userId: user.userId});
  }
}

@ObjectType()
class Post {
  @Field(type => Number, {description: "Post ID"})
  postId!: number;

  @Field(type => Number, {description: "ID of user who posted"})
  userId!: number;

  @Field(type => User, {description: "User who posted"})
  user(@Root() post: Post): User {
    return client("user").select("*").where({userId: post.userId}).first()
  }

  @Field({description: "Post title"})
  title!: string;

  @Field({description: "Post content"})
  content!: string;

  @Field(type => [Post], {description: "Comments on post"})
  comments(@Root() post: Post): Comment[] {
    return client("comment").select("*").where({postId: post.postId});
  }
}

@ObjectType()
class Comment {
  @Field(type => Number, {description: "Comment ID"})
  commentId!: number;

  @Field(type => Number, {description: "ID of user who commented"})
  userId!: number;

  @Field(type => User, {description: "User who commented"})
  user(@Root() comment: Comment): User {
    return client("user").select("*").where({userId: comment.userId}).first()
  }

  @Field({description: "Comment email address"})
  title!: string;

  @Field({description: "Comment name"})
  content!: string;
}

@ArgsType()
class PostArgs {
  @Field(type => Number, {description: "ID of user creating this post"})
  userId!: number;
  @Field(type => String, {description: "Title of the post"})
  title!: string;
  @Field(type => String, {description: "Content of the post"})
  content!: string;
}

@Resolver()
export class RootResolver {
  @Query(() => User)
  user(
    @Arg("userId", {description: "User ID"}) userId: number
  ): User {
    return client('user').select("*").where({userId}).first();
  }

  @Query(() => [User])
  users(): User[] {
    return client('user').select("*");
  }

  @Query(() => Post)
  post(
    @Arg("postId", {description: "Post ID"}) postId: number
  ): Post {
    return client('post').select("*").where({postId}).first();
  }

  @Query(() => [Post])
  posts(): Post[] {
    return client('post').select("*");
  }

  @Mutation(returns => Number)
  async addUser(
    @Arg("email") email: string,
    @Arg("name") name: string
  ) {
    const [id] = await client("user").insert({ email, name });
    return id;
  }

  @Mutation(returns => Number)
  async addPost(@Args() {userId, title, content}: PostArgs) {
    const [id] = await client("post").insert({ userId, title, content });
    return id;
  }

  @Mutation(returns => Number)
  async addComment(
    @Arg("userId") userId: number,
    @Arg("postId") postId: number,
    @Arg("content") content: string
  ) {
    const [id] = await client("comment").insert({ userId, postId, content });
    return id;
  }
}

async function serve(): Promise<void> {
  const schema = await buildSchema({
    resolvers: [RootResolver],
  });

  const app = express();
  app.use("/graphql", graphqlHTTP({
    schema: schema,
    graphiql: true,
  }));

  app.listen(4000);
  console.log("Running a GraphQL API server at http://localhost:4000/graphql");
}

serve();
