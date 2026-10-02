/* ============================================================================
 * SITE CONTENT — EDIT THIS FILE ONLY
 * ----------------------------------------------------------------------------
 * Every string, project, metric and link on the site comes from here.
 * Values marked [PLACEHOLDER] are invented and must be replaced with your own.
 * Nothing else in the codebase needs to change to make this site yours.
 * ========================================================================== */

/* Identity, experience and skills below are taken from the CV
 * (Mrunal-Samal.pdf). Phone number deliberately omitted — a public page is
 * a magnet for scrapers; email and LinkedIn are enough to reach you. */
export const identity = {
  name: 'Mrunal Samal',
  initials: 'MS',
  role: 'AI Engineer — Multi-Agent Systems & Agentic Tooling',
  location: 'Bhubaneswar, India',
  email: 'mrunalsamal123@gmail.com',
  available: true,
  availableLabel: 'Freelancing — available now',
  // The single sentence that defines you. Keep it under 20 words.
  tagline:
    'I build multi-agent systems — orchestration, tool calling, MCP — and ship them end to end.',
} as const;

export const socials = [
  { label: 'GitHub', href: 'https://github.com/Mrnal123' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/mrunalsamal' },
  { label: 'Email', href: 'mailto:mrunalsamal123@gmail.com' },
] as const;

export const nav = [
  { label: 'Index', href: '#hero', index: '01' },
  { label: 'Launch Axon App', href: '/app', index: '02' },
  { label: 'Approach', href: '#pipeline', index: '03' },
  { label: 'Work', href: '#work', index: '04' },
  { label: 'Stack', href: '#stack', index: '05' },
  { label: 'Path', href: '#experience', index: '06' },
  { label: 'Contact', href: '#contact', index: '07' },
] as const;

/* --------------------------------------------------------------------------
 * ACT I — the thesis. Rendered as a scroll-revealed manifesto.
 * Each string is one line; they reveal word-by-word as you scroll.
 * ------------------------------------------------------------------------ */
export const manifesto = {
  eyebrow: 'The thesis',
  lines: [
    'Most models never reach anyone.',
    'They die in notebooks — accurate, unused, unloved.',
    'I close that gap.',
    'From the training loop to the production edge,',
    'I ship the whole path.',
  ], // [PLACEHOLDER]
};

/* --------------------------------------------------------------------------
 * ACT II — the pinned scrollytelling spine.
 * Five beats of an ML system. The left column scrolls, the right visual
 * is sticky and re-renders per active step. This is the narrative core.
 * ------------------------------------------------------------------------ */
export type PipelineStep = {
  id: string;
  index: string;
  title: string;
  body: string;
  metric: { value: string; label: string };
  /** Drives the sticky WebGL visual. See components/webgl/PipelineVisual.tsx */
  mode: 'scatter' | 'cluster' | 'converge' | 'grid' | 'stream';
};

export const pipeline: PipelineStep[] = [
  {
    id: 'data',
    index: '01',
    title: 'Data',
    body: 'Everything starts as noise. I build the ingestion, labelling and validation layers that turn messy, real-world input into something a model can actually learn from.',
    metric: { value: '5,572', label: 'SMS records labelled' },
    mode: 'scatter',
  },
  {
    id: 'features',
    index: '02',
    title: 'Features',
    body: 'Structure emerges. Embeddings, feature stores and the unglamorous transforms that decide whether a model has a chance before training ever begins.',
    metric: { value: '88', label: 'category skill taxonomy' },
    mode: 'cluster',
  },
  {
    id: 'model',
    index: '03',
    title: 'Model',
    body: 'Training, fine-tuning, distillation. I care less about leaderboard deltas than about the smallest model that survives contact with production.',
    metric: { value: '98.29%', label: 'classifier accuracy' },
    mode: 'converge',
  },
  {
    id: 'evaluation',
    index: '04',
    title: 'Evaluation',
    body: 'The part people skip. Offline metrics, human review loops, drift detection and the honest question: is this actually better than what it replaced?',
    metric: { value: '3', label: 'baselines benchmarked' },
    mode: 'grid',
  },
  {
    id: 'deploy',
    index: '05',
    title: 'Deployment',
    body: 'Where it becomes real. Typed APIs, streaming inference, observability, and an interface a person can understand without reading the paper.',
    metric: { value: '80%', label: 'confidence gate to answer' },
    mode: 'stream',
  },
];

/* --------------------------------------------------------------------------
 * ACT III — selected work.
 * `featured: true` renders the project large in the grid.
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
  /** Repo is private: the card renders un-linked rather than 404-ing a visitor. */
  private?: boolean;
  /** Fallback accent used to tint the card until you drop a real image in. */
  accent: string;
  image?: string;
};

