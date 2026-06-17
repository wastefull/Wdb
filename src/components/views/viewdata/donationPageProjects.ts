import { FlaskConical, Megaphone, Server } from "lucide-react";

export const projects = [
  {
    id: "visibility",
    title: "Visibility & Integrity Drive",
    description:
      "Help us advertise! Our research and educational resources are only as useful as the public's awareness of them.",
    icon: Megaphone,
    iconClass: "arcade-bg-amber arcade-btn-amber",
    link: "https://www.zeffy.com/donation-form/visibility-and-integrity-drive",
  },
  {
    id: "research",
    title: "Research Fund",
    description:
      "Contribute directly to our compost and recycling research. The biggest bill here is testing consumer products for things like microplastics, which has do be done at specialty labs.",
    icon: FlaskConical,
    iconClass: "arcade-bg-green arcade-btn-green",
    link: "https://www.zeffy.com/donation-form/research-fund",
  },
  {
    id: "digital",
    title: "Digital Foundations Fund",
    description:
      "Developing tools like the WasteDB and educational materials for the public is a critical part of our mission, and while our staff are volunteers, hosting and tooling are not free.",
    icon: Server,
    iconClass: "arcade-bg-cyan arcade-btn-cyan",
    link: "https://www.zeffy.com/donation-form/donate-to-make-a-difference-11641",
  },
];
