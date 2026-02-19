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
    created: "2026-02-09",
    author: "Jake",
    status: "deployed",
    nrr: "140%",
    sector: "Data Intelligence Platform / Lakehouse / AI/ML",
    description:
      "Full Enhanced diagnostic with maturity assessment, waterfall, value-at-stake, and 5 highest-impact actions.",
  },
  {
    client: "UiPath",
    product: "enhanced",
    url: "https://dist-pi-ruddy-76.vercel.app",
    created: "2026-02-11",
    author: "Jake",
    status: "deployed",
    nrr: "107%",
    sector: "RPA / Intelligent Automation",
    description:
      "Enhanced diagnostic showing 38pp NRR compression (145% → 107%), Power Automate displacement, and path to 121%.",
  },
  {
    client: "UiPath",
    product: "agentic",
    url: "https://dashboard-seven-gray.vercel.app",
    created: "2026-02-11",
    author: "Jake",
    status: "deployed",
    nrr: "107%",
    sector: "RPA / Intelligent Automation",
    description:
      "CX Teardown with scraped customer feedback from Reddit, Trustpilot, and G2. 6,847 mentions analyzed.",
  },
  {
    client: "Okta",
    product: "basic",
    url: "https://nrr-cx-okta.vercel.app",
    created: "2026-02-09",
    author: "Jake",
    status: "deployed",
    nrr: "106%",
    sector: "Identity & Access Management",
    description:
      "Basic diagnostic with NRR trend (120% → 106%), Microsoft Entra bundling risk, Auth0 CX crisis analysis.",
  },
  {
    client: "Mimecast",
    product: "basic",
    url: "https://nrr-cx-mimecast.vercel.app",
    created: "2026-02-08",
    author: "Jake",
    status: "deployed",
    nrr: "",
    sector: "Email Security / Cybersecurity",
    description:
      "Basic diagnostic with peer benchmark, competitive context, and synthesis.",
  },
  {
    client: "Datadog",
    product: "basic",
    url: "https://nrr-cx-datadog.vercel.app",
    created: "2026-02-08",
    author: "Jake",
    status: "deployed",
    nrr: "",
    sector: "Observability & DevOps",
    description:
      "Basic diagnostic with NRR benchmark against observability peers.",
  },
  {
    client: "Xero",
    product: "basic",
    url: "https://nrr-cx-xero.vercel.app",
    created: "2026-02-09",
    author: "Jake",
    status: "deployed",
    nrr: "",
    sector: "SMB Accounting",
    description:
      "Basic diagnostic with Melio acquisition analysis and payments moat.",
  },
  {
    client: "PTC",
    product: "basic",
    url: "https://nrr-cx-ptc.vercel.app",
    created: "2026-02-09",
    author: "Jake",
    status: "deployed",
    nrr: "",
    sector: "Engineering Software (CAD/PLM)",
    description:
      "Basic diagnostic with renewal-focused analysis and methodology footnotes. Peers: Autodesk, Ansys.",
  },
  {
    client: "Overview",
    product: "agentic",
    url: "https://agentic-customer-ops.vercel.app",
    created: "2026-02-10",
    author: "Jake",
    status: "deployed",
    nrr: "",
    sector: "Enterprise Software (Cross-sector)",
    description:
      "Agentic Customer Operations Transformation research overview — CS, PS, Support impact analysis.",
  },
];
