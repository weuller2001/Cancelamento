// Objeto que armazena os dados atuais do sistema, lidos da URL
let systemData = {};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Processar dados da URL
    processUrlParams();
    
    // 2. Preencher a seção de Dados do Ambiente
    displaySystemData();

    // 3. Ocultar a mensagem de carregamento e exibir o conteúdo
    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('resultsContent').style.display = 'block';

    // 4. Configurar o botão de cálculo
    document.getElementById('processButton').addEventListener('click', calculateAndDisplayReport);
});


/**
 * @section Funções de Utilitários
 */

/**
 * Lê os parâmetros da URL (enviados pelo agente C#) e armazena em systemData.
 */
function processUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Mapeamento dos parâmetros da URL para o objeto systemData
    systemData = {
        windowsVersion: urlParams.get('windowsVersion') || 'N/A',
        processorName: urlParams.get('processorName') || 'N/A',
        coreCount: parseInt(urlParams.get('coreCount')) || 0,
        totalRamGB: parseFloat(urlParams.get('totalRamGB')) || 0.0,
        connectionType: urlParams.get('connectionType') || 'N/A',
        diskReadSpeedMBps: parseFloat(urlParams.get('diskReadSpeedMBps')) || 0.0,
        diskWriteSpeedMBps: parseFloat(urlParams.get('diskWriteSpeedMBps')) || 0.0,
        diskType: urlParams.get('diskType') || 'Desconhecido',
        diskTotalGB: parseFloat(urlParams.get('diskTotalGB')) || 0.0,
        cpuMultiCoreScore: parseInt(urlParams.get('cpuMultiCoreScore')) || 0,
        internetUploadSpeedMbps: parseFloat(urlParams.get('internetUploadSpeedMbps')) || 0.0,
        internetDownloadSpeedMbps: parseFloat(urlParams.get('internetDownloadSpeedMbps')) || 0.0,
    };
}

/**
 * Preenche os SPANs com os dados coletados.
 */
function displaySystemData() {
    // Função auxiliar para preencher um elemento
    const setContent = (id, content) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    };

    setContent('windowsVersion', systemData.windowsVersion);
    setContent('processorName', systemData.processorName);
    setContent('coreCount', systemData.coreCount + ' Cores');
    setContent('totalRamGB', systemData.totalRamGB.toFixed(2) + ' GB');
    setContent('connectionType', systemData.connectionType);
    setContent('diskReadSpeedMBps', systemData.diskReadSpeedMBps.toFixed(2) + ' MB/s');
    setContent('diskWriteSpeedMBps', systemData.diskWriteSpeedMBps.toFixed(2) + ' MB/s');
    setContent('diskType', systemData.diskType);
    setContent('diskTotalGB', systemData.diskTotalGB.toFixed(2) + ' GB');
}

/**
 * Arredonda o número de núcleos para o próximo número PAR.
 * Ex: 3.5 -> 4; 4.1 -> 6; 6 -> 6.
 * @param {number} num Núcleos calculados
 * @returns {number} Núcleos arredondados para o par mais próximo/superior.
 */
function roundToNextEven(num) {
    const ceil = Math.ceil(num);
    return ceil % 2 === 0 ? ceil : ceil + 1;
}

/**
 * @section Lógica Principal do Relatório
 */

/**
 * Calcula os requisitos recomendados com base no número de usuários e sistemas adicionais.
 * @param {number} users Quantidade de usuários simultâneos.
 * @returns {object} Objeto com os requisitos recomendados.
 */
function calculateRequirements(users) {
    // Configurações base (para 1 a 3 usuários)
    let ramGB = 8;
    let cpuCores = 4;
    let readSpeedMBps = 300;
    let writeSpeedMBps = 150;
    
    const osRequirement = "Windows 10 / Server 2016 ou Superior";
    const connectionRequirement = "Cabeada (Ethernet)";
    const diskTypeRequirement = "SSD ou Superior";

    // 1. Acréscimo por Sistemas Adicionais (Holos e NFe Express)
    
    // Verifica se Holos Sim está selecionado
    if (document.getElementById('holosSim')?.checked) {
        ramGB += 1; // +1GB para Holos
    }

    // Verifica se NFe Express Sim está selecionado
    if (document.getElementById('nfeSim')?.checked) {
        ramGB += 2; // +2GB para NFe Express
    }

    // 2. Acréscimo por Usuários Excedentes (aplica-se após os acréscimos base)
    if (users > 3) {
        const excessUsers = users - 3;
        
        // Acréscimo de RAM: 2GB por usuário excedente
        ramGB += (excessUsers * 2);

        // Acréscimo de CPU: 0.5 Cores por usuário excedente
        let calculatedCores = 4 + (excessUsers * 0.5);
        cpuCores = roundToNextEven(calculatedCores);

        // Acréscimo de Velocidade de Disco SSD
        if (users >= 4 && users <= 8) {
            readSpeedMBps = 500;
            writeSpeedMBps = 500;
        } else if (users >= 9 && users <= 15) {
            readSpeedMBps = 1000;
            writeSpeedMBps = 1000;
        } else if (users > 15) {
            readSpeedMBps = 2500;
            writeSpeedMBps = 2500;
        }
    }

    return {
        os: osRequirement,
        cpuCores: cpuCores,
        ramGB: ramGB,
        connection: connectionRequirement,
        diskType: diskTypeRequirement,
        diskReadSpeedMBps: readSpeedMBps,
        diskWriteSpeedMBps: writeSpeedMBps,
    };
}

