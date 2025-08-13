# Watch2Gas

Watch2Gas is a Solana dApp that sponsors users' gas fees after they watch a short advertisement. It includes a user flow for sending SOL with sponsored fees and an admin panel to configure the program and manage ads.

## Features

- User flow to send SOL with gas fees sponsored after ad viewing
- Admin panel to initialize program, deposit/withdraw funds, set base fee, and create/toggle ads
- Built with Next.js App Router, React, Tailwind, and Solana Wallet Adapter
- Anchor-compatible IDL included at `utils/idl.ts`

## Tech stack

- Next.js 15, React 19, TypeScript
- @project-serum/anchor, @solana/web3.js, @solana/wallet-adapter-react(-ui)

## Prerequisites

- Node.js >= 18.18
- npm (or pnpm/yarn)
- A Solana wallet (e.g., Phantom) for testing

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Configure for your deployment

1) Program ID
- Update the `PROGRAM_ID` constant in both:
  - `src/app/user/page.tsx`
  - `src/app/admin/page.tsx`

2) RPC endpoint
- The app uses Solana Devnet by default at `https://api.devnet.solana.com` via `ConnectionProvider` in `src/app/layout.tsx`.
- To change networks or providers, update that `endpoint` value.

3) IDL
- The Anchor IDL is embedded at `utils/idl.ts`. Replace with your deployed program's IDL if it differs.

## Scripts

```bash
npm run dev    # start dev server
npm run build  # production build
npm run start  # start production server
npm run lint   # lint
```

## App routes

- `/`      – Landing page
- `/user`  – User flow to send SOL; watches an ad before completing the transaction
- `/admin` – Admin panel: initialize program, manage funds, configure base fee, create/toggle ads

## How it works (high level)

1. User initiates a send on `/user`.
2. A random active ad is chosen; the user watches it for the required duration.
3. After completion, the transaction is executed and the gas fee is sponsored from the program treasury.

Program interfaces and accounts are defined in `utils/idl.ts` (e.g., `initialize`, `depositFunds`, `createAd`, `toggleAd`, `initiateSendTransaction`, `completeTransactionAfterAd`, `updateBaseFee`, `withdrawFunds`).

## Notes

- If you see “Program Not Available” on `/user`, initialize the program from `/admin`.
- Ensure the treasury has sufficient SOL for sponsorship.
- For production, replace Devnet endpoint and review security around admin actions.

## License

No license specified.
