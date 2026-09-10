// material.js - Upload de PDF e organização de estudo por IA (resumo, quiz, flashcards)

const MATERIAL_API_URL = "https://planly-api.onrender.com/analisar-material";
const MATERIAL_MAX_BYTES = 15 * 1024 * 1024; // 15MB

function getCurrentUserId() {
  return planGetCurrentUserId();
}

function getMaterialStorageKey(userId = getCurrentUserId()) {
  return `planly_last_material_${userId}`;
}

function escapeHtml(texto) {
  return planEscapeHtml(texto);
}

// ===== Elementos =====
const form = document.getElementById("materialForm");
const fileInput = document.getElementById("materialFile");
const dropzone = document.getElementById("materialDropzone");
const fileNameLabel = document.getElementById("materialFileName");
const contextoInput = document.getElementById("materialContexto");
const submitBtn = document.getElementById("materialSubmitBtn");
const feedbackEl = document.getElementById("materialFeedback");
const loadingEl = document.getElementById("materialLoading");
const resultPanel = document.getElementById("materialResultPanel");
const resumoConteudo = document.getElementById("materialResumoConteudo");
const sugestoesContainer = document.getElementById("materialSugestoesContainer");
const quizContainer = document.getElementById("materialQuizContainer");
const flashcardsContainer = document.getElementById("materialFlashcardsContainer");

function mostrarFeedback(mensagem, tipo) {
  if (!feedbackEl) return;
  if (!mensagem) {
    feedbackEl.style.display = "none";
    feedbackEl.textContent = "";
    return;
  }
  feedbackEl.textContent = mensagem;
  feedbackEl.className =
    "form-feedback " + (tipo === "erro" ? "form-feedback--error" : "form-feedback--success");
  feedbackEl.style.display = "block";
}

function mostrarLoading(exibir) {
  if (loadingEl) loadingEl.style.display = exibir ? "flex" : "none";
  if (submitBtn) submitBtn.disabled = exibir;
}

// ===== Seleção de arquivo (clique + drag&drop) =====
if (fileInput) {
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (fileNameLabel) {
      fileNameLabel.textContent = file ? file.name : "Clique ou arraste um PDF (até 15MB)";
    }
  });
}

if (dropzone) {
  ["dragover", "dragenter"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("dragging");
    });
  });

  ["dragleave", "dragend"].forEach((evt) => {
    dropzone.addEventListener(evt, () => dropzone.classList.remove("dragging"));
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragging");
    const file = e.dataTransfer.files[0];
    if (file && fileInput) {
      fileInput.files = e.dataTransfer.files;
      if (fileNameLabel) fileNameLabel.textContent = file.name;
    }
  });
}

// ===== Envio do formulário =====
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    mostrarFeedback("", "");

    const file = fileInput.files[0];
    if (!file) {
      mostrarFeedback("Selecione um arquivo PDF.", "erro");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      mostrarFeedback("Apenas arquivos PDF são aceitos.", "erro");
      return;
    }
    if (file.size > MATERIAL_MAX_BYTES) {
      mostrarFeedback("Arquivo muito grande. O limite é 15MB.", "erro");
      return;
    }

    const formData = new FormData();
    formData.append("arquivo", file);
    formData.append("contexto", contextoInput ? contextoInput.value.trim() : "");

    mostrarLoading(true);
    try {
      const resposta = await fetch(MATERIAL_API_URL, {
        method: "POST",
        body: formData,
      });
      const json = await resposta.json();

      if (json.erro) {
        mostrarFeedback("Erro: " + json.erro, "erro");
        return;
      }

      localStorage.setItem(getMaterialStorageKey(), JSON.stringify(json));
      renderMaterialResult(json);
      mostrarFeedback("Material analisado com sucesso!", "sucesso");
    } catch (err) {
      mostrarFeedback("Erro ao conectar com o servidor: " + err.message, "erro");
    } finally {
      mostrarLoading(false);
    }
  });
}

// ===== Abas =====
document.querySelectorAll(".material-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".material-tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".material-tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab${capitalize(btn.dataset.tab)}`).classList.add("active");
  });
});

