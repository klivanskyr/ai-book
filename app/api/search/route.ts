import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
    const q = request.nextUrl.searchParams.get('q') || '';
    if (!q) {
        return NextResponse.json({ error: 'q is required' }, { status: 400 });
    }

    const OPENAI_API = "https://api.openai.com/v1/chat/completions";
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        return NextResponse.json({ error: 'OpenAI API key is not configured' }, { status: 500 });
    }

    const openAIResponse = await fetch(OPENAI_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are a helpful assistant that helps people find books. You will be given a description of a book or books, and you will respond with the ISBN of the most relevant book. If no books match, respond with 'none'.
                        Return in the following format:
                        [
                            {
                                "ISBN": <ISBN>,
                                "Title": <Book Title>,
                                "Author": <Author>,
                                "Summary": <Short Summary>
                            }
                        ]
                    `
                },
                {
                    role: "user",
                    content: `Find the ISBN of a book that matches this description: ${q}. Return the ISBN, Book Title, Author and a short summary of the three most relevant ones. If no books match, return "none".`
                }
            ]
        })
    });

    const openAIData = await openAIResponse.json();
    console.log("OpenAI Response:", openAIData);
    if (!openAIResponse.ok) {
        return NextResponse.json({ error: 'Failed to fetch data from OpenAI' }, { status: 500 });
    }

    const message = openAIData.choices?.[0]?.message?.content;
    if (!message) {
        return NextResponse.json({ error: 'No message returned from OpenAI' }, { status: 500 });
    }

    let books;
    try {
        books = JSON.parse(message);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to parse OpenAI response' }, { status: 500 });
    }

    if (!Array.isArray(books) || books.length === 0 || books[0].ISBN === "none") {
        return NextResponse.json({ error: 'No books found for the given query' }, { status: 404 });
    }

    const OPENLIBRARY_API = "https://openlibrary.org/search.json?q=";
    const results = [];
    for (const book of books.slice(0, 3)) {
        if (!book.ISBN || book.ISBN === "none") continue;
        try {
            const openlib_response = await fetch(`${OPENLIBRARY_API}${book.ISBN}`);
            if (!openlib_response.ok) continue;
            const openlib_json = await openlib_response.json();
            const data = openlib_json.docs && openlib_json.docs[0];
            results.push({
                title: book.Title || (data ? data.title : null),
                author: book.Author || (data && data.author_name ? data.author_name[0] : null),
                isbn: book.ISBN,
                imageUrl: data && data.cover_i ? `https://covers.openlibrary.org/b/id/${data.cover_i}-M.jpg` : null,
                summary: book.Summary || null
            });
        } catch (e) {
            // skip book if OpenLibrary fails
            continue;
        }
    }

    if (results.length === 0) {
        return NextResponse.json({ error: 'No valid book data found' }, { status: 404 });
    }

    return NextResponse.json(results, { status: 200 });
}