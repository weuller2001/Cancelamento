document.addEventListener("DOMContentLoaded", function() {
    checkSystemDeep();

    const btn = document.getElementById('btnRetry');
    if(btn) {
        btn.addEventListener('click', function() {
            window.location.reload();
        });
    }
});

function checkSystemDeep() {
    const resultsArea = document.getElementById('resultsArea');
    const ua = navigator.userAgent;

    // Objeto de Relatório Inicial
    let report = {
        osName: "Desconhecido",
        is64Bit: false,
        isWin10Plus: false,
        ramGB: navigator.deviceMemory || 0,
        cpuCores: navigator.hardwareConcurrency || 0, // Nova propriedade
        details: `User Agent: ${ua}`
    };

    // --- 1. Análise Básica (User Agent) ---
    if (ua.indexOf("Windows") !== -1) {
        // Versão
        if (ua.indexOf("Windows NT 10.0") !== -1) {
            report.osName = "Windows 10/11";
            report.isWin10Plus = true;
        } else if (ua.indexOf("Windows NT 6.1") !== -1) {
            report.osName = "Windows 7";
            report.isWin10Plus = false;
        } else {
            report.osName = "Windows Antigo";
            report.isWin10Plus = false;
        }

        // Arquitetura
        if (ua.indexOf("Win64") !== -1 || ua.indexOf("x64") !== -1 || ua.indexOf("WOW64") !== -1) {
            report.is64Bit = true;
        }
    }

    // --- 2. Análise Profunda (Client Hints) ---
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
        if(resultsArea) resultsArea.innerHTML = "<p>Analisando hardware...</p>";
        
        navigator.userAgentData.getHighEntropyValues(["platform", "platformVersion", "architecture", "bitness"])
        .then(uaData => {
            // Refinamento com dados reais
            if (uaData.bitness) {
                report.is64Bit = (uaData.bitness === "64");
                report.details += `\nBitness Real: ${uaData.bitness}`;
            }
            if (uaData.platformVersion) {
                report.details += `\nVersão Plataforma: ${uaData.platformVersion}`;
            }
            renderResults(report);
        })
        .catch(error => {
            console.warn("Erro Client Hints:", error);
            renderResults(report);
        });
    } else {
        renderResults(report);
    }
}

function renderResults(data) {
    const resultsArea = document.getElementById('resultsArea');
    let messages = [];
    
    // Flags de Status
    let criticalError = false; // Vermelho (Impede instalação)
    let warning = false;       // Amarelo (Alerta de desempenho)

    // --- A. VALIDAÇÃO DO SISTEMA OPERACIONAL ---
    if (!data.isWin10Plus) {
        messages.push(`❌ <strong>Sistema Operacional:</strong> Detectado <u>${data.osName}</u>. O sistema NG exige no mínimo Windows 10.`);
        criticalError = true;
    } else {
        messages.push(`✔️ <strong>Sistema Operacional:</strong> Compatível (${data.osName}).`);
    }

    // --- B. VALIDAÇÃO DA ARQUITETURA ---
    if (!data.is64Bit) {
        messages.push(`❌ <strong>Arquitetura:</strong> Detectado <u>32 bits</u>. O sistema NG exige 64 bits.`);
        criticalError = true;
    } else {
        messages.push(`✔️ <strong>Arquitetura:</strong> Sistema de 64 bits.`);
    }

    // --- C. VALIDAÇÃO DE MEMÓRIA RAM ---
    if (data.ramGB === 0) {
        messages.push("⚠️ <strong>Memória RAM:</strong> Não detectada. Verifique se possui 8GB.");
        warning = true;
    } else if (data.ramGB < 8) {
        messages.push(`⚠️ <strong>Memória RAM Baixa (${data.ramGB}GB detectados):</strong> O sistema pode apresentar lentidão. Recomendado: 8GB.`);
        warning = true;
    } else {
        messages.push(`✔️ <strong>Memória RAM:</strong> ${data.ramGB}GB ou mais detectados.`);
    }

    // --- D. VALIDAÇÃO DO PROCESSADOR (NOVO) ---
    if (data.cpuCores === 0) {
        messages.push("⚠️ <strong>Processador:</strong> Quantidade de núcleos não detectada.");
        warning = true; // Opcional: pode ser apenas informativo
    } else if (data.cpuCores < 4) {
        messages.push(`⚠️ <strong>Processador Limitado (${data.cpuCores} núcleos detectados):</strong> Recomendamos no mínimo 4 núcleos para um bom desempenho.`);
        warning = true;
    } else {
        messages.push(`✔️ <strong>Processador:</strong> ${data.cpuCores} núcleos lógicos detectados.`);
    }

    // --- CONFIGURAÇÃO VISUAL FINAL ---
    let statusClass = "status-success";
    let mainIcon = "✅";
    let mainTitle = "Computador Compatível";

    if (criticalError) {
        statusClass = "status-error";
        mainIcon = "🛑";
        mainTitle = "Incompatível";
    } else if (warning) {
        statusClass = "status-warning";
        mainIcon = "⚠️";
        mainTitle = "Compatível (Com Avisos de Desempenho)";
    }

    // --- GERAÇÃO DO HTML ---
    let htmlContent = `
        <div class="status-box ${statusClass}">
            <span class="icon">${mainIcon}</span>
            <h2>${mainTitle}</h2>
            <div style="text-align: left; margin-top: 15px;">
    `;

    messages.forEach(msg => {
        htmlContent += `<div class="detail-item">${msg}</div>`;
    });

    htmlContent += `
            </div>
        </div>
    `;

    if (criticalError) {
        htmlContent += `
            <p style="color: red; font-weight: bold; margin-top: 20px;">
                Ação Necessária: O computador não atende aos requisitos mínimos de Sistema Operacional.
            </p>
        `;
    } else if (warning) {
        htmlContent += `
            <p style="color: #856404; font-weight: bold; margin-top: 20px;">
                Atenção: O computador funcionará, mas pode apresentar lentidão devido à RAM ou Processador abaixo do ideal.
            </p>
        `;
    }

    resultsArea.innerHTML = htmlContent;

    // Log Técnico no Console
    console.group("Diagnóstico NG");
    console.log("Detalhes:", data.details);
    console.log("RAM (GB):", data.ramGB);
    console.log("Cores:", data.cpuCores);
    console.groupEnd();
}