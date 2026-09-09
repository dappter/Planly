const gerarBtn = document.getElementById("gerar");
const analisarBtn = document.getElementById("analisar");
const textArea = document.querySelector("textarea");
const inputEstudo = document.querySelector('input[list="opcoes"]');
const loader = document.getElementById("loading");
let lastAction = "gerar";

function getCurrentUserId() {
  return localStorage.getItem("planly_current_user") || "guest";
}

function normalizeTime(raw) {
  const clean = raw.replace(/h/i, ":");
  const parts = clean.split(":");
  const hour = String(parts[0]).padStart(2, "0");
  const min = String(parts[1] || "00").padStart(2, "0");
  return `${hour}:${min}`;
}

function extractTimeSlots(text) {
  const slots = [];
  const regex =
    /(\d{1,2}[:h]\d{0,2})\s*(?:-|às|ate|até|a)\s*(\d{1,2}[:h]\d{0,2})/gi;
  let match;
  while ((match = regex.exec(text))) {
    const start = normalizeTime(match[1]);
    const end = normalizeTime(match[2]);
    slots.push({ label: `${start} - ${end}` });
  }

  if (!slots.length) {
    return [
      { label: "08:00 - 10:00" },
      { label: "14:00 - 16:00" },
      { label: "19:00 - 21:00" },
    ];
  }

  return slots;
}

function saveMapSlotsFromRoutine() {
  const slots = extractTimeSlots(textArea.value || "");
  const userId = getCurrentUserId();
  const normalized = slots.map((slot, index) => ({
    id: `slot-${Date.now()}-${index}`,
    label: slot.label,
  }));
  localStorage.setItem(
    `planly_map_slots_${userId}`,
    JSON.stringify(normalized),
  );
  window.location.href = "/mapa.html";
}

function mostrarLoader(exibir, tipoAcao) {
  if (!loader) return;

  const loadingText = loader.querySelector('p');

  if (exibir) {
    if (loadingText) {
      if (tipoAcao === 'analisar') {
        loadingText.textContent = 'Analisando sua rotina...';
      } else {
        loadingText.textContent = 'Gerando plano de estudos...';
      }
    }
    loader.style.display = 'flex';
  } else {
    loader.style.display = 'none';
  }
}

function mostrarFeedback(mensagem, tipo) {
  const feedbackEl = document.getElementById('formFeedback');
  if (!feedbackEl) return;

  if (!mensagem) {
    feedbackEl.textContent = '';
    feedbackEl.className = 'form-feedback';
    feedbackEl.style.display = 'none';
    return;
  }

  feedbackEl.textContent = mensagem;
  feedbackEl.className = 'form-feedback ' + (tipo === 'erro' ? 'form-feedback--error' : 'form-feedback--success');
  feedbackEl.style.display = 'block';
}

async function enviarDados(url, tipoAcao) {
  const dados = {
    rotina: textArea ? textArea.value : '',
    interesse: inputEstudo ? inputEstudo.value : '',
  };

  const mensagensErro = [];

  if (!dados.rotina.trim()) {
    mensagensErro.push('Preencha os detalhes da sua rotina.');
  }

  if (!dados.interesse.trim()) {
    mensagensErro.push('Informe sobre o que você quer estudar.');
  }

  if (mensagensErro.length > 0) {
    mostrarFeedback(mensagensErro.join(' '), 'erro');
    return;
  }

  mostrarFeedback('', '');
  mostrarLoader(true, tipoAcao);

  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    const json = await resposta.json();
    if (json.resultado) {
      exibirModal(formatarMarkdown(json.resultado));
      const mensagemSucesso =
        tipoAcao === 'analisar'
          ? 'Análise da rotina gerada com sucesso.'
          : 'Plano de estudos gerado com sucesso.';
      mostrarFeedback(mensagemSucesso, 'sucesso');
    } else if (json.erro) {
      mostrarFeedback('Erro: ' + json.erro, 'erro');
    }
  } catch (err) {
    mostrarFeedback('Erro ao conectar com o servidor: ' + err.message, 'erro');
  } finally {
    mostrarLoader(false);
  }
}

function limparMarkdown(texto) {
  return texto
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#{1,6}\s?/g, "")
    .replace(/__|_/g, "")
    .replace(/```|`/g, "")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .trim();
}

function formatarMarkdown(texto) {
  let linhas = texto.split("\n");
  let html = "";
  let dentroDeSecao = false;
  let conteudoSecao = "";
  let tituloSecao = "";

  linhas.forEach((linha) => {
    linha = limparMarkdown(linha.trim());
    if (!linha) return;

    if (linha.match(/^[📅✅⚠️💡⚡🎯]/)) {
      if (dentroDeSecao) {
        html += `<div class="card-secao"><h3>${tituloSecao}</h3><div class="card-conteudo">${conteudoSecao}</div></div>`;
        conteudoSecao = "";
      }
      tituloSecao = linha;
      dentroDeSecao = true;
    } else if (linha.startsWith("-") && dentroDeSecao) {
      conteudoSecao += `<div class="item-lista">• ${linha.substring(1).trim()}</div>`;
    } else if (linha.includes("-") && linha.match(/\d/) && dentroDeSecao) {
      conteudoSecao += `<div class="item-horario">${linha}</div>`;
    } else if (dentroDeSecao) {
      conteudoSecao += `<div class="item-texto">${linha}</div>`;
    }
  });

  if (dentroDeSecao) {
    html += `<div class="card-secao"><h3>${tituloSecao}</h3><div class="card-conteudo">${conteudoSecao}</div></div>`;
  }

  return (
    html ||
    `<div class="card-secao"><div class="card-conteudo">${limparMarkdown(texto)}</div></div>`
  );
}

function exibirModal(conteudo) {
  const modalAntigo = document.getElementById("modalResultado");
  if (modalAntigo) modalAntigo.remove();

  const modal = document.createElement('div');
  modal.id = 'modalResultado';
  modal.className = 'modal-resultado';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="fechar-btn" title="Fechar resultado">&times;</button>
      <h2>Seu plano está pronto!</h2>
      <div class="resultado-formatado">${conteudo}</div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.scrollIntoView({ behavior: 'smooth' });

  modal.querySelector('.fechar-btn').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// Eventos dos botões
gerarBtn.addEventListener('click', (e) => {
  e.preventDefault();
  enviarDados('https://planly-api.onrender.com/gerar', 'gerar');
});

analisarBtn.addEventListener('click', (e) => {
  e.preventDefault();
  enviarDados('https://planly-api.onrender.com/analisar', 'analisar');
});
