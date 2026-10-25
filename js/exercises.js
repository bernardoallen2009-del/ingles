/* Componentes dos exercícios.
   Props comuns: ex, item, locked, setCheck(fn|null), submit(result), onMistake(), onDone(result), name */
(function () {
  const { useState, useEffect, useMemo, useRef } = React;
  const { html, shuffle, compare, pretty, tts, mic, sfx, speechScore, clean } = DUO;

  /* ── Ícones (traço simples, herdam a cor) ─────────── */
  const P = {
    speaker: 'M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z',
    slow: 'M3 15c0-4 3.6-7 8-7s8 3 8 7H3zm16 0h2m-17 0v2m14-2v2M8 8l-1-3m8 3 1-3',
    mic: 'M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1a7 7 0 0 0 6-6.9h-2z',
    heart: 'M12 21s-7.5-4.6-9.6-9.1C.9 8.6 3 4.5 6.9 4.5c2.1 0 3.6 1.2 5.1 3 1.5-1.8 3-3 5.1-3 3.9 0 6 4.1 4.5 7.4C19.5 16.4 12 21 12 21z',
    flame: 'M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9.5z',
    bolt: 'M13 2 4 14h7l-1 8 9-12h-7l1-8z',
    star: 'm12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9L12 2.5z',
    check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z',
    x: 'M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7l1.4-1.4 6.3 6.3 6.3-6.3 1.4 1.4z',
    trophy: 'M7 4h10v3a5 5 0 0 1-10 0V4zm10 1h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3m3 4h4v3h3v3H7v-3h3v-3z',
    book: 'M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17zM6.5 19H20v3H6.5',
    ear: 'M17 9a5 5 0 0 0-10 0c0 2 1 3 1.5 4S9 15 9 16.5a3.5 3.5 0 0 0 7 0M12 9a2 2 0 0 0-2 2',
    loop: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3',
    step: 'M5 18h4v-4h4v-4h4V6h3',
    lock: 'M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1zm2 0h6V7a3 3 0 0 0-6 0v3z',
    map: 'M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2zm0 0v16m6-14v16',
    user: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm-8 9a8 8 0 0 1 16 0H4z',
    play: 'M8 5v14l11-7L8 5z',
    keyboard: 'M3 6h18v12H3V6zm3 3h2m3 0h2m3 0h2M6 12h2m3 0h2m3 0h2M8 15h8',
    spark: 'M12 2v6m0 8v6M2 12h6m8 0h6M5 5l4 4m6 6 4 4M19 5l-4 4m-6 6-4 4',
  };
  const STROKE = new Set(['slow', 'trophy', 'book', 'ear', 'loop', 'step', 'map', 'keyboard', 'spark']);
  function Icon({ name, size = 22, cls = '' }) {
    const stroke = STROKE.has(name);
    return html`<svg className=${'icon ' + cls} width=${size} height=${size} viewBox="0 0 24 24" aria-hidden="true"
      fill=${stroke ? 'none' : 'currentColor'} stroke=${stroke ? 'currentColor' : 'none'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d=${P[name]} /></svg>`;
  }

  const fillName = (s, name) => String(s).replace(/\{nome\}/g, name || 'Silva');

  function SpeakBtn({ text, big, slow }) {
    const [on, setOn] = useState(false);
    const play = (rate) => { if (tts.speak(text, rate)) { setOn(true); setTimeout(() => setOn(false), 900); } };
    return html`<span className="speak-btns">
      <button type="button" className=${'sbtn' + (big ? ' big' : '') + (on ? ' on' : '')} onClick=${() => play()} aria-label="Ouvir em inglês"><${Icon} name="speaker" size=${big ? 34 : 20} /></button>
      ${slow && html`<button type="button" className="sbtn slow" onClick=${() => play(0.6)} aria-label="Ouvir devagar"><${Icon} name="slow" size=${big ? 26 : 18} /></button>`}
    </span>`;
  }

  /* Teclas de acentos italianos para o teclado do telemóvel. */
  function AccentBar({ inputRef, value, setValue }) {
    const add = (ch) => {
      const el = inputRef.current;
      const start = el ? el.selectionStart : value.length, end = el ? el.selectionEnd : value.length;
      const next = value.slice(0, start) + ch + value.slice(end);
      setValue(next);
      requestAnimationFrame(() => { if (el) { el.focus(); el.setSelectionRange(start + 1, start + 1); } });
    };
    return html`<div className="accents">${['à', 'è', 'é', 'ì', 'ò', 'ù', "'"].map((c) => html`<button type="button" key=${c} onClick=${() => add(c)}>${c}</button>`)}</div>`;
  }

  function TextAnswer({ value, setValue, lang, locked, placeholder, onEnter }) {
    const ref = useRef(null);
    useEffect(() => { if (ref.current && window.matchMedia('(pointer:fine)').matches) ref.current.focus(); }, []);
    return html`<div className="text-answer">
      <textarea id="answer-input" ref=${ref} value=${value} disabled=${locked} rows="3" lang=${lang === 'en' ? 'en-GB' : 'pt-PT'}
        placeholder=${placeholder} autoComplete="off" autoCorrect="off" autoCapitalize="sentences" spellCheck="false"
        onChange=${(e) => setValue(e.target.value)}
        onKeyDown=${(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onEnter && onEnter(); } }}></textarea>
    </div>`;
  }

  /* ── Escolha múltipla ─────────────────────────────── */
  function ChoiceEx({ ex, locked, setCheck }) {
    const opts = useMemo(() => shuffle(ex.options), [ex]);
    const [sel, setSel] = useState(null);
    useEffect(() => { setCheck(sel == null ? null : () => ({ ok: sel === ex.a, answer: ex.a, rule: ex.rule })); }, [sel]);
    useEffect(() => {
      const onKey = (e) => { const n = parseInt(e.key, 10); if (!locked && n >= 1 && n <= opts.length) setSel(opts[n - 1]); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [locked]);
    return html`<div className="ex">
      <p className="eyebrow">Escolha a resposta certa</p>
      <h2 className="prompt">${ex.q}</h2>
      <div className="choices">
        ${opts.map((o, i) => html`<button type="button" key=${o} disabled=${locked} className=${'choice' + (sel === o ? ' sel' : '')}
          onClick=${() => { sfx('tap'); setSel(o); }}><kbd>${i + 1}</kbd><span>${o}</span></button>`)}
      </div>
    </div>`;
  }

  /* ── Preencher o espaço ───────────────────────────── */
  function FillEx({ ex, locked, setCheck }) {
    const [before, after] = ex.it.split('___');
    const opts = useMemo(() => (ex.options ? shuffle(ex.options) : null), [ex]);
    const [sel, setSel] = useState('');
    const full = before + ex.a + (after || '');
    useEffect(() => {
      setCheck(!sel.trim() ? null : () => {
        const r = opts ? { ok: sel === ex.a } : compare(sel, [ex.a], 'en');
        return { ...r, answer: full, rule: ex.rule, say: full, meaning: ex.pt };
      });
    }, [sel]);
    return html`<div className="ex">
      <p className="eyebrow">Complete a frase</p>
      <div className="fill-sentence" lang="en-GB">
        <span>${before}</span>
        ${opts
          ? html`<button type="button" className=${'blank' + (sel ? ' filled' : '')} disabled=${locked} onClick=${() => setSel('')}>${sel || ' '}</button>`
          : html`<input id="fill-input" className="blank-input" value=${sel} disabled=${locked} onChange=${(e) => setSel(e.target.value)} autoComplete="off" autoCapitalize="off" />`}
        <span>${after}</span>
      </div>
      <p className="meaning">${ex.pt}</p>
      ${opts && html`<div className="chips">${opts.map((o) => html`<button type="button" key=${o} disabled=${locked || sel === o}
        className=${'chip' + (sel === o ? ' used' : '')} onClick=${() => { sfx('tap'); setSel(o); }}>${o}</button>`)}</div>`}
    </div>`;
  }

  /* ── Traduzir ─────────────────────────────────────── */
  function TranslateEx({ ex, item, locked, setCheck, submitNow }) {
    const toIt = ex.dir === 'pt-en';
    const extra = (DUO.store.state.extra[item.key]) || [];
    const answers = ex.a.concat(extra);
    const [kbd, setKbd] = useState(!ex.tiles);
    const [text, setText] = useState('');
    const bank = useMemo(() => {
      if (!ex.tiles) return [];
      const words = clean(ex.a[0]).split(' ').concat(ex.tiles);
      return shuffle(words).map((w, i) => ({ id: 't' + i, w: DUO.properWord(w) }));
    }, [ex]);
    const [picked, setPicked] = useState([]);
    const value = kbd ? text : picked.map((id) => bank.find((t) => t.id === id).w).join(' ');

    useEffect(() => { if (!toIt) tts.speak(ex.q); }, [ex]);
    useEffect(() => {
      setCheck(!value.trim() ? null : () => {
        const r = compare(value, answers, toIt ? 'en' : 'pt');
        return {
          ...r, answer: pretty(r.best || ex.a[0]), rule: ex.rule, say: toIt ? (r.best || ex.a[0]) : ex.q,
          ask: !r.ok && kbd && DUO.canAsk ? { dir: ex.dir, q: ex.q, user: value, answers } : null,
        };
      });
    }, [value, kbd]);

    return html`<div className="ex">
      <p className="eyebrow">${toIt ? 'Traduza para inglês' : 'Traduza para português'}</p>
      <div className="bubble-q">
        ${!toIt && html`<${SpeakBtn} text=${ex.q} slow />`}
        <h2 className="prompt" lang=${toIt ? 'pt-PT' : 'en-GB'}>${ex.q}</h2>
      </div>
      ${kbd
        ? html`<${TextAnswer} value=${text} setValue=${setText} lang=${toIt ? 'en' : 'pt'} locked=${locked}
            placeholder=${toIt ? 'Escreva em inglês…' : 'Escreva em português…'} onEnter=${submitNow} />`
        : html`<div className="tiles-wrap">
            <div className="tile-line">${picked.map((id) => {
              const t = bank.find((b) => b.id === id);
              return html`<button type="button" key=${id} className="tile" disabled=${locked} onClick=${() => setPicked(picked.filter((p) => p !== id))}>${t.w}</button>`;
            })}</div>
            <div className="tile-bank">${bank.map((t) => html`<button type="button" key=${t.id} disabled=${locked || picked.includes(t.id)}
              className=${'tile' + (picked.includes(t.id) ? ' ghost' : '')}
              onClick=${() => { sfx('tap'); if (toIt) tts.speak(t.w, 1); setPicked(picked.concat(t.id)); }}>${t.w}</button>`)}</div>
          </div>`}
      ${ex.tiles && !locked && html`<button type="button" className="linkish" onClick=${() => { setKbd(!kbd); setPicked([]); setText(''); }}>
        <${Icon} name="keyboard" size=${18} /> ${kbd ? 'Usar peças' : 'Usar teclado'}</button>`}
    </div>`;
  }

  /* ── Ouvir e escrever ─────────────────────────────── */
  function ListenEx({ ex, locked, setCheck, submit, submitNow }) {
    const [text, setText] = useState('');
    const [reveal, setReveal] = useState(!tts.ok);
    useEffect(() => { const t = setTimeout(() => tts.speak(ex.it), 250); return () => clearTimeout(t); }, [ex]);
    useEffect(() => {
      setCheck(!text.trim() ? null : () => ({ ...compare(text, ex.a, 'en'), answer: ex.it, meaning: ex.pt, say: ex.it }));
    }, [text]);
    return html`<div className="ex">
      <p className="eyebrow">Escreva o que ouve</p>
      <div className="listen-stage"><${SpeakBtn} text=${ex.it} big slow /></div>
      ${reveal && html`<p className="hint">Este navegador não lê em voz alta. Copie a frase: <b lang="en-GB">${ex.it}</b></p>`}
      <${TextAnswer} value=${text} setValue=${setText} lang="en" locked=${locked} placeholder="Escreva em inglês…" onEnter=${submitNow} />
      ${!locked && html`<button type="button" className="linkish" onClick=${() => submit({ skip: true })}>Agora não posso ouvir</button>`}
    </div>`;
  }

  /* ── Falar ────────────────────────────────────────── */
  function SpeakEx({ ex, locked, submit }) {
    const st = DUO.store.state;
    const canMic = mic.supported && st.settings.mic && !DUO.micBlocked;
    const [mode, setMode] = useState(canMic ? 'mic' : 'self');
    const [rec, setRec] = useState(false);
    const [heard, setHeard] = useState('');
    const [tries, setTries] = useState(0);
    const [msg, setMsg] = useState('');
    const [listened, setListened] = useState(false);
    const recRef = useRef(null);

    const startRec = () => {
      tts.ok && speechSynthesis.cancel();
      setHeard(''); setMsg(''); setRec(true);
      recRef.current = mic.start({
        onPartial: (t) => setHeard(t),
        onError: (err) => {
          setRec(false);
          if (err === 'no-speech') { setMsg('Não ouvi nada. Carregue no microfone e fale perto do telemóvel.'); return; }
          if (err === 'aborted') return;
          if (err === 'no-start' && !DUO.micStalled && !mic.iosApp) { DUO.micStalled = true; setMsg('O microfone não arrancou. Carregue outra vez no microfone.'); return; }
          DUO.micBlocked = true;
          setMode('self');
          setMsg(err === 'service-not-allowed' ? 'O reconhecimento de voz está desligado neste telemóvel (no iPhone: Definições → Geral → Teclado → Ditado). Por agora, treine em voz alta e avalie-se.' : mic.iosApp ? '' : 'O microfone não está disponível aqui. Treine em voz alta e avalie-se.');
        },
        onFinal: (alts) => {
          setRec(false);
          if (!alts.length) return;
          const best = alts.reduce((b, a) => (speechScore(a, ex.it) > speechScore(b, ex.it) ? a : b), alts[0]);
          const score = speechScore(best, ex.it);
          setHeard(best);
          if (score >= 0.8) submit({ ok: true, answer: ex.it, meaning: ex.pt, note: `Ouvi: "${best}"`, speak: true });
          else if (tries === 0) { setTries(1); setMsg(`Ouvi: "${best}". Quase! Tente outra vez, devagar e com todas as palavras.`); }
          else submit({ ok: false, answer: ex.it, meaning: ex.pt, rule: `Ouvi: "${best}". Ouça o modelo e repita palavra a palavra.`, say: ex.it });
        },
      });
    };
    const stopRec = () => { try { recRef.current && recRef.current.stop(); } catch (e) { /* já parou */ } };
    useEffect(() => () => { try { recRef.current && recRef.current.abort(); } catch (e) { /* nada */ } }, []);

    return html`<div className="ex">
      <p className="eyebrow">Diga esta frase em voz alta</p>
      <div className="bubble-q"><${SpeakBtn} text=${ex.it} slow /><h2 className="prompt" lang="en-GB">${ex.it}</h2></div>
      <p className="meaning">${ex.pt}</p>
      ${mode === 'mic'
        ? html`<div className="mic-stage">
            <button type="button" className=${'mic-btn' + (rec ? ' rec' : '')} disabled=${locked} onClick=${rec ? stopRec : startRec} aria-label=${rec ? 'Parar' : 'Falar'}>
              <${Icon} name="mic" size=${40} />
            </button>
            <p className="mic-label">${rec ? 'A ouvir… fale agora' : 'Carregue e fale em inglês'}</p>
            ${heard && html`<p className="heard" lang="en-GB">“${heard}”</p>`}
          </div>`
        : html`<div className="self-check">
            <ol>
              <li className=${listened ? 'done' : ''}>Ouça o modelo <button type="button" className="sbtn" onClick=${() => { tts.speak(ex.it); setListened(true); }}><${Icon} name="speaker" size=${18} /></button></li>
              <li>Diga a frase em voz alta, duas vezes</li>
              <li>Foi parecido?</li>
            </ol>
            <div className="self-btns">
              <button type="button" className="btn ghost" disabled=${locked} onClick=${() => submit({ ok: false, self: true, noPenalty: true, answer: ex.it, meaning: ex.pt, rule: 'Sem problema: esta frase vai aparecer na sua revisão.' })}>Ainda não</button>
              <button type="button" className="btn primary" disabled=${locked} onClick=${() => submit({ ok: true, self: true, answer: ex.it, meaning: ex.pt, speak: true })}>Disse bem</button>
            </div>
          </div>`}
      ${msg && html`<p className="hint">${msg}</p>`}
      ${!msg && mode === 'self' && mic.iosApp && DUO.micBlocked && html`<p className="hint">No iPhone, o microfone às vezes não funciona pela app do ecrã principal. Para falar com correção automática, abra o site no Safari.</p>`}
      ${!locked && html`<button type="button" className="linkish" onClick=${() => submit({ skip: true })}>Agora não posso falar</button>`}
    </div>`;
  }

  /* ── Ligar pares ──────────────────────────────────── */
  function MatchEx({ ex, onMistake, onDone }) {
    const left = useMemo(() => shuffle(ex.pairs.map((p, i) => ({ i, t: p[0] }))), [ex]);
    const right = useMemo(() => shuffle(ex.pairs.map((p, i) => ({ i, t: p[1] }))), [ex]);
    const [selL, setSelL] = useState(null), [selR, setSelR] = useState(null);
    const [done, setDone] = useState([]);
    const [bad, setBad] = useState(null);
    const errors = useRef(0);

    /* A verificação corre no próprio toque (e não num efeito) para aguentar toques rápidos. */
    const pick = (side, i) => {
      const L = side === 'L' ? i : selL, R = side === 'R' ? i : selR;
      if (L == null || R == null) { side === 'L' ? setSelL(i) : setSelR(i); return; }
      setSelL(null); setSelR(null);
      if (L === R) {
        const next = done.concat(L);
        setDone(next); sfx('ok');
        if (next.length === ex.pairs.length) setTimeout(() => onDone({ ok: errors.current === 0 }), 350);
      } else {
        errors.current++; sfx('bad'); setBad([L, R]); onMistake();
        setTimeout(() => setBad(null), 500);
      }
    };

    const cell = (side, o) => {
      const isDone = done.includes(o.i);
      const isSel = side === 'L' ? selL === o.i : selR === o.i;
      const isBad = bad && (side === 'L' ? bad[0] === o.i : bad[1] === o.i);
      return html`<button type="button" key=${side + o.i} disabled=${isDone} lang=${side === 'R' ? 'en-GB' : 'pt-PT'}
        className=${'pair' + (isDone ? ' done' : '') + (isSel ? ' sel' : '') + (isBad ? ' bad' : '')}
        onClick=${() => { if (side === 'R') tts.speak(o.t, 1); else sfx('tap'); pick(side, o.i); }}>${o.t}</button>`;
    };
    return html`<div className="ex">
      <p className="eyebrow">Liga as palavras</p>
      <h2 className="prompt">${ex.title || 'Português ↔ Inglês'}</h2>
      <div className="match-grid"><div className="col">${left.map((o) => cell('L', o))}</div><div className="col">${right.map((o) => cell('R', o))}</div></div>
    </div>`;
  }

  /* ── Mini-diálogo ─────────────────────────────────── */
  function DialogEx({ ex, name, onMistake, onDone }) {
    const lines = ex.lines;
    const [pos, setPos] = useState(0);
    const [log, setLog] = useState([]);
    const [wrong, setWrong] = useState([]);
    const [rule, setRule] = useState('');
    const [showPt, setShowPt] = useState({});
    const errors = useRef(0);
    const endRef = useRef(null);
    const cur = lines[pos];
    const opts = useMemo(() => (cur && cur.you ? shuffle(cur.you.map((t, i) => ({ t: fillName(t, name), i }))) : []), [pos]);

    useEffect(() => {
      if (!cur) { const t = setTimeout(() => onDone({ ok: errors.current === 0 }), 400); return () => clearTimeout(t); }
      if (!cur.you) {
        tts.speak(cur.it);
        const t = setTimeout(() => { setLog((l) => l.concat({ ...cur })); setPos((p) => p + 1); }, 650);
        return () => clearTimeout(t);
      }
    }, [pos]);
    useEffect(() => { endRef.current && endRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [log, pos]);

    const choose = (o) => {
      if (o.i === cur.a) {
        sfx('ok'); tts.speak(o.t);
        setLog((l) => l.concat({ me: true, it: o.t })); setWrong([]); setRule(''); setPos((p) => p + 1);
      } else {
        sfx('bad'); errors.current++; onMistake(); setWrong((w) => w.concat(o.i)); setRule(cur.rule || '');
      }
    };

    return html`<div className="ex dialog">
      <p className="eyebrow">Mini-diálogo</p>
      <h2 className="prompt scene">${ex.scene}</h2>
      <div className="chat">
        ${log.map((m, k) => m.me
          ? html`<div key=${k} className="msg me" lang="en-GB">${m.it}</div>`
          : html`<div key=${k} className="msg them">
              <span className="who">${m.who}</span>
              <button type="button" className="msg-text" lang="en-GB" onClick=${() => setShowPt({ ...showPt, [k]: !showPt[k] })}>${m.it}</button>
              ${showPt[k] && html`<span className="msg-pt">${m.pt}</span>`}
              <button type="button" className="sbtn mini" onClick=${() => tts.speak(m.it)} aria-label="Ouvir"><${Icon} name="speaker" size=${16} /></button>
            </div>`)}
        ${cur && !cur.you && html`<div className="msg them typing"><span></span><span></span><span></span></div>`}
        <div ref=${endRef}></div>
      </div>
      ${cur && cur.you && html`<div className="replies">
        <p className="reply-label">A sua resposta:</p>
        ${opts.map((o) => html`<button type="button" key=${o.i} disabled=${wrong.includes(o.i)} lang="en-GB"
          className=${'choice reply' + (wrong.includes(o.i) ? ' wrong' : '')} onClick=${() => choose(o)}>${o.t}</button>`)}
        ${rule && html`<p className="rule-inline"><b>Regra:</b> ${rule}</p>`}
      </div>`}
      <p className="hint small">Toque numa fala para ver a tradução.</p>
    </div>`;
  }

  DUO.Icon = Icon;
  DUO.SpeakBtn = SpeakBtn;
  DUO.fillName = fillName;
  DUO.exercises = { choice: ChoiceEx, fill: FillEx, tr: TranslateEx, listen: ListenEx, speak: SpeakEx, match: MatchEx, dialog: DialogEx };
})();
