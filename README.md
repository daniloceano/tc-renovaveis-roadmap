**Project**: Cooperation Agreement (TC) No. 050.0125966.23.9
**Partners**: PETROBRAS/CENPES and Institute of Astronomy, Geophysics and Atmospheric Sciences (IAG-USP)
**Focus**: Wind Resource Assessment for Renewable Energy - Brazil (onshore and offshore)

# TC-Renováveis Roadmap

Painel de acompanhamento das etapas e tarefas do TC-Renováveis (vento e ondas, meteo-oceanografia aplicada a O&G e
renováveis). Você vê o progresso, edita as tarefas no navegador e salva direto no GitHub. Não precisa instalar nada.

**Endereço:** https://tc-renovaveis-roadmap.vercel.app

---

## 1. Como funciona

```
Navegador ──(token pessoal)──► API do GitHub ──► tasks.json  (repositório privado, fonte oficial)
    ▲
    └── Vercel entrega só a interface (index.html, style.css, app.js, assets/)
```

- **Os dados ficam só no GitHub**, no arquivo [`tasks.json`](tasks.json). A página lê esse arquivo pela API do
  GitHub ao abrir e grava nele quando você clica em *Salvar no GitHub*. Cada gravação gera um commit.
- **A Vercel serve apenas arquivos estáticos.** Não tem build, servidor nem banco de dados. O `tasks.json` não é
  publicado no site (veja [`.vercelignore`](.vercelignore)). Quem não tem token não vê os dados.
- **Não há backend.** O token é enviado somente para `api.github.com`.

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

## 2. Configurar o acesso (uma vez por computador ou por pessoa)

Crie um **fine-grained personal access token** no GitHub:

1. GitHub → *Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token*.
2. **Repository access:** *Only select repositories* → `daniloceano/tc-renovaveis-roadmap`.
3. **Permissions → Repository permissions → Contents:** *Read and write*. Para quem só vai visualizar, use
   *Read-only*. Nenhuma outra permissão é necessária, porque *Metadata: read* é incluída automaticamente.
4. Defina uma validade (por exemplo, 90 dias), gere o token e guarde-o em um gerenciador de senhas.

Ao abrir o roadmap, cole o token e clique em **Conectar**.

> O token fica **apenas na memória da aba**. Ele não é gravado em `localStorage`, `sessionStorage`, cookies, URL ou
> repositório. Por isso, depois de recarregar ou fechar a página, é preciso colá-lo de novo. Se o token vazar,
> revogue-o no GitHub (mesma tela de criação). O estrago fica limitado a este repositório.

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
| ● Erro de sincronização | Falha de rede, de permissão ou de token. Os detalhes aparecem na faixa vermelha. |
| ● Conflito detectado | O arquivo mudou no GitHub depois que você o carregou (veja a seção 6) |

## 4. Editar o `tasks.json` manualmente

Você pode editar o arquivo direto no GitHub (ícone ✎ do arquivo) ou em qualquer editor de texto. Estrutura:

```json
{
  "modules": [
    {
      "id": "mpas",                      // identificador estável (não mude depois de criado)
      "title": "MPAS",
      "icon": "🌀",
      "description": "Texto da etapa",
      "discontinued": true,              // opcional; só quando a etapa foi descontinuada
      "links": [{ "label": "Docs", "url": "https://..." }],   // opcional
      "tasks": [
        {
          "id": "mpas-malha",            // único em todo o arquivo
          "title": "Rotinas de criação de malha",
          "status": "in-progress",       // done | in-progress | planned | on-hold | uncertain | discontinued
          "type": "software",            // software | results | article | patent | planning
          "description": "Texto da tarefa",
          "links": [],                   // opcional
          "tags": ["MPAS", "malha"]      // opcional
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

- O projeto na Vercel (`tc-renovaveis-roadmap`) publica automaticamente cada push no `main`.
  O [`vercel.json`](vercel.json) declara o site como estático: sem framework, sem instalação e sem build.
- Commits que alteram **apenas** o `tasks.json`, que são os feitos pelo botão *Salvar*, **não** disparam
  novo deploy (`ignoreCommand`). Isso não é necessário, porque os dados são sempre lidos do GitHub.
- Links antigos `/module/<id>` são redirecionados para a página da etapa correspondente.

**Por que Vercel e não GitHub Pages?** O repositório é privado. No plano gratuito, o GitHub Pages não publica
repositórios privados, e um site do Pages é sempre público. A Vercel já estava configurada e funciona aqui só como
hospedagem estática. Trocar de hospedagem não traria simplificação.

## 6. Problemas comuns

| Situação | O que fazer |
|---|---|
| **"Conflito detectado"** | Alguém (ou você, em outro computador) salvou depois que esta página carregou os dados. Nada foi sobrescrito. (1) Clique em **Baixar minhas alterações (.json)** para guardar uma cópia; (2) clique em **Puxar versão atual**; (3) refaça as edições que faltarem e salve. |
| **Token inválido ou expirado (401)** | Gere um novo token (seção 2) e cole-o na faixa de erro, em **Usar este token**. Suas alterações locais são mantidas. |
| **Sem permissão (403)** | O token é somente leitura ou não inclui este repositório. Ajuste *Contents: Read and write*. |
| **Não encontrado (404)** | O token não tem acesso ao repositório, ou o `tasks.json` foi renomeado ou removido do `main`. |
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
- O login por senha compartilhada foi substituído pelo token do GitHub. O acesso aos dados agora segue as permissões do
  repositório privado.
