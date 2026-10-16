**Project**: Cooperation Agreement (TC) No. 050.0125966.23.9
**Partners**: PETROBRAS/CENPES and Institute of Astronomy, Geophysics and Atmospheric Sciences (IAG-USP)
**Focus**: Wind Resource Assessment for Renewable Energy - Brazil (onshore and offshore)

# TC-Renováveis Roadmap

Painel de acompanhamento das etapas e tarefas do TC-Renováveis (vento e ondas, meteo-oceanografia aplicada a O&G e
renováveis). **Qualquer pessoa pode abrir e consultar, sem login.** O administrador edita as tarefas no navegador e
salva direto no GitHub informando apenas a **senha de edição**. Não precisa instalar nada.

**Endereço:** https://tc-renovaveis-roadmap.vercel.app

---

## 1. Como funciona

```
                     leitura pública (sem senha)
Navegador ───────────────────────────────────────────►  API do GitHub ──► tasks.json
    │                                                        ▲            (repositório público,
    │  "Salvar no GitHub" (cookie de sessão)                 │             fonte oficial)
    └──────────►  Vercel: /api/save  ──(token do servidor)───┘
                  (função serverless)
```

- **Os dados ficam só no GitHub**, no arquivo [`tasks.json`](tasks.json). Ao abrir, a página lê a versão mais
  recente pela API pública do GitHub, sem senha nem token.
- **Para gravar**, a página envia as alterações a uma pequena função na Vercel ([`api/`](api/)). A função confere a
  sessão aberta com a senha de edição, valida os dados e grava o `tasks.json` no GitHub, gerando um commit. O token
  do GitHub fica **só no servidor**; o navegador nunca o vê.
- **O resto é estático:** não há build, framework nem banco de dados. O `tasks.json` fica fora do site publicado
  ([`.vercelignore`](.vercelignore)) para que a página nunca mostre uma cópia congelada no deploy. Isso não é proteção
  de privacidade: o arquivo é público no repositório.
- **Atualização entre computadores:** cada abertura e cada *Puxar atualizações* consultam o GitHub, contornando o cache
  do CDN dele. Assim, um salvamento feito em outro computador aparece imediatamente.
- **Limite da API:** sem token, o GitHub permite 60 consultas por hora por endereço IP, o que basta para uso normal.
  Se a cota acabar, a página lê o arquivo pelo CDN `raw.githubusercontent.com`, que pode atrasar alguns minutos, e o
  indicador mostra *"Sincronizado (via CDN)"*.

### Arquivos

| Arquivo | Função |
|---|---|
| `index.html`, `style.css`, `app.js` | Interface (estática): visualização, edição, progresso, sincronização |
| `tasks.json` | **Dados do roadmap** (etapas e tarefas) |
| `assets/` | Logos institucionais |
| `api/login.mjs`, `api/logout.mjs`, `api/session.mjs`, `api/save.mjs` | Funções serverless: senha, sessão e gravação no GitHub |
| `api/_lib/core.mjs` | Regras comuns: verificação da senha, cookie de sessão, validação dos dados, gravação |
| `scripts/gerar-hash-senha.mjs` | Gera o hash da senha e o segredo de sessão no seu computador |
| `vercel.json` | Hospedagem, redirecionamentos de links antigos e cabeçalhos de segurança |
| `.vercelignore` | Arquivos que não vão para o site publicado |

## 2. Uso no dia a dia

1. Abra o roadmap. A consulta é livre.
2. Edite o que quiser (seção 3) e clique em **Salvar no GitHub**.
3. Na primeira vez da sessão, aparece **Autorização para edição**. Digite a senha de edição e clique em
   **Autorizar e salvar**.
4. Depois disso, por **8 horas** naquele navegador, os próximos salvamentos não pedem senha.
5. Para sair antes do prazo, clique em **Encerrar sessão**, ao lado dos botões, principalmente em computador
   compartilhado.

