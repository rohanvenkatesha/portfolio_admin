/* ============================================================================
 * SINGLE SOURCE OF TRUTH FOR ALL SITE CONTENT
 * ----------------------------------------------------------------------------
 * Everything the visitor reads lives here. No component hardcodes copy.
 *
 * PROVENANCE — read before editing:
 *   ✅ profile, stats, timeline (tech track), projects, skillGroups
 *      Taken from Rohan's résumé and project list. Nothing invented.
 *      Where a figure wasn't supplied (project years, status, metrics) the
 *      field is left OFF rather than filled with a plausible-looking number.
 *
 *   ⚠️  films, photos, trips, timeline (life track), creative skill groups
 *      PLACEHOLDER. No real data was supplied for the filmmaking / travel
 *      side yet. Replace before publishing, or delete the sections.
 *      Search "PLACEHOLDER" to find every one.
 * ========================================================================== */

export type ProjectCategory = "AI & ML" | "Full Stack" | "Systems" | "Data & Research";
export type TimelineTrack = "tech" | "life";

/* -------------------------------------------------------------------------- */
/* Profile                                                                     */
/* -------------------------------------------------------------------------- */

export const profile = {
  name: "Rohan Venkatesha",
  initials: "RV",
  // Rotating words in the hero headline
  roles: [
    "Python AI Engineer",
    "RAG & Agentic AI Builder",
    "Full Stack Developer",
    "Filmmaker",
    "Solo Traveller",
  ],
  tagline: "I build systems that think, and frames that feel.",
  location: "Michigan, United States",
  timezone: "America/Detroit", // IANA zone — powers the live clock in the footer
  email: "rohanvenkatesha@gmail.com",
  availability: "Available for AI & Full-Stack projects / visual collaborations",
  /**
   * Google Drive preview link. Anything not starting with "/" is treated as
   * external and opens in a new tab.
   *
   * A file committed at /public/resume.pdf would be better: it downloads in one
   * click, survives Drive's sharing settings being changed, and doesn't hand
   * Google a log of who read it. Swap this for "/resume.pdf" if you drop the
   * PDF into the repo.
   */
  resumeUrl: "https://drive.google.com/file/d/17-GVQs_SwpCLk45OmdmF98Ifo1u-ur0u/view",
  /**
   * Hero portrait, shown in its own framed card beside the masthead.
   *
   * Drop a photo at /public/portrait.jpg and set this to "/portrait.jpg". A
   * 4:5 crop fits the frame exactly; anything else is cover-cropped from the
   * centre, so keep the face off the edges. While this is empty the frame
   * shows a designed initials plate instead — the layout doesn't depend on a
   * photo existing.
   *
   * Shown as shot — no colour treatment — so what you commit is what appears.
   *
   * This is no longer the panel background; that's always the particle field.
   */
  portraitUrl: "",
  bio: `I build AI systems that survive contact with production — retrieval pipelines over millions of
tokens, multi-agent workflows, and the unglamorous plumbing that keeps them fast and predictable.
Right now that means Gemini on Vertex AI, pgvector and LangGraph. Before this it was voice agents on
AWS Lambda, computer-vision and Document AI pipelines for fuel-station fleets, and Oracle Retail
rollouts across roughly 3,400 stores.

The other half is written in light: a camera, a long walk somewhere unfamiliar, and the patience to
wait for the frame to arrive.`,
  bioShort:
    "Python AI Engineer building RAG and agentic systems that hold up in production. Engineer by training, storyteller by compulsion.",
} as const;

export const socials = [
  { label: "GitHub", href: "https://github.com/rohanvenkatesha", icon: "github" },
  // TODO: confirm these three — they're inferred from your GitHub handle, not verified
  { label: "LinkedIn", href: "https://linkedin.com/in/rohanvenkatesha", icon: "linkedin" },
  { label: "YouTube", href: "https://youtube.com/@rohanvenkatesha", icon: "youtube" },
  { label: "Instagram", href: "https://instagram.com/rohanvenkatesha", icon: "instagram" },
  { label: "Email", href: "mailto:rohanvenkatesha@gmail.com", icon: "mail" },
] as const;

/** Every figure here is traceable to a résumé line. */
export const stats = [
  { value: 7, suffix: "+", label: "Years building software" },
  { value: 19, suffix: "", label: "Public projects" },
  { value: 3400, suffix: "", label: "Retail stores automated" },
  { value: 58, suffix: "%", label: "LLM latency cut" },
] as const;

/* -------------------------------------------------------------------------- */
/* Capabilities — what you're hired to do                                      */
/* -------------------------------------------------------------------------- */

