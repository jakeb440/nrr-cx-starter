# Feedback Directory

This directory stores structured feedback from colleagues — both their own generation learnings and client reactions after sharing diagnostics.

## How feedback gets here

1. **Portal form** — the primary path. Colleagues go to [portal-agentic-customer.vercel.app](https://portal-agentic-customer.vercel.app), scroll to "Submit Feedback," and fill in the form. The form creates a JSON entry in this directory via the GitHub API.
2. **Deploy script** — at the end of `scripts/deploy.sh`, the deployer is asked for optional learnings. If provided, a JSON file is created here.

## File format

One JSON file per entry. Naming convention: `YYYY-MM-DD-{client}-{submitter}.json`

```json
{
  "date": "2026-02-19",
  "client": "oracle",
  "product": "enhanced",
  "type": "generation_learning | client_reaction",
  "submitter": "jake",
  "feedback": "Free text — what happened, what the client said, what was hard.",
  "suggestion": "Optional — what should change in the templates or rules."
}
```

## How feedback is used

Jake reviews entries periodically, extracts themes, and updates:
- `LESSONS_LEARNED.md` — curated knowledge base organized by product type
- `.cursor/rules/lessons-learned.mdc` — Cursor rule that references the knowledge base during generation

This closes the feedback loop: colleague builds, shares, gets reactions, logs feedback, and future generations improve.
