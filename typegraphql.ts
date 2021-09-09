import "reflect-metadata";

import express from "express";
import { graphqlHTTP } from "express-graphql";
import { Arg, Args, ArgsType, buildSchema, Field, ID, Mutation, ObjectType, Query, Resolver, Root } from "type-graphql";

import { PrismaClient, post, user, comment } from '@prisma/client'
const prisma = new PrismaClient()

@ObjectType()
class User {
  constructor(dbUser: user) {
    this.userId = dbUser.userId;
    this.email = dbUser.email;
    this.name = dbUser.name;
  }
  @Field(type => Number, {description: "User ID"})
  userId: number;

  @Field({description: "User email address"})
  email: string;

  @Field({description: "User name"})
  name: string;

  @Field(type => [Post], {description: "Posts by user"})
  async posts(@Root() user: User): Promise<Post[]> {
    const dbPosts = await prisma.post.findMany({where: {userId: user.userId}});
    return dbPosts.map((dbPost) => new Post(dbPost))
  }
}

@ObjectType()
class Post {
  constructor(dbPost: post) {
    this.postId = dbPost.postId;
    this.userId = dbPost.userId;
    this.title = dbPost.title;
    this.content = dbPost.content;
  }

  @Field(type => Number, {description: "Post ID"})
  postId: number;

  @Field(type => Number, {description: "ID of user who posted"})
  userId: number;

  @Field({description: "Post title"})
  title: string;

  @Field({description: "Post content"})
  content: string;

  @Field(type => User, {description: "User who posted"})
  async user(@Root() post: Post): Promise<User | undefined> {
    const dbUser = await prisma.user.findFirst({where: {userId: post.userId}});
    if (dbUser) return new User(dbUser);
  }

  @Field(type => [Post], {description: "Comments on post"})
  async comments(@Root() post: Post): Promise<Comment[]> {
    const dbComments = await prisma.comment.findMany({where: {postId: post.postId}});
    return dbComments.map((dbComment) => new Comment(dbComment))
  }
}

@ObjectType()
class Comment {
  constructor(dbComment: comment) {
    this.commentId = dbComment.commentId;
    this.userId = dbComment.userId;
    this.postId = dbComment.postId;
    this.content = dbComment.content;
  }

  @Field(type => Number, {description: "Comment ID"})
  commentId: number;

  @Field(type => Number, {description: "ID of user who commented"})
  userId: number;

  @Field(type => User, {description: "User who commented"})
  async user(@Root() comment: Comment): Promise<User | undefined> {
    const dbUser = await prisma.user.findFirst({where: {userId: comment.userId}});
    if (dbUser) return new User(dbUser);
  }

  @Field(type => Number, {description: "ID of post that was commented on"})
  postId: number;

  @Field(type => Post, {description: "Post that was commented on"})
  async post(@Root() comment: Comment): Promise<post | undefined> {
    const dbPost = await prisma.post.findFirst({where: {postId: comment.postId}});
    if (dbPost) return new Post(dbPost);
  }

  @Field({description: "Comment content"})
  content: string;

  async findFirst(where: Partial<comment>): Promise<Comment | undefined> {
    const dbComment = await prisma.comment.findFirst({where});
    if (dbComment) return new Comment(dbComment);
  }
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
  async user(
    @Arg("userId", {description: "User ID"}) userId: number
  ): Promise<User | undefined> {
    const dbUser = await prisma.user.findFirst({where: {userId}});
    if (dbUser) return new User(dbUser);
  }

  @Query(() => [User])
  async users(): Promise<User[]> {
    const dbUsers = await prisma.user.findMany();
    return dbUsers.map((dbUser) => new User(dbUser));
  }

  @Query(() => Post)
  async post(
    @Arg("postId", {description: "Post ID"}) postId: number
  ): Promise<Post | undefined> {
    const dbPost = await prisma.post.findFirst({where: {postId}});
    if (dbPost) return new Post(dbPost);
  }

  @Query(() => [Post])
  async posts(): Promise<Post[]> {
    const dbPosts = await prisma.post.findMany();
    return dbPosts.map((dbPost) => new Post(dbPost));
  }

  @Mutation(() => User)
  async addUser(
    @Arg("email") email: string,
    @Arg("name") name: string
  ): Promise<User> {
    return new User(await prisma.user.create({data: {email, name}}));
  }

  @Mutation(() => Post)
  async addPost(@Args() {userId, title, content}: PostArgs): Promise<Post> {
    return new Post(await prisma.post.create({data: {userId, title, content}}));
  }

  @Mutation(() => Comment)
  async addComment(
    @Arg("userId") userId: number,
    @Arg("postId") postId: number,
    @Arg("content") content: string
  ): Promise<Comment> {
    return new Comment(await prisma.comment.create({data: {userId, postId, content}}));
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
