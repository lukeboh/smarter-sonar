# Smarter Sonar

## Visão Geral

O SonarQube é uma ferramenta essencial para a análise estática de código e garantia de qualidade de software. No entanto, para gestores e equipes que supervisionam múltiplos projetos, a tarefa de consolidar e visualizar métricas de forma centralizada pode ser um desafio.

O **Smarter Sonar** nasce com o objetivo de preencher essa lacuna, oferecendo uma plataforma para agregar, consolidar e apresentar informações gerenciais de diversas instâncias e projetos do SonarQube, facilitando o acompanhamento e a tomada de decisão baseada em dados de qualidade.

## Objetivos Principais

- **Consolidar Métricas:** Obter e centralizar as principais métricas de qualidade (como bugs, vulnerabilidades, débitos técnicos, cobertura de testes) de vários projetos SonarQube.
- **Visualização Gerencial:** Apresentar os dados consolidados em dashboards e relatórios intuitivos, permitindo uma análise rápida do status da qualidade entre diferentes equipes e sistemas.
- **Acesso Flexível:** Disponibilizar as informações através de múltiplas interfaces:
    - Uma **CLI (Interface de Linha de Comando)** para consultas rápidas e automação.
    - Uma **Aplicação Web** para visualização detalhada e interativa.
    - (Futuramente) Extensões para navegador ou aplicativos móveis.

## Arquitetura

A aplicação é projetada em torno de um módulo central que contém toda a lógica de negócio para se conectar à API do SonarQube e processar os dados. Este módulo é então consumido pelos diferentes clientes (CLI e servidor web), garantindo reuso e consistência.

Para uma visão detalhada da estrutura, componentes e das decisões de design que guiam o desenvolvimento, consulte o nosso documento de arquitetura:

- [**ARCHITECTURE.md](./ARCHITECTURE.md)**

## Configuração

A ferramenta é configurada através do arquivo `config.json`. Você pode usar o `config.template.json` como base.

- `sonarUrl`: A URL base da sua instância do SonarQube.
- `token`: Seu token de acesso pessoal do SonarQube para autenticação na API.
- `debug`: Ative (`true`) ou desative (`false`) o modo de depuração para ver mais detalhes sobre as chamadas de API.
- `sortBy`: Define a ordem de exibição dos projetos na lista de seleção. As opções são:
    - `"default"`: Ordem padrão retornada pela API do SonarQube.
    - `"component_branch"`: Ordem alfabética pelo nome do componente e depois pelo nome do branch.
    - `"group_component_branch"`: Ordem alfabética pelo nome do grupo, depois pelo componente e pelo branch.
- `projects`: Uma lista das chaves (`key`) dos projetos que você selecionou para monitorar.

## Uso

### Configuração Interativa

Para a primeira execução ou para modificar interativamente os projetos monitorados, simplesmente rode o script. Ele irá buscar todos os projetos e apresentar uma lista para você selecionar.

```bash
# É necessário ter o Node.js v20+
# Lembre-se de usar nvm se tiver múltiplas versões: nvm use 20
npm install
node src/index.js
```

### Uso via Linha de Comando (CLI)

Todos os parâmetros do arquivo `config.json` podem ser fornecidos ou sobrescritos via linha de comando, o que é ideal para automação e scripts.

**Opções disponíveis:**

| Parâmetro                | Alias | Descrição                                                                                             |
| ------------------------ | ----- | ------------------------------------------------------------------------------------------------------- |
| `--sonarUrl`             | `-u`  | URL da sua instância do SonarQube.                                                                      |
| `--token`                | `-t`  | Token de usuário do SonarQube.                                                                          |
| `--debug`                |       | Ativa o modo de depuração para ver mais detalhes das chamadas de API.                                   |
| `--sortBy`               | `-s`  | Critério de ordenação: `default`, `component_branch`, `group_component_branch`.                         |
| `--projects`             | `-p`  | Lista de chaves de projetos para salvar (ex: `--projects key1 key2`). Ignora a seleção interativa. |
| `--help`                 | `-h`  | Exibe a mensagem de ajuda com todas as opções.                                                          |

**Exemplos:**

```bash
# Ordenar a lista por grupo, componente e branch
node src/index.js --sortBy group_component_branch

# Fornecer o token e a URL diretamente, sem usar o config.json
node src/index.js -u https://meusonar.com -t "seu_token_aqui"

# Salvar uma lista específica de projetos de forma não-interativa
node src/index.js -p proj-a:master proj-b:develop
```
