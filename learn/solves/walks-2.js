/* ============================================================
   ULTRON LAB · solves/walks-2.js — the Solve Hall, volume 2.
   Binary search + stacks + linked lists.
   ============================================================ */
(function () {
  'use strict';
  window.ULTRON_WALKS = Object.assign(window.ULTRON_WALKS || {}, {
    lc704: {
      steps: [
        'The canonical find-in-sorted: locate the target or report absence.',
        'The wall: a linear scan ignores sortedness and pays O(n). The structure promises: every comparison can discard half the candidates.',
        'The turn: maintain the invariant — IF the target exists, it lies within the current window. Compare the middle value; one side becomes provably impossible.',
        'The build: lo and hi inclusive. Probe the middle; equal → return; too small → lo = probe+1; too big → hi = probe−1. Loop while lo ≤ hi.',
        'The check: window halves each step → O(log n), O(1). Correct because the invariant survives every update — and the loop ends exactly when the window is empty (absent).'
      ],
      trace: '−1,0,3,5,9,12, target 9 → probe 3 (too small) → probe 4 → hit.',
      edges: ['the ±1 on both bounds — the classic off-by-one farm', 'two-element windows — where boundary bugs surface', 'empty array → loop never runs → −1'],
      asks: ['State the invariant in one sentence before writing anything.', 'Which variant breaks if you compute the middle as (lo+hi)/2? (overflow in fixed-width languages)'],
      transfer: 'The halving window with a spoken invariant. Every problem below is this shape wearing a costume.'
    },
    lc33: {
      steps: [
        'A sorted array was rotated at an unknown pivot — the target still needs O(log n).',
        'The wall: find-the-pivot then two binary searches works, but walks the array twice and misses the one-pass elegance.',
        'The turn: split ANY window of a rotated array at its middle: at least one half is still perfectly sorted. One endpoint comparison identifies which; one range check decides whether the target can live there.',
        'The build: standard window, but at each probe: if the left half is sorted and the target fits its range → go left; else if the right half is sorted and fits → go right; otherwise go to the messy half anyway (it is now the only option).',
        'The check: still one halving per step → O(log n). Correct because the "fits the sorted half" test never sends the search somewhere the target provably is not.'
      ],
      trace: '4,5,6,7,0,1,2, target 0 → probe 7: left half sorted (4..7), 0 outside → right; probe 1: left half 0,1 sorted? window 0,1,2, 0 fits → probe hits 0 at index 4.',
      edges: ['the equals-comparison on window ends decides the sorted half', 'no rotation at all — the logic still works', 'single element'],
      asks: ['Why must one half always be sorted? (a rotation breaks order exactly once)', 'What if duplicates are allowed? (worst case degrades to O(n) — say why)'],
      transfer: 'Identify the clean half, range-test the target, recurse. The same split discipline powers rotated-array-min and search-in-2D.'
    },
    lc74: {
      steps: [
        'A matrix whose every row is sorted, and every row starts after the previous row ends — one long sorted rope, folded.',
        'The wall: per-row binary search is O(rows · log cols) — fine, but the folding property promises better.',
        'The turn: the fold makes the matrix a single sorted sequence of rows·cols values. Index that virtual sequence 0..rc−1 and binary search the flattened view — no flattening needed.',
        'The build: probe a virtual index t: row = t / cols, col = t % cols. Compare against that cell; halve as usual.',
        'The check: O(log(rows·cols)) = O(log rows + log cols), O(1) space. Correct because the virtual sequence is monotone by the two given properties.'
      ],
      trace: '3×4 matrix, target 13: 12 virtual slots; probe 5 → row 1 col 1… converge to 13.',
      edges: ['the two properties must BOTH hold — otherwise the flattening lies', 'single row / single column — degenerates to plain binary search'],
      asks: ['What if only rows are sorted (no row-to-row property)? (staircase search from a corner, O(rows+cols))', 'Why is modulo arithmetic the whole problem?'],
      transfer: 'Map an unfamiliar shape onto the one you already trust. The staircase variant is the sibling worth knowing.'
    },
    lc69: {
      steps: [
        'Integer square root: the largest r whose square does not exceed x.',
        'The wall: Newton\'s method converges fast but needs a convergence argument; iterating r from 1 is O(√x).',
        'The turn: the predicate "r² ≤ x" is TRUE for a prefix of the integers and false after — a monotone boundary. Binary search the BOUNDARY, not an array.',
        'The build: window 1..x/2+1 (guard x < 2 separately). Probe, square, adjust. Return the last true position.',
        'The check: O(log x), O(1). Correct because the last true is exactly the floor of the root.'
      ],
      trace: 'x = 8: probes 2 (4 ≤ 8 ✓), then 3 (9 > 8 ✗) → answer 2.',
      edges: ['x = 0 and x = 1 — the guard clause', 'perfect squares — the early return', 'huge x — squaring the probe can overflow fixed-width languages (use long / BigInt)'],
      asks: ['Name the genre: search over the ANSWER space. Which other problems are this? (split-array-largest-sum, kth-smallest-in-matrix, LC 410)', 'Newton\'s version? (iterate r = (r + x/r)/2 from r = x — fewer steps, needs a stopping rule)'],
      transfer: 'When a value is hard to compute but easy to VERIFY, binary search the answer. One of the five great interview reframings.'
    },
    lc50: {
      steps: [
        'Compute x to the power n quickly, negatives included.',
        'The wall: n−1 multiplications is O(n) — for n = 2³¹ that is billions of steps.',
        'The turn: x^(2k) = (x²)^k — every squaring halves the exponent. The answer multiplies in the base only at the SET BITS of n.',
        'The build: walk the bits of |n| from the bottom: if the current bit is set, multiply the answer by the running base; square the base each step. Negative n: invert x once up front.',
        'The check: O(log n) steps, O(1) space. Correct by the binary expansion of n: n = Σ 2^i over set bits, so x^n = the product of x^(2^i) at exactly those bits.'
      ],
      trace: 'x=2, n=10 (binary 1010): bits set at 8 and 2 → answer = 2^8 · 2^2 = 256 · 4 = 1024.',
      edges: ['n = 0 → 1', 'negative n and x = 0 — undefined; guard if asked', 'n = the most negative integer — |n| overflows in fixed-width; the bit-walk with unsigned shift survives it'],
      asks: ['Why is this the same lesson as binary search? (halving the problem per step)', 'Matrix exponentiation? (same loop with matrix multiply — Fibonacci in O(log n))'],
      transfer: 'Halving applied to exponents. Siblings: fast Fibonacci, modular power in cryptography — the same loop everywhere.'
    },
    lc20: {
      steps: [
        'Are the brackets in the string properly nested and matched?',
        'The wall: counting each kind separately fails on interleaving: "([)]" has balanced counts but bad nesting.',
        'The turn: the most recently opened bracket must be the first closed — LIFO. A stack IS the rule.',
        'The build: openers push; a closer must equal the TOP of the stack, then pops. Any mismatch or a leftover stack at the end → false.',
        'The check: O(n) with each character pushed/popped at most once, O(n) worst-case space. Correct because the stack always holds exactly the currently-open obligations.'
      ],
      trace: '([)] → push (, push [, then ) needs ( but sees [ → false. ([]) wait — "([])": push (, push [, ] matches [ pop, ) matches ( pop → true.',
      edges: ['closers arriving on an empty stack', 'leftover openers at the end', 'empty string → true'],
      asks: ['Multiple bracket kinds vs one — what changed? (nothing but the match table)', 'What does the stack depth measure? (maximum nesting depth)'],
      transfer: 'Stack = deferred obligations, newest first. The grammar-walk family: decode string, asteroid collision, valid sequences everywhere.'
    },
    lc155: {
      steps: [
        'A stack that can also report its CURRENT MINIMUM in O(1), alongside push and pop.',
        'The wall: scanning for the min on demand is O(n); storing one min breaks the moment it is popped off.',
        'The turn: the min is a function of the stack PREFIX — each state must remember the min of everything below it. Pair every value with the min at its time.',
        'The build: push (value, min(value, previous min)). Pop removes the pair — the min below is untouched, already recorded. getMin reads the top pair.',
        'The check: O(1) per operation, O(n) space (or one clever stack of deltas for O(1) extra-per-element). Correct because each pair is a complete summary of its prefix.'
      ],
      trace: 'push 5 (min 5), push 3 (min 3), push 7 (min 3) → pop removes 7, min still 3; pop removes 3, min back to 5.',
      edges: ['popping the minimum itself — the pair carries the restoration', 'duplicates of the min — min(value, prev) keeps them'],
      asks: ['The delta-encoding version? (store value − min; sign flips flag a new min)', 'What does this teach about state? (the answer must be IN the structure, not recomputed)'],
      transfer: 'Carry the summary with the state — prefix-min pairs. The same idea powers range-min via sparse tables and monotonic stacks.'
    },
    lc150: {
      steps: [
        'Postfix notation: operators FOLLOW their operands — evaluate the expression.',
        'The wall: there is no wall — this is the payoff problem. But trying to parse left-to-right without a stack goes nowhere, because an operator\'s operands are whatever came before it.',
        'The turn: in postfix, when an operator arrives, its two operands are the two most recent results — sitting exactly on top of a stack.',
        'The build: numbers push; an operator pops two (order matters — second pop is the LEFT operand), computes, pushes the result. The final stack top is the answer.',
        'The check: O(n), each token handled once. Correct because postfix is precisely the order a stack machine consumes.'
      ],
      trace: '2 1 + 3 * → push 2, push 1, + → 3; push 3, * → 9.',
      edges: ['operand ORDER for − and / — the second pop is the left side', 'single number (no operators) → that number', 'division truncation direction (toward zero in the classic)'],
      asks: ['Convert infix to postfix? (shunting-yard — the same stack, holding operators instead)', 'Why did calculators love postfix? (no parentheses, no precedence state)'],
      transfer: 'The stack machine — evaluation as push/pop discipline. It IS the calculator you built in the Build-X labs\' parser, inverted.'
    },
    lc739: {
      steps: [
        'For every day, how many days until a WARMER one arrives?',
        'The wall: for each day scanning forward is O(n²) — and re-answers "is tomorrow warmer?" redundantly.',
        'The turn: a day that stays unresolved while a colder day arrives is still unresolved — keep those pending days on a stack. When a warm day arrives, it resolves EVERYTHING waiting below it that it beats.',
        'The build: stack of indices with pending answers. Each new temperature pops (and answers) all indices with strictly colder records; then pushes itself. Leftovers at the end → 0.',
        'The check: each index is pushed once and popped at most once → O(n), O(n) space. Correct because a day is answered exactly at the first warmer arrival — the pop condition is that arrival.'
      ],
      trace: '73,74,75,71,69,72,76,73 → 74 resolves 73; 71,69 wait; 72 resolves 69 and 71; 76 resolves 75 and 72; leftovers → answer 1,1,4,2,1,1,0,0.',
      edges: ['strictly warmer (equal does not resolve)', 'non-increasing temperatures — everything waits, all answers 0 except the tail', 'the answer for unresolved days defaults to 0'],
      asks: ['This stack has a shape — what is it? (indices with DECREASING temperatures: a monotonic stack)', 'Solve largest-rectangle-in-histogram with the same shape? (yes — that is LC 84)'],
      transfer: 'Monotonic stack: keep only the still-possible, resolve in bulk on arrival. The next-greater family and histogram problems are all this one.'
    },
    lc84: {
      steps: [
        'Bars of given heights: find the largest rectangle that fits inside them.',
        'The wall: every pair of bars × the min height between them is O(n²).',
        'The turn: a rectangle is pinned by some bar at its FULL height — so ask, for each bar: how far does it extend left and right before a SHORTER bar blocks it? Those extents are next-shorter questions — monotonic stack.',
        'The build: stack of bar indices with increasing heights. A new bar shorter than the stack top pops it: the popped bar\'s rectangle ends here (right block known), and its left block is the new stack top. Width = current index − left block − 1.',
        'The check: each bar pushed and popped once → O(n). Correct because every bar\'s maximal rectangle is computed exactly once, at the moment it is popped.'
      ],
      trace: '2,1,5,6,2,3 → 6 extends over 5 (area 10); 2 extends over the 5,6 block (width 3, area 6); the 1 at the end extends over everything (area 6) — winner 10.',
      edges: ['equal heights — pop-or-not conventions both work if consistent', 'append a sentinel 0 to flush the stack', 'all-increasing heights — the stack drains only at the sentinel'],
      asks: ['Why is each bar\'s answer found at its POP moment?', 'The divide-and-conquer alternative? (min bar splits the range — O(n log n) expected)'],
      transfer: 'The monotonic stack at full power: next-greater on BOTH sides. Sibling: maximal rectangle in a binary matrix — row by row, this exact problem.'
    },
    lc394: {
      steps: [
        'Expand run-length-encoded nests: 3[a2[c]] must become acc acc acc.',
        'The wall: recursion depth is arbitrary and the string must be built left to right — a single pass with no memory gets lost at every closing bracket.',
        'The turn: an opening bracket INTERRUPTS work. Stacks exist to park interrupted work: push (string-so-far, pending count), start fresh.',
        'The build: digits accumulate into the pending count (multi-digit safe). An opener parks the context. Letters append. A closer pops, multiplies the finished inner string, appends to the restored context.',
        'The check: O(output length), O(depth) space. Correct because inner segments finish before outer ones — the LIFO order matches nesting exactly.'
      ],
      trace: '3[a2[c]] → park ("",3); a; park ("a",2); c; close → "cc"; close → "a"+"cc" ×3 → accaccacc.',
      edges: ['multi-digit counts (12[ab])', 'bare letters outside brackets', 'deep nesting — the stack, not recursion depth, holds it'],
      asks: ['Same skeleton as valid parentheses? (yes — brackets toggle park/restore)', 'Why does a recursive-descent parser solve it too? (it is a grammar — compare with the Build-X calculator)'],
      transfer: 'Stack of interrupted contexts. Parsing anything nested — JSON, HTML, arithmetic — parks and restores exactly like this.'
    },
    lc206: {
      steps: [
        'Reverse a singly-linked list, in place.',
        'The wall: copying values into an array and back is cheating on the pointers — the exercise IS the pointer surgery. And losing the tail mid-splice leaks the rest of the list.',
        'The turn: walk with two hands: the already-reversed prefix and the untouched remainder. One node at a time crosses over.',
        'The build: prev = null, cur = head. Loop: stash cur.next; point cur.next at prev; slide prev = cur, cur = the stash. Return prev (the last node visited).',
        'The check: n steps, O(1) space. Correct because the stash happens BEFORE rewiring — the remainder is never lost.'
      ],
      trace: '1→2→3: cur 1 → 1→null; cur 2 → 2→1; cur 3 → 3→2→null. Return 3.',
      edges: ['empty list → null', 'the stash line is the entire problem — reorder it and the list leaks', 'recursive version costs O(n) stack — say the trade'],
      asks: ['Reverse a sub-range only? (LC 92 — same splice with careful entry/exit)', 'Why does every linked-list bug trace back to a lost reference?'],
      transfer: 'The three-line pointer rotation — the "swap" of list-land. Every list problem below builds on it.'
    },
    lc21: {
      steps: [
        'Two sorted lists → one sorted list, by splicing nodes, not copying.',
        'The wall: collecting values, sorting, rebuilding a list works but ignores the given order — the promise of sortedness must be spent.',
        'The turn: the smallest remaining node overall is the smallest of the two heads — one comparison decides the next splice.',
        'The build: a dummy head anchors the output; a tail pointer splices the smaller head forward and advances that list. When one list empties, append the other whole.',
        'The check: O(n + k) total nodes walked, O(1) space. Correct because each splice takes the globally smallest remaining node.'
      ],
      trace: '1→4 and 2→3: take 1, take 2, take 3, take 4 → 1→2→3→4.',
      edges: ['one list empty — append the other', 'the dummy head removes every "is this the first node" special case', 'shared tails — appending the remainder is one pointer, not a loop'],
      asks: ['K lists? (LC 23 — the heap does for k heads what comparison did for 2)', 'Recursive merge? (same comparison, O(n) stack)'],
      transfer: 'The merge step of merge sort, pointer edition. Two-structures comparison generalizes to a heap of cursors.'
    },
    lc141: {
      steps: [
        'Does the list loop back on itself anywhere?',
        'The wall: hashing every visited node is O(n) time and O(n) space — but a corrupted list may be INFINITE, so "just walk to the end" does not terminate.',
        'The turn: two runners, one twice as fast. On a loop, the fast runner laps the slow one — they MUST meet. On a straight list, the fast one simply falls off the end.',
        'The build: slow = fast = head; advance slow one, fast two; if they ever land on the same node → cycle. Fast hitting null → no cycle.',
        'The check: O(n) time, O(1) space. Correct because on a loop of length L, the gap between runners shrinks by 1 (mod L) each step — it must hit exactly zero.'
      ],
      trace: 'a→b→c→b: slow a,b; fast b,c? positions — slow walks a,b,c; fast laps and meets at c.',
      edges: ['empty list / single self-looped node', 'the meet point is NOT the loop start (that is LC 142 — a second walk from head, meet where they sync)', 'never test fast === slow BEFORE moving — head is a false positive'],
      asks: ['Prove the gap must close. (mod-L arithmetic — say it)', 'Find the loop START in O(1) space? (Floyd: after meeting, walk two pointers — head and meet — one step each; they meet at the entrance)'],
      transfer: 'Floyd\'s tortoise-and-hare: two speeds on any cyclic structure must collide. The same trick finds duplicate numbers (LC 287).'
    },
    lc138: {
      steps: [
        'Each node has a next AND a random pointer — clone the whole graph-of-two-pointers.',
        'The wall: two passes fail if done naively — building new nodes first loses the mapping from old nodes to their clones, and random pointers need that mapping to be resolvable.',
        'The turn: interleave the copies with the originals — old.next = clone — so the mapping is the list itself. No map needed.',
        'The build: pass 1: clone each node in place after it. Pass 2: set each clone\'s random = the original\'s random .next (its clone). Pass 3: unweave — split the interleaved list back into two.',
        'The check: three passes, O(n) time, O(1) extra space (beyond the output). The hash-map version is O(n) space — say both, land the interleaved one.'
      ],
      trace: 'A(random=C)→B(random=A) → A→A\'→B→B\' → A\'.random = C\' via A.random.next → unweave.',
      edges: ['random pointing at the node itself', 'random = null', 'unweaving must restore the ORIGINAL list, not just extract the copy'],
      asks: ['Why is the map version the one to code first under pressure? (simpler, O(n) space)', 'What is the real lesson? (identity vs value — the mapping problem behind every deep copy)'],
      transfer: 'Deep copy = identity bookkeeping. The interleave trick reappears in graph cloning (LC 133) with a map instead.'
    },
    lc19: {
      steps: [
        'Delete the n-th node from the END — ideally in one pass.',
        'The wall: two passes (count, then walk) is honest O(n) — but the one-pass version is the interview point.',
        'The turn: keep two pointers exactly n+1 apart. When the front one falls off the end, the back one stands ONE BEFORE the victim.',
        'The build: dummy head, front walks n+1 steps first; then both walk in lockstep; unlink back.next. The dummy erases the delete-the-head special case.',
        'The check: one pass, O(1) space. Correct because the gap is maintained constant — the back pointer is always n+1 behind.'
      ],
      trace: '1→2→3→4→5, n=2 → front reaches past 5 with gap 3; back at 3 → unlink 4 → 1→2→3→5.',
      edges: ['deleting the head — the dummy absorbs it', 'n equal to the length', 'gap of n+1 (not n) — the back pointer must land one BEFORE'],
      asks: ['Why a dummy head? (head deletion stops being special)', 'Two-pass version? (count, then walk length−n — say it, then improve it)'],
      transfer: 'The fixed-gap two-pointer walk — distance instead of speed. Sibling: LC 141 uses speed; this uses distance.'
    },
    lc2: {
      steps: [
        'Two numbers, digits stored in reverse order — add them, digit lists out.',
        'The wall: converting to integers breaks on big numbers (the point of digit lists), and forward storage would misalign columns.',
        'The turn: the reversal is a gift — heads are ones digits, so the walk IS column addition: digit + digit + carry.',
        'The build: walk both lists in lockstep; emit ones digit of the sum; carry the rest. Continue while ANY list has digits OR carry survives.',
        'The check: O(max lengths), O(1) beyond the output. The while-carry clause grows the result by one digit for the 999+1 case.'
      ],
      trace: '2→4→3 (=342) + 5→6→4 (=465): 2+5=7, 4+6=10 → 0 carry 1, 3+4+1=8 → 7→0→8 (=807).',
      edges: ['unequal lengths — the (a or 0) defaults', 'final carry — the loop condition that grows the answer', 'both zero → single 0 node'],
      asks: ['What if the digits were stored FORWARD? (reverse first, or recurse from the far end)', 'Where else does carry-as-third-addend appear? (adder circuits, big-int libraries — you built one in Build-X)'],
      transfer: 'Lockstep walking with a carried state. The reverse-order lesson: storage layout chosen to make the algorithm trivial.'
    }
  });
})();
