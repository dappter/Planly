// Obter ID do usuário atual
function getCurrentUserId() {
  return localStorage.getItem("planly_current_user") || "guest";
}

// ESTADO
const state = {
  tasks:
    JSON.parse(localStorage.getItem(`planly_tasks_${getCurrentUserId()}`)) ||
    [],
  habits:
    JSON.parse(localStorage.getItem(`planly_habits_${getCurrentUserId()}`)) ||
    [],
  stats: JSON.parse(
    localStorage.getItem(`planly_stats_${getCurrentUserId()}`),
  ) || {
    totalXP: 0,
    level: 1,
    streak: 0,
    lastActive: null,
    achievements: [],
  },
};

const achievements = [
  {
    id: "first_task",
    name: "Primeira Tarefa",
    desc: "Complete sua primeira tarefa",
    icon: '<i class="fas fa-bullseye"></i>',
    xp: 50,
    unlocked: false,
  },
  {
    id: "task_master",
    name: "Mestre das Tarefas",
    desc: "Complete 10 tarefas",
    icon: '<i class="fas fa-book"></i>',
    xp: 100,
    unlocked: false,
  },
  {
    id: "habit_creator",
    name: "Criador de Hábitos",
    desc: "Crie seu primeiro hábito",
    icon: '<i class="fas fa-seedling"></i>',
    xp: 50,
    unlocked: false,
  },
  {
    id: "week_warrior",
    name: "Guerreiro Semanal",
    desc: "Mantenha 7 dias de sequência",
    icon: '<i class="fas fa-fire"></i>',
    xp: 150,
    unlocked: false,
  },
  {
    id: "level_5",
    name: "Nível 5",
    desc: "Alcance o nível 5",
    icon: '<i class="fas fa-star"></i>',
    xp: 200,
    unlocked: false,
  },
  {
    id: "early_bird",
    name: "Madrugador",
    desc: "Complete hábito antes das 8h",
    icon: '<i class="fas fa-sun"></i>',
    xp: 75,
    unlocked: false,
  },
  {
    id: "task_destroyer",
    name: "Destruidor de Tarefas",
    desc: "Complete 50 tarefas",
    icon: '<i class="fas fa-fire-alt"></i>',
    xp: 250,
    unlocked: false,
  },
  {
    id: "month_streak",
    name: "Mês Completo",
    desc: "Mantenha 30 dias de sequência",
    icon: '<i class="fas fa-calendar-check"></i>',
    xp: 500,
    unlocked: false,
  },
  {
    id: "task_planner",
    name: "Planejador",
    desc: "Crie 5 tarefas",
    icon: '<i class="fas fa-pencil-alt"></i>',
    xp: 60,
    unlocked: false,
  },
  {
    id: "task_25",
    name: "Ritmo Forte",
    desc: "Complete 25 tarefas",
    icon: '<i class="fas fa-running"></i>',
    xp: 150,
    unlocked: false,
  },
  {
    id: "task_100",
    name: "Centurião",
    desc: "Complete 100 tarefas",
    icon: '<i class="fas fa-shield-alt"></i>',
    xp: 400,
    unlocked: false,
  },
  {
    id: "high_priority_5",
    name: "Alta Prioridade",
    desc: "Complete 5 tarefas de prioridade alta",
    icon: '<i class="fas fa-flag"></i>',
    xp: 120,
    unlocked: false,
  },
  {
    id: "speed_runner",
    name: "Resposta Rápida",
    desc: "Conclua uma tarefa no mesmo dia em que foi criada",
    icon: '<i class="fas fa-bolt"></i>',
    xp: 80,
    unlocked: false,
  },
  {
    id: "habit_10",
    name: "Hábito em Construção",
    desc: "Complete 10 hábitos no total",
    icon: '<i class="fas fa-seedling"></i>',
    xp: 120,
    unlocked: false,
  },
  {
    id: "habit_50",
    name: "Constância",
    desc: "Complete 50 hábitos no total",
    icon: '<i class="fas fa-leaf"></i>',
    xp: 300,
    unlocked: false,
  },
  {
    id: "streak_3",
    name: "Trinca de Dias",
    desc: "Mantenha 3 dias de sequência",
    icon: '<i class="fas fa-fire"></i>',
    xp: 75,
    unlocked: false,
  },
  {
    id: "streak_14",
    name: "Duas Semanas",
    desc: "Mantenha 14 dias de sequência",
    icon: '<i class="fas fa-calendar-week"></i>',
    xp: 220,
    unlocked: false,
  },
  {
    id: "routine_master",
    name: "Rotina Afinada",
    desc: "Conclua todas as tarefas de rotina do dia",
    icon: '<i class="fas fa-sync-alt"></i>',
    xp: 140,
    unlocked: false,
  },
];