export const capabilities = [
  {
    number: "01",
    title: "AI & Retrieval Systems",
    body: "RAG pipelines, semantic search and LLM orchestration that stay grounded and fast at production scale — token-aware chunking, re-ranking, and the evaluation loop that keeps answers honest.",
    tags: ["RAG", "LangGraph", "Vertex AI", "pgvector"],
  },
  {
    number: "02",
    title: "Full-Stack Product",
    body: "FastAPI and Next.js applications built end to end — schema design, API surface, real-time dashboards, and the deployment pipeline that carries them into production.",
    tags: ["FastAPI", "Next.js", "PostgreSQL", "Docker"],
  },
  {
    number: "03",
    title: "Vision & Document AI",
    body: "Object detection, multi-object tracking and document extraction pipelines that turn messy real-world input — video feeds, scanned forms — into structured, analytics-ready data.",
    tags: ["YOLOv8", "BoT-SORT", "Document AI", "OCR"],
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Timeline — dual track                                                       */
/* -------------------------------------------------------------------------- */

export type TimelineEntry = {
  id: string;
  track: TimelineTrack;
  period: string;
  title: string;
  org: string;
  location?: string;
  kind: "work" | "education" | "award" | "milestone";
  summary: string;
  highlights: string[];
  stack?: string[];
};

export const timeline: TimelineEntry[] = [
  /* ---- Technical track (from résumé) ---- */
  {
    id: "t-mitecs",
    track: "tech",
    period: "May 2026 — Present",
    title: "Python AI Engineer",
    org: "Mitecs INC",
    location: "Michigan, United States",
    kind: "work",
    summary:
      "Building production multimodal RAG and multi-agent systems on Vertex AI.",
    highlights: [
      "Built a production multimodal RAG pipeline over 500+ text and image documents using pgvector with cosine-similarity search, on Gemini embedding and language models via Vertex AI",
      "Engineered semantic retrieval across 3M+ tokens with token-aware chunking, neighbouring-chunk retrieval and re-rankers — cutting irrelevant context from 20K to 10K tokens (50%)",
      "Cut Gemini response time from 60s to 25s (58% faster) by parallelising LLM calls and removing sequential API bottlenecks",
      "Created a multi-agent AI Mockup Builder in LangGraph, coordinating chat-driven Coder and Reviewer agents to generate and refine responsive UI mockups — used in 20+ client demos",
    ],
    stack: ["Python", "Vertex AI", "Gemini", "pgvector", "LangGraph", "RAG"],
  },
  {
    id: "t-gabriel",
    track: "tech",
    period: "May 2025 — May 2026",
    title: "Full Stack Developer",
    org: "Gabriel AI",
    location: "Michigan, United States",
    kind: "work",
    summary:
      "AI voice agents and real-time campaign dashboards for outbound marketing automation.",
    highlights: [
      "Launched AI voice agents on FastAPI and AWS Lambda to automate outbound marketing and customer engagement, handling thousands of automated calls daily",
      "Implemented callback automation with a retry queue that recovered 100% of missed customer interactions, directly improving lead conversion",
      "Delivered Next.js dashboards with real-time call tracking and campaign analytics across 150+ concurrent marketing campaigns",
    ],
    stack: ["FastAPI", "AWS Lambda", "Next.js", "TypeScript", "Python"],
  },
  {
    id: "t-wmu",
    track: "tech",
    period: "Aug 2023 — Apr 2025",
    title: "M.S. Computer Science",
    org: "Western Michigan University",
    location: "United States",
    kind: "education",
    summary: "Graduate study in computer science.",
    highlights: ["GPA 3.75"],
  },
  {
    id: "t-adetrez",
    track: "tech",
    period: "Aug 2021 — Mar 2023",
    title: "Senior Software Engineer",
    org: "Adetrez Labs",
    location: "Bengaluru, India",
    kind: "work",
    summary:
      "Computer vision, document intelligence and MCP-based microservices on Google Cloud.",
    highlights: [
      "Designed an AI-driven Loyalty Reward Management platform with React, Next.js, YOLOv8 and BoT-SORT — trained CV models on 5,000+ custom images to track ~20,000 vehicles weekly across fuel stations",
      "Built Google Cloud Document AI pipelines extracting 15+ structured fields from unstructured business documents into analytics-ready JSON",
      "Developed FastAPI microservices on Cloud Run using the Model Context Protocol (MCP) with prompt engineering, retrieval grounding and token optimisation",
      "Reduced API response times from 200ms to 80ms through query optimisation and infrastructure improvements",
    ],
    stack: ["React", "Next.js", "YOLOv8", "BoT-SORT", "Document AI", "FastAPI", "Cloud Run", "MCP"],
  },
  {
    id: "t-infosys",
    track: "tech",
    period: "Jan 2019 — Apr 2021",
    title: "Systems Engineer",
    org: "Infosys Limited",
    location: "Bengaluru, India",
    kind: "work",
    summary:
      "Retail systems automation and enterprise Oracle migrations at national scale.",
    highlights: [
      "Automated Oracle Retail Xstore rollouts across ~3,400 stores and 13,600 registers using Python and CI/CD pipelines",
      "Maintained and enhanced 6+ Flask and Django microservices supporting POS operations, inventory sync and reporting",
      "Delivered Python analytics tools with asynchronous processing to monitor sales, inventory and customer activity across ~500 global retail locations",
      "Executed enterprise Oracle database migrations with Python scripts that programmatically compared schemas and created missing tables and columns — migrating millions of records with 100% data integrity",
    ],
    stack: ["Python", "Flask", "Django", "Oracle SQL", "CI/CD", "Shell Scripting"],
  },
  {
    id: "t-vtu",
    track: "tech",
    period: "Aug 2015 — Jul 2019",
    title: "B.E. Computer Science",
    org: "Visvesvaraya Technological University",
    location: "India",
    kind: "education",
    summary: "Undergraduate engineering in computer science.",
    highlights: ["Where the compiler and the camera both got their hooks in"],
  },

  /* ---- Creative / life track ----
     ⚠️ PLACEHOLDER — no real data supplied yet. Replace or delete. */
  {
    id: "l-doc",
    track: "life",
    period: "2024",
    title: "First Short Documentary",
    org: "Self-produced",
    kind: "milestone",
    summary: "PLACEHOLDER — replace with a real project.",
    highlights: ["Shot, directed, edited and colour-graded end to end"],
    stack: ["DaVinci Resolve"],
  },
  {
    id: "l-camera",
    track: "life",
    period: "2017",
    title: "Picked Up the First Camera",
    org: "A hand-me-down DSLR",
    kind: "milestone",
    summary: "PLACEHOLDER — replace with your real starting point.",
    highlights: ["Started as documentation for hikes; became a practice"],
  },
];

/* -------------------------------------------------------------------------- */
/* Engineering projects — all 19 are real, from your GitHub                     */
/* -------------------------------------------------------------------------- */

export type Project = {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  category: ProjectCategory;
  stack: string[];
  /** Derived strictly from your own project descriptions. */
  highlights: string[];
  accent: "cyan" | "violet" | "amber" | "lime" | "rose";
  /** Cover image in Firebase Storage. Falls back to the accent gradient plate. */
  coverUrl?: string;
  featured?: boolean;
  repo?: string;
  demo?: string;

  /* ---- Optional, and deliberately left unset ----------------------------
   * No ship dates, statuses, metrics or architecture write-ups were supplied,
   * so none are invented here. Fill any of these in and the UI picks them up
   * automatically — cards render a metrics row, detail pages render an
   * architecture section.
   * --------------------------------------------------------------------- */
  year?: string;
  status?: "Shipped" | "Active" | "Research";
  metrics?: { label: string; value: string }[];
  architecture?: string;
};

const GH = "https://github.com/rohanvenkatesha";

export const projects: Project[] = [
  {
    id: "p-lpr",
    slug: "license-plate-recognition",
    title: "License Plate Detection & Recognition",
    blurb:
      "A full-stack AI system that detects and recognises license plates from video, pairing YOLOv8 detection with PaddleOCR recognition.",
    category: "AI & ML",
    accent: "cyan",
    featured: true,
    stack: ["YOLOv8", "PaddleOCR", "FastAPI", "Next.js", "WebSockets", "OpenCV"],
    highlights: [
      "YOLOv8 for plate detection, PaddleOCR for character recognition",
      "Live WebSocket streaming of detected plates",
      "Downloadable processed videos and CSV logs",
      "Next.js dashboard front end",
    ],
    repo: `${GH}/License_Plate_Recognition_System`,
  },
  {
    id: "p-healthcare",
    slug: "healthcare-website",
    title: "Healthcare Website",
    blurb:
      "A modern, responsive healthcare site with an AI-powered chatbot, appointment scheduling, patient resources and provider profiles.",
    category: "Full Stack",
    accent: "lime",
    featured: true,
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "FastAPI", "OpenAI API"],
    highlights: [
      "AI-powered patient chatbot",
      "Appointment scheduling flow",
      "Patient resource library and provider profiles",
      "Fully responsive Next.js + Tailwind front end",
    ],
    repo: `${GH}/Healthcare_Website`,
  },
  {
    id: "p-coupon",
    slug: "ai-coupon-manager",
    title: "AI Coupon Manager",
    blurb:
      "A crowdsourced full-stack app that uses AI to generate, validate and manage discount coupons, with store-wise browsing and ratings.",
    category: "Full Stack",
    accent: "amber",
    featured: true,
    stack: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "FastAPI",
      "SQLAlchemy",
      "PostgreSQL",
      "OpenAI GPT-3",
      "Docker",
    ],
    highlights: [
      "AI-driven coupon generation and validation",
      "Store-wise browsing with community ratings",
      "SQLAlchemy + PostgreSQL persistence",
      "Dockerised FastAPI backend",
    ],
    repo: `${GH}/Ai_Coupon_Manager_Crowdsourced`,
  },
  {
    id: "p-resume",
    slug: "ai-resume-analyzer",
    title: "AI Résumé & Job Description Analyzer",
    blurb:
      "Analyses a résumé against a job description, identifying matched and missing skills, calculating a fit score and generating an AI summary.",
    category: "AI & ML",
    accent: "violet",
    featured: true,
    stack: [
      "FastAPI",
      "Python",
      "spaCy",
      "OpenRouter (Mistral 7B)",
      "Uvicorn",
      "Next.js",
      "Axios",
      "Tailwind CSS",
    ],
    highlights: [
      "Matched vs. missing skill extraction",
      "Quantified fit score between résumé and role",
      "AI-generated summary via Mistral 7B on OpenRouter",
      "spaCy NLP pipeline behind a FastAPI service",
    ],
    repo: `${GH}/AI-Resume-and-Job-Description-Analyzer`,
  },
  {
    id: "p-rag",
    slug: "rag-chatbot",
    title: "Retrieval Augmented Generation Chatbot",
    blurb:
      "Analyses PDFs and images and lets users ask content-based questions, answered from the documents themselves.",
    category: "AI & ML",
    accent: "cyan",
    featured: true,
    stack: ["Streamlit", "LangChain", "FAISS", "Google Generative AI", "NLP"],
    highlights: [
      "PDF and image ingestion",
      "FAISS vector index for semantic retrieval",
      "LangChain retrieval chain over Google Generative AI",
      "Streamlit interface for question answering",
    ],
    repo: `${GH}/Retrieval-Augmented-Generation-RAG-Chatbot`,
  },
  {
    id: "p-claimit",
    slug: "claimit",
    title: "ClaimIT — Insurance & Claims Automation",
    blurb:
      "A platform aimed at automating insurance claims processing and improving customer satisfaction.",
    category: "AI & ML",
    accent: "violet",
    featured: true,
    stack: ["AI", "Machine Learning", "Python", "React.js", "Cloud Computing"],
    highlights: [
      "Automated claims processing workflow",
      "Machine-learning-driven assessment",
      "React front end on a cloud-deployed backend",
    ],
    repo: `${GH}/ClaimIT`,
  },
  {
    id: "p-foodtruck",
    slug: "foodtruck-website",
    title: "Food Truck Website",
    blurb:
      "A modern animated food truck site with a dynamic menu and daily event flash cards.",
    category: "Full Stack",
    accent: "rose",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
    highlights: [
      "Dynamic, data-driven menu",
      "Daily event flash cards",
      "Framer Motion animation throughout",
      "Responsive design",
    ],
    repo: `${GH}/foodtruck-website`,
  },
  {
    id: "p-railway",
    slug: "railway-reservation-api",
    title: "Railway Reservation Backend",
    blurb:
      "A Flask REST API for railway reservations — registration, login, train availability and ticket booking.",
    category: "Full Stack",
    accent: "lime",
    stack: ["Flask", "REST API", "MySQL", "Python"],
    highlights: [
      "User registration and authentication",
      "Train availability lookup",
      "Ticket reservation endpoints",
      "API test coverage",
    ],
    repo: `${GH}/Railway-Reservation-Flask-Backend-API-Testing`,
  },
  {
    id: "p-sarcasm",
    slug: "sarcasm-detection",
    title: "Sarcasm Detection Using NLP",
    blurb:
      "A sarcasm detection system where users enter a sentence and get a verdict back.",
    category: "AI & ML",
    accent: "amber",
    stack: ["Flask", "NLP", "Python"],
    highlights: [
      "NLP classification pipeline",
      "Sentence-level inference",
      "Flask web interface",
    ],
    repo: `${GH}/Sarcasm-Detection-using-Natural-Language-Processing`,
  },
  {
    id: "p-mask",
    slug: "face-mask-detection",
    title: "Face Mask Detection (YOLOv5)",
    blurb:
      "A face mask detection system built on YOLOv5, trained and evaluated on a Kaggle dataset.",
    category: "AI & ML",
    accent: "cyan",
    stack: ["YOLOv5", "PyTorch", "Computer Vision", "Kaggle"],
    highlights: [
      "YOLOv5 object detection",
      "Kaggle dataset for training and testing",
      "End-to-end inference pipeline",
    ],
    repo: `${GH}/Face-Mask-Detection-Using-Yolov5`,
  },
  {
    id: "p-hate",
    slug: "hate-speech-detection",
    title: "Hate Speech Detection",
    blurb:
      "A deep learning approach to detecting hate speech in text, served through a Django web application.",
    category: "AI & ML",
    accent: "rose",
    stack: ["Deep Learning", "Django", "NLP", "Text Classification"],
    highlights: [
      "Deep learning text classifier",
      "NLP preprocessing pipeline",
      "Django web application",
    ],
    repo: `${GH}/Deep-Learning-Approach-for-Hate-Speech-Detection`,
  },
  {
    id: "p-market",
    slug: "market-basket-apriori",
    title: "Market Basket Apriori Analysis",
    blurb:
      "Implements the Apriori algorithm for market basket analysis, identifying frequent itemsets and generating association rules.",
    category: "Data & Research",
    accent: "amber",
    stack: ["Python", "mlxtend", "Apriori", "Data Mining"],
    highlights: [
      "Frequent itemset mining",
      "Association rule generation",
      "mlxtend-based implementation",
    ],
    repo: `${GH}/MarketBasket-Apriori-Analysis`,
  },
  {
    id: "p-search",
    slug: "basic-search-engine",
    title: "Basic Search Engine",
    blurb:
      "A simplified document search engine built from first principles — similar in concept to Google or Bing, at a much smaller scale.",
    category: "Data & Research",
    accent: "cyan",
    stack: ["Information Retrieval", "Indexing", "Query Processing", "Python"],
    highlights: [
      "Document indexing",
      "Query processing and matching",
      "Information retrieval fundamentals",
    ],
    repo: `${GH}/Basic-Search-Engine`,
  },
  {
    id: "p-kcs",
    slug: "smart-supply-chain-kcs",
    title: "Smart Supply Chain — Knowledge Currency System",
    blurb:
      "A proposal for a Knowledge Currency System leveraging AI and blockchain to improve data reliability and traceability in global supply chains.",
    category: "Data & Research",
    accent: "violet",
    stack: ["AI", "Blockchain", "Ethereum", "IoT", "Supply Chain"],
    highlights: [
      "AI + blockchain architecture proposal",
      "Data reliability and traceability across supply chains",
      "IoT and Ethereum integration",
    ],
    repo: `${GH}/Smart-Supply-Chain-Knowledge-Currency-System`,
  },
  {
    id: "p-lexer",
    slug: "cminus-lexical-analyzer",
    title: "Lexical Analyzer for Cminus",
    blurb: "A lexical analyser for the Cminus programming language — source text in, token stream out.",
    category: "Systems",
    accent: "violet",
    stack: ["Python", "PLY", "Lexical Analysis", "Compiler Design"],
    highlights: [
      "Tokenisation of Cminus source",
      "PLY-based lexer",
      "Compiler front-end fundamentals",
    ],
    repo: `${GH}/Lexical-Analyzer-for-Cminus-Programming-Language`,
  },
  {
    id: "p-parser",
    slug: "cminus-parser",
    title: "Parser for Cminus",
    blurb:
      "Lexical and syntactic analysis for the Cminus language, producing an abstract syntax tree.",
    category: "Systems",
    accent: "violet",
    stack: ["Python", "PLY", "Syntactic Analysis", "AST", "Compiler Design"],
    highlights: [
      "Grammar-driven parsing",
      "Abstract syntax tree construction",
      "Builds on the Cminus lexical analyser",
    ],
    repo: `${GH}/Parser-for-Cminus-Programming-Language`,
  },
  {
    id: "p-udp",
    slug: "udp-client-server",
    title: "UDP Client-Server Interaction",
    blurb:
      "Demonstrates UDP client–server communication, with the client sending message packets to the server.",
    category: "Systems",
    accent: "lime",
    stack: ["C", "UDP", "Sockets", "Networking"],
    highlights: ["UDP socket programming in C", "Client–server packet exchange"],
    repo: `${GH}/UDP-Client-Server-Interaction`,
  },
  {
    id: "p-shell",
    slug: "shell-scripting-sysadmin",
    title: "Shell Scripting for System Administration",
    blurb:
      "A collection of shell scripts for system administration tasks including process monitoring and backup automation.",
    category: "Systems",
    accent: "lime",
    stack: ["Shell Scripting", "Linux", "Automation"],
    highlights: [
      "Process monitoring scripts",
      "Backup automation",
      "Everyday Linux administration tasks",
    ],
    repo: `${GH}/Shell-Scripting-for-System-Administration`,
  },
  {
    id: "p-ds",
    slug: "linked-lists-vs-arrays",
    title: "Linked Lists vs. Arrays",
    blurb:
      "A Python application comparing the performance of linked lists and arrays across a range of data operations.",
    category: "Systems",
    accent: "amber",
    stack: ["Python", "Data Structures", "Complexity Analysis"],
    highlights: [
      "Empirical performance comparison",
      "Search operation benchmarks",
      "Complexity analysis",
    ],
    repo: `${GH}/Searching-in-Linked-Lists-and-Arrays`,
  },
];

