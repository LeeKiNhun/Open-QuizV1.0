import { api } from "./client";

export const libraryApi = {
  listBooks: async () => {
    const res = await api.get("/library/books");
    return res.data; // { ok, items }
  },
  getBook: async (bookId) => {
    const res = await api.get(`/library/books/${bookId}`);
    return res.data; // { ok, item }
  },
};
