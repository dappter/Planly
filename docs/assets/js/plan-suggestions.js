// plan-suggestions.js - Lógica compartilhada para sugestões de tarefas/hábitos
// geradas por IA (usado por actions.js na index.html e por material.js na material.html)

function planGetCurrentUserId() {
  return localStorage.getItem("planly_current_user") || "guest";
}

function planEscapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto == null ? "" : String(texto);
  return div.innerHTML;
}

function planSugestaoLabel(sugestao) {
  if (sugestao.type === "habito") {
    const minutos = planEscapeHtml(sugestao.goalMinutes || 30);
    return `<i class="fas fa-sync-alt"></i> ${planEscapeHtml(sugestao.title)} <span class="sugestao-meta">(hábito · ${minutos} min)</span>`;
  }
  const prioridade = planEscapeHtml(sugestao.priority || "");
  return `<i class="fas fa-tasks"></i> ${planEscapeHtml(sugestao.title)} <span class="sugestao-meta">(tarefa${prioridade ? " · " + prioridade : ""})</span>`;
}

function planRenderSugestoesBlock(sugestoes, titulo = "📝 Sugestões para suas Tarefas") {
  if (!Array.isArray(sugestoes) || sugestoes.length === 0) return "";

  const itens = sugestoes
    .map(
      (sugestao, index) => `
      <label class="sugestao-item">
        <input type="checkbox" class="sugestao-checkbox" data-index="${index}" checked>
        ${planSugestaoLabel(sugestao)}
      </label>`,
    )
    .join("");

  return `
    <div class="card-secao sugestoes-tarefas">
      <h3>${planEscapeHtml(titulo)}</h3>
      <div class="card-conteudo">
        <div class="sugestoes-lista">${itens}</div>
        <button type="button" class="btn-adicionar-tarefas" data-plan-send-suggestions>
          <i class="fas fa-plus-circle"></i> Adicionar à Tarefas
        </button>
      </div>
    </div>
  `;
}

function planEnviarSugestoesParaTarefas(sugestoes) {
  const userId = planGetCurrentUserId();
  if (!userId || userId === "guest") {
    return false;
  }
  localStorage.setItem(`planly_pending_tasks_${userId}`, JSON.stringify(sugestoes));
  window.location.href = "tarefa.html";
  return true;
}

// Liga o botão "Adicionar à Tarefas" dentro de `container` (o elemento que
// recebeu o HTML de planRenderSugestoesBlock). `sugestoes` é o mesmo array
// passado para planRenderSugestoesBlock (os índices dos checkboxes batem com ele).
// `onErro(mensagem)` é chamado quando não há seleção ou o usuário não está logado.
function planBindSugestoesContainer(container, sugestoes, onErro) {
  const btn = container.querySelector("[data-plan-send-suggestions]");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const escolhidas = Array.from(
      container.querySelectorAll(".sugestao-checkbox:checked"),
    ).map((checkbox) => sugestoes[Number(checkbox.dataset.index)]);

    if (escolhidas.length === 0) {
      if (onErro) onErro("Selecione ao menos uma sugestão.");
      return;
    }

    const enviado = planEnviarSugestoesParaTarefas(escolhidas);
    if (!enviado && onErro) {
      onErro("Faça login para adicionar sugestões à sua lista de tarefas.");
    }
  });
}
