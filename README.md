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

## Como Começar (Em Desenvolvimento)

O projeto ainda está em fase inicial. Os próximos passos incluirão a configuração do ambiente de desenvolvimento e a implementação do módulo core.

```bash
# Instalar dependências (ainda a ser definido)
npm install

# Iniciar a aplicação (ainda a ser definido)
npm start
```
