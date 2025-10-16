"use client"

import { useState, useEffect } from "react"
import { Input, Book } from "@/types/types"

export default function Home() {
  const [input, setInput] = useState<Input>({ query: "", error: null });
  const [books, setBooks] = useState<Book[]>([]);
  const [searchBooks, setSearchBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // load books from localStorage
    const storedBooks = localStorage.getItem("myBooks");
    if (storedBooks) {
      setBooks(JSON.parse(storedBooks));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    const valid = input.query.trim().length > 0;

    if (!valid) {
      setInput({ ...input, error: "Please enter a search query." });
      return;
    }

    const response = await fetch(`/api/search?q=${input.query}`);

    if (!response.ok) {
      setInput({ ...input, error: "Failed to fetch data from OpenLibrary." });
      return;
    }

    const data = await response.json();

    if (data.error) {
      setInput({ ...input, error: data.error });
      return;
    }

    setInput({ query: "", error: null });
    setSearchBooks(data as Book[]);
    setLoading(false);
  }

  const handleAddBook = (book: Book) => {
    if (books.find(b => b.isbn === book.isbn)) {
      alert("Book already in your list.");
      return;
    }

    setBooks([...books, book]);
    setSearchBooks(searchBooks.filter(b => b.isbn !== book.isbn));

    // save books to localStorage
    localStorage.setItem("myBooks", JSON.stringify([...books, book]));
  }

  const handleRemoveBook = (isbn: string) => {
    const updatedBooks = books.filter(b => b.isbn !== isbn);
    setBooks(updatedBooks);

    // update localStorage
    localStorage.setItem("myBooks", JSON.stringify(updatedBooks));
  }

  return (
    <main className="flex w-full min-h-screen flex-col items-center p-24">
      <h1 className="text-2xl font-bold">AI Book Search</h1>
      <form onSubmit={handleSubmit} className="flex flex-row items-center w-fit">
        <textarea
          value={input.query}
          onChange={(e) => setInput({ ...input, query: e.target.value })}
          placeholder="Enter a description of a book or books you want to read..."
          className="mt-4 p-2 border border-gray-300 rounded w-96 h-24 resize-none"
        />
        <button
          type="submit"
          className="mt-4 p-2 bg-blue-500 text-white rounded cursor-pointer"
        >
          {loading ? "Searching..." : "Search"}
        </button>
        {searchBooks.length > 0 && (
          <button 
            onClick={() => setSearchBooks([])}
            className="mt-4 ml-2 p-2 bg-red-500 text-white rounded cursor-pointer"
          >
            Clear search results
          </button>
        )}
      </form>

      {/* Display search results */}
      {searchBooks.length > 0 && (
        <div className="mt-8 w-full max-w-4xl">
          <h2 className="text-xl font-semibold mb-4">Search Results:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchBooks.map((book, index) => (
              <div key={index} className="border p-4 rounded shadow">
                {book.imageUrl && (
                  <img src={book.imageUrl} alt={book.title || "Book Cover"} className="mb-4 w-full h-auto" />
                )}
                <h3 className="text-lg font-bold">{book.title || "Title not available"}</h3>
                <p className="text-sm text-gray-600 mb-2">{book.author || "Author not available"}</p>
                <p className="text-sm">{book.summary || "No summary available."}</p>
                <p className="text-xs text-gray-500 mt-2">ISBN: {book.isbn || "N/A"}</p>
                <button className="mt-2 p-2 bg-green-500 text-white rounded cursor-pointer" onClick={() => handleAddBook(book)}> Add to My Books</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Books List */}
      {books.length > 0 && (
        <div className="mt-12 w-full max-w-4xl">
          <h2 className="text-xl font-semibold mb-4">My Books:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book, index) => (
              <div key={index} className="border p-4 rounded shadow relative">
                <button onClick={() => handleRemoveBook(book.isbn)} className="cursor-pointer absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">X</button>
                {book.imageUrl && (
                  <img src={book.imageUrl} alt={book.title || "Book Cover"} className="mb-4 w-full h-auto" />
                )}
                <h3 className="text-lg font-bold">{book.title || "Title not available"}</h3>
                <p className="text-sm text-gray-600 mb-2">{book.author || "Author not available"}</p>
                <p className="text-sm">{book.summary || "No summary available."}</p>
                <p className="text-xs text-gray-500 mt-2">ISBN: {book.isbn || "N/A"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}