import { describe, expect, it } from "vitest";
import { scanJD, type Category } from "./jd-review";

interface CorpusCase {
  name: string;
  text: string;
  expectedCategories: Category[];
  forbiddenCategories?: Category[];
}

const cleanJobDescriptions: CorpusCase[] = [
  {
    name: "public L&D systems role with common tools",
    text: "Lead learning operations for a distributed team using Workday, Cornerstone, and Salesforce. Partner with managers to improve onboarding, certification, and enablement outcomes. Published salary range is $145,000-$175,000.",
    expectedCategories: [],
  },
  {
    name: "AI governance enablement with public compliance domains",
    text: "Build AI governance training and adoption materials for teams working with SOC 2, ISO 27001, GDPR, and HIPAA requirements. The role reports into the learning function and works with security and legal.",
    expectedCategories: [],
  },
  {
    name: "generic project manager title",
    text: "Hiring a Project Manager to coordinate stakeholder planning, launch readiness, and communication across product and operations teams.",
    expectedCategories: [],
  },
  {
    name: "generic program director title",
    text: "The Program Director will own portfolio rituals, roadmap communication, executive readouts, and cross-functional delivery without naming any internal initiative.",
    expectedCategories: [],
  },
  {
    name: "cloud migration with allowlisted provider",
    text: "Lead the AWS migration learning plan, including manager enablement, job aids, role-based certification, and post-launch support.",
    expectedCategories: [],
  },
  {
    name: "sales enablement role with public CRM",
    text: "Drive Salesforce enablement for account executives, sales managers, and customer success teams. Build onboarding paths, playbooks, and measurable skill checks.",
    expectedCategories: [],
  },
  {
    name: "published compensation and benefits",
    text: "Compensation is $120,000-$150,000 base salary plus published benefits. Remote, US-based, with up to 20 percent travel for quarterly team meetings.",
    expectedCategories: [],
  },
  {
    name: "public vendor implementation",
    text: "Support a ServiceNow implementation by creating training assets, stakeholder communications, and adoption metrics for enterprise users.",
    expectedCategories: [],
  },
  {
    name: "generic reporting line to function",
    text: "This role reports to Engineering Operations and partners with People, Legal, and Product to improve onboarding quality.",
    expectedCategories: [],
  },
  {
    name: "public SAP and Oracle ecosystem role",
    text: "Own learning paths for SAP and Oracle administrators. Build certification readiness materials and coordinate feedback from business process owners.",
    expectedCategories: [],
  },
  {
    name: "plain AI adoption role",
    text: "Design practical AI adoption workshops for managers. Focus on workflow judgment, review habits, risk escalation, and measurable behavior change.",
    expectedCategories: [],
  },
  {
    name: "standard developer education role",
    text: "Create developer education programs for public APIs, SDKs, and partner onboarding. Work with documentation, support, and community teams.",
    expectedCategories: [],
  },
  {
    name: "head of content and curriculum role",
    text: "Head of Content & Curriculum role for an AI education team. Build AI-assisted content workflows, preserve editorial and learning-quality standards, design adaptive learning experiences, and measure whether content teaches across docs, video, workshops, and interactive product surfaces.",
    expectedCategories: [],
  },
  {
    name: "general operations launch language",
    text: "Prepare launch communications, office hours, and enablement materials for a publicly announced product release.",
    expectedCategories: [],
  },
  {
    name: "published industry and business context",
    text: "Healthcare technology company seeking a senior learning leader to improve onboarding, compliance training, and manager capability across a 1,500-person organization.",
    expectedCategories: [],
  },
  {
    name: "public Kubernetes platform enablement",
    text: "Build Kubernetes platform enablement for developers, including workshops, reference guides, and role-based learning paths.",
    expectedCategories: [],
  },
];

