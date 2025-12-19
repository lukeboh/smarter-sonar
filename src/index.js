#!/usr/bin/env node

import fs from 'fs/promises';
import axios from 'axios';
import * as cheerio from 'cheerio';
import inquirer from 'inquirer';

// --- Funções de Configuração ---

async function readConfig() {
  try {
    const configContent = await fs.readFile('config.json', 'utf-8');
    // Set default values for new parameters if they don't exist
    const config = JSON.parse(configContent);
    return {
      debug: false,
      ...config,
    };
  } catch (error) {
    console.error('Erro ao ler o arquivo de configuração "config.json".');
    console.error('Certifique-se de que ele existe e está no formato JSON correto.');
    console.error('Você pode usar o "config.template.json" como modelo.');
    process.exit(1);
  }
}

async function writeConfig(config) {
  try {
    await fs.writeFile('config.json', JSON.stringify(config, null, 2));
    console.log('Configuração salva com sucesso em "config.json".');
  } catch (error) {
    console.error('Erro ao salvar o arquivo de configuração:', error);
    process.exit(1);
  }
}

// --- Funções de API e Scraping do SonarQube ---



async function fetchAllProjects(sonarUrl, token, isDebugMode) {
  let projects = [];
  let page = 1;
  const pageSize = 100; // Buscar 100 projetos por página
  let total = 0;

  const cleanUrl = sonarUrl.replace(/\/$/, '');

  console.log('Buscando projetos no SonarQube via API...');

  try {
    do {
      const apiUrl = `${cleanUrl}/api/components/search_projects`;
      const requestConfig = {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          p: page,
          ps: pageSize,
          // Parâmetros obtidos da análise da interface web para buscar todos os projetos
          facets: 'reliability_rating,security_rating,security_review_rating,sqale_rating,coverage,duplicated_lines_density,ncloc,alert_status,languages,tags,qualifier',
          f: 'analysisDate,leakPeriodDate'
        }
      };

      if (isDebugMode) {
        const fullUrl = new URL(apiUrl);
        Object.entries(requestConfig.params).forEach(([key, value]) => {
          fullUrl.searchParams.append(key, value);
        });
        console.log(`\n[DEBUG] Chamando API do SonarQube: ${fullUrl.toString()}`);
      }
      
      const response = await axios.get(apiUrl, requestConfig);
      const { components, paging } = response.data;

      if (!components || !paging) {
        console.error('Formato de resposta inesperado da API do SonarQube.');
        if (isDebugMode) console.error('[DEBUG] Resposta recebida:', response.data);
        break;
      }

      projects = projects.concat(components);
      total = paging.total;
      page++;

    } while (projects.length < total);

    console.log(`${projects.length} projetos encontrados.`);
    return projects;
  } catch (error) {
    console.error('Erro ao buscar projetos no SonarQube via API.');
    if (error.response) {
      console.error(`Status: ${error.response.status} - ${error.response.statusText}`);
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('Autenticação falhou. Verifique se o seu token de acesso em "config.json" é válido e tem as permissões necessárias para "Browse" projetos.');
      }
      if (isDebugMode) console.error('[DEBUG] Detalhes da resposta:', error.response.data);
    } else {
      console.error('Verifique a URL do SonarQube em "config.json" e sua conexão de rede.');
      if (isDebugMode) console.error('[DEBUG] Detalhes do erro:', error);
    }
    process.exit(1);
  }
}

// --- Lógica Principal da CLI ---

async function selectAndSaveProjects() {
    const config = await readConfig();
    const { sonarUrl, token, debug } = config;

    if (!token || token.includes('COLE_SEU_TOKEN_AQUI')) {
        console.error('Token de acesso não configurado em "config.json".');
        console.error('Por favor, adicione seu token para continuar.');
        return;
    }

    const allProjects = await fetchAllProjects(sonarUrl, token, debug);

    if (allProjects.length === 0) {
        console.log('Nenhum projeto foi retornado pelo método selecionado.');
        return;
    }

    const choices = allProjects.map((p, i) => ({
        name: `${i + 1}. ${p.name} (${p.key})`,
        value: p.key,
        checked: config.projects?.includes(p.key) || false
    }));

    const answers = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'selectedProjects',
            message: 'Selecione os projetos que deseja monitorar (use a barra de espaço para marcar/desmarcar):',
            choices: choices,
            pageSize: 15
        }
    ]);

    const newConfig = { ...config, projects: answers.selectedProjects };
    await writeConfig(newConfig);
}

// Ação principal: configurar os projetos.
selectAndSaveProjects();