// ============================================================
// FONTE DE DADOS DO ROADMAP
// Edite este arquivo para atualizar o roadmap.
// Após salvar, faça push — o Vercel fará o deploy automaticamente.
// Nenhum outro arquivo precisa ser alterado.
// ============================================================

export type TaskStatus = 'done' | 'in-progress' | 'planned' | 'on-hold' | 'uncertain';
export type TaskType = 'software' | 'results' | 'article' | 'patent' | 'planning';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  type: TaskType;
  description: string;
  links?: { label: string; url: string }[];
  tags?: string[];
}

export interface Module {
  id: string;
  title: string;
  icon: string;
  description: string;
  links?: { label: string; url: string }[];
  tasks: Task[];
}

export const modules: Module[] = [
  {
    id: 'ajuste-estatistico',
    title: 'Ajuste Estatístico do Vento',
    icon: '📊',
    description:
      'Caracterização estatística das distribuições de velocidade do vento no Brasil com dados de reanálise ERA5. O fluxo de trabalho aplica estimação robusta de parâmetros — incluindo subamostragem Monte Carlo e seletor automático de distribuições (MagicA AutoFitter) — para produzir parâmetros Weibull e de melhor ajuste, espacialmente distribuídos, para pontos de grade onshore e offshore. Os resultados alimentam diretamente a análise de clusterização espacial.',
    links: [
      { label: 'Documentação MagicA', url: 'https://magica.readthedocs.io/en/latest/' },
      { label: 'Resultados', url: 'https://wind-adjustment-tc-petro.vercel.app' },
    ],
    tasks: [
      {
        id: 'magica-package',
        title: 'Pacote MagicA',
        status: 'done',
        type: 'software',
        description:
          'MagicA é um pacote Python desenvolvido internamente para ajuste robusto de distribuições estatísticas de velocidade do vento, incluindo simulações Monte Carlo e seleção automática de distribuições (AutoFitter). O frontend está sendo desenvolvido por outros membros da equipe.',
        tags: ['vento', 'estatística', 'MagicA'],
      },
      {
        id: 'large-sample-size',
        title: 'Large Sample Size',
        status: 'in-progress',
        type: 'article',
        description:
          'Aborda o artefato estatístico pelo qual testes clássicos de aderência (KS, Chi²) rejeitam ajustes válidos quando aplicados a grandes conjuntos de dados ERA5. Um framework de subamostragem Monte Carlo foi desenvolvido para identificar tamanhos de amostra ótimos usando estabilidade de RMSE (algoritmo Kneedle).',
        tags: ['vento', 'estatística', 'ERA5'],
      },
      {
        id: 'artigo-offshore',
        title: 'Artigo: ajuste para todos os pontos offshore do Brasil',
        status: 'planned',
        type: 'article',
        description:
          'Manuscrito científico caracterizando distribuições de velocidade do vento em todos os pontos de grade offshore brasileiros com reanálise ERA5, cobrindo múltiplas famílias de distribuições via MagicA AutoFitter.',
        tags: ['vento', 'offshore', 'MagicA', 'ERA5'],
      },
      {
        id: 'frontend-magica',
        title: 'Frontend - MagicA',
        status: 'in-progress',
        type: 'software',
        description:
          'Desenvolvimento do frontend para o pacote MagicA, permitindo interação visual com os resultados do ajuste estatístico.',
        tags: ['MagicA', 'frontend'],
      },
      {
        id: 'wt-brasil',
        title: 'WT - ajustes p/ Brasil',
        status: 'done',
        type: 'results',
        description:
          'Ajuste Weibull concluído para todos os pontos de grade brasileiros (onshore e offshore) usando infraestrutura de processamento paralelo sobre dados ERA5.',
        tags: ['vento', 'Weibull', 'ERA5'],
      },
      {
        id: 'incorporar-amex',
        title: 'Incorporar rotinas - AMEX',
        status: 'planned',
        type: 'software',
        description:
          'Integração das rotinas de ajuste do vento na plataforma AMEX para uso operacional pelas equipes de avaliação de energia da Petrobras.',
        tags: ['vento', 'AMEX', 'integração'],
      },
    ],
  },
  {
    id: 'clusterizacao-espacial',
    title: 'Clusterização Espacial',
    icon: '🗺️',
    description:
      'Identificação de regiões com regimes de vento estatisticamente homogêneos no Brasil por meio de clusterização espacial não supervisionada. Os parâmetros de distribuição derivados do pipeline de ajuste do vento são usados como vetores de características, com etapas de pré-processamento incluindo análise de EOF e métricas de distância à linha de costa. As fronteiras dos clusters definem zonas de características similares de recurso eólico para o planejamento energético.',
    links: [
      { label: 'Site de resultados', url: 'https://clustering-tc-petro.vercel.app' },
    ],
    tasks: [
      {
        id: 'investigacao-eofs',
        title: 'Investigação: EOFs',
        status: 'done',
        type: 'results',
        description:
          'Análise exploratória usando Funções Ortogonais Empíricas para identificar os modos espaciais dominantes de variabilidade do vento no Brasil como etapa de pré-processamento para a clusterização.',
        tags: ['vento', 'EOF', 'estatística'],
      },
      {
        id: 'rotina-linha-costa',
        title: 'Rotina: linha de costa',
        status: 'done',
        type: 'software',
        description:
          'Rotina automatizada de distância à linha de costa desenvolvida para classificar pontos de grade como onshore/offshore e calcular métricas de proximidade usadas como características de clusterização.',
        tags: ['offshore', 'linha de costa', 'pré-processamento'],
      },
      {
        id: 'artigo-clustering',
        title: 'Artigo ?',
        status: 'uncertain',
        type: 'article',
        description:
          'Possível artigo científico sobre metodologia e resultados de clusterização espacial — escopo e periódico-alvo em discussão com a equipe.',
        tags: ['clusterização', 'artigo'],
      },
      {
        id: 'regioes-homogeneas',
        title: 'Regiões com regime homogêneo',
        status: 'done',
        type: 'results',
        description:
          'Clusterização espacial concluída, identificando regiões com regimes de vento estatisticamente homogêneos no Brasil. Resultados disponíveis de forma interativa.',
        tags: ['clusterização', 'vento', 'Brasil'],
      },
    ],
  },
  {
    id: 'mpas',
    title: 'MPAS',
    icon: '🌀',
    description:
      'Downscaling dinâmico da climatologia de vento sobre o Brasil usando o Modelo para Previsão em Múltiplas Escalas (MPAS). Simulações de teste estão sendo realizadas em resolução mesoescala-equatorial antes de comprometer com longas rodadas de produção multi-anuais. O objetivo é uma climatologia de vento simulada em alta resolução para complementar e validar os produtos estatísticos baseados em ERA5.',
    links: [],
    tasks: [
      {
        id: 'simulacao-teste-meq',
        title: 'Simulação teste: MEq',
        status: 'planned',
        type: 'results',
        description:
          'Simulações de teste usando MPAS na resolução mesoescala-equatorial para avaliar a configuração do modelo antes das rodadas de longo prazo.',
        tags: ['MPAS', 'simulação', 'mesoescala'],
      },
      {
        id: 'simulacoes-longo-prazo',
        title: 'Simulações de longo prazo',
        status: 'planned',
        type: 'results',
        description:
          'Simulações MPAS de longo prazo cobrindo períodos multi-anuais para gerar uma climatologia de vento com downscaling dinâmico para o Brasil.',
        tags: ['MPAS', 'simulação', 'climatologia'],
      },
      {
        id: 'climatologia-mpas',
        title: 'Climatologia simulada pelo modelo',
        status: 'planned',
        type: 'results',
        description:
          'Análise e validação da climatologia de vento simulada pelo MPAS em relação à reanálise ERA5 e dados observacionais.',
        tags: ['MPAS', 'climatologia', 'validação'],
      },
    ],
  },
  {
    id: 'ciclones-parametricos',
    title: 'Ciclones Paramétricos',
    icon: '🌪️',
    description:
      'Desenvolvimento de arquétipos paramétricos para ciclones extratropicais do Atlântico Sul combinando características do ciclo de vida (trajetória, intensidade, duração) com diagnósticos do Ciclo de Energia de Lorenz como entradas para clusterização. Resultados preliminares sugerem que os ciclones se agrupam em grupos energeticamente distintos, fornecendo uma base física para modelos de tempestade paramétricos usados na avaliação de risco costeiro e de energia offshore.',
    links: [
      {
        "label": "Referência: ciclo de vida",
        "url": "https://rmets.onlinelibrary.wiley.com/doi/abs/10.1002/joc.8539"
      },
      {
        "label": "Referência: energética",
        "url": "https://link.springer.com/article/10.1007/s00382-025-07918-y"
      },
      {
        "label": "Resultados Energy Patterns",
        "url": "https://paper-energy-patterns.vercel.app"
      }
    ],
    tasks: [
      {
        id: 'revisao-bibliografica',
        title: 'Revisão bibliográfica',
        status: 'in-progress',
        type: 'planning',
        description:
          'Revisão da literatura sobre modelos paramétricos de ciclones extratropicais, caracterização do ciclo de vida e energética — com foco nos sistemas do Atlântico Sul.',
        tags: ['ciclones', 'Atlântico Sul', 'literatura'],
      },
      {
        id: 'base-ciclones',
        title: 'Base de ciclones',
        status: 'planned',
        type: 'software',
        description:
          'Construção de um banco de dados de ciclones extratropicais do Atlântico Sul usando características do ciclo de vida (trajetória, intensidade, duração) e energética (termos do Ciclo de Energia de Lorenz) como vetores de características para clusterização.',
        tags: ['ciclones', 'Atlântico Sul', 'banco de dados', 'CEL'],
      },
      {
        id: 'estatisticas-extremos',
        title: 'Estatísticas de ocorrência e extremos',
        status: 'planned',
        type: 'results',
        description:
          'Análise de estatísticas de ocorrência de ciclones e caracterização de eventos extremos para o Atlântico Sul, apoiando modelos de tempestade paramétricos para avaliação de risco costeiro.',
        tags: ['ciclones', 'extremos', 'estatística'],
      },
    ],
  },
  {
    id: 'altimetria-hs',
    title: 'Produtos de Altimetria (Hs)',
    icon: '🌊',
    description:
      'Processamento e análise de dados de altura significativa de ondas (Hs) provenientes de altimetria por satélite e fontes de reanálise para áreas offshore brasileiras. Rotinas automatizadas de download e processamento foram estabelecidas, com análise em andamento focada no sítio offshore de Akará para caracterização do clima de ondas e avaliação de valores extremos.',
    links: [],
    tasks: [
      {
        id: 'rotinas-download-hs',
        title: 'Rotinas de download e processamento de dados',
        status: 'done',
        type: 'software',
        description:
          'Rotinas automatizadas de download e processamento de dados de altura significativa de ondas (Hs) a partir de altimetria por satélite e fontes de reanálise.',
        tags: ['ondas', 'altimetria', 'Hs'],
      },
      {
        id: 'analise-akara',
        title: 'Análise - campo de ondas do Akará',
        status: 'on-hold',
        type: 'article',
        description:
          'Análise do campo de ondas na área offshore do Akará, caracterizando a distribuição e extremos da altura significativa de ondas para avaliação do sítio de energia renovável.',
        tags: ['ondas', 'offshore', 'Hs', 'Akará'],
      },
    ],
  },
  {
    id: 'windlab',
    title: 'WindLab',
    icon: '🔬',
    description:
      'Ferramenta Python para visualização automatizada de dados de vento e geração de figuras, apoiando fluxos de trabalho de análise reprodutíveis em todas as entregas do TC-Renováveis. O desenvolvimento ativo está focado na expansão de tipos de gráficos, capacidades de processamento em lote e integração com o pipeline de dados do projeto.',
    links: [
      { label: 'GitHub', url: 'https://github.com/daniloceano/WindLab' },
    ],
    tasks: [
      {
        id: 'graficos-automatizados',
        title: 'Gráficos automatizados',
        status: 'in-progress',
        type: 'software',
        description:
          'Desenvolvimento de fluxos de trabalho automatizados de geração de figuras no WindLab, uma ferramenta Python para visualização e análise de dados de vento usada em todas as entregas do TC-Renováveis.',
        tags: ['WindLab', 'visualização', 'automação'],
      },
      {
        id: 'windlab-interface-grafica',
        title: 'Interface gráfica',
        status: 'in-progress',
        type: 'software',
        description:
          'Quatro etapas de desenvolvimento planejadas para o WindLab incluindo tipos adicionais de gráficos, processamento em lote, geração de relatórios e integração com o pipeline de dados do projeto.',
        tags: ['WindLab', 'planejamento'],
      },
    ],
  },
  {
    id: 'mudancas-climaticas',
    title: 'Mudanças Climáticas',
    icon: '🌡️',
    description:
      'Avaliação das mudanças nos recursos de vento e ondas sob cenários climáticos futuros, combinando downscaling dinâmico do MPAS com correção de viés do ERA5 e análise de valores extremos. Ambas as tarefas estão atualmente em espera, aguardando a conclusão da configuração das simulações MPAS de referência.',
    links: [],
    tasks: [
      {
        id: 'downscaling-mpas',
        title: 'Downscaling com MPAS',
        status: 'uncertain',
        type: 'results',
        description:
          'Downscaling dinâmico de cenários de mudanças climáticas usando MPAS, condicionado à conclusão da configuração das simulações de referência.',
        tags: ['MPAS', 'mudanças climáticas', 'downscaling'],
      },
      {
        id: 'bias-correction-extremos',
        title: 'Bias correction do ERA5 → análise de extremos',
        status: 'uncertain',
        type: 'results',
        description:
          'Correção de viés dos dados de reanálise ERA5 seguida de análise de valores extremos para recursos de vento e ondas sob cenários climáticos futuros.',
        tags: ['ERA5', 'correção de viés', 'extremos', 'mudanças climáticas'],
      },
    ],
  },
];
