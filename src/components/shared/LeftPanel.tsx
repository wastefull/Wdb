import { ExternalLink, FileText, Mail, Code, Banana } from "lucide-react";
import { LogoLink } from "./LogoLink";

const resources = [
  {
    label: "Wastefull, Inc.",
    Icon: Banana,
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
    <div className="p-4 flex flex-col items-center overflow-hidden ">
      <h3 className="text-[13px] uppercase tracking-[0.08em] text-black/60 dark:text-white/60 mb-4 flex items-center gap-2">
        Resources
      </h3>
      <aside className="px-1 py-3 bg-[#f5f4f1] dark:bg-[#2a2825] rounded-lg shrink-0">
        <ul className="space-y-1">
          {resources.map((r) => {
            const Icon = r.Icon;
            return (
              <li key={r.label}>
                <a
                  href={isUrl(r.url) ? r.url : "#"}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-white cursor-pointer ${r.hidden ? "hidden" : ""}`}
                >
                  <Icon className="w-3.5 h-3.5 text-[#211f1c]/60 dark:text-white dark:hover:text-black/60" />
                  {r.label}
                </a>
              </li>
            );
          })}
        </ul>

        <div
          className={`arcade-card mt-8 p-3 rounded-lg border-[1.5px] border-[#211f1c] bg-waste-reuse text-center text-sm text-gray-800 dark:text-white/80 `}
        >
          <p className="text-sm uppercase tracking-[0.04em] leading-5">
            Can't find a material?
            <br />
            <br />
            <button
              className={`retro-card-hover liquid text-sm inline-flex items-center gap-2 whitespace-nowrap px-3 py-2 m-auto bg-white cursor-pointer`}
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
