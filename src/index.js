#!/usr/bin/env node

import fs from 'fs/promises';
import axios from 'axios';
import inquirer from 'inquirer';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';

// --- Funções de Configuração ---

async function readConfigFile() {
  try {
    const configContent = await fs.readFile('config.json', 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Arquivo não existe, o que é ok. Retorna um objeto vazio.
      return {}; 
    }
    console.error('Erro ao ler o arquivo de configuração "config.json".');
    console.error('Certifique-se de que ele está no formato JSON correto.');
    process.exit(1);
  }
}

async function writeConfig(config) {
  try {
    // Remove os comentários antes de salvar
    const cleanConfig = { ...config };
    Object.keys(cleanConfig).forEach(key => {
        if (key.startsWith('_comment')) {
            delete cleanConfig[key];
        }
    });
    await fs.writeFile('config.json', JSON.stringify(cleanConfig, null, 2));
    console.log('Configuração salva com sucesso em "config.json".');
  } catch (error) {
    console.error('Erro ao salvar o arquivo de configuração:', error);
    process.exit(1);
  }
}

async function getFinalConfig() {
    const fileConfig = await readConfigFile();

    const argv = await yargs(hideBin(process.argv))
        .option('sonarUrl', {
            alias: 'u',
            type: 'string',
            description: 'URL da sua instância do SonarQube.'
        })
        .option('token', {
            alias: 't',
            type: 'string',
            description: 'Token de usuário do SonarQube.'
        })
        .option('debug', {
            type: 'boolean',
            description: 'Ativa o modo de depuração.'
        })
        .option('sortBy', {
            alias: 's',
            type: 'string',
            choices: ['default', 'component_branch', 'group_component_branch'],
            description: 'Critério de ordenação dos projetos.'
        })
        .option('projects', {
            alias: 'p',
            type: 'array',
            description: 'Lista de chaves de projetos para monitorar (sobrescreve a seleção).'
        })
        .help()
        .alias('help', 'h')
        .argv;

    // Merge: CLI args > fileConfig > defaults
    const config = {
        debug: false,
        sortBy: 'default',
        ...fileConfig,
    };
    
    // Sobrescreve apenas as configs passadas via CLI
    Object.keys(argv).forEach(key => {
        if (argv[key] !== undefined && key !== '_' && key !== '$0') {
            config[key] = argv[key];
        }
    });

    return config;
}


// --- Funções de API do SonarQube ---

async function fetchAllProjects(sonarUrl, token, isDebugMode) {
  let projects = [];
  let page = 1;
  const pageSize = 100;
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
        console.error('Autenticação falhou. Verifique se o seu token de acesso é válido e tem as permissões necessárias para "Browse" projetos.');
      }
      if (isDebugMode) console.error('[DEBUG] Detalhes da resposta:', error.response.data);
    } else {
      console.error('Verifique a URL do SonarQube e sua conexão de rede.');
      if (isDebugMode) console.error('[DEBUG] Detalhes do erro:', error);
    }
    process.exit(1);
  }
}

// --- Lógica Principal da CLI ---

