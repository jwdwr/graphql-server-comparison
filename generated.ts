export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

/** The root query */
export type Query = {
  __typename?: 'Query';
  users?: Maybe<Array<Maybe<User>>>;
  user?: Maybe<User>;
  posts?: Maybe<Array<Maybe<Post>>>;
  post?: Maybe<Post>;
  comments?: Maybe<Array<Maybe<Comment>>>;
  comment?: Maybe<Comment>;
};


/** The root query */
export type QueryUserArgs = {
  userId: Scalars['Int'];
};


/** The root query */
export type QueryPostArgs = {
  postId: Scalars['Int'];
};


/** The root query */
export type QueryCommentArgs = {
  commentId: Scalars['Int'];
};

/** Blog user */
export type User = {
  __typename?: 'User';
  /** User ID */
  userId: Scalars['Int'];
  /** User email address */
  email: Scalars['String'];
  /** User name */
  name: Scalars['String'];
  posts?: Maybe<Array<Maybe<Post>>>;
};

/** Blog post */
export type Post = {
  __typename?: 'Post';
  /** Post ID */
  postId: Scalars['Int'];
  /** ID of user who posted the blog */
  userId: Scalars['Int'];
  /** Post title */
  title: Scalars['String'];
  /** Post content */
  content: Scalars['String'];
  user?: Maybe<User>;
  comments?: Maybe<Array<Maybe<Comment>>>;
};

/** Blog comment */
export type Comment = {
  __typename?: 'comment';
  /** Comment ID */
  commentId: Scalars['Int'];
  /** ID of user who posted the comment */
  userId: Scalars['Int'];
  /** ID of post commented on */
  postId: Scalars['Int'];
  /** Comment content */
  content: Scalars['String'];
  user?: Maybe<User>;
};