function getHabitXp(goalMinutes) {
  const minutes = Number(goalMinutes) || 30;
  return Math.min(100, Math.max(10, Math.round(minutes / 2)));
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
  const userId = getCurrentUserId();

  // Garantir que stats existe no localStorage para o usuário atual
  if (!localStorage.getItem(`planly_stats_${userId}`)) {
    save("stats");
  }

  setupEvents();
  reloadUserData();
  loadAchievements();

  window.addEventListener("planly-auth-ready", () => {
    reloadUserData();
    loadAchievements();
  });
});

function setupEvents() {
  document.getElementById("addTaskBtn").onclick = () => toggleForm("taskForm");
  document.getElementById("saveTaskBtn").onclick = saveTask;
  document.getElementById("cancelTaskBtn").onclick = () =>
    toggleForm("taskForm", false);

  document.getElementById("addHabitBtn").onclick = () =>
    toggleForm("habitForm");
  document.getElementById("saveHabitBtn").onclick = saveHabit;
  document.getElementById("cancelHabitBtn").onclick = () =>
    toggleForm("habitForm", false);

  document.getElementById("taskInput").onkeypress = (e) => {
    if (e.key === "Enter") saveTask();
  };
}

// FORMS
function toggleForm(formId, show = null) {
  const form = document.getElementById(formId);
  if (show === null) {
    form.style.display = form.style.display === "none" ? "block" : "none";
  } else {
    form.style.display = show ? "block" : "none";
  }

  if (form.style.display === "block") {
    const input = formId === "taskForm" ? "taskInput" : "habitInput";
    document.getElementById(input).focus();
  }
}

// TASKS
function saveTask() {
  const title = document.getElementById("taskInput").value.trim();
  if (!title) {
    notify(
      '<i class="fas fa-exclamation-triangle"></i> Digite o nome da tarefa!',
    );
    return;
  }

  const task = {
    id: Date.now(),
    title,
    priority: document.getElementById("taskPriority").value,
    deadline: document.getElementById("taskDeadline").value || null,
    completed: false,
    isRoutine: document.getElementById("taskRoutine")?.checked || false,
    createdAt: new Date().toISOString(),
    lastCompletedDate: null,
  };

  state.tasks.unshift(task);
  save("tasks");
  renderTasks();
  toggleForm("taskForm", false);
  clearForm("task");
  notify('<i class="fas fa-check-circle"></i> Tarefa adicionada!');

  if (state.tasks.length === 1) unlock("first_task");
  if (state.tasks.length === 5) unlock("task_planner");
}

function toggleTask(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;

  task.completed = !task.completed;

  if (task.completed) {
    task.lastCompletedDate = new Date().toISOString();

    let xp = 20;
    if (task.priority === "alta") xp += 20;
    else if (task.priority === "media") xp += 10;

    addXP(xp);
    notify(`<i class="fas fa-gift"></i> +${xp} XP ganhos!`);

    const count = state.tasks.filter((t) => t.completed).length;
    if (count === 10) unlock("task_master");
    if (count === 50) unlock("task_destroyer");
    if (count === 25) unlock("task_25");
    if (count === 100) unlock("task_100");

    const highPriorityCompleted = state.tasks.filter(
      (t) => t.completed && t.priority === "alta",
    ).length;
    if (highPriorityCompleted === 5) unlock("high_priority_5");

    if (task.createdAt) {
      const createdDate = new Date(task.createdAt).toDateString();
      const completedDate = new Date(task.lastCompletedDate).toDateString();
      if (createdDate === completedDate) unlock("speed_runner");
    }

    checkDailyStreak();
  }

  save("tasks");
  renderTasks();
  updateStats();
}

function deleteTask(id) {
  if (!confirm("Excluir esta tarefa?")) return;
  state.tasks = state.tasks.filter((t) => t.id !== id);
  save("tasks");
  renderTasks();
  notify('<i class="fas fa-trash"></i> Tarefa excluída');
}

function renderTasks() {
  const active = state.tasks.filter((t) => !t.completed);
  const completed = state.tasks.filter((t) => t.completed);

  const activeList = document.getElementById("tasksList");
  const completedList = document.getElementById("completedTasksList");

  activeList.innerHTML = active.length
    ? active.map(taskHTML).join("")
    : '<div class="empty-state"><div class="empty-icon"><i class="fas fa-clipboard-list fa-3x"></i></div>Nenhuma tarefa pendente</div>';
  completedList.innerHTML = completed.map(taskHTML).join("");
  document.getElementById("completedCount").textContent = completed.length;

  updateTodayStats();
}

function taskHTML(task) {
  return `
    <div class="task-item priority-${task.priority} ${task.completed ? "completed" : ""} ${task.isRoutine ? "routine-task" : ""}">
      <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""} onchange="toggleTask(${task.id})">
      <div class="task-content">
        <div class="task-title">
          ${task.isRoutine ? '<i class="fas fa-sync-alt" style="color: #8c52ff; margin-right: 6px;" title="Tarefa de Rotina Diária"></i>' : ""}
          ${task.title}
        </div>
        <div class="task-meta">
          ${task.priority === "alta" ? '<i class="fas fa-circle" style="color: #ff4444;"></i>' : task.priority === "media" ? '<i class="fas fa-circle" style="color: #ffaa00;"></i>' : '<i class="fas fa-circle" style="color: #4caf50;"></i>'} ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          ${task.deadline ? `<i class="fas fa-clock"></i> ${new Date(task.deadline).toLocaleDateString("pt-BR")}` : ""}
          ${task.isRoutine ? '<span style="color: #8c52ff; font-weight: 600;">Rotina Diária</span>' : ""}
        </div>
      </div>
      <button class="task-delete" onclick="deleteTask(${task.id})"><i class="fas fa-trash"></i></button>
    </div>
  `;
}

// HABITS
function saveHabit() {
  const name = document.getElementById("habitInput").value.trim();
  if (!name) {
    notify(
      '<i class="fas fa-exclamation-triangle"></i> Digite o nome do hábito!',
    );
    return;
  }

  const goalMinutes = Number(document.getElementById("habitGoal").value) || 30;
  const idealTime = document.getElementById("habitTime").value || "09:00";

  const habit = {
    id: Date.now(),
    name,
    goalMinutes,
    idealTime,
    xpReward: getHabitXp(goalMinutes),
    completedToday: false,
    totalCompletions: 0,
    totalDurationSeconds: 0,
    totalSessions: 0,
    lastDurationSeconds: 0,
    createdAt: new Date().toISOString(),
  };

  state.habits.push(habit);
  save("habits");
  renderHabits();
  toggleForm("habitForm", false);
  clearForm("habit");
  notify('<i class="fas fa-bullseye"></i> Hábito criado!');

  if (state.habits.length === 1) unlock("habit_creator");
}

function habitHTML(habit) {
  const now = new Date();
  const [hour, min] = habit.idealTime.split(":").map(Number);
  const idealMin = hour * 60 + min;
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const available = currentMin >= idealMin;
  const locked = !available && !habit.completedToday;

  let badge = "";
  if (habit.completedToday)
    badge =
      '<span class="habit-badge completed"><i class="fas fa-check-circle"></i> Concluído</span>';
  else if (locked)
    badge = `<span class="habit-badge locked"><i class="fas fa-lock"></i> Disponível às ${habit.idealTime}</span>`;
  else
    badge =
      '<span class="habit-badge available"><i class="fas fa-sparkles"></i> Disponível</span>';

  const timerId = `timer-${habit.id}`;

  return `
    <div class="habit-card">
      <div class="habit-header">
        <div>
          <h3 class="habit-title">${habit.name}</h3>
          <div class="habit-info"><i class="fas fa-stopwatch"></i> ${habit.goalMinutes} min | <i class="fas fa-clock"></i> ${habit.idealTime} | <i class="fas fa-bolt"></i> ${habit.xpReward} XP</div>
        </div>
        ${badge}
      </div>
      ${
        !habit.completedToday
          ? `
        <div class="habit-timer" id="${timerId}">
          <span id="${timerId}-display">00:00</span>
        </div>
        <div class="habit-timer-controls">
          <button class="timer-btn" onclick="startTimer(${habit.id})"><i class="fas fa-play"></i> Iniciar</button>
          <button class="timer-btn pause" onclick="pauseTimer(${habit.id})"><i class="fas fa-pause"></i> Pausar</button>
          <button class="timer-btn reset" onclick="resetTimer(${habit.id})"><i class="fas fa-redo"></i> Reiniciar</button>
        </div>
        <div class="habit-progress-bar">
          <div class="habit-progress-fill" id="progress-${habit.id}" style="width: 0%"></div>
        </div>
        <div class="habit-progress-text">${habit.totalCompletions} conclusões totais</div>
      `
          : ""
      }
      <div class="habit-actions">
        <button class="btn-habit-complete" onclick="completeHabit(${habit.id})" ${habit.completedToday || locked ? "disabled" : ""}>
          ${habit.completedToday ? '<i class="fas fa-check-circle"></i> Concluído hoje' : locked ? '<i class="fas fa-lock"></i> Bloqueado' : '<i class="fas fa-sparkles"></i> Marcar como Concluído'}
        </button>
        <button class="btn-habit-delete" onclick="deleteHabit(${habit.id})"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `;
}

