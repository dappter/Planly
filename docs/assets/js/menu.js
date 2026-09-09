// MENU HAMBÚRGUER
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  const menuOverlay = document.getElementById("menuOverlay");
  const closeMenu = document.getElementById("closeMenu");
  const themeToggle = document.getElementById("themeToggle");
  const themeToggleMobile = document.getElementById("themeToggleMobile");

  // Sincronizar estado inicial dos toggles de tema
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    if (themeToggle) themeToggle.checked = true;
    if (themeToggleMobile) themeToggleMobile.checked = true;
  }

  // Abrir menu
  function openMenu() {
    mobileMenu.classList.add("active");
    menuOverlay.classList.add("active");
    hamburger.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  // Fechar menu
  function closeMenuFunc() {
    mobileMenu.classList.remove("active");
    menuOverlay.classList.remove("active");
    hamburger.classList.remove("active");
    document.body.style.overflow = "";
  }

  // Event listeners
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      if (mobileMenu.classList.contains("active")) {
        closeMenuFunc();
      } else {
        openMenu();
      }
    });
  }

  if (closeMenu) {
    closeMenu.addEventListener("click", closeMenuFunc);
  }

  if (menuOverlay) {
    menuOverlay.addEventListener("click", closeMenuFunc);
  }

  // Fechar menu ao pressionar ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileMenu.classList.contains("active")) {
      closeMenuFunc();
    }
  });

  // Sincronizar toggles de tema
  if (themeToggleMobile && themeToggle) {
    themeToggleMobile.addEventListener("change", () => {
      themeToggle.checked = themeToggleMobile.checked;
      themeToggle.dispatchEvent(new Event("change"));
    });

    themeToggle.addEventListener("change", () => {
      themeToggleMobile.checked = themeToggle.checked;
    });
  }

  // Fechar menu ao clicar em link de navegação (mobile)
  const mobileNavLinks = document.querySelectorAll(".mobile-nav-link");
  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMenuFunc();
    });
  });
});
