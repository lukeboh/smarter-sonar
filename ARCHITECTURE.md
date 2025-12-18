# Arquitetura do Projeto Smarter Sonar

Este documento descreve as decisões arquiteturais tomadas para o desenvolvimento da ferramenta Smarter Sonar, bem como a justificativa por trás delas.

## 1. Problema e Requisitos

A necessidade principal é consolidar e visualizar métricas de qualidade de código de múltiplos projetos do SonarQube de forma gerencial. Os requisitos essenciais são:

- Acesso consolidado aos dados.
- Uma interface de linha de comando (CLI) para acesso rápido e automação.
- Um dashboard web para visualização rica e interativa.
- O CLI deve funcionar de forma autônoma, sem depender de um servidor web pré-existente ou sempre ativo.

## 2. Arquitetura Escolhida: Módulo Core + Clientes

Para atender aos requisitos de múltiplos clientes (CLI, Web) e, principalmente, a independência do CLI, foi adotada uma arquitetura desacoplada.

A estrutura consiste em um **Módulo Core** central que contém toda a lógica de negócio, e múltiplos **Clientes** que consomem este módulo.

```
                                     ┌───────────────────┐
                                     │   SonarQube API   │
                                     └─────────┬─────────┘
                                               │
                               ┌───────────────┴───────────────┐
                               │  Módulo Core (`smarter-sonar`)│
                               │ Lógica de acesso e consolidação │
                               └───────────────┬───────────────┘
                                               │
                 ┌─────────────────────────────┴─────────────────────────────┐
                 │                                                           │
┌────────────────┴────────────────┐                  ┌───────────────────────┴───────────────────────┐
│         Cliente 1: CLI          │                  │             Cliente 2: Aplicação Web            │
│                                 │                  │                                                 │
│  - Importa e usa o Módulo Core  │                  │  [ Front-end (React) ] <--> [ Servidor (Node) ]  │
│  - Exibe dados no console       │                  │                             - Importa o Módulo  │
└─────────────────────────────────┘                  └─────────────────────────────────────────────────┘
```

### 2.1. Módulo Core

- **O que é?** Uma biblioteca Node.js pura (não é um servidor). Neste projeto, é o próprio pacote `smarter-sonar`.
- **Responsabilidade:** Conectar-se à API do SonarQube, buscar, processar e consolidar os dados. Ele expõe funções que recebem parâmetros (como IDs de projeto) e retornam os dados estruturados em JSON/objetos JavaScript.
- **Tecnologia:** Node.js.

### 2.2. Cliente CLI

- **O que é?** Uma ferramenta de linha de comando.
- **Responsabilidade:** Interpretar os comandos do usuário, chamar as funções do **Módulo Core** para obter os dados e formatar a saída para exibição no terminal. Será desenvolvido futuramente, possivelmente em um projeto separado que importa este Módulo Core.
- **Tecnologia:** Node.js.

### 2.3. Cliente Web

- **O que é?** Uma aplicação web completa (dashboard).
- **Responsabilidade:** Consiste em duas partes, que serão desenvolvidas futuramente:
    1.  **Back-end (Servidor API):** Um servidor web leve (Express.js) que importa o **Módulo Core** e expõe seus dados através de endpoints HTTP REST.
    2.  **Front-end (UI):** Uma Single Page Application (React) que consome a API do back-end e apresenta os dados de forma visual, com gráficos e tabelas.
- **Tecnologia:** Node.js/Express.js (Back-end), React (Front-end).

## 3. Justificativa da Decisão

- **Independência do CLI:** Atende ao requisito principal de que o CLI funcione sem a necessidade de um servidor. Ele consome a lógica diretamente, como uma biblioteca.
- **Reutilização de Código (DRY - Don't Repeat Yourself):** Toda a lógica complexa de interação com o SonarQube reside em um único lugar (o Módulo Core), evitando duplicação e facilitando a manutenção.
- **Escalabilidade e Manutenibilidade:** Adicionar novos clientes (ex: um app mobile, uma extensão de navegador) torna-se simples. Basta importar e consumir o Módulo Core ou sua API. Alterações na API do SonarQube só precisam ser implementadas uma vez, neste módulo.
