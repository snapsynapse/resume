import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const siteUrl = "https://resume.sam-rogers.com";
const distDir = new URL("../dist/", import.meta.url);

const nav = [
  ["About", "/about/"],
  ["Experience", "/experience/"],
  ["Fit assessment", "/fit-assessment/"],
  ["Portfolio", "/portfolio/"],
  ["Contact", "/contact/"],
];

const pages = [
  {
    slug: "about",
    title: "About Sam Rogers - Talent Development and AI Governance",
    description:
      "About Sam Rogers: talent development leader, founder of PAICE.work PBC, and builder of human-AI collaboration measurement infrastructure.",
    heading: "About Sam Rogers",
    body: [
      {
        heading: "Profile",
        paragraphs: [
          "Sam Rogers is a talent development leader with 25 years building learning and development systems that move capability into practice.",
          "He is founder and CEO of PAICE.work PBC, a public benefit corporation building open infrastructure for measuring and governing human-AI collaboration.",
          "He also runs Snap Synapse LLC, the consulting practice behind technical enablement, certification, and learning systems work for organizations including Google/YouTube, StrongLoop, Deloitte, Robert Half / Protiviti, Sunrun, National 4-H Council, AAA, ADP, and Convatec.",
        ],
      },
      {
        heading: "Role Targets",
        list: [
          "Talent development and enablement leadership",
          "Certification development",
          "Developer education",
          "L&D systems architecture",
          "Learning engineering",
          "AI governance enablement",
          "Agentic trust and AI posture measurement",
        ],
      },
    ],
  },
  {
    slug: "experience",
    title: "Sam Rogers Experience - Learning Systems, Certification, AI Posture",
    description:
      "Experience evidence for Sam Rogers across PAICE.work, Snap Synapse, Convatec, Google/YouTube certification, and technical enablement systems.",
    heading: "Experience",
    body: [
      {
        heading: "PAICE.work PBC - Founder and CEO",
        paragraphs: [
          "Built PAICE.work, an adaptive behavioral simulator scoring human-AI collaboration across five dimensions on a 0-1000 scale.",
          "Designed AI Posture, an open governance framework synthesizing people, infrastructure, and regulation signals into one maturity score.",
          "Built a portfolio including Siteline, Every AI Law, AI Tool Watch, Skill Provenance, Turnfile, PubLedge, AI Incident Law, Obligation First, and Knowledge-as-Code.",
        ],
      },
      {
        heading: "Snap Synapse LLC - President and Principal Consultant",
        paragraphs: [
          "Built and led the first YouTube Certified Online Training Program at Google, replacing a classroom program that certified about 1,000 partners per year with an online program that reached about 10,000 in year one.",
          "Built technical enablement, certification, and learning systems for Google/YouTube, StrongLoop, Deloitte, Robert Half / Protiviti, Sunrun, National 4-H Council, AAA, and ADP.",
          "Operates as a translator between engineering, operations, legal, sales, support, and external communities during technical platform launches and organizational change initiatives.",
        ],
      },
      {
        heading: "Convatec - Global Learning Technology and Analytics Manager",
        paragraphs: [
          "Raised Innovation and Learning Organizational Health Index score from 48 to 74 in 18 months.",
          "Launched an AI-based training platform for global shared services across four countries, reaching more than 80 percent adoption in 30 days from a 200-person Portugal cohort.",
          "Streamlined content offerings by 90 percent while increasing utilization and improving delivery speed by 40 percent.",
        ],
      },
    ],
  },
  {
    slug: "fit-assessment",
    title: "Analyze Sam Rogers Role Fit",
    description:
      "Use the role fit assessment on Sam Rogers' resume to compare a job description against evidence, gaps, transferability, and recommendation.",
    heading: "Fit Assessment",
    body: [
      {
        heading: "What the fit assessment does",
        paragraphs: [
          "The interactive resume includes a fit assessment that accepts a job description and returns an honest role-specific analysis.",
          "The assessment is designed to identify where Sam Rogers matches the role, where the gaps are, what transfers, and whether proceeding makes sense.",
          "For confidential roles, email Sam directly rather than submitting sensitive material through the form.",
        ],
      },
      {
        heading: "Next steps",
        list: [
          "Use the interactive form on the homepage at https://resume.sam-rogers.com/#fit-assessment.",
          "Email Sam Rogers at sam@sam-rogers.com for confidential or high-context role discussions.",
          "Book a meeting at https://cal.com/paice when there is a plausible fit.",
        ],
      },
    ],
  },
  {
    slug: "portfolio",
    title: "Sam Rogers Portfolio - PAICE.work, Siteline, Every AI Law",
    description:
      "Portfolio map for Sam Rogers, including PAICE.work, Siteline, Every AI Law, AI Posture, and related open standards.",
    heading: "Portfolio",
    body: [
      {
        heading: "Commercial anchors",
        list: [
          "PAICE.work: adaptive behavioral simulator for human-AI collaboration measurement. https://paice.work/",
          "Siteline: agent-usability scanner for websites. https://siteline.to/",
          "Every AI Law: jurisdiction-aware index of global AI regulation. https://everyailaw.com/",
        ],
      },
      {
        heading: "Open standards and infrastructure",
        list: [
          "AI Posture: governance score across people, infrastructure, and regulation. https://aiposture.org/",
          "Graceful Boundaries: operational limit communication for humans and agents. https://gracefulboundaries.dev/",
          "Skill Provenance: version identity and manifest tracking for agent skill bundles. https://skillprovenance.dev/",
          "Turnfile: peer protocol for multi-agent collaboration. https://turnfile.work/",
          "Knowledge-as-Code: ontology-first template for structured knowledge bases. https://knowledge-as-code.com/",
          "PubLedge: public recordkeeping protocol for written interpretations. https://publedge.org/",
          "AI Incident Law: public-record corpus of AI-related legal, regulatory, and enforcement matters. https://aiincidentlaw.org/",
          "Obligation First: obligation-first framework for AI governance design. https://obligationfirst.org/",
        ],
      },
    ],
  },
  {
    slug: "contact",
    title: "Contact Sam Rogers",
    description:
      "Contact Sam Rogers by email, calendar booking, LinkedIn, GitHub, or portfolio sites for hiring, advisory, or collaboration inquiries.",
    heading: "Contact Sam Rogers",
    body: [
      {
        heading: "Direct handoff paths",
        paragraphs: [
          "Email Sam Rogers at sam@sam-rogers.com for hiring, advisory, or collaboration inquiries.",
          "Book a meeting with Sam Rogers at https://cal.com/paice.",
        ],
      },
      {
        heading: "Public profiles",
        list: [
          "Personal site: https://sam-rogers.com/",
          "PAICE Portfolio: https://paice.foundation/",
          "PAICE.work: https://paice.work/",
          "Snap Synapse: https://snapsynapse.com/",
          "LinkedIn: https://linkedin.com/in/samrogers",
          "GitHub: https://github.com/snapsynapse",
        ],
      },
    ],
  },
];

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function linkify(text) {
  return escapeHtml(text)
    .replaceAll("sam@sam-rogers.com", '<a href="mailto:sam@sam-rogers.com">sam@sam-rogers.com</a>')
    .replace(/https:\/\/[a-zA-Z0-9./-]+/g, (url) => `<a href="${url}">${url}</a>`);
}