/**
 * Gera e exibe o relatório de Recomendado vs. Atual em formato de tabela.
 */
function calculateAndDisplayReport() {
    const usersInput = document.getElementById('qtdUsuarios').value;
    const users = parseInt(usersInput);

    if (isNaN(users) || users < 1) {
        alert("Por favor, digite uma quantidade válida de usuários (mínimo 1).");
        return;
    }

    // Verifica se as opções Holos e NFE foram selecionadas (Sim ou Não)
    const nfeSelected = document.querySelector('input[name="nfe"]:checked');
    const holosSelected = document.querySelector('input[name="holos"]:checked');

    if (!nfeSelected || !holosSelected) {
        alert("Por favor, selecione 'Sim' ou 'Não' para 'Utiliza NFe Express' e 'Utiliza Holos/People'.");
        return;
    }

    // 1. Calcular Requisitos
    const recommended = calculateRequirements(users);

    // 2. Estruturar os dados para exibição
    const reportData = [
        { label: 'Sistema Operacional', recommended: recommended.os, actual: systemData.windowsVersion },
        { label: 'Processador (Núcleos)', recommended: recommended.cpuCores + ' Cores', actual: systemData.coreCount + ' Cores' },
        { label: 'Memória RAM', recommended: recommended.ramGB + ' GB', actual: systemData.totalRamGB.toFixed(2) + ' GB' },
        { label: 'Tipo de Conexão', recommended: recommended.connection, actual: systemData.connectionType },
        { label: 'Tipo de Disco', recommended: recommended.diskType, actual: systemData.diskType },
        { label: 'Leitura de Disco (Mínimo)', recommended: recommended.diskReadSpeedMBps + ' MB/s', actual: systemData.diskReadSpeedMBps.toFixed(2) + ' MB/s' },
        { label: 'Escrita de Disco (Mínimo)', recommended: recommended.diskWriteSpeedMBps + ' MB/s', actual: systemData.diskWriteSpeedMBps.toFixed(2) + ' MB/s' },
    ];

    // 3. Montar a tabela HTML
    let tableHtml = '<table>';
    tableHtml += '<thead><tr><th>Requisito</th><th>Recomendado</th><th>Atual no Computador</th></tr></thead>';
    tableHtml += '<tbody>';

    reportData.forEach(item => {
        // Lógica simples de status (pode ser aprimorada com classes CSS)
        let statusClass = ''; 
        
        // Validação de Núcleos
        if (item.label.includes('Núcleos') && systemData.coreCount < recommended.cpuCores) {
             statusClass = 'insufficient';
        } 
        // Validação de RAM
        else if (item.label.includes('RAM') && systemData.totalRamGB < recommended.ramGB) {
            statusClass = 'insufficient';
        } 
        // Validação de Disco (Leitura)
        else if (item.label.includes('Leitura') && systemData.diskReadSpeedMBps < recommended.diskReadSpeedMBps) {
             statusClass = 'insufficient';
        }
        // Validação de Disco (Escrita)
        else if (item.label.includes('Escrita') && systemData.diskWriteSpeedMBps < recommended.diskWriteSpeedMBps) {
             statusClass = 'insufficient';
        }
        // Validação de Tipo de Disco (SSD vs HD)
        else if (item.label.includes('Tipo de Disco') && (systemData.diskType === 'HD Mecânico' || systemData.diskType === 'Desconhecido')) {
             statusClass = 'insufficient';
        }

        tableHtml += `
            <tr class="${statusClass}">
                <td>${item.label}</td>
                <td>${item.recommended}</td>
                <td>${item.actual}</td>
            </tr>
        `;
    });

    tableHtml += '</tbody></table>';

    // 4. Inserir e exibir o relatório
    document.getElementById('recommendationReport').innerHTML = tableHtml;
    document.getElementById('reportTitle').style.display = 'block';
}