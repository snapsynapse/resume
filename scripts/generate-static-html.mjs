import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { samProfile } from "../src/data/sam-profile.ts";

const siteUrl = "https://resume.sam-rogers.com";
const distDir = new URL("../dist/", import.meta.url);
const roleTargets = samProfile.rotatingTitles;
const profileExperience = samProfile.experience.map((item) => ({
  name: item.company,
  role: item.role.replace("&", "and"),
  startDate: item.period.split(/[–-]/)[0],
  endDate: item.period.includes("Present") ? undefined : item.period.split(/[–-]/)[1],
  url: item.company === "PAICE.work PBC" ? "https://paice.work/" : item.company === "Snap Synapse LLC" ? "https://snapsynapse.com/" : undefined,
  summary: item.highlights[0],
  highlights: item.highlights,
}));
const commercialPortfolio = samProfile.publicArtifacts.paicePortfolio.filter((item) => item.category.includes("Revenue"));
const standardsPortfolio = samProfile.publicArtifacts.paicePortfolio.filter((item) => !item.category.includes("Revenue"));
const portfolioItems = [
  ["PAICE Portfolio", "https://paice.foundation/", "Canonical map for Sam's public benefit corporation work."],
  ["Snap Synapse", "https://snapsynapse.com/", "Consulting, tools, frameworks, and applied artifacts from Snap Synapse."],
  ["GitHub profile", samProfile.links.github, "Additional repositories and experiments."],
  ...samProfile.publicArtifacts.paicePortfolio.map((item) => [item.name, `${item.url}/`, item.pitch]),
];

const nav = [
  ["About", "/about/"],
  ["Experience", "/experience/"],
  ["Fit assessment", "/fit-assessment/"],
  ["Portfolio", "/portfolio/"],
  ["Contact", "/contact/"],
];

const person = {
  "@type": "Person",
  "@id": `${siteUrl}/#sam-rogers`,
  name: "Sam Rogers",
  url: `${siteUrl}/`,
  email: "mailto:sam@sam-rogers.com",
  sameAs: [
    `${samProfile.links.site}`,
    `${samProfile.links.paice}`,
    "https://paice.work/",
    "https://snapsynapse.com/",
    `${samProfile.links.github}`,
    `${samProfile.links.linkedin}`,
  ],
};

const pages = [
  {
    slug: "about",
    title: "About Sam Rogers - Talent Development and AI Governance",
    description:
      "About Sam Rogers: senior IC and Lead-band roles in talent development, certification, partner enablement, AI governance, and human-AI collaboration measurement infrastructure.",
    heading: "About Sam Rogers",
    body: [
      {
        heading: "Profile",
        paragraphs: [
          "Sam Rogers has 20+ years building learning and development systems that move capability into practice.",
          "He currently builds open infrastructure for measuring and governing human-AI collaboration through PAICE.work PBC, a public benefit corporation.",
          "He also runs Snap Synapse LLC, an independent consulting practice of more than two decades behind technical enablement, certification, and learning systems work for organizations including Google/YouTube, StrongLoop, Deloitte, Robert Half / Protiviti, Sunrun, and Convatec.",
        ],
      },
      {
        heading: "Why roles now",
        paragraphs: [
          "The obvious question is why someone already running PAICE.work PBC and Snap Synapse LLC is also open to senior roles. The answer is mission alignment. Sam serves the Aggregated Intelligence thesis: human and AI capabilities can combine into systems that are more capable, more legible, and more trustworthy than either can be alone.",
          "PAICE.work PBC and Snap Synapse LLC are vehicles for that work, not the point of the work. They exist because the next phase of talent development, AI governance, and organizational capability needs practical measurement infrastructure. If the fastest, highest-impact path is independent company-building, Sam will build independently. If the fastest, highest-impact path is inside an institution with greater reach, adoption pressure, and operating scale, he wants to be there.",
          "Sam is open to roles where the work advances Aggregated Intelligence at speed and scale: learning systems, certification, enablement, behavioral measurement, or governance infrastructure that helps people and AI collaborate more safely in practice.",
        ],
      },
      {
        heading: "Role Targets",
        list: roleTargets,
      },
    ],
  },
  {
    slug: "experience",
    title: "Sam Rogers Experience - Learning Systems, Certification, AI Posture",
    description:
      "Experience evidence for Sam Rogers across PAICE.work, Snap Synapse, Convatec, Google/YouTube certification, and technical enablement systems.",
    heading: "Experience",
    body: profileExperience.map((item) => ({
      heading: `${item.name} - ${item.role}`,
      paragraphs: item.highlights,
    })),
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
          "Before analysis, a local browser-only review step can flag likely non-public business details such as internal codes, confidential searches, client names, and unreleased plans. Only the user-confirmed reviewed text is sent for fit analysis.",
          "Job descriptions are sent to Anthropic for analysis and are not intentionally stored by this app. Do not paste confidential, proprietary, regulated, or unreleased role data. For sensitive roles, email Sam directly rather than submitting material through the form.",
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
        heading: "Portfolio surfaces",
        paragraphs: [
          "The PAICE portfolio is available at https://paice.foundation/ and is the canonical map for Sam's public benefit corporation work on Aggregated Intelligence, AI Posture, Siteline, Every AI Law, and related open standards.",
          "The Snap Synapse portfolio is available at https://snapsynapse.com/ and captures tools, frameworks, and applied consulting artifacts from the long-running Snap Synapse practice.",
          "Sam's GitHub profile at https://github.com/snapsynapse includes additional repositories and experiments that may not be listed in either portfolio surface.",
        ],
      },
      {
        heading: "Commercial anchors",
        list: commercialPortfolio.map((item) => `${item.name}: ${item.pitch} ${item.url}/`),
      },
      {
        heading: "Open standards and infrastructure",
        list: standardsPortfolio.map((item) => `${item.name}: ${item.pitch} ${item.url}/`),
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

function itemList(name, items) {
  return {
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item,
    })),
  };
}

