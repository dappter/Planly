// auth.js - Gerenciamento de autenticação com Firebase

import {
  initializeApp,
  getApps,
  getApp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Configuração do Firebase (mesma do firebase-auth.html)
const firebaseConfig = {
  apiKey: "__FIREBASE_API_KEY__",
  authDomain: "meu-app-94c74.firebaseapp.com",
  projectId: "meu-app-94c74",
  storageBucket: "meu-app-94c74.firebasestorage.app",
  messagingSenderId: "711758646512",
  appId: "1:711758646512:web:d9dae94a6d47c8f89a4635",
  measurementId: "G-4BDC95W4VJ",
};

// Inicializar Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

function getDisplayNameStorageKey() {
  const userId =
    auth.currentUser?.uid || localStorage.getItem("planly_current_user");
  return userId ? `planly_display_name_${userId}` : "planly_display_name";
}

// Atualizar nome do usuário no header
function updateUserDisplay(username, email = "") {
  const usernameElement = document.getElementById("username");
  const menuUsername = document.getElementById("menuUsername");
  const menuUserEmail = document.getElementById("menuUserEmail");
  const menuDisplayNameInput = document.getElementById("menuDisplayNameInput");
  if (usernameElement) {
    const localName = localStorage.getItem(getDisplayNameStorageKey());
    const display = localName || username || "Usuário";
    usernameElement.textContent = display;
    if (menuUsername) menuUsername.textContent = display;
    if (menuDisplayNameInput) menuDisplayNameInput.value = localName || "";
  }
  if (menuUserEmail) {
    menuUserEmail.textContent = email || "Conta Planly";
  }
}

function setupMenuProfileControls() {
  const input = document.getElementById("menuDisplayNameInput");
  const saveBtn = document.getElementById("menuSaveNameBtn");
  const resetBtn = document.getElementById("menuResetNameBtn");

  if (saveBtn && input) {
    saveBtn.addEventListener("click", () => {
      const value = input.value.trim();
      if (!value) {
        alert("Digite um nome para salvar.");
        return;
      }
      localStorage.setItem(getDisplayNameStorageKey(), value);
      updateUserDisplay(value);
      window.dispatchEvent(new CustomEvent("planly-display-name-updated"));
    });
  }

  if (resetBtn && input) {
    resetBtn.addEventListener("click", () => {
      localStorage.removeItem(getDisplayNameStorageKey());
      input.value = "";
      updateUserDisplay("");
      window.dispatchEvent(new CustomEvent("planly-display-name-updated"));
    });
  }
}

// Fazer logout
async function logout() {
  try {
    await signOut(auth);
    window.location.href = "/login.html";
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    alert("Erro ao sair. Tente novamente.");
  }
}

// Verificar autenticação e proteger página
onAuthStateChanged(auth, (user) => {
  // Verificar se está em página de autenticação
  const authPages = ["login.html", "register.html"];
  const currentPage = window.location.pathname.split("/").pop();

  if (authPages.includes(currentPage)) {
    return; // Não precisa verificar auth na página de login
  }

  if (user) {
    localStorage.setItem("planly_current_user", user.uid);
    window.dispatchEvent(new CustomEvent("planly-auth-ready"));

    // Recarregar dados do usuário específico (se a função existir)
    if (typeof window.reloadUserData === "function") {
      window.reloadUserData();
    }

    // Atualizar nome do usuário no header - garantir que sempre tenha um nome
    const displayName =
      user.displayName || user.email?.split("@")[0] || "Usuário";

    // Usar setTimeout para garantir que o DOM está pronto
    setTimeout(() => {
      updateUserDisplay(displayName, user.email || "");
    }, 100);

    // Configurar menu do usuário
    const userBtn = document.getElementById("userBtn");
    const userMenuWrapper = document.getElementById("userMenuWrapper");
    const logoutBtnDesktop = document.getElementById("logoutBtnDesktop");
    const logoutBtnMobile = document.getElementById("logoutBtnMobile");

    if (userBtn && userMenuWrapper) {
      userBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        userMenuWrapper.classList.toggle("open");
      });

      document.addEventListener("click", (e) => {
        if (!userMenuWrapper.contains(e.target)) {
          userMenuWrapper.classList.remove("open");
        }
      });
    }

    setupMenuProfileControls();

    if (logoutBtnDesktop) {
      logoutBtnDesktop.addEventListener("click", () => {
        if (confirm(`Olá ${displayName}! Deseja sair?`)) {
          logout();
        }
      });
    }

    if (logoutBtnMobile) {
      logoutBtnMobile.addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("Deseja sair?")) {
          logout();
        }
      });
    }
  } else {
    localStorage.removeItem("planly_current_user");
    window.location.href = "/login.html";
  }
});
