/**
 * Gestion de la PWA : Service Worker et prompt d'installation
 */

// 1. Enregistrement du Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker enregistré avec succès:", registration);
      })
      .catch((error) => {
        console.log("Échec de l'enregistrement du Service Worker:", error);
      });
  });
}

// 2. Logique pour la popup "Ajouter à l'écran d'accueil"

// Détection d'iOS pour afficher un message personnalisé
const isIos = () => /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
const isInStandaloneMode = () => "standalone" in navigator && navigator.standalone;

if (isIos() && !isInStandaloneMode()) {
  const iosPopup = document.createElement("div");
  iosPopup.id = "ios-install-popup";
  iosPopup.innerHTML = `
    <div style="position: fixed; bottom: 0; left: 0; right: 0; background: rgba(50,50,50,0.9); padding: 15px; text-align: center; color: white; border-top: 1px solid #444; z-index: 1000;">
      Pour une meilleure expérience, ajoutez l'application à votre écran d'accueil : Appuyez sur l'icône de partage <img src="/images/ios-share-icon.png" alt="Share Icon" style="height: 20px; vertical-align: middle; margin: 0 5px;"> puis sur "Ajouter à l'écran d'accueil".
      <button id="close-ios-popup" style="position: absolute; top: 5px; right: 10px; border: none; background: transparent; color: white; font-size: 24px; cursor: pointer;">&times;</button>
    </div>
  `;
  document.body.appendChild(iosPopup);
  document.getElementById("close-ios-popup").addEventListener("click", () => {
    iosPopup.style.display = "none";
  });
}

// Logique pour Android/Desktop via l'événement beforeinstallprompt
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const installBtn = document.createElement("button");
  installBtn.id = "install-pwa-btn";
  installBtn.textContent = "Installer l'application";
  installBtn.style.cssText = "position: fixed; bottom: 1rem; left: 50%; transform: translateX(-50%); padding: 1rem; background-color: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; z-index: 1000;";
  
  document.body.appendChild(installBtn);

  installBtn.addEventListener("click", () => {
    installBtn.style.display = "none";
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      console.log(`Installation: ${choiceResult.outcome}`);
      deferredPrompt = null;
    });
  });
});