**Project**: Cooperation Agreement (TC) No. 050.0125966.23.9
**Partners**: PETROBRAS/CENPES and Institute of Astronomy, Geophysics and Atmospheric Sciences (IAG-USP)
**Focus**: Wind Resource Assessment for Renewable Energy - Brazil (onshore and offshore)

# TC-Renováveis Roadmap

Painel de acompanhamento das etapas e tarefas do TC-Renováveis (vento e ondas, meteo-oceanografia aplicada a O&G e
renováveis). **Qualquer pessoa pode abrir e consultar, sem login.** Quem tem permissão no repositório edita as tarefas
no navegador e salva direto no GitHub. Não precisa instalar nada.

**Endereço:** https://tc-renovaveis-roadmap.vercel.app

---

## 1. Como funciona

```
                 leitura pública (sem token)
Navegador  ─────────────────────────────────►  API do GitHub ──► tasks.json  (repositório público,
           ─────────────────────────────────►                                  fonte oficial)
                 gravação (token, só ao salvar)
    ▲
    └── Vercel entrega só a interface (index.html, style.css, app.js, assets/)
```

- **Os dados ficam só no GitHub**, no arquivo [`tasks.json`](tasks.json). Ao abrir, a página lê a versão mais
  recente pela API pública do GitHub, sem token. Ao clicar em *Salvar no GitHub*, ela grava o arquivo e o GitHub cria
  um commit.
- **A Vercel serve apenas arquivos estáticos.** Não tem build, servidor nem banco de dados. O `tasks.json` fica fora do
  site publicado ([`.vercelignore`](.vercelignore)) para que a página nunca mostre uma cópia congelada no deploy.
  Isso não é proteção de privacidade: o arquivo é público no repositório.
- **Não há backend.** O token, quando usado, vai somente para `api.github.com`.
- **Atualização entre computadores:** cada abertura e cada *Puxar atualizações* consultam o GitHub. A API anônima
  pode servir uma resposta com até ~60 s de atraso logo após um salvamento feito em outro computador. Mesmo assim,
  a detecção de conflito ao salvar é sempre feita com a versão real.
- **Limite da API:** sem token, o GitHub permite 60 consultas por hora por endereço IP, o que basta para uso normal.
  Se a cota acabar, a página lê o arquivo pelo CDN `raw.githubusercontent.com`, que pode atrasar alguns minutos, e o
  indicador mostra *"Sincronizado (via CDN)"*.

### Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | Estrutura da página e barra de sincronização |
| `style.css` | Aparência (tema escuro, responsivo) |
| `app.js` | Interface, edição, cálculo de progresso e integração com a API do GitHub |
| `tasks.json` | **Dados do roadmap** (etapas e tarefas) |
| `assets/` | Logos institucionais |
| `vercel.json` | Hospedagem estática, redirecionamentos de links antigos e cabeçalhos de segurança |
| `.vercelignore` | Impede que `tasks.json` e o README sejam publicados no site |

## 2. Autenticação para salvar (somente para quem edita)

Visualizar não exige nada. Para **gravar**, crie uma vez um **fine-grained personal access token**:

1. GitHub → *Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token*.
2. **Repository access:** *Only select repositories* → `daniloceano/tc-renovaveis-roadmap`.
3. **Permissions → Repository permissions → Contents:** *Read and write*. Nenhuma outra permissão é necessária
   (*Metadata: read* é incluída automaticamente).
4. Defina uma validade (por exemplo, 90 dias) e gere o token.

Quando você clicar em **Salvar no GitHub** pela primeira vez na sessão, a página pede o token. Depois, ele é reutilizado
até você recarregar a página ou clicar em **Esquecer token**.

- O token fica **apenas na memória da aba**. Ele não é gravado em `localStorage`, `sessionStorage`, cookies, URL,
  código ou repositório.
- **Para não colar o token toda vez:** marque *"Oferecer para guardar no gerenciador de senhas do navegador"*. Depois de
  um salvamento bem-sucedido, o Chrome ou o Edge oferecem para guardar o token como senha deste site. Nas próximas
  vezes, basta clicar no campo e escolher a senha salva. Safari, Firefox e gerenciadores como 1Password e Bitwarden
  também preenchem o campo, porque ele é marcado como senha. Use isso apenas em computador pessoal.
- Se o token vazar, revogue-o no GitHub (mesma tela de criação). O estrago fica limitado a gravar neste repositório.

> **Alternativa considerada e não adotada:** um botão *"Entrar com GitHub"* (OAuth) exigiria uma função servidora
> (por exemplo, na Vercel) para guardar o *client secret* e trocar o código pelo token, além de cadastrar um OAuth App.
> Isso traz mais uma peça para manter e um segredo para proteger. O ganho seria evitar colar o token, e o gerenciador
> de senhas já resolve isso. Por isso, ficou de fora.

