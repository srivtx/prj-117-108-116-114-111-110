/* ============================================================
   ULTRON LAB · solves/walks-6.js — the Solve Hall, volume 6.
   Recursion & backtracking + randomness, probability & the
   Codeforces warm-ups. The final volume: every problem in the
   bank is now solved in the open.
   ============================================================ */
(function () {
  'use strict';
  window.ULTRON_WALKS = Object.assign(window.ULTRON_WALKS || {}, {
    lc78: {
      steps: [
        'List every subset — the power set.',
        'The wall: subsets feel uncountable, but each ELEMENT makes one binary decision: in or out. 2ⁿ leaves.',
        'The turn: walk the elements; at each, branch twice — exclude it, then include it. One shared working list carries the path; the leaves snapshot it.',
        'The build: pick(i, cur): if i = n, emit a copy; else: pick(i+1, cur) — skip; push element i, pick(i+1, cur), pop it. The pop is the un-choose.',
        'The check: O(n · 2ⁿ) (each of 2ⁿ outputs costs a copy), O(n) depth. Correct because every subset corresponds to exactly one include/exclude path.'
      ],
      trace: '1,2,3 → exclude-1 branch: subsets of 2,3; include-1 branch: 1 … all eight leaves.',
      edges: ['the copy at leaves (cur.slice) — emitting the live list outputs n copies of the LAST subset', 'the pop must fire even on the failure paths', 'empty set and full set are both leaves'],
      asks: ['Iterative version? (start with the empty set; each element doubles the list: append the element to copies)', 'Bitmask version? (a mask 0..2ⁿ−1 IS a membership vector — say it)'],
      transfer: 'Choose/explore/un-choose — the backtracking skeleton everything below inherits.'
    },
    lc46: {
      steps: [
        'List every ordering.',
        'The wall: like subsets, but every level MUST place something — the branching is "which remaining value," not "take or skip."',
        'The turn: the state is (path so far, remaining pool). At each depth, try every remaining value in turn; the pool shrinks along the branch and restores on the way out.',
        'The build: go(cur, left): empty pool → emit copy. Else for each value in left: append it, recurse with left minus it, pop it.',
        'The check: O(n · n!) — n! leaves, each costing a copy. Correct because orderings correspond exactly to pool-consuming paths.'
      ],
      trace: '1,2,3 → paths: 1|23, 1|32, 2|13, 2|31, 3|12, 3|21 → six orderings.',
      edges: ['duplicates in input — the classic guarantees distinct values; the general fix sorts and skips equal neighbors at each depth', 'the pool restoration (build a new pool per call, or swap-in-place and unswap)', 'n! explodes fast — n=10 is already 3.6M'],
      asks: ['Swap-based backtracking? (swap the chosen value into the frontier, recurse, swap back — zero allocation)', 'Permutations of a MULTISET? (skip equal candidates per depth)'],
      transfer: 'The state tree with pools — the shape of N-Queens, sudoku solvers and every constraint search.'
    },
    lc39: {
      steps: [
        'Combinations summing to the target, candidates reusable.',
        'The wall: unbounded choice means a naive "try each candidate at each depth" explodes with order-duplicates (2,3 and 3,2 both emitted).',
        'The turn: canonical order — only non-decreasing combinations are real answers. Enforce it with a START INDEX: deeper calls may only consider candidates from the current index onward (or the same one — reuse!).',
        'The build: go(start, remaining, cur): remaining 0 → emit; remaining < 0 → prune. For i from start: push candidate i, recurse with (i, remaining − candidate), pop.',
        'The check: exponential worst case (it must enumerate answers) but the pruning and the canonical order keep it from multiplying by permutations. Correct because every multiset answer has exactly one sorted order.'
      ],
      trace: 'candidates 2,3,6,7, target 7 → 2,2,3 (kept re-taking 2) and 7 → two combinations.',
      edges: ['the SAME index in the recursive call (that single character IS the reuse)', 'remaining < 0 prune — negative targets must stop', 'candidates with the same value twice in the list — sort + dedupe first'],
      asks: ['Why does the start index kill duplicates? (answers are sorted; sorted sequences have one generation path)', 'Coin-change-count (LC 518) vs this? (counting wants each multiset once; here we EMIT them)'],
      transfer: 'Canonical-order recursion — the dedup law of enumeration. Subsets-2 and combinations-sum-2 add sort-and-skip on top.'
    },
    lc22: {
      steps: [
        'Every string of n balanced parenthesis pairs.',
        'The wall: generating all 2ⁿ raw strings and filtering is wasteful — the balance grammar is known BEFORE generating.',
        'The turn: two counters govern legality: opens placed so far (≤ n) and unmatched opens (closers ≤ opens). The two guards prune invalid prefixes at birth.',
        'The build: go(s, open, close): length 2n → emit. If open < n → append ( and recurse with open+1. If close < open → append ) and recurse with close+1.',
        'The check: O(4ⁿ/√n) — the Catalan count is the number of leaves; every visited prefix is valid. Correct because the grammar S → (S)S is exactly the two guards.'
      ],
      trace: 'n=3 → ((( → ((() → (() … five leaves: ((())), (()()), (())(), ()(()), ()()().',
      edges: ['the two guards are independent — both branches can fire from one node', 'n=0 → the empty string', 'counting only? (the Catalan recurrence or the closed form n-th Catalan)'],
      asks: ['Why is the leaf count Catalan? (valid paths in a grid that never cross the diagonal)', 'Generate the k-th lexicographic string without enumerating? (prefix counts by Catalan blocks)'],
      transfer: 'Grammar-walking: prune by legality as you generate. The same guard-pair shapes valid sequences of every kind.'
    },
    lc79: {
      steps: [
        'Trace a word on a letter grid, adjacent cells, no cell reused within one path.',
        'The wall: the visited set per path — copying it per branch is heavy; not having it loops forever on two-cell cycles.',
        'The turn: the grid itself can BE the visited set: overwrite the used cell with a sentinel, recurse four ways, restore it. Un-choose is a write-back.',
        'The build: for each cell, try to walk: mismatch or out of bounds → false; matched the last letter → true. Else sentinel, recurse in 4 directions, restore, return the OR.',
        'The check: O(rows · cols · 3^L) — after the first step, at most 3 directions (no instant backtrack). Correct because each trial path\'s mutations are perfectly undone.'
      ],
      trace: 'board with SEE reachable: S → E → E; ABCB: the B path dies on the second B (sentinel/adjacency).',
      edges: ['the restore line — forgetting it poisons every later trial', 'words longer than the whole grid', 'one cell appearing twice in the WORD (fine) vs twice on a PATH (forbidden)'],
      asks: ['Why is the branching 3 after the first step? (the arrival direction is temporarily removed)', 'Trie for many words at once? (one walk serves the whole dictionary — LC 212)'],
      transfer: 'Visited-by-mutation — zero-cost state, perfect undo. The grid-search template of games and puzzles.'
    },
    lc51: {
      steps: [
        'Place n queens, none attacking — count (or list) the boards.',
        'The wall: n² cells and n queens — brute placements are astronomically many; a naive per-cell attack check is O(n) per test.',
        'The turn: one queen per row (rows can never conflict if you place row by row) — the choice per depth collapses to WHICH COLUMN. Attacks become three O(1) set lookups: column, diagonal r+c, anti-diagonal r−c.',
        'The build: place(r): r = n → count. For each column c: if column/up/down sets are free → mark all three, recurse place(r+1), unmark all three.',
        'The check: O(n!) worst with O(1) pruning per candidate, O(n) space. Correct because the three sets encode every attack vector exactly once.'
      ],
      trace: 'n=4: row 0 col 0 dies at row 3; row 0 col 1 → rows land at 1,3,0,2 — one board; mirrored → 2 total.',
      edges: ['n=2 and n=3 have ZERO boards (the classic surprise)', 'n=1 → 1', 'the two diagonal families (r+c constant vs r−c constant — say which is which)'],
      asks: ['Why are r+c and r−c the diagonal identifiers? (both are constant along their diagonal)', 'Symmetry halving? (mirror the first row\'s choices — a real optimization for counting)'],
      transfer: 'Constraint sets as O(1) pruning — the discipline under every solver: sudoku, crosswords, registers.'
    },
    lc384: {
      steps: [
        'Shuffle an array UNIFORMLY — every permutation equally likely, from a seedable generator.',
        'The wall: sorting by random keys works but costs O(n log n); naive "swap each with a random slot" is BIASED (nⁿ outcomes over n! permutations — uneven by pigeonhole).',
        'The turn: Fisher-Yates: for i from the end down, swap the element at i with a UNIFORM choice from 0..i. The last slot freezes each round: exactly i+1 possibilities per round → n! total paths, one per permutation.',
        'The build: reset stores the original; shuffle loops i = n−1 → 1: j = randint(0, i), swap slots i and j.',
        'The check: O(n) per shuffle, O(n) storage. Correct by counting: the loop generates exactly n! equiprobable execution paths.'
      ],
      trace: '1,2,3: i=2 picks j=0 → 3,2,1; i=1 picks j=1 → stays. One of six equally likely outcomes.',
      edges: ['the biased swap (randint over the WHOLE array each round) — be ready to PROVE the bias', 'i descending, randint inclusive of i itself', 'reset must return the ORIGINAL, not a shuffled copy'],
      asks: ['Prove the naive swap is biased for n=3. (27 outcomes ≠ 6 permutations — pigeonhole)', 'Where does the lab use this? (ds.js\'s seeded shuffle — the worlds run on it)'],
      transfer: 'Fisher-Yates — the correct answer to "make it random" everywhere. World 4\'s coin towers are its cousin: seeded, replayable chance.'
    },
    lc382: {
      steps: [
        'A linked list of unknown length — return a UNIFORMLY random node. One pass allowed.',
        'The wall: counting then re-walking picks index k uniformly — but needs the length FIRST (two passes, or an O(n) array).',
        'The turn: reservoir sampling: keep the first node seen as the champion; the k-th node (k starting at 1) usurps with probability 1/k. The survivor after n nodes holds the throne with probability exactly 1/n — for every node.',
        'The build: walk with counter k; champion = head; at each next node: if a uniform draw from 0..k is 0, replace the champion. Return it.',
        'The check: O(n) time, O(1) space. Correct by induction: node i was chosen with 1/i, then SURVIVED every later replacement round — the product telescopes to 1/n.'
      ],
      trace: 'a,b,c,d: a crowned (k=1); b usurps ½; at c, current champion survives ⅔; at d, ¾ → each ends at ¼.',
      edges: ['the k-th node usurping with probability 1/k — not 1/n (n is unknown!)', 'single node → always it', 'streams of unknown length — the exact setting'],
      asks: ['Run the induction out loud — why does the telescoping give exactly 1/n?', 'Choose k items instead of 1? (a reservoir of size k: the new item enters with k/n, evicting a uniform victim)'],
      transfer: 'Uniform sampling from an unknown stream. Logs, analytics and datasets reservoir-sample exactly this way.'
    },
    lc470: {
      steps: [
        'From a fair 7-sided die, manufacture a fair 10-sided one.',
        'The wall: 7 outcomes cannot split into 10 equal groups — any direct mapping is provably unfair. 49 outcomes (two rolls) still are not divisible by 10.',
        'The turn: two rolls give r = 7·(a−1) + b uniform on 1..49. Take the largest divisible block (40), map by mod 10 — and RE-ROLL the 9 leftovers. That is rejection sampling.',
        'The build: loop: r = 7·(rand7()−1) + rand7(); if r ≤ 40 → return 1 + (r−1) mod 10; else roll again.',
        'The check: each accepted roll carries identical probability 1/49 → each output value 4/49 = (4·10)/490 → exactly 1/10. Expected rolls: 49/40 · 2 ≈ 2.45.'
      ],
      trace: 'rolls (3,5) → r = 7·2 + 5 = 19 ≤ 40 → (19−1) mod 10 = 8 → output 9.',
      edges: ['NEVER use r mod 10 on all 49 — values 41..49 hand nine outputs an extra 1/49', 'guaranteed termination: acceptance 40/49 per round → fails k rounds with (9/49)^k → 0', 'the expected-rolls number — say 2.45; interviewers listen for it'],
      asks: ['Why is the naive mod unfair, exactly? (9 outputs get 5 preimages, 1 gets 4)', 'Rand7 from rand5 first? (compose: 25 → reject 21,21,21 — build the general machine)'],
      transfer: 'Rejection sampling: carve the largest fair block, discard the rest. The same law powers fair shuffles from biased sources and slice sampling in statistics.'
    },
    cf1a: {
      steps: [
        'Pave an n×k theatre square with a×a flagstones — count the stones.',
        'The wall: nothing algorithmic hides here — the test is whether you trust arithmetic over simulation. Simulating a 10⁹ square is impossible.',
        'The turn: each axis needs the ceiling of side/a — stones along x times stones along y.',
        'The build: stones(x) = floor((x + a − 1)/a) for each axis; multiply. Products reach 10¹⁸ — use big integers in JS (or 64-bit elsewhere).',
        'The check: O(1). Correct because tiles snap to an axis-aligned grid without cutting.'
      ],
      trace: 'n=k=6, a=4 → 2·2 = 4 stones.',
      edges: ['the 10⁹ corners → 10¹⁸ product (BigInt in JS — the REAL trap of this problem)', 'exact divisibility — the ceiling formula still works', 'a larger than a side → one stone that overhangs? No: min(1, …) is just the ceiling'],
      asks: ['Why BigInt for one multiply? (Numbers above 2⁵³ silently lose precision in JS)', 'Ceiling division without floats? ((x + a − 1) / a with floor)'],
      transfer: 'The contest opener: trust the closed form, respect the number ranges.'
    },
    cf4a: {
      steps: [
        'Split a watermelon into two positive EVEN parts — possible?',
        'The wall: none — this is the "read the constraints twice" opener disguised as a puzzle.',
        'The turn: even + even = even total. And the smallest usable part is 2, so w must be even AND w > 2.',
        'The build: one boolean: w % 2 === 0 && w > 2.',
        'The check: O(1). Correct: w = 2a + 2b needs a, b ≥ 1 → w ≥ 4 even.'
      ],
      trace: '8 → 2+6 ✓ YES. 2 → only 1+1 (odd parts) → NO.',
      edges: ['w = 2 — even but impossible (the trap)', 'odd w — immediate no', 'huge w — fine, even is enough'],
      asks: ['Why does even total not suffice? (w=2 is the counterexample)', 'Generalize: two parts each divisible by k? (w divisible by k, w > k)'],
      transfer: 'Parity bookkeeping — the cheapest honest proof in the book.'
    },
    cf71a: {
      steps: [
        'Abbreviate long words: first letter + inner count + last letter.',
        'The wall: none — the exercise is exactness about boundaries and the strictness of the comparison.',
        'The turn: only words longer than ten letters shrink; the count is the letters BETWEEN the two ends.',
        'The build: length > 10 → w at 0, plus (length − 2), plus the last letter; else the word unchanged.',
        'The check: O(1) per word. Correct because the spec\'s strictly-greater is respected.'
      ],
      trace: 'localization → l10n; word → word (unchanged, length 4).',
      edges: ['exactly 11 letters → abbreviated (strictly > 10)', 'length ≤ 10 untouched', 'the count is length−2 — the ends are not counted'],
      asks: ['Off-by-one at the boundary — how do you make sure you used > and not ≥?', 'Why do competitive programmers love this one? (it teaches reading the exact constraint)'],
      transfer: 'Specification discipline — the cheapest skill, the most common failure.'
    },
    cf158a: {
      steps: [
        'Contest scores are non-increasing; advance those with a positive score at least equal to the k-th place.',
        'The wall: the trap is assuming the k-th score is positive — it may be zero, gating everyone.',
        'The turn: read the k-th score, then count entries that are ≥ it AND > 0.',
        'The build: const kth = scores at k−1; count with both conditions.',
        'The check: O(n). Correct because sortedness makes the count a prefix.'
      ],
      trace: '10,9,8,7,7,7,5,5 with k=5 → kth = 7 → six entries ≥ 7 and positive → 6.',
      edges: ['the k-th score = 0 → zero advance', 'ties across the k-th boundary — both conditions together handle it', 'k = 1 → count entries ≥ first (i.e., ≥ max, > 0)'],
      asks: ['Why the > 0 guard on every entry, not just the k-th?', 'What does the sortedness assumption buy? (a prefix count instead of a full scan)'],
      transfer: 'Edge-case hygiene: the zero gate. Read what "advance" means, then encode both halves.'
    },
    cf231a: {
      steps: [
        'Three friends each vote sure/unsure per problem; implement when at least two are sure.',
        'The wall: none — the drill is clean row reduction.',
        'The turn: sum each row of three flags; count rows with sum ≥ 2.',
        'The build: filter rows whose sum ≥ 2; answer the count.',
        'The check: O(n) rows, O(1) per row. Correct by the majority rule.'
      ],
      trace: '(1,1,0) ✓ (1,1,1) ✓ (0,0,1) ✗ → 2 problems.',
      edges: ['exactly two sures — counts (≥, not >)', 'all-unsure rows', 'input shape: n lines of 3 flags'],
      asks: ['Majority of k voters? (sum > k/2)', 'Why is this the canonical second problem of any contest? (reading + counting with zero algorithmic noise)'],
      transfer: 'Threshold counting — reduce a table to one number without overcomplicating.'
    },
    cf50a: {
      steps: [
        'Max dominoes (1×2) on an n×k board.',
        'The wall: tiling debates — corners, orientations — all noise: only AREA PARITY matters.',
        'The turn: a domino covers 2 cells; any rectangle of even area tiles perfectly with horizontal dominoes. Odd area → one cell wasted.',
        'The build: floor(n·k / 2).',
        'The check: O(1). Correct: even area always tiles; odd area always wastes exactly one (parity).'
      ],
      trace: '2×4 → 4. 3×3 → 4 (9 cells, one wasted).',
      edges: ['1×1 → 0', '1×5 → 2', 'say the parity argument before the one-liner — that IS the problem'],
      asks: ['Prove every even rectangle tiles. (induction: strip off a domino row)', 'When would shapes actually matter? (boards with holes — real tiling theory begins)'],
      transfer: 'Parity over geometry — the deepest idea wearing the smallest costume in the set.'
    },
    cf263a: {
      steps: [
        'A 5×5 grid holds one 1 — cost to swap it to the center?',
        'The wall: none algorithmically — the lesson is Manhattan distance.',
        'The turn: one swap moves the 1 by one cell in one axis; minimum swaps = |r−2| + |c−2|.',
        'The build: find the 1 by scanning; apply the formula.',
        'The check: O(25). Correct because axes are independent and each unit costs one swap.'
      ],
      trace: '1 at row 1, col 2 → |1−2| + |2−2| = 1 swap.',
      edges: ['already centered → 0', 'corner → 4', 'the center index is (2,2) zero-based — off-by-one territory'],
      asks: ['Why is Manhattan the right metric here? (one-axis-at-a-time moves)', 'Euclidean would round to what? Why is it wrong? (diagonals are impossible in one swap)'],
      transfer: 'Manhattan distance — grid cost accounting. It returns in Word Ladder\'s token cousins and routing grids.'
    },
    cf282a: {
      steps: [
        'Commands X++ / ++X / X-- / --X — final X?',
        'The wall: parsing four exact command shapes position-by-position is fragile and unnecessary.',
        'The turn: every command contains exactly one of ++ or --; the variable name is decoration.',
        'The build: sum +1 for each command containing ++, −1 otherwise.',
        'The check: O(n). Correct because the four commands differ only in operator.'
      ],
      trace: 'X++, ++X, X-- → +1 +1 −1 = 1.',
      edges: ['++ vs -- detection order (a string cannot contain both)', 'the leading + in ++X — string search does not care', 'the temptation to index by position — resist it'],
      asks: ['When is feature-based parsing better than positional? (robustness to harmless variation)', 'Where else does "match the invariant, not the layout" pay off? (every tolerant parser you will write)'],
      transfer: 'Parse by invariant, not position. The smallest statement of the lab\'s whole philosophy.'
    }
  });
})();
