import { ExternalLink, FileText, Mail, Code, Leaf } from "lucide-react";
import { LogoLink } from "./LogoLink";

const resources = [
  {
    label: "Wastefull, Inc.",
    Icon: Leaf,
    hidden: false,
    url: "https://wastefull.org",
  },
  { label: "Press & Media", Icon: FileText, hidden: true },
  { label: "Contact", Icon: Mail, hidden: true },
  { label: "GitHub", Icon: Code, hidden: true },
  { label: "API & Data", Icon: ExternalLink, hidden: true },
  {
    label: "Int'l Recycling Codes",
    Icon: ExternalLink,
    hidden: false,
    url: "https://en.wikipedia.org/wiki/Recycling_codes",
  },
  {
    label: "Appropapedia",
    Icon: ExternalLink,
    hidden: false,
    url: "https://www.appropedia.org",
  },
  {
    label: "Sustainability Wiki",
    Icon: ExternalLink,
    hidden: false,
    url: "https://sustainabilitymethods.org/index.php/Main_Page",
  },
  {
    label: "The Sustainability Management Wiki",
    Icon: ExternalLink,
    hidden: false,
    url: "https://www.sustainability-management.wiki",
  },
  {
    label: "Sustainability Methods Wiki",
    Icon: ExternalLink,
    hidden: false,
    url: "https://sustainabilitymethods.org/index.php/Main_Page",
  },
];

function isUrl(str: string | undefined): boolean {
  if (!str) return false;
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
export function ResourcesPanel() {
  return (
    <div className="resource-panel">
      <h3>Resources</h3>
      <aside>
        <ul>
          {resources.map((r) => {
            const Icon = r.Icon;
            return (
              <li key={r.label}>
                <a
                  href={isUrl(r.url) ? r.url : "#"}
                  className={`${r.hidden ? "hidden" : ""}`}
                >
                  <Icon />
                  {r.label}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="card retro-card bg-waste-reuse!">
          <p className="text-sm uppercase tracking-[0.04em] leading-5">
            Can't find a material?
            <br />
            <br />
            <button
              onClick={() => {
                document.getElementById("main-search-input")?.focus();
              }}
            >
              Add to database →
            </button>
          </p>
        </div>
      </aside>
    </div>
  );
}
