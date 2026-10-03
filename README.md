# Ask Your Documents Anything: How Axon Turns Files into Answers

You know the feeling. A 40-page contract, a project quotation, a stack of research PDFs. Somewhere inside is the one number or clause you need, and the only way to find it is to scroll, squint and hope.

Axon exists to end that. Upload your documents, ask in plain language, and get an answer that points back to where it came from.

## What it feels like

You sign in with Google and drop in a few files: PDFs, Word documents, text files. A moment later they sit in your personal library, each marked "Ready."

Then you simply ask. "What's the total project cost?" "Which modules are included?" "Give me a summary." Axon answers in a few clear sentences and shows the document name and page number underneath, so you can verify it in seconds. Prefer to read the original? Open the document preview, or view the extracted text right inside the app.

It also behaves like an assistant rather than a search box. Say hello and it greets you by name. Ask a general question and it just answers. Ask something vague with several documents uploaded and it asks which one you mean. It only searches your files when your question is about them.

If you are curious how an answer was produced, open "View steps" under any reply. You will see what Axon understood, what it searched, and which model wrote the response.

## Why you can trust the answers

Most chatbots answer from memory, which is fine for trivia but risky for your contract. Axon answers from your documents and says so plainly when the answer is not there.

That is possible because of a technique called retrieval-augmented generation (RAG). In simple terms, Axon does not hand the language model your whole library and hope for the best. It finds the few passages that matter and gives only those to the model.

## Under the hood

Here is the journey of a document, in five steps.

1. **Extraction.** When you upload a file, Axon pulls out the text page by page and saves the full text, so you can read it later and so summaries can cover the entire document.
2. **Chunking.** The text is split into overlapping passages of roughly a paragraph each. The overlap keeps sentences from being cut off mid-thought, and every chunk remembers its page number.
3. **Embedding.** Each chunk is converted into a list of 384 numbers by an embedding model (all-MiniLM-L6-v2). Passages with similar meaning end up with similar numbers, which is how Axon can find "total project cost" even when the document says "TOTAL PROJECT COST ₹57,500" in a table.
4. **Vector storage.** The numbers are stored in Supabase, using PostgreSQL with the pgvector extension, next to your account. This is your personal vector database.
5. **Retrieval and answer.** When you ask a question, it is embedded the same way. Axon finds the closest chunks from your documents, then passes the question, your recent conversation and those passages to a large language model (served through Groq, with OpenRouter as a backup). The model writes the answer and the sources are attached.

For summary-style requests, Axon skips the top-matches approach and works from the document's full text, so the summary reflects the whole file rather than a few fragments.

## Your data stays yours

Every document and every chunk belongs to a user. Sign-in runs through Google via Supabase Auth, the backend verifies your token on every request, and database-level Row Level Security means one user's library cannot be read by another. Search is always filtered to the signed-in user, never by anything the browser sends.

## The stack, briefly

- **Backend:** FastAPI (Python)
- **Database and auth:** Supabase (PostgreSQL, pgvector, Google sign-in)
- **Frontend:** a Next.js landing page and a lightweight web workspace
- **Models:** open-source embeddings, with language models via Groq and OpenRouter

## Who it helps

- **Founders and freelancers** checking quotations, proposals and agreements without rereading them.
- **Students** pulling answers out of notes and papers.
- **Teams** that keep knowledge buried in PDFs and want it to be askable.
- **Anyone** who has ever searched a document with Ctrl+F and found nothing because the words did not match.

## Where it is heading

Voice is next. The groundwork for speech-to-text and text-to-speech is already in place, so you will be able to talk to your documents and have answers read aloud. After that, a mobile app is planned.

The idea behind Axon is simple: your documents already contain the answers. The hard part was never the information. It was getting to it. Axon takes care of that.

---

I can also turn this into a Docs page you can edit and share, or cut a shorter version for the landing page or a LinkedIn post, if you tell me where it will go.
