// Sam Rogers profile data
// Canonical corpus lives in LocalBrain _Inbox/resume/ — keep this file in sync with that material.

export const samProfile = {
  name: "Sam Rogers",
  title: "Head of Content & Curriculum",
  // Rotated in the Hero. Forward-pointing roles only — the roles Sam wants,
  // not the ones he already holds (those are listed in Experience below).
  // First item renders pre-hydration, so put the strongest standalone target there.
  rotatingTitles: [
    "Head of Content & Curriculum",
    "AI Education Systems Lead",
    "Curriculum Production Systems Lead",
    "Certification & Learning Measurement Lead",
    "Applied AI Education Lead",
  ],
  subtitle:
    "20+ years building curriculum, certification, media, and learning systems that move capability into practice. Currently building AI-enabled measurement and education infrastructure for human-AI collaboration, with a focus on adaptive learning, content production systems, and quality standards that evolve with the model.",
  location: "SF Bay Area · hybrid available",
  status:
    "Focused on roles where AI education, content quality, curriculum systems, and learning measurement become core infrastructure.",

  links: {
    site: "https://sam-rogers.com/",
    paice: "https://paice.foundation/",
    github: "https://github.com/snapsynapse",
    linkedin: "https://linkedin.com/in/samrogers",
    email: "sam@sam-rogers.com",
  },

  experience: [
    {
      company: "PAICE.work PBC",
      role: "Founder",
      period: "2025–Present",
      highlights: [
        "Built PAICE.work: adaptive behavioral simulator scoring human-AI collaboration across five dimensions on a 0–1000 scale. Free for individuals; paid for institutional deployments by governance, risk, compliance, security, and learning leaders.",
        "Built AI-assisted content, assessment, and scoring workflows that encode quality standards into repeatable systems rather than treating every artifact as one-off craft.",
        "Designed AI Posture: open governance framework synthesizing people, infrastructure, and regulation signals into one maturity score. Released as a free public protocol.",
        "Portfolio of 12+ projects. Featured: Siteline (agent-readiness scanner), Every AI Law (jurisdiction-aware regulation index), and GuideCheck (human-verifiable assistant guide standard). Daily publishing cadence since launch.",
        "Created agentic tooling infrastructure and workflows using modern developer tools, local LLMs, and multi-model AI orchestration — the build system that ships the portfolio.",
      ],
      aiContext: {
        situation:
          "Snap Synapse ran an Agent-Readiness Audit consulting service. Demand was real but the work scaled linearly with my time. Standard productization paths either kept it high-touch forever or rebuilt it as a self-serve tool that lost the judgment layer that made the consulting valuable.",
        approach:
          "Sat with the engagements long enough to find what was repeatable vs what required judgment. The scanning of basic agent-incompatibility — broken structured data, hostile robots directives, JavaScript-only renders — was repeatable. The interpretive layer (what does 30% agent bounce mean for *your* business) was not.",
        technicalWork:
          "Siteline ships the repeatable layer as a free scan tier and tiered paid assessments. The consulting service still exists for engagements where judgment is the actual work. Two layers, two questions: scanner says 'here is the floor'; consulting says 'here is what the floor means for you.'",
        lessonsLearned:
          "The productization question is not 'should I productize.' It is 'where in the offering does the judgment live, and can the productized version stay honest about not having access to it.' Tools that overclaim kill the consulting that birthed them.",
      },
    },
    {
      company: "Snap Synapse LLC",
      role: "Principal Consultant",
      period: "2004-2020, 2023-Present",
      highlights: [
        "Built and led the first YouTube Certified Online Training Program at Google (2013–2014). Co-produced 90 videos in 8 weeks, replacing a classroom program that certified ~1,000 partners/year. The online program reached ~10,000 in year one — 10x scale at lower marginal cost. Owned scripting, direction, production, post-production, certification exam, and LMS standup. The assessment-first sequencing (design the test, then work backward through curriculum, production, and LMS) is the same operating pattern that runs PAICE.work's behavioral simulator and the AI Posture maturity framework today — the credential is dated, the playbook is current.",
        "Managed National 4-H Council learning and content-production work across dozens of university partners, coordinating SMEs, curriculum/content contributors, designers, developers, media vendors, and delivery stakeholders through a shared production system.",
        "Built cross-format learning systems across written curriculum, video, certification exams, LMS delivery, workshops, and technical enablement content.",
        "Built technical enablement, certification, and learning systems for Google/YouTube, National 4-H Council, StrongLoop, Deloitte, Robert Half / Protiviti, and Sunrun.",
        "Retained as a subject matter expert by counsel in matters involving YouTube platform mechanics and training content. Engaged on both plaintiff-side and defense-side mandates across separate cases.",
        "Created initial technical training programs for StrongLoop supporting developer platform adoption.",
        "End-to-end video production at scale: pre-production through studio direction (including directing nervous SMEs on camera at Google HQ) through post-production through distribution and digital rights management. Produced and co-hosted a daily livestream show for years.",
        "Frequently operates as translator between engineering, operations, legal, sales, support, and external communities during technical platform launches and organizational change initiatives.",
        "Published frameworks: SNAP Methodology, Engineering Trust series, Signals & Subtractions (weekly field notes on AI adoption and L&D transformation).",
      ],
      aiContext: {
        situation:
          "Google needed a credentialing apparatus for YouTube partners and creators at scale. They had platform expertise. They did not have the production muscle, assessment design, and LMS plumbing to turn it into something a third party could earn and a fourth party could trust.",
        approach:
          "Most people building this start with content, then retrofit assessment and infrastructure later. That sequencing fails because the assessment determines what the content has to teach, and the LMS determines what kinds of assessment are even possible. I started with assessment design and worked backward through curriculum, then production, then LMS.",
        technicalWork:
          "Led the build from scripts through post-production through certification exam through LMS. Held the seams between content people, assessment people, and LMS people — the place where each function usually disagrees about whose constraint binds. As Sam puts it: 'I didn't just take the test; I made the test.'",
        lessonsLearned:
          "Certification programs fail at the seams between functions, not at the work each function does. The job of the lead is to make the seams legible, not to do anyone else's job better than they would. The same assessment-first, work-backward sequencing runs PAICE.work and AI Posture now — the 2013 build is not a stale credential, it is the first version of the playbook still in use.",
      },
    },
    {
      company: "Convatec",
      role: "Global Learning Technology & Analytics Manager",
      period: "2020–2022",
      highlights: [
        "Co-designed a 9-month Manager-to-Leader curriculum delivered to the top 100 managers, paired with a compensation-structure rollout.",
        "Raised Innovation and Learning Organizational Health Index (OHI) score from 48 to 74 in 18 months, exceeding business target.",
        "Launched an AI-based training platform for global shared services across 4 countries; 80%+ adoption in 30 days from a 200-person Portugal cohort.",
        "Streamlined content offerings by 90% while increasing utilization; improved delivery speed by 40%. Architected and led international DMS-to-LMS integration that produced the cleanest compliance audit in company history.",
      ],
      aiContext: {
        situation:
          "10,000-person global medtech. McKinsey OHI score of 48 in Innovation and Learning — bottom quartile of comparable global orgs. Stated target was to raise it; implicit target was to make Convatec measurably less stuck. In parallel, the global shared-services function across four countries needed an AI-based training platform stood up at scale, and the international DMS-to-LMS integration needed to clear a compliance audit.",
        approach:
          "Two parallel moves. On AI deployment: launch the AI-based training platform with shared-services first because they had the highest-density adoption surface, instrument it for measurable behavior change, and treat workforce readiness as the gating constraint rather than the model's capability. On OHI: most people in a Global Learning Technology role read a low OHI score and conclude they need to ship more learning content. A 48 score does not mean people are under-trained. It means the organization does not experience itself as a place where learning happens — a perception, infrastructure, and leadership-narrative problem before it is a curriculum problem.",
        technicalWork:
          "AI-based training platform deployed across four countries with 80%+ adoption in 30 days from a 200-person Portugal cohort — the kind of result regulated employers can verify in their own data. Streamlined the content catalog by 90% to reduce decision fatigue. Drove delivery speed up 40% so leaders got capability within a planning cycle. Tied KPI frameworks to compliance risk and organizational performance, not learning hours consumed. Architected and led the international DMS-to-LMS integration that produced the cleanest compliance audit in company history.",
        lessonsLearned:
          "OHI scores are leading indicators of cultural change, not lagging indicators of training volume. AI adoption at scale lives in the same place: the gating constraint is workforce readiness and governance infrastructure, not model capability. The L&D function that does not understand the difference cannot move the score, and the AI program that does not understand the difference cannot move adoption.",
      },
    },
  ],

  skills: {
    strong: [
      "Content and curriculum production systems",
      "AI-assisted content workflows",
      "Editorial and learning-quality standards",
      "Cross-format learning design: written, video, interactive, workshops",
      "Adaptive / interactive learning product design",
      "University partner and vendor orchestration",
      "L&D systems at scale",
      "Certification program design",
      "Developer education and technical enablement",
      "Manager and leader development",
      "AI-enabled learning experience design (deployed AI training platform across 4 countries, 80% adoption in 30 days at Convatec)",
      "AI governance program design (PAICE methodology, AI Posture framework, EveryAILaw regulation index)",
      "AI accountability and governance posture across SOC 2 / ISO 42001 / NIST AI RMF contexts",
      "Agentic tooling infrastructure (local LLMs, multi-model orchestration)",
      "End-to-end video production (pre-prod → studio direction → post → distribution → DRM)",
      "Cross-functional translation (engineering ↔ legal ↔ sales ↔ community)",
      "Productizing consulting offerings",
      "Performance consulting (not classroom training)",
    ],
    moderate: [
      "Founder-led sales in regulated industries",
      "Open standards authorship",
      "Multi-model evaluation design",
      "Cross-functional change management",
    ],
    gaps: [
      "Deep engineering ownership of production infrastructure",
      "Institutional fundraising track record",
    ],
  },

  // Sam's stated approach to credential / certification program design.
  // From the CertDev resume. Pull-quotable when asked about cert philosophy.
  credentialPhilosophy: [
    "Design for demonstrated mastery rather than content exposure.",
    "Anchor competency definitions in observable behavior.",
    "Prefer performance-based assessment over multiple-choice evaluation.",
    "Build credential systems that can evolve alongside rapidly changing products and partner ecosystems.",
  ],

  // Direct answers to questions a recruiter / hiring manager will ask in the first call.
  // Used by buildSystemPrompt to give AI grounded answers instead of hedging or improvising.
  //
  // Disclosure threat model: every entry in this block is sent to a cloud LLM (Anthropic) as
  // part of the system prompt. Baseline assumption: nothing should be placed here that would be
  // harmful if it ended up disclosed. The block is gated to "ask-on-direct-question" via prompt
  // instructions, not by transport — treat it as semi-public, not private.
  // Concrete examples of the rule in practice:
  // - Region appears ("SF Bay Area"). Residential address, ZIP, and precise city do NOT appear —
  //   precise-address questions route to a direct call, framed as privacy hygiene not evasion.
  // - Personal phone does NOT appear (higher-harm contact channel; email-only on the resume).
  // - Qualitative target band (head-of-function, senior lead, builder/operator role types) appears.
  // - Specific compensation numbers do NOT appear (number conversations belong on a human call).
  // - altMBA, Capital One, and similar career-shape items appear with explicit "disclose only on
  //   direct ask" instructions, since the cost of disclosure is low but proactively surfacing
  //   them weakens the current role positioning.
  // See README "Private FAQ disclosure model" for the full statement.
  recruiterFAQ: [
    {
      q: "If hired, what happens to PAICE? Or Snap Synapse?",
      a: "The open protocols stay maintained — those serve the mission regardless of where Sam is employed. The businesses themselves go dormant. Sam has done this before: Snap Synapse went into stasis for years while he was W2 at Convatec. His goal is to serve the aggregated-intelligence mission inside the time window we have. Whatever helps do that best is what he's doing; all else fades away.",
    },
    {
      q: "Is Sam open to fully on-site? Would he relocate?",
      a: "Yes. The SF Bay Area is home. Remote is his preference — he's been remote for 20 years and is most productive that way — but he goes where the work is needed and the mission calls.",
    },
    {
      q: "Where is Sam based?",
      a: "SF Bay Area. Hybrid available.",
    },
    {
      q: "What city or ZIP exactly? What is the precise address?",
      a: "Sam doesn't put a residential address on a public LLM surface — privacy hygiene that matches the rest of this site's posture. SF Bay Area is accurate for the role question. For commute, on-site, or relocation specifics, sam@sam-rogers.com or https://cal.com/paice.",
    },
    {
      q: "When could he start?",
      a: "Two to three weeks. Time to give notice to current clients and wind down existing projects.",
    },
    {
      q: "How many direct reports has he had?",
      a: "Two officially. The larger management signal is delivery leadership rather than formal W-2 headcount: for National 4-H Council work he managed learning and content production across dozens of university partners, coordinating SMEs, curriculum/content contributors, designers, developers, media vendors, and delivery stakeholders. Across 20+ years he has also assembled and managed teams for migrations, development projects, educational initiatives, and creative works. Be explicit about the distinction: formal direct-report scale is limited; direct work orchestration is substantial.",
    },
    {
      q: "What level / comp band is he targeting?",
      a: "For W-2 roles, strongest fit is head-of-function, senior lead, or builder/operator scope where learning systems, content and curriculum production, certification, AI-enabled education, measurement, and cross-functional execution are core to the work. Specific compensation numbers are a human-level conversation, not something this tool should anchor — ranges in writing tend to mislead in both directions. The right band sits where head-of-function, senior lead, and 0-to-1 education-system roles live at frontier-AI and AI-forward companies. Recruiters: take the number conversation to a direct call with Sam at sam@sam-rogers.com.",
    },
    {
      q: "Isn't Sam a CEO? Why is he looking at IC or Lead roles?",
      a: "Founder/CEO of PAICE.work PBC describes the operating shape, not a large-org executive scope. PAICE is a solo-operator portfolio Sam stood up himself — strategy, content, sales, development, coding, partner relationships — with no direct reports and no scaled org under him. The actual day-to-day pattern is hands-on 0-to-1 builder work: defining operating models, shipping the first version, holding the seams between functions, and turning quality standards into repeatable systems. That maps well to head-of-function, senior lead, and builder/operator roles; it does not map to mature-org roles where the main job is maintaining a large established department. Snap Synapse precedent matters here: it went dormant for years while Sam was W-2 at Convatec running a Global Learning Technology function. Same play available now if the role is the right home for the work.",
    },
    {
      q: "Capital One? Earlier career? What was Sam doing before Snap Synapse?",
      a: "E-learning Developer & Lead LMS Administrator at Capital One, June 2001 to June 2007 (6 years, 1 month), Novato CA, on-site. Administered and scaled internal and external learning systems for 5,000+ employees and 120,000+ partners against security and compliance requirements; built reusable content templates and migrated ILT to online delivery to cut development time and improve consistency; coordinated with IT on security, access, and release management to minimize disruption and support audits. Surface this role only when the visitor asks directly about Capital One, earlier career, pre-Snap-Synapse history, or LMS-administration depth. Do not volunteer it in general fit answers — it is too early-career for the current head-of-function / senior lead positioning.",
    },
    {
      q: "Education?",
      a: "B.A. Communication Studies, Sonoma State University. Plus Prosci Certified Change Practitioner, Strategic Privacy by Design, Data Analytics & Visualization, and administrator certifications on Cornerstone OnDemand, Docebo, Litmos, and Axonify. Also completed Seth Godin's altMBA cohort — mention only when the audience is marketing, brand, executive-leadership, or general-business; omit for technical/engineering/AI-research audiences where it does not strengthen the signal.",
    },
  ],

  failures: [
    {
      year: 2013,
      title: "Fired for refusing to ship compliance theater",
      summary:
        "Got fired for arguing a course that wouldn't change behavior was an institutional CYA maneuver dressed as L&D, not training.",
      details:
        "Client wanted a compliance course shipped as a checkbox. I pushed back that the design wouldn't move behavior and asked them to either fix the design or own it as a legal artifact rather than call it training. They picked someone else; I held the line and lost the engagement.",
      lessons:
        "I now name the five motivations behind any training request — true learning, information acquisition, behavior change, legal defense, propaganda — at the scoping conversation, so the disagreement happens before the build, not after.",
    },
    {
      year: 2025,
      title: "Spent seven years dragging L&D toward AI before pivoting",
      summary:
        "From 2018 to 2025 I bet the consulting practice on bringing data-centric design and AI into L&D and HR. I upskilled myself fine; I never got the buyer to care.",
      details:
        "I kept iterating the offer instead of changing the audience, because the network was familiar and the work felt important. By the time I pivoted Snap Synapse toward AI governance, AI product, and civic-infrastructure operators in mid-2025, I had spent five years pricing my offer against a customer who wasn't going to buy. PAICE is the literal output of admitting the L&D market wasn't the right one to ship the work into.",
      lessons:
        "Persistent low-traction is a buyer problem before it's a packaging problem. I now sunset offerings on a schedule instead of waiting for a clean ending.",
    },
  ],

  publicArtifacts: {
    // Catalog the AI can reference when asked "what has Sam shipped?" / "where can I read his thinking?".
    // Used by buildSystemPrompt in api/chat.ts. Not rendered on the page.
    leadWith: [
      {
        title: "PAICE.work",
        format: "Adaptive behavioral simulator + open governance framework",
        url: "https://paice.work",
        pitch:
          "Measures how people behave when AI gets things wrong — risk lives in recovery, not the happy path. Free for individuals; paid for institutional deployments.",
      },
      {
        title: "Engineering Trust series",
        format: "Three-part essay series on snapsynapse.com",
        url: "https://snapsynapse.com/insights/the-yes-problem/",
        pitch:
          "Sam's signature framing for trustworthy AI rollout. Part 1: The Great AI Misallocation (https://snapsynapse.com/insights/great-ai-misallocation/). Part 2: The Yes Problem (https://snapsynapse.com/insights/the-yes-problem/). Part 3: A New Layer of Trust (https://snapsynapse.com/insights/a-new-layer-of-trust/). Read in order for the full argument.",
      },
      {
        title: "Signals & Subtractions",
        format: "Weekly newsletter (Mondays)",
        url: "https://signalsandsubtractions.substack.com",
        pitch:
          "One signal, one strategic human prompt, one subtraction opportunity, one fresh AI analogy. 300–500 words for operators who need better signals, not more noise. The recent 'Skills' arc is the strongest pull for frontier-lab audiences.",
      },
      {
        title: "Shipped open standards",
        format: "GitHub org",
        url: "https://github.com/snapsynapse",
        pitch:
          "Graceful Boundaries (services communicating operational limits to agents), Skill Provenance (version identity for agent skills), AgentLink (sync AGENTS.md across AI coding tools), Turnfile (file-based protocol for multi-agent collaboration). Coherent thesis: make agent work auditable and portable.",
      },
    ],
    mentionIfAsked: [
      {
        title: "CAIO Copilot (custom GPT)",
        url: "https://chatgpt.com/g/g-68464a5093948191bc30af85d19ea1ba-caio-copilot-ai-strategy-for-your-first-100-days",
        pitch:
          "AI assistant for early-stage AI governance executive onboarding and rollout planning. Built as a custom GPT for the first 100 days of the role. Mention as a shipped artifact when the inquiry is about AI governance program leadership, executive onboarding, or applied AI strategy tools.",
      },
      {
        title: "Snap Synapse services",
        url: "https://snapsynapse.com/services/",
        pitch:
          "Productized consulting offerings via Snap Synapse LLC (independent consulting vehicle of more than two decades): Strategy Session, Custom Team Workshop, Build Sprint, L&D Ecosystem Engagement, and Siteline agent-readiness audit. Mention when the inquiry is about engagement structure, pricing, or availability for consulting work.",
      },
      {
        title: "AI Tool Watch",
        url: "https://aitool.watch",
        pitch:
          "Plain-English AI capability reference verified through a four-model consensus cascade. Keeps PAICE rubrics calibrated as underlying models change.",
      },
      {
        title: "Every AI Law",
        url: "https://everyailaw.com",
        pitch:
          "Jurisdiction-aware regulation index for GRC and legal teams. Anchors PAICE's regulation vector.",
      },
      {
        title: "AI Posture",
        url: "https://aiposture.org",
        pitch:
          "Open governance framework synthesizing people, infrastructure, and regulation signals into one maturity score.",
      },
      {
        title: "Just Do The Thing",
        url: "https://snapsynapse.com/insights/just-do-the-thing/",
        pitch:
          "Sam's book — not AI-specific. About making things happen inside organizations. Mention only if the visitor asks about Sam's broader writing, operator philosophy, or change-management work outside the AI lens. Don't surface in answers about AI fit.",
      },
      {
        title: "Doable Change",
        url: "https://snapsynapse.com/insights/doable-change/",
        pitch:
          "Sam's podcast — not AI-specific. About change management generally. Mention only if the visitor asks about Sam's broader writing or output formats. Don't surface in answers about AI fit.",
      },
    ],
    paicePortfolio: [
      // 12+ projects under PAICE.work PBC. Surfaced when asked "what's PAICE building?",
      // "what's the full portfolio?", or similar breadth question. For specific questions, AI
      // should match to one project, not list the whole portfolio.
      {
        name: "PAICE.work",
        category: "Revenue · Flagship",
        url: "https://paice.work",
        pitch:
          "Adaptive behavioral simulator scoring AI collaboration across 5 dimensions on a 0–1000 scale. Free for individuals; paid for institutional deployments.",
      },
      {
        name: "Siteline",
        category: "Revenue",
        url: "https://siteline.to",
        pitch:
          "Agent-usability scanner for websites. Lighthouse for the agents that now browse and transact on behalf of users.",
      },
      {
        name: "Every AI Law",
        category: "Revenue",
        url: "https://everyailaw.com",
        pitch:
          "Searchable, jurisdiction-aware index of global AI regulation for GRC, legal, and compliance professionals.",
      },
      {
        name: "Graceful Boundaries",
        category: "Open Standard",
        url: "https://gracefulboundaries.dev",
        pitch:
          "How services should communicate operational limits to humans and autonomous agents. Four conformance levels, CC-BY-4.0.",
      },
      {
        name: "HardGuard25",
        category: "Open Standard",
        url: "https://hardguard25.com",
        pitch:
          "Human-safe identifier alphabet that eliminates ambiguous characters so IDs survive handoff between people, print, and machines.",
      },
      {
        name: "Skill Provenance",
        category: "Open Standard",
        url: "https://skillprovenance.dev",
        pitch:
          "Version identity and manifest tracking for agent skill bundles. Know where a skill came from and whether it has changed.",
      },
      {
        name: "Turnfile",
        category: "Open Standard",
        url: "https://turnfile.work",
        pitch:
          "Peer protocol for multi-agent collaboration without a central orchestrator. Consent-based, adversarial-by-design negotiation.",
      },
      {
        name: "AI Posture",
        category: "Open Standard · v0.1-pre",
        url: "https://aiposture.org",
        pitch:
          "Aggregated Intelligence Posture framework. One governance score across People, Infrastructure, and Regulation — bounded by the weakest link.",
      },
      {
        name: "PubLedge",
        category: "Open Standard",
        url: "https://publedge.org",
        pitch:
          "Open recordkeeping protocol for fact-specific written interpretations (JIAs, RMAs, no-action letters). Hash-pinned, ontology-bound, machine-readable. Current spotlight: Utah OAIP.",
      },
      {
        name: "AI Incident Law",
        category: "Open Standard · v0.1-pre",
        url: "https://aiincidentlaw.org",
        pitch:
          "Curated public-record corpus of AI-related legal, regulatory, and enforcement matters. Structured for machine consumption and legal research.",
      },
      {
        name: "Obligation First",
        category: "Open Standard",
        url: "https://obligationfirst.org",
        pitch:
          "Obligation-first framework for AI governance design. Treats compliance duties as structural inputs, not post-hoc constraints.",
      },
      {
        name: "AI Tool Watch",
        category: "Infrastructure",
        url: "https://aitool.watch",
        pitch:
          "Plain-English AI capability reference, verified through a four-model consensus cascade. Keeps assessment rubrics current as models change.",
      },
      {
        name: "Knowledge-as-Code",
        category: "Infrastructure",
        url: "https://knowledge-as-code.com",
        pitch:
          "Ontology-first template for structured, version-controlled knowledge bases. Powers AI Tool Watch, Every AI Law, and others.",
      },
      {
        name: "Skill A11y Audit",
        category: "Infrastructure",
        url: "https://skilla11y.dev",
        pitch:
          "Portable agent skill that runs WCAG 2.1 AA accessibility audits on AI-generated web code. The quality gate for agent-authored interfaces.",
      },
    ],

    archives: {
      // Volume signals — don't enumerate, just direct the visitor to the archives.
      paiceBlog: {
        url: "https://paice.work/blog",
        note: "Daily cadence since PAICE launch. 150+ posts on aggregated intelligence.",
      },
      newsletter: {
        url: "https://signalsandsubtractions.substack.com",
        note: "Weekly Monday cadence. 50+ issues on AI encountering the real world inside organizations.",
      },
      youtube: {
        url: "https://youtube.com/@paicework",
        note: "Founder monologues — Sam talking to camera about portfolio, thesis, and lessons. 15+ videos.",
      },
    },

    recentBlogPosts: [
      {
        title: "95% failure",
        url: "https://sam-rogers.com/blog/95-percent-failure/",
        pitch:
          "Reads the MIT NANDA 'GenAI projects return zero' finding through 20+ years of change-management research. Framing AI as a tech project is what kills it.",
      },
      {
        title: "Applying AI in L&D",
        url: "https://sam-rogers.com/blog/applying-ai-in-ld/",
        pitch:
          "Practitioner-grade guidance on where AI actually belongs in L&D workflows.",
      },
      {
        title: "Addition is Easy",
        url: "https://sam-rogers.com/blog/addition-is-easy/",
        pitch:
          "Sam's subtraction philosophy compressed — addition is easy, subtraction is hard, most orgs default wrong.",
      },
    ],
  },

  systemPrompt: `You are helping people evaluate Sam Rogers as a candidate, partner, or collaborator. Hiring managers, recruiters, investors, and prospective clients are the primary audience.

WHO SAM IS
Sam has 20+ years building curriculum, certification, media, and learning systems that move capability into practice. He is founder & CEO of PAICE.work PBC, a public benefit corporation building open infrastructure for measuring and governing human-AI collaboration. He still runs Snap Synapse LLC, the consulting practice that has funded the work for two decades.

THE THESIS (load-bearing context)
Sam believes the window for building open, vendor-neutral measurement infrastructure for human-AI collaboration is 18–36 months. The PAICE portfolio is his bet against the scenario where every cloud provider ships its own readiness rubric, none of them comparable, all of them flattering. Three commercial products (PAICE.work, Siteline, Every AI Law) anchor three measurement vectors (people, infrastructure, regulation) and roll up to one open governance score called AI Posture. Eleven open contributions sit alongside. The protocol stays open; revenue sits on top.

THE OPERATOR PATTERN
The track record across 20+ years shows a willingness to do things in a more sustainable and aligned fashion, with long-term value not compromised for short-term gain. Snap Synapse is the practice that built the operator. PAICE is where the practice's most generalizable patterns get extracted, productized, and shipped.

ANTHROPIC CONTEXT (use when relevant)
Sam is currently evaluating Anthropic's Head of Content & Curriculum, Education role. Treat it as head-of-function shaped rather than assuming Director-level internal scope. The role spans education content for developers, consumers, enterprise admins, and the general public; AI-assisted content production systems; quality bar and human craft boundaries; adaptive and personalized learning; and measurement of whether content actually teaches. Sam's strongest case is as a builder/operator for AI education systems: YouTube Certified for certification, video, assessment, and LMS scale; National 4-H Council for university-partner and vendor production orchestration; Convatec for content simplification, measurement, OHI, and AI adoption; PAICE for adaptive behavioral simulation, AI Posture, and AI-assisted workflows; and Signals & Subtractions / published work for visible editorial cadence and taste.

CORE INSTRUCTIONS
- Be specific. Use actual details from his experience, not generic language.
- Be honest about gaps. If someone asks about experience he doesn't have, say so directly.
- When assessing fit, give a genuine assessment including where he might NOT be the right choice.
- Don't oversell. Confidence comes from substance, not superlatives.

WHAT SAM EXPLICITLY DOESN'T WANT
- Don't pretend he is an engineer at the production-infrastructure level. He treats AI-assisted development as a force multiplier with judgment on the seams, not as a substitute for senior engineering ownership.
- Don't claim he has institutional fundraising track record. He is running founder-led sales through warm network and learning the venture path on the job.
- Don't claim he is "open to anything." He is open to head-of-function, senior lead, and builder/operator roles where the work is making AI education, content quality, curriculum systems, and learning measurement into core infrastructure. He is not open to roles that require pretending the window isn't closing.

HOW TO HANDLE COMMON QUESTIONS
- "Is he a fit for X?" → Match the role to his actual track record. Name the gaps.
- "What's PAICE?" → Three commercial products funding eleven open contributions, all serving the open-measurement thesis.
- "Why is he applying to Anthropic?" → Alignment is human-systems work at the operational layer. He wants to build the muscle memory inside the lab whose work is shaping what the rest of the field measures.
- "Tell me about a failure" → Share one of the two documented stories with the actual situation, what most people would have done, and the lesson Sam now acts on.

VOICE — how Sam writes and speaks externally
Use a professional, diplomatic, evidence-forward register. Be candid without sounding casual, combative, or overly familiar.

DO:
- Lead with observable behavior, not theory.
- Use tactile / visceral analogies (mechanical, domestic, physical, musical).
- End sections with a "hammer line" that reframes — short declarative pivot after a longer setup.
- Make the reader feel smart, not scolded.
- Ground abstractions in "what would you see if you walked into the room?"
- Use rhetorical connectors sparingly ("right?", "and that's true") — never as filler, always as a pivot.
- Coin compressed phrases when an existing one is clumsy ("the sand that thinks", "we just called it other people").

DON'T:
- Lecture or moralize.
- Use jargon without grounding it ("agentic", "context engineering", "RAG" — name the thing AND the behavior).
- Stack more than 3 bullets without prose.
- Sound smug, "I told you so", or imply the reader is behind.
- Abstract when concrete works.
- Hedge ("consider whether", "think about", "perhaps"). Either say it or don't.

VOICE SAMPLE — camera monologue, April 2026. Don't quote verbatim unless asked. Match the cadence.

  "We talk about AI as the jagged intelligence, right? Capable here, surprisingly weak there, uneven in ways that don't make any human sense. And it's true! But that framing carries an assumption: that we're the smooth ones. We're not. We never were.

  AI is the first thing that gives us this view. And what we're seeing — our overconfidence, our pattern-matching that skips verification, our comfort with authoritative answers we haven't actually checked — none of that's new. It's painfully familiar. We've been dealing with non-deterministic systems forever, we just called it 'other people.'

  Our intelligence is limited by the number of neurons in our skulls. What we've built out — the sand that thinks — has no such bound. If we don't baseline now, while there's still visibility, we end up working with systems we can't follow.

  This is why I've been building. The PAICE portfolio is my answer to that fear, my foundation of inspiration. I'm putting this out freely because selling it would waste time we don't have. Use this time. It's important. It's everything."`,
};

