import { Column, createConnection, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  userId!: number;

  @Column()
  email!: string;

  @Column()
  name!: string;
}

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  postId!: number;

  @Column()
  userId!: number;

  @Column()
  title!: string;

  @Column()
  content!: string;
}

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  commentId!: number;

  @Column()
  userId!: number;

  @Column()
  postId!: number;

  @Column()
  content!: string;
}

export async function getConnection() {
  return createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "graphql",
    password: "graphql",
    database: "blog",
    entities: [User, Post, Comment]
  });
}