export const projectFilters = [
  "All",
  "AI & ML",
  "Full Stack",
  "Systems",
  "Data & Research",
] as const;

/* -------------------------------------------------------------------------- */
/* Films & photography — ⚠️ ALL PLACEHOLDER                                     */
/* -------------------------------------------------------------------------- */

export type Film = {
  id: string;
  title: string;
  role: string;
  year: string;
  runtime: string;
  synopsis: string;
  gradient: string;
  /** Paste a YouTube/Vimeo embed URL to activate the player. */
  embedUrl?: string;
};

export const films: Film[] = [
  {
    id: "f-altitude",
    title: "Altitude",
    role: "Director / DP / Editor",
    year: "2024",
    runtime: "14:22",
    synopsis: "PLACEHOLDER — replace with a real film, or delete this section.",
    gradient: "from-sky-500/40 via-indigo-500/20 to-neon-violet/30",
    embedUrl: "",
  },
  {
    id: "f-monsoon",
    title: "Monsoon Diaries",
    role: "Director / DP",
    year: "2023",
    runtime: "06:48",
    synopsis: "PLACEHOLDER — replace with a real film, or delete this section.",
    gradient: "from-emerald-500/40 via-teal-500/20 to-cyan-500/30",
    embedUrl: "",
  },
  {
    id: "f-nightshift",
    title: "Night Shift",
    role: "DP / Colourist",
    year: "2023",
    runtime: "03:12",
    synopsis: "PLACEHOLDER — replace with a real film, or delete this section.",
    gradient: "from-amber-500/40 via-orange-600/20 to-rose-500/30",
    embedUrl: "",
  },
];

