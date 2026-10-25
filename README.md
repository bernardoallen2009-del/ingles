# Inglês na Consulta: inglês clínico em 60 dias

Uma app ao estilo do Duolingo para uma endocrinologista portuguesa (nível B2) comunicar melhor com doentes britânicos. São 10 unidades de 6 dias, com uma lição por dia. A mascote é um sapo com estetoscópio.

É um site estático: HTML, CSS e JavaScript, sem build. O React vem de uma CDN.

## Estrutura

```
index.html            o site (Vercel, ou http://localhost:8000/ingles/ no computador)
artifact.html         a mesma app na versão do claude.ai (sem <head>; o claude.ai acrescenta-o)
manifest.webmanifest  nome e ícones para "Adicionar ao ecrã principal"
img/                  o sapo: sapo.svg (barra de topo), icon.svg (boas-vindas), PNG para o ecrã principal
css/                  estilos
js/course.js          mapa dos 60 dias (10 unidades) + atalhos para escrever exercícios
js/core.js            correção de respostas, voz en-GB, sons, progresso, XP, séries, conquistas
js/exercises.js       os 7 tipos de exercício
js/lesson.js          o motor da lição (fila, feedback, revisão)
js/screens.js         mapa, fim de lição, vocabulário, perfil
js/main.js            navegação
units/u01.js          Unidade 1: Abrir a consulta e colher a história (dias 1 a 6)
```

## Publicar no Vercel (só da primeira vez)

1. **VS Code:** File → Open Folder… → esta pasta (`ingles`). O repositório Git já está criado, com o primeiro commit feito.
2. **GitHub:** no separador Source Control (o ícone dos ramos, à esquerda), carregue em **Publish Branch**. Escolha *private* ou *public* (o Vercel funciona com os dois) e o nome `ingles-na-consulta`. Se o VS Code pedir, inicie sessão no GitHub.
3. **Vercel:** em [vercel.com](https://vercel.com), entre com a conta do GitHub. Depois **Add New… → Project**, escolha `ingles-na-consulta` e carregue em **Import**.
   - Framework Preset: **Other**
   - Build Command e Output Directory: deixar vazios
   - Carregue em **Deploy**
4. Ao fim de uns segundos tem um link do género `https://ingles-na-consulta.vercel.app`. É esse que se manda à médica.

**No telemóvel:**
- iPhone: abrir no Safari → Partilhar → **Adicionar ao ecrã principal**.
- Android: abrir no Chrome → ⋮ → **Adicionar ao ecrã principal** (ou **Instalar app**).

O ícone fica o sapo e a app abre em ecrã inteiro.

### Atualizar depois

Sempre que mudar alguma coisa (por exemplo, uma unidade nova): Source Control → escrever uma mensagem → **Commit** → **Sync Changes**. O Vercel volta a publicar sozinho em menos de um minuto.

### Diferenças para o link do claude.ai

| | Site (Vercel) | claude.ai |
|---|---|---|
| Ícone no ecrã principal | o sapo | ícone genérico do Claude |
| Microfone nos exercícios de falar | funciona (Chrome; Safari nas versões recentes) | bloqueado, só autoavaliação |
| Onde fica o progresso | no telemóvel | na conta Claude (ou no navegador, sem conta) |
| Botão "Perguntar ao Claude" | não há | há |

O progresso dos dois é separado. Para passar de um para o outro: **Perfil → Copiar código** num, e **Importar código** no outro.

## Como continuar (unidades 2 a 10)

Quando a médica acabar uma unidade, peça ao Claude, na pasta `Duoklingo`:

> Cria a unidade 2 do inglês (Diabetes: explicar e tranquilizar, dias 7 a 12) no mesmo formato de `ingles/units/u01.js`.

O Claude faz três coisas:
- escreve `units/u02.js`;
- acrescenta `<script src="units/u02.js"></script>` **ao `index.html` e ao `artifact.html`**, no sítio marcado;
- republica o claude.ai.

Depois é só fazer Commit + Sync no VS Code para atualizar o site.

Convenções do conteúdo:
- Interface em português europeu, com tratamento formal ("Escolha", "Traduza", "A sua resposta").
- Inglês britânico (GP, A&E, surgery, paracetamol, "summarise"), no registo de consulta: claro, educado e sem jargão para o doente.
- `{nome}` nos diálogos é o apelido da médica ("I'm Dr {nome}").
- As vidas são infinitas.
- Cada lição tem 10 a 15 exercícios, do mais fácil para o mais difícil, e termina com um mini-diálogo.

### Formato de uma lição

```js
{
  day: 7, title: 'O que é a diabetes', it: 'What diabetes is',
  tip: 'Regra ou dica explicada antes de começar…',
  words: ['blood sugar', 'insulin'],                 // chaves do objeto vocab da unidade
  ex: [
    M([['glicemia', 'blood sugar'], ['insulina', 'insulin']]),                         // ligar pares
    M([['hyperglycaemia', 'high blood sugar']], 'Termo médico ↔ Palavras do doente'),  // pares com título próprio
    C('Pergunta?', ['opção certa', 'errada'], 'opção certa', 'Regra se errar'),       // escolha múltipla
    F('Your sugar levels ___ been high.', 'Os seus níveis…', ['have', 'are'], 'have', 'Regra'), // preencher
    T('pt-en', 'Tem sede com frequência?', ['do you often feel thirsty'], 'Regra', ['are']),   // traduzir (peças opcionais)
    L('Have you been feeling more tired than usual?', 'Tem-se sentido mais cansado do que o habitual?'), // ouvir e escrever
    S("Let's go through your results together.", 'Vamos ver os seus resultados juntos.'),     // falar
    D('Consulta de diabetes', [{ who: 'Patient', it: '…', pt: '…' }, { you: ['certa', 'errada'], a: 0, rule: '…' }]), // diálogo
  ],
}
```

## Testar no computador

```bash
cd ~/Duoklingo && python3 -m http.server 8000
```

Depois abra http://localhost:8000/ingles/ no Chrome. O microfone também funciona aqui.
