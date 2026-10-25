/* Núcleo: utilitários, correção de respostas, voz, sons, gravação do progresso e gamificação. */
(function () {
  const html = htm.bind(React.createElement);
  DUO.html = html;

  /* ── Datas ─────────────────────────────────────────── */
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };

  /* ── Texto e correção ──────────────────────────────── */
  const stripAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const clean = (s) => String(s).toLowerCase()
    .replace(/[’`´‘]/g, "'")
    .replace(/[.,!?¿¡;:«»"“”()\-–—…]/g, ' ')
    .replace(/\s*'\s*/g, "'")
    .replace(/\s+/g, ' ').trim();

  const PROPER = ['james', 'walker', 'silva', 'march', 'christmas', 'monday', 'portugal', 'england', 'english', 'mr', 'mrs', 'ms', 'dr', 'lisboa'];
  const UPPER = { i: 'I', gp: 'GP', 'a&e': 'A&E', hba1c: 'HbA1c', tsh: 'TSH' };
  const properWord = (w) => {
    const l = w.toLowerCase();
    if (UPPER[l]) return UPPER[l];
    if (/^i'/.test(l)) return 'I' + w.slice(1);
    return PROPER.includes(l) ? w[0].toUpperCase() + w.slice(1) : w;
  };

  /* Inglês: contrações por extenso, grafia americana → britânica e números em algarismos,
     aplicado à resposta e às soluções, para "I'm" = "I am", "anemia" = "anaemia", "two" = "2". */
  const EN_RULES = [
    [/\b(\w+)'s (been|got)\b/g, '$1 has $2'], [/\bi'm\b/g, 'i am'], [/\b(you|we|they)'re\b/g, '$1 are'],
    [/\b(i|you|we|they)'ve\b/g, '$1 have'], [/\b(i|you|he|she|it|we|they|that|there)'ll\b/g, '$1 will'],
    [/\b(i|you|he|she|we|they)'d\b/g, '$1 would'], [/\bcan't\b/g, 'cannot'], [/\bwon't\b/g, 'will not'],
    [/\b(\w+)n't\b/g, '$1 not'], [/\blet's\b/g, 'let us'], [/\b(\w+)'s\b/g, '$1 is'], [/\bcan not\b/g, 'cannot'],
    [/\b(\w{2,})(ize|izes|ized|izing)\b/g, (m, a, b) => a + b.replace('z', 's')], [/\b(\w{2,})yz(e|es|ed|ing)\b/g, '$1ys$2'],
    [/\b(\w+)or\b/g, (m, a) => (['colour', 'behaviour', 'favour', 'humour', 'tumour', 'labour'].includes(a + 'our') ? a + 'our' : m)],
    [/\b(hypo|hyper)?glycemi(a|c)\b/g, '$1glycaemi$2'], [/\banemi(a|c)\b/g, 'anaemi$1'], [/\bhemoglobin\b/g, 'haemoglobin'],
    [/\bedema\b/g, 'oedema'], [/\bestrogen\b/g, 'oestrogen'], [/\bpediatric/g, 'paediatric'], [/\bcenter\b/g, 'centre'],
    [/\bliters?\b/g, (m) => m.replace('er', 're')], [/\bmom\b/g, 'mum'], [/\bgray\b/g, 'grey'], [/\bprogram\b/g, 'programme'],
  ];
  const NUMS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  const normEn = (s) => {
    let out = s;
    for (const [re, to] of EN_RULES) out = out.replace(re, to);
    return out.split(' ').map((w) => { const i = NUMS.indexOf(w); return i >= 0 ? String(i) : w; }).join(' ');
  };
  const norm = (s, lang) => (lang === 'en' ? normEn(clean(s)) : clean(s));
  const pretty = (s) => {
    const out = String(s).split(' ').map(properWord).join(' ');
    return out.charAt(0).toUpperCase() + out.slice(1);
  };

  const lev = (a, b) => {
    const m = a.length, n = b.length;
    if (Math.abs(m - n) > 1) return 2;
    const d = Array.from({ length: m + 1 }, (_, i) => [i]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  };

  /* Uma palavra com um erro de escrita é tolerada, mas nunca nas terminações (género/número)
     nem em palavras curtas como un/uno, ho/hai — essas são precisamente as regras a aprender. */
  const typoOk = (u, a) => {
    const uw = u.split(' '), aw = a.split(' ');
    if (uw.length !== aw.length) return false;
    let diffs = 0;
    for (let i = 0; i < aw.length; i++) {
      if (uw[i] === aw[i]) continue;
      diffs++;
      const w = aw[i];
      if (diffs > 1 || w.length < 5 || lev(uw[i], w) > 1 || uw[i][0] !== w[0] || uw[i].slice(-1) !== w.slice(-1)) return false;
    }
    return diffs === 1;
  };

  /* lang = língua da resposta esperada ('it' | 'pt') */
  function compare(user, answers, lang) {
    const u = norm(user, lang);
    if (!u) return { ok: false };
    for (const a of answers) if (norm(a, lang) === u) return { ok: true, best: a };
    const ua = stripAccents(u);
    for (const a of answers) if (stripAccents(norm(a, lang)) === ua) return { ok: true, best: a };
    for (const a of answers) if (typoOk(ua, stripAccents(norm(a, lang))))
      return { ok: true, best: a, note: `Quase perfeito! Há um pequeno erro de escrita. O certo é "${pretty(a)}".` };
    return { ok: false, best: answers[0] };
  }

  /* Pontua o que o reconhecimento de voz ouviu: fração das palavras da frase que foram ditas. */
  function speechScore(heard, target) {
    const t = stripAccents(normEn(clean(target))).replace(/'/g, ' ').split(' ').filter(Boolean);
    const h = stripAccents(normEn(clean(heard))).replace(/'/g, ' ').split(' ').filter(Boolean);
    let hit = 0;
    const pool = h.slice();
    for (const w of t) {
      const i = pool.findIndex((x) => x === w || (w.length > 4 && lev(x, w) <= 1));
      if (i >= 0) { hit++; pool.splice(i, 1); }
    }
    return t.length ? hit / t.length : 0;
  }

  /* ── Voz (leitura em inglês britânico) ───────────────── */
  const tts = {
    voice: null,
    get ok() { return typeof window.speechSynthesis !== 'undefined'; },
    init() {
      if (!this.ok) return;
      const pick = this.pick = () => {
        const vs = speechSynthesis.getVoices();
        this.voice = vs.find((v) => /^en[-_]GB/i.test(v.lang) && /google|daniel|kate|serena|martha|arthur|libby|sonia|ryan/i.test(v.name))
          || vs.find((v) => /^en[-_]GB/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
      };
      pick();
      speechSynthesis.addEventListener?.('voiceschanged', pick);
    },
    speak(text, rate) {
      if (!this.ok) return false;
      if (!this.voice) this.pick?.(); // no Android as vozes às vezes só chegam depois
      if (this.current) speechSynthesis.cancel(); // só interrompe se ainda estiver a dizer outra frase
      if (speechSynthesis.paused) speechSynthesis.resume();
      const u = new SpeechSynthesisUtterance(String(text).replace(/_{2,}/g, '…'));
      u.lang = 'en-GB';
      if (this.voice) u.voice = this.voice;
      u.rate = rate || DUO.store.state.settings.rate || 0.95;
      const done = () => { if (this.current === u) this.current = null; };
      u.onend = done; u.onerror = done;
      this.current = u; // guardar a referência também evita que o navegador perca a frase a meio
      speechSynthesis.speak(u);
      return true;
    },
  };
  tts.init();

  /* ── Reconhecimento de voz ─────────────────────────── */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const mic = {
    supported: !!SR,
    start({ onPartial, onFinal, onError }) {
      const r = new SR();
      r.lang = 'en-GB';
      r.interimResults = true;
      r.maxAlternatives = 3;
      let finalTexts = [];
      r.onresult = (e) => {
        const res = e.results[e.results.length - 1];
        onPartial?.(res[0].transcript);
        if (res.isFinal) finalTexts = Array.from(res).map((alt) => alt.transcript);
      };
      r.onerror = (e) => onError?.(e.error || 'error');
      r.onend = () => onFinal?.(finalTexts);
      try { r.start(); } catch (err) { onError?.('not-allowed'); }
      return r;
    },
  };

  /* ── Sons ──────────────────────────────────────────── */
  let actx = null;
  function tone(freq, start, dur, type = 'sine', gain = 0.12) {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, actx.currentTime + start);
    g.gain.exponentialRampToValueAtTime(gain, actx.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + start + dur);
    o.connect(g).connect(actx.destination);
    o.start(actx.currentTime + start); o.stop(actx.currentTime + start + dur + 0.05);
  }
  function audio() {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state !== 'running') actx.resume?.(); // depois de mudar de app ou de uma chamada, o som fica suspenso
    return actx;
  }
  /* O iPhone só deixa tocar som depois de um toque: o primeiro toque desbloqueia os efeitos e a voz. */
  const UNLOCK = ['touchend', 'click', 'keydown'];
  let voiceUnlocked = false;
  function unlockAudio() {
    try {
      const src = audio().createBufferSource();
      src.buffer = actx.createBuffer(1, 1, 22050); src.connect(actx.destination); src.start(0);
    } catch (e) { /* sem áudio */ }
    if (!voiceUnlocked && tts.ok) {
      voiceUnlocked = true;
      const u = new SpeechSynthesisUtterance(''); u.volume = 0; speechSynthesis.speak(u);
    }
    if (actx && actx.state === 'running') UNLOCK.forEach((t) => window.removeEventListener(t, unlockAudio, true));
  }
  UNLOCK.forEach((t) => window.addEventListener(t, unlockAudio, true));
  function sfx(kind) {
    if (!DUO.store.state.settings.sound) return;
    try {
      audio();
      if (kind === 'ok') { tone(659, 0, 0.12); tone(988, 0.09, 0.22); }
      else if (kind === 'bad') { tone(196, 0, 0.18, 'triangle', 0.15); tone(147, 0.12, 0.25, 'triangle', 0.15); }
      else if (kind === 'tap') { tone(520, 0, 0.05, 'sine', 0.05); }
      else if (kind === 'win') { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.3)); }
    } catch (e) { /* sem áudio */ }
  }

  /* ── Progresso: localStorage + db da app (sincroniza entre dispositivos) ── */
  const LS_KEY = 'inglesconsulta.progress.v1';
  const defaults = () => ({
    v: 1, name: '', startDate: ymd(), xp: 0,
    streak: 0, bestStreak: 0, lastDay: null, days: {}, done: {}, mistakes: {}, ach: {},
    stats: { ex: 0, ok: 0, listen: 0, speak: 0, perfect: 0, reviews: 0, combo: 0, lessons: 0 },
    settings: { sound: true, rate: 0.95, mic: true }, extra: {}, notice: null, updatedAt: 0,
  });
  const merge = (raw) => {
    const d = defaults();
    if (!raw || typeof raw !== 'object') return d;
    return { ...d, ...raw, stats: { ...d.stats, ...(raw.stats || {}) }, settings: { ...d.settings, ...(raw.settings || {}) } };
  };
  const readLocal = () => { try { return merge(JSON.parse(localStorage.getItem(LS_KEY))); } catch (e) { return defaults(); } };
  const writeLocal = (s) => { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) { /* sem armazenamento */ } };

  const store = {
    state: readLocal(),
    listeners: new Set(),
    cloud: { ref: null, status: 'local', busy: Promise.resolve(), timer: null },
    subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
    set(updater, { sync = true } = {}) {
      const next = typeof updater === 'function' ? updater(this.state) : updater;
      /* sync:false = mudança derivada (série verificada ao abrir): não conta como progresso novo */
      this.state = sync ? { ...next, updatedAt: Date.now() } : next;
      writeLocal(this.state);
      this.listeners.forEach((fn) => fn(this.state));
      if (sync) this.scheduleCloud();
    },
    replace(raw) { this.state = merge(raw); writeLocal(this.state); this.listeners.forEach((fn) => fn(this.state)); },
    scheduleCloud() {
      if (!this.cloud.ref) return;
      clearTimeout(this.cloud.timer);
      this.cloud.timer = setTimeout(() => this.pushCloud(), 1200);
    },
    pushCloud() {
      const ref = this.cloud.ref;
      if (!ref) return;
      const body = JSON.parse(JSON.stringify(this.state));
      this.cloud.busy = this.cloud.busy.then(() => ref.set(body)).then(
        () => { this.cloud.status = 'cloud'; },
        (e) => { if (e && e.code === 'invalid_argument') this.cloud.ref = null; this.cloud.status = 'local'; },
      );
    },
    async connect() {
      if (!window.claude || !window.claude.use) return;
      try {
        const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
        if (!db || !user) return;
        const id = await user.id();
        if (!id) return;
        const ref = db.doc('data/users/' + id + '/progress');
        const snap = await ref.get();
        this.cloud.ref = ref;
        this.cloud.status = 'cloud';
        const remote = snap.exists ? snap.data() : null;
        if (remote && (remote.updatedAt || 0) > (this.state.updatedAt || 0)) {
          this.replace(JSON.parse(JSON.stringify(remote)));
          this.set((s) => DUO.game.onOpen(s), { sync: false });
        } else if ((this.state.updatedAt || 0) > ((remote && remote.updatedAt) || 0)) {
          this.pushCloud();
        }
        this.listeners.forEach((fn) => fn(this.state));
      } catch (e) { this.cloud.status = 'local'; }
    },
  };

  /* ── Gamificação ───────────────────────────────────── */
  const xpForLevel = (n) => 15 * n * (n - 1);
  const levelOf = (xp) => { let n = 1; while (xp >= xpForLevel(n + 1)) n++; return n; };
  const TITLES = [[25, 'Professor'], [20, 'Senior Consultant'], [15, 'Consultant'], [10, 'Registrar'], [6, 'Core Trainee'], [3, 'Foundation Doctor'], [1, 'Medical Student']];
  const titleOf = (lvl) => TITLES.find(([min]) => lvl >= min)[1];

  const allLessons = () => {
    const out = [];
    for (const u of DUO.outline) {
      const unit = DUO.units[u.id];
      if (unit) unit.lessons.forEach((l) => out.push({ unit: u, data: unit, lesson: l, key: u.id + '.' + l.day }));
    }
    return out;
  };

  const wordsLearned = (s) => {
    const set = new Map();
    for (const { data, lesson, key } of allLessons()) {
      if (!s.done[key]) continue;
      for (const w of lesson.words || []) set.set(w, data.vocab[w] || '');
    }
    return set;
  };

  const unitDone = (s, unitId) => {
    const unit = DUO.units[unitId];
    return !!unit && unit.lessons.every((l) => s.done[unitId + '.' + l.day]);
  };

  const ACH = [
    { id: 'first', name: 'First consultation', desc: 'Complete a primeira lição', icon: 'step', test: (s) => s.stats.lessons >= 1 },
    { id: 'perfect', name: 'Spotless', desc: 'Primeira lição sem erros', icon: 'star', test: (s) => s.stats.perfect >= 1 },
    { id: 'perfect5', name: 'Five stars', desc: '5 lições perfeitas', icon: 'star', test: (s) => s.stats.perfect >= 5 },
    { id: 'streak3', name: 'Three in a row', desc: '3 dias seguidos', icon: 'flame', test: (s) => s.bestStreak >= 3 },
    { id: 'streak7', name: 'One week', desc: '7 dias seguidos', icon: 'flame', test: (s) => s.bestStreak >= 7 },
    { id: 'streak30', name: 'One month', desc: '30 dias seguidos', icon: 'flame', test: (s) => s.bestStreak >= 30 },
    { id: 'streak60', name: 'Plan complete', desc: '60 dias seguidos', icon: 'flame', test: (s) => s.bestStreak >= 60 },
    { id: 'words50', name: '50 expressions', desc: 'Aprenda 50 expressões', icon: 'book', test: (s, c) => c.words >= 50 },
    { id: 'words100', name: '100 expressions', desc: 'Aprenda 100 expressões', icon: 'book', test: (s, c) => c.words >= 100 },
    { id: 'words250', name: '250 expressions', desc: 'Aprenda 250 expressões', icon: 'book', test: (s, c) => c.words >= 250 },
    { id: 'listen10', name: 'Good listener', desc: 'Acerte 10 exercícios de ouvir', icon: 'ear', test: (s) => s.stats.listen >= 10 },
    { id: 'speak10', name: 'Clear voice', desc: 'Acerte 10 exercícios de falar', icon: 'mic', test: (s) => s.stats.speak >= 10 },
    { id: 'combo10', name: 'On a roll', desc: '10 respostas certas seguidas', icon: 'bolt', test: (s) => s.stats.combo >= 10 },
    { id: 'review1', name: 'Revision', desc: 'Faça a primeira revisão', icon: 'loop', test: (s) => s.stats.reviews >= 1 },
    { id: 'xp1000', name: 'A thousand points', desc: 'Junte 1000 XP', icon: 'bolt', test: (s) => s.xp >= 1000 },
    ...DUO.outline.map((u, i) => ({
      id: 'unit_' + u.id, name: 'Unit ' + (i + 1), desc: 'Complete "' + u.title + '"', icon: 'trophy', unit: true,
      test: (s) => unitDone(s, u.id),
    })),
  ];

  const game = {
    ACH, xpForLevel, levelOf, titleOf, allLessons, wordsLearned, unitDone,

    /* Ao abrir a app: verifica se a série foi quebrada. */
    onOpen(s) {
      const today = ymd();
      if (s.lastDay && s.streak > 0 && daysBetween(s.lastDay, today) >= 2) {
        return { ...s, notice: { type: 'lost', n: s.streak, day: today }, streak: 0 };
      }
      return s;
    },

    practicedToday(s) { return s.lastDay === ymd(); },

    bumpStreak(s) {
      const today = ymd();
      if (s.lastDay === today) return s;
      const gap = s.lastDay ? daysBetween(s.lastDay, today) : 99;
      const streak = gap === 1 ? s.streak + 1 : 1;
      return { ...s, streak, bestStreak: Math.max(s.bestStreak, streak), lastDay: today, notice: null };
    },

    /* Regista o erro para a revisão automática (guarda o próprio exercício). */
    addMistake(s, key, ex) {
      const prev = s.mistakes[key];
      const mistakes = { ...s.mistakes, [key]: { n: (prev ? prev.n : 0) + 1, at: Date.now(), ex } };
      const keys = Object.keys(mistakes);
      if (keys.length > 120) {
        keys.sort((a, b) => mistakes[a].at - mistakes[b].at).slice(0, keys.length - 120).forEach((k) => delete mistakes[k]);
      }
      return { ...s, mistakes };
    },
    clearMistake(s, key) {
      const m = s.mistakes[key];
      if (!m) return s;
      const mistakes = { ...s.mistakes };
      if (m.n <= 1) delete mistakes[key]; else mistakes[key] = { ...m, n: m.n - 1 };
      return { ...s, mistakes };
    },

    /* Devolve [estado, novasConquistas]. */
    checkAchievements(s) {
      const ctx = { words: wordsLearned(s).size };
      const fresh = ACH.filter((a) => !s.ach[a.id] && a.test(s, ctx));
      if (!fresh.length) return [s, []];
      const ach = { ...s.ach };
      fresh.forEach((a) => { ach[a.id] = Date.now(); });
      return [{ ...s, ach }, fresh];
    },

    /* Primeira lição por fazer (a "atual" no mapa). */
    nextLesson(s) { return allLessons().find((l) => !s.done[l.key]) || null; },

    buildReview(s) {
      const items = Object.entries(s.mistakes)
        .sort(([, a], [, b]) => b.n - a.n || b.at - a.at)
        .slice(0, 12)
        .map(([key, m]) => ({ key, ex: m.ex, review: true }));
      if (items.length < 8) {
        const pool = [];
        for (const { lesson, key, data } of allLessons()) {
          if (!s.done[key]) continue;
          lesson.ex.forEach((ex, i) => { if (ex.t !== 'dialog') pool.push({ key: data.id + '.' + lesson.day + '.' + i, ex, review: true }); });
        }
        for (const it of shuffle(pool)) {
          if (items.length >= 10) break;
          if (!items.some((x) => x.key === it.key)) items.push(it);
        }
      }
      return shuffle(items);
    },

    planStatus(s) {
      const expected = Math.min(DUO.planDays, daysBetween(s.startDate, ymd()) + 1);
      const done = allLessons().filter((l) => s.done[l.key]).length;
      return { expected, done, diff: done - expected };
    },
  };

  /* ── Pedir ao Claude para avaliar uma tradução ─────── */
  async function askClaude({ dir, q, user, answers }) {
    const sample = window.claude && window.claude.use ? await window.claude.use('sample') : null;
    if (!sample) throw { code: 'not_granted' };
    const prompt = [
      'És professor de inglês clínico de uma médica endocrinologista portuguesa (português de Portugal), nível B2, que atende doentes britânicos.',
      'Exercício de tradução ' + (dir === 'pt-en' ? 'de português para inglês.' : 'de inglês para português.'),
      'Frase original: "' + q + '"',
      'Respostas aceites pela app: ' + answers.map((a) => '"' + a + '"').join(', '),
      'Resposta do aluno: "' + user + '"',
      'Decide se a resposta é uma tradução correta e natural numa consulta. Aceita sinónimos, inglês britânico ou americano, outra ordem natural das palavras e diferenças de pontuação ou maiúsculas. Não aceites erros de gramática, preposições, tempos verbais ou falsos amigos.',
      'Responde só com JSON: {"correct": true ou false, "explanation": "1 a 2 frases curtas em português de Portugal, a tratar a médica por você (forma de cortesia, sem usar a palavra você)"}',
    ].join('\n');
    return sample.json(prompt, { modelTier: 'quick' });
  }

  /* Só mostra "Perguntar ao Claude" quando esta visualização o permite. */
  DUO.canAsk = false;
  if (window.claude && window.claude.use) window.claude.use('sample').then((x) => { DUO.canAsk = !!x; }, () => {});

  Object.assign(DUO, { ymd, daysBetween, shuffle, clean, pretty, properWord, compare, speechScore, tts, mic, sfx, store, game, askClaude });
  store.state = game.onOpen(store.state);
})();