/* Real repositories under github.com/Mrnal123. Every figure below is taken
 * from the project's own README — nothing here is estimated. If you add
 * benchmarks or deploy a live demo, update `metrics` and point `href` at the
 * demo instead of the repo. */
export const projects: Project[] = [
  {
    slug: 'nanotox',
    title: 'NanoTox',
    year: '2026',
    category: 'Computational Science / ML',
    summary:
      'A four-layer simulation of nanocarrier drug delivery: Gaussian DFT descriptors feed an XGBoost/Random-Forest toxicity screen, then a pH- and temperature-triggered release-kinetics engine, then cell targeting and viability. Wrapped in an orchestrator agent with a citation-grounded RAG layer for missing descriptor values. Built for a research-lab demo.',
    stack: ['Python', 'XGBoost', 'scikit-learn', 'Streamlit', 'RAG'],
    metrics: [
      { value: '16', label: 'DFT descriptors' },
      { value: '4-layer', label: 'simulation pipeline' },
    ],
    // Private repository — no public link. See `private` below.
    private: true,
    featured: true,
    accent: '#E9A55C',
  },
  {
    slug: 'satyanetra',
    title: 'Satyanetra',
    year: '2025',
    category: 'Backend / Distributed Systems',
    summary:
      'A product trust-scoring pipeline. A Spring Boot service ingests a product, fans out to fetch its imagery, reviews and seller history, then runs scoring asynchronously behind job tracking, rate limiting, Redis caching and webhook callbacks — with a Next.js dashboard over the top. Containerised and shipped to AWS ECS by GitHub Actions.',
    stack: ['Java', 'Spring Boot', 'Next.js', 'Redis', 'Docker', 'AWS ECS'],
    metrics: [
      { value: '3', label: 'signal sources fused' },
      { value: 'CI/CD', label: 'Docker → AWS ECS' },
    ],
    href: 'https://github.com/Mrnal123/Satyanetra_Backend',
    repo: 'https://github.com/Mrnal123/Satyanetra_Backend',
    featured: true,
    accent: '#3FB8C4',
  },
  {
    slug: 'spam-detection-system',
    title: 'Spam Detection',
    year: '2026',
    category: 'Text Classification',
    summary:
      'End-to-end classification of spam, phishing and promotional SMS, trained on 5,572 records and benchmarked against Logistic Regression and Random Forest baselines. TF-IDF vectorisation into Multinomial Naive Bayes, with a full preprocessing pipeline — stopword removal, Porter stemming — and a dashboard reporting precision, recall, F1 and confusion matrices.',
    stack: ['Python', 'scikit-learn', 'NLTK', 'Streamlit', 'Seaborn'],
    // Exact figures from the CV; the repo README rounds these to ">98%".
    metrics: [
      { value: '98.29%', label: 'accuracy' },
      { value: '97.1%', label: 'precision' },
    ],
    href: 'https://github.com/Mrnal123/Spam-Detection-System',
    repo: 'https://github.com/Mrnal123/Spam-Detection-System',
    accent: '#8B7BD8',
  },
  {
    slug: 'biospherex',
    title: 'BioSphereX',
    year: '2025',
    category: 'Data Platform',
    summary:
      'A marine biodiversity analysis platform: an interactive dashboard for conservation insight, with 3D globe visualisation, biodiversity hotspot mapping, drag-and-drop dataset upload and live charting across ocean survey data.',
    stack: ['JavaScript', 'Chart.js', 'HTML5', 'CSS3'],
    metrics: [
      { value: '3D', label: 'globe + hotspot mapping' },
      { value: 'Live', label: 'analytics dashboard' },
    ],
    href: 'https://github.com/Mrnal123/BioSphereX',
    repo: 'https://github.com/Mrnal123/BioSphereX',
    accent: '#D96A6A',
  },
];

/* --------------------------------------------------------------------------
 * ACT IV — capability cards (the 3D flip stack) and the full stack list.
 * Keep `capabilities` at exactly 4 — the card choreography is tuned for four.
 * ------------------------------------------------------------------------ */
