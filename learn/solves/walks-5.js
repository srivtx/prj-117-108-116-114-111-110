/* ============================================================
   ULTRON LAB · solves/walks-5.js — the Solve Hall, volume 5.
   Dynamic programming + greedy & intervals.
   ============================================================ */
(function () {
  'use strict';
  window.ULTRON_WALKS = Object.assign(window.ULTRON_WALKS || {}, {
    lc70: {
      steps: [
        'Climb n stairs, 1 or 2 at a time — count the distinct ways.',
        'The wall: enumerating step sequences is exponential (Fibonacci growth); the count, though, only depends on where you stand.',
        'The turn: ways(n) = ways(n−1) + ways(n−2) — the last move was either a 1-step from n−1 or a 2-step from n−2. This IS the Fibonacci recurrence wearing stairs.',
        'The build: two rolling variables from the seeds ways(1)=1, ways(2)=2; iterate to n.',
        'The check: O(n) time, O(1) space. Correct because the split by LAST MOVE is exhaustive and disjoint.'
      ],
      trace: 'n=1..6 → 1,2,3,5,8,13 — Fibonacci shifted by one.',
      edges: ['n=1 and n=2 seeds — off-by-one land', 'the O(log n) matrix-power version exists (LC 50\'s loop) — say it, code the linear one'],
      asks: ['Why is this Fibonacci? Say the recurrence mapping.', 'If steps were 1..k (climbing stairs generalized)? — k-order recurrence, k rolling variables'],
      transfer: 'The gateway DP: define the answer as a function of position, split on the LAST move. Everything below is this lesson repeated.'
    },
    lc198: {
      steps: [
        'Rob houses for max loot, never two adjacent — the constraint DP.',
        'The wall: greedy by largest value fails (3,1,3,100,3 picks wrong); brute force over subsets is 2ⁿ.',
        'The turn: at house i you either rob it (then i−1 is forbidden — add its loot to the best at i−2) or skip it (best at i−1). Two states, one recurrence.',
        'The build: rob(i) = max(rob(i−1), rob(i−2) + loot-i). Two rolling variables; the choice sequence is recoverable by walking the decisions backwards.',
        'The check: O(n), O(1). Correct because the two cases cover every legal plan exactly once.'
      ],
      trace: '2,7,9,3,1 → best: 2,7,11,11? walk: i2: 7 vs 2+9=11; i3: 11 vs 7+3=10; i4: 11 vs 11+1=12 → 12.',
      edges: ['the circular variant (first and last adjacent) — run twice with each end excluded', 'single house; empty street', 'rolling variables lose the plan — keep a parent array if the plan is demanded'],
      asks: ['Why does greedy fail? Give the 3,1,3,100,3 counterexample.', 'Recover WHICH houses, not just the total? (backtrack the decisions)'],
      transfer: 'Take-or-skip with a constraint — the parent of decode-ways, delete-and-earn, and stock problems. The recurrence shape is the reusable asset.'
    },
    lc322: {
      steps: [
        'Make an amount with the fewest coins, denominations given, infinite supply.',
        'The wall: greedy by largest coin fails on ugly systems (1,3,4 and amount 6: greedy 4+1+1 = 3 coins; optimal 3+3 = 2). Exponential enumeration is worse.',
        'The turn: fewest(amount) = 1 + min over every coin c of fewest(amount − c). The subproblem is the SAME question at a smaller amount — memoize it.',
        'The build: dp array 0..amount, dp[0] = 0, everything else infinity; for each amount, relax over the coins. Unreachable stays infinity → −1.',
        'The check: O(amount × coins), O(amount). Correct because the last-coin split is exhaustive (some coin is last in any optimal solution).'
      ],
      trace: 'coins 1,3,4, amount 6 → dp: 0,1,2,1,1,2,2 → two coins (3+3), beating greedy\'s three.',
      edges: ['the infinity sentinel — not −1, not zero (zero poisons mins)', 'amount 0 → 0 coins', 'denomination larger than amount — the natural skip'],
      asks: ['Prove greedy wrong with YOUR OWN counterexample — interviewers score it.', 'Count WAYS instead of fewest coins? (addition instead of min — LC 518)'],
      transfer: 'The coin DP: exhaustive last-move splits, memoized. The bottom-up table order IS the proof of coverage.'
    },
    lc300: {
      steps: [
        'The longest strictly increasing run you can pick (skip freely).',
        'The wall: dp per index (LIS ending at i) is O(n²) — the honest first answer. The follow-up wants O(n log n).',
        'The turn: maintain a "tails" array: tails-k = the SMALLEST possible tail of any increasing subsequence of length k. It is provably sorted — so each new element either extends it or BINARY SEARCHES its improvement slot.',
        'The build: for each x: if x > last tail, append; else replace the first tail ≥ x. The final array\'s LENGTH is the LIS (the array itself is NOT the subsequence).',
        'The check: O(n log n) — one binary search per element, O(n) space. Correct because the replacement never shortens the best lengths, only cheapens their tails.'
      ],
      trace: '10,9,2,5,3,7,101,18 → tails evolves 10 → 9 → 2 → 2,5 → 2,3 → 2,3,7 → 2,3,7,101 → 2,3,7,18. LIS length 4.',
      edges: ['strict vs non-decreasing (≥ vs > in the search)', 'the tails array is not a valid subsequence — say it before the interviewer does', 'recovering the sequence itself needs parent pointers'],
      asks: ['Why is the tails array sorted? (an exchange argument — say it)', 'The O(n²) version first, always — then offer the log upgrade when asked'],
      transfer: 'Patience sorting — binary search inside a DP. The same sorted-frontier idea returns in LC 354 (envelopes).'
    },
    lc1143: {
      steps: [
        'The longest sequence appearing in BOTH strings, in order, not necessarily adjacent.',
        'The wall: matching every pair of prefixes naively recomputes the same comparisons exponentially.',
        'The turn: two prefixes: if their last characters MATCH, that character ends a common subsequence of the two shortened prefixes; if not, drop one character from one of them and take the better.',
        'The build: 2-D table over prefix pairs: match → 1 + diagonal; else max(left, up). Fill by row. The answer is the corner; the path back through the table IS the subsequence.',
        'The check: O(n·k) time and space (O(k) with rolling rows, if only the length is needed). Correct because the two cases partition all possibilities.'
      ],
      trace: 'abcde vs ace: matching a, c, e on the diagonal path → length 3.',
      edges: ['empty strings — row/col of zeros', 'the mismatch branch must consider BOTH drop-left and drop-up', 'reconstructing the string requires the full table'],
      asks: ['Why does a match safely claim the diagonal +1? (no longer subsequence can skip a matching pair-end — the exchange argument)', 'Edit distance? (the same table with three moves and costs — LC 72)'],
      transfer: 'Two-sequence DP: prefixes as states, last characters as the decision. Diff tools run this table (with a third: delete).'
    },
    lc416: {
      steps: [
        'Can the numbers be split into two groups of EQUAL sum?',
        'The wall: subsets are 2ⁿ; the sum is fixed though — only HALF of it matters: does some subset hit total/2?',
        'The turn: a subset-sum reachability DP: reachable(s) = can some subset sum to s? Process numbers one by one; each number shifts the reachable set by its own value.',
        'The build: a boolean array 0..half, reachable[0] = true. For each number, sweep the array DOWNWARD (an upward sweep would reuse the number twice), OR-ing reachable(s − value).',
        'The check: O(n · half) time, O(half) space. Correct because each pass adds exactly the subsets using the current number at most once.'
      ],
      trace: '1,5,11,5 → total 22, half 11: after 1: {0,1}; after 5: {0,1,5,6}; after 11: …11 ✓ → true.',
      edges: ['odd total → immediate false', 'the downward sweep — THE bug of this problem', 'zero values (harmless) and values over half (early true)'],
      asks: ['Why downward? (upward lets one coin pay twice)', 'Recover the actual partition? (bitset tricks or a parent table)'],
      transfer: 'Subset-sum: the 0/1 knapsack skeleton. The direction of the inner sweep is the entire difference between 0/1 and unbounded.'
    },
    lc62: {
      steps: [
        'Count the monotone lattice paths corner-to-corner (only right and down).',
        'The wall: enumerating paths is combinatorial madness for big grids; but paths INTO a cell come from exactly two neighbours.',
        'The turn: paths(r, c) = paths(r−1, c) + paths(r, c−1) — the count is additive because the last move is either from above or the left, disjointly.',
        'The build: one row of 1s; sweep rows top-down, adding the left neighbour into each cell. The final cell is the answer. (The closed form: C(r+c−2, r−1) — say it.)',
        'The check: O(rows·cols), O(cols). Correct by the disjoint last-move split at every cell.'
      ],
      trace: '3×7 → row evolves 1×7 → 1,2,3,4,5,6,7 → 1,3,6,10,15,21,28 → 28.',
      edges: ['first row and column are all 1s (one way — straight)', '1×n grids → 1', 'the closed form vs the DP — interviews want both named'],
      asks: ['Why do the two paths sets not overlap? (different last moves)', 'With OBSTACLES? (zero out blocked cells — the recurrence handles the rest)'],
      transfer: 'Grid DP — the 2-D twin of the staircase. Add costs for LC 64, add choices for unique-paths-2.'
    },
    lc64: {
      steps: [
        'The same corner-to-corner walk, now every cell has a price — minimize the total.',
        'The wall: greedy by cheapest next step fails (a cheap first move can force an expensive corridor); full path enumeration is exponential.',
        'The turn: cheapest(r, c) = cost(r, c) + min(cheapest above, cheapest left). Min replaces the add of LC 62 — the skeleton is identical.',
        'The build: first row and column accumulate (no choice there); interior cells take the cheaper feeder. One grid pass, or in-place if mutation is allowed.',
        'The check: O(rows·cols), O(1) in place. Correct because any optimal path enters its last cell from one of exactly two places.'
      ],
      trace: '1,3,1 / 1,5,1 / 4,2,1 → dp fills 1,4,5 / 2,7,6 / 6,8,7 → 7 (path 1→1→3? 1+3+1+1+1: right,right,down,down).',
      edges: ['first row/col are running sums (no alternative)', '1×n grids', 'in-place mutation — ask if the input may be consumed'],
      asks: ['Why is greedy wrong? Draw the counterexample.', 'Recover the PATH? (walk backwards taking the min parent)'],
      transfer: 'Same recurrence, different operator: count-add vs cost-min. Recognizing the skeleton under a new operator IS the interview skill.'
    },
    lc5: {
      steps: [
        'The longest chunk reading the same both ways.',
        'The wall: checking all chunks is O(n³) (n² chunks × length checks); the useful structure is that palindromes nest symmetrically.',
        'The turn: every palindrome has a CENTER — a character (odd) or a gap (even). There are 2n−1 centers; expand each outward while the ends match.',
        'The build: for each of the 2n−1 centers, two pointers walk outward until mismatch; record the widest. (Manacher\'s O(n) exists — name it, don\'t write it under interview time.)',
        'The check: O(n²) worst (all-same strings), O(1) space. Correct because every palindrome is discovered by its own center.'
      ],
      trace: 'babad → center a at 1: expands to bab (3); center b at 2: aba (3) → length 3.',
      edges: ['even centers (gaps) — forgetting them misses cbbd-style answers', 'the whole-string palindrome', 'empty string → 0'],
      asks: ['Why are there 2n−1 centers, and why does that fix the even case?', 'What does Manacher exploit? (reusing the mirror palindrome inside a bigger one)'],
      transfer: 'Centers beat intervals — decompose by symmetry point. The same idea drives palindrome-partitioning DP.'
    },
    lc139: {
      steps: [
        'Can the string be cut entirely into dictionary words?',
        'The wall: trying every first word, then recursing on the rest, blows up exponentially — and repeats the SAME suffix questions millions of times.',
        'The turn: the state is a PREFIX: ok(i) = "the first i characters can be segmented." It is true iff some earlier ok(j) is true and the slice j..i is a word.',
        'The build: ok(0) = true (empty prefix). For each i, scan cut points j: if ok(j) and the slice is in the set → ok(i) = true. The dictionary is a hash set for O(1) lookups.',
        'The check: O(n²) lookups, O(n) states. Correct because any valid segmentation HAS a first word ending somewhere — the scan tries them all.'
      ],
      trace: 'leetcode / leet,code → ok(4): slice leet ✓ and ok(0) ✓; ok(8): slice code ✓ and ok(4) ✓ → true.',
      edges: ['the ok(0) seed — forgetting it fails everything', 'a word longer than any dictionary entry (bounds the j scan by max word length — the standard optimization)', 'repeated letters like aaaaaaaa'],
      asks: ['Why prefix states and not suffix states? (both work — pick one and stay consistent)', 'Memoized recursion vs the table — same complexity, different failure modes under recursion depth)'],
      transfer: 'Prefix reachability: segmentation as a path of words. This is BFS-in-disguise too — nodes are cut points.'
    },
    lc152: {
      steps: [
        'The product version of the maximum subarray.',
        'The wall: Kadane keeps ONE running best — but a single negative can flip the WORST product into the best, so the min must be tracked too.',
        'The turn: carry a PAIR (max-ending-here, min-ending-here). A negative value swaps their roles; zero resets both to restart.',
        'The build: for each x: candidates are {hi·x, lo·x, x} — take the max as the new hi, the min as the new lo; the global best follows hi.',
        'The check: O(n), O(1). Correct because the full state of "products ending here" is exactly that pair.'
      ],
      trace: '2,3,−2,4: hi,lo evolve (2,2) → (6,3) → (−2,−12)? candidates at −2: {−12,−6,−2} → hi −2, lo −12 → at 4: {−8,−48,4} → hi 4 → best 6.',
      edges: ['all-negative arrays (the answer can be positive from two negatives)', 'zeros — the restart rule', 'why "restart" is a candidate (x alone) — single-element answers'],
      asks: ['State the invariant: why is the pair SUFFICIENT? (any product ending here extends from one of the two extremes)', 'Division-banned reasoning: why can\'t you fix a single running product? (negatives flip order)'],
      transfer: 'Kadane with an enriched state. The meta-lesson: when the operator loses a property (positivity), widen the state.'
    },
    lc312: {
      steps: [
        'Burst balloons for max total — each burst scores the balloon × its CURRENT neighbours.',
        'The wall: the first burst changes neighbours for everyone — the subproblems after it are not independent. Choosing the FIRST burst tangles the sides together forever.',
        'The turn: invert — choose the LAST balloon k to burst in a range. Then the left part and the right part interact only through the range\'s BOUNDARY values — each side is a clean subproblem.',
        'The build: pad the array with 1s; dp over open ranges (l, r): dp(l, r) = max over k inside of dp(l, k) + a-l·a-k·a-r + dp(k, r). Iterate by range LENGTH so inner ranges are ready.',
        'The check: O(n³) time, O(n²) space. Correct because the last-burst split is exhaustive and genuinely independent on both sides.'
      ],
      trace: '3,1,5,8 → padded 1,3,1,5,8,1: the length-4 top range scores by bursting 1 (the middle) last: 3·1·5? … the table totals 167.',
      edges: ['the padding — without the virtual 1s the boundary products are undefined', 'the length-first iteration order — inner-before-outer is mandatory', 'empty inner ranges contribute 0'],
      asks: ['Why does first-burst fail? (the sides share the hole\'s boundary — say it in one sentence)', 'Name the genre. (interval DP — with matrix-chain multiplication and burst-the-string)'],
      transfer: 'Think from the END when beginnings tangle. Interval DP: ranges as states, length as the iteration axis.'
    },
    lc53: {
      steps: [
        'The contiguous run with the largest sum.',
        'The wall: all runs is O(n²); and the start of the best run cannot be known in advance — so do not track starts at all.',
        'The turn: define best(i) = the largest sum of a run ENDING at i. It is either x alone or x + best(i−1): one comparison. The answer is the running max over all i.',
        'The build: sweep once with cur = max(x, cur + x); best = max(best, cur). No memory, no second pass.',
        'The check: O(n), O(1). Correct because every run ends somewhere — and at that somewhere, the recurrence holds exactly.'
      ],
      trace: '−2,1,−3,4,−1,2,1,−5,4 → cur: −2,1,−2,4,3,5,6,1,5 → best 6 (the run 4,−1,2,1).',
      edges: ['all-negative arrays — the answer is the largest single element (the restart rule handles it)', 'initial best at −Infinity, not 0', 'why restart is a candidate: extending a negative prefix only hurts'],
      asks: ['Return the RUN, not the sum? (track the start when cur restarts, snapshot on new best)', 'Why is the "ending at i" phrasing the key move? (it makes the state Markov: only the previous best matters)'],
      transfer: 'Kadane — the grandparent of running-state problems. LC 152 widens the state; LC 918 wraps it circularly.'
    },
    lc121: {
      steps: [
        'Buy once, sell once later — maximize the difference.',
        'The wall: checking every pair is O(n²); the best sell at day r depends on exactly one number about the past: the cheapest day so far.',
        'The turn: sweep once, maintaining the running MINIMUM price; each day either lowers it or tests a new profit against it.',
        'The build: min-so-far and best-profit; answer = the final best (0 if prices only fall).',
        'The check: O(n), O(1). Correct because the optimal pair (b, s) has b = the minimum before s — which the sweep knew.'
      ],
      trace: '7,1,5,3,6,4 → min drops to 1; profits 0,0,4,2,5,3 → best 5.',
      edges: ['monotone falling prices → 0 (never trade)', 'the same day buy/sell is forbidden — the min update happens AFTER the profit check, or use strict order', 'multiple transactions? — LC 122, a different recurrence'],
      asks: ['Why is the running min sufficient? (the best partner of any sell is the min before it)', 'Two transactions? (a left pass and a right pass of this exact problem, combined)'],
      transfer: 'Prefix-min pairing — the same shape as Kadane with min instead of sum. One sweep, one memory.'
    },
    lc55: {
      steps: [
        'Each slot says how far you may jump right — can you reach the end?',
        'The wall: path-planning (which jumps to take) is unnecessary work — the question is only REACHABILITY.',
        'The turn: track the furthest index provably reachable. Sweep: if the current index is inside the reach, extend the reach by its jump; if not, no path exists.',
        'The build: reach = 0; for each i: if i > reach → false; reach = max(reach, i + jumps-i). Survive the sweep → true.',
        'The check: O(n), O(1). Correct because reachability is monotone: everything ≤ reach is already covered.'
      ],
      trace: '3,2,1,0,4: reach 3, then stalls — index 4 > 3 → false. 2,3,1,1,4: reach 4 → true.',
      edges: ['a zero at the end-1 position — reach must EXCEED it', 'single element → true', 'why skipping is safe — reach already contains every earlier index'],
      asks: ['Say the monotonicity argument aloud.', 'Greedy vs BFS framing? (the reach IS a collapsed BFS layer)'],
      transfer: 'Greedy reach — plan nothing, prove what is coverable. LC 45 refines it into layer counting.'
    },
    lc45: {
      steps: [
        'Same jumps — now count the MINIMUM number of them (the end is guaranteed).',
        'The wall: BFS on indices works but pays a queue and visited set; the greedy layer version collapses it.',
        'The turn: indices reachable in exactly k jumps form a contiguous BAND. Sweep with the band\'s right edge and the furthest seen; crossing the edge costs one more jump and the band snaps to the new furthest.',
        'The build: steps = 0, band-end = 0, far = 0; for each i (stop before the last index): far = max(far, i + jumps-i); when i reaches band-end: steps++, band-end = far.',
        'The check: O(n), O(1). Correct because it IS BFS by layers — each band is one level, and BFS levels are optimal.'
      ],
      trace: '2,3,1,1,4: band 0 → far 2 → crossing: steps 1, band 2 → far 4 → steps 2, band 4 ≥ end → 2 jumps.',
      edges: ['the loop stops at n−2 (arriving is not a new jump)', 'the i === band-end check placement — before or after the far update, consistently', 'single element → 0'],
      asks: ['Why is the band contiguous? (every index inside reach is launchable)', 'Where else do implicit BFS layers appear? (LC 102\'s snapshot-the-length trick is the same idea in a queue)'],
      transfer: 'BFS without a queue: band edges as levels. The unification of BFS-thinking and greedy-notation.'
    },
    lc134: {
      steps: [
        'A circular gas route — find the unique start that completes the loop.',
        'The wall: restarting a full simulation from every station is O(n²). The circuit demands one pass.',
        'The turn: if the tank starting from A first goes negative at B, then EVERY start in A..B is doomed — they began with more gas and still failed. The next candidate is B+1. That is an elimination, not a search.',
        'The build: sweep once: accumulate tank and total. tank < 0 → candidate = i+1, reset tank. At the end: total ≥ 0 means the candidate completes (gas exists somewhere ahead to pay every deficit); else −1.',
        'The check: O(n), O(1). Correct because each eliminated block is provably hopeless and the surviving candidate is the only one left standing.'
      ],
      trace: 'gas 1,2,3,4,5 / cost 3,4,5,1,2: deficits kill starts 0,1,2 by station 3; candidate 3; total = 0 ≥ 0 → 3.',
      edges: ['total exactly zero — still completable', 'the answer is guaranteed unique in the classic', 'why the candidate does not need re-verification (the total proves the last stretch)'],
      asks: ['Why does tank-negative doom all intermediate starts? (they had a SUPERSET of the fuel — say the monotone argument)', 'Linear vs circular reduction tricks — which other circular problems unwrap this way? (LC 918 max circular subarray)'],
      transfer: 'Elimination sweeps: a failure disqualifies a whole interval. The same law powers gas-station, jump-game and majority-vote.'
    },
    lc435: {
      steps: [
        'Delete the fewest intervals so no two survivors overlap.',
        'The wall: which intervals to delete? Choosing by earliest START fails — an early starter can be enormous and block three others.',
        'The turn: flip it — KEEP the most compatible intervals. Among all optimal keeps, one contains the interval that ENDS FIRST: keeping it can only leave more room after it. Sort by END, sweep, keep greedily.',
        'The build: sort by right endpoint; walk keeping any interval that starts at or after the last kept end; deletions = n − kept.',
        'The check: O(n log n), O(1). Correct by the exchange argument: any solution not keeping the earliest-ending interval can be modified to keep it, losing nothing.'
      ],
      trace: '1,3 / 2,3 / 3,4 / 1,3? sample 1,3,2,3? use 1,2 / 2,3 / 3,4 / 1,3: sorted by end → keep 1,2; 2,3 starts ≥ 2 ✓; 3,4 ✓; 1,3 starts < 3 ✗ → drop 1 → answer 1.',
      edges: ['touching endpoints count as non-overlapping here — state the convention', 'nested and duplicate intervals', 'the sort key debate: start vs end (end wins — be ready to defend it)'],
      asks: ['Give the counterexample where sorting by start fails. (a long early interval vs several short ones)', 'Non-overlapping maximum count vs minimum arrows/rooms? (rooms = the same sweep counting concurrent ends)'],
      transfer: 'The interval-scheduling exchange argument — the canonical provable greedy. Meeting-room problems are its wardrobe.'
    },
    lc57: {
      steps: [
        'Insert one interval into a sorted disjoint list, merging what it touches.',
        'The wall: re-sorting and re-running LC 56 works but wastes the given order — the list is ALREADY sorted and disjoint.',
        'The turn: the new interval partitions the list into three clean zones — ends-before it, overlaps-it, starts-after it. Only the middle needs merging.',
        'The build: copy left (ends before the new start); absorb the middle (any interval starting ≤ new end: take its min start and max end); emit the merged interval; copy the right tail.',
        'The check: O(n), O(n) for the output. Correct because sortedness makes the three zones contiguous.'
      ],
      trace: '1,2 / 3,5 / 6,7 / 8,10 / 12,16 + 4,8 → left: 1,2; merge 3,5 & 6,7 & 8,10 into 3,10; right: 12,16.',
      edges: ['the new interval swallowing the entire list', 'empty list → the interval alone', 'strict vs inclusive touching (≤ vs < in the absorb test)'],
      asks: ['Why no re-sort? (the invariant is given — respect it)', 'Streaming inserts? (a balanced tree of intervals — when does that pay off?)'],
      transfer: 'Respect invariants, repair locally. The three-zone decomposition beats generic machinery whenever order is pre-given.'
    }
  });
})();