function completeHabit(id) {
  const habit = state.habits.find((h) => h.id === id);
  if (!habit || habit.completedToday) return;

  const hour = new Date().getHours();
  if (hour < 8) unlock("early_bird");

  if (timers[id] && typeof timers[id].seconds === "number") {
    habit.lastDurationSeconds = timers[id].seconds;
    habit.totalDurationSeconds += timers[id].seconds;
    habit.totalSessions += 1;
  }

  habit.completedToday = true;
  habit.totalCompletions++;

  addXP(habit.xpReward);
  notify(`<i class="fas fa-star"></i> Hábito concluído! +${habit.xpReward} XP`);

  const totalHabitCompletions = state.habits.reduce(
    (sum, h) => sum + (h.totalCompletions || 0),
    0,
  );
  if (totalHabitCompletions === 10) unlock("habit_10");
  if (totalHabitCompletions === 50) unlock("habit_50");

  checkDailyStreak();

  save("habits");
  renderHabits();
  updateStats();
}

function deleteHabit(id) {
  if (!confirm("Excluir este hábito?")) return;
  state.habits = state.habits.filter((h) => h.id !== id);
  save("habits");
  renderHabits();
  notify('<i class="fas fa-trash"></i> Hábito excluído');
}

function renderHabits() {
  const list = document.getElementById("habitsList");
  list.innerHTML = state.habits.length
    ? state.habits.map(habitHTML).join("")
    : '<div class="empty-state"><div class="empty-icon"><i class="fas fa-bullseye fa-3x"></i></div>Nenhum hábito criado</div>';
}

// XP & STATS
function addXP(amount) {
  state.stats.totalXP += amount;
  // Nível = floor(totalXP / 100) + 1
  // Nível 1: 0-99 XP, Nível 2: 100-199 XP, Nível 3: 200-299 XP, etc
  const newLevel = Math.floor(state.stats.totalXP / 100) + 1;

  if (newLevel > state.stats.level) {
    state.stats.level = newLevel;
    notify(
      `<i class="fas fa-level-up-alt"></i> Parabéns! Você subiu para o nível ${newLevel}!`,
    );
    if (newLevel === 5) unlock("level_5");
  }

  save("stats");
  updateStats();
}

function normalizeHabits() {
  state.habits = state.habits.map((habit) => {
    const normalizedXp = getHabitXp(habit.goalMinutes || 30);
    return {
      ...habit,
      xpReward: normalizedXp,
      totalDurationSeconds: habit.totalDurationSeconds || 0,
      totalSessions: habit.totalSessions || 0,
      lastDurationSeconds: habit.lastDurationSeconds || 0,
    };
  });
}

function computeEligibleAchievements() {
  const completedTasks = state.tasks.filter((t) => t.completed);
  const completedCount = completedTasks.length;
  const highPriorityCompleted = completedTasks.filter(
    (t) => t.priority === "alta",
  ).length;
  const totalHabitsCompleted = state.habits.reduce(
    (sum, h) => sum + (h.totalCompletions || 0),
    0,
  );
  const routineTasks = state.tasks.filter((t) => t.isRoutine);
  const routineCompleted = routineTasks.filter((t) => t.completed).length;

  return new Set([
    ...(state.tasks.length >= 1 ? ["first_task"] : []),
    ...(state.tasks.length >= 5 ? ["task_planner"] : []),
    ...(completedCount >= 10 ? ["task_master"] : []),
    ...(completedCount >= 25 ? ["task_25"] : []),
    ...(completedCount >= 50 ? ["task_destroyer"] : []),
    ...(completedCount >= 100 ? ["task_100"] : []),
    ...(state.habits.length >= 1 ? ["habit_creator"] : []),
    ...(totalHabitsCompleted >= 10 ? ["habit_10"] : []),
    ...(totalHabitsCompleted >= 50 ? ["habit_50"] : []),
    ...(highPriorityCompleted >= 5 ? ["high_priority_5"] : []),
    ...(state.stats.streak >= 3 ? ["streak_3"] : []),
    ...(state.stats.streak >= 7 ? ["week_warrior"] : []),
    ...(state.stats.streak >= 14 ? ["streak_14"] : []),
    ...(state.stats.streak >= 30 ? ["month_streak"] : []),
    ...(state.stats.level >= 5 ? ["level_5"] : []),
    ...(routineTasks.length >= 3 && routineCompleted === routineTasks.length
      ? ["routine_master"]
      : []),
  ]);
}

function enforceIntegrity() {
  normalizeHabits();

  const eligible = computeEligibleAchievements();
  state.stats.achievements = Array.from(eligible);

  const taskXp = state.tasks.reduce((sum, task) => {
    if (!task.completed) return sum;
    let xp = 20;
    if (task.priority === "alta") xp += 20;
    else if (task.priority === "media") xp += 10;
    return sum + xp;
  }, 0);

  const habitXp = state.habits.reduce((sum, habit) => {
    const reward = getHabitXp(habit.goalMinutes || 30);
    return sum + reward * (habit.totalCompletions || 0);
  }, 0);

  const achievementXp = achievements.reduce((sum, achievement) => {
    if (eligible.has(achievement.id)) return sum + achievement.xp;
    return sum;
  }, 0);

  const totalXp = taskXp + habitXp + achievementXp;
  state.stats.totalXP = totalXp;
  state.stats.level = Math.floor(totalXp / 100) + 1;

  save("stats");
  save("habits");
}

