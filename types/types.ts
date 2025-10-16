export type Book = {
  title: string
  author: string
  imageUrl: string
  summary: string
  isbn: string
};

export type Input = {
  query: string
  error: string | null
};