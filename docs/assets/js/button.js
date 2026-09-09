const saibaMaisBtn = document.getElementById("saibaMais");
const gerarExemploBtn = document.getElementById("gerarExemplo");

const aboutSection = document.getElementById("sobre");
const formSection = document.getElementById("formulario");
const rotinaInput = document.getElementById("rotina");
const interesseInput = document.getElementById("interesse");
const exemploLista = document.getElementById("exemploLista");

const interests = [
  "Programação",
  "ENEM",
  "Matemática",
  "Inglês",
  "Redação",
  "Biologia",
  "História",
  "UI/UX",
];

const routineTemplates = [
  "Manhã livre das 07:00 às 09:00. Noite livre das 19:00 às 21:00. Quero estudar durante a semana.",
  "Tenho disponibilidade todos os dias das 18:00 às 20:00 e sábado das 09:00 às 12:00.",
  "Minha rotina é corrida, mas consigo 1h por dia às 06:30 e 2h no domingo à tarde.",
  "Posso estudar terça e quinta das 20:00 às 22:00, e sábado das 08:00 às 11:00.",
  "Tenho o final de semana livre e duas noites na semana (quarta e sexta) por 2 horas.",
  "Disponível de segunda a sexta das 12:30 às 13:30 e domingo das 15:00 às 18:00.",
];

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function generateExamples(count = 3) {
  const examples = [];
  const used = new Set();

  while (examples.length < count) {
    const rotina = pickRandom(routineTemplates);
    const interesse = pickRandom(interests);
    const key = `${rotina}-${interesse}`;
    if (used.has(key)) continue;
    used.add(key);
    examples.push({ rotina, interesse });
  }

  return examples;
}

function scrollToSection(section) {
  if (!section) return;
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function fillForm({ rotina, interesse }) {
  if (rotinaInput) {
    rotinaInput.value = rotina;
    rotinaInput.dispatchEvent(new Event("input", { bubbles: true }));
  }

  if (interesseInput) {
    interesseInput.value = interesse;
    interesseInput.dispatchEvent(new Event("input", { bubbles: true }));
  }

  scrollToSection(formSection);
  if (rotinaInput) {
    setTimeout(() => rotinaInput.focus({ preventScroll: true }), 250);
  }
}

function renderExamples() {
  if (!exemploLista) return;
  const examples = generateExamples(3);

  exemploLista.innerHTML = examples
    .map(
      (example, index) => `
        <div class="exemplo-card" style="animation-delay: ${index * 0.1}s">
          <h4>Rotina sugerida para ${example.interesse}</h4>
          <p>${example.rotina}</p>
          <div class="exemplo-actions">
            <button class="use-btn" data-rotina="${example.rotina}" data-interesse="${example.interesse}">Usar no formulário</button>
            <button class="copy-btn" data-rotina="${example.rotina}">Copiar rotina</button>
          </div>
        </div>
      `,
    )
    .join("");

  exemploLista.querySelectorAll(".use-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      fillForm({
        rotina: btn.getAttribute("data-rotina"),
        interesse: btn.getAttribute("data-interesse"),
      });
    });
  });

  exemploLista.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const rotina = btn.getAttribute("data-rotina");
      try {
        await navigator.clipboard.writeText(rotina);
        btn.textContent = "Copiado!";
        setTimeout(() => {
          btn.textContent = "Copiar rotina";
        }, 1500);
      } catch (err) {
        alert("Não foi possível copiar a rotina.");
      }
    });
  });
}

if (saibaMaisBtn) {
  saibaMaisBtn.addEventListener("click", () => scrollToSection(aboutSection));
}

if (gerarExemploBtn) {
  gerarExemploBtn.addEventListener("click", () => {
    renderExamples();
  });
}