## 3. Visualizar e editar

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
| **Salvar no GitHub** | Pede a senha de edição se não houver sessão aberta; depois o servidor valida os dados e grava `tasks.json` com um commit (por exemplo, *"Atualiza tarefas do roadmap: 2 tarefas editadas"*). Só fica ativo quando há alterações, então não gera commits vazios. Se der erro, as alterações continuam na tela. |
| **Puxar atualizações** | Não exige senha. Busca a versão mais recente no GitHub, por exemplo a que você salvou em outro computador. Se houver alterações locais não salvas, pede confirmação antes de descartá-las. |
| **Resetar alterações** | Descarta apenas as alterações locais não salvas e volta à última versão carregada ou salva. **Não mexe no GitHub** e não reverte commits. |

### Indicador de estado (ao lado dos botões)

| Indicador | Significado |
|---|---|
| ● Sincronizado com o GitHub | O que você vê é igual ao que está no GitHub. Passe o mouse para ver o horário. |
| ● Alterações não salvas | Há edições locais. Passe o mouse para ver o resumo. |
| ● Sincronizando… / Salvando… | Operação em andamento |
| ● Salvo no GitHub ✓ | Commit confirmado pelo GitHub. O aviso inclui o link para o commit. |
| ● Sincronizado (via CDN) | A cota da API acabou e os dados vieram do CDN do GitHub (podem atrasar alguns minutos) |
| ● Erro de sincronização | Falha de rede, do servidor ou do GitHub. Os detalhes aparecem na faixa vermelha. |
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
  O [`vercel.json`](vercel.json) declara o site como estático (sem framework, instalação ou build); as funções da pasta
  `api/` são detectadas automaticamente.
- Commits que alteram **apenas** o `tasks.json`, que são os feitos pelo botão *Salvar*, **não** disparam novo deploy
  (`ignoreCommand`). Isso não é necessário, porque os dados são sempre lidos do GitHub.
- Links antigos `/module/<id>` são redirecionados para a página da etapa correspondente.
- **Onde cada ambiente grava** (decidido pelo servidor, nunca pelo navegador):
  - **Produção:** sempre no branch `main`.
  - **Preview:** só no branch indicado em `ROADMAP_PREVIEW_BRANCH`, que **não pode** ser `main`. Sem essa variável, o
    preview não grava.
- **Consulta de outro branch:** `?branch=<nome>` no endereço mostra outro branch, só para leitura. Se ele não for o
  branch de gravação do ambiente, o botão *Salvar* avisa e não envia nada.

**Vercel ou GitHub Pages?** Com a função de gravação, a Vercel passou a ser necessária. O GitHub Pages só hospeda
arquivos estáticos e não executaria a função que guarda o token e verifica a senha.

## 6. Configuração inicial (administrador, uma única vez)

Tudo é feito por você, no seu computador e nos painéis do GitHub e da Vercel. Nenhum valor secreto vai para o
repositório nem precisa ser compartilhado com ninguém.

### 6.1 Criar os tokens do GitHub (um para produção, outro para preview)

Para cada um dos dois:

1. GitHub → *Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token*.
2. **Token name:** por exemplo `roadmap-producao` e `roadmap-preview`.
3. **Expiration:** por exemplo 1 ano (anote a data para renovar).
4. **Repository access:** *Only select repositories* → `daniloceano/tc-renovaveis-roadmap`.
5. **Permissions → Repository permissions → Contents:** *Read and write*. Nada mais (*Metadata: read* é automática).
6. Gere e copie o token. Ele só aparece uma vez. Cole-o direto na Vercel (passo 6.3).

### 6.2 Gerar o hash da senha e os segredos de sessão

No terminal, dentro da pasta do repositório (requer Node.js 18 ou mais recente):

```bash
node scripts/gerar-hash-senha.mjs              # pede a senha duas vezes, sem mostrar; imprime o hash
node scripts/gerar-hash-senha.mjs --segredo    # imprime um segredo aleatório (rode duas vezes: produção e preview)
```

