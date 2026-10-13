<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/c55b3822-7db9-404f-bd5a-b22b9046ae91

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` using the checked-in [.env.example](.env.example) as a template to your Gemini API key
3. Run the app:
   `npm run dev`


## Engineering documentation

The implementation-ready product, architecture, audit, task, testing, and operations documentation is indexed at [`docs/00-bible/00-MASTER-INDEX.md`](docs/00-bible/00-MASTER-INDEX.md). Start with the [repository audit](docs/01-audit/REPOSITORY-AUDIT.md) and [TASK-001](docs/06-task-specifications/TASK-001-BASELINE-AUDIT.md).

The current application is documented separately from the proposed multi-tenant SaaS target. Documentation uses VERIFIED, INFERRED, UNVERIFIED, and PROPOSED evidence labels.
