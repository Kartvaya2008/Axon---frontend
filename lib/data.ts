/* ============================================================================
 * AXON DOCUMENT INTELLIGENCE — SITE CONTENT
 * ----------------------------------------------------------------------------
 * Every string visible on the landing page comes from here.
 * Sections follow the same narrative Acts as the original portfolio structure.
 * ========================================================================== */

export const identity = {
  /**
   * `name` drives the two-line hero h1:
   *   Line 1 (solid):    "Document"
   *   Line 2 (outlined): "Intelligence"
   * This keeps the hero descriptive while AXON. in the nav is the sole brand mark.
   */
  name: 'Document Intelligence',
  /**
   * `initials` drives:
   *   – the top-left nav logo  → "AXON."  (ONE primary brand location)
   *   – the WebGL particle field background (visual brand mark)
   */
  initials: 'AXON',
  /** Shown in the nav header centre and hero bottom-right corner. */
  role: 'Vector Search & Conversational QA',
  location: 'Production ready',
  email: 'hello@kartavyalabs.pro',
  available: true,
  availableLabel: 'System active — ready for ingestion',
  tagline:
    'Upload your documents. Ask real questions. Get answers that know where they came from.',
} as const;

export const socials = [
  { label: 'GitHub', href: 'https://github.com/Kartvaya2008/Axon---frontend' },
  { label: 'Launch App', href: '/app' },
  { label: 'hello@kartavyalabs.pro', href: 'mailto:hello@kartavyalabs.pro' },
] as const;

export const nav = [
  { label: 'Home', href: '#hero', index: '01' },
  { label: 'Launch App', href: '/app', index: '02' },
  { label: 'How it works', href: '#pipeline', index: '03' },
  { label: 'Features', href: '#work', index: '04' },
  { label: 'Technology', href: '#stack', index: '05' },
  { label: 'Roadmap', href: '#experience', index: '06' },
  { label: 'Get Started', href: '#contact', index: '07' },
] as const;

/* --------------------------------------------------------------------------
 * ACT I — the thesis. Rendered as a scroll-revealed manifesto.
 * Each string is one line; they reveal word-by-word as you scroll.
 * ------------------------------------------------------------------------ */
export const manifesto = {
  eyebrow: 'The problem',
  lines: [
    'Documents pile up.',
    'Search returns pages, not answers.',
    'People read instead of decide.',
    'Axon changes that.',
    'Ask the document. Get the answer. See the source.',
  ],
};

/* --------------------------------------------------------------------------
 * ACT II — the pinned scrollytelling spine.
 * Five stages of the Axon RAG pipeline. Left column scrolls, right visual
 * is sticky and re-renders per active step.
 * ------------------------------------------------------------------------ */
export type PipelineStep = {
  id: string;
  index: string;
  title: string;
  body: string;
  metric: { value: string; label: string };
  /** Drives the sticky WebGL visual. */
  mode: 'scatter' | 'cluster' | 'converge' | 'grid' | 'stream';
};

export const pipeline: PipelineStep[] = [
  {
    id: 'ingest',
    index: '01',
    title: 'Ingest',
    body: 'Upload PDF or TXT files. Axon reads the raw bytes, cleans the noise, and stores each document ready for search. No formatting required. No special structure expected.',
    metric: { value: 'PDF + TXT', label: 'supported formats' },
    mode: 'scatter',
  },
  {
    id: 'chunk',
    index: '02',
    title: 'Chunk',
    body: "Long documents are split into passages that fit inside a language model's attention window. Each chunk keeps enough context to be understood on its own — and enough overlap so answers never fall between two pieces.",
    metric: { value: '512', label: 'tokens per chunk' },
    mode: 'cluster',
  },
  {
    id: 'embed',
    index: '03',
    title: 'Embed',
    body: 'Every chunk becomes a vector — a point in high-dimensional space where meaning, not keywords, determines proximity. Powered by Sentence Transformers, stored in FAISS for instant lookup.',
    metric: { value: '384-dim', label: 'embedding space' },
    mode: 'converge',
  },
  {
    id: 'retrieve',
    index: '04',
    title: 'Retrieve',
    body: "When you ask a question, the same embedding model encodes it. FAISS returns the passages most similar in meaning — not just in vocabulary. The right context reaches the model even when the words don't match.",
    metric: { value: 'Top-5', label: 'chunks retrieved per query' },
    mode: 'grid',
  },
  {
    id: 'answer',
    index: '05',
    title: 'Answer',
    body: "The retrieved passages and your question are composed into a prompt. Groq's inference returns the answer in milliseconds. Source citations are preserved so every answer is verifiable — not just plausible.",
    metric: { value: '<2s', label: 'end-to-end response time' },
    mode: 'stream',
  },
];

