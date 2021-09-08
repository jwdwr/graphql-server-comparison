const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const knex = require("knex");

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type User {
    userId: String
    email: String
    name: String
    posts: [Post]
  }

  type Post {
    postId: String
    title: String
    content: String
    user: User
  }

  type Comment {
    commentId: String
    postId: Post
    user: User
    content: String
  }

  type Query {
    posts: [Post]
    users: [User]
  }

  type Mutation {
    addUser(email: String, name: String): Int
    addPost(userId: Int, title: String, content: String): Int
    addComment(userId: Int, postId: Int, content: String): Int
  }
`);

const client = knex({
  client: "mysql",
  connection: {
    host: "localhost",
    user: "graphql",
    password: "graphql",
    database: "blog",
  },
});

// The root provides a resolver function for each API endpoint
const root = {
  post: async ({postId}) => {
    return client("post").select("*").where({postId}).first();
  },
  posts: async () => {
    return client("post").select("*");
  },
  user: async ({userId}) => {
    return client("user").select("*").where({userId}).first();
  },
  users: async () => {
    return client("user").select("*");
  },
  comment: async ({commentId}) => {
    return client("comment").select("*").where({commentId}).first();
  },
  comments: async () => {
    return client("comment").select("*");
  },
  addUser: async ({ email, name }) => {
    const [id] = await client("user").insert({ email, name });
    return id;
  },
  addPost: async ({ userId, title, content }) => {
    const [id] = await client("post").insert({ userId, title, content });
    return id;
  },
  addComment: async ({ userId, postId, content }) => {
    const [id] = await client("comment").insert({ userId, postId, content });
    return id;
  },
};

const app = express();
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
);

app.listen(4000);
console.log("Running a GraphQL API server at http://localhost:4000/graphql");
