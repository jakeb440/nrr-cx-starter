# Quick Start Guide — NRR CX Diagnostics

Welcome! This guide walks you through creating a polished, client-ready CX diagnostic web app — even if you've never written code or used Cursor before. You'll describe what you want in plain English, Cursor's AI builds it, and you deploy it to a shareable URL.

---

## What You Can Create

You have three products to choose from. Click the links to see live examples of each one.

### NRR CX Basic (~2-4 hours)

A focused diagnostic that benchmarks your client's Net Revenue Retention against 5-7 peers, maps the customer journey with strengths and pain points, and synthesizes the top 3 strengths and top 3 risks to NRR. Great for early conversations, proposals, or Day 1 context.

**Live example:** [Okta NRR CX Basic](https://nrr-cx-okta.vercel.app/)

### NRR CX Enhanced (~1-2 days)

Everything in Basic, plus a maturity assessment across 6 CX dimensions, an NRR waterfall showing where retention and expansion gains come from, value-at-stake scenarios with enterprise value modeling, and 5 highest-impact actions with quantified NRR impact estimates. Built for deep engagements, client workshops, and transformation business cases.

**Live example:** [Databricks NRR CX Enhanced](https://nrr-cx-databricks-enhanced.vercel.app/)

### Agentic CX Teardown (~1-2 days)

An analysis of how agentic AI transforms Customer Success, Professional Services, and Support for a specific company. Covers which roles get elevated, restructured, or displaced, with a capabilities framework mapping 12 agentic capabilities across 9 operational motions. Use this when selling or scoping an agentic customer ops transformation.

**Live example:** [Agentic Customer Ops Overview](https://n-eight-zeta.vercel.app/)

---

## What You Need

Before you start, download and install these four things. All are free.

| Tool | What It Does | Download Link |
|---|---|---|
| **Node.js** (version 18 or newer) | Runs the web app on your machine so you can preview it | [nodejs.org](https://nodejs.org/) — choose the LTS version |
| **Python** (version 3.11 or newer) | Only needed for the Enhanced product's data analysis pipeline | [python.org/downloads](https://www.python.org/downloads/) |
| **Cursor** | The AI-powered code editor — you chat with it and it builds the app | [cursor.com](https://www.cursor.com/) |
| **Vercel** | Hosts your finished diagnostic on the web so anyone with the link can view it | [vercel.com/signup](https://vercel.com/signup) — free tier works |

If you already have some of these installed, you're ahead of the game. If you're only building a Basic or Agentic diagnostic, you can skip Python.

---

## Step 1: Get the Code

First, you need a copy of this starter repo on your computer. This is called "cloning" — it downloads all the templates and configuration that Cursor uses to generate your diagnostic.

Open a terminal (on Mac, search for "Terminal" in Spotlight; on Windows, search for "Command Prompt" or "PowerShell") and run:

```bash
git clone https://github.com/jakeb440/nrr-cx-starter.git
```

This creates a folder called `nrr-cx-starter` on your computer with everything inside it.

If you don't have `git` installed, you can also download the repo as a ZIP from GitHub and unzip it.

---

## Step 2: Open in Cursor

1. Open the **Cursor** app
2. Go to **File > Open Folder** (or **File > Open** on Mac)
3. Navigate to the `nrr-cx-starter` folder you just cloned and select it
4. Cursor opens the project — you'll see files in the left sidebar and a chat panel on the right

If you don't see the chat panel, press `Cmd+L` (Mac) or `Ctrl+L` (Windows) to open it.

---

## Step 3: Tell Cursor What to Build

In the Cursor chat panel, type one of these prompts depending on which product you want. Replace the company name with your client.

### For a Basic diagnostic:

> Generate an NRR CX basic for Oracle

### For an Enhanced diagnostic:

> Generate an NRR CX enhanced for CrowdStrike

### For an Agentic teardown:

> Generate an agentic CX teardown for ServiceNow

Cursor will ask you follow-up questions about the client — things like their NRR figure, peer companies, and sector. Answer as specifically as you can. The more context you provide, the better the output.

**What happens next:** Cursor reads the generation rules in `.cursor/rules/`, gathers data from public sources, and generates a complete Next.js web app in the `output/` folder. This takes a few minutes. You'll see files being created in the sidebar.

---

## Step 4: Review and Iterate

Once Cursor finishes generating, preview the diagnostic locally:

```bash
cd output/nrr-cx-oracle-basic   # Replace with your actual folder name
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:3000`) in your browser. You'll see the full diagnostic.

Now iterate. Go back to the Cursor chat and ask for changes in plain English:

- "Make the peer set larger — add Salesforce and Microsoft"
- "The journey map pain point about onboarding should be more specific"
- "Add more detail to the NRR methodology notes for Workday"
- "The synthesis section feels too generic — tie it more closely to Oracle's recent earnings"
- "Change the color scheme to use darker blues"
- "Move the management commentary section above the journey map"

Cursor makes the changes. Refresh your browser to see them. Repeat until you're happy with the result.

---

## Step 5: Deploy

Deploying means putting your diagnostic on the internet so anyone with the link can view it. We use Vercel, which is free and takes about 30 seconds.

### First time? Set up Vercel:

1. Go to [vercel.com/signup](https://vercel.com/signup) and create a free account (sign up with GitHub for the easiest experience)
2. In your terminal, install the Vercel CLI:

```bash
npm install -g vercel
```

3. Log in:

```bash
vercel login
```

### Deploy your diagnostic:

```bash
cd output/nrr-cx-oracle-basic   # Replace with your actual folder name
npm run build                    # Builds the static site
npx vercel --prod                # Deploys to Vercel
```

Vercel will ask you a few questions the first time:
- **Set up and deploy?** Yes
- **Which scope?** Your personal account
- **Link to existing project?** No (creates a new one)
- **Project name?** Use the naming convention: `nrr-cx-oracle-basic`, `nrr-cx-crowdstrike-enhanced`, or `agentic-cx-servicenow`
- **Framework?** Next.js (auto-detected)

After a minute or so, Vercel gives you a URL like `https://nrr-cx-oracle-basic.vercel.app`. That's your live diagnostic.

---

## Step 6: Share

Copy the Vercel URL and share it however you like:

- Paste it in a Slack message to your client team
- Include it in an email or proposal
- Add it to a client presentation — the URL works on any device with a browser
- Bookmark it for future reference

The URL is live as long as your Vercel project exists. There's nothing to maintain — it's a static site with no backend or database.

After sharing, update `diagnostics.json` in the starter repo with your new diagnostic's details. This keeps the team registry current so colleagues can find what's been built.

---

## Tips for Best Results

**Be specific about the client.** Instead of "Generate a basic for a software company," say "Generate an NRR CX basic for CrowdStrike — they're a cybersecurity platform with ~$4B ARR and NRR around 120%." The more context, the better.

**Provide NRR figures if you have them.** If you have the client's NRR from a 10-K, earnings call, or the NRR Tracker, share it up front. Cursor can estimate from public data, but your figure is more accurate.

**Name specific peers.** Rather than letting Cursor pick peers, suggest 5-7 companies you think are comparable. "Peer set: SentinelOne, Palo Alto Networks, Fortinet, Zscaler, and Check Point."

**Iterate on the output.** The first generation is a strong starting point, but you'll almost always want to refine. Common iterations: adjusting the peer set, sharpening journey map observations, making the synthesis more specific, or reordering sections.

**Review quotes carefully.** Cursor pulls real quotes from public sources, but always verify that quotes are accurately attributed and in context. Never deploy a diagnostic with unverified quotes.

**Check the live examples.** Before generating, click through the live examples linked above. They show you exactly what the output looks like, which helps you give better instructions.

---

## FAQ

### How long does it take to generate a diagnostic?

The AI generation itself takes 3-10 minutes depending on the product type. A Basic diagnostic can be reviewed, refined, and deployed in 2-4 hours total. Enhanced and Agentic products take 1-2 days because they have more sections and require more careful review.

### Can I edit the diagnostic after deploying?

Yes. Make changes locally in the `output/` folder (either by hand or by asking Cursor), rebuild with `npm run build`, and redeploy with `npx vercel --prod`. The same URL updates in place.

### What if I don't have the client's NRR data?

Cursor can estimate NRR from public financial data — SEC filings, earnings calls, and analyst reports. The output includes methodology notes explaining how each figure was derived. You can also point Cursor to the NRR Tracker, a shared database of SEC-sourced NRR figures for hundreds of software companies.

### Do I need to know how to code?

No. You communicate with Cursor in plain English. It writes all the code. You review the visual output in your browser and ask for changes the same way you'd give feedback to a colleague.

### What if something goes wrong during generation?

Tell Cursor what happened. "The build failed" or "the chart isn't showing data" — Cursor can diagnose and fix most issues. If you're stuck, reach out to the team that maintains this starter repo.

### Can I generate a diagnostic for a private company?

Yes, but you'll need to provide more data up front since there are no SEC filings to pull from. Give Cursor the company's ARR, growth rate, estimated NRR, and a peer set. The journey map analysis still works using G2 reviews, Reddit, and any public information.

### Can I customize the design or layout?

Absolutely. Ask Cursor to change colors, reorder sections, add your firm's branding, adjust chart styles, or restructure the layout. The templates use Tailwind CSS, so visual changes are straightforward.

### How do I generate a second diagnostic for the same client?

Each product type is a separate project. You can have both a Basic and an Enhanced for the same client — they deploy to different URLs (`nrr-cx-oracle-basic.vercel.app` and `nrr-cx-oracle-enhanced.vercel.app`).

### Where does the data live?

All client-specific data is in a single file: `public/data/client-data.json` inside the generated project. The dashboard reads from this file. No external databases or APIs are called at runtime — the deployed site is entirely static.

### Who can see my deployed diagnostic?

Anyone with the URL. Vercel deployments are public by default on the free tier. Do not include confidential client data, internal McKinsey IP, or anything that shouldn't be on the public internet. These diagnostics are built from publicly available information.
