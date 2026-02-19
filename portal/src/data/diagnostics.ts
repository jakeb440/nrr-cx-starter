export interface Diagnostic {
  client: string;
  product: "basic" | "enhanced" | "agentic";
  url: string;
  created: string;
  author: string;
  status: string;
  nrr: string;
  sector: string;
  description: string;
}

export const diagnostics: Diagnostic[] = [
  {
    client: "Databricks",
    product: "enhanced",
    url: "https://nrr-cx-databricks-enhanced.vercel.app",
    created: "2026-02-01",
    author: "Jake",
    status: "deployed",
    nrr: "140%",
    sector: "Data Intelligence Platform / Lakehouse / AI/ML",
    description:
      "Full NRR CX Enhanced diagnostic with maturity assessment, waterfall, value-at-stake, and 5 highest-impact actions.",
  },
  {
    client: "Okta",
    product: "basic",
    url: "https://nrr-cx-okta.vercel.app",
    created: "2026-01-15",
    author: "Jake",
    status: "deployed",
    nrr: "106%",
    sector: "Identity & Access Management",
    description:
      "NRR CX Basic diagnostic with peer benchmark, journey map, and synthesis.",
  },
  {
    client: "Overview",
    product: "agentic",
    url: "https://n-eight-zeta.vercel.app",
    created: "2026-02-10",
    author: "Jake",
    status: "deployed",
    nrr: "",
    sector: "Enterprise Software (Cross-sector)",
    description:
      "Agentic Customer Operations Transformation research overview — CS, PS, Support impact analysis.",
  },
];
