function getCurrentUserId() {
  return localStorage.getItem("planly_current_user") || "guest";
}

function loadProfileStats() {
  const userId = getCurrentUserId();
  const stats = JSON.parse(localStorage.getItem(`planly_stats_${userId}`)) || {
    totalXP: 0,
    level: 1,
    streak: 0,
    achievements: [],
  };

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText("profileStreak", `${stats.streak || 0} dias`);
  setText("profileLevel", stats.level || 1);
  setText("profileXP", stats.totalXP || 0);
  setText("profileAchievements", stats.achievements?.length || 0);
}

function loadDisplayName() {
  const stored = localStorage.getItem("planly_display_name") || "";
  const input = document.getElementById("profileDisplayName");
  if (input) {
    input.value = stored;
  }
}

function setupProfileActions() {
  const saveBtn = document.getElementById("saveProfileBtn");
  const resetBtn = document.getElementById("resetProfileBtn");
  const input = document.getElementById("profileDisplayName");

  if (saveBtn && input) {
    saveBtn.addEventListener("click", () => {
      const value = input.value.trim();
      if (!value) {
        alert("Digite um nome para salvar.");
        return;
      }
      localStorage.setItem("planly_display_name", value);
      const username = document.getElementById("username");
      if (username) username.textContent = value;
      alert("Nome atualizado!");
    });
  }

  if (resetBtn && input) {
    resetBtn.addEventListener("click", () => {
      localStorage.removeItem("planly_display_name");
      input.value = "";
      alert("Nome restaurado. Recarregue a página para ver o padrão.");
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProfileStats();
  loadDisplayName();
  setupProfileActions();
});
