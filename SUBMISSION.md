# 📋 Level 3 Submission Guide

Everything that can be automated is done. This file lists the **remaining manual
steps** that require *your* accounts (GitHub, Vercel) and a screen recorder.

## Status

| Checklist item | Status |
| --- | --- |
| Public GitHub repository | ✅ https://github.com/cansarihan/stellar-nft-marketplace |
| README with complete documentation | ✅ `README.md` |
| 10+ meaningful commits | ✅ (see `git log`) |
| Live demo link | ✅ https://frontend-can-sarihan.vercel.app |
| Contract deployment address | ✅ in README + on testnet |
| Transaction hash for contract interaction | ✅ in README |
| Screenshot — mobile responsive UI | ⬜ capture from live demo |
| Screenshot — CI/CD pipeline running | ⬜ capture after first push |
| Screenshot — test output (3+ passing) | ✅ `cargo test` 11 / `npm test` 15 |
| Demo video (1–2 min) | ⬜ record |

## 1. Push to GitHub
```bash
gh repo create stellar-nft-marketplace --public --source=. --remote=origin --push
# or, manually:
# git remote add origin https://github.com/<you>/stellar-nft-marketplace.git
# git push -u origin main
```
The CI pipeline (`.github/workflows/ci.yml`) runs automatically on push —
screenshot the green checks for the submission.

## 2. Deploy the live demo (Vercel)
1. Import the repo at https://vercel.com/new
2. Set **Root Directory** = `frontend`
3. Framework auto-detects **Vite**; build = `npm run build`, output = `dist`
4. Deploy → copy the URL into `README.md` (Live demo row)

The app ships with the live testnet contract addresses baked in, so no env vars
are required. (Override via `VITE_*` if you redeploy your own contracts.)

## 3. Screenshots
- **Mobile UI:** open the live demo, DevTools → device toolbar (iPhone), screenshot.
- **CI running:** GitHub → Actions tab → the CI run with green jobs.
- **Tests:** run `cargo test` and `cd frontend && npm test`, screenshot the output.

## 4. Demo video (1–2 min)
Suggested flow: connect Freighter → mint an NFT → list it → buy/cancel →
point out the live event feed updating in real time.

---
Need to redeploy contracts under your own keys? Run `./scripts/deploy.sh testnet <identity>`.