export const capabilities = [
  {
    index: '01',
    title: 'Research',
    back: 'Reading papers is the easy part. I reproduce them, strip them to what matters, and find out in a week whether the idea survives your data.',
    tags: ['Papers to prototypes', 'Ablations', 'Benchmarking'],
  },
  {
    index: '02',
    title: 'Engineering',
    back: 'Training code someone else can run. Reproducible pipelines, versioned data, experiments you can actually compare six months later.',
    tags: ['MLOps', 'Distributed training', 'Reproducibility'],
  },
  {
    index: '03',
    title: 'Product',
    back: 'A model is not a feature. I design the interface, the failure states and the trust signals that make the intelligence usable.',
    tags: ['Interface design', 'Failure UX', 'Evals'],
  },
  {
    index: '04',
    title: 'Scale',
    back: 'Quantisation, caching, batching — and knowing when the honest answer is a smaller model, or no model at all.',
    tags: ['Inference optimisation', 'Observability', 'Cost'],
  },
]; // [PLACEHOLDER]

export const stack = [
  {
    group: 'Agentic',
    items: ['Claude Code', 'MCP', 'Agent Skills', 'Multi-Agent Orchestration', 'Tool Calling', 'ReAct', 'n8n'],
  },
  {
    group: 'LLMs',
    items: ['OpenAI', 'Anthropic Claude', 'Google Gemini', 'Ollama / Llama 3.1', 'Function Calling', 'Structured Outputs'],
  },
  {
    group: 'Machine Learning',
    items: ['TensorFlow', 'scikit-learn', 'Sentence Transformers', 'NLTK', 'Model Evaluation'],
  },
  {
    group: 'MLOps',
    items: ['joblib packaging', 'Versioned artifacts', 'Evaluation harnesses', 'pytest', 'CI/CD'],
  },
  {
    group: 'Languages',
    items: ['Python', 'SQL', 'Bash', 'TypeScript', 'Linux', 'Git', 'FastAPI', 'Docker', 'Next.js'],
  },
  {
    group: 'Data & Search',
    items: ['PostgreSQL', 'Supabase', 'pgvector', 'Semantic search', 'Vector embeddings', 'RAG'],
  },
];

/* --------------------------------------------------------------------------
 * ACT V — the path. Reverse-chronological.
 * ------------------------------------------------------------------------ */
export const experience = [
  {
    period: 'Jan 2026 — Now',
    role: 'Freelance AI Engineer',
    org: 'Independent',
    detail:
      'Independent client work on multi-agent systems and agentic tooling — agent orchestration, MCP integrations, tool calling and Claude Code skills.',
  },
  {
    period: 'Jun 2026 — Jul 2026',
    role: 'Artificial Intelligence Intern',
    org: 'Incode Vision',
    detail:
      'Shipped TalentRank AI, a resume screener scoring candidates on a weighted 100-point model with semantic matching over an 88-category skill taxonomy. Trained a spam classifier to 98.29% accuracy, benchmarked against Logistic Regression and Random Forest. Built CineMatch AI over 4,803 TMDB titles, FastAPI to Next.js.',
  },
  {
    period: 'Dec 2024 — Jun 2026',
    role: 'Growth & Systems Engineer, Affiliate Operations',
    org: 'Gyankamao · Part-time',
    detail:
      'Automated lead distribution and newsletter funnels across a 45-affiliate network, lifting engagement 3–5%. Sole engineer on 100+ email campaigns, owning segmentation through delivery reporting.',
  },
  {
    period: 'Expected May 2028',
    role: 'B.Tech, Artificial Intelligence & Machine Learning',
    org: 'SRM Institute of Science and Technology',
    detail:
      'Chennai, India. Top 10 team at the ISET Hackathon for Sarathi AI — early warnings with automated resource dispatch. 2nd runner-up at Synapses 2025, IIT Roorkee, for a runtime UI generator in Unreal Engine.',
  },
];

/* Real figures, all traceable to the CV or a project README. */
export const metrics = [
  { value: 98.29, suffix: '%', label: 'Spam classifier accuracy' },
  { value: 267, suffix: '', label: 'Components indexed in a published Claude skill' },
  { value: 4803, suffix: '', label: 'Titles indexed in the recommender' },
  { value: 45, suffix: '', label: 'Affiliate network automated' },
];

export const outro = {
  eyebrow: 'Act VI',
  headline: "Let's build something that ships.",
  body: 'I am currently taking on new work. If you have a model that needs to become a product — or a product that needs a model — I would like to hear about it.',
  cta: 'Start a conversation',
}; // [PLACEHOLDER]

export const marqueeWords = [
  'MULTI-AGENT SYSTEMS',
  'MCP',
  'AGENT SKILLS',
  'TOOL CALLING',
  'RAG',
  'SEMANTIC SEARCH',
  'MLOPS',
  'PYTHON',
];