const sensitiveJobDescriptions: CorpusCase[] = [
  {
    name: "confidential replacement search",
    text: "This is a confidential search for a replacement leader. Do not post externally because the incumbent has not been notified.",
    expectedCategories: ["confidential-search"],
  },
  {
    name: "high-confidence requisition code",
    text: "Use REQ-48291 for recruiter tracking. The selected candidate will support enterprise learning operations.",
    expectedCategories: ["internal-job-code"],
  },
  {
    name: "headcount approval code",
    text: "This role is tied to HC-2026-018 and should be routed through the internal approval workflow before offer.",
    expectedCategories: ["internal-job-code"],
  },
  {
    name: "internal compensation planning",
    text: "Internal grade 17 with comp ratio review and exception approval available for the finalist.",
    expectedCategories: ["internal-comp"],
  },
  {
    name: "unpublished compensation range",
    text: "The unpublished range is higher than the public posting, with an offer ceiling that requires executive approval.",
    expectedCategories: ["internal-comp"],
  },
  {
    name: "strategic market entry",
    text: "Hire ahead of a stealth market entry effort and support the confidential expansion plan after launch.",
    expectedCategories: ["strategic-plan"],
  },
  {
    name: "reorg and reduction in force",
    text: "The role supports a planned reorg and reduction in force, with training for managers before employee communications.",
    expectedCategories: ["strategic-plan"],
  },
  {
    name: "security incident context",
    text: "Create emergency enablement for teams responding to an active incident, recent breach, and related vulnerability disclosure.",
    expectedCategories: ["security-sensitive"],
  },
  {
    name: "clearance-sensitive facility access",
    text: "The learning lead will support classified workflows and facility access procedures for a clearance-sensitive team.",
    expectedCategories: ["security-sensitive"],
  },
  {
    name: "leading internal project name",
    text: "You will lead Project Atlas readiness across the org, including manager briefings and executive updates.",
    expectedCategories: ["internal-project"],
  },
  {
    name: "leading internal program name",
    text: "Program Phoenix requires a senior enablement lead to coordinate rollout training and adoption measurement.",
    expectedCategories: ["internal-project"],
  },
  {
    name: "unreleased initiative name",
    text: "Own enablement for the Helios Platform Initiative before the public launch window.",
    expectedCategories: ["unreleased-initiative"],
  },
  {
    name: "client rollout name",
    text: "Own the Acme Bank rollout across training, stakeholder communications, and post-go-live support.",
    expectedCategories: ["client-name"],
  },
  {
    name: "client account name",
    text: "Primary contact for the Globex account during onboarding, adoption measurement, and quarterly enablement reviews.",
    expectedCategories: ["client-name"],
  },
  {
    name: "employee named in reporting line",
    text: "This role reports to Jane Smith and supports leadership communications for a confidential search.",
    expectedCategories: ["employee-name", "confidential-search"],
  },
  {
    name: "mixed sensitive details",
    text: "Backfill for Daniel Ruiz on Project Atlas using FY26-HC-014. The work supports an unannounced market entry and an Acme Bank migration.",
    expectedCategories: [
      "confidential-search",
      "employee-name",
      "internal-project",
      "internal-job-code",
      "strategic-plan",
      "client-name",
    ],
  },
];

function categorySet(text: string): Set<Category> {
  return new Set(scanJD(text).map((flag) => flag.category));
}

describe("scanJD corpus — clean job descriptions", () => {
  it.each(cleanJobDescriptions)("$name yields no flags", ({ text }) => {
    expect(scanJD(text)).toEqual([]);
  });
});

describe("scanJD corpus — sensitive job descriptions", () => {
  it.each(sensitiveJobDescriptions)("$name yields expected categories", ({ text, expectedCategories, forbiddenCategories = [] }) => {
    const categories = categorySet(text);
    for (const category of expectedCategories) {
      expect(categories.has(category), `missing ${category}`).toBe(true);
    }
    for (const category of forbiddenCategories) {
      expect(categories.has(category), `unexpected ${category}`).toBe(false);
    }
  });
});
