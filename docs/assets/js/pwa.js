let deferredPrompt;

function setInstallButtonVisible(visible) {
  const installBtn = document.getElementById("installBtn");
  if (!installBtn) return;
  installBtn.style.display = visible ? "inline-flex" : "none";
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  setInstallButtonVisible(true);
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  setInstallButtonVisible(false);
});

document.addEventListener("DOMContentLoaded", () => {
  const installBtn = document.getElementById("installBtn");
  setInstallButtonVisible(false);
  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      setInstallButtonVisible(false);
    });
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {
      // Ignorar falhas de registro silenciosamente
    });
  });
}