function updateStats() {
  enforceIntegrity();
  document.getElementById("totalXP").textContent = state.stats.totalXP;
  document.getElementById("userLevel").textContent = state.stats.level;
  document.getElementById("streak").textContent = state.stats.streak;

  // Calcular XP para próximo nível
  const nextLevel = state.stats.level + 1;
  const xpCurrentLevelStart = (state.stats.level - 1) * 100; // XP onde o nível atual começou
  const xpNextLevelStart = state.stats.level * 100; // XP necessário para próximo nível
  const xpInCurrentLevel = state.stats.totalXP - xpCurrentLevelStart; // XP ganho no nível atual
  const xpNeededForNextLevel = 100; // Sempre 100 XP por nível
  const progress = Math.max(
    0,
    Math.min((xpInCurrentLevel / xpNeededForNextLevel) * 100, 100),
  );

  document.getElementById("nextLevel").textContent = nextLevel;
  document.getElementById("currentXP").textContent = Math.max(
    0,
    xpInCurrentLevel,
  );
  document.getElementById("xpForNext").textContent = xpNeededForNextLevel;
  document.getElementById("xpProgressBar").style.width = `${progress}%`;

  updateProgressPanel();
  localStorage.setItem(
    "planly_public_stats",
    JSON.stringify({
      xp: state.stats.totalXP,
      level: state.stats.level,
      streak: state.stats.streak,
      updatedAt: new Date().toISOString(),
    }),
  );
  window.dispatchEvent(new CustomEvent("planly-stats-updated"));
}

function checkDailyStreak() {
  const userId = getCurrentUserId();
  const today = new Date().toDateString();
  const lastStreakDate = localStorage.getItem(`planly_last_streak_${userId}`);

  // Verificar se já incrementou sequência hoje
  if (lastStreakDate === today) {
    return;
  }

  // Verificar se TODAS as tarefas e hábitos do dia foram completados
  const storedTasks =
    JSON.parse(localStorage.getItem(`planly_tasks_${userId}`)) || [];
  const storedHabits =
    JSON.parse(localStorage.getItem(`planly_habits_${userId}`)) || [];

  const tasksForCheck = state.tasks.length ? state.tasks : storedTasks;
  const habitsForCheck = state.habits.length ? state.habits : storedHabits;

  const totalTasks = tasksForCheck.length;
  const completedTasks = tasksForCheck.filter((t) => t.completed).length;
  const totalHabits = habitsForCheck.length;
  const completedHabits = habitsForCheck.filter((h) => h.completedToday).length;

  if (totalTasks === 0 || completedTasks < totalTasks) {
    return;
  }

  if (totalHabits > 0 && completedHabits < totalHabits) {
    return;
  }

  // Todas as tarefas completadas! Incrementar sequência
  state.stats.streak++;
  localStorage.setItem(`planly_last_streak_${userId}`, today);

  showStreakAnimation(state.stats.streak);
  notify(
    `<i class="fas fa-fire"></i> Sequência: ${state.stats.streak} dia${state.stats.streak > 1 ? "s" : ""}!`,
  );

  state.stats.lastActive = new Date().toISOString();

  if (state.stats.streak === 7) unlock("week_warrior");
  if (state.stats.streak === 3) unlock("streak_3");
  if (state.stats.streak === 14) unlock("streak_14");
  if (state.stats.streak === 30) unlock("month_streak");

  save("stats");
  updateStats();
}

function showStreakAnimation(streakDays) {
  // Remove animação anterior se existir
  const existing = document.getElementById("streakAnimationModal");
  if (existing) existing.remove();

  // Criar modal de animação
  const modal = document.createElement("div");
  modal.id = "streakAnimationModal";
  modal.className = "streak-animation-modal";
  modal.innerHTML = `
    <div class="streak-animation-content">
      <div class="flame-container">
        <i class="fas fa-fire flame-icon"></i>
        <div class="flame-glow"></div>
      </div>
      <div class="streak-number">${streakDays}</div>
      <div class="streak-text">DIA${streakDays > 1 ? "S" : ""} DE SEQUÊNCIA!</div>
      <div class="streak-message">Continue assim! 💪</div>
    </div>
  `;

  document.body.appendChild(modal);

  // Animar entrada
  setTimeout(() => modal.classList.add("show"), 10);

  // Remover após 3 segundos
  setTimeout(() => {
    modal.classList.remove("show");
    setTimeout(() => modal.remove(), 500);
  }, 3000);
}

function updateTodayStats() {
  // Estatísticas de tarefas de rotina
  const routineTasks = state.tasks.filter((t) => t.isRoutine);
  const routineCompleted = routineTasks.filter((t) => t.completed).length;

  document.getElementById("routineCompleted").textContent = routineCompleted;
  document.getElementById("routineTotal").textContent = routineTasks.length;

  if (routineTasks.length >= 3 && routineCompleted === routineTasks.length) {
    unlock("routine_master");
  }

  updateProgressPanel();
}

