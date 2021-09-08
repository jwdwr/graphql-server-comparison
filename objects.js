const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { GraphQLSchema, GraphQLObjectType, GraphQLNonNull, GraphQLInt, GraphQLString, GraphQLList } = require("graphql");
const knex = require("knex");

const UserType = new GraphQLObjectType({
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
      resolve: (user) => client("post").select("*").where({userId: user.userId})
    },
  }),
});

const PostType = new GraphQLObjectType({
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

const CommentType = new GraphQLObjectType({
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


const client = knex({
  client: "mysql",
  connection: {
    host     : "localhost",
    user     : "graphql",
    password : "graphql",
    database : "blog"
  }
});

const app = express();
app.use("/graphql", graphqlHTTP({
  schema: schema,
  graphiql: true,
}));

app.listen(4000);
console.log("Running a GraphQL API server at http://localhost:4000/graphql");
