function getCurrentUserId() {
  return localStorage.getItem("planly_current_user") || "guest";
}

function loadState() {
  const userId = getCurrentUserId();
  const tasks =
    JSON.parse(localStorage.getItem(`planly_tasks_${userId}`)) || [];
  const habits =
    JSON.parse(localStorage.getItem(`planly_habits_${userId}`)) || [];
  const stats = JSON.parse(localStorage.getItem(`planly_stats_${userId}`)) || {
    totalXP: 0,
    level: 1,
    streak: 0,
    lastActive: null,
    achievements: [],
  };

  return { tasks, habits, stats };
}

function updateProgressPage() {
  const { tasks, habits, stats } = loadState();
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completion = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  const totalHabits = habits.length;
  const completedHabitsCount = habits.filter((h) => h.completedToday).length;
  const habitsPercent = totalHabits
    ? Math.round((completedHabitsCount / totalHabits) * 100)
    : 0;

  const routineTasks = tasks.filter((t) => t.isRoutine);
  const routineDone = routineTasks.filter((t) => t.completed).length;
  const routinePercent = routineTasks.length
    ? Math.round((routineDone / routineTasks.length) * 100)
    : 0;

  const completedHabits = habits.filter((h) => h.completedToday);
  const habitPerformance = completedHabits.reduce(
    (acc, habit) => {
      if (!habit.lastDurationSeconds) return acc;
      const goalSeconds = (habit.goalMinutes || 0) * 60;
      if (!goalSeconds) return acc;
      const ratio = habit.lastDurationSeconds / goalSeconds;
      if (ratio <= 0.6) acc.fast += 1;
      else if (ratio <= 1) acc.onTime += 1;
      else acc.slow += 1;
      return acc;
    },
    { fast: 0, onTime: 0, slow: 0 },
  );

  const totalRated =
    habitPerformance.fast + habitPerformance.onTime + habitPerformance.slow;
  const calcPercent = (value) =>
    totalRated ? Math.round((value / totalRated) * 100) : 0;

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  const setWidth = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.style.width = `${value}%`;
  };

  setText("progCompletion", completion);
  setText("progDone", completedTasks);
  setText("progTotal", totalTasks);

  setText("progHabitsPercent", habitsPercent);
  setText("progHabitsDone", completedHabitsCount);
  setText("progHabitsTotal", totalHabits);

  setText("progStreak", stats.streak || 0);

  setText("habitFast", habitPerformance.fast);
  setText("habitOnTime", habitPerformance.onTime);
  setText("habitSlow", habitPerformance.slow);
  setWidth("habitFastBar", calcPercent(habitPerformance.fast));
  setWidth("habitOnTimeBar", calcPercent(habitPerformance.onTime));
  setWidth("habitSlowBar", calcPercent(habitPerformance.slow));
}

document.addEventListener("DOMContentLoaded", () => {
  updateProgressPage();
});

window.addEventListener("planly-auth-ready", () => {
  updateProgressPage();
});

window.addEventListener("planly-stats-updated", () => {
  updateProgressPage();
});
