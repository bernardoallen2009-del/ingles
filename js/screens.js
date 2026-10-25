/* Ecrãs: barra de topo, mapa do percurso, fim de lição, palavras e perfil. */
(function () {
  const { useState, useEffect, useMemo } = React;
  const { html, store, game, Icon, SpeakBtn, tts, ymd, pretty } = DUO;

  /* ── Barra de topo ────────────────────────────────── */
  function TopBar({ state }) {
    const lvl = game.levelOf(state.xp);
    const today = game.practicedToday(state);
    return html`<header className="topbar">
      <div className="topbar-inner">
        <img className="brand" src="img/sapo.svg" alt="Inglês na Consulta" />
        <span className=${'stat streak' + (today ? ' lit' : '')} title="Dias seguidos"><${Icon} name="flame" /> ${state.streak}</span>
        <span className="stat xp" title="Nível e XP"><${Icon} name="bolt" /> Nív. ${lvl}<small>${state.xp} XP</small></span>
        <span className="stat hearts" title="Vidas infinitas"><${Icon} name="heart" /> ∞</span>
      </div>
    </header>`;
  }

  /* ── Mapa do percurso ─────────────────────────────── */
  function PathScreen({ state, onStart, onReview }) {
    const next = game.nextLesson(state);
    const plan = game.planStatus(state);
    const mistakes = Object.keys(state.mistakes).length;
    const [nudge, setNudge] = useState(null);
    const hour = new Date().getHours();
    let seq = 0;

    const banner = state.notice && state.notice.type === 'lost'
      ? html`<div className="notice warn"><b>Falhou um dia.</b> Perdeu a série de ${state.notice.n} ${state.notice.n === 1 ? 'dia' : 'dias'}. Faça uma lição hoje para começar uma nova.
          <button type="button" className="linkish" onClick=${() => store.set((s) => ({ ...s, notice: null }))}>Ok</button></div>`
      : !game.practicedToday(state) && state.streak > 0
        ? html`<div className=${'notice' + (hour >= 18 ? ' warn' : '')}><${Icon} name="flame" size=${18} /> ${hour >= 18 ? 'A sua série de ' + state.streak + ' dias acaba à meia-noite. Faça uma lição!' : 'Faça uma lição hoje para manter a série de ' + state.streak + ' dias.'}</div>`
        : null;

    return html`<div className="screen path">
      ${banner}
      <section className="today">
        <div>
          <p className="eyebrow">Plano de ${DUO.planDays} dias</p>
          <h1 className="display">Dia ${Math.min(DUO.planDays, plan.done + 1)} <span className="of">/ ${DUO.planDays}</span></h1>
          <p className="plan-line">${plan.done === 0 ? 'Comece hoje. Uma lição por dia chega.' : plan.diff >= 0 ? (plan.diff === 0 ? 'Está em dia com o plano.' : 'Vai ' + plan.diff + (plan.diff === 1 ? ' lição' : ' lições') + ' à frente do plano.') : 'Está ' + (-plan.diff) + (plan.diff === -1 ? ' lição' : ' lições') + ' atrás do plano.'}</p>
        </div>
        ${next
          ? html`<button type="button" className="btn primary" onClick=${() => onStart(next)}><${Icon} name="play" size=${18} /> ${state.done[next.key] ? 'Repetir' : 'Dia ' + next.lesson.day}</button>`
          : html`<span className="pill">Unidades disponíveis concluídas</span>`}
      </section>

      <button type="button" className="review-card" onClick=${onReview} disabled=${mistakes === 0 && plan.done === 0}>
        <span className="rc-icon"><${Icon} name="loop" size=${26} /></span>
        <span className="rc-text"><b>Revisão inteligente</b>
          <small>${mistakes ? mistakes + (mistakes === 1 ? ' frase em que errou' : ' frases em que errou') : plan.done ? 'Sem erros pendentes. Pratique o que já aprendeu.' : 'Aparece aqui depois da primeira lição.'}</small></span>
        ${mistakes > 0 && html`<span className="count">${mistakes}</span>`}
      </button>

      ${DUO.outline.map((u, ui) => {
        const unit = DUO.units[u.id];
        const doneCount = unit ? unit.lessons.filter((l) => state.done[u.id + '.' + l.day]).length : 0;
        return html`<section key=${u.id} className=${'unit hue-' + u.hue + (unit ? '' : ' soon')}>
          <div className="unit-banner">
            <div><p className="eyebrow">Unidade ${ui + 1} · Dias ${u.from}–${u.to}</p><h2>${u.title}</h2><p className="unit-it" lang="it">${u.it}</p></div>
            ${unit ? html`<span className="unit-count">${doneCount}/${unit.lessons.length}</span>` : html`<span className="unit-count"><${Icon} name="lock" size=${18} /></span>`}
          </div>
          ${unit
            ? html`<ol className="nodes">${unit.lessons.map((l, li) => {
                const key = u.id + '.' + l.day;
                const done = !!state.done[key];
                const current = next && next.key === key;
                const locked = !done && !current;
                const last = li === unit.lessons.length - 1;
                const x = Math.round(Math.sin((seq++) * 0.95) * 34);
                const item = { unit: u, data: unit, lesson: l, key };
                return html`<li key=${key} style=${{ '--x': String(x) }}>
                  ${current && html`<span className="start-tag">${done ? 'Repetir' : 'Começar'}</span>`}
                  <button type="button" aria-label=${'Dia ' + l.day + ': ' + l.title + (done ? ' (concluído)' : locked ? ' (bloqueado)' : '')}
                    className=${'node' + (done ? ' done' : '') + (current ? ' current' : '') + (locked ? ' locked' : '') + (last ? ' last' : '') + (done && state.done[key].perfect ? ' perfect' : '') + (nudge === key ? ' nudge' : '')}
                    onClick=${() => { if (locked) { setNudge(key); setTimeout(() => setNudge(null), 600); } else onStart(item); }}>
                    ${locked ? html`<${Icon} name="lock" size=${22} />` : last ? html`<${Icon} name="trophy" size=${28} />` : done ? html`<${Icon} name="check" size=${30} />` : html`<span className="node-day">${l.day}</span>`}
                  </button>
                  <span className="node-label"><b>Dia ${l.day}</b> ${l.title}</span>
                </li>`;
              })}</ol>`
            : html`<div className="soon-body">
                <div className="dots">${Array.from({ length: u.to - u.from + 1 }, (_, i) => html`<i key=${i}></i>`)}</div>
                <p>Ainda por criar. Quando acabar a unidade anterior, peça ao Claude: “cria a unidade ${ui + 1} do inglês”.</p>
              </div>`}
        </section>`;
      })}
    </div>`;
  }

  /* ── Fim da lição ─────────────────────────────────── */
  function LessonEnd({ sum, onClose }) {
    const acc = Math.round((sum.total / (sum.total + sum.mistakes)) * 100);
    const mins = Math.floor(sum.secs / 60), secs = sum.secs % 60;
    const unitComplete = sum.fresh.some((a) => a.unit);
    return html`<div className="screen end">
      <div className="end-hero">
        <div className=${'end-badge' + (sum.perfect ? ' gold' : '')}><${Icon} name=${sum.review ? 'loop' : sum.perfect ? 'star' : 'check'} size=${58} /></div>
        <h1 className="display">${sum.review ? 'Revisão feita!' : sum.perfect ? 'Lição perfeita!' : 'Lição concluída!'}</h1>
        <p className="end-sub">${sum.review ? 'Os erros que acertou saíram da lista.' : 'Dia ' + sum.lesson.day + ' · ' + sum.lesson.it}</p>
      </div>
      <div className="end-stats">
        <div className="tile xp"><small>XP ganho</small><b>+${sum.xp}</b>${sum.bonus ? html`<em>inclui bónus de ${sum.bonus}</em>` : null}</div>
        <div className="tile acc"><small>Precisão</small><b>${acc}%</b><em>${sum.mistakes} ${sum.mistakes === 1 ? 'erro' : 'erros'}</em></div>
        <div className="tile time"><small>Tempo</small><b>${mins}:${String(secs).padStart(2, '0')}</b><em>${sum.total} exercícios</em></div>
      </div>
      ${sum.streak > sum.streakBefore && html`<div className="end-row streak-up"><${Icon} name="flame" size=${30} /><div><b>${sum.streak} ${sum.streak === 1 ? 'dia seguido' : 'dias seguidos'}</b><small>${sum.streak === 1 ? 'A sua série começou. Volte amanhã!' : 'A série continua. Volte amanhã!'}</small></div></div>`}
      ${sum.level > sum.levelBefore && html`<div className="end-row level-up"><${Icon} name="bolt" size=${30} /><div><b>Subiu para o nível ${sum.level}</b><small>${game.titleOf(sum.level)}</small></div></div>`}
      ${sum.fresh.length > 0 && html`<div className="end-ach">
        <p className="eyebrow">${unitComplete ? 'Unidade completa!' : sum.fresh.length === 1 ? 'Nova conquista' : 'Novas conquistas'}</p>
        ${sum.fresh.map((a) => html`<div key=${a.id} className="ach got pop"><span className="ach-icon"><${Icon} name=${a.icon} size=${26} /></span><div><b>${a.name}</b><small>${a.desc}</small></div></div>`)}
      </div>`}
      <button type="button" className="btn primary wide" onClick=${onClose} autoFocus>Continuar</button>
    </div>`;
  }

  /* ── Palavras ─────────────────────────────────────── */
  function WordsScreen({ state, onReview }) {
    const [q, setQ] = useState('');
    const words = useMemo(() => Array.from(game.wordsLearned(state).entries()), [state.done]);
    const shown = words.filter(([it, pt]) => !q || (it + ' ' + pt).toLowerCase().includes(q.toLowerCase()));
    const weak = Object.entries(state.mistakes).sort(([, a], [, b]) => b.n - a.n).slice(0, 8);
    const label = (ex) => ex.it || ex.q || (ex.pairs && ex.pairs.map((p) => p[1]).join(', ')) || ex.scene;
    return html`<div className="screen words">
      <h1 className="display">Vocabulário</h1>
      <p className="lede">${words.length} ${words.length === 1 ? 'expressão aprendida' : 'expressões aprendidas'}. Toque no altifalante para ouvir.</p>
      ${weak.length > 0 && html`<section className="weak">
        <div className="sec-head"><h2>Onde erra mais</h2><button type="button" className="btn small primary" onClick=${onReview}>Rever agora</button></div>
        <ul>${weak.map(([k, m]) => html`<li key=${k}><span lang="en-GB">${DUO.fillName(label(m.ex), state.name)}</span><span className="miss">${m.n}×</span></li>`)}</ul>
      </section>`}
      ${words.length > 0
        ? html`<div className="search"><input id="word-search" type="search" placeholder="Procurar…" value=${q} onChange=${(e) => setQ(e.target.value)} /></div>
          <ul className="wordlist">${shown.map(([it, pt]) => html`<li key=${it}><${SpeakBtn} text=${it.replace(/…/g, '')} /><b lang="en-GB">${it}</b><span>${pt}</span></li>`)}</ul>`
        : html`<div className="empty"><${Icon} name="book" size=${40} /><p>As expressões aparecem aqui quando acabar a primeira lição.</p></div>`}
    </div>`;
  }

  /* ── Perfil ───────────────────────────────────────── */
  function ProfileScreen({ state }) {
    const lvl = game.levelOf(state.xp);
    const a = game.xpForLevel(lvl), b = game.xpForLevel(lvl + 1);
    const words = game.wordsLearned(state).size;
    const acc = state.stats.ex ? Math.round((state.stats.ok / state.stats.ex) * 100) : 0;
    const [name, setName] = useState(state.name);
    const [backup, setBackup] = useState('');
    const [msg, setMsg] = useState('');
    const [confirmReset, setConfirmReset] = useState(false);
    const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const k = ymd(d); return { k, xp: state.days[k] || 0, label: 'DSTQQSS'[d.getDay()] }; });
    const max = Math.max(50, ...week.map((w) => w.xp));
    const setSetting = (k, v) => store.set((s) => ({ ...s, settings: { ...s.settings, [k]: v } }));

    const copyCode = async () => {
      const code = btoa(unescape(encodeURIComponent(JSON.stringify(store.state))));
      setBackup(code);
      try { await navigator.clipboard.writeText(code); setMsg('Código copiado. Guarde-o num sítio seguro.'); }
      catch (e) { setMsg('Selecione o código abaixo e copie-o.'); }
    };
    const importCode = () => {
      try {
        const data = JSON.parse(decodeURIComponent(escape(atob(backup.trim()))));
        if (!data || typeof data.xp !== 'number') throw new Error('bad');
        store.replace({ ...data, updatedAt: Date.now() }); store.set((s) => game.onOpen(s));
        setMsg('Progresso importado.');
      } catch (e) { setMsg('Esse código não é válido. Confirme que o copiou inteiro.'); }
    };

    return html`<div className="screen profile">
      <section className="level-card">
        <div className="lvl-ring"><b>${lvl}</b><small>nível</small></div>
        <div className="lvl-info">
          <label htmlFor="name-input" className="eyebrow">Apelido (para “Dr …”)</label>
          <input id="name-input" className="name-input" value=${name} placeholder="Ex.: Silva" maxLength="20"
            onChange=${(e) => setName(e.target.value)} onBlur=${() => name !== state.name && store.set((s) => ({ ...s, name: name.trim() }))} />
          <p className="lvl-title">${game.titleOf(lvl)}</p>
          <div className="bar small"><div className="bar-fill" style=${{ width: Math.round(((state.xp - a) / (b - a)) * 100) + '%' }}></div></div>
          <p className="lvl-next">${b - state.xp} XP para o nível ${lvl + 1}</p>
        </div>
      </section>

      <section className="stats-grid">
        <div><small>XP total</small><b>${state.xp}</b></div>
        <div><small>Melhor série</small><b>${state.bestStreak} ${state.bestStreak === 1 ? 'dia' : 'dias'}</b></div>
        <div><small>Lições</small><b>${Object.keys(state.done).length}</b></div>
        <div><small>Expressões</small><b>${words}</b></div>
        <div><small>Precisão</small><b>${acc}%</b></div>
        <div><small>Perfeitas</small><b>${state.stats.perfect}</b></div>
      </section>

      <section className="week">
        <h2>XP desta semana</h2>
        <div className="week-bars">${week.map((w) => html`<div key=${w.k} className=${'wb' + (w.k === ymd() ? ' now' : '')}>
          <span className="wb-val">${w.xp || ''}</span><i style=${{ height: Math.max(3, (w.xp / max) * 100) + '%' }}></i><small>${w.label}</small></div>`)}</div>
      </section>

      <section className="achievements">
        <h2>Conquistas <span className="muted">${Object.keys(state.ach).length}/${game.ACH.length}</span></h2>
        <div className="ach-grid">${game.ACH.map((x) => html`<div key=${x.id} className=${'ach' + (state.ach[x.id] ? ' got' : '')}>
          <span className="ach-icon"><${Icon} name=${state.ach[x.id] ? x.icon : 'lock'} size=${22} /></span><div><b>${x.name}</b><small>${x.desc}</small></div></div>`)}</div>
      </section>

      <section className="settings">
        <h2>Definições</h2>
        <label className="row"><span>Efeitos sonoros</span><input id="set-sound" type="checkbox" checked=${state.settings.sound} onChange=${(e) => setSetting('sound', e.target.checked)} /></label>
        <label className="row"><span>Usar o microfone nos exercícios de falar</span><input id="set-mic" type="checkbox" checked=${state.settings.mic} onChange=${(e) => setSetting('mic', e.target.checked)} /></label>
        <label className="row col"><span>Velocidade da voz inglesa: ${state.settings.rate.toFixed(2)}×</span>
          <input id="set-rate" type="range" min="0.6" max="1.15" step="0.05" value=${state.settings.rate} onChange=${(e) => setSetting('rate', parseFloat(e.target.value))} /></label>
        <button type="button" className="btn ghost small" onClick=${() => tts.speak('Good morning. What brings you in today?')}><${Icon} name="speaker" size=${16} /> Testar voz</button>
        <p className="muted small">${tts.ok ? (tts.voice ? 'Voz: ' + tts.voice.name : 'Sem voz inglesa britânica instalada; a leitura usa a voz padrão.') : 'Este navegador não lê texto em voz alta.'}</p>
      </section>

      <section className="settings">
        <h2>Guardar progresso</h2>
        <p className="muted small">${store.cloud.status === 'cloud' ? 'O seu progresso fica guardado na sua conta Claude e sincroniza entre dispositivos.' : 'O seu progresso fica guardado neste navegador: use sempre o mesmo.'} Para o passar para outro navegador ou dispositivo, use um código.</p>
        <div className="backup-btns">
          <button type="button" className="btn ghost small" onClick=${copyCode}>Copiar código</button>
          <button type="button" className="btn ghost small" disabled=${!backup.trim()} onClick=${importCode}>Importar código</button>
        </div>
        <textarea id="backup-code" className="backup" rows="3" placeholder="Cole aqui um código para importar" value=${backup} onChange=${(e) => setBackup(e.target.value)}></textarea>
        ${msg && html`<p className="small">${msg}</p>`}
        ${confirmReset
          ? html`<div className="reset-confirm"><span>Apagar todo o progresso? Não dá para desfazer.</span>
              <button type="button" className="btn danger small" onClick=${() => { store.replace(null); store.set((s) => ({ ...s })); setConfirmReset(false); }}>Apagar</button>
              <button type="button" className="btn ghost small" onClick=${() => setConfirmReset(false)}>Cancelar</button></div>`
          : html`<button type="button" className="linkish danger-text" onClick=${() => setConfirmReset(true)}>Recomeçar do zero</button>`}
      </section>
    </div>`;
  }

  /* ── Boas-vindas ──────────────────────────────────── */
  function Welcome({ onDone }) {
    const [name, setName] = useState('');
    return html`<div className="screen welcome">
      <img className="welcome-logo" src="img/icon.svg" alt="" />
      <p className="eyebrow">Clinical English · 60 dias</p>
      <h1 className="display">Welcome, Doctor.</h1>
      <p className="lede">Inglês para consultas de endocrinologia com doentes britânicos: colher a história, explicar diagnósticos e tratamentos, falar com empatia. Uma lição por dia, 10 a 15 exercícios, com voz, diálogos e revisão dos erros. Como quer que os doentes a tratem?</p>
      <input id="welcome-name" className="name-input big" value=${name} placeholder="Apelido (ex.: Silva)" maxLength="20" onChange=${(e) => setName(e.target.value)}
        onKeyDown=${(e) => e.key === 'Enter' && onDone(name.trim())} />
      <button type="button" className="btn primary wide" disabled=${!name.trim()} onClick=${() => onDone(name.trim())}>Let's begin</button>
    </div>`;
  }

  Object.assign(DUO, { TopBar, PathScreen, LessonEnd, WordsScreen, ProfileScreen, Welcome });
})();