function renderBody(sections) {
  return sections
    .map((section) => {
      const id = section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const paragraphs = section.paragraphs
        ? section.paragraphs.map((paragraph) => `<p>${linkify(paragraph)}</p>`).join("\n")
        : "";
      const list = section.list
        ? `<ul>${section.list.map((item) => `<li>${linkify(item)}</li>`).join("")}</ul>`
        : "";
      return `<section aria-labelledby="${id}">
        <h2 id="${id}">${escapeHtml(section.heading)}</h2>
        ${paragraphs}
        ${list}
      </section>`;
    })
    .join("\n");
}

function renderPage(page) {
  const canonical = `${siteUrl}/${page.slug}/`;
  const navHtml = nav
    .map(([label, href]) => `<a href="${href}">${label}</a>`)
    .join("");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: canonical,
    name: page.title,
    description: page.description,
    about: {
      "@type": "Person",
      "@id": `${siteUrl}/#sam-rogers`,
      name: "Sam Rogers",
      url: `${siteUrl}/`,
    },
  };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <link rel="canonical" href="${canonical}" />
    <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
    <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM briefing for Sam Rogers resume" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:type" content="profile" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${siteUrl}/imgs/og.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${siteUrl}/imgs/og.png" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    <style>
      :root { color-scheme: light; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      body { margin: 0; color: #1f2933; background: #f8f6f2; line-height: 1.6; }
      header, main, footer { max-width: 760px; margin: 0 auto; padding: 24px; }
      nav { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 32px; }
      a { color: #315f72; }
      h1, h2 { line-height: 1.15; color: #172026; }
      h1 { font-size: clamp(2.25rem, 8vw, 4rem); margin: 32px 0 16px; }
      h2 { margin-top: 40px; }
      li { margin: 8px 0; }
      .home { display: inline-block; margin-top: 24px; }
    </style>
  </head>
  <body>
    <header>
      <nav aria-label="Resume pages">${navHtml}</nav>
      <a href="/">Sam Rogers resume homepage</a>
    </header>
    <main>
      <h1>${escapeHtml(page.heading)}</h1>
      ${renderBody(page.body)}
      <p class="home"><a href="/#${page.slug === "about" ? "about" : page.slug}">Open the interactive resume section</a></p>
    </main>
    <footer>
      <address>
        Email <a href="mailto:sam@sam-rogers.com">sam@sam-rogers.com</a> or book a meeting at <a href="https://cal.com/paice">https://cal.com/paice</a>.
      </address>
    </footer>
  </body>
</html>
`;
}

for (const page of pages) {
  const pageDir = join(distDir.pathname, page.slug);
  await mkdir(pageDir, { recursive: true });
  await writeFile(join(pageDir, "index.html"), renderPage(page), "utf8");
}

console.log(`Generated ${pages.length} static crawl pages.`);