function updateProgressPanel() {
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter((t) => t.completed).length;
  const tasksPercent = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  const totalHabits = state.habits.length;
  const completedHabits = state.habits.filter((h) => h.completedToday).length;
  const habitsPercent = totalHabits
    ? Math.round((completedHabits / totalHabits) * 100)
    : 0;

  const routineTasks = state.tasks.filter((t) => t.isRoutine);
  const routineCompleted = routineTasks.filter((t) => t.completed).length;
  const routinePercent = routineTasks.length
    ? Math.round((routineCompleted / routineTasks.length) * 100)
    : 0;

  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const weeklyDone = state.tasks.filter((t) => {
    if (!t.lastCompletedDate) return false;
    const date = new Date(t.lastCompletedDate);
    return date >= weekAgo && date <= now && t.completed;
  }).length;

  const weeklyGoal = 20;
  const weekPercent = Math.min(
    100,
    Math.round((weeklyDone / weeklyGoal) * 100),
  );

  const highPriorityPending = state.tasks.filter(
    (t) => !t.completed && t.priority === "alta",
  ).length;

  const overdue = state.tasks.filter((t) => {
    if (t.completed || !t.deadline) return false;
    return new Date(t.deadline) < now;
  }).length;

  const unlocked = state.stats.achievements
    ? state.stats.achievements.length
    : 0;

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  const setWidth = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.style.width = `${value}%`;
  };

  setText("progressTasksPercent", tasksPercent);
  setText("progressTasksDone", completedTasks);
  setText("progressTasksTotal", totalTasks);
  setWidth("progressTasksBar", tasksPercent);

  setText("progressHabitsPercent", habitsPercent);
  setText("progressHabitsDone", completedHabits);
  setText("progressHabitsTotal", totalHabits);
  setWidth("progressHabitsBar", habitsPercent);

  setText("progressRoutinePercent", routinePercent);
  setText("progressRoutineDone", routineCompleted);
  setText("progressRoutineTotal", routineTasks.length);
  setWidth("progressRoutineBar", routinePercent);

  setText("progressWeekPercent", weekPercent);
  setText("progressWeekDone", weeklyDone);
  setText("progressWeekGoal", weeklyGoal);
  setWidth("progressWeekBar", weekPercent);

  setText("summaryHighPriority", highPriorityPending);
  setText("summaryOverdue", overdue);
  setText("summaryUnlocked", unlocked);
}

// ACHIEVEMENTS
function loadAchievements() {
  if (!state.stats.achievements) {
    state.stats.achievements = [];
  }
  achievements.forEach((a) => {
    a.unlocked = false;
  });
  achievements.forEach((a) => {
    if (state.stats.achievements.includes(a.id)) {
      a.unlocked = true;
    }
  });
  renderAchievements();
}

function unlock(id) {
  const achievement = achievements.find((a) => a.id === id);
  if (!achievement) return;

  // Verificar se já foi desbloqueada
  if (!state.stats.achievements) {
    state.stats.achievements = [];
  }

  if (state.stats.achievements.includes(id)) {
    return; // Já desbloqueada
  }

  achievement.unlocked = true;
  state.stats.achievements.push(id);

  addXP(achievement.xp);
  notify(
    `<i class="fas fa-trophy"></i> Conquista: ${achievement.name}! +${achievement.xp} XP`,
  );

  save("stats");
  renderAchievements();
}

function renderAchievements() {
  const list = document.getElementById("achievementsList");
  list.innerHTML = achievements
    .map(
      (a) => `
    <div class="achievement-card ${a.unlocked ? "unlocked" : "locked"}">
      <div class="achievement-icon">${a.icon}</div>
      <div class="achievement-name">${a.name}</div>
      <div class="achievement-desc">${a.desc}</div>
      <div class="achievement-xp">+${a.xp} XP</div>
    </div>
  `,
    )
    .join("");
}

// UTILS
function clearForm(type) {
  if (type === "task") {
    document.getElementById("taskInput").value = "";
    document.getElementById("taskPriority").value = "media";
    document.getElementById("taskDeadline").value = "";
  } else {
    document.getElementById("habitInput").value = "";
    document.getElementById("habitGoal").value = "30";
    document.getElementById("habitTime").value = "09:00";
  }
}

function save(type) {
  const userId = getCurrentUserId();
  localStorage.setItem(`planly_${type}_${userId}`, JSON.stringify(state[type]));
}

