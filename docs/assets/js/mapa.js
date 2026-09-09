function getCurrentUserId() {
  return localStorage.getItem("planly_current_user") || "guest";
}

function getSlotsKey() {
  return `planly_map_slots_${getCurrentUserId()}`;
}

function getAssignmentsKey() {
  return `planly_map_assignments_${getCurrentUserId()}`;
}

function loadSlots() {
  const stored = localStorage.getItem(getSlotsKey());
  if (stored) {
    try {
      const slots = JSON.parse(stored);
      if (Array.isArray(slots) && slots.length) return slots;
    } catch (err) {
      console.error("Erro ao carregar slots:", err);
    }
  }

  return [
    { id: "slot-1", label: "08:00 - 10:00" },
    { id: "slot-2", label: "14:00 - 16:00" },
    { id: "slot-3", label: "19:00 - 21:00" },
  ];
}

function saveSlots(slots) {
  localStorage.setItem(getSlotsKey(), JSON.stringify(slots));
}

function loadAssignments() {
  const stored = localStorage.getItem(getAssignmentsKey());
  if (stored) {
    try {
      const data = JSON.parse(stored);
      return data && typeof data === "object" ? data : {};
    } catch (err) {
      console.error("Erro ao carregar mapa:", err);
    }
  }
  return {};
}

function saveAssignments(assignments) {
  localStorage.setItem(getAssignmentsKey(), JSON.stringify(assignments));
}

function loadTasks() {
  const userId = getCurrentUserId();
  return JSON.parse(localStorage.getItem(`planly_tasks_${userId}`)) || [];
}

function render() {
  const slotList = document.getElementById("slotList");
  const taskPool = document.getElementById("taskPool");
  if (!slotList || !taskPool) return;

  const tasks = loadTasks();
  const slots = loadSlots();
  const assignments = loadAssignments();

  const assignedTaskIds = new Set(
    Object.values(assignments)
      .flat()
      .map((id) => Number(id)),
  );

  const availableTasks = tasks.filter(
    (task) => !task.completed && !assignedTaskIds.has(task.id),
  );

  slotList.innerHTML = slots
    .map((slot) => {
      const slotTasks = (assignments[slot.id] || [])
        .map((taskId) => tasks.find((t) => t.id === taskId))
        .filter(Boolean);

      const taskHtml = slotTasks
        .map(
          (task) => `
          <div class="task-pill" draggable="true" data-task-id="${task.id}">
            <span>${task.title}</span>
            <button data-remove-task="${task.id}" title="Remover">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `,
        )
        .join("");

      return `
        <div class="slot-card" data-slot-id="${slot.id}">
          <div class="slot-title">
            <span>${slot.label}</span>
            <button class="btn-secondary" data-remove-slot="${slot.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <div class="slot-tasks" data-slot-tasks="${slot.id}">
            ${taskHtml || "<span class='map-hint'>Arraste tarefas aqui</span>"}
          </div>
        </div>
      `;
    })
    .join("");

  taskPool.innerHTML = availableTasks.length
    ? availableTasks
        .map(
          (task) => `
        <div class="task-pill" draggable="true" data-task-id="${task.id}">
          <span>${task.title}</span>
          <button data-remove-task="${task.id}" title="Remover">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `,
        )
        .join("")
    : "<span class='map-hint'>Nenhuma tarefa disponível</span>";

  bindDragAndDrop();
}

let selectedTaskId = null;

function isTouchDevice() {
  return window.matchMedia("(pointer: coarse)").matches;
}

function bindDragAndDrop() {
  const draggableTasks = document.querySelectorAll(".task-pill");
  draggableTasks.forEach((task) => {
    task.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", task.dataset.taskId);
    });

    if (isTouchDevice()) {
      task.addEventListener("click", () => {
        document
          .querySelectorAll(".task-pill.selected")
          .forEach((el) => el.classList.remove("selected"));
        selectedTaskId = Number(task.dataset.taskId);
        task.classList.add("selected");
      });
    }
  });

  const slotCards = document.querySelectorAll(".slot-card");
  slotCards.forEach((slot) => {
    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      slot.classList.add("drag-over");
    });

    slot.addEventListener("dragleave", () => {
      slot.classList.remove("drag-over");
    });

    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      slot.classList.remove("drag-over");
      const taskId = Number(event.dataTransfer.getData("text/plain"));
      if (!taskId) return;

      const assignments = loadAssignments();
      Object.keys(assignments).forEach((key) => {
        assignments[key] = assignments[key].filter(
          (storedId) => storedId !== taskId,
        );
      });

      const slotId = slot.dataset.slotId;
      assignments[slotId] = assignments[slotId] || [];
      if (!assignments[slotId].includes(taskId)) {
        assignments[slotId].push(taskId);
      }
      saveAssignments(assignments);
      render();
    });

    if (isTouchDevice()) {
      slot.addEventListener("click", () => {
        if (!selectedTaskId) return;
        const assignments = loadAssignments();
        Object.keys(assignments).forEach((key) => {
          assignments[key] = assignments[key].filter(
            (storedId) => storedId !== selectedTaskId,
          );
        });

        const slotId = slot.dataset.slotId;
        assignments[slotId] = assignments[slotId] || [];
        if (!assignments[slotId].includes(selectedTaskId)) {
          assignments[slotId].push(selectedTaskId);
        }
        saveAssignments(assignments);
        selectedTaskId = null;
        render();
      });
    }
  });

  document.querySelectorAll("[data-remove-task]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const taskId = Number(btn.dataset.removeTask);
      const assignments = loadAssignments();
      Object.keys(assignments).forEach((key) => {
        assignments[key] = assignments[key].filter(
          (storedId) => storedId !== taskId,
        );
      });
      saveAssignments(assignments);
      render();
    });
  });

  document.querySelectorAll("[data-remove-slot]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const slotId = btn.dataset.removeSlot;
      const slots = loadSlots().filter((slot) => slot.id !== slotId);
      const assignments = loadAssignments();
      delete assignments[slotId];
      saveSlots(slots);
      saveAssignments(assignments);
      render();
    });
  });
}

function setupAddSlot() {
  const addSlotBtn = document.getElementById("addSlotBtn");
  if (!addSlotBtn) return;

  addSlotBtn.addEventListener("click", () => {
    const start = prompt("Horário de início (ex: 09:00)");
    if (!start) return;
    const end = prompt("Horário de fim (ex: 11:00)");
    if (!end) return;

    const slots = loadSlots();
    const newSlot = {
      id: `slot-${Date.now()}`,
      label: `${start} - ${end}`,
    };
    slots.push(newSlot);
    saveSlots(slots);
    render();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupAddSlot();
  render();
});
