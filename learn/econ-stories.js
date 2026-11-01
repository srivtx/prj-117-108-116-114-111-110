/* ============================================================
   ULTRON LAB · econ-stories.js — the twelve guided stories of
   the economics & finance wing, plus every station's notebook
   terms and quiz questions. Same loop as the 12 worlds:
   say → your turn → predict → name it.
   ============================================================ */
window.ECON_STORIES = {
  attach(list) {
    const byId = Object.fromEntries(list.map(s => [s.id, s]));

    byId.e1.story = () => ({
      title: 'E01 · Money', subtitle: 'The geometric machine',
      steps: [
        { say: `Interest is a <b>rate</b>, not an amount: each year's gain is proportional to what is already there. That single sentence builds a geometric series — and it is the engine under every loan, valuation and growth model in this wing.`,
          task: 'Set rate to 7% and press <b>grow a year</b> a few times. Watch each bar grow by MORE than the last one did.',
          hint: 'The gain each year is 7% of the current value — including last year\'s gains.',
          okText: 'Interest on interest: <b>compounding</b>. The dashed line is what simple interest (no reinvestment) would give — the gap between them is pure reinvestment.', learn: ['e1-compound'] },
        { predict: { q: 'At 7% per year, roughly how many years does a dollar take to double?', placeholder: 'a number of years…', grade: ans => { const v = parseFloat(ans); return { right: v >= 9 && v <= 12, msg: v >= 9 && v <= 12 ? `Right — about <b>10.2 years</b>: ln 2 / ln 1.07. The <b>rule of 72</b> (72 ÷ 7 ≈ 10.3) is the pocket version — set the slider and confirm.` : `About <b>10.2 years</b>: ln 2 / ln 1.07. The rule of 72 guesses 72 ÷ 7 ≈ 10.3. Set rate 7 and run it.` }; } }, learn: ['e1-double'] },
        { say: `Now the time-reversed question, the one finance actually asks: if $200 lands in 30 years, what is it worth <b>today</b>? Exactly the inverse operation — divide by (1+r) once per year of waiting. <b>Present value</b> is the machine that lets you compare futures that arrive at different times.`,
          task: 'Drag the rate slider up and down and watch the FINAL value move.',
          hint: 'Higher rate → future dollars are worth more, but PRESENT dollars owed are dearer too.',
          okText: 'The rate is a price on time itself. Every station ahead — Solow, Bellman, smoothing — discounts the future with exactly this dial.', learn: ['e1-pv'] },
        { say: `<b>Why this station exists:</b> the geometric series is the atom of quantitative economics. An annuity is a finite sum of discounted payments; a perpetuity is the infinite sum (it converges to payment × r/(1+r)!); a growth model is capital compounding minus depreciation. You just drove the atom.`
        }
      ]
    });

    byId.e2.story = () => ({
      title: 'E02 · Solow', subtitle: 'Capital hunting its steady state',
      steps: [
        { say: `One equation runs the machine: <b>tomorrow's capital = today's + investment − what wear and growth consume</b>. Investment is a fraction s of output; output needs capital (k<sup>α</sup>, diminishing returns). Watch which force wins.`,
          task: 'Press <b>run 40 years</b>. Then grab the start-capital slider and try starting BELOW and ABOVE where the curve settles.',
          hint: 'From below, investment (green) exceeds break-even (red) — capital rises. From above, the red line dominates.',
          okText: 'Both ends roll to the same place: the <b>steady state</b>, where s·k<sup>α</sup> = (n+δ)·k exactly. The economy is self-correcting — that is the model\'s whole personality.', learn: ['e2-ss'] },
        { predict: { q: 'You DOUBLE the saving rate forever. In the very long run, output per worker grows…', placeholder: 'faster / slower / same?…', grade: ans => { const t = ans.trim().toLowerCase(); return { right: t.startsWith('same') || t.includes('0') && t.length < 12, msg: t.startsWith('same') ? `Right — <b>same</b>: higher s lifts the LEVEL of k* and y*, but at k* capital per worker is constant again. Growth per worker in the long run comes from technology, not accumulation — Solow\'s famous punchline.` : `<b>Same rate — zero</b> per worker. Doubling s lifts the steady-state LEVEL (k* rises), but at any steady state growth stops. Long-run growth needs technology. Try it: slide s up and read the stats panel.` }; } }, learn: ['e2-level'] },
        { say: `Now the social question: if you could choose s to maximize steady-state CONSUMPTION (not output), where would you aim? Too little saving — poor forever. Too much — rich on paper, hungry in fact.`,
          task: 'Read the golden-rule saving rate in the stats panel, set s there, and compare steady consumption to s = 0.6.',
          hint: 'The golden rule for this economy sits near s = α = 0.4.',
          okText: `The <b>golden rule</b>: maximize c* = (1−s)·k*<sup>α</sup> — for Cobb-Douglas it lands exactly at s = α. Saving beyond it makes everyone poorer in consumption while measured output still rises. A whole policy debate lives on this curve.`, learn: ['e2-golden'] },
        { say: `<b>Why this design?</b> Because the dynamics are one-dimensional here, you can SEE convergence — arrow by arrow. In DEQN chapters 3 and 5, the same equation gains more state variables, grids drown, and the neural nets of Station E09 take over. First principles first.`
        }
      ]
    });

    byId.e3.story = () => ({
      title: 'E03 · Markov', subtitle: 'Probability that forgets',
      steps: [
        { say: `All probability mass starts on <b>sunny</b>. Each step, the columns split and flow by the transition table: today's weather only depends on YESTERDAY — the Markov property. The table is the entire soul of the machine.`,
          task: 'Press <b>step ×1</b> three times and watch the columns redistribute.',
          hint: 'The numbers you see are P(next | current) — rows of the matrix.',
          okText: 'The distribution after each step is just π · P — a vector times a matrix. You are multiplying matrices by pressing a button.', learn: ['e3-flow'] },
        { predict: { q: 'After MANY steps, the distribution depends on the starting weather…', placeholder: 'heavily / a little / not at all…', grade: ans => { const t = ans.trim().toLowerCase(); return { right: t.includes('not') || t.includes('never') || t.includes('zero'), msg: t.includes('not') ? `Right — <b>not at all</b> (for a chain like this one). The limit is the <b>stationary distribution</b> π, the fixed point of π = π·P — the floating slabs on screen. Step ×10 a few times to land on them.` : `<b>Not at all</b>: the chain forgets. The fixed point π = π·P — the floating slabs — is where every start ends up. Step ×10 and watch the columns settle onto the slabs.` }; } }, learn: ['e3-stationary'] },
        { say: `Switch to the <b>business cycle</b> preset and step it: booms cling to booms, busts to busts (sticky diagonals). Yet even it forgets — slowly. The rate of forgetting is the chain's <b>mixing</b>, and it is why long-run frequencies of anything Markov converge.`,
          task: 'Switch presets and step ×10 three times. Watch occupancy stats vs theory in the panel.',
          hint: 'The simulated 6000-day occupancy hugs the stationary π.',
          okText: `Where you'll meet it: employment status (the next station), credit ratings, PageRank — literally a stationary distribution of the web's chain — and every "ergodic" promise in economics.`, learn: ['e3-mixing'] },
        { say: `<b>The turn</b> of this station: a distribution is a state, exactly like capital was in E02. Dynamics move it; fixed points catch it. Same mathematics, new clothes.`
        }
      ]
    });

    byId.e4.story = () => ({
      title: 'E04 · Job search', subtitle: 'The reservation wage',
      steps: [
        { say: `You are a job searcher. Each period an offer arrives from the distribution shown; benefits pay b while you wait; a job, once taken, lasts the rest of your life. Your ONLY decision: this offer — or one more period of waiting?`,
          task: 'Play three lives with your gut: next offer → accept or decline. Try to beat your own previous life.',
          hint: 'Low offers are cheap to refuse — waiting one more period costs only one period of b.',
          okText: 'Your rule, whatever it was, had a shape: some threshold above which you accept. The question is where the threshold SHOULD be.', learn: ['e4-stop'] },
        { predict: { q: 'Unemployment benefits become MORE generous. The optimal threshold should…', placeholder: 'rise / fall / stay…', grade: ans => { const t = ans.trim().toLowerCase(); return { right: t.startsWith('rise'), msg: t.startsWith('rise') ? `Right — <b>rise</b>: waiting got cheaper, so pickier is optimal. Reveal the rule in the panel and check the stats: richer benefits → higher reservation wage. That is one mechanism behind longer unemployment spells — without anyone being lazy.` : `<b>Rise</b>. Waiting costs less → be pickier. The stats panel proves it: benefits 28 → 40 lifts the optimal threshold. Frictions, not laziness, can explain unemployment duration.` }; } }, learn: ['e4-benefits'] },
        { say: `Now meet the machine's answer. Value iteration (the same Bellman logic as E05) solves the searcher's problem exactly: accept iff the offer clears <b>w̄</b>, the reservation wage. One number — and it beats every improvisation.`,
          task: 'Press <b>reveal the optimal rule</b> and compare the green line to where your guts said yes.',
          hint: 'The panel scores 400 simulated lives under each rule: yours, always-accept, never-accept, optimal.',
          okText: 'Optimal rule: accept ≥ w̄. Always-accept grabs 55s forever; optimal waits a little for 65+ — and the life-values in the panel tell you by how much. <b>This is a stopping problem</b>, the family of secretary problems, house selling, and option exercise.', learn: ['e4-reserve'] },
        { say: `<b>Why it matters:</b> search theory explains unemployment, vacancies and wage dispersion with ONE friction — offers arrive slowly. It won a Nobel (Diamond–Mortensen–Pissarides). And it is your first model where a DISTRIBUTION (of offers) enters a decision.`
        }
      ]
    });

    byId.e5.story = () => ({
      title: 'E05 · Bellman', subtitle: 'The sweep that solves itself',
      steps: [
        { say: `The value of capital k satisfies an equation that contains itself: <b>V(k) = max over consumption of ln(c) + β·V(k′)</b>. Self-reference sounds broken — unless you approach it as a fixed point: start with ANY guess, apply the equation, repeat.`,
          task: 'Press <b>one sweep</b> twice. The blue guess jumps, then bends.',
          hint: 'Each sweep replaces V with one round of optimization against the old V.',
          okText: 'You are watching <b>value iteration</b> — dynamic programming as a fountain. The contraction mapping theorem guarantees the sweeps converge to the unique true V, no matter the guess.', learn: ['e5-vfi'] },
        { predict: { q: 'You raise patience β (care about the future more). The eating rule c(k) should…', placeholder: 'rise / fall…', grade: ans => { const t = ans.trim().toLowerCase(); return { right: t.startsWith('fall'), msg: t.startsWith('fall') ? `Right — <b>fall</b>: the patient eat less today to invest. The exact rule is c(k) = (1−αβ)k<sup>α</sup> — drag β up and watch the red policy curve sink. β→1: eat almost nothing. β→0: eat everything (the cake vanishes).` : `<b>Fall</b>: patience is saving. The exact rule c(k) = (1−αβ)k<sup>α</sup> says it directly — drag β up and watch the policy curve sink.` }; } }, learn: ['e5-beta'] },
        { say: `This model is small enough to have a <b>closed form</b> (dashed green): with log utility and full depreciation, V(k) = A + B·ln k and the rule is exactly (1−αβ)·k<sup>α</sup>. That is a gift: you can CHECK the sweep against truth.`,
          task: 'Press <b>run to convergence</b> and read "policy vs exact" in the panel — it should read near 0% off.',
          hint: 'The grid is coarse, so a few percent off is honest; the shape is what matters.',
          okText: 'Converged: the guess hardened into the exact curve. Grid + sweep = a solver. But notice the cost: 60 gridpoints for ONE state variable. Two states: 3600. A thousand states: grids are dead.', learn: ['e5-grid'] },
        { say: `<b>The bridge:</b> when the state is a whole distribution (E08) or a high-dimensional vector, sweeping grids drowns — and Station E09 replaces the grid with a neural net. Same equation, new solver. That is the entire DEQN program in one sentence.`
        }
      ]
    });

    byId.e6.story = () => ({
      title: 'E06 · Smoothing', subtitle: 'The perfect arc',
      steps: [
        { say: `A rational consumer does not eat what arrives — she eats the <b>annuity</b> of everything she will ever own: consumption = r/(1+r) × (wealth + present value of income). Flat, calm, boring on purpose.`,
          task: 'With no shocks set, look at the flat blue line versus the bars. Then press <b>one-off bonus +10 at year 5</b>.',
          hint: 'Watch the blue line, not the bar.',
          okText: 'A 10-unit windfall raised consumption by a SLIVER (read the panel — about 0.46). Spread over a lifetime through the annuity, a one-off bonus barely moves the plan. Lottery winners who act otherwise end up broke.', learn: ['e6-annuity'] },
        { predict: { q: 'Same size, but a PERMANENT raise (+10 every year, starting now). Consumption rises by about…', placeholder: 'a number…', grade: ans => { const v = parseFloat(ans); return { right: Math.abs(v - 10) < 1.5, msg: Math.abs(v - 10) < 1.5 ? `Right — <b>~10</b>, one-for-one: the raise IS permanent income. Press the button and watch the blue line jump by the full amount. THAT asymmetry — tiny for transitory, full for permanent — is the <b>permanent income hypothesis</b>.` : `About <b>10</b> — full pass-through: a permanent raise raises the annuity by exactly its size. Press it and watch the line jump. Transitory: a sliver; permanent: full. That asymmetry IS the hypothesis.` }; } }, learn: ['e6-perm'] },
        { say: `Now the red line: the <b>hand-to-mouth</b> consumer, who spends exactly what arrives. Watch its variance versus the smoother's — and remember that real consumption data looks like the BLUE line: smooth while income jumps. That smoothing is the theory's central prediction, and households largely pass the test.`,
          task: 'Read the variance comparison in the stats panel.',
          hint: 'The smoother\'s variance is near zero by construction — the point is the contrast.',
          okText: `Why economists care: consumption responds to NEWS about permanent income, not to temporary blips. Stimulus checks (transitory) get saved; news of a lasting raise gets spent. Policy design lives on this distinction.`, learn: ['e6-smooth'] },
        { say: `<b>The thread:</b> E01 gave you the annuity; this station aimed it at a lifetime. E05 asks the same question with savings CHOSEN optimally; here the horizon does the work. Next: time becomes continuous.`
        }
      ]
    });

    byId.e7.story = () => ({
      title: 'E07 · Clocks', subtitle: 'The exponential heart',
      steps: [
        { say: `Discrete time whispers; the world runs continuously. The continuous cousin of the geometric distribution is the <b>exponential</b>: the waiting time until a clock of rate λ rings. Its one weird property: <b>memoryless</b> — surviving an hour earns you nothing, the remaining wait is always fresh.`,
          task: 'Run <b>10 time units</b> a few times and watch the uptime/down bars fill against the theory slabs.',
          hint: 'The slabs are μ/(λ+μ) and λ/(λ+μ) — the stationary distribution of the machine.',
          okText: 'Long-run shares: fraction working = μ/(λ+μ). Bigger repair rate μ → more uptime. The bars converge there because every state\'s clock keeps renewing.', learn: ['e7-expo'] },
        { predict: { q: 'A component with rate λ has survived 100 hours. Its EXPECTED remaining lifetime is…', placeholder: 'shorter than fresh / same as fresh / longer…', grade: ans => { const t = ans.trim().toLowerCase(); return { right: t.includes('same') || t.includes('fresh'), msg: t.includes('same') ? `Right — <b>exactly as fresh</b>: 1/λ again. Memorylessness. Real hardware WEARS OUT (rising hazard), which is why exponential lifetimes are a MODELING CHOICE, not a law of nature — say that in an interview.` : `<b>Same as fresh</b>: 1/λ. The exponential forgets its age — memorylessness. (Real machines wear out; the exponential is a modeling choice, and knowing when it lies is the skill.)` }; } }, learn: ['e7-memory'] },
        { say: `Counts of arrivals in a window become <b>Poisson</b>(λt) — the number of clock-rings before the window closes. And probability mass between states now FLOWS continuously by the generator matrix Q — the <b>Kolmogorov forward equation</b>, the CTMC's law of motion.`,
          task: 'Drag the break rate λ up and re-run: watch the working share sink toward its theory slab.',
          hint: 'λ ↑ ⇒ the λ/(λ+μ) broken share ↑.',
          okText: `You have now met the whole continuous-time family: exponential clocks, Poisson counts, Kolmogorov flows. DEQN chapter 8 builds heterogeneous-agent models in exactly this language — continuous time, jumps, and a distribution as the state.`, learn: ['e7-kolmo'] },
        { say: `<b>Same lesson, new clothes:</b> E03's columns settle; these bars settle. Both are fixed points of flow. The mathematics does not care that one ticks and the other drifts.`
        }
      ]
    });

    byId.e8.story = () => ({
      title: 'E08 · Crowds', subtitle: 'Luck, tails, and the tax',
      steps: [
        { say: `Four hundred agents start identical. Each year every agent's wealth is multiplied by a random growth factor (same distribution for everyone!). No skill, no effort, no inheritance — <b>pure luck</b>. Watch what inequality does.`,
          task: 'Set γ = 0 and press <b>25 years</b>.',
          hint: 'Look at the shape of the sorted curve — especially its right end.',
          okText: 'A distribution grew out of nothing: most agents shrink toward the left, a few ride lucky streaks into a fat <b>right tail</b>. Multiplicative shocks + reinvestment = the <b>Kesten mechanism</b>. Inequality without differences.', learn: ['e8-kesten'] },
        { predict: { q: 'You switch on redistribution γ = 0.2 (20% of mean wealth returned each year). The long-run Gini will…', placeholder: 'rise / fall / vanish…', grade: ans => { const t = ans.trim().toLowerCase(); return { right: t.startsWith('fall'), msg: t.startsWith('fall') ? `Right — <b>fall</b>: the γ-mean term fights the multiplicative spread, and the two reach a balance. A stationary INEQUALITY — not zero, not explosion: a level set by luck's variance and the tax. Slide γ and press 25 years.` : `<b>Fall</b> — and settle: the redistribution term pushes back against multiplicative luck until they balance. The Gini lands at a level that depends on γ. Try it.` }; } }, learn: ['e8-gini'] },
        { say: `This is why heterogeneous-agent macro (DEQN ch 5–6) is hard AND necessary: the state of the economy is not one household — it is the whole <b>distribution</b>. One agent is E02; four hundred agents is this station; and the distribution's tail sets aggregate consumption and the price of risk.`,
          task: 'Try γ = 0 (pure luck) vs γ = 0.3, 25 years each. Watch p99/median in the panel.',
          hint: 'The tail ratio is the story: how many medians does the luckiest agent own?',
          okText: `γ = 0: the tail keeps stretching (Kesten without dampening has no stationary law — the math says the tail dominates). γ > 0: a stationary distribution with a tail you can measure. That single dial is a whole political economy debate in one slider.`, learn: ['e8-ha'] },
        { say: `<b>Honest note:</b> real wealth dynamics add skill, bequests, and returns-to-scale. The station's claim is narrower and sharper: <b>multiplicative luck ALONE already generates dramatic inequality</b>. Whatever else reality adds, it is building on this mechanism.`
        }
      ]
    });

    byId.e9.story = () => ({
      title: 'E09 · Deep net', subtitle: 'A net for a policy',
      steps: [
        { say: `E05 solved the growth model with a grid of 60 points and hundreds of sweeps — fine for ONE state variable. Real models have hundreds: the distribution of E08, the capital of two countries (DEQN ch 3), generations overlapping (ch 5). Grids drown; the <b>curse of dimensionality</b> is the wall.`,
          task: 'With the net untrained, press <b>train 200 steps</b> and watch the blue curve lurch toward the dots.',
          hint: 'The dots are samples of the TRUE optimal rule — generated from E05\'s closed form.',
          okText: 'The network — the same 60-line autograd engine you built in Build-X — is fitting a POLICY FUNCTION from samples. It never sees the equation, only examples of its solution.', learn: ['e9-curse'] },
        { predict: { q: 'You cut the samples from 200 to 10 but keep training. The worst policy error will…', placeholder: 'rise / fall / stay…', grade: ans => { const t = ans.trim().toLowerCase(); return { right: t.startsWith('rise'), msg: t.startsWith('rise') ? `Right — <b>rise</b>: between samples the net must INTERPOLATE, and interpolation error is exactly what "data hunger" means. Slide samples to 10 and train — the curve wobbles where the dots are sparse.` : `<b>Rise</b>. Between samples, the net guesses — and guessing is the gap you see when data is thin. Slide the samples down to 10 and train again.` }; } }, learn: ['e9-data'] },
        { say: `Now the DEQN idea in full: <b>sample states, evaluate the true rule there (or the Bellman residual there), train the net, and use the NET as the solver</b>. Solving once costs training; evaluating costs one forward pass — anywhere, including points no grid ever held. That exchange rate is the whole method.`,
          task: 'Press <b>train 2000</b> and read the worst policy error in the panel.',
          hint: 'Under a few percent of the rule\'s scale, the net is usable as the model\'s solution.',
          okText: `One solve, evaluated everywhere. Deep equilibrium nets (DEQN ch 2–3) scale this exact trick to models with dozens of states — where value iteration would need more gridpoints than atoms in the universe.`, learn: ['e9-deqn'] },
        { say: `<b>The thread so far:</b> E05 = the equation. E09 = the learned solver. Next station: what if you know the EQUATION but have no data at all?`
        }
      ]
    });

    byId.e10.story = () => ({
      title: 'E10 · PINN', subtitle: 'The equation is the teacher',
      steps: [
        { say: `Two students, one curve to learn: u(t) = e⁻ᵗ. The red student gets TWO data points. The blue student gets NO data — only the differential equation du/dt + u = 0 at a few collocation times, plus the starting value u(0) = 1.`,
          task: 'Press <b>train both 300 steps</b>.',
          hint: 'Watch what happens BETWEEN the two data dots (t = 0.5 and 2.5).',
          okText: 'The data net nails its two dots and free-falls between them — it has no reason not to. The physics net, graded on the EQUATION\'s residual, must be an exponential everywhere: every point it occupies is graded, not just two.', learn: ['e10-residual'] },
        { predict: { q: 'Delete even the two data points. Can the physics net still learn the curve (it keeps u(0)=1 and the equation)?', placeholder: 'yes / no…', grade: ans => { const t = ans.trim().toLowerCase(); return { right: t.startsWith('yes'), msg: t.startsWith('yes') ? `Right — <b>yes</b>: the equation plus one boundary value pins the whole family down (u′ = −u forces the SHAPE; u(0)=1 fixes the constant). That is why the station never needed trajectory data. Data is one teacher; structure is another.` : `<b>Yes</b> — the equation forces the shape (u′ = −u ⇒ exponential), and u(0) = 1 fixes WHICH exponential. The residual never saw a single trajectory point. Structure itself is a teacher.` }; } }, learn: ['e10-nodata'] },
        { say: `Where does the derivative come from? The forward pass carries <b>du/dt alongside u</b> through every layer (dual numbers), so the residual du/dt + u is a quantity the autograd engine can differentiate. Physics-informed = the loss speaks calculus.`,
          task: 'Train 1500 more steps and read both worst errors in the panel.',
          hint: 'Physics error should be several times smaller than data-only error.',
          okText: `Why economics and climate care: data there is scarce and expensive; equations are known (or partially known). PINNs (DEQN ch 7) spend equations instead of data — and chapter 8's continuous-time models end in exactly the PDEs PINNs were built for.`, learn: ['e10-why'] },
        { say: `<b>Honest note:</b> real PINNs fight stiff equations and bad conditioning daily; this miniature is deliberately friendly. The LESSON is structural: <b>when data is rare and structure is known, grade the structure.</b>`
        }
      ]
    });

    byId.e11.story = () => ({
      title: 'E11 · GP', subtitle: 'The curve with error bars',
      steps: [
        { say: `You may evaluate the expensive model only a handful of times (structural estimation needs thousands of model solves — DEQN ch 10). A <b>Gaussian process</b> turns your samples into a curve PLUS error bars: confident near data, honestly ignorant elsewhere.`,
          task: 'Click the canvas in a gap between the two white dots — evaluate the model there.',
          hint: 'Watch the shaded band collapse where you click and stay wide far away.',
          okText: 'The band IS the model\'s knowledge state. Near data: tight. Far: it reverts to its prior (mean zero, wide σ). Uncertainty you can SEE is uncertainty you can plan around.', learn: ['e11-band'] },
        { predict: { q: 'You may take ONE more evaluation. To learn the curve fastest, place it…', placeholder: 'where?…', grade: ans => { const t = ans.trim().toLowerCase(); return { right: t.includes('uncertain') || t.includes('wide') || t.includes('gap') || t.includes('error') || t.includes('star'), msg: (t.includes('uncertain') || t.includes('wide') || t.includes('gap')) ? `Right — <b>where the error bars are widest</b>. The star on the chart is exactly that point: the upper-confidence-bound rule. Press "sample where UCB says" a few times and watch the band learn the curve like a surveyor.` : `<b>Where the error bars are widest</b> — the gap. The ★ marks that point (the UCB rule). Press "sample where UCB says" repeatedly: each sample kills the uncertainty it lands on, then the star moves. Active learning in one button.` }; } }, learn: ['e11-ucb'] },
        { say: `The kernel length ℓ sets how far knowledge reaches: small ℓ — trust only close neighbors; large ℓ — one sample teaches a whole region. A GP is a <b>prior over functions</b>, and every evaluation is a Bayesian update. That is why the band is principled, not decorative.`,
          task: 'Slide ℓ from 0.3 to 4.0 and watch the band\'s reach change.',
          hint: 'Small ℓ: spiky, narrow confidence. Large ℓ: smooth, generous.',
          okText: `Where this goes: surrogate-based estimation (SMM) wraps this band around an expensive structural model; Bayesian optimization runs your lab experiments; and DEQN ch 9–10 build exactly these surrogates for estimation and policy.`, learn: ['e11-kernel'] },
        { say: `<b>The synthesis thread:</b> E09 learned a policy from data; E10 learned one from an equation; E11 learns from CHOSEN data — and knows what it does not know. Three ways to buy knowledge, three price tags.`
        }
      ]
    });

    byId.e12.story = () => ({
      title: 'E12 · Climate', subtitle: 'The fog ahead',
      steps: [
        { say: `The last model of the wing: emissions warm the planet (one box: ΔT′ = (F − λΔT)/C), warming does damage (a·ΔT²). The fog: nobody knows λ (sensitivity) or a (damage) — only ranges. You choose ONE abatement effort for all scenarios.`,
          task: 'Drag effort to 0.1 and read p95. Then to 0.8. Feel the price of each.',
          hint: 'p95 is the 19th-worst of 20 scenarios — the tail.',
          okText: 'Every choice buys a distribution of outcomes, not a number. The threads on screen are individual futures; the solid lines are p50 and p95 — the middle and the tail.', learn: ['e12-ensemble'] },
        { predict: { q: 'Two planners pick effort: one minimizes the MEAN total cost, one minimizes the 95th-PERCENTILE cost. The tail-aware planner abates…', placeholder: 'more / less / the same…', grade: ans => { const t = ans.trim().toLowerCase(); return { right: t.startsWith('more'), msg: t.startsWith('more') ? `Right — <b>more</b>: the tail is where the quadratic damage lives, and p95 costs grow faster than means. Press "what would the planners choose?" and compare. Same information, different weighting, different policy.` : `<b>More</b>. Quadratic damage makes the p95 grow faster than the mean, so tail-weighting always pushes abatement up. Press "what would the planners choose?" and see the two answers side by side.` }; } }, learn: ['e12-tail'] },
        { say: `This is <b>deep uncertainty</b>: not "we know the probabilities" (risk) but "we cannot even agree on the probabilities" (ambiguity). The social cost of carbon debates, the precautionary principle, DICE-vs-critiques — all of it is this station's slider with real stakes.`,
          task: 'Press "what would the planners choose?" and read both chosen efforts.',
          hint: 'The gap between the two planners IS the value of resolving the fog.',
          okText: `The gap between mean-planner and tail-planner is the <b>value of information</b> — what better climate science is worth buying. DEQN chapter 11 quantifies exactly these gaps under uncertainty; chapter 12 steps back and looks at the whole machine.`, learn: ['e12-deep'] },
        { say: `<b>The wing, once more:</b> E01 priced time · E02 grew capital · E03–E04 put chance into states and choices · E05–E06 optimized across time · E07 made time continuous · E08 grew a distribution · E09–E10 learned solutions · E11 priced ignorance · E12 acted inside it. That is modern quantitative economics as ONE connected machine — and you drove every piece.`
        }
      ]
    });

    ULTRON_STORY.defineNotes([
      { w: 'e1', id: 'e1-compound', t: 'Compounding', d: 'Gain proportional to the stock: geometric growth. Interest on interest — the gap vs simple interest.' },
      { w: 'e1', id: 'e1-double', t: 'Doubling time', d: 'ln 2 / ln(1+r); the rule of 72 approximates it. The pocket calculator of finance.' },
      { w: 'e1', id: 'e1-pv', t: 'Present value', d: 'Divide by (1+r) once per year of waiting. The machine that compares futures arriving at different times.' },
      { w: 'e2', id: 'e2-ss', t: 'Steady state', d: 'Where s·k^α = (n+δ)k: investment exactly replaces break-even. The economy self-corrects toward it.' },
      { w: 'e2', id: 'e2-level', t: 'Level vs growth', d: 'Higher saving lifts the LEVEL of steady output; long-run GROWTH per worker needs technology. Solow\'s punchline.' },
      { w: 'e2', id: 'e2-golden', t: 'Golden rule', d: 'The saving rate maximizing steady consumption — s = α for Cobb-Douglas. Saving more than golden makes you poorer in consumption.' },
      { w: 'e3', id: 'e3-flow', t: 'Distribution flow', d: 'One step: π ← π·P. The matrix is the soul; the distribution is the state.' },
      { w: 'e3', id: 'e3-stationary', t: 'Stationary distribution', d: 'The fixed point π = π·P — where every start ends up, if the chain forgets.' },
      { w: 'e3', id: 'e3-mixing', t: 'Mixing', d: 'How fast a chain forgets its start. Sticky chains mix slowly; the limit is still π.' },
      { w: 'e4', id: 'e4-stop', t: 'Stopping problem', d: 'Accept now or wait one more period? The family: job search, secretary, house selling, options.' },
      { w: 'e4', id: 'e4-benefits', t: 'Benefits and pickiness', d: 'Richer benefits → cheaper waiting → higher reservation wage. Frictions, not laziness, lengthen spells.' },
      { w: 'e4', id: 'e4-reserve', t: 'Reservation wage', d: 'Accept iff offer ≥ w̄ — the one threshold that beats every improvisation. Found by value iteration.' },
      { w: 'e5', id: 'e5-vfi', t: 'Value iteration', d: 'Guess any V, apply the Bellman equation, repeat. Contraction guarantees convergence to the true value function.' },
      { w: 'e5', id: 'e5-beta', t: 'Patience prices the future', d: 'Higher β → eat less today. The rule c(k) = (1−αβ)k^α: β→0 devours, β→1 invests.' },
      { w: 'e5', id: 'e5-grid', t: 'The grid wall', d: 'One state: 60 points. Two: 3,600. A thousand: grids are dead — the curse of dimensionality.' },
      { w: 'e6', id: 'e6-annuity', t: 'The annuity', d: 'c = r/(1+r) × PV of everything. Spread windfalls over a lifetime: a one-off bonus moves c by a sliver.' },
      { w: 'e6', id: 'e6-perm', t: 'Permanent income hypothesis', d: 'Transitory shocks: tiny consumption response. Permanent shocks: full pass-through. The asymmetry is the theory.' },
      { w: 'e6', id: 'e6-smooth', t: 'Consumption smoothing', d: 'Rational consumption is flatter than income. Hand-to-mouth is the counterfactual; variance is the score.' },
      { w: 'e7', id: 'e7-expo', t: 'Exponential clocks', d: 'Waiting time with rate λ: mean 1/λ, memoryless. The atom of continuous time.' },
      { w: 'e7', id: 'e7-memory', t: 'Memorylessness', d: 'Surviving an hour earns nothing: remaining wait is always fresh. A modeling choice — know when it lies.' },
      { w: 'e7', id: 'e7-kolmo', t: 'Kolmogorov flow', d: 'Mass flows between states by the generator Q; stationary shares satisfy πQ = 0. The CTMC law of motion.' },
      { w: 'e8', id: 'e8-kesten', t: 'The Kesten mechanism', d: 'Multiplicative shocks + reinvestment grow a right tail from perfect equality. Inequality without differences.' },
      { w: 'e8', id: 'e8-gini', t: 'Gini and the tax', d: 'Redistribution γ pushes back against luck; the two balance at a stationary inequality level.' },
      { w: 'e8', id: 'e8-ha', t: 'The distribution is the state', d: 'Heterogeneous-agent macro: the whole wealth distribution — not one household — is the economy\'s state variable.' },
      { w: 'e9', id: 'e9-curse', t: 'Curse of dimensionality', d: 'Grid points multiply across states: the wall that kills value iteration in rich models.' },
      { w: 'e9', id: 'e9-data', t: 'Data hunger', d: 'Between samples a net interpolates. Sparse data = wobbly policy: the honest price of learning from examples.' },
      { w: 'e9', id: 'e9-deqn', t: 'Deep equilibrium nets', d: 'Sample states, train a net on the policy or the residual, use the NET as the solver. One training, evaluation anywhere.' },
      { w: 'e10', id: 'e10-residual', t: 'Residual loss', d: 'Grade the equation (du/dt + u) at collocation points, not just data points. Every point occupied is graded.' },
      { w: 'e10', id: 'e10-nodata', t: 'Structure is a teacher', d: 'The equation pins the shape; one boundary value pins the constant. Zero trajectory data needed.' },
      { w: 'e10', id: 'e10-why', t: 'When to go physics-informed', d: 'Data scarce and expensive, equations known: grade the structure. Economics and climate both live here.' },
      { w: 'e11', id: 'e11-band', t: 'The honest band', d: 'A GP returns mean AND variance: confident near data, prior far away. Uncertainty you can plan around.' },
      { w: 'e11', id: 'e11-ucb', t: 'Upper confidence bound', d: 'Sample where mean + 2σ is largest: kill the widest uncertainty first. Active learning in one rule.' },
      { w: 'e11', id: 'e11-kernel', t: 'Kernel length', d: 'ℓ sets how far knowledge reaches. A GP is a prior over functions; each evaluation is a Bayesian update.' },
      { w: 'e12', id: 'e12-ensemble', t: 'Ensembles', d: 'One policy, many futures: report p50 and p95, not a single number. The distribution IS the answer.' },
      { w: 'e12', id: 'e12-tail', t: 'The tail decides', d: 'Quadratic damage makes p95 costs grow faster than means — tail-aware planners abate harder than mean planners.' },
      { w: 'e12', id: 'e12-deep', t: 'Deep uncertainty', d: 'Not risk (known odds) but ambiguity (unknown odds). The planner\'s weighting is the policy.' }
    ]);

    ULTRON_STORY.defineQuiz([
      { w: 'e1', q: 'At 10% interest, a dollar roughly doubles in…', opts: ['5 years', '7 years', '10 years', '20 years'], a: 1, x: 'Rule of 72: 72/10 ≈ 7.2 years. ln2/ln1.1 = 7.27.' },
      { w: 'e2', q: 'Doubling the saving rate forever raises long-run GROWTH per worker…', opts: ['doubles it', 'leaves it unchanged (zero)', 'halves it', 'makes it negative'], a: 1, x: 'Higher s lifts the steady-state LEVEL; growth per worker at any steady state is zero without technology.' },
      { w: 'e3', q: 'The stationary distribution π satisfies…', opts: ['πP = 0', 'π = πP', 'P = Pπ', 'π² = π'], a: 1, x: 'The fixed point of the flow: multiplying by P changes nothing.' },
      { w: 'e4', q: 'More generous unemployment benefits move the reservation wage…', opts: ['down', 'up', 'nowhere', 'to infinity'], a: 1, x: 'Waiting is cheaper → be pickier. Search frictions explain spell lengths without laziness.' },
      { w: 'e5', q: 'Value iteration converges because the Bellman operator is…', opts: ['linear', 'a contraction', 'symmetric', 'random'], a: 1, x: 'Contraction mapping: repeated application has a unique fixed point, reached from any guess.' },
      { w: 'e6', q: 'A one-off lottery windfall should raise a PIH consumer\'s spending by…', opts: ['the full amount', 'about half', 'the annuity share of it', 'nothing ever'], a: 2, x: 'Spread over the horizon: roughly r/(1+r) per period — the sliver.' },
      { w: 'e7', q: 'A memoryless component survives 100 hours. Expected remaining life…', opts: ['grows', 'shrinks', 'equals 1/λ, same as new', 'is undefined'], a: 2, x: 'The exponential forgets its age — which is why it is a modeling CHOICE.' },
      { w: 'e8', q: 'Equal agents with identical multiplicative luck…', opts: ['stay equal', 'develop a right tail', 'all shrink equally', 'converge to the mean'], a: 1, x: 'The Kesten mechanism: reinvested randomness grows a fat tail — inequality without differences.' },
      { w: 'e9', q: 'Deep equilibrium nets beat value iteration when…', opts: ['the model is 1-D', 'states are many (grids drown)', 'data is absent', 'GPUs are banned'], a: 1, x: 'One training, evaluation anywhere — the escape from the curse of dimensionality.' },
      { w: 'e10', q: 'A PINN with zero trajectory data can still learn because…', opts: ['nets are magic', 'the residual + boundary conditions pin the solution', 'the data was implied', 'e⁻ᵗ is easy'], a: 1, x: 'The equation forces the shape; the boundary value fixes the constant. Structure is a teacher.' },
      { w: 'e11', q: 'The UCB rule says: next evaluate…', opts: ['where the mean is highest', 'where mean + 2σ is highest', 'at random', 'at the last sample'], a: 1, x: 'Optimism under uncertainty: aim at the widest error bars first.' },
      { w: 'e12', q: 'Under deep uncertainty, the tail-aware planner abates…', opts: ['less than the mean planner', 'the same', 'more than the mean planner', 'never'], a: 2, x: 'Quadratic damage makes p95 costs dominate means — precaution is priced by the tail.' }
    ]);
  }
};