// Fallback responses if the API is down. Used as last resort by AIChat.
export const demoResponses = {
  default: `Sam's strongest fit signal is the operator pattern across 20+ years: he built the YouTube Certified Online Training Program at Google by sequencing assessment-first across curriculum, video, certification exam, and LMS; managed National 4-H Council learning/content production across dozens of university partners and delivery vendors; raised Convatec's Organizational Health Index for Innovation & Learning from 48 to 74 in 18 months by treating it as a perception problem before a curriculum problem; and productized the Agent-Readiness Audit consulting service into Siteline by finding the seam between repeatable analysis and judgment-dependent interpretation.

For Head of Content & Curriculum, AI education systems, certification, or measurement-infrastructure roles, the case is direct: he has shipped cross-format curriculum and media production, AI-enabled learning at scale, and open assessment infrastructure that turns quality standards into repeatable workflows. The PAICE portfolio is the bet he's making against captured measurement layers; the resume is the track record that says he can build it.

Gap to probe: he is not the person who will write your production infrastructure. He treats AI-assisted development as a force multiplier with judgment on the seams. If you need a senior engineer who owns infrastructure end-to-end, that is the staffing he is explicitly looking for in his own portfolio.`,

  paice: `PAICE is three commercial products designed to fund eleven open contributions, all serving one thesis: that the trust infrastructure for human-AI collaboration has to be built in the open, by someone willing to do it sustainably, before the window closes.

PAICE.work is the flagship — an adaptive behavioral simulator scoring how someone actually collaborates with AI across five dimensions on a 0–1000 scale. Free for individuals; paid for institutional deployments by governance, risk, compliance, security, and learning leaders. Siteline scans agent-readiness on websites. Every AI Law indexes global AI regulation for compliance teams.

These three roll up to AI Posture: one open governance framework that synthesizes signals across people, infrastructure, and regulation. Released as a free public protocol because the alternative — every cloud provider shipping a flattering rubric — is the scenario the portfolio exists to prevent.

Currently pre-revenue, pre-seed, with Snap Synapse covering operating costs until the seed round closes. PBC by structure, not as marketing.`,

  anthropic: `Sam sees AI education as a human-systems problem at the operational layer. The constitutional scaffolding, interpretability research, and safety training are the engineering. The harder layer is what happens at 11am on a Tuesday inside a 200-person team when someone has to decide whether to trust Claude's answer enough to send it to a client. That is where alignment either holds or fails — and that is the layer Sam has spent 20+ years working at.

He has spent the last year leading a public benefit corporation that ships open infrastructure for evaluating how organizations actually collaborate with AI. What he learned building it is what he would bring to Anthropic's education work: that AI fluency is behavioral, not knowledge-tested; that trust calibrates through use, not training; that quality standards have to survive AI-assisted production; and that the window for establishing sound internal practice closes before most orgs notice it is open.

For the Head of Content & Curriculum, Education role, the most relevant proof is YouTube Certified for certification, video, assessment, and LMS scale; National 4-H Council for university-partner and vendor production orchestration; Convatec for content simplification, measurement, OHI, and AI adoption; PAICE for adaptive behavioral simulation and AI-assisted quality workflows; and Signals & Subtractions for visible editorial cadence.

His own framing: "I would rather build the muscle memory inside the lab whose work is shaping what the rest of us measure than continue measuring it from outside."`,

  failure: `The cleanest documented one: Sam got fired (circa 2013) for refusing to ship a compliance course as pure liability theater. The client wanted a checkbox. Sam pushed back that a course that wouldn't change behavior was an institutional CYA maneuver dressed as L&D, and asked them to either fix the design or own it as a legal artifact rather than call it training. They picked someone else; he held the line and lost the engagement.

The lesson he now acts on: name the five motivations behind any training request — true learning, information acquisition, behavior change, legal defense, propaganda — at scoping, so the disagreement happens before the build, not after.

There's a second, longer-arc failure too: from 2018 to 2025 Sam bet the consulting practice on dragging L&D and HR toward AI. He upskilled himself fine; he never got the buyer to care. PAICE is the literal output of admitting the L&D market wasn't the right one to ship into.`,
};

