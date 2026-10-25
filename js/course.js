/* Plano de 60 dias de inglês clínico para endocrinologia + construtores de exercícios.
   As unidades com conteúdo registam-se em units/uXX.js com DUO.addUnit({...}). */
window.DUO = window.DUO || {};

DUO.planDays = 60;

DUO.outline = [
  { id: 'u1',  title: 'Abrir a consulta e colher a história', it: 'Taking a history',          from: 1,  to: 6,  hue: 'teal' },
  { id: 'u2',  title: 'Diabetes: explicar e tranquilizar',    it: 'Explaining diabetes',       from: 7,  to: 12, hue: 'indigo' },
  { id: 'u3',  title: 'Tiroide',                              it: 'Thyroid conditions',        from: 13, to: 18, hue: 'amber' },
  { id: 'u4',  title: 'Medicação e doses',                    it: 'Medication and doses',      from: 19, to: 24, hue: 'coral' },
  { id: 'u5',  title: 'Explicar resultados',                  it: 'Explaining results',        from: 25, to: 30, hue: 'plum' },
  { id: 'u6',  title: 'Peso e estilo de vida',                it: 'Weight and lifestyle',      from: 31, to: 36, hue: 'teal' },
  { id: 'u7',  title: 'Exame físico e procedimentos',         it: 'Examination and procedures', from: 37, to: 42, hue: 'indigo' },
  { id: 'u8',  title: 'Empatia e más notícias',               it: 'Empathy and difficult news', from: 43, to: 48, hue: 'amber' },
  { id: 'u9',  title: 'Suprarrenal, hipófise, SOP e osso',    it: 'Other endocrine conditions', from: 49, to: 54, hue: 'coral' },
  { id: 'u10', title: 'Consultas reais',                      it: 'Real consultations',        from: 55, to: 60, hue: 'plum' },
];

DUO.units = DUO.units || {};
DUO.addUnit = function (unit) { DUO.units[unit.id] = unit; };

/* Construtores curtos para escrever exercícios (a língua-alvo é o inglês; os campos chamam-se "it" por herança do motor).
   M  ligar pares          [[pt, en], ...], título opcional (ex.: 'Termo médico ↔ Palavras do doente')
   C  escolha múltipla     pergunta, opções, resposta (texto), regra
   F  preencher o espaço   frase en com ___, tradução pt, opções, resposta, regra
   T  traduzir             'pt-en' | 'en-pt', frase, respostas aceites, regra, peças extra (opcional)
   L  ouvir e escrever     frase en, tradução pt, respostas extra (opcional)
   S  falar                frase en, tradução pt
   D  mini-diálogo         cena, falas: {who, it, pt} | {you:[opções], a: índice certo, rule}; {nome} = apelido da médica
*/
DUO.ex = {
  M: (pairs, title) => ({ t: 'match', pairs, title }),
  C: (q, options, a, rule, extra) => ({ t: 'choice', q, options, a, rule, ...(extra || {}) }),
  F: (it, pt, options, a, rule) => ({ t: 'fill', it, pt, options, a, rule }),
  T: (dir, q, a, rule, tiles) => ({ t: 'tr', dir, q, a, rule, tiles }),
  L: (it, pt, a) => ({ t: 'listen', it, pt, a: a || [it] }),
  S: (it, pt) => ({ t: 'speak', it, pt }),
  D: (scene, lines) => ({ t: 'dialog', scene, lines }),
};
