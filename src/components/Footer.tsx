import type { ComponentType } from "react";
import { Calendar, Github, Globe, Linkedin, Mail } from "lucide-react";
import { samProfile } from "@/data/sam-profile";
import { track } from "@/lib/analytics";

type FooterLink = {
  label: string;
  href: string;
  Icon: ComponentType<{ className?: string }>;
  external: boolean;
  onClick: () => void;
};

const immediate = { immediate: true } as const;

const LINKS: readonly FooterLink[] = [
  {
    label: "Personal site",
    href: samProfile.links.site,
    Icon: Globe,
    external: true,
    onClick: () => track("footer_link_clicked", { link: "site" }, immediate),
  },
  {
    label: "GitHub",
    href: samProfile.links.github,
    Icon: Github,
    external: true,
    onClick: () => track("footer_link_clicked", { link: "github" }, immediate),
  },
  {
    label: "LinkedIn",
    href: samProfile.links.linkedin,
    Icon: Linkedin,
    external: true,
    onClick: () => track("footer_link_clicked", { link: "linkedin" }, immediate),
  },
  {
    label: "Email",
    href: `mailto:${samProfile.links.email}`,
    Icon: Mail,
    external: false,
    onClick: () => track("email_clicked", { source: "footer" }, immediate),
  },
  {
    label: "Book a meeting",
    href: "https://cal.com/snapsynapse/25min",
    Icon: Calendar,
    external: true,
    onClick: () => track("booking_cta_clicked", { source: "footer" }, immediate),
  },
];

const Footer = () => (
  <footer className="border-t border-border px-6 py-16">
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
        <div>
          <p className="mb-2 font-serif text-2xl text-foreground">{samProfile.name}</p>
          {/* Footer-only tagline; samProfile.title still drives the hero, JSON-LD, and crawl pages. */}
          <p className="text-muted-foreground">AI enablement that sticks</p>
        </div>

        <ul className="flex items-center gap-4">
          {LINKS.map(({ label, href, Icon, external, onClick }) => (
            <li key={label}>
              <a
                href={href}
                aria-label={label}
                onClick={onClick}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="block rounded-xl bg-secondary p-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-5 w-5" />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
        AI-queryable resume. Ask the questions you'd ask in an interview.
      </p>
    </div>
  </footer>
);

export default Footer;
