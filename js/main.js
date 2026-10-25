/* App: navegação entre mapa, lição, fim de lição, palavras e perfil. */
(function () {
  const { useState, useEffect } = React;
  const { html, store, game, Icon } = DUO;

  function App() {
    const [state, setState] = useState(store.state);
    const [tab, setTab] = useState(() => { try { return localStorage.getItem('inglesconsulta.tab') || 'path'; } catch (e) { return 'path'; } });
    const [run, setRun] = useState(null);
    const [summary, setSummary] = useState(null);

    useEffect(() => store.subscribe(setState), []);
    useEffect(() => { store.connect(); }, []);
    useEffect(() => {
      const onVis = () => {
        if (document.hidden) return;
        store.set((s) => game.onOpen(s), { sync: false });
        store.connect();
      };
      document.addEventListener('visibilitychange', onVis);
      return () => document.removeEventListener('visibilitychange', onVis);
    }, []);
    useEffect(() => { try { localStorage.setItem('inglesconsulta.tab', tab); } catch (e) { /* sem armazenamento */ } }, [tab]);
    useEffect(() => { window.scrollTo(0, 0); }, [tab, run, summary]);

    const start = (l) => {
      const items = l.lesson.ex.map((ex, i) => ({ key: l.unit.id + '.' + l.lesson.day + '.' + i, ex }));
      setRun({ mode: 'lesson', unit: l.unit, lesson: l.lesson, items, id: Date.now() });
    };
    const startReview = () => {
      const items = game.buildReview(store.state);
      if (!items.length) return;
      setRun({ mode: 'review', items, id: Date.now() });
    };

    if (!state.name) {
      return html`<${DUO.Welcome} onDone=${(name) => name && store.set((s) => ({ ...s, name }))} />`;
    }
    if (run) {
      return html`<${DUO.Lesson} key=${run.id} mode=${run.mode} unit=${run.unit} lesson=${run.lesson} items=${run.items} state=${state}
        onExit=${() => setRun(null)}
        onFinish=${(sum) => { setRun(null); setSummary(sum); }} />`;
    }
    if (summary) return html`<${DUO.LessonEnd} sum=${summary} onClose=${() => setSummary(null)} />`;

    return html`<div className="app">
      <${DUO.TopBar} state=${state} />
      <main className="main">
        ${tab === 'path' && html`<${DUO.PathScreen} state=${state} onStart=${start} onReview=${startReview} />`}
        ${tab === 'words' && html`<${DUO.WordsScreen} state=${state} onReview=${startReview} />`}
        ${tab === 'me' && html`<${DUO.ProfileScreen} state=${state} />`}
      </main>
      <nav className="tabbar" aria-label="Secções">
        ${[['path', 'map', 'Percurso'], ['words', 'book', 'Vocabulário'], ['me', 'user', 'Perfil']].map(([id, icon, label]) => html`<button type="button" key=${id}
          className=${'tab' + (tab === id ? ' on' : '')} aria-current=${tab === id ? 'page' : null} onClick=${() => setTab(id)}><${Icon} name=${icon} size=${24} /><span>${label}</span></button>`)}
      </nav>
    </div>`;
  }

  ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);
})();
