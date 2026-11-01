# ULTRON LAB

<div align="center">

**`prj-117-108-116-114-111-110`** · 117·108·116·114·111·110 = `u l t r o n` in ASCII

**Learn computer science and quantitative economics by playing them, building them, solving them, and proving them.**

No frameworks. No backend. No shortcuts. Every line runs in the browser and is re-proven by a verify suite on every push.

[![verify](https://github.com/srivtx/prj-117-108-116-114-111-110/actions/workflows/verify.yml/badge.svg)](https://github.com/srivtx/prj-117-108-116-114-111-110/actions/workflows/verify.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-0f9e8e.svg)](./LICENSE)
[![Deploy with Vercel](https://img.shields.io/badge/deploy-Vercel-5d4fe0?logo=vercel&logoColor=white)](#deploy)

</div>

---

## The whole lab, one screen

| Wing | What it is | Where |
|---|---|---|
| **The 12 worlds** | Data structures & algorithms — the full curriculum of *Open Data Structures* as interactive 3D worlds you play by hand before the algorithm runs | [`/`](./) |
| **Build your own X** | Eight working implementations — git, vim, a database, a calculator, a math engine, a ray tracer, a framework, a neural net — each backed by a pure, unit-tested core | [`build/`](./build/) |
| **Probability & stats** | Seven worlds where the math is simulated before it is named — Galton, LLN, expectation, CLT, Bayes, birthday, variance | [`stats/`](./stats/) |
| **The arena** | 105 classic interview problems (LeetCode / Codeforces, IDs attached) mapped to the worlds that train them — 78 with a live in-browser judge | [`arena/`](./arena/) |
| **The solve hall** | Every one of the 105 problems solved in the open: the five-move transcript, dry runs, edge cases, follow-ups, the transfer | [`solves/`](./solves/) |
| **Economics & finance** | 12 stations from compound interest to deep surrogates and climate uncertainty — the QuantEcon lecture catalog and *Deep Learning for Solving and Estimating Dynamic Economic Models* rebuilt in the lab's style | [`econ/`](./econ/) |

---

## Why this exists

Most explanations show you a static diagram and ask you to trust a conclusion you never checked. This lab is built around a different loop, for people whose brains refuse to accept "it just works":

1. **Play it by hand.** Before any algorithm runs, you do its job yourself — shift the array blocks, splice the pointers, flip the skiplist coins, accept or reject the job offer.
2. **Predict, then watch.** Stories lock in a guess first ("how deep is a treap after 15 sorted inserts?") and grade you against *your own run* — never a canned answer.
3. **Name it last.** Words like *amortized*, *load factor*, *stationary distribution* or *Kesten tail* appear only after you've felt the phenomenon they name.
4. **Why this design?** Every world and station ends with the trade-offs: what this structure buys, what it pays, and which real system chose it.

**The same files the browser runs are the files the verify suite proves.** There is no "sample" code anywhere.

---

## The 12 worlds — data structures & algorithms

The full curriculum of Pat Morin's *Open Data Structures* (CC BY), one interactive world per chapter pair:

| # | World | ODS | What you do |
|---|-------|-----|-------------|
| 1 | **Growth** | §1 | Scale six growth-class towers yourself; walk the binary-search staircase; feel why 10⁶×10⁶ = 16 minutes |
| 2 | **Arrays** | §2 | Shift blocks by hand for a front insert, watch doubling pre-pay itself (amortization), ride the circular queue, meet the triangle trick |
| 3 | **Chains** | §3 | Splice a linked list with two taps, then feel random access die on the get(i) walk; meet the cache bill |
| 4 | **Skiplists** | §4 | Flip coins for tower heights, ride express lanes down to a key, prove the ⅛ height-4 chance |
| 5 | **Hashing** | §5 | Execute the multiply-and-shift hash pipeline by hand, collide with the birthday paradox, probe linearly, leave tombstones |
| 6 | **Trees** | §6 | Steer a BST search fork by fork, grow the sorted-input stick, walk pre/in/post-order, delete by successor |
| 7 | **Balance** | §7–9 | Rotate a stick by hand, let the treap's coins heal sorted input, read red-black as 2-3 crates splitting |
| 8 | **Heaps** | §10 | Triage ER patients by hand (O(n) each), then let the implicit tree sift up/down and heapify in O(n) |
| 9 | **Sorting** | §11 | Hand-merge two piles, partition around pivots, spring the sorted-input quicksort trap, break the n log n wall |
| 10 | **Graphs** | §12 | Pave your own city, let BFS ripple to every distance and DFS rope through it, count the LED wall's memory bill |
| 11 | **Tries** | §13 | Walk a value down its bit path yourself, meet the w-bound that ignores n entirely |
| 12 | **B-trees** | §14 | Fill a crate until the median flies up; watch height collapse 20 reads into 3 — the database index, live |

Every world: **guided story (5–8 steps) with hand-play, predictions and live grading → free play → "why this design?" → notebook terms → arena links.**

## Build your own X — eight labs, zero libraries

| Build | What you make | The pure core |
|---|---|---|
| **A calculator** | Tokenizer → Pratt parser → tree evaluator; precedence as the *shape* of a tree, drawn live | `learn/pure/parser.js` |
| **Your own git** | Real SHA-256 content addressing; blobs/trees/commits, branches, dedup you can watch | `sha256.js` + `gitstore.js` |
| **Your own vim** | A modal editor as a pure state machine: verbs, motions, counts, registers, undo — click and type for real | `vimcore.js` |
| **Your own database** | A table with a live B-tree index (World 12's structure), a SQL dialect, and a planner that *prints* its choice | `dbstore.js` + `ds.js` |
| **A math engine** | Matrices, Gaussian elimination with a step receipt, determinants | `linalg.js` |
| **A graphics engine** | A ray tracer: 38,400 rays in vanilla JS, shadows and recursion-you-can-set for reflection | inline |
| **Your own framework** | Signals + effects + computed — 40 lines of the reactivity core Vue/Solid run on, dependency graph lighting up live | `signals.js` |
| **A neural network** | A 60-line autograd engine (backprop = the chain rule mechanized) that learns XOR in front of you | `autograd.js` |

Every lab: **use it → understand it → a rebuild ladder of milestones → where it goes in the real world.**

## The arena + the solve hall

**105 classics** from LeetCode, Codeforces and the big-tech folklore — every one mapped to the world that trains it, with a paraphrased statement (our words), a **three-step hint ladder**, a first-principles approach, complexity, and a working JavaScript solution. **78 of them have a live judge**: write the function, run the tests, see the failures — in your browser, no accounts, no servers.

The **Solve Hall** is the companion: all 105, none skipped, each solved in five moves —

> **Restate** the question in structure terms → **the wall** (why the obvious approach fails) → **the turn** (the reframe that removes the wall, and what you pay for it) → **the build** (loop + invariants, not memorized lines) → **the check** (complexity + a one-sentence correctness argument).

— plus a **dry run** on real input, the **edge cases** that break naive code, the **interviewer's follow-ups**, and the **transfer**: the pattern the problem was hiding. The honest order is printed at the top of the page: attempt first, read second, re-solve tomorrow.

## Economics & finance — 12 stations

The QuantEcon lecture catalog (8 courses) and *Deep Learning for Solving and Estimating Dynamic Economic Models* (12 chapters, by Schmitt-Grohé & Uribe's course site at sischei.github.io) — read end to end, then rebuilt step by step in the lab's style: play it, predict, then name it.

| # | Station | You will | Sources it rebuilds |
|---|---------|----------|---------------------|
| E01 | **Money & time** | Grow a dollar, discount it back, find the doubling point — geometric series as a machine you drive | QE intro: *Geometric Series, Linear Equations* |
| E02 | **The Solow machine** | Push savings and depreciation, watch capital hunt its steady state, find the golden rule | QE intro: *Economic Growth* |
| E03 | **Markov chains** | Watch probability flow between states until it forgets where it began — stationary distributions by hand | QE: *Finite Markov Chains* |
| E04 | **The job you take** | Play a job searcher accepting and rejecting offers — then meet the reservation wage that beats you | QE: *McCall Search Model* |
| E05 | **The Bellman sweep** | Watch value iteration sharpen a curve, choose patience, see discounting price the future | QE: *Dynamic Programming, Optimal Savings* |
| E06 | **The perfect arc** | Smooth consumption by annuitizing wealth — one-off bonus vs permanent raise, felt as curves | QE: *Permanent Income, LQ Control* |
| E07 | **Clocks & jumps** | Exponential clocks, Poisson arrivals, the Kolmogorov flow — continuous time without the fear | QE: *Continuous Time Markov Chains* |
| E08 | **Wealth of crowds** | A thousand agents, multiplicative luck, one slider of redistribution — watch the tail grow and shrink | QE: *Wealth Dynamics, Kesten Processes* + DEQN ch 5–6 |
| E09 | **Learning the economy** | Train a tiny neural net (the Build-X autograd core!) to approximate E05's policy — a deep equilibrium net in miniature | DEQN ch 1–3: *ML/DL intro, Deep Equilibrium Nets, IRBC* |
| E10 | **Physics in the loss** | A PINN that learns e⁻ᵗ from its differential equation alone — zero data points, the residual is the teacher | DEQN ch 7–8: *PINNs, continuous-time HA* |
| E11 | **The curve with error bars** | Gaussian processes as surrogates: sample where you're uncertain, watch the band collapse around the true value function | DEQN ch 9–10: *GPs, deep surrogates & SMM* |
| E12 | **The fog ahead** | A climate ensemble under deep uncertainty — the p95 tail that quietly sets the price of carbon | DEQN ch 11–12: *Climate economics & synthesis* |

Every station runs a real, tested pure core in `learn/econ/` — the same file the verify suite proves. The full **source ladder** with links to all 20 originals is printed at the bottom of the wing.

---

## Verified, not just written

```bash
node tools/verify.mjs     # run it yourself — 124 checks, 0 failures
```

- **every ODS structure's invariants** — skiplist chains sorted, treap BST+heap, red-black no-red-red and equal black depths, B-tree key bounds and equal leaf depths, heap property, hash tombstone/rehash behavior, the quicksort sorted-input trap;
- **every build core** — SHA-256 against official test vectors, git content dedup and branch isolation, the calculator's precedence suite, Gaussian solve residuals, autograd gradients and a network that actually learns XOR, the signal graph's dependency collection, the vim state machine, the database planner's index-vs-scan decisions;
- **every arena solution executed** against its own test suite in node;
- **every Solve Hall walkthrough** — shape-checked: five moves, a dry run, the edges, the follow-ups, the transfer;
- **every econ core** — steady states against closed forms, value iteration against the analytic policy, stationary distributions that satisfy π = πP, GP posteriors that interpolate, climate ensembles that order correctly.

GitHub Actions runs the whole suite on every push and pull request (`.github/workflows/verify.yml`).

**Honest notes:** the LinearHashTable uses classic linear probing rather than ODS's exact probe order; the mini-git keeps trees flat instead of nested; the mini-database's rows live in a Map, not real pages — the index is the real B-tree; arena statements are paraphrased, IDs are for finding the originals, and company mentions are folklore, not verified claims; the econ stations are faithful in mechanism but small in scale — they are teaching instruments, not research codes.

---

## Run it locally

Everything is static — one clone and a file server:

```bash
git clone https://github.com/srivtx/prj-117-108-116-114-111-110.git
cd prj-117-108-116-114-111-110
python3 -m http.server        # open /, /build/, /stats/, /arena/, /solves/, /econ/
node tools/verify.mjs         # prove everything yourself
```

No install, no build step, no dependencies — three.js (r128) is the only runtime library, loaded from a CDN.

## Deploy

The lab is a pure static site, so it deploys anywhere a folder can be served. **We ship on [Vercel](https://vercel.com)** rather than GitHub Pages:

- **zero config** — `vercel.json` is 10 lines (clean URLs, a nosniff header); no build command, no Jekyll passthrough hacks for `_`-less folders, no `.nojekyll` folklore;
- **instant previews** — every branch and PR gets a live URL, so "does World 7 look right on your machine" is a link, not a screenshot;
- **headers and caching done properly** — security headers and per-route cache rules that Pages makes you fight for;
- **a global CDN** with immutable asset caching and automatic compression.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsrivtx%2Fprj-117-108-116-114-111-110)

(Netlify or Cloudflare Pages would serve it identically — the site asks nothing of its host. Vercel is the choice, not the requirement.)

---

## How it's built

- **3D:** [Three.js r128](https://threejs.org/) from cdnjs; every world draws through one `InstancedMesh` of cubes, pooled line segments for pointers/edges, pooled canvas-sprite labels, hand-rolled orbit/zoom/pick. Engine: `learn/sim3d.js`.
- **Structures:** `learn/ds.js` — every ODS structure as pure logic with op-logs, shared by the sims *and* the test suite.
- **Teaching engine:** `learn/story.js` — guided stories (say → your turn → predict → name it), notebook, quiz drawer, progress; all in `localStorage`, nothing sent anywhere.
- **Build labs:** pure cores in `learn/pure/` (browser + node), interactive wrappers in `learn/build-labs*.js`.
- **Arena + solve hall:** the bank in `learn/arena-data.js`, the judge in `learn/arena.js`, the walkthrough volumes in `learn/solves/`, the reading room in `learn/solves.js`.
- **Econ wing:** pure cores in `learn/econ/` (one file per station, browser + node), the interactive stations in `learn/econ-sims*.js`, the shell at `econ/index.html`.
- **Design:** the same design language as its kindred project [voxel-network-lab](https://github.com/srivtx/voxel-network-lab) (Pixelify Sans / IBM Plex, voxel grid, panel layout), with a violet-shifted palette of its own.

```
prj-117-108-116-114-111-110/
├── index.html            # the 12 3D worlds (hub)
├── build/                # build-your-own-X labs
├── stats/                # probability & statistics wing
├── arena/                # interview problems + in-browser judge
├── solves/               # the solve hall — 105 walkthroughs
├── econ/                 # economics & finance wing (12 stations)
├── learn/
│   ├── lab.css           # design system (tokens + components)
│   ├── sim3d.js          # the 3D workbench
│   ├── story.js          # the teaching loop
│   ├── ds.js             # ODS structures (pure, tested)
│   ├── worlds/w01…w12    # one module per world
│   ├── stats-sims.js     # the seven probability sims
│   ├── build-labs*.js    # interactive build labs
│   ├── arena-data.js     # the 105-problem bank
│   ├── solves/walks-1…6  # the walkthrough volumes
│   ├── solves.js         # solve hall renderer
│   ├── econ/*.js         # econ pure cores (tested)
│   ├── econ-sims*.js     # the 12 interactive stations
│   └── pure/             # build cores (sha256, git, parser, db, linalg, autograd, signals, vim)
├── tools/verify.mjs      # the honest suite (CI runs it on every push)
└── .github/workflows/    # CI
```

---

## Credits

- Curriculum and structure follow **Pat Morin, *Open Data Structures*** (opendatastructures.org, CC BY 4.0) — an independent study companion, not affiliated with the author. The pseudocode-to-JS ports here are ours; errors are ours too.
- The economics wing rebuilds material from the open lectures of **QuantEcon** (quantecon.org) and **the *Deep Learning for Solving and Estimating Dynamic Economic Models* lecture site** (sischei.github.io) — station pages link every source chapter they stand on.
- Interview classics paraphrased from the public problem sets of LeetCode and Codeforces; all solutions and walkthroughs written for this lab.
- Kindred project and design reference: [voxel-network-lab](https://github.com/srivtx/voxel-network-lab) — this lab's older sibling, for complexity science.
- Built by [Sribatsha Dash (@srivtx)](https://github.com/srivtx).

## License

Code released under the [MIT License](LICENSE). Learn freely, rebuild often.
