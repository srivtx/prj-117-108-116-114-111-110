/* ============================================================
   ULTRON LAB · solves/walks-3.js — the Solve Hall, volume 3.
   Trees + heaps & priority queues + sorting.
   ============================================================ */
(function () {
  'use strict';
  window.ULTRON_WALKS = Object.assign(window.ULTRON_WALKS || {}, {
    lc226: {
      steps: [
        'Mirror a binary tree: every left child trades places with its right child, recursively, everywhere.',
        'The wall: there is no wall — this is the "do you speak tree recursion" screen. The only trap is half-mirroring (copying instead of swapping).',
        'The turn: a mirror is self-similar — mirror the subtrees, then swap them (or swap, then mirror — either order works).',
        'The build: at each node: recurse left, recurse right, swap the two child pointers, return the node. Iterative version: a queue/stack, swapping children of each visited node.',
        'The check: every node touched once → O(n), O(depth) recursion space. Correct because the recursion IS the definition of mirror.'
      ],
      trace: 'root 4 with children 2,7 → mirror(2) mirrors 1,3; mirror(7) mirrors 6,9; swap → 7,2 with their mirrored subtrees.',
      edges: ['empty tree → empty', 'single node → itself', 'swap AFTER the recursive calls — or before; just be consistent'],
      asks: ['Iterative version? (queue swap — the World 6 level-order walk with a swap inside)', 'Why is the Homebrew-bumper-sticker version (swap first, recurse after) equally correct?'],
      transfer: 'The tree-recursion template: solve for children, combine at the node. Every problem below is this plus one idea.'
    },
    lc94: {
      steps: [
        'List the values in sorted order — the tree claims to be a search tree.',
        'The wall: collecting and sorting ignores the tree\'s promise: the ORDER IS ALREADY IN THE SHAPE.',
        'The turn: for a BST, left < node < right — so visiting left, then the node, then right yields sorted order by construction. That visiting order is "in-order."',
        'The build: recursive in-order walk, appending values. The iterative version: go left pushing every node, then pop-visit-right — an explicit stack replaces the call stack.',
        'The check: O(n), O(depth) space. Correct because the visit rule mirrors the BST invariant at every subtree.'
      ],
      trace: '5 with left 3 (children 2,4): visit 2 → 3 → 4 → 5 → right subtree → sorted.',
      edges: ['empty tree → empty list', 'the iterative version must push left all the way down first', 'if the tree is NOT a valid BST, in-order is just "some order" — the invariant is the sort'],
      asks: ['In/pre/post — which orders are useful for what? (in: sorted; pre: copies/serialization; post: freeing/evaluating)', 'Recover a BST swapped at two nodes? (LC 99: in-order, find the two misplacements)'],
      transfer: 'Traversal orders as data extraction. World 6 lets you run all three by hand — the muscle memory for this whole family.'
    },
    lc102: {
      steps: [
        'Group the tree\'s values floor by floor — a top-to-bottom sweep.',
        'The wall: DFS with depth tracking works (append at depth index) — but the natural tool is a queue, because floors are processed in arrival order.',
        'The turn: a queue processes nodes in exactly the order a level reads — everything at depth d enters before anything at depth d+1.',
        'The build: queue seeded with the root; process the ENTIRE current queue as "one level" (snapshot its length, pop exactly that many), pushing children; collect each batch.',
        'The check: each node enters and leaves the queue once → O(n), O(widest level) space. Correct because children enqueue strictly after their entire level.'
      ],
      trace: '3 with children 9, 20 (children 15, 7) → level 3; level 9, 20; level 15, 7.',
      edges: ['the length-snapshot — popping until the queue empties mixes levels', 'empty tree → empty list', 'zigzag variant — reverse every other batch'],
      asks: ['Average-of-levels? Right-side view? (same walk, different per-batch reduction)', 'When does DFS-with-depth beat BFS? (when memory is tight and the tree is wide)'],
      transfer: 'Level = queue batch. The snapshot-the-length trick is the pattern; it returns in shortest-path, rotting oranges, and Word Ladder.'
    },
    lc98: {
      steps: [
        'Is the tree REALLY a search tree — every left-descendant below, every right-descendant above?',
        'The wall: checking only immediate children is too weak — a deep left-subtree right-branch can exceed the root while satisfying its own parent.',
        'The turn: every node inherits a valid INTERVAL (lo, hi) from its ancestors: going left tightens the ceiling to the node\'s value; going right tightens the floor.',
        'The build: recurse carrying (lo, hi); each node must sit strictly inside its interval; children get narrowed intervals. Null accepts everything.',
        'The check: O(n), O(depth). Correct because the interval chain is exactly the accumulated constraint of all ancestors.'
      ],
      trace: '5 / 4 / 6 / 3, 7: node 3 under 6 under 4-right-of-5 → 3 must exceed 5 (its root-interval floor) → false, even though 3 < 6.',
      edges: ['equal values — the strict/allow-equal convention must be stated', 'the classic counterexample tree where every PARENT-child pair is fine', 'integer extremes as initial bounds — or ±Infinity'],
      asks: ['Alternative: in-order must be strictly increasing — argue why. (a valid BST in-order IS sorted, and only then)', 'What does the interval version give you that in-order does not? (early exit, one pass, no list)'],
      transfer: 'Ancestral constraints as intervals — state is inherited context. The same "carry the bounds down" pattern validates heaps, segment trees, and Sudoku boards.'
    },
    lc235: {
      steps: [
        'Find the deepest node that has both p and q as descendants (or IS one of them).',
        'The wall: a general-tree LCA needs parent pointers or a post-order both-found walk. A BST has structure to spend.',
        'The turn: walk from the root. If both targets are SMALLER, go left; both LARGER, go right; the first SPLIT (or an exact hit) is the fork where the paths diverge — that node is the LCA.',
        'The build: iterative descent comparing p and q to the current node. The first node where they do not both lie on one side is the answer.',
        'The check: O(depth) — one root-to-fork path, O(1) space. Correct because the LCA is by definition the last common node on the two root paths, and BST comparisons trace those paths.'
      ],
      trace: 'root 6, p=2, q=8 → both sides → 6 itself. p=2, q=4 → both < 6 → left to 2... p equals node → 2 is the LCA.',
      edges: ['p or q EQUALS the current node — that node is the answer', 'p is q\'s ancestor', 'values guaranteed distinct in the classic'],
      asks: ['General binary tree, no BST? (post-order: return self if both subtrees report, bubble the found one)', 'Distance between two nodes? (root-paths minus 2×root-LCA-path)'],
      transfer: 'BST comparisons as path-tracing. The descent IS the answer — no marking, no recursion needed.'
    },
    lc230: {
      steps: [
        'The k-th smallest value in a BST.',
        'The wall: flatten everything with an in-order walk and index — O(n) always, even when k is 3.',
        'The turn: in-order enumerates values in ASCENDING order — so the k-th visit IS the answer. Stop there.',
        'The build: in-order walk with a countdown; when the countdown hits zero at a node, return it. The iterative stack version stops cleanly mid-walk.',
        'The check: O(depth + k) — visits only what it needs, O(depth) space. Correct because in-order emits sorted values, so the k-th emission is the k-th smallest.'
      ],
      trace: '5 / 3(2,4) / 6, k=2 → in-order emits 2, then 3 → stop: answer 3.',
      edges: ['k=1 → the leftmost node only', 'k = n → full walk', 'iterative early-exit — the recursive version needs a sentinel to stop'],
      asks: ['What if the tree is edited between queries? (augment each node with subtree size → O(depth) k-th queries)', 'Why is the iterative version the better interview answer? (the early exit is explicit)'],
      transfer: 'In-order as a lazy sorted stream. Countdown-instead-of-collect is the difference between O(k) and O(n).'
    },
    lc105: {
      steps: [
        'Rebuild the tree from its preorder (root first) and in-order (left, root, right).',
        'The wall: the preorder alone cannot say what is left vs right of the root. The in-order alone cannot say which node roots the whole thing.',
        'The turn: together they split cleanly: preorder[0] is the root; find it in the in-order — everything left of that position is the left subtree, everything right is the right subtree; the sizes tell you how to slice the rest of the preorder.',
        'The build: recursive: take root from preorder, locate it in in-order (a value→index map makes this O(1)), slice both arrays by the left-size, recurse. ',
        'The check: each node located once → O(n) with the map, O(depth) recursion. Correct because the two views cross-check each other at every subtree.'
      ],
      trace: 'pre 3,9,20,15,7 / in 9,3,15,20,7 → root 3; left size 1 → left subtree pre 9; right pre 20,15,7 with in 15,20,7 → root 20…',
      edges: ['the value→index map — rescanning in-order is O(n²)', 'duplicates — classic guarantees distinct values (say why: the index map cannot disambiguate)', 'empty slices signal leaves'],
      asks: ['Postorder + in-order? (mirror the idea: root at the END of postorder)', 'Preorder + postorder alone? (ambiguous unless the tree is full — a famous counterexample)'],
      transfer: 'Two views, one structure — partition by the anchor each time. The same split logic underpins quicksort\'s recursion and segment-tree builds.'
    },
    lc124: {
      steps: [
        'The highest-value path through the tree — any connected run of nodes, at most one bend at each node.',
        'The wall: the best path THROUGH the root is left-gain + root + right-gain; but a path cannot visit a node and go back down twice. The global answer may live anywhere; the per-node computation must not over-connect.',
        'The turn: separate two numbers at each node — the best PATH ENDING HERE (extendable by a parent: root + max(one child\'s extendable, 0)) versus the best CLOSED path HERE (left gain + root + right gain, not extendable). Only the first may bubble upward.',
        'The build: post-order recursion returning the extendable gain; at each node compute the closed value and update the global best. Negative gains are truncated to zero (drop the subtree).',
        'The check: O(n), O(depth). Correct because the two-value discipline exactly encodes "a path bends at most once per node."'
      ],
      trace: '−10 / 9, 20(15,7): at 20: left gain 15, right 7 → closed 42; extendable = 20+15=35. Global best 42.',
      edges: ['all-negative tree — the answer is the single largest node (the truncate-to-zero rule handles it)', 'the extendable return must choose ONE side, never both', 'initial best at −Infinity, not 0'],
      asks: ['Why can the extendable value take only one child? (two would bend the path)', 'Max path SUM vs max path LENGTH? (same skeleton, +1 instead of +value)'],
      transfer: 'The two-return recursion: extendable vs closed. Every "path through a tree" problem (sum, length, univalue) is this shape.'
    },
    lc297: {
      steps: [
        'Flatten a tree to a string and rebuild it — exactly, with nulls.',
        'The wall: an in-order serialization loses structure on non-BSTs — two different trees can share an in-order. The order must carry the SHAPE, not just the values.',
        'The turn: preorder WITH explicit null markers is a complete structural description: every missing child is recorded, so the rebuild never has to guess.',
        'The build: serialize — preorder walk appending values and # markers. Deserialize — consume tokens in order: a # returns null; a value becomes a node whose left and right are built by recursing on the NEXT tokens.',
        'The check: O(n) both ways, O(n) space. Correct because the token stream is the preorder of a unique tree — the recursion mirrors it exactly.'
      ],
      trace: '1 / 2, #, #... → "1,2,#,#,3,#,#" rebuilds: 1, left=2 (children null,null), right=3.',
      edges: ['null markers are mandatory — without them the rebuild is ambiguous', 'empty tree → the stream is just #', 'the deserialize pointer must be shared/mutated across recursive calls (or returned)'],
      asks: ['Why does in-order + preorder NOT suffice with duplicates? (ambiguity in locating the root)', 'Compact encodings? (level-order with nulls, or LeetCode\'s own bracket format — trade size for clarity)'],
      transfer: 'Structure-carrying serialization. The same token-walk parses Lisp, and it is the file format of World 6\'s trees in your head.'
    },
    lc110: {
      steps: [
        'Is the tree balanced — every node\'s two subtree depths differing by at most one?',
        'The wall: a depth(node) call at every node is O(n²) on a degenerate tree — each depth walk repeats the same descent.',
        'The turn: compute depth BOTTOM-UP, once per node. The depth call can itself detect the imbalance: an unbalanced subtree reports "−Infinity" (or a sentinel), which propagates without extra passes.',
        'The build: post-order: depth = 1 + max(left, right); if |left − right| > 1 anywhere, poison the return upward. Top level checks for the poison.',
        'The check: O(n) — each node visited once, O(depth). Correct because the sentinel short-circuits exactly when the first violation appears.'
      ],
      trace: '1/2/3/4: depths bubble 1,2,3,4 — at node 3 the gap |1−0|>1? chain: at node 2: left depth 2, right 0 → gap 2 → poison.',
      edges: ['the early-exit sentinel vs computing depth and returning a boolean pair', 'empty tree → balanced', 'a stick of two nodes IS balanced (gap 1 allowed)'],
      asks: ['Why is the naive version quadratic? (depth re-descends the same subtrees)', 'AVL trees store this height — say why the check is their admission test (World 7)'],
      transfer: 'Bottom-up accumulation with a poison channel. The pattern: fold two questions (depth? balanced?) into ONE recursion.'
    },
    lc108: {
      steps: [
        'A sorted array → the most balanced possible BST.',
        'The wall: inserting in order produces a stick (World 6\'s anti-demo). The balance must be DESIGNED into the construction.',
        'The turn: the middle element is the root — the array halves are exactly its two subtrees\' value pools. Recurse on the halves.',
        'The build: build(lo, hi): empty range → null; middle of the range becomes the node; left = build(lo, middle−1), right = build(middle+1, hi).',
        'The check: O(n) — each element becomes a node once — with O(log n) recursion depth by construction. Correct because the median split balances the COUNT on both sides.'
      ],
      trace: '−10,−3,0,5,9 → root 0, left from −10,−3 → root −3; right from 5,9 → root 9? mid of two — convention lands −3/9 with children −10/5.',
      edges: ['even lengths — either middle convention works, heights differ by at most one', 'empty array → null', 'lo > hi as the empty-range guard'],
      asks: ['Sorted LINKED list → BST? (fast/slow middle finding, or convert to array — discuss the trade)', 'This is which World\'s subject? (W7: balance by construction vs by repair — red-black does it incrementally)'],
      transfer: 'Median-split construction — balance designed in, not maintained. The same halving builds segment trees and heaps (the array IS the tree).'
    },
    lc215: {
      steps: [
        'The k-th LARGEST element — no full sort allowed.',
        'The wall: sorting everything is O(n log n) to answer one positional question. Heapifying all n and popping k is O(n + k log n) — better, still not the end.',
        'The turn: only k elements ever need to be remembered — the k largest seen so far. A MIN-heap of size k holds exactly those; its root is the current k-th largest.',
        'The build: stream the array: push until size k; then push-and-pop (replace the root) whenever a new value beats it. End: the root is the answer.',
        'The check: O(n log k), O(k) space. Correct because the heap always contains the top-k so far, evicting exactly the weakest.'
      ],
      trace: '3,2,1,5,6,4, k=2 → heap fills {3,2}; 1 rejected; 5 replaces 2 → {3,5}; 6 replaces 3 → {5,6}; 4 rejected → answer 5.',
      edges: ['k = 1 → a running max, no heap needed', 'k = n → it IS a heap sort — say the degeneration', 'duplicates count with multiplicity'],
      asks: ['Quickselect instead? (O(n) average, O(n²) worst — the partition from W09 with a side to skip)', 'Why a MIN-heap for LARGEST? (the root is the eviction candidate — the weakest of the kept elite)'],
      transfer: 'Bounded heap = streaming top-k. The size-k trick prices leaderboards, hot hashtags, and median maintenance (LC 295).'
    },
    lc239: {
      steps: [
        'Slide a window of size k along the array; report the max of each position.',
        'The wall: rescanning each window is O(n·k). The max must be maintained, not recomputed.',
        'The turn: an element can never be the max again once a BIGGER element appears at a LATER index inside some shared window — evict it immediately. The surviving candidates are indices with decreasing values: a monotonic deque.',
        'The build: for each new index: pop from the back every index whose value ≤ the new value (dominated); push the new index; pop the front if it slid out of the window; the front IS the window max.',
        'The check: each index enters and leaves the deque once → O(n), O(k). Correct because the front is always the newest undominated element inside the window.'
      ],
      trace: '1,3,−1,−3,5,3,6,7, k=3 → deque holds 3; then 3,−1; window answers 3,3,5,5,6,7.',
      edges: ['evict ≤ from the back (or <, if you must keep duplicates — be consistent)', 'the front eviction by INDEX AGE, not value', 'k = n → single answer'],
      asks: ['Why a deque and not a heap? (a heap cannot evict by age — the expired max lingers; a lazy-index heap works but pays O(log k))', 'Min of every window? (mirror every comparison)'],
      transfer: 'Monotonic deque — the sliding aggregate machine. LC 84\'s stack was the same idea without the age constraint.'
    },
    lc703: {
      steps: [
        'A stream keeps arriving; after each element, report the k-th largest so far.',
        'The wall: sorting the whole stream per query is O(n log n) each time; the answer only depends on the top k EVER SEEN.',
        'The turn: LC 215\'s size-k min-heap, kept across calls — each arrival either misses the heap (rejected in O(1)) or replaces the root (O(log k)).',
        'The build: initialize by heapifying the first batch down to size k. add(val): if under size, push; else if val > root, replace-root and sift; return the root.',
        'The check: O(log k) per add, O(k) memory — forever, whatever the stream length. Correct because the invariant "heap = top k so far" survives every operation.'
      ],
      trace: 'k=3, stream 4,5,8,2 → heap {4,5,8}; add 2 → rejected, answer 4; add 5 → replaces 4 → {5,5,8}, answer 5.',
      edges: ['the initial batch may be smaller than k (answer undefined until full — the classic returns the root anyway, say it)', 'duplicates fill heap slots legitimately', 'replace-root vs pop+push — one sift instead of two'],
      asks: ['Why is memory O(k) regardless of stream length?', 'When would you switch to quickselect? (one-shot query, no stream — O(n) average)'],
      transfer: 'A persistent bounded heap — the streaming twin of LC 215. Leaderboards and top-k dashboards are literally this class.'
    },
    lc621: {
      steps: [
        'Tasks with cooldown: identical tasks must be spaced n slots apart. Minimum total time?',
        'The wall: simulating the schedule slot by slot works but hides the counting argument that solves it in one line.',
        'The turn: the most frequent task (count c, appearing x times among the max) pins the frame: (c−1) blocks of length n+1, plus the x co-champions. Everything else SLOTS INTO THE GAPS for free.',
        'The build: answer = max(taskCount, (c−1)·(n+1) + x) — the second term is the champion frame; the first covers the case where extras overflow the gaps.',
        'The check: O(n) counting, O(1) space (26 tasks). Correct because idle slots only ever exist when a champion forces them; otherwise every task fills a gap.'
      ],
      trace: 'A A A B B B, n=2 → c=3, x=2 → (3−1)·3+2 = 8: A B _ A B _ A B.',
      edges: ['the max with taskCount — when extras overflow, no idles happen at all', 'ties for the maximum frequency (x > 1)', 'n = 0 → just the count'],
      asks: ['Why does filling the gaps never violate a cooldown? (gap length n+1 spans at most one of each task)', 'What breaks if cooldowns are per-PAIR? (the counting argument dies — back to simulation)'],
      transfer: 'Count the champion, build the frame, let the rest fill gaps. Scheduling-by-invariant — the sibling of task-scheduler variants and rate limiters.'
    },
    lc23: {
      steps: [
        'Merge k sorted lists into one sorted list.',
        'The wall: concatenating and sorting is O(n log n) and ignores the k-fold sortedness. Pairwise merging is O(n·k).',
        'The turn: the next output is always the smallest of the k current HEADS — a priority question over exactly k candidates → a min-heap of cursors.',
        'The build: heap the k head values (with list identity and position). Pop the root, emit it, advance that list\'s cursor, push its next value. Repeat n times.',
        'The check: O(n log k), O(k) — each of n outputs costs one sift of a k-sized heap. Correct because the heap always contains the frontier of candidates.'
      ],
      trace: '1,4,5 / 1,3,4 / 2,6 → roots 1,1,2 → pop 1 (list 2) → push 3... output 1,1,2,3,4,4,5,6.',
      edges: ['empty lists never enter the heap', 'stability among equal values (list index as tiebreak)', 'k=1 → the list itself'],
      asks: ['Divide-and-conquer pairing? (merge lists pairwise, log k rounds — same complexity, different memory profile)', 'Why is a heap of CANDIDATES better than a heap of EVERYTHING? (size k vs size n)'],
      transfer: 'The k-way frontier — priority merge. Database external sorts and log-structured merges run exactly this loop.'
    },
    lc295: {
      steps: [
        'Numbers arrive one at a time; after each, the median of everything so far.',
        'The wall: keeping a sorted array costs O(n) per insert (shifting). A single heap cannot see both sides of the middle.',
        'The turn: split the stream at the median — a max-heap owns the lower half, a min-heap owns the upper half, sizes within one. The median is always one or two heap tops.',
        'The build: insert into the low side, then push low\'s max into high (self-balancing overflow); if high outgrows low, return high\'s min to low. Median: equal sizes → average of tops; else low\'s top.',
        'The check: O(log n) per insert, O(1) median, O(n) memory. Correct because the two invariants — order split and size balance — are restored after every insert.'
      ],
      trace: 'stream 1,2 → low {1}, high {2} → median 1.5. add 3: low gets 3 → overflow 3 to high, high {2,3} bigger → return 2 → low {2,1}? tops: low 2, high 3 → median 2.',
      edges: ['the double-sift dance is where candidates slip — say the invariants ALOUD while writing', 'all-equal values (comparator consistency)', 'first element lands in low by convention'],
      asks: ['Why not a sorted array with binary-search insert? (O(n) shift per insert vs O(log n))', 'Running PERCENTILE instead? (the same two-heap trick generalizes to order-statistic trees / skipping)'],
      transfer: 'Two heaps as a balanced split — the streaming order-statistics machine. The same skeleton answers sliding-median (with lazy deletion).'
    },
    lc912: {
      steps: [
        'Sort an integer array — the interview is which algorithm and why.',
        'The wall: language sorts exist, but the problem ASKS for the machinery. The classic asks for merge or quick — and the honest version discusses the trap.',
        'The turn: merge sort guarantees O(n log n) but pays O(n) scratch; quicksort is in-place and cache-kind but has the sorted-input trap (World 9 lets you spring it yourself).',
        'The build: merge sort: halve, sort halves, merge with the two-finger walk. Quicksort: partition around a pivot (random or median-of-three to dodge the trap), recurse on the sides.',
        'The check: merge — O(n log n) always, O(n) space, stable. Quick — O(n log n) expected, O(n²) if pivots are chosen adversarially; in-place, not stable.'
      ],
      trace: '5,2,3,1 → merge: 5,2 → 2,5; 3,1 → 1,3; merge → 1,2,3,5.',
      edges: ['quicksort on already-sorted input with a first-element pivot — the n² trap', 'duplicates — three-way partitioning (Dutch flag) keeps quicksort linear-ish', 'recursion depth — merge\'s log n guaranteed vs quick\'s worst stick'],
      asks: ['Why is heap sort the third answer? (in-place AND O(n log n) guaranteed — but poor cache locality)', 'Which does your language\'s sort use? (Timsort — adaptive merge sort; say why stability is default-on)'],
      transfer: 'The three workhorses and their contracts. World 9 runs all of them step-recorded — the trade-offs are visible there, not folklore.'
    },
    lc75: {
      steps: [
        'Three values only — arrange all 0s, then 1s, then 2s. One pass demanded.',
        'The wall: counting sort (two passes: count, then rebuild) is the honest O(n) answer — but the one-pass, in-place version is the famous exercise.',
        'The turn: one pass, THREE regions maintained simultaneously — a Dutch flag. A low frontier, a high frontier, and a walking probe: 0s swap behind low, 2s swap ahead of high, 1s just pass.',
        'The build: probe i: value 0 → swap with low, advance BOTH (the swapped-in value was already probed); value 2 → swap with high, DON\'T advance i (the swapped-in value is unprobed); value 1 → i++.',
        'The check: each cell finalized once → O(n), O(1). Correct because the invariant [0s | 1s | unknown | 2s] is restored by every branch.'
      ],
      trace: '2,0,2,1,1,0 → 2 swaps to high; 0 swaps behind low; … → 0,0,1,1,2,2.',
      edges: ['the i-does-not-advance case after a high swap — the classic bug', 'all-same arrays', 'the loop runs while i ≤ high, not length'],
      asks: ['Why is counting sort fine but not "the answer"? (two passes vs one — say the contract)', 'This is quicksort\'s partition generalized to how many classes? (three — hence Dutch national flag, Dijkstra)'],
      transfer: 'Invariants as regions — one pass, many frontiers. The general machine behind partitioning and flag-based segregation.'
    },
    lc56: {
      steps: [
        'A mess of intervals — merge every overlapping pair into the cover.',
        'The wall: pairwise overlap checks across all pairs is O(n²) and still needs transitive merging (A overlaps B, B overlaps C).',
        'The turn: SORT BY START. Then only ADJACENT intervals can overlap — the merge becomes a single linear sweep.',
        'The build: sort by the left end. Walk with a running "current merged" interval: if the next start ≤ current end, extend the end; else emit and start fresh.',
        'The check: O(n log n) for the sort, O(n) sweep. Correct because after sorting, an interval that does not touch its predecessor cannot touch ANY later one (starts only grow).'
      ],
      trace: '1,3 / 2,6 / 8,10 / 15,18 → sorted; 2 ≤ 3 → merge to 1,6; 8 > 6 → emit; 15 > 10 → emit.',
      edges: ['touching endpoints (5,5)(5,7) — state the merge-or-not convention', 'nested intervals — the max-end handles them', 'empty list → empty'],
      asks: ['Why does sorting by START suffice — why not also by end? (the running max-end absorbs the rest)', 'Insert ONE interval into a sorted disjoint list? (LC 57 — the three-phase copy-merge-copy)'],
      transfer: 'Sort to create adjacency, then sweep. The calendar/meeting-room family is this skeleton with different reductions at the end.'
    },
    lc148: {
      steps: [
        'Sort a linked list — in O(n log n) time, ideally O(1) space.',
        'The wall: arrays give quicksort its random access — lists do not. And merge sort\'s usual O(n) scratch violates the O(1) dream.',
        'The turn: merge sort is the natural list sort: splitting is the slow-fast walk, merging is pointer splicing (LC 21) — no indexing anywhere.',
        'The build: find the middle (fast/slow), cut the list in two, recurse on both, merge the sorted halves by splicing nodes.',
        'The check: O(n log n), O(log n) recursion (the O(1) bottom-up version merges width-1 runs iteratively — say it exists, code the top-down one).'
      ],
      trace: '4,2,1,3 → split 4,2 / 1,3 → split to singletons → merge 2,4 and 1,3 → merge → 1,2,3,4.',
      edges: ['the slow-fast split must CUT the list (prev pointer or slow.next manipulation)', 'two-element lists — the middle convention decides the halves', 'odd/even lengths both must terminate'],
      asks: ['Why not quicksort on a list? (partitioning needs backward access or heavy pointer surgery; pivot splits are lopsided)', 'Bottom-up merge? (width-doubling runs, no recursion, true O(1) space)'],
      transfer: 'Merge sort was BUILT for lists — split by walking, merge by splicing. World 9\'s hand-merge was this, one level down.'
    }
  });
})();