/* --------------------------------------------------------------------------
 * ACT III — feature cards (treated as "Work" in the original structure).
 * ------------------------------------------------------------------------ */
export type Project = {
  slug: string;
  title: string;
  year: string;
  category: string;
  summary: string;
  stack: string[];
  metrics: { value: string; label: string }[];
  href?: string;
  repo?: string;
  featured?: boolean;
  private?: boolean;
  accent: string;
  image?: string;
};

export const projects: Project[] = [
  {
    slug: 'document-qa',
    title: 'Document Q&A',
    year: '2026',
    category: 'Core Feature',
    summary:
      'Upload any PDF or TXT document and immediately start asking questions in plain language. Axon finds the relevant passages, composes a precise answer, and shows you exactly where in the document it came from. No prompting tricks. No hallucinated context.',
    stack: ['FastAPI', 'FAISS', 'Groq', 'Sentence Transformers', 'React'],
    metrics: [
      { value: '<2s', label: 'answer latency' },
      { value: 'Source-cited', label: 'every response' },
    ],
    featured: true,
    accent: '#E9A55C',
  },
  {
    slug: 'multi-document',
    title: 'Multi-Document Search',
    year: '2026',
    category: 'Search',
    summary:
      'Ask one question across an entire library of uploaded documents. Axon retrieves the most relevant passages from across all files, ranks them by semantic similarity, and synthesises a single coherent answer — with document-level attribution so you know exactly which source each claim came from.',
    stack: ['FAISS', 'pgvector', 'FastAPI', 'Python'],
    metrics: [
      { value: 'N docs', label: 'searched in parallel' },
      { value: 'Ranked', label: 'semantic retrieval' },
    ],
    featured: true,
    accent: '#3FB8C4',
  },
  {
    slug: 'session-memory',
    title: 'Conversation Context',
    year: '2026',
    category: 'Intelligence',
    summary:
      "Questions build on each other. Axon maintains session-level conversation history so follow-up questions stay in context — without forcing you to re-upload or re-state the document. Ask once, dig deeper.",
    stack: ['FastAPI', 'In-session memory', 'Groq'],
    metrics: [
      { value: 'Multi-turn', label: 'conversation support' },
      { value: 'No re-upload', label: 'required per session' },
    ],
    accent: '#8B7BD8',
  },
  {
    slug: 'source-citations',
    title: 'Source Citations',
    year: '2026',
    category: 'Trust & Accuracy',
    summary:
      'Every answer Axon returns is tied to the passage it came from. The source text is surfaced alongside the response so you can verify, quote, or investigate further without second-guessing the model. Answers you can act on.',
    stack: ['RAG pipeline', 'FastAPI', 'React'],
    metrics: [
      { value: '100%', label: 'answers cited' },
      { value: 'Chunk-level', label: 'attribution' },
    ],
    accent: '#D96A6A',
  },
];

/* --------------------------------------------------------------------------
 * ACT IV — capability cards (the 3D flip stack).
 * Keep `capabilities` at exactly 4.
 * ------------------------------------------------------------------------ */
