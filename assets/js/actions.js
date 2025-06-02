const gerarBtn = document.getElementById('gerar');
const analisarBtn = document.getElementById('analisar');
const textArea = document.querySelector('textarea');
const inputEstudo = document.querySelector('input[list="opcoes"]');
const loader = document.getElementById('loading');

async function enviarDados(url) {
  const dados = {
    rotina: textArea.value,
    interesse: inputEstudo.value,
  };

  mostrarLoader(true);

  try {
    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    if (!resposta.ok) {
      const erroJson = await resposta.json();
      alert('Erro: ' + (erroJson.erro || 'Erro desconhecido'));
      return;
    }

    const json = await resposta.json();
    exibirModal(json.resultado || json.erro);

  } catch (err) {
    alert('Erro ao conectar com o servidor: ' + err.message);
  } finally {
    mostrarLoader(false);
  }
}

function mostrarLoader(exibir) {
  loader.style.display = exibir ? 'flex' : 'none';
}

function exibirModal(conteudo) {
  const modalAntigo = document.getElementById('modalResultado');
  if (modalAntigo) modalAntigo.remove();

  const modal = document.createElement('div');
  modal.id = 'modalResultado';
  modal.className = 'modal-resultado';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="fechar-btn" title="Fechar resultado">&times;</button>
      <h2>Seu plano está pronto!</h2>
      <pre>${conteudo}</pre>
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
  enviarDados('https://planly-api.onrender.com/gerar');
});

analisarBtn.addEventListener('click', (e) => {
  e.preventDefault();
  enviarDados('https://planly-api.onrender.com/analisar');
});