function capitalize(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// ===== Sugestões de tarefas de revisão =====
function renderSugestoes(sugestoes) {
  if (!sugestoesContainer) return;
  if (!Array.isArray(sugestoes) || sugestoes.length === 0) {
    sugestoesContainer.innerHTML = "";
    return;
  }

  sugestoesContainer.innerHTML = planRenderSugestoesBlock(
    sugestoes,
    "📝 Tarefas de Revisão Sugeridas",
  );

  planBindSugestoesContainer(sugestoesContainer, sugestoes, (mensagem) =>
    mostrarFeedback(mensagem, "erro"),
  );
}

// ===== Quiz =====
function renderQuiz(questoes) {
  if (!quizContainer) return;
  if (!Array.isArray(questoes) || questoes.length === 0) {
    quizContainer.innerHTML = "<p>Nenhuma questão foi gerada para este material.</p>";
    return;
  }

  const perguntasHtml = questoes
    .map((questao, qIndex) => {
      const alternativas = Array.isArray(questao.alternativas) ? questao.alternativas : [];
      const opcoes = alternativas
        .map(
          (alt, aIndex) => `
          <label class="quiz-opcao" data-question="${qIndex}" data-option="${aIndex}">
            <input type="radio" name="quiz-q${qIndex}" value="${aIndex}">
            ${escapeHtml(alt)}
          </label>`,
        )
        .join("");

      return `
        <div class="quiz-questao" id="quizQuestao${qIndex}">
          <h4>${qIndex + 1}. ${escapeHtml(questao.pergunta)}</h4>
          <div class="quiz-opcoes">${opcoes}</div>
          <div class="quiz-explicacao" id="quizExplicacao${qIndex}" style="display:none;"></div>
        </div>`;
    })
    .join("");

  quizContainer.innerHTML = `
    ${perguntasHtml}
    <button type="button" class="btn-primary" id="btnCorrigirQuiz">Corrigir Quiz</button>
    <div id="quizResultado" class="quiz-resultado" style="display:none;"></div>
  `;

  document.getElementById("btnCorrigirQuiz").addEventListener("click", () => {
    let acertos = 0;

    questoes.forEach((questao, qIndex) => {
      const selecionado = quizContainer.querySelector(
        `input[name="quiz-q${qIndex}"]:checked`,
      );
      const correta = Number(questao.resposta_correta);
      const explicacaoEl = document.getElementById(`quizExplicacao${qIndex}`);

      quizContainer
        .querySelectorAll(`.quiz-opcao[data-question="${qIndex}"]`)
        .forEach((opcaoEl) => {
          const optionIndex = Number(opcaoEl.dataset.option);
          opcaoEl.classList.remove("correta", "incorreta");
          if (optionIndex === correta) {
            opcaoEl.classList.add("correta");
          } else if (selecionado && Number(selecionado.value) === optionIndex) {
            opcaoEl.classList.add("incorreta");
          }
        });

      if (selecionado && Number(selecionado.value) === correta) {
        acertos++;
      }

      if (explicacaoEl && questao.explicacao) {
        explicacaoEl.textContent = `💡 ${questao.explicacao}`;
        explicacaoEl.style.display = "block";
      }
    });

    const resultadoEl = document.getElementById("quizResultado");
    resultadoEl.textContent = `Você acertou ${acertos} de ${questoes.length} questões.`;
    resultadoEl.style.display = "block";
    resultadoEl.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

// ===== Flashcards =====
let flashcardIndex = 0;
let flashcardsAtuais = [];

function renderFlashcards(flashcards) {
  flashcardsAtuais = Array.isArray(flashcards) ? flashcards : [];
  flashcardIndex = 0;

  if (!flashcardsContainer) return;
  if (flashcardsAtuais.length === 0) {
    flashcardsContainer.innerHTML = "<p>Nenhum flashcard foi gerado para este material.</p>";
    return;
  }

  flashcardsContainer.innerHTML = `
    <div class="flashcard-viewer">
      <div class="flashcard" id="flashcardAtual">
        <div class="flashcard-inner">
          <div class="flashcard-face flashcard-front" id="flashcardFrente"></div>
          <div class="flashcard-face flashcard-back" id="flashcardVerso"></div>
        </div>
      </div>
      <div class="flashcard-nav">
        <button type="button" class="btn-secondary" id="flashcardPrev">‹ Anterior</button>
        <span id="flashcardContador"></span>
        <button type="button" class="btn-secondary" id="flashcardNext">Próximo ›</button>
      </div>
      <p class="flashcard-hint">Clique no cartão para virar</p>
    </div>
  `;

  const cardEl = document.getElementById("flashcardAtual");
  cardEl.addEventListener("click", () => cardEl.classList.toggle("flipped"));
  document.getElementById("flashcardPrev").addEventListener("click", () => moveFlashcard(-1));
  document.getElementById("flashcardNext").addEventListener("click", () => moveFlashcard(1));

  updateFlashcardView();
}

function moveFlashcard(direcao) {
  if (flashcardsAtuais.length === 0) return;
  flashcardIndex = (flashcardIndex + direcao + flashcardsAtuais.length) % flashcardsAtuais.length;
  updateFlashcardView();
}

function updateFlashcardView() {
  const card = flashcardsAtuais[flashcardIndex];
  if (!card) return;
  document.getElementById("flashcardAtual").classList.remove("flipped");
  document.getElementById("flashcardFrente").textContent = card.frente || "";
  document.getElementById("flashcardVerso").textContent = card.verso || "";
  document.getElementById("flashcardContador").textContent =
    `${flashcardIndex + 1} / ${flashcardsAtuais.length}`;
}

// ===== Resultado geral =====
function renderMaterialResult(data) {
  if (resultPanel) resultPanel.style.display = "block";

  if (resumoConteudo) {
    resumoConteudo.innerHTML = `
      <div class="card-secao">
        <div class="card-conteudo">
          <div class="material-resumo-texto">${escapeHtml(data.resumo_plano || "")}</div>
        </div>
      </div>
    `;
  }

  renderSugestoes(data.tarefas_sugeridas);
  renderQuiz(data.questoes);
  renderFlashcards(data.flashcards);

  if (resultPanel) resultPanel.scrollIntoView({ behavior: "smooth" });
}

// ===== Carregar último resultado salvo =====
// DOMContentLoaded e planly-auth-ready podem ambos disparar (o segundo
// confirma a sessão do Firebase depois do primeiro), então usamos essa flag
// para nunca renderizar duas vezes e resetar o quiz/flashcards no meio de uso.
let materialCarregado = false;

function loadStoredMaterial() {
  if (materialCarregado) return;
  const userId = getCurrentUserId();
  if (!userId || userId === "guest") return;
  const stored = localStorage.getItem(getMaterialStorageKey(userId));
  if (!stored) return;
  try {
    renderMaterialResult(JSON.parse(stored));
    materialCarregado = true;
  } catch (err) {
    console.error("Erro ao carregar material salvo:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadStoredMaterial);
window.addEventListener("planly-auth-ready", loadStoredMaterial);