function notify(msg) {
  const notif = document.createElement("div");
  notif.className = "notification";

  // Usar innerHTML para renderizar HTML corretamente
  notif.innerHTML = msg;

  document.body.appendChild(notif);

  // Adicionar animação de entrada
  setTimeout(() => {
    notif.style.animation = "slideIn 0.3s ease";
  }, 10);

  // Remover após 3 segundos
  setTimeout(() => {
    notif.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

function render() {
  renderTasks();
  renderHabits();
  renderAchievements();
  updateStats();
}

// RESET DIÁRIO
function checkReset() {
  const today = new Date().toDateString();
  const userId = getCurrentUserId();
  const lastCheck = localStorage.getItem(`planly_last_check_${userId}`);

  if (lastCheck !== today) {
    // Resetar hábitos
    state.habits.forEach((h) => (h.completedToday = false));
    save("habits");

    // Resetar tarefas de rotina (desmarcar completed)
    state.tasks.forEach((task) => {
      if (task.isRoutine) {
        task.completed = false;
      }
    });
    save("tasks");

    // Verificar inatividade e resetar sequência se necessário
    const lastActive = state.stats.lastActive
      ? new Date(state.stats.lastActive)
      : null;

    if (lastActive) {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      lastActive.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (todayDate - lastActive) / (1000 * 60 * 60 * 24),
      );

      // Se passou mais de 1 dia sem atividade, reseta sequência
      if (diffDays > 1 && state.stats.streak > 0) {
        state.stats.streak = 0;
        save("stats");
        notify(
          '<i class="fas fa-exclamation-triangle"></i> Sequência resetada por inatividade!',
        );
      }
    }

    const userId = getCurrentUserId();
    localStorage.setItem(`planly_last_check_${userId}`, today);
    renderHabits();
    renderTasks();
    updateStats();
  }
}

setInterval(checkReset, 60000);
checkReset();

// TEMA CLARO/ESCURO
function applyTaskPageTheme() {
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    toggle.checked = true;
  }

  toggle.addEventListener("change", () => {
    if (toggle.checked) {
      document.body.classList.add("light-theme");
      localStorage.setItem("theme", "light");
    } else {
      document.body.classList.remove("light-theme");
      localStorage.setItem("theme", "dark");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyTaskPageTheme();
});

// TIMER PARA HÁBITOS
const timers = {};

function startTimer(habitId) {
  const habit = state.habits.find((h) => h.id === habitId);
  if (!habit) return;

  if (!timers[habitId]) {
    timers[habitId] = { seconds: 0, interval: null };
  }

  if (timers[habitId].interval) return; // Já está rodando

  timers[habitId].interval = setInterval(() => {
    timers[habitId].seconds++;
    updateTimerDisplay(habitId);
    updateTimerProgress(habitId, habit.goalMinutes);
  }, 1000);
}

function pauseTimer(habitId) {
  if (timers[habitId] && timers[habitId].interval) {
    clearInterval(timers[habitId].interval);
    timers[habitId].interval = null;
  }
}

function resetTimer(habitId) {
  pauseTimer(habitId);
  if (timers[habitId]) {
    timers[habitId].seconds = 0;
    updateTimerDisplay(habitId);
    updateTimerProgress(habitId, 0);
  }
}

function updateTimerDisplay(habitId) {
  const display = document.getElementById(`timer-${habitId}-display`);
  if (!display) return;

  const seconds = timers[habitId].seconds;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  display.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateTimerProgress(habitId, goalMinutes) {
  const progressBar = document.getElementById(`progress-${habitId}`);
  if (!progressBar) return;

  const seconds = timers[habitId].seconds;
  const goalSeconds = goalMinutes * 60;
  const progress = Math.min((seconds / goalSeconds) * 100, 100);
  progressBar.style.width = `${progress}%`;

  // Auto-completar quando atingir a meta
  if (progress >= 100) {
    pauseTimer(habitId);
    notify(
      '<i class="fas fa-check-double"></i> Meta atingida! Você pode marcar como concluído.',
    );
  }
}

// Função para recarregar dados do usuário atual
function reloadUserData() {
  const userId = getCurrentUserId();

  // Recarregar tasks
  state.tasks =
    JSON.parse(localStorage.getItem(`planly_tasks_${userId}`)) || [];

  // Recarregar habits
  state.habits =
    JSON.parse(localStorage.getItem(`planly_habits_${userId}`)) || [];

  // Recarregar stats
  state.stats = JSON.parse(localStorage.getItem(`planly_stats_${userId}`)) || {
    totalXP: 0,
    level: 1,
    streak: 0,
    lastActive: null,
    achievements: [],
  };

  enforceIntegrity();

  // Re-renderizar tudo
  if (typeof renderTasks === "function") renderTasks();
  if (typeof renderHabits === "function") renderHabits();
  if (typeof updateStats === "function") updateStats();
}

// Expor função globalmente para uso do auth.js
window.reloadUserData = reloadUserData;

function getPendingTasksStorageKey(userId) {
  return `planly_pending_tasks_${userId}`;
}

// Função para adicionar tarefa a partir do plano gerado
// Aceita tanto uma string (formato antigo) quanto um objeto {title, priority, deadline}
function addTaskFromPlan(taskOrTitle) {
  const isObject = taskOrTitle && typeof taskOrTitle === "object";
  const rawTitle = isObject ? taskOrTitle.title : taskOrTitle;
  const title = rawTitle == null ? "" : String(rawTitle).trim();
  if (!title) return;

  const task = {
    id: Date.now() + Math.random(),
    title,
    priority: (isObject && taskOrTitle.priority) || "media",
    deadline: (isObject && taskOrTitle.deadline) || "",
    completed: false,
    isRoutine: false,
    createdAt: new Date().toISOString(),
  };

  state.tasks.push(task);
  save("tasks");

  if (typeof renderTasks === "function") {
    renderTasks();
  }
}

// Função para adicionar hábito a partir do plano gerado pela IA
function addHabitFromPlan(habit) {
  const rawName = habit && habit.title;
  const name = rawName == null ? "" : String(rawName).trim();
  if (!name) return;

  const goalMinutes = Number(habit && habit.goalMinutes) || 30;
  const idealTime = (habit && habit.idealTime) || "09:00";

  const newHabit = {
    id: Date.now() + Math.random(),
    name,
    goalMinutes,
    idealTime,
    xpReward: getHabitXp(goalMinutes),
    completedToday: false,
    totalCompletions: 0,
    totalDurationSeconds: 0,
    totalSessions: 0,
    lastDurationSeconds: 0,
    createdAt: new Date().toISOString(),
  };

  state.habits.push(newHabit);
  save("habits");

  if (typeof renderHabits === "function") {
    renderHabits();
  }
}

// Mostrar notificação de tarefas/hábitos adicionados
function showTasksAddedNotification() {
  const tasksCount = Number(localStorage.getItem("planly_tasks_added_count")) || 0;
  const habitsCount = Number(localStorage.getItem("planly_habits_added_count")) || 0;

  if (tasksCount > 0 || habitsCount > 0) {
    setTimeout(() => {
      const partes = [];
      if (tasksCount > 0) {
        partes.push(`${tasksCount} ${tasksCount == 1 ? "tarefa" : "tarefas"}`);
      }
      if (habitsCount > 0) {
        partes.push(`${habitsCount} ${habitsCount == 1 ? "hábito" : "hábitos"}`);
      }
      notify(
        `<i class="fas fa-check-circle"></i> ${partes.join(" e ")} adicionado(s) do plano!`,
      );
      localStorage.removeItem("planly_tasks_added_count");
      localStorage.removeItem("planly_habits_added_count");
    }, 300);
  }
}

function importPendingPlanTasks(userId = getCurrentUserId()) {
  if (!userId || userId === "guest") return;
  const userKey = getPendingTasksStorageKey(userId);
  let pending = localStorage.getItem(userKey);

  const guestKey = getPendingTasksStorageKey("guest");

  // Compatibilidade com chave antiga (antes do userId)
  if (!pending) {
    pending = localStorage.getItem("planly_pending_tasks");
  }

  // Se o usuário já está logado, tentar migrar tarefas salvas como guest
  if (!pending && userId !== "guest") {
    pending = localStorage.getItem(guestKey);
  }

  if (!pending) return;

  try {
    const items = JSON.parse(pending);
    if (Array.isArray(items) && items.length > 0) {
      let tasksAdded = 0;
      let habitsAdded = 0;

      items.forEach((item) => {
        // Formato antigo: string simples = sempre tarefa
        if (typeof item === "string") {
          addTaskFromPlan(item);
          tasksAdded++;
          return;
        }
        if (item && item.type === "habito") {
          addHabitFromPlan(item);
          habitsAdded++;
        } else {
          addTaskFromPlan(item);
          tasksAdded++;
        }
      });

      if (tasksAdded > 0) {
        localStorage.setItem("planly_tasks_added_count", tasksAdded);
      }
      if (habitsAdded > 0) {
        localStorage.setItem("planly_habits_added_count", habitsAdded);
      }
    }
  } catch (err) {
    console.error("Erro ao importar tarefas pendentes:", err);
  } finally {
    localStorage.removeItem(userKey);
    localStorage.removeItem(guestKey);
    localStorage.removeItem("planly_pending_tasks");
  }
}

// Expor funções globalmente
window.addTaskFromPlan = addTaskFromPlan;
window.addHabitFromPlan = addHabitFromPlan;

// Mostrar notificação ao carregar página se tarefas foram adicionadas
function onTasksPageReady() {
  importPendingPlanTasks();
  showTasksAddedNotification();
  updateProgressPanel();
}

document.addEventListener("DOMContentLoaded", () => {
  onTasksPageReady();
});

window.addEventListener("planly-auth-ready", () => {
  onTasksPageReady();
});