- Use uma senha **longa** (mínimo de 12 caracteres; prefira uma frase).
- O script não salva nem envia a senha. Ele imprime uma linha `scrypt$32768$8$1$…`: esse é o valor de
  `ROADMAP_PASSWORD_HASH`.
- Você pode usar a mesma senha em produção e no preview, ou senhas diferentes.

### 6.3 Cadastrar as variáveis na Vercel

Vercel → projeto **tc-renovaveis-roadmap** → *Settings → Environment Variables*. Para cada linha, marque
**Sensitive** e escolha o ambiente indicado:

| Variável | Production | Preview | Conteúdo |
|---|---|---|---|
| `ROADMAP_PASSWORD_HASH` | ✓ | ✓ | Linha `scrypt$…` gerada no passo 6.2 |
| `ROADMAP_SESSION_SECRET` | ✓ (valor A) | ✓ (valor B) | Saída de `--segredo`, **diferente** em cada ambiente |
| `ROADMAP_GITHUB_TOKEN` | ✓ (token de produção) | ✓ (token de preview) | Tokens do passo 6.1, **um por ambiente** |
| `ROADMAP_PREVIEW_BRANCH` | — | ✓ | `teste-gravacao-roadmap` (nunca `main`) |

Não marque *Development*. As variáveis só valem para deployments criados **depois** de salvas: em *Deployments*, abra o
deploy mais recente do ambiente e use **⋯ → Redeploy**.

### 6.4 Limitar tentativas de senha (Firewall da Vercel)

O limite é aplicado na borda da Vercel, antes de a função rodar, e vale para todas as instâncias. O plano gratuito
(Hobby) permite uma regra de rate limiting por projeto. Em *Firewall → Configure → + New Rule*:

- **Name:** `Limite de login do roadmap`
- **If:** *Request Path* · *Equals* · `/api/login`
- **Then:** *Rate Limit* → *Fixed Window* · **Time Window** `600 s` · **Request Limit** `10` · **Key** `IP` ·
  ação **Deny** (ou *Default 429*)
- *Save Rule* → *Review Changes* → *Publish*.

Além disso, cada senha errada leva no mínimo 1,2 s para ser respondida, e o hash scrypt torna inviável testar senhas
em massa mesmo com o hash em mãos.

### 6.5 Proteções da sua conta

- Ative a **autenticação de dois fatores** no GitHub e na Vercel. Quem controla essas contas controla a senha e o token.
- Mantenha a *Deployment Protection* (Vercel Authentication) ligada para os previews. Ela já está ligada hoje.
- Mantenha *Git Fork Protection* ligado (padrão), para que PRs de forks não rodem com os seus segredos.

## 7. Administração: trocar senha, recuperar acesso, trocar token

| Situação | O que fazer |
|---|---|
| **Trocar a senha** | Gere um novo hash (6.2), substitua `ROADMAP_PASSWORD_HASH` na Vercel e faça *Redeploy*. As sessões abertas com a senha antiga deixam de valer automaticamente. |
| **Esqueci a senha** | Não há recuperação por e-mail nem pela página. Basta definir uma senha nova da mesma forma: novo hash → Vercel → *Redeploy*. |
| **Encerrar todas as sessões** (por exemplo, esqueceu um computador logado) | Gere outro segredo (`--segredo`), substitua `ROADMAP_SESSION_SECRET` e faça *Redeploy*. |
| **Token vencido, vazado ou revogado** | GitHub → Fine-grained tokens → *Revoke* no token antigo; crie outro (6.1); substitua `ROADMAP_GITHUB_TOKEN` na Vercel; *Redeploy*. |

A página não tem nenhuma função para criar usuários, trocar senha ou alterar configurações. Só quem administra a
Vercel consegue mudar as credenciais.

## 8. Problemas comuns

