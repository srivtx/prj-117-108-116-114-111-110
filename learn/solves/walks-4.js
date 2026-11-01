/* ============================================================
   ULTRON LAB · solves/walks-4.js — the Solve Hall, volume 4.
   Graphs + tries & bit tricks.
   ============================================================ */
(function () {
  'use strict';
  window.ULTRON_WALKS = Object.assign(window.ULTRON_WALKS || {}, {
    lc200: {
      steps: [
        'Count the islands — maximal groups of land cells connected 4-directionally.',
        'The wall: what makes counting hard is not finding land but counting each island EXACTLY once. Unmarked visits recount the same island.',
        'The turn: the grid IS a graph — cells are nodes, adjacency is edges. An island is a connected component; flood-fill (DFS/BFS) consumes one whole component per launch.',
        'The build: scan every cell; when an unvisited land cell appears, increment the count and flood-mark its entire component (recursively, or an explicit stack/queue — set cells to water or a seen-set).',
        'The check: each cell visited a constant number of times → O(rows·cols), O(1) extra if marking in place. Correct because the flood provably reaches every cell of its component.'
      ],
      trace: 'grid with land at (0,0),(0,1),(1,0): scan hits (0,0) → island 1 → flood marks all three → scan continues on water.',
      edges: ['diagonal cells do NOT connect (4 vs 8 directions — read twice)', 'flood recursion depth on a huge island (explicit stack in interviews)', 'mutating the input vs a seen-set — state your choice'],
      asks: ['Iterative flood? (stack — say why recursion can blow on a 1000×1000 all-land grid)', 'Largest island? Second pass with sizes — same flood, different reduction)'],
      transfer: 'Components = one flood per unvisited node. World 10 paved the city; this is the same BFS ripple, counted.'
    },
    lc994: {
      steps: [
        'Every minute, rot spreads from rotten oranges to fresh neighbours. When does the last fresh one rot?',
        'The wall: minute-by-minute simulation with a full-grid scan per minute works but is O(minutes × grid) — the spread is doing redundant scanning.',
        'The turn: rot spreads from ALL rotten cells simultaneously — that is a MULTI-SOURCE BFS. Seed the queue with every initially rotten orange; BFS layers ARE the minutes.',
        'The build: enqueue all rotten cells at distance 0; standard BFS over fresh neighbours increments the level. Track the last level that rotted something. Any fresh cell left over → −1.',
        'The check: O(rows·cols) — each cell enqueued at most once. Correct because BFS distance is the earliest possible infection time.'
      ],
      trace: 'grid 2,1,1 / 1,1,0 / 0,0,1 → the 2 seeds level 0; levels spread; the isolated corner 1 is reached at minute 4.',
      edges: ['no rotten oranges at all but fresh exist → −1', 'no fresh oranges → 0 minutes (not −1)', 'unreachable fresh → −1 (the leftover check)'],
      asks: ['Why multi-source BFS and not sequential floods? (simultaneity IS the level structure)', 'Which other problems are secretly multi-source BFS? (walls-and-gates, nearest-zero, rotting everything)'],
      transfer: 'Parallel spread = seed every source at distance 0. One BFS computes every cell\'s earliest infection — the trick generalizes wildly.'
    },
    lc133: {
      steps: [
        'Clone a graph given one entry node — nodes carry values and neighbour lists.',
        'The wall: cycles — a naive copy re-visits nodes and duplicates them infinitely; and random pointers (any node may be referenced twice) break simple traversal.',
        'The turn: the ONLY hard part is identity — old node → its clone. A visited map IS the clone registry, answering "already cloned?" before recursing.',
        'The build: DFS: map old → fresh clone FIRST, then recurse into neighbours, wiring the copies. The early registration is what breaks the cycle.',
        'The check: O(nodes + edges), O(nodes) for the map. Correct because every edge is copied exactly once and every node exactly once.'
      ],
      trace: '1→2→3→1 cycle: clone 1 registered; cloning 2 registers it; 3 registers; 3\'s neighbour 1 is already in the map — wire it, stop.',
      edges: ['the register-BEFORE-recurse order — after causes infinite recursion', 'self-loops and diamonds (two paths to one node)', 'single node, no edges'],
      asks: ['BFS version? (same registry, queue)', 'Why does the map alone guarantee termination? (recursion only continues on UNREGISTERED nodes)'],
      transfer: 'Clone = traversal + identity registry. LC 138 was the two-pointer special case; this is the general law.'
    },
    lc207: {
      steps: [
        'Can all courses be taken, given prerequisites? (Is the directed graph acyclic?)',
        'The wall: cycle detection in a general digraph needs traversal state — a seen-set alone cannot tell "on the current path" from "finished forever."',
        'The turn: three colors: unvisited / on-the-current-path / done. Reaching an ON-PATH node again is the cycle. Alternatively, Kahn\'s indegree peel: repeatedly remove courses with no unmet prerequisites.',
        'The build (Kahn): count indegrees; queue all zeros; popping a course decrements its dependents; if the popped count reaches n, acyclic — else a cycle strangled the remainder.',
        'The check: O(V + E), each course and edge touched once. Correct because any cycle\'s members never reach indegree zero.'
      ],
      trace: '1←0, 2←0, 3←1, 3←2 → indegrees 0:course0 → pop 0 unlocks 1,2 → pop 1,2 unlock 3 → pop 3 → 4 of 4 → true.',
      edges: ['no prerequisites → trivially true', 'self-loop (course needs itself) → immediately false', 'the count check — not an empty queue (the queue empties regardless)'],
      asks: ['DFS three-color vs Kahn — when do you pick which? (Kahn when you also want an ORDER — LC 210; DFS for elegance)', 'Why does an empty peel imply acyclicity? (a cycle blocks its own indegree floor)'],
      transfer: 'Topological thinking: peel the dependencies. Build systems, package managers, and dataflow engines all run Kahn.'
    },
    lc127: {
      steps: [
        'Transform word A to word B one letter at a time, every step a real word — fewest steps.',
        'The wall: the search space is all words × all positions × all letters, with paths sharing prefixes — and blind DFS dives into dead ends.',
        'The turn: this is SHORTEST PATH in an unweighted graph (nodes = words, edges = one letter apart) → BFS from the start word.',
        'The build: queue of words with levels; try every one-letter mutation, keep only dictionary words not yet visited. First arrival at the target is the answer (BFS is optimal in unweighted graphs).',
        'The check: O(words × wordLength × 26) — each word enqueued once. Correct because BFS explores in level order; the first hit is minimal.'
      ],
      trace: 'hit → cog via hot,dot,dog: hit level 0; hot 1; dot,lot 2; dog,log 3; cog 4.',
      edges: ['end word absent from the dictionary → 0', 'word length 1', 'bidirectional BFS as the optimization — say it, half the search'],
      asks: ['Why not DFS with backtracking? (no optimality; the space explodes)', 'Precompute adjacency (wildcard buckets: h*t) vs on-the-fly mutation — which wins? (buckets: O(n·L) preprocessing, dramatic speedups)'],
      transfer: 'State-space BFS: define the states, the moves, then ripple. This is Word Ladder, but also locks, rotors, and puzzle solvers everywhere.'
    },
    lc743: {
      steps: [
        'From a source node, the shortest delivery time to every node (weighted edges).',
        'The wall: BFS only knows unweighted edges; weights break the level structure. Enumerating paths is exponential.',
        'The turn: Dijkstra = BFS with a priority queue: always FINALIZE the nearest unfinalized node; its distance is provably optimal (all edge weights are non-negative).',
        'The build: adjacency list; a min-heap seeded (0, source); pop the smallest, skip stale entries, relax every outgoing edge; push improved distances. The answer is the largest finalized distance (the farthest node).',
        'The check: O((V + E) log V) with the heap, O(V + E) space. Correct because non-negative weights mean a finalized node can never be improved later.'
      ],
      trace: 'edges 1→2 (4), 1→3 (2), 3→2 (1): finalize 1 (0); 3 (2); 2 via 3 = 3 → farthest = 3.',
      edges: ['unreachable nodes → the answer is −1 (max over finalized only)', 'stale heap entries — the skip-on-pop idiom', 'zero-weight edges are fine; NEGATIVE ones are not — say Bellman-Ford'],
      asks: ['Why do negative weights break Dijkstra? (a longer-hop path could later improve a finalized node — the proof dies)', 'Why an adjacency LIST? (World 10\'s matrix wastes V² on sparse graphs)'],
      transfer: 'Greedy + priority queue on non-negative weights. GPS routing, network routing tables, and build-system scheduling all run it.'
    },
    lc684: {
      steps: [
        'A tree plus exactly one extra edge — find the edge to delete to restore treeness.',
        'The wall: cycle detection by DFS per edge is O(n²) and clunky; the tree claim (n nodes, n−1 edges + 1 extra) deserves better.',
        'The turn: process edges in order — the first edge whose two endpoints are ALREADY connected closes a cycle. Union-Find answers "already connected?" in near-constant time.',
        'The build: parent array with path compression; for each edge, find both roots — same root → return the edge; different → union them.',
        'The check: O(n · α(n)) ≈ O(n). Correct because connectivity is monotone under union — once joined, always joined.'
      ],
      trace: '1-2, 1-3, 2-3: union(1,2); union(1,3); edge 2-3 → find both = same root → return 2-3.',
      edges: ['nodes 1-indexed — allocate accordingly', 'multiple answers in general graphs (this problem guarantees the input ORDER resolves it)', 'path compression + union by rank — say both, code at least one'],
      asks: ['Why is union-find the answer and not DFS? (edges arrive incrementally; DFS re-runs per edge)', 'This structure also powers Kruskal\'s MST — explain the shared trick. (sort edges, union-accepts only non-closing edges)'],
      transfer: 'Union-Find: monotone connectivity. Components, MST, cycle detection — one structure, three problems.'
    },
    lc547: {
      steps: [
        'Cities connected directly or through chains form provinces — count the provinces.',
        'The wall: the adjacency matrix is handed over, but the counting problem underneath is component counting (LC 200 in a suit).',
        'The turn: province = connected component. From each unvisited city, one flood marks its entire province; the number of flood launches is the answer.',
        'The build: seen array; for each unvisited city: count++, DFS/BFS its whole component through the matrix rows (or union-find the pairs).',
        'The check: O(n²) over the matrix, O(n) seen. Correct because every city belongs to exactly one province and every flood consumes one entirely.'
      ],
      trace: 'matrix with 1-2 linked, 3 alone → flood from 1 marks 2; flood from 3 → 2 provinces.',
      edges: ['the matrix is symmetric — a diagonal walk halves the work if wanted', 'a city connected to nothing is its own province', 'matrix row = adjacency list — the translation step is half the interview'],
      asks: ['Union-find version? (union every pair with a 1; count distinct roots)', 'Why is this LC 200 with a different encoding? (grid cells → cities; 4-neighbours → matrix ones)'],
      transfer: 'Component counting is encoding-agnostic: grid, matrix, or edge list — flood once per component.'
    },
    lc210: {
      steps: [
        'Pro prerequisites again — but now emit a valid course ORDER, not just a yes/no.',
        'The wall: any DFS with post-order collection works, but the indegree peel produces the order directly and detects cycles for free.',
        'The turn: a course with indegree zero has no unmet prerequisite — it can go FIRST. Emitting it decrements its dependents, unlocking the next batch. This is Kahn\'s algorithm.',
        'The build: adjacency + indegrees; a ready-queue of zeros; pop → emit → decrement dependents, enqueue the newly zero. If emission count < n → cycle → return empty.',
        'The check: O(V + E). Correct because every edge points from an earlier to a later emission — that is the definition of a topological order.'
      ],
      trace: '1←0, 2←0, 3←1, 3←2 → ready 0 → emit 0; 1,2 ready → emit 1, 2; 3 ready → emit 3. Order 0,1,2,3.',
      edges: ['multiple valid orders — any one is accepted (queues choose)', 'the cycle check is the emitted COUNT, not the queue state', 'duplicate edges inflate indegrees — dedupe if the input is dirty'],
      asks: ['DFS post-order version? (emit on the way back; reverse at the end)', 'Where does this run in real systems? (build tools, package managers, spreadsheet recalculation — everywhere)'],
      transfer: 'Kahn\'s peel: emit the unblocked, unblock the next. The companion of LC 207 — same graph, ordered output.'
    },
    lc208: {
      steps: [
        'Build a prefix tree: insert words, search exact words, and search prefixes.',
        'The wall: a hash set answers exact search but PREFIX search needs a scan of all keys — the prefix structure must be IN the data.',
        'The turn: shared prefixes share paths — each node is one character step; a word\'s end is a flag on its final node.',
        'The build: node = children map + isWord flag. Insert: walk/create the child chain, flag the last. Search: walk the chain — a missing child fails; the flag decides word vs prefix.',
        'The check: O(word length) per operation, O(total characters) space. Correct because a word\'s path is exactly its characters in order.'
      ],
      trace: 'insert apple: a→p→p→l→e, flag e. searchPrefix app: walk a,p,p — nodes exist → true. search ape: p→e? e is not under p at depth 2 → false.',
      edges: ['search vs startsWith differ ONLY at the final flag check', 'empty string inserts (flag the root)', 'deleting words needs child-count bookkeeping (unflag, prune childless chains)'],
      asks: ['Trie vs hash set for autocomplete? (prefix queries are the trie\'s monopoly)', 'Binary trie variant? (World 11: bits instead of letters — XOR queries)'],
      transfer: 'Structure the QUERY into the data. World 11 runs the bit-version by hand — the w-bound lives there.'
    },
    lc136: {
      steps: [
        'Every element appears twice, except one — find the loner.',
        'The wall: a hash count works at O(n) space; a sort works at O(n log n). Both ignore the arithmetic of the situation.',
        'The turn: XOR is its own inverse — a ^ a = 0 and a ^ 0 = a. Fold the whole array: pairs annihilate, the loner survives.',
        'The build: one running XOR over all values. Return it.',
        'The check: O(n) time, O(1) space. Correct by commutativity — grouping order does not matter.'
      ],
      trace: '4,1,2,1,2 → 4^1^2^1^2 = 4^(1^1)^(2^2) = 4.',
      edges: ['negative numbers — XOR is bit-level, sign-safe in JS', 'single element already', 'the guaranteed "exactly one loner" — without it XOR says nothing'],
      asks: ['Two loners? (partition by the lowest set bit of the total XOR)', 'Why is XOR superior to sum-based tricks here? (no overflow, no accidental cancellation)'],
      transfer: 'Pair-cancellation by XOR — the bit lens (World 11) in one line. Siblings: missing number, single-number variants.'
    },
    lc201: {
      steps: [
        'The bitwise AND of every number in an inclusive range — the range can be huge.',
        'The wall: AND-ing every value in 5..7 is fine, but 12..2³¹ is billions of iterations for an answer computable from the ENDPOINTS alone.',
        'The turn: the AND of a range keeps only the bits that NEVER flip anywhere in it — the common binary PREFIX of the two endpoints. Every bit below the first difference flips somewhere in between.',
        'The build: shift both endpoints right until they are equal (count the shifts k); the answer is that common value shifted back left by k.',
        'The check: O(bits) — at most 32 iterations. Correct because a range containing two values differing at bit b must contain both bit-b values.'
      ],
      trace: '5 (101) and 7 (111): shift once → 10, 11; twice → 1,1 → common 1, shift back 2 → 100 = 4.',
      edges: ['equal endpoints → themselves', 'ranges spanning a power of two → 0 (the prefix is empty)', 'zero-length guard left < right'],
      asks: ['Why must every bit below the divergence flip? (the range walks through both halves of that bit)', 'Which World taught the prefix idea? (W11 — the bit path IS the shared prefix)'],
      transfer: 'Range answers hiding in endpoints — the XOR-lens family. Think in bits, not values.'
    },
    lc1206: {
      steps: [
        'Design a skiplist: search, add, erase — the structure of World 4.',
        'The wall: a sorted array searches fast but inserts at O(n); a linked list inserts fast but searches at O(n). The demand is O(log n) for both.',
        'The turn: coin-flip towers — every node gets a random height; higher levels are express lanes over the same sorted chain. Search drops a level whenever the next hop would overshoot.',
        'The build: levels of forward pointers; insert: flip coins for the height, splice the node into every level up to it; erase: unsplice the same levels. SEARCH runs top-down.',
        'The check: expected O(log n) per operation — the coin flips make towers geometrically rare. Correctness: level lists are always sorted sub-chains of the level below.'
      ],
      trace: 'search 17 in World 4\'s playground: top lane hops past 8, stalls before 19; drops, hops to 15, drops, lands on 17.',
      edges: ['the search must finish at level 0 before declaring absence', 'erasing a value with duplicate towers — the classic erases ONE occurrence', 'the random height must be fresh per insert (determinism kills the bounds)'],
      asks: ['Why coin flips and not a deterministic height? (adversarial patterns would stick a tall tower on every key)', 'Compare with a balanced BST — same bounds, different constants; say when each wins. (skiplists: simpler lock-free concurrency; BSTs: worst-case guarantees)'],
      transfer: 'Probabilistic balance — the skiplist lesson. You played it in World 4; here you prove you can sign your name to it.'
    }
  });
})();