async function main() {
    const config = await getFinalConfig();
    const { sonarUrl, token, debug, sortBy, projects: projectsFromConfig, colorMapping } = config;

    if (!token || token.includes('COLE_SEU_TOKEN_AQUI')) {
        console.error('Token de acesso não configurado. Forneça via "config.json" ou com o parâmetro --token.');
        return;
    }
    if (!sonarUrl) {
        console.error('URL do SonarQube não configurada. Forneça via "config.json" ou com o parâmetro --sonarUrl.');
        return;
    }

    if (projectsFromConfig && (process.argv.includes('--projects') || process.argv.includes('-p'))) {
        console.log(`Salvando ${projectsFromConfig.length} projeto(s) fornecido(s) via linha de comando.`);
        await writeConfig(config);
        return;
    }

    const allProjects = await fetchAllProjects(sonarUrl, token, debug);

    if (allProjects.length === 0) {
        console.log('Nenhum projeto foi retornado pelo método selecionado.');
        return;
    }

    const { filterTerm } = await inquirer.prompt([
        {
            type: 'input',
            name: 'filterTerm',
            message: 'Para melhorar a performance, digite um termo para filtrar os projetos (deixe em branco para ver todos):'
        }
    ]);

    let displayProjects = allProjects;
    if (filterTerm) {
        const lowerCaseFilter = filterTerm.toLowerCase();
        displayProjects = allProjects.filter(p => 
            p.key.toLowerCase().includes(lowerCaseFilter) || 
            (p.name && p.name.toLowerCase().includes(lowerCaseFilter))
        );
        console.log(`\nExibindo ${displayProjects.length} de ${allProjects.length} projetos que correspondem a "${filterTerm}".\n`);
    }

    const parseKey = (key) => {
        const parts = key.split(':');
        return {
            group: parts[0] || '',
            component: parts[2] || '',
            branch: parts[3] || '',
        };
    };

    if (sortBy === 'component_branch') {
        displayProjects.sort((a, b) => {
            const a_parts = parseKey(a.key);
            const b_parts = parseKey(b.key);
            const componentCompare = a_parts.component.localeCompare(b_parts.component);
            if (componentCompare !== 0) return componentCompare;
            return a_parts.branch.localeCompare(b_parts.branch);
        });
    } else if (sortBy === 'group_component_branch') {
        displayProjects.sort((a, b) => {
            const a_parts = parseKey(a.key);
            const b_parts = parseKey(b.key);
            const groupCompare = a_parts.group.localeCompare(b_parts.group);
            if (groupCompare !== 0) return groupCompare;
            const componentCompare = a_parts.component.localeCompare(b_parts.component);
            if (componentCompare !== 0) return componentCompare;
            return a_parts.branch.localeCompare(b_parts.branch);
        });
    }

    const colorPrecedence = colorMapping ? Object.keys(colorMapping) : [];

    const choices = displayProjects.map((p, i) => {
        const parts = p.key.split(':');
        const group = parts[0] || '';
        const organ = parts[1] || '';
        const component = parts[2] || '';
        const branch = parts[3] || '';
        const optionals = parts.slice(4);

        const parenthesisParts = [organ, group, ...optionals].filter(part => part);
        const parenthesisString = parenthesisParts.join('/');

        let displayName = `${i + 1}. ${component} - ${branch}`;
        if (parenthesisString) {
            displayName += ` (${parenthesisString})`;
        }
        
        const lowerCaseKey = p.key.toLowerCase();
        
        for (const keyword of colorPrecedence) {
            if (lowerCaseKey.includes(keyword.toLowerCase())) {
                const colorName = colorMapping[keyword];
                if (colorName && typeof chalk[colorName] === 'function') {
                    displayName = chalk[colorName](displayName);
                    break; 
                }
            }
        }

        return {
            name: displayName,
            value: p.key,
            checked: config.projects?.includes(p.key) || false
        };
    });
    
    if (choices.length === 0) {
        console.log('Nenhum projeto corresponde ao seu filtro.');
        return;
    }

    const answers = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'selectedProjects',
            message: 'Selecione os projetos que deseja monitorar (use a barra de espaço para marcar/desmarcar):',
            choices: choices,
            pageSize: 15
        }
    ]);

    // Precisamos mesclar a seleção atual com os projetos já salvos que não foram exibidos
    const existingProjects = config.projects || [];
    const displayedProjectKeys = displayProjects.map(p => p.key);
    const unlistedProjects = existingProjects.filter(pKey => !displayedProjectKeys.includes(pKey));

    const newSelectedProjects = [...unlistedProjects, ...answers.selectedProjects];
    
    // Remove duplicados, caso existam
    const finalProjects = [...new Set(newSelectedProjects)];

    const newConfig = { ...config, projects: finalProjects };
    await writeConfig(newConfig);
}

// Ação principal
main();