| Situação | O que fazer |
|---|---|
| **"Conflito detectado"** | Alguém (ou você, em outro computador) salvou depois que esta página carregou os dados. Nada foi sobrescrito. (1) Clique em **Baixar minhas alterações (.json)** para guardar uma cópia; (2) clique em **Puxar versão atual**; (3) refaça as edições que faltarem e salve. |
| **"Senha incorreta."** | Confira a senha. Depois de muitas tentativas seguidas, o Firewall bloqueia por alguns minutos (*"Muitas tentativas"*). |
| **"Sessão ausente ou expirada"** | A sessão de 8 h venceu, foi encerrada ou a senha/segredo foi trocada na Vercel. Informe a senha de novo. As alterações continuam na tela. |
| **"O salvamento não está disponível neste endereço"** | As variáveis da seção 6.3 não estão configuradas para este ambiente, ou falta o *Redeploy* depois de configurá-las. |
| **"Este endereço grava somente no branch …"** | A página foi aberta com `?branch=` diferente do branch de gravação. Abra o endereço sem `?branch=`. |
| **"O servidor não conseguiu gravar no GitHub"** | O token do servidor venceu, foi revogado, perdeu a permissão *Contents: Read and write* ou o branch não existe. Veja a seção 7. |
| **Falha de rede** | Verifique a conexão e clique em *Salvar* de novo. As alterações continuam na tela. |
| Recarreguei a página e perdi edições | Edições não salvas ficam só na memória. Salve antes de fechar (o navegador avisa). |
| Quero desfazer um salvamento | Use o histórico do GitHub (*History* do `tasks.json`) para ver ou restaurar uma versão anterior. O botão *Resetar* só descarta o que ainda não foi salvo. |


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

## 9. Histórico e migração

Até outubro de 2026, o roadmap era um app Next.js com os dados em `src/data/roadmap.ts`, um login com senha fixa no
código e edição que apenas gerava trechos de código para colar manualmente. Na migração:

- As 8 etapas e 38 tarefas foram convertidas **sem alterações** para `tasks.json`, preservando ids, textos, status,
  tipos, tags, links e ordem. O conteúdo anterior continua disponível no histórico do git.
- **Critério de progresso corrigido:** tarefas com status *Descontinuado* e etapas marcadas como descontinuadas deixaram
  de contar no denominador. Antes, o progresso geral era 15/38 (39 %); com o critério novo, ficou 15/36 (42 %).
- O antigo login por senha fixa no código foi removido. Com o repositório público, a consulta é aberta. A gravação passou
  a exigir a senha de edição, verificada no servidor por hash scrypt, e o token do GitHub saiu do navegador.

## 10. Como testar (sem tocar nos dados de produção)

Depois de configurar as variáveis de **Preview** (seção 6.3), o preview da PR grava somente no branch
`teste-gravacao-roadmap` e já abre mostrando esse branch (selo amarelo no topo).

1. **Consulta pública:** abra o roadmap numa janela anônima. As 8 etapas devem aparecer sem pedido de senha.
2. **Salvar:** mude o status de uma tarefa → *Salvar no GitHub* → senha → *"Salvo no GitHub ✓"* → *ver commit*.
3. **Sessão:** altere outra tarefa e salve. Não deve pedir senha. Recarregue a página e salve de novo; também não.
4. **Encerrar sessão:** clique em *Encerrar sessão*; o próximo salvamento deve pedir a senha.
5. **Senha errada:** deve aparecer *"Senha incorreta."*, sem salvar nada.
6. **Conflito:** abra em duas abas, salve na aba A e depois tente salvar na aba B. A aba B deve mostrar
   *"Conflito detectado"* sem sobrescrever a aba A.
7. **Resetar e puxar:** *Resetar alterações* volta ao último estado salvo; *Puxar atualizações* traz o que foi salvo
   em outra aba.

Ao terminar, o branch de teste pode ser apagado, e a variável `ROADMAP_PREVIEW_BRANCH` removida.
