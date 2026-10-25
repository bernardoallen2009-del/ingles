/* Motor da lição: fila de exercícios, XP, feedback e revisão. */
(function () {
  const { useState, useEffect, useRef, useCallback, useMemo } = React;
  const { html, store, game, sfx, tts, Icon, askClaude, ymd } = DUO;

  const PRAISE = ['Well done!', 'Spot on!', 'Excellent!', 'Exactly!', 'Brilliant!', 'Perfect!', 'Lovely!'];
  const XP_OK = 10, XP_RETRY = 5, XP_REVIEW = 5, BONUS_DONE = 10, BONUS_PERFECT = 20;

  function Burst({ n = 14 }) {
    const bits = useMemo(() => Array.from({ length: n }, (_, i) => ({
      x: (Math.random() * 2 - 1) * 160, y: -60 - Math.random() * 140, r: Math.random() * 360, d: Math.random() * 0.15, c: i % 4,
    })), []);
    return html`<div className="burst" aria-hidden="true">${bits.map((b, i) => html`<i key=${i} className=${'c' + b.c}
      style=${{ '--x': b.x + 'px', '--y': b.y + 'px', '--r': b.r + 'deg', animationDelay: b.d + 's' }}></i>`)}</div>`;
  }

  function Lesson({ mode, unit, lesson, items, state, onExit, onFinish }) {
    const review = mode === 'review';
    const [phase, setPhase] = useState(review || !lesson.tip ? 'play' : 'intro');
    const [queue, setQueue] = useState(items);
    const [idx, setIdx] = useState(0);
    const [status, setStatus] = useState('answer');
    const [result, setResult] = useState(null);
    const [doneKeys, setDoneKeys] = useState(() => new Set());
    const [combo, setCombo] = useState(0);
    const [flash, setFlash] = useState(null);
    const [burst, setBurst] = useState(0);
    const [shake, setShake] = useState(0);
    const [confirmExit, setConfirmExit] = useState(false);
    const [ask, setAsk] = useState(null);
    const run = useRef({ xp: 0, mistakes: 0, tried: new Set(), maxCombo: 0, t0: Date.now(), marked: new Set() });
    const checkRef = useRef(null);
    const [canCheck, setCanCheck] = useState(false);
    const setCheck = useCallback((fn) => { checkRef.current = fn; setCanCheck(!!fn); }, []);

    const total = items.length;
    const item = queue[idx];
    DUO.current = item; /* útil para depurar na consola */
    /* Vidas infinitas: um erro conta para a precisão e para a revisão, mas nunca bloqueia a lição. */
    const markMistake = (it) => {
      run.current.mistakes++;
      setCombo(0);
      if (!run.current.marked.has(it.key)) store.set((s) => game.addMistake(s, it.key, it.ex));
      run.current.marked.add(it.key);
    };

    const bumpCombo = () => {
      setCombo((c) => {
        const n = c + 1;
        run.current.maxCombo = Math.max(run.current.maxCombo, n);
        if (n === 3 || n === 5 || n === 10 || n === 15) setFlash(n);
        return n;
      });
    };

    const gain = (it) => {
      const first = !run.current.tried.has(it.key);
      run.current.xp += review ? XP_REVIEW : first ? XP_OK : XP_RETRY;
    };

    const finalize = (r) => {
      if (!item || status !== 'answer') return;
      setCheck(null);
      if (r.skip) { setDoneKeys((d) => new Set(d).add(item.key)); next(true); return; }
      const t = item.ex.t;
      if (r.ok) {
        sfx('ok'); setBurst((b) => b + 1); bumpCombo(); gain(item);
        setDoneKeys((d) => new Set(d).add(item.key));
        store.set((s) => {
          let n = { ...s, stats: { ...s.stats, ex: s.stats.ex + 1, ok: s.stats.ok + 1,
            listen: s.stats.listen + (t === 'listen' ? 1 : 0), speak: s.stats.speak + (t === 'speak' && !r.self ? 1 : 0) } };
          if (review) n = game.clearMistake(n, item.key);
          return n;
        });
        if (r.say && t !== 'listen') setTimeout(() => tts.speak(r.say), 250);
      } else {
        if (r.noPenalty) {
          setDoneKeys((d) => new Set(d).add(item.key));
          store.set((s) => game.addMistake(s, item.key, item.ex));
        } else {
          sfx('bad'); setShake((x) => x + 1); markMistake(item);
          store.set((s) => ({ ...s, stats: { ...s.stats, ex: s.stats.ex + 1 } }));
          setQueue((q) => q.concat({ ...item }));
        }
      }
      run.current.tried.add(item.key);
      setResult(r); setStatus('feedback'); setAsk(null);
    };

    const handleCheck = () => { if (checkRef.current && status === 'answer') finalize(checkRef.current()); };

    /* Exercícios que se resolvem sozinhos (ligar pares, diálogo). */
    const onMistake = () => { setShake((x) => x + 1); markMistake(item); };
    const onDone = (r) => {
      if (r.ok) { setBurst((b) => b + 1); bumpCombo(); }
      run.current.xp += review ? XP_REVIEW : r.ok ? XP_OK : XP_RETRY;
      setDoneKeys((d) => new Set(d).add(item.key));
      store.set((s) => ({ ...s, stats: { ...s.stats, ex: s.stats.ex + 1, ok: s.stats.ok + (r.ok ? 1 : 0) } }));
      if (review && r.ok) store.set((s) => game.clearMistake(s, item.key));
      setResult({ ok: true, solo: true, clean: r.ok }); setStatus('feedback');
    };

    const finish = () => {
      const perfect = !review && run.current.mistakes === 0;
      const bonus = review ? 0 : BONUS_DONE + (perfect ? BONUS_PERFECT : 0);
      const xp = run.current.xp + bonus;
      const before = store.state;
      let fresh = [];
      store.set((s) => {
        const today = ymd();
        let n = { ...s, xp: s.xp + xp, days: { ...s.days, [today]: (s.days[today] || 0) + xp } };
        n.stats = { ...n.stats,
          lessons: n.stats.lessons + (review ? 0 : 1), perfect: n.stats.perfect + (perfect ? 1 : 0),
          reviews: n.stats.reviews + (review ? 1 : 0), combo: Math.max(n.stats.combo, run.current.maxCombo) };
        if (!review) {
          const key = unit.id + '.' + lesson.day;
          const prev = n.done[key];
          n.done = { ...n.done, [key]: { at: Date.now(), perfect: perfect || !!(prev && prev.perfect), times: (prev ? prev.times : 0) + 1 } };
        }
        n = game.bumpStreak(n);
        const [withAch, got] = game.checkAchievements(n);
        fresh = got;
        return withAch;
      });
      sfx('win');
      onFinish({
        review, perfect, xp, bonus, mistakes: run.current.mistakes, total, secs: Math.round((Date.now() - run.current.t0) / 1000),
        streakBefore: before.lastDay === ymd() ? before.streak : 0, streak: store.state.streak, fresh,
        levelBefore: game.levelOf(before.xp), level: game.levelOf(store.state.xp), unit, lesson,
      });
    };

    function next() {
      setStatus('answer'); setResult(null); setAsk(null); setCheck(null);
      if (idx + 1 >= queue.length) { finish(); return; }
      setIdx(idx + 1);
    }

    const doAsk = async () => {
      setAsk({ loading: true });
      try {
        const v = await askClaude(result.ask);
        if (v && v.correct) {
          setAsk({ ok: true, text: v.explanation });
          setQueue((q) => q.slice(0, -1));
          run.current.mistakes = Math.max(0, run.current.mistakes - 1);
          run.current.xp += XP_OK;
          setDoneKeys((d) => new Set(d).add(item.key));
          store.set((s) => {
            const n = game.clearMistake(s, item.key);
            return { ...n, extra: { ...n.extra, [item.key]: (n.extra[item.key] || []).concat(result.ask.user) } };
          });
          setResult({ ...result, ok: true, rescued: true });
        } else setAsk({ ok: false, text: (v && v.explanation) || 'O Claude também considera que não está certa.' });
      } catch (e) {
        setAsk({ error: true, text: e && e.code === 'rate_limited' ? 'Muitos pedidos seguidos. Tente daqui a pouco.' : 'Não foi possível perguntar ao Claude aqui.' });
      }
    };

    useEffect(() => {
      const onKey = (e) => {
        if (e.key !== 'Enter' || e.defaultPrevented || confirmExit || phase !== 'play') return;
        if (status === 'feedback') { e.preventDefault(); next(); }
        else if (e.target.tagName !== 'TEXTAREA' && checkRef.current) { e.preventDefault(); handleCheck(); }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    });
    useEffect(() => { if (flash) { const t = setTimeout(() => setFlash(null), 1400); return () => clearTimeout(t); } }, [flash]);

    const pct = Math.round((doneKeys.size / total) * 100);
    const Ex = item && DUO.exercises[item.ex.t];
    const solo = item && (item.ex.t === 'match' || item.ex.t === 'dialog');
    const autoSubmit = item && item.ex.t === 'speak';

    if (phase === 'intro') {
      return html`<div className="lesson intro-screen">
        <header className="lesson-top"><button type="button" className="icon-btn" onClick=${() => onExit()} aria-label="Fechar"><${Icon} name="x" /></button></header>
        <div className="intro-card">
          <p className="eyebrow">Dia ${lesson.day} · ${unit.title}</p>
          <h1 className="display">${lesson.it}</h1>
          <p className="intro-sub">${lesson.title}</p>
          <div className="tip"><b>Antes de começar</b>${lesson.tip.split('\n').map((l, i) => html`<p key=${i}>${l}</p>`)}</div>
          <p className="intro-meta">${total} exercícios</p>
        </div>
        <footer className="lesson-foot"><div className="foot-inner"><button type="button" className="btn primary wide" onClick=${() => setPhase('play')}>Começar</button></div></footer>
      </div>`;
    }

    return html`<div className="lesson">
      <header className="lesson-top">
        <button type="button" className="icon-btn" onClick=${() => setConfirmExit(true)} aria-label="Sair da lição"><${Icon} name="x" /></button>
        <div className="bar" role="progressbar" aria-valuenow=${pct} aria-valuemin="0" aria-valuemax="100"><div className="bar-fill" style=${{ width: Math.max(4, pct) + '%' }}></div></div>
        ${review
          ? html`<span className="pill review-pill"><${Icon} name="loop" size=${16} /> Revisão</span>`
          : html`<span className="hearts" title="Vidas infinitas"><${Icon} name="heart" size=${22} /> ∞</span>`}
      </header>
      ${flash && html`<div className="combo-flash" key=${'f' + flash}>${flash} seguidas!</div>`}

      <main className=${'stage' + (shake ? ' shake-' + (shake % 2) : '')}>
        ${Ex && html`<${Ex} key=${idx + ':' + item.key} ex=${item.ex} item=${item} name=${state.name}
          locked=${status !== 'answer'} setCheck=${setCheck} submit=${finalize} submitNow=${handleCheck}
          onMistake=${onMistake} onDone=${onDone} />`}
      </main>

      <footer className=${'lesson-foot' + (status === 'feedback' ? (result.ok ? ' ok' : ' bad') : '')}>
        ${burst > 0 && status === 'feedback' && result.ok && html`<${Burst} key=${burst} />`}
        <div className="foot-inner">
          ${status === 'feedback' && html`<div className="feedback" role="status">
            <div className="fb-head">
              <span className="fb-icon"><${Icon} name=${result.ok ? 'check' : 'x'} size=${26} /></span>
              <h3>${result.ok ? (result.solo && !result.clean ? 'Concluído, com alguns erros' : result.rescued ? 'O Claude deu-lhe razão!' : PRAISE[(idx + doneKeys.size) % PRAISE.length]) : result.self ? 'Fica para a revisão' : 'Resposta correta:'}</h3>
            </div>
            ${!result.ok && result.answer && html`<p className="fb-answer" lang="it">${result.answer}</p>`}
            ${result.note && html`<p className="fb-note">${result.note}</p>`}
            ${result.meaning && html`<p className="fb-meaning">Significa: “${result.meaning}”</p>`}
            ${!result.ok && result.rule && html`<div className="fb-rule"><b>Regra</b><span>${result.rule}</span></div>`}
            ${result.ask && !result.rescued && !ask && html`<button type="button" className="linkish fb-ask" onClick=${doAsk}><${Icon} name="spark" size=${16} /> A minha resposta também está certa? Perguntar ao Claude</button>`}
            ${ask && ask.loading && html`<p className="fb-note">O Claude está a ver a sua resposta…</p>`}
            ${ask && ask.text && html`<p className=${'fb-claude' + (ask.ok ? ' yes' : '')}>${ask.text}</p>`}
          </div>`}
          ${status === 'answer' && !solo && !autoSubmit && html`<button type="button" className="btn primary wide" disabled=${!canCheck} onClick=${handleCheck}>Verificar</button>`}
          ${status === 'answer' && (solo || autoSubmit) && html`<p className="foot-hint">${solo ? 'Resolva o exercício para continuar' : 'Fale ou escolha uma opção'}</p>`}
          ${status === 'feedback' && html`<button type="button" className=${'btn wide ' + (result.ok ? 'primary' : 'danger')} onClick=${() => next()} autoFocus>Continuar</button>`}
        </div>
      </footer>

      ${confirmExit && html`<div className="overlay"><div className="modal">
        <h3>Sair da lição?</h3>
        <p>Perde o XP desta lição.</p>
        <div className="modal-btns">
          <button type="button" className="btn primary" onClick=${() => setConfirmExit(false)}>Continuar a lição</button>
          <button type="button" className="btn ghost" onClick=${() => onExit()}>Sair</button>
        </div>
      </div></div>`}

    </div>`;
  }

  DUO.Lesson = Lesson;
})();
