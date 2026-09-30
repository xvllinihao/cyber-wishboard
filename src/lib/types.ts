export type Wish = {
  id: string;
  title: string;
  content: string;
  image_paths: string[];
  like_count: number;
  comment_count: number;
  created_at: string;
  author_id: string;
  author: { username: string } | null;
};

export type WishComment = {
  id: string;
  body: string;
  link: string | null;
  image_path: string | null;
  created_at: string;
  author_id: string;
  author: { username: string } | null;
};

export const WISH_FIELDS =
  "id, title, content, image_paths, like_count, comment_count, created_at, author_id, author:profiles(username)";

export const COMMENT_FIELDS =
  "id, body, link, image_path, created_at, author_id, author:profiles(username)";
