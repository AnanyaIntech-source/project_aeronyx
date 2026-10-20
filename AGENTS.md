<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All fleet data lives in `src/lib/fleet/data.ts` (immutable) and every metric comes from pure functions in `src/lib/fleet/engine.ts` — one source of truth so landing, simulator and recovery numbers always agree.
- Dashboard pages share selection/scenario state via `FleetProvider` in `src/routes/dashboard.tsx` (sessionStorage only) — no backend in v1.
- `noUncheckedIndexedAccess` / `exactOptionalPropertyTypes` are disabled in tsconfig — the engine indexes small fixed lookup tables heavily.
- Public homepage presentation lives in homepage-only components and scoped styles; it reads the existing fleet engine without mutating dashboard state, so cinematic styling cannot alter the operational interface.
- Homepage twin hotspots are a controlled overlay anchored to the image's intrinsic square frame and share the selector's React state; this preserves the reference image and prevents responsive letterboxing from shifting hit targets.
- Explicit illustrative homepage recovery values live in a homepage-only scenario module and never feed dashboard calculations; this keeps presentation examples separate from operational results.
