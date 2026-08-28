This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Architecture

This project follows a clear technology split:

### TypeScript

Used for the product application and application backend, including:

- Next.js web app
- LLM integration layer
- RAG orchestration layer
- Router and provider abstraction
- Tool calling integration
- Knowledge extraction workflows
- Application backend logic

### Python

Used for Data Science, ML, and AI analysis work, including:

- Data cleaning
- Exploratory analysis
- Feature engineering
- Forecasting
- Anomaly detection
- Model evaluation

This keeps the application runtime in TypeScript while reserving Python for data and ML processing tasks.

- The AI layer is structured as a provider registry and an LLM router so future providers can be added without changing the whole app.
- No API keys are stored in source code.

## Getting Started

## Authentication

Clerk is configured as the application identity provider and Convex receives the
authenticated Clerk JWT from the client. To complete the connection for each
Convex deployment:

1. In Clerk, create a JWT template named `convex`.
2. Set `CLERK_JWT_ISSUER_DOMAIN` in Convex to the JWT template's issuer domain.
	For local development, run `npx convex env set CLERK_JWT_ISSUER_DOMAIN <issuer-domain>`.
3. Configure the normal Clerk environment variables in `.env.local`:
	`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
4. Deploy the Convex functions with `npx convex dev` or `npx convex deploy`.

Convex functions can resolve the signed-in user with
`await ctx.auth.getUserIdentity()`. The `current` query in `convex/users.ts`
returns that identity or `null` for an unauthenticated request.

### Manual acceptance tests

Complete these checks with a Clerk account before considering the company flow
accepted:

1. Create a company named `DublinBrew` and select **Add example dashboard data**.
2. Create a separate `Test Company` without selecting example data.
3. Use the company switcher to confirm DublinBrew displays the populated
	dashboard and Test Company displays the empty dashboard state.
4. Confirm company switching never exposes the other company's dashboard data.
5. When multiple Clerk accounts are available, verify Owner, Admin, and Member
	permissions using memberships for the same company.

## Knowledge foundation

Company Brain stores knowledge as structured, company-scoped records rather
than raw conversation transcripts. A `knowledgeItem` is one of `FACT`,
`PROCESS`, `RULE`, `DECISION`, `REASON`, `LESSON`, `RISK`, or `GOAL`.

Every record includes a title and statement, its source type and reference,
the person or system that provided it, when it was learned, the user who
captured it, confidence from 0 to 100, and validity lifecycle fields:
`active`, `superseded`, or `archived`, with optional validity and review dates.

`knowledgeRelations` creates directed, named edges between two records in the
same company, such as `causes`, `provides`, `involved in`, `discussed in`, or
`influenced`. This is the company knowledge graph used by future decision and
analysis features.

All knowledge reads resolve the authenticated user's active membership first.
Knowledge creation and graph edits require an `Owner` or `Admin`; `Member`
accounts can read only the active company's knowledge. The API rejects item
and relationship identifiers from another company, preventing tenant data
access through manually changed IDs.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