function routeStructuredData(page, canonical) {
  const graph = [
    person,
    {
      "@type": "ProfilePage",
      "@id": `${canonical}#page`,
      url: canonical,
      name: page.title,
      description: page.description,
      about: { "@id": person["@id"] },
      mainEntity: { "@id": person["@id"] },
    },
  ];

  if (page.slug === "experience") {
    graph.push(
      itemList(
        "Sam Rogers experience",
        profileExperience.map((item) => ({
          "@type": "OrganizationRole",
          roleName: item.role,
          startDate: item.startDate,
          endDate: item.endDate,
          description: item.summary,
          memberOf: {
            "@type": "Organization",
            name: item.name,
            ...(item.url ? { url: item.url } : {}),
          },
        })),
      ),
    );
  }

  if (page.slug === "portfolio") {
    graph.push(
      itemList(
        "Sam Rogers portfolio surfaces and projects",
        portfolioItems.map(([name, url, description]) => ({
          "@type": "CreativeWork",
          name,
          url,
          description,
          creator: { "@id": person["@id"] },
        })),
      ),
    );
  }

  if (page.slug === "contact") {
    graph.push({
      "@type": "ContactPoint",
      "@id": `${canonical}#contact`,
      name: "Sam Rogers contact",
      email: "sam@sam-rogers.com",
      url: "https://cal.com/paice",
      contactType: "recruiting, advisory, and collaboration inquiries",
      availableLanguage: "en",
    });
  }

  if (page.slug === "fit-assessment") {
    graph.push({
      "@type": "WebApplication",
      "@id": `${siteUrl}/#fit-assessment`,
      name: "Sam Rogers role fit assessment",
      url: `${siteUrl}/#fit-assessment`,
      applicationCategory: "RecruitingApplication",
      description:
        "Interactive tool for locally reviewing business-sensitive details, then comparing a user-confirmed job description against Sam Rogers' experience, evidence, gaps, and transferability.",
      creator: { "@id": person["@id"] },
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

function renderPage(page) {
  const canonical = `${siteUrl}/${page.slug}/`;
  const navHtml = nav
    .map(([label, href]) => `<a href="${href}">${label}</a>`)
    .join("");
  const jsonLd = routeStructuredData(page, canonical);

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
      @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,300..900;1,8..60,300..900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
      :root {
        color-scheme: light;
        --background: hsl(200 20% 96%);
        --foreground: hsl(220 14% 20%);
        --card: hsl(0 0% 100%);
        --primary: hsl(189 75% 39%);
        --primary-foreground: hsl(0 0% 100%);
        --secondary: hsl(200 15% 92%);
        --muted-foreground: hsl(220 6% 42%);
        --accent: hsl(189 75% 48%);
        --accent-foreground: hsl(220 14% 12%);
        --border: hsl(200 12% 86%);
        --success: hsl(158 64% 35%);
        --font-serif: 'Source Serif 4', 'Source Serif', Georgia, serif;
        --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body {
        margin: 0;
        color: var(--foreground);
        background: var(--background);
        font-family: var(--font-sans);
        line-height: 1.65;
        -webkit-font-smoothing: antialiased;
      }
      body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        background:
          radial-gradient(circle at 80% 8%, hsl(189 75% 48% / 0.12), transparent 28rem),
          linear-gradient(180deg, hsl(0 0% 100% / 0.65), transparent 24rem);
      }
      header, main, footer {
        position: relative;
        width: min(100%, 72rem);
        margin: 0 auto;
        padding-inline: 1.5rem;
      }
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
        padding-block: 1rem;
      }
      nav {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem 1.25rem;
        order: 2;
      }
      nav a, .brand {
        color: var(--muted-foreground);
        font-size: 0.875rem;
        text-decoration: none;
        transition: color 160ms ease;
      }
      nav a:hover, .brand:hover { color: var(--foreground); }
      .brand {
        color: var(--foreground);
        font-family: var(--font-serif);
        font-size: 1.25rem;
      }
      main { padding-block: 5rem 4rem; }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        border-radius: 999px;
        background: var(--secondary);
        color: var(--muted-foreground);
        font-size: 0.875rem;
        padding: 0.5rem 1rem;
      }
      .eyebrow::before {
        content: "";
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 999px;
        background: var(--success);
      }
      h1, h2 {
        color: var(--foreground);
        font-family: var(--font-serif);
        font-weight: 600;
        line-height: 1.08;
      }
      h1 {
        max-width: 54rem;
        font-size: clamp(3.25rem, 9vw, 7rem);
        margin: 2rem 0 1.25rem;
        letter-spacing: 0;
      }
      h2 {
        font-size: clamp(1.7rem, 4vw, 2.5rem);
        margin: 0 0 1rem;
      }
      p {
        max-width: 64rem;
        margin: 0.75rem 0 0;
        color: var(--muted-foreground);
        font-size: 1.05rem;
      }
      a { color: var(--primary); }
      section {
        margin-top: 1.25rem;
        padding: 1.5rem;
        border: 1px solid var(--border);
        border-radius: 0.75rem;
        background: hsl(0 0% 100% / 0.9);
        box-shadow: 0 18px 48px hsl(220 14% 20% / 0.06);
      }
      section:first-of-type { margin-top: 2.5rem; }
      ul {
        display: grid;
        gap: 0.75rem;
        margin: 1rem 0 0;
        padding: 0;
        list-style: none;
      }
      li {
        position: relative;
        padding-left: 1.35rem;
        color: var(--muted-foreground);
      }
      li::before {
        content: "->";
        position: absolute;
        left: 0;
        color: var(--accent);
      }
      .home {
        margin-top: 2rem;
      }
      .home a {
        display: inline-flex;
        align-items: center;
        min-height: 3rem;
        border-radius: 0.75rem;
        background: var(--primary);
        color: var(--primary-foreground);
        padding: 0.75rem 1.25rem;
        font-weight: 600;
        text-decoration: none;
        box-shadow: 0 18px 36px hsl(189 75% 39% / 0.18);
      }
      footer {
        border-top: 1px solid var(--border);
        padding-block: 2rem 3rem;
      }
      address {
        color: var(--muted-foreground);
        font-style: normal;
      }
      @media (max-width: 720px) {
        header { align-items: flex-start; flex-direction: column; }
        nav { order: 0; }
        main { padding-block-start: 3rem; }
        h1 { font-size: clamp(2.75rem, 16vw, 4.5rem); }
        section { padding: 1.25rem; }
      }
    </style>
  </head>
  <body>
    <header>
      <nav aria-label="Resume pages">${navHtml}</nav>
      <a class="brand" href="/">SR</a>
    </header>
    <main>
      <div class="eyebrow">Static profile page</div>
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
