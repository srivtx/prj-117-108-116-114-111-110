/* ============================================================
   ULTRON LAB · solves/walks-1.js — the Solve Hall, volume 1.
   Arrays & hashing + two pointers & windows. Every entry is the
   transcript of an honest solve: restate → the wall → the turn →
   the build → the check, then a dry run, the edge cases, the
   interviewer's follow-ups, and the pattern to carry away.
   ============================================================ */
(function () {
  'use strict';
  window.ULTRON_WALKS = Object.assign(window.ULTRON_WALKS || {}, {
    lc1: {
      steps: [
        'A pairing question in disguise: among the entries, find x and its complement target−x, and report WHERE they sit.',
        'The wall: for each x, scanning the rest for its partner is O(n²) — and it re-asks the same "have I seen k?" question thousands of times.',
        'The turn: "have I seen value k, and at which index?" is exactly the question a hash map answers in O(1). Ask it on the way in, not after.',
        'The build: walk once, keeping a map value → index. At each x, look up the complement FIRST; only then insert x. Check-before-insert lets equal values pair up (3 with 3, for target 6) without an element ever matching itself.',
        'The check: one pass, one lookup each → O(n) time, O(n) space. Correct because both members of the pair are already inserted when the later one arrives.'
      ],
      trace: 'nums = 2,7,11,15, target 9 → i=0: store 2→0. i=1: need 2, seen at 0 → answer (0, 1).',
      edges: ['two equal values forming the pair — the check-before-insert order handles it', 'negatives and zero — the map does not care about sign', 'exactly one answer guaranteed — no tie-break needed'],
      asks: ['What if the array were sorted? (two pointers, O(1) extra space)', 'What if you needed every pair? (map value → list of indices, mind the pairing count)'],
      transfer: 'Complement + hash map: every "find the partner" question becomes one lookup. Siblings: LC 560, LC 167 sorted, missing-number.'
    },
    lc217: {
      steps: [
        'A pure membership question: does any value occur at least twice?',
        'The wall: sorting answers it in O(n log n) by putting twins adjacent; a double loop costs O(n²). Both do more work than the question asks for.',
        'The turn: the question never mentions order or position — only membership. Sets answer "is k in here?" in O(1).',
        'The build: walk the array; if the value is already in the set, return true — otherwise add it. (The set-size one-liner also works, but only after consuming everything; the early exit is kinder to big inputs.)',
        'The check: each value inserted once, each lookup O(1) → O(n) time, O(n) space. Correct because the first re-insert is by definition the earliest duplicate.'
      ],
      trace: '1,2,3,1 → add 1, add 2, add 3, then 1 is already present → true.',
      edges: ['empty array → false', 'all-identical array → true at the second element'],
      asks: ['What if values are huge and sparse? (sort, or a bitset when the range is known)', 'What if the stream does not fit in memory? (windowed dedup, or a Bloom filter — with false positives)'],
      transfer: 'The set is the "seen?" machine: dedup, cycle detection, island marking. It returns in LC 128, LC 141, LC 547.'
    },
    lc238: {
      steps: [
        'For each position, multiply everything EXCEPT it. No division allowed — that ban is the whole problem.',
        'The wall: computing each product from scratch is O(n²). Division of the total product by each element is O(n) — but breaks on zeroes, and it is forbidden anyway.',
        'The turn: the answer at i factors as (product of everything left of i) × (product of everything right of i). Both factors can be accumulated in sweeps.',
        'The build: sweep left-to-right carrying a running prefix into the output array; sweep right-to-left multiplying a running suffix in. Two sweeps, no division, zeroes handled for free.',
        'The check: O(n) time; the output array is the only storage → O(1) extra. Correct because each output cell is touched by exactly one prefix value and one suffix value.'
      ],
      trace: 'nums = 1,2,3,4 → left pass writes 1,1,2,6; right pass multiplies by 24,12,4,1 → 24,12,8,6.',
      edges: ['one zero → every answer is 0 except the zero\'s own slot (total product of the rest)', 'two zeroes → all answers are 0'],
      asks: ['Do it with the prefix sweep storing into one variable and no output-until-later? (the two-variable version)', 'What if division were allowed but zeroes exist? (count zeroes first)'],
      transfer: 'Prefix/suffix decomposition: precompute what the left knows, what the right knows, combine. Siblings: trapping rain water, product trees, range queries.'
    },
    lc189: {
      steps: [
        'Move the last k entries to the front, order preserved — block surgery, not element shuffling.',
        'The wall: popping k elements one by one and unshifting them is O(n·k). A helper array is O(n) time but O(n) space — interviewers want in-place.',
        'The turn: a rotation is exactly two blocks trading places. Reversing the whole array puts both blocks in position — just internally backwards.',
        'The build: reverse all n, then reverse the first k, then reverse the rest. Each element is touched three times; the interior order of each block is restored by its own second reversal.',
        'The check: O(n) time, O(1) space, and k %= n first (rotating by n is a no-op).'
      ],
      trace: '1..7, k=3 → reverse all: 7,6,5,4,3,2,1 → reverse first 3: 5,6,7,4,3,2,1 → reverse rest: 5,6,7,1,2,3,4. Done.',
      edges: ['k ≥ n — take k modulo n', 'k = 0 or k = n — the array is untouched', 'single element — every reversal is a no-op'],
      asks: ['Why does the triple reverse work? Say the block-swap argument out loud.', 'How does a circular buffer avoid this cost entirely? (World 2\'s head index — never move data, move the meaning of front)'],
      transfer: 'Reversal as a block-swap primitive. Also: prefer moving an index over moving data — the circular queue lesson.'
    },
    lc128: {
      steps: [
        'Find the longest run of consecutive integers — the array order is irrelevant noise.',
        'The wall: sorting gives n log n and then one linear scan. Honest, but the question promises O(n) — the run structure must be findable without sorting.',
        'The turn: a run has exactly one START — the value x whose predecessor x−1 is absent. Find starts, then count upward.',
        'The build: pour everything into a set. For each x, skip it if x−1 is present (it is mid-run). Otherwise walk x, x+1, x+2… counting set hits; keep the best.',
        'The check: every element is visited at most twice (once as a candidate, once inside one run) → O(n) despite the nested loop. O(n) space for the set.'
      ],
      trace: '100,4,200,1,3,2 → set holds them; 100 has no 99 → run of 1; 4 has a 3 → skip; 1 has no 0 → walk 1,2,3,4 → run of 4.',
      edges: ['empty array → 0', 'all duplicates — the set collapses them first', 'negative runs cross zero — the set does not care'],
      asks: ['Why is the two-visit bound true? (each element belongs to exactly one run)', 'Union-find version? (union x with x+1 when both exist, then biggest component)'],
      transfer: 'Recognize "start points" to linearize. The set buys O(1) neighbor questions. Sibling: counting islands.'
    },
    lc146: {
      steps: [
        'A cache: O(1) reads and writes, with automatic eviction of the least-recently-used entry.',
        'The wall: an array or plain object gives O(1) lookup but eviction needs order; a list gives order but not lookup. Neither alone passes.',
        'The turn: compose the two — hash map for access, doubly-linked list for recency, with the map storing key → node.',
        'The build: get = look up node, unlink it, relink at the front. put = write, move to front; over capacity → delete the tail node AND its map entry. Eviction is O(1) because the tail is right there.',
        'The check: every operation is a constant number of pointer splices and one hash lookup → O(1) both. The JS version leans on Map iteration order as the list; say that out loud, then offer the explicit-node version.'
      ],
      trace: 'cap 2: put(1,1), put(2,2), get(1) → 1, put(3,3) evicts 2 (least recent), get(2) → −1.',
      edges: ['capacity 1 — every put evicts', 'updating an existing key must refresh recency, not just value'],
      asks: ['Implement LFU instead? (frequency buckets, same composition trick)', 'Why not a plain array splice? (splice is O(n) — the exact cost being dodged)'],
      transfer: 'Two structures composed: map for reach + list for order. The canonical design-composition answer — also the skeleton of LRU-ish memory managers.'
    },
    lc268: {
      steps: [
        'The numbers 0..n arrived, one went missing — find the ghost.',
        'The wall: sorting and scanning costs n log n; a set costs O(n) memory. Both ignore that the answer is forced by arithmetic.',
        'The turn: the expected sum 0+1+…+n = n(n+1)/2 is known. Expected − actual = the missing value. Or: XOR everything with 0..n — pairs cancel, the unpaired value is the ghost.',
        'The build: one running XOR over the array indices and values together; XOR in n at the end. No overflow, no memory.',
        'The check: O(n) time, O(1) space. Correct because XOR is its own inverse — every present value cancels against its index slot, leaving exactly the absent one.'
      ],
      trace: 'nums = 3,0,1: fold indices and values: 0^3, 1^0, 2^1, then 3 → only 2 survives.',
      edges: ['missing 0 — still works, the n term covers it', 'missing n — the final XOR-in of n handles it'],
      asks: ['Sum vs XOR — when does XOR win? (overflow-prone languages, huge n)', 'Two missing numbers? (XOR partition by lowest set bit)'],
      transfer: 'Invariants of the full set: sum or XOR makes absence measurable. The XOR-cancel lens returns in single-number problems.'
    },
    lc560: {
      steps: [
        'Count contiguous runs summing to exactly k.',
        'The wall: enumerating all runs is O(n²) — but every run sum is a DIFFERENCE of two prefix sums, so the real question is smaller.',
        'The turn: run j..i sums to k iff prefix(i) − prefix(j−1) = k, i.e. prefix(j−1) = prefix(i) − k. So at each i: how many EARLIER prefixes equal the current prefix minus k?',
        'The build: one map from prefix value → count of times seen, seeded with {0: 1}. Walk, update the running prefix, add the count of (prefix − k) to the answer, then register the current prefix.',
        'The check: O(n) with O(1) lookups, O(n) map. Correct because registering AFTER querying never counts the empty run, and the seed makes runs starting at index 0 countable.'
      ],
      trace: 'nums = 1,1,1, k=2: prefixes 1,2,3. At prefix 2, need 0 → seed gives 1. At prefix 3, need 1 → one hit. Answer 2.',
      edges: ['the seed {0:1} — forgetting it misses every run that starts at index 0', 'negatives — prefix sums are not monotone, which is exactly why the map (not two pointers) is the right tool'],
      asks: ['Why does the two-pointer window fail here? (negatives break monotonicity)', 'Count runs AT MOST k too? (two passes with ≤k and ≤k−1)'],
      transfer: 'Prefix sums turn range questions into point questions; the map counts the pairs. Sibling: LC 238\'s factorization of position.'
    },
    lc54: {
      steps: [
        'Walk the matrix clockwise from the top-left, visiting every cell exactly once.',
        'The wall: direction bookkeeping per step (turn when blocked) works but hides the structure; the fence version makes the invariants visible.',
        'The turn: the spiral is a shrinking rectangle — four fences (top, bottom, left, right). Each direction pass retires exactly one fence.',
        'The build: loop while fences have not crossed: walk the top fence left→right (top++), the right fence top→bottom (right−−), then — only if top ≤ bottom — the bottom fence right→left (bottom−−), and only if left ≤ right — the left fence bottom→top (left++).',
        'The check: O(rows·cols), each cell emitted once. The two guard ifs are the entire difficulty: without them a lone final row gets walked twice (once as top, once as bottom).'
      ],
      trace: '3×3 grid 1..9 → top pass 1,2,3; right pass 6,9; bottom pass 8,7; left pass 4; final top pass 5.',
      edges: ['single row — the bottom-pass guard skips it', 'single column — the left-pass guard skips it', 'empty matrix — return immediately'],
      asks: ['Generate the spiral instead of reading it? (same fences, write counters)', 'Counterclockwise? (rotate the fence order)'],
      transfer: 'Fences as explicit invariants — the same discipline as binary search bounds. Index hygiene is the problem.'
    },
    lc283: {
      steps: [
        'Push every zero to the end without disturbing the order of the non-zeroes.',
        'The wall: filtering into a new array plus re-padding zeroes is O(n) time but O(n) space — the in-place demand is the test.',
        'The turn: this is a one-sided partition: all non-zeroes stable-left, zeroes parked right. A write head makes it one pass.',
        'The build: write head w at 0. Walk with read head r; when the value at r is non-zero, swap into w and advance w. Zeroes left behind accumulate at the tail — swaps with zero-positions are harmless self-swaps at the start.',
        'The check: O(n), O(1). Stability holds because non-zeroes are written in read order and only ever swap with zeroes.'
      ],
      trace: '0,1,0,3,12 → r=1 swaps with w=0 → 1,0,0,3,12; r=3 swaps → 1,3,0,0,12; r=4 swaps → 1,3,12,0,0.',
      edges: ['all zeroes / no zeroes — both degenerate to the same loop', 'stability is graded: the 1,2 order must survive'],
      asks: ['Minimize writes? (only swap when w ≠ r)', 'Which world trains this? (W09 — it is quicksort\'s partition with one comparison)'],
      transfer: 'The stable partition skeleton — write head + read head. It IS the first half of quicksort and the engine of move-evens-first variants.'
    },
    lc167: {
      steps: [
        'Two entries of a SORTED array must sum to the target; report their 1-based positions.',
        'The wall: the hash map from LC 1 works, but ignores the gift in the statement: sortedness. Interviewers want you to spend it.',
        'The turn: at the two ends, the sum knows which way to move. Too small → only a bigger left helps. Too big → only a smaller right helps. Each comparison eliminates one element permanently.',
        'The build: left at 0, right at n−1. Compare; equal → done; too small → left++; too big → right−−. Loop while left < right.',
        'The check: at most n−1 steps → O(n) time, O(1) space. Correct because every discarded element provably cannot be in ANY valid pair with the remaining values.'
      ],
      trace: '2,7,11,15, target 9 → 2+15=17 too big, right−−; 2+11=13 too big; 2+7=9 → positions (1, 2).',
      edges: ['answers never reuse one index — left < right guards it', 'duplicates — the walk still lands on the first valid pair'],
      asks: ['Prove no pair is skipped (the elimination argument, said aloud).', '3 numbers? (fix one + this loop — LC 15\'s engine)'],
      transfer: 'Meet in the middle on sorted data. The same reflex drives container-with-most-water and 3Sum\'s inner loop.'
    },
    lc11: {
      steps: [
        'Pick two lines so width × shorter line holds the most water.',
        'The wall: all pairs is O(n²) — but most pairs are dominated and never needed.',
        'The turn: start widest. Width only shrinks from here, so the only hope of improvement is a taller shorter-side. Moving the TALLER line can never help (the min stays capped); moving the shorter might.',
        'The build: two ends; record area; move the pointer at the shorter line. Repeat until the pointers meet.',
        'The check: n−1 moves → O(n), O(1). Correct by the exchange argument: every skipped pair shares the shorter line with a pair already measured and no wider — so it cannot win.'
      ],
      trace: '1,8,6,2,5,4,8,3,7 → ends (1,7): area 8 → move left; (8,7): width 7 × min 7 = 49 — the winner.',
      edges: ['all equal heights — either pointer moves, same answer', 'two entries only — one candidate'],
      asks: ['Why is moving the taller line never better? (min is capped by the shorter — say it as a proof)', 'What does this share with LC 167? (endpoints that know which way to move)'],
      transfer: 'Greedy elimination with a provable exchange argument — the pattern of "the ends know".'
    },
    lc3: {
      steps: [
        'The longest stretch of characters with no repeats.',
        'The wall: restarting a set scan from every start is O(n²) — and rescans prefixes that never changed.',
        'The turn: candidate windows only need to SLIDE: when a repeat enters on the right, the left edge can jump past the PREVIOUS occurrence — everything before it is already irrelevant.',
        'The build: keep last-seen index per character. Extend r each step; if the character was seen at an index ≥ l, jump l to that index + 1. Record r − l + 1.',
        'The check: each pointer moves forward at most n times → O(n), O(k) charset space. l never moves backward because the seen-index check is gated by ≥ l.'
      ],
      trace: 'pwwkew → r hits the second w at index 2, l jumps to 2; window kew → length 3.',
      edges: ['the ≥ l guard — without it, an old occurrence outside the window drags l backward', 'empty string → 0', 'single repeated character → 1'],
      asks: ['Why amortized O(n)? (each cell is entered and left once — W02\'s argument)', 'What if the alphabet is bytes? (array of 256 slots, same logic)'],
      transfer: 'The non-decreasing window: two pointers with a purity condition. Siblings: longest cover window, at-most-k distinct.'
    },
    lc42: {
      steps: [
        'After rain, how much water sits in the valleys between the walls?',
        'The wall: per-cell "how much holds here?" seems to need both the left skyline and the right skyline — precomputing both arrays is O(n) time, O(n) space. The demand is O(1) space.',
        'The turn: water above a cell = min(tallest left, tallest right) − its height, if positive. And the side with the SMALLER running max is already decided — the other skyline cannot lower its min.',
        'The build: two pointers at the ends, two running maxes. Move the side with the smaller wall height: its water is computable NOW from its own max (the other side is provably at least as tall).',
        'The check: each step retires one cell → O(n), O(1). Correct because the retired side\'s min(left, right) equals its own running max.'
      ],
      trace: '0,1,0,2,1,0,1,3,2,1,2,1 → the two running maxes settle each valley as the pointers close; total 6.',
      edges: ['monotone heights — zero water', 'single wall — nothing to hold against'],
      asks: ['Say the "smaller side is decided" proof in one sentence.', 'Stack version? (a monotonic stack catches water horizontally, layer by layer)'],
      transfer: 'Two running maxes replace two arrays — the same collapse as LC 238\'s rolling products. Precompute-then-fold is a reusable reflex.'
    },
    lc15: {
      steps: [
        'Every triple summing to zero, listed once each.',
        'The wall: three nested loops is O(n³); hashing the inner pair gives O(n²) with awkward dedup — and dedup is half the problem.',
        'The turn: sort first. Sortedness makes dedup a neighbor check AND makes the pair search the two-pointer walk of LC 167.',
        'The build: for each anchor i (skip if equal to the previous anchor), run two pointers on the tail: sum zero → emit, then skip equal neighbors on both sides; sum < 0 → left++; sum > 0 → right−−.',
        'The check: O(n²) total (n anchors × n walks), O(1) beyond the sort. Correct because sorted triples are emitted in canonical order and the skip-checks visit each value-run once.'
      ],
      trace: '−1,0,1,2,−1,−4 → sorted −4,−1,−1,0,1,2: anchor −4 finds nothing; anchor −1 (first) pairs with 0,1 ✓; the second −1 is skipped; anchor 0 finds nothing.',
      edges: ['duplicate anchors and duplicate pointer values — the two skip loops', 'fewer than 3 entries → empty'],
      asks: ['Extend to 4Sum? (sort + nested anchors + the same pair walk — say the complexity)', 'Can you beat O(n²)? (no known general sub-quadratic — fine to say)'],
      transfer: 'Sort + anchor + two pointers = the k-Sum machine. Dedup by neighbor-skip, not by a set of triples.'
    },
    lc125: {
      steps: [
        'Ignoring case and punctuation: does the text read the same in both directions?',
        'The wall: building the reversed normalized string and comparing is O(n) and honest — but two pointers on the original do it in one pass with no copy.',
        'The turn: a palindrome is symmetric about its center, so matching ends inward is a complete test.',
        'The build: normalize (lowercase, keep alphanumerics only), then walk two indices from the ends; any mismatch ends the trial.',
        'The check: O(n), space is the normalized copy (O(1) if you skip non-letters in place).'
      ],
      trace: 'race a car → normalized raceacar: r=r, a=a, c=c, then e ≠ a → false.',
      edges: ['strings that normalize to empty → true', 'digits count as characters'],
      asks: ['Do it with zero extra space? (skip non-alphanumerics during the pointer walk)', 'What does LC 5 add on top? (find the longest, not just verify)'],
      transfer: 'Symmetry test by inward pointers — the verification half of every palindrome problem.'
    },
    lc424: {
      steps: [
        'Within one window, change at most k characters — find the longest window that can be made uniform.',
        'The wall: trying every window × every candidate letter is O(n²·26). The window does not know which letter it would become.',
        'The turn: the best letter for a window is its most frequent one. So a window is fixable iff length − dominant count ≤ k. And the dominant count only needs to be tracked, not perfectly.',
        'The build: extend r, update the letter counts and the running dominant. While length − dominant > k, retire the left edge. Record the best length.',
        'The check: O(n) (the left edge only moves forward), O(26). The subtle point: the dominant may be STALE after shrinking — harmless, because a longer window can only form when a new true dominant appears; the stale value merely keeps the window from shrinking below its record.'
      ],
      trace: 'AABABBA, k=1 → window AABA (dom 3, 4−3 ≤ 1 ✓) length 4; extending to AABAB breaks it (5−3 > 1) → shrink.',
      edges: ['the stale-dominant argument — interviewers probe it directly', 'k = 0 → longest run of one character', 'k ≥ the gaps → the whole string'],
      asks: ['Prove the stale dominant never over-admits. (the window only grows past its record on a true new dominant)', 'Why not recompute the dominant per step? (O(26n) — fine, but say the trade)'],
      transfer: 'The non-shrinking window: record lengths only grow. Sibling: LC 76 — the same skeleton with a covering condition instead.'
    },
    lc76: {
      steps: [
        'The shortest chunk of s that contains every character of t, with multiplicity.',
        'The wall: for each start, scanning forward until covered is O(n²). The covering test itself must become O(1).',
        'The turn: need-counts plus ONE integer "missing" (characters still owed). A window covers t iff missing = 0 — no rescans.',
        'The build: expand r; a character still owed (need > 0) decrements missing; decrement its need either way. When missing = 0, shrink from the left while the cover holds: retiring a character that pushes its need above zero adds to missing and ends the cover. Record the best window at every covered moment.',
        'The check: each pointer moves at most n times → O(|s| + |t|). Correct because every cover is evaluated at its tightest left edge.'
      ],
      trace: 'ADOBECODEBANC / ABC → first cover at ADOBEC (len 6); later cover BANC (len 4) wins.',
      edges: ['t longer than s → empty', 'duplicates in t matter (two As owed)', 'characters outside t just ride along'],
      asks: ['Why one integer for missing, not a per-character scan?', 'Variant: window with at least k of each? (threshold counters)'],
      transfer: 'The cover-condition window: expand to satisfy, shrink to optimize. The hardest member of the family LC 3 started.'
    }
  });
})();