## 3. Uso

### Visualizar
- A página inicial mostra todas as etapas, as tarefas de cada uma e o progresso geral.
- Clique no título de uma etapa para ver as descrições, os links e as tags, e para editar.

### Editar (alterações locais)
Na página da etapa:

| Ação | Como |
|---|---|
| Mudar status | Use o seletor ao lado da tarefa (Concluído, Em andamento, Planejado, Em espera, Incerto, Descontinuado) |
| Editar título, descrição, tipo, tags e links | Ícone ✎ → **Aplicar** |
| Mover tarefa para outra etapa | Ícone ✎ → campo **Etapa** |
| Reordenar | Setas ↑ ↓ |
| Excluir | Ícone 🗑, com confirmação |
| Nova tarefa | **+ Nova tarefa**, no fim da lista |
| Editar etapa (título, ícone, descrição, links, descontinuada, ordem, exclusão) | **Editar etapa** |
| Nova etapa | **+ Nova etapa**, na página inicial |

O progresso é recalculado na hora. **Nada vai para o GitHub até você clicar em *Salvar no GitHub*.** Se tentar fechar
a página com alterações pendentes, o navegador pede confirmação.

### Os três botões

| Botão | O que faz |
|---|---|
| **Salvar no GitHub** | Valida os dados e grava `tasks.json` com um commit (por exemplo, *"Atualiza tarefas do roadmap: 2 tarefas editadas"*). Só fica ativo quando há alterações, então não gera commits vazios. Se der erro, as alterações continuam na tela. |
| **Puxar atualizações** | Busca a versão mais recente no GitHub, por exemplo a que você salvou em outro computador. Se houver alterações locais não salvas, pede confirmação antes de descartá-las. |
| **Resetar alterações** | Descarta apenas as alterações locais não salvas e volta à última versão carregada ou salva. **Não mexe no GitHub** e não reverte commits. |

### Indicador de estado (ao lado dos botões)

| Indicador | Significado |
|---|---|
| ● Sincronizado com o GitHub | O que você vê é igual ao que está no GitHub. Passe o mouse para ver o horário. |
| ● Alterações não salvas | Há edições locais. Passe o mouse para ver o resumo. |
| ● Sincronizando… / Salvando… | Operação em andamento |
| ● Salvo no GitHub ✓ | Commit confirmado pelo GitHub. O aviso inclui o link para o commit. |
| ● Sincronizado (via CDN) | A cota da API acabou e os dados vieram do CDN do GitHub (podem atrasar alguns minutos) |
| ● Erro de sincronização | Falha de rede ou de permissão. Os detalhes aparecem na faixa vermelha. |
| ● Conflito detectado | O arquivo mudou no GitHub depois que você o carregou (veja a seção 6) |

## 4. Editar o `tasks.json` manualmente

Você pode editar o arquivo direto no GitHub (ícone ✎ do arquivo) ou em qualquer editor de texto. Estrutura:

```json
{
  "modules": [
    {
      "id": "mpas",                         // identificador estável (não mude depois de criado)
      "title": "MPAS",
      "icon": "🌀",
      "description": "Texto da etapa",
      "discontinued": true,                 // opcional; só quando a etapa foi descontinuada
      "links": [{ "label": "Docs", "url": "https://..." }], // opcional
      "tasks": [
        {
          "id": "rotinas-criacao-malha",    // único em todo o arquivo
          "title": "Rotinas de criação de malha",
          "status": "in-progress",          // done | in-progress | planned | on-hold | uncertain | discontinued
          "type": "software",               // software | results | article | patent | planning
          "description": "Texto da tarefa",
          "links": [],                      // opcional
          "tags": ["MPAS", "malha", "grid"] // opcional
        }
      ]
    }
  ]
}
```

*(Os comentários `//` acima são só explicação. JSON real não aceita comentários.)*

- **A ordem na lista é a ordem de exibição**, tanto das etapas quanto das tarefas.
- O tipo `results` aparece na interface como **"Especificação Técnica"**.
- Se o arquivo ficar inválido (vírgula faltando, status desconhecido, id repetido), a página mostra o erro ao
  carregar e não sobrescreve nada. Corrija pelo GitHub.
- Se o roadmap estiver aberto em outra aba, clique em **Puxar atualizações** depois de editar manualmente.

## 5. Publicação

- O projeto na Vercel (`tc-renovaveis-roadmap`) publica automaticamente cada push no `main`. Cada PR ganha um *preview*.
  O [`vercel.json`](vercel.json) declara o site como estático: sem framework, sem instalação e sem build.
- Commits que alteram **apenas** o `tasks.json`, que são os feitos pelo botão *Salvar*, **não** disparam novo deploy
  (`ignoreCommand`). Isso não é necessário, porque os dados são sempre lidos do GitHub.
