const gerarBtn = document.getElementById('gerar');
const analisarBtn = document.getElementById('analisar');
const textArea = document.querySelector('textarea');
const inputEstudo = document.querySelector('input[list="opcoes"]');
const loader = document.getElementById('loading');

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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    if (!resposta.ok) {
      let erroMsg = 'Erro desconhecido.';
      try {
        const erroJson = await resposta.json();
        erroMsg = erroJson.erro || erroMsg;
      } catch (_) {
        // mantém mensagem padrão
      }
      mostrarFeedback('Erro: ' + erroMsg, 'erro');
      return;
    }

    const json = await resposta.json();

    if (json.resultado) {
      exibirModal(json.resultado);
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

function exibirModal(conteudo) {
  const modalAntigo = document.getElementById('modalResultado');
  if (modalAntigo) modalAntigo.remove();

  const modal = document.createElement('div');
  modal.id = 'modalResultado';
  modal.className = 'modal-resultado';

  const safeConteudo = conteudo ?? '';

  modal.innerHTML = `
    <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modalTitulo">
      <button class="fechar-btn" type="button" title="Fechar resultado" aria-label="Fechar resultado">&times;</button>
      <h2 id="modalTitulo">Seu plano está pronto!</h2>
      <div class="modal-actions">
        <button type="button" class="modal-action-btn" data-acao="copiar">Copiar plano</button>
        <button type="button" class="modal-action-btn" data-acao="baixar">Baixar (.txt)</button>
        <button type="button" class="modal-action-btn modal-action-primary" id="criarChecklistBtn">Criar checklist</button>
      </div>
      <pre>${safeConteudo}</pre>
    </div>
  `;

  const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  const dialog = modal.querySelector('.modal-content');
  const closeBtn = modal.querySelector('.fechar-btn');
  const pre = modal.querySelector('pre');

  const focusableSelectors =
    'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';

  const getFocusableElements = () =>
    Array.from(dialog.querySelectorAll(focusableSelectors)).filter(
      (el) => !el.hasAttribute('disabled')
    );

  function fecharModal() {
    modal.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleKeydown);
    if (previouslyFocused) {
      previouslyFocused.focus();
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      fecharModal();
      return;
    }

    if (e.key === 'Tab') {
      const focusable = getFocusableElements();
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', fecharModal);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      fecharModal();
    }
  });

  document.addEventListener('keydown', handleKeydown);

  const focusable = getFocusableElements();
  if (focusable.length) {
    focusable[0].focus();
  } else if (closeBtn) {
    closeBtn.focus();
  }

  const copiarBtn = modal.querySelector('button[data-acao="copiar"]');
  const baixarBtn = modal.querySelector('button[data-acao="baixar"]');

  if (copiarBtn && pre) {
    copiarBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.textContent || '');
        mostrarFeedback('Plano copiado para a área de transferência.', 'sucesso');
      } catch (err) {
        mostrarFeedback('Não foi possível copiar o plano.', 'erro');
      }
    });
  }

  if (baixarBtn && pre) {
    baixarBtn.addEventListener('click', () => {
      const blob = new Blob([pre.textContent || ''], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plano-planly.txt';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  }

  // A lógica do botão "Criar checklist" será implementada
  // no todo específico de importação de tarefas.
}

// Eventos dos botões
if (gerarBtn) {
  gerarBtn.addEventListener('click', (e) => {
    e.preventDefault();
    enviarDados('https://planly-api.onrender.com/gerar', 'gerar');
  });
}

if (analisarBtn) {
  analisarBtn.addEventListener('click', (e) => {
    e.preventDefault();
    enviarDados('https://planly-api.onrender.com/analisar', 'analisar');
  });
}