export const capabilities = [
  {
    index: '01',
    title: 'Ingest',
    back: 'Drop in a PDF or TXT file. Axon handles the rest — parsing, cleaning, chunking — without requiring you to think about the format.',
    tags: ['PDF', 'TXT', 'Auto-parse'],
  },
  {
    index: '02',
    title: 'Search',
    back: 'Semantic search over every document in your library. Meaning drives retrieval, not exact-match keywords. The right passage surfaces even when the words differ.',
    tags: ['FAISS', 'Sentence Transformers', 'Semantic ranking'],
  },
  {
    index: '03',
    title: 'Answer',
    back: 'Groq-powered inference returns answers in under two seconds. Fast enough to feel like search. Accurate enough to trust in a decision.',
    tags: ['Groq LLM', 'RAG', 'Sub-2s latency'],
  },
  {
    index: '04',
    title: 'Cite',
    back: 'Every response shows the exact passage it was drawn from. Verification is built in, not bolted on.',
    tags: ['Source attribution', 'Chunk-level', 'Auditable'],
  },
];

export const stack = [
  {
    group: 'AI & LLMs',
    items: ['Groq', 'LLaMA 3', 'Sentence Transformers', 'RAG', 'Semantic Search'],
  },
  {
    group: 'Vector Search',
    items: ['FAISS', 'pgvector', 'Cosine similarity', 'Embedding indexing', 'Top-K retrieval'],
  },
  {
    group: 'Backend',
    items: ['Python', 'FastAPI', 'Uvicorn', 'SlowAPI rate limiting', 'JWT Auth', 'REST APIs'],
  },
  {
    group: 'Document',
    items: ['PyPDF2', 'Text chunking', 'Overlap windowing', 'Multi-format ingestion', 'Preprocessing'],
  },
  {
    group: 'Data',
    items: ['PostgreSQL', 'Supabase', 'SQLAlchemy', 'Alembic', 'Session storage'],
  },
  {
    group: 'Frontend',
    items: ['React', 'Next.js', 'Vanilla JS', 'HTML5', 'CSS3', 'Responsive UI'],
  },
];

/* --------------------------------------------------------------------------
 * ACT V — the roadmap.
 * ------------------------------------------------------------------------ */
export const experience = [
  {
    period: 'Now',
    role: 'Open Beta',
    org: 'Axon',
    detail:
      'The core RAG pipeline is live. Upload documents, ask questions, receive cited answers. Authentication, multi-document search, and session history are all functional and available to try.',
  },
  {
    period: 'Phase 2',
    role: 'Team Workspaces',
    org: 'Roadmap',
    detail:
      "Shared document libraries for teams. Role-based access, shared search history, and collaborative annotation — so knowledge stops living in one person's inbox.",
  },
  {
    period: 'Phase 3',
    role: 'API Access',
    org: 'Roadmap',
    detail:
      "A clean REST API so developers can embed Axon's document intelligence into their own products. Query your documents programmatically, retrieve cited answers, and integrate into existing workflows.",
  },
  {
    period: 'Phase 4',
    role: 'Enterprise Scale',
    org: 'Roadmap',
    detail:
      'Private deployment, custom embedding models, SSO, audit logs, and SLA-backed uptime for organisations that need document intelligence without sending data to shared infrastructure.',
  },
];

/* Real product metrics. */
export const metrics = [
  { value: 2, suffix: 's', label: 'End-to-end answer latency' },
  { value: 384, suffix: '', label: 'Embedding dimensions (Sentence Transformers)' },
  { value: 5, suffix: '', label: 'Chunks retrieved per query' },
  { value: 100, suffix: '%', label: 'Answers with source citation' },
];

export const outro = {
  eyebrow: 'Get started',
  headline: 'Your documents should answer questions.',
  body: 'Axon is ready. Upload a document, ask what you need to know, and get a cited answer in seconds. No setup. No configuration. No hallucinated context.',
  cta: 'Launch Axon',
};

export const marqueeWords = [
  'DOCUMENT INTELLIGENCE',
  'RAG',
  'SEMANTIC SEARCH',
  'SOURCE CITATIONS',
  'FAISS',
  'GROQ',
  'FASTAPI',
  'PDF ANALYSIS',
];