- Links antigos `/module/<id>` são redirecionados para a página da etapa correspondente.
- **Outro branch:** acrescente `?branch=<nome>` ao endereço para ler e gravar o `tasks.json` de outro branch, por
  exemplo para testes. Um selo amarelo mostra o branch em uso.

**Vercel ou GitHub Pages?** Com o repositório público, as duas opções funcionam para HTML estático. Mantivemos a Vercel
porque:

| | Vercel (atual) | GitHub Pages |
|---|---|---|
| Configuração | Já pronta | Ativar o Pages e escolher o branch |
| Serviços envolvidos | GitHub + Vercel | Só GitHub |
| Preview por PR | Sim, automático | Não (sem configuração extra) |
| Redirecionar links antigos `/module/<id>` | Sim (`vercel.json`) | Não |
| Cabeçalhos de segurança (CSP) | Sim (`vercel.json`) | Não (só via `<meta>`, parcialmente) |
| Deploy a cada salvamento de tarefas | Não (`ignoreCommand`) | Sim (inofensivo, ~1 min) |

Migrar para o Pages eliminaria uma conta de serviço, mas perderia o preview por PR, o redirecionamento e os
cabeçalhos. Não há ganho concreto de simplicidade que justifique a troca agora.

## 6. Problemas comuns

| Situação | O que fazer |
|---|---|
| **"Conflito detectado"** | Alguém (ou você, em outro computador) salvou depois que esta página carregou os dados. Nada foi sobrescrito. (1) Clique em **Baixar minhas alterações (.json)** para guardar uma cópia; (2) clique em **Puxar versão atual**; (3) refaça as edições que faltarem e salve. |
| **Token inválido ou expirado (401)** | A janela de autenticação reaparece com o erro. Gere um novo token (seção 2) e cole-o. Suas alterações locais são mantidas. |
| **Sem permissão (403)** | O token é somente leitura ou não inclui este repositório. Ajuste *Contents: Read and write*. |
| **Não encontrado (404)** ao abrir | O `tasks.json` foi renomeado ou removido do branch (ou o `?branch=` indicado não existe). |
| **Cota da API esgotada** | A página passa a ler pelo CDN automaticamente. Para salvar, o token é usado normalmente. |
| **Falha de rede** | Verifique a conexão e clique em *Salvar* de novo. As alterações continuam na tela. |
| Recarreguei a página e perdi edições | Edições não salvas ficam só na memória. Salve antes de fechar (o navegador avisa). |
| Quero desfazer um salvamento | Use o histórico do GitHub (*History* do `tasks.json`) para ver ou restaurar uma versão anterior. O botão *Resetar* só descarta o que ainda não foi salvo. |

## 7. Histórico e migração

Até outubro de 2026, o roadmap era um app Next.js com os dados em `src/data/roadmap.ts`, um login com senha fixa no
código e edição que apenas gerava trechos de código para colar manualmente. Na migração:

- As 8 etapas e 38 tarefas foram convertidas **sem alterações** para `tasks.json`, preservando ids, textos, status,
  tipos, tags, links e ordem. O conteúdo anterior continua disponível no histórico do git.
- **Critério de progresso corrigido:** tarefas com status *Descontinuado* e etapas marcadas como descontinuadas deixaram
  de contar no denominador. Antes, o progresso geral era 15/38 (39 %); com o critério novo, ficou 15/36 (42 %).
- O login por senha compartilhada foi removido. Com o repositório público, a consulta é aberta, e só a gravação exige
  um token do GitHub com permissão de escrita.

## 8. Como testar (sem tocar nos dados de produção)

Existe o branch de teste `teste-gravacao-roadmap`, com uma cópia do `tasks.json`. Abra o site com
`?branch=teste-gravacao-roadmap`: tudo o que for salvo vai para esse branch, e não para o `main`.

1. **Leitura pública:** abra o endereço numa janela anônima. As 8 etapas devem aparecer sem nenhum pedido de token.
2. **Salvar:** mude o status de uma tarefa → *Salvar no GitHub* → cole o token → aguarde *"Salvo no GitHub ✓"* e
   clique em *ver commit*.
3. **Puxar:** em outro computador ou navegador, abra o mesmo endereço (ou clique em *Puxar atualizações*). A mudança
   deve aparecer (pode levar até ~1 min).
4. **Conflito:** abra o endereço em duas abas. Salve uma alteração na aba A; depois altere e salve na aba B. A aba B
   deve mostrar *"Conflito detectado"* sem sobrescrever o que a aba A salvou.
5. **Resetar:** faça uma alteração e clique em *Resetar alterações*. A tela volta ao último estado salvo, e nada
   muda no GitHub.

Ao terminar, o branch de teste pode ser apagado no GitHub.