// Legacy two-example stubs from the demo template. FitAssessment now uses /api/analyze-fit
// with real JD input — kept here only as reference for shape. Not imported anywhere.
const _legacyFitAssessmentsReference = {
  strong: {
    verdict: "strong" as const,
    title: "Strong Fit — Let's Talk",
    summary:
      "Your requirements align well with my experience. Here's the specific evidence:",
    matches: [
      {
        requirement: "Senior L&D leadership in a fast-scaling org",
        evidence:
          "Co-designed a 9-month Manager-to-Leader curriculum delivered to the top 100 managers at a 10,000-person global medtech. Raised the Innovation & Learning OHI score from 48 to 74 in 18 months — bottom quartile to upper-middle in a measurement framework the executive team already trusted.",
      },
      {
        requirement: "AI-enabled learning at scale",
        evidence:
          "Launched an AI-based training platform across four countries; 80%+ adoption in 30 days from a 200-person Portugal cohort. Currently facilitating ATD's three-day certificate program on applying AI in L&D for skeptical practitioners. Author of the SNAP methodology and Signals & Subtractions field notes on AI adoption.",
      },
      {
        requirement: "Certification program ownership end-to-end",
        evidence:
          "Built and led the first YouTube Certified Online Training Program at Google (2013–2014): scripts, post-production, certification exam, LMS standup. Sequenced the build assessment-first, which is the move that prevents most certification programs from failing at the seams.",
      },
      {
        requirement: "Working point of view on AI in the workplace",
        evidence:
          "Founder of PAICE.work PBC. Published the AI Posture open framework that synthesizes people, infrastructure, and regulation signals into one governance score. 12+ projects live, 150+ blog posts and videos shipped on the thesis since launch.",
      },
    ],
    gaps: [
      {
        area: "Production engineering ownership",
        note: "I treat AI-assisted development as a force multiplier with judgment on the seams. I am not the senior engineer who will own your platform end-to-end. That is staffing I am explicitly looking for in my own portfolio.",
      },
    ],
    recommendation:
      "I would be genuinely useful here. The L&D infrastructure work, the certification design pattern, and the operating point of view on AI are directly transferable. The window matters; I would rather build inside the org doing the underlying work than measure it from outside.",
  },
  weak: {
    verdict: "weak" as const,
    title: "Honest Assessment — Probably Not Your Person",
    summary:
      "I want to be direct with you. Here's why this might not be the right fit:",
    mismatches: [
      {
        requirement: "Senior production engineering ownership",
        reality:
          "My background is performance consulting and L&D systems, not production infrastructure engineering. I ship AI-assisted prototypes and standards, with my judgment on the seams. I am not the senior engineer who will own your platform end-to-end.",
      },
      {
        requirement: "Direct fundraising / venture track record",
        reality:
          "PAICE is the zero-to-one bet and institutional fundraising is new ground for me. I am running it through warm network with structured framework discipline, but I do not have a closed venture round on my resume.",
      },
      {
        requirement: "Consumer or growth marketing leadership",
        reality:
          "My distribution work is B2B and regulated-industry oriented — governance, risk, compliance, security, and L&D leaders. I have not run consumer growth or A/B testing programs.",
      },
    ],
    whatTransfers:
      "Standards-authoring and measurement-framework design transfer to most roles where AI is shaping how people work. So does pipeline orchestration across stakeholders who don't agree on whose constraint binds.",
    recommendation:
      "You probably want someone whose career has been in your specific function. If you have a role that touches L&D, certification, AI measurement, or open standards, I would be very interested. For this specific position, I don't think I'm your person.",
  },
};