export type Photo = {
  id: string;
  title: string;
  location: string;
  gradient: string;
  span: "tall" | "wide" | "square";
  exif: {
    camera: string;
    lens: string;
    iso: string;
    aperture: string;
    shutter: string;
    focal: string;
  };
  /** Drop files in /public/photos and set e.g. "/photos/frame-01.jpg". */
  src?: string;
};

/** ⚠️ PLACEHOLDER — titles, locations and EXIF are all invented. */
export const photos: Photo[] = [
  { id: "ph-1", title: "Frame 01", location: "Location TBD", span: "tall",
    gradient: "from-indigo-600/50 via-violet-600/30 to-slate-900",
    exif: { camera: "Camera TBD", lens: "Lens TBD", iso: "100", aperture: "f/8", shutter: "1/500", focal: "35mm" } },
  { id: "ph-2", title: "Frame 02", location: "Location TBD", span: "square",
    gradient: "from-emerald-600/50 via-teal-600/30 to-slate-900",
    exif: { camera: "Camera TBD", lens: "Lens TBD", iso: "800", aperture: "f/1.8", shutter: "1/125", focal: "35mm" } },
  { id: "ph-3", title: "Frame 03", location: "Location TBD", span: "wide",
    gradient: "from-amber-500/50 via-orange-600/30 to-slate-900",
    exif: { camera: "Camera TBD", lens: "Lens TBD", iso: "200", aperture: "f/11", shutter: "1/250", focal: "16mm" } },
  { id: "ph-4", title: "Frame 04", location: "Location TBD", span: "square",
    gradient: "from-cyan-600/50 via-blue-700/30 to-slate-900",
    exif: { camera: "Camera TBD", lens: "Lens TBD", iso: "400", aperture: "f/2.8", shutter: "1/60", focal: "23mm" } },
  { id: "ph-5", title: "Frame 05", location: "Location TBD", span: "tall",
    gradient: "from-rose-500/50 via-fuchsia-600/30 to-slate-900",
    exif: { camera: "Camera TBD", lens: "Lens TBD", iso: "160", aperture: "f/5.6", shutter: "1/800", focal: "135mm" } },
  { id: "ph-6", title: "Frame 06", location: "Location TBD", span: "wide",
    gradient: "from-sky-600/50 via-indigo-700/30 to-slate-900",
    exif: { camera: "Camera TBD", lens: "Lens TBD", iso: "1250", aperture: "f/2.8", shutter: "1/40", focal: "50mm" } },
];

