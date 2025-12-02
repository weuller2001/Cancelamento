document.addEventListener("DOMContentLoaded", function() {
    // NÃO roda o teste automaticamente mais.
    
    // Configura o botão para iniciar o teste
    const btn = document.getElementById('btnCheck');
    if(btn) {
        btn.addEventListener('click', function() {
            // Feedback visual que começou
            const resultsArea = document.getElementById('resultsArea');
            resultsArea.innerHTML = `
                <div style="padding: 20px; color: #007bff;">
                    <p><strong>⏳ Analisando hardware e sistema...</strong></p>
                    <p style="font-size: 0.9em;">Isso pode levar alguns instantes.</p>
                </div>
            `;

            // Muda o texto do botão para indicar que pode ser refeito
            btn.innerText = "Verificar Novamente";

            // Pequeno delay para a UI atualizar antes de travar no processamento (se houver)
            setTimeout(() => {
                checkSystemDeep();
            }, 200);
        });
    }
});

function checkSystemDeep() {
    const resultsArea = document.getElementById('resultsArea');
    const ua = navigator.userAgent;

    let report = {
        osName: "Desconhecido",
        is64Bit: false,
        isWin10Plus: false,
        ramGB: navigator.deviceMemory || 0,
        cpuCores: navigator.hardwareConcurrency || 0,
        details: `User Agent: ${ua}`
    };

    // --- 1. Análise Básica ---
    if (ua.indexOf("Windows") !== -1) {
        if (ua.indexOf("Windows NT 10.0") !== -1) {
            report.osName = "Windows 10/11 (Padrão)";
            report.isWin10Plus = true;
        } else if (ua.indexOf("Windows NT 6.1") !== -1) {
            report.osName = "Windows 7";
            report.isWin10Plus = false;
        } else {
            report.osName = "Windows Antigo";
            report.isWin10Plus = false;
        }

        if (ua.indexOf("Win64") !== -1 || ua.indexOf("x64") !== -1 || ua.indexOf("WOW64") !== -1) {
            report.is64Bit = true;
        }
    }

    // --- 2. Análise Profunda ---
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
        navigator.userAgentData.getHighEntropyValues(["platform", "platformVersion", "architecture", "bitness"])
        .then(uaData => {
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
    let criticalError = false;
    let warning = false;

    // Validações
    if (!data.isWin10Plus) {
        messages.push(`❌ <strong>Sistema Operacional:</strong> Detectado <u>${data.osName}</u>. O sistema NG exige no mínimo Windows 10.`);
        criticalError = true;
    } else {
        messages.push(`✔️ <strong>Sistema Operacional:</strong> Compatível (${data.osName}).`);
    }

    if (!data.is64Bit) {
        messages.push(`❌ <strong>Arquitetura:</strong> Detectado <u>32 bits</u>. O sistema NG exige 64 bits.`);
        criticalError = true;
    } else {
        messages.push(`✔️ <strong>Arquitetura:</strong> Sistema de 64 bits.`);
    }

    if (data.ramGB === 0) {
        messages.push("⚠️ <strong>Memória RAM:</strong> Não detectada. Verifique se possui 8GB.");
        warning = true;
    } else if (data.ramGB < 8) {
        messages.push(`⚠️ <strong>Memória RAM Baixa (${data.ramGB}GB detectados):</strong> O sistema pode apresentar lentidão. Recomendado: 8GB.`);
        warning = true;
    } else {
        messages.push(`✔️ <strong>Memória RAM:</strong> ${data.ramGB}GB ou mais detectados.`);
    }

    if (data.cpuCores === 0) {
        messages.push("⚠️ <strong>Processador:</strong> Quantidade de núcleos não detectada.");
        warning = true;
    } else if (data.cpuCores < 4) {
        messages.push(`⚠️ <strong>Processador Limitado (${data.cpuCores} núcleos detectados):</strong> Recomendamos no mínimo 4 núcleos.`);
        warning = true;
    } else {
        messages.push(`✔️ <strong>Processador:</strong> ${data.cpuCores} núcleos lógicos detectados.`);
    }

    // Visual
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
        mainTitle = "Compatível (Com Avisos)";
    }

    let htmlContent = `
        <div class="status-box ${statusClass}">
            <span class="icon">${mainIcon}</span>
            <h2>${mainTitle}</h2>
            <div style="text-align: left; margin-top: 15px;">
    `;

    messages.forEach(msg => {
        htmlContent += `<div class="detail-item">${msg}</div>`;
    });

    htmlContent += `</div></div>`;

    if (criticalError) {
        htmlContent += `<p style="color: red; font-weight: bold; margin-top: 20px;">Ação Necessária: O computador não atende aos requisitos mínimos.</p>`;
    } else if (warning) {
        htmlContent += `<p style="color: #856404; font-weight: bold; margin-top: 20px;">Atenção: O computador funcionará, mas pode apresentar lentidão.</p>`;
    }

    resultsArea.innerHTML = htmlContent;

    console.group("Diagnóstico NG");
    console.log("Detalhes:", data.details);
    console.log("RAM:", data.ramGB, "Cores:", data.cpuCores);
    console.groupEnd();
}