/* -------------------------------------------------------------------------- */
/* Travel — ⚠️ ALL PLACEHOLDER                                                  */
/* -------------------------------------------------------------------------- */

export type Trip = {
  id: string;
  slug: string;
  destination: string;
  region: string;
  lat: number;
  lng: number;
  year: string;
  days: number;
  distanceKm: number;
  budget: string;
  vibe: string;
  /**
   * Fallback treatment when there's no cover photo — a Tailwind gradient pair
   * like "from-orange-500/40 to-orange-700/20". Still used behind the image as
   * the loading colour, so it's never dropped.
   */
  gradient: string;
  /** Cover photo, committed under public/media/trips. Empty falls back to the gradient. */
  coverUrl?: string;
  /**
   * ISO timestamp set when the trip is moved to the trash. Present means the
   * trip is hidden everywhere but recoverable; absent means live.
   */
  deletedAt?: string;
  hook: string;
  reflection: string;
  itinerary: { day: string; title: string; detail: string }[];
  gear: string[];
  tips: string[];
};

/**
 * ⚠️ PLACEHOLDER. Coordinates are real (so the globe is geographically
 * honest), but the trips, itineraries, budgets and reflections are invented.
 * Replace with journeys you've actually taken, or delete the travel section
 * and its /travel/[slug] route.
 */
export const trips: Trip[] = [
  {
    id: "tr-ladakh",
    slug: "ladakh",
    destination: "Ladakh",
    region: "India · Himalaya",
    lat: 34.1526,
    lng: 77.5771,
    year: "2023",
    days: 18,
    distanceKm: 2400,
    budget: "TBD",
    vibe: "High, cold, quiet",
    gradient: "from-indigo-500/40 to-violet-600/20",
    hook: "PLACEHOLDER — replace with a trip you've actually taken.",
    reflection: "PLACEHOLDER — your own reflection goes here.",
    itinerary: [
      { day: "Day 1-3", title: "Acclimatise", detail: "PLACEHOLDER — replace with your real day-by-day log." },
      { day: "Day 4-6", title: "Onward", detail: "PLACEHOLDER — replace with your real day-by-day log." },
    ],
    gear: ["Gear item TBD"],
    tips: ["PLACEHOLDER — your own solo travel advice goes here."],
  },
  {
    id: "tr-meghalaya",
    slug: "meghalaya",
    destination: "Meghalaya",
    region: "India · Northeast",
    lat: 25.467,
    lng: 91.3662,
    year: "2024",
    days: 11,
    distanceKm: 900,
    budget: "TBD",
    vibe: "Green, wet, alive",
    gradient: "from-emerald-500/40 to-teal-600/20",
    hook: "PLACEHOLDER — replace with a trip you've actually taken.",
    reflection: "PLACEHOLDER — your own reflection goes here.",
    itinerary: [
      { day: "Day 1-2", title: "Basecamp", detail: "PLACEHOLDER — replace with your real day-by-day log." },
      { day: "Day 3-5", title: "Into the hills", detail: "PLACEHOLDER — replace with your real day-by-day log." },
    ],
    gear: ["Gear item TBD"],
    tips: ["PLACEHOLDER — your own solo travel advice goes here."],
  },
  {
    id: "tr-michigan",
    slug: "michigan",
    destination: "Michigan",
    region: "United States · Great Lakes",
    lat: 44.3148,
    lng: -85.6024,
    year: "2025",
    days: 5,
    distanceKm: 700,
    budget: "TBD",
    vibe: "Lakes, forest, open road",
    gradient: "from-cyan-500/40 to-blue-600/20",
    hook: "PLACEHOLDER — replace with a trip you've actually taken.",
    reflection: "PLACEHOLDER — your own reflection goes here.",
    itinerary: [
      { day: "Day 1-2", title: "North", detail: "PLACEHOLDER — replace with your real day-by-day log." },
      { day: "Day 3-5", title: "The lakeshore", detail: "PLACEHOLDER — replace with your real day-by-day log." },
    ],
    gear: ["Gear item TBD"],
    tips: ["PLACEHOLDER — your own solo travel advice goes here."],
  },
];

/* -------------------------------------------------------------------------- */
/* Skills                                                                      */
/* -------------------------------------------------------------------------- */

export type SkillGroup = {
  id: string;
  label: string;
  domain: "engineering" | "creative";
  accent: "cyan" | "violet" | "amber" | "lime" | "rose";
  /**
   * `level` is a 0–100 self-assessment and drives the radar and bars.
   * Only you can set these honestly — the defaults below are a starting
   * point, not a measurement. Tune them.
   */
  skills: { name: string; level: number }[];
};

export const skillGroups: SkillGroup[] = [
  {
    id: "s-ai", label: "AI & GenAI", domain: "engineering", accent: "violet",
    skills: [
      { name: "RAG Pipelines", level: 95 },
      { name: "LLM Orchestration", level: 90 },
      { name: "Agentic AI / LangGraph", level: 88 },
      { name: "MCP", level: 85 },
      { name: "Prompt Engineering", level: 90 },
      { name: "Semantic Search", level: 92 },
    ],
  },
  {
    id: "s-lang", label: "Languages", domain: "engineering", accent: "cyan",
    skills: [
      { name: "Python", level: 95 },
      { name: "TypeScript", level: 88 },
      { name: "JavaScript", level: 88 },
      { name: "Node.js", level: 80 },
      { name: "Shell Scripting", level: 82 },
    ],
  },
  {
    id: "s-backend", label: "Backend & APIs", domain: "engineering", accent: "lime",
    skills: [
      { name: "FastAPI", level: 93 },
      { name: "Flask", level: 88 },
      { name: "Django", level: 80 },
      { name: "REST APIs", level: 92 },
      { name: "Microservices", level: 86 },
    ],
  },
  {
    id: "s-data", label: "Databases", domain: "engineering", accent: "rose",
    skills: [
      { name: "PostgreSQL", level: 90 },
      { name: "pgvector", level: 90 },
      { name: "Oracle SQL", level: 84 },
      { name: "MySQL", level: 85 },
      { name: "MongoDB", level: 76 },
    ],
  },
  {
    id: "s-cv", label: "Vision & Documents", domain: "engineering", accent: "amber",
    skills: [
      { name: "YOLOv8 / YOLOv5", level: 88 },
      { name: "BoT-SORT Tracking", level: 80 },
      { name: "Document AI", level: 85 },
      { name: "OCR", level: 84 },
      { name: "OpenCV", level: 80 },
    ],
  },
  {
    id: "s-cloud", label: "Cloud & DevOps", domain: "engineering", accent: "cyan",
    skills: [
      { name: "GCP (Cloud Run)", level: 88 },
      { name: "Vertex AI", level: 90 },
      { name: "AWS (Lambda, S3)", level: 82 },
      { name: "Docker", level: 86 },
      { name: "Vercel / Render", level: 84 },
    ],
  },
  {
    id: "s-web", label: "Web & Frontend", domain: "engineering", accent: "lime",
    skills: [
      { name: "React", level: 88 },
      { name: "Next.js", level: 90 },
      { name: "Tailwind CSS", level: 90 },
    ],
  },

  /* ⚠️ PLACEHOLDER — creative skill levels are invented. */
  {
    id: "s-cine", label: "Cinematography", domain: "creative", accent: "amber",
    skills: [
      { name: "Composition", level: 85 },
      { name: "Lighting", level: 75 },
      { name: "Camera Movement", level: 72 },
      { name: "Documentary", level: 80 },
    ],
  },
  {
    id: "s-post", label: "Post & Colour", domain: "creative", accent: "violet",
    skills: [
      { name: "DaVinci Resolve", level: 80 },
      { name: "Colour Grading", level: 78 },
      { name: "Editing", level: 82 },
      { name: "Lightroom", level: 85 },
    ],
  },
];

export const philosophy = [
  {
    title: "Latency is a feature",
    body: "Sixty seconds to twenty-five isn't a nice-to-have — it's the difference between a demo people tolerate and a tool people use. Most of my best work has been finding the sequential thing that didn't need to be sequential.",
  },
  {
    title: "Retrieve less, answer better",
    body: "The instinct with RAG is to stuff the context window. Halving the tokens I sent improved answers. Precision beats volume, in retrieval and in writing.",
  },
  {
    title: "The boring part is the craft",
    body: "Retries, schema migrations that preserve every row, colour consistency across a sequence. Nobody applauds it. It's the entire difference between a prototype and something in production.",
  },
  {
    title: "Go alone, sometimes",
    body: "Solo travel removed my ability to outsource decisions. It made me a calmer engineer — most production incidents are less frightening than a wrong turn with two hours of light left.",
  },
];

/* -------------------------------------------------------------------------- */
/* Navigation                                                                  */
/* -------------------------------------------------------------------------- */
/* Lives in content/sections.ts now — it's derived from the section registry so
 * that disabling a section removes its nav entry automatically. */
