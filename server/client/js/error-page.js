const urlParams = new URLSearchParams(window.location.search);
const reason = urlParams.get('reason');
const hostCode = urlParams.get('code') || "Inconnu"; 

const inputCode = document.getElementById("game-code");
const titleElement = document.getElementById("error-title");
const messageElement = document.getElementById("error-message");

// On adapte le texte selon le type d'erreur
if (reason === "started") {
    titleElement.textContent = "Partie en cours";
    messageElement.innerHTML = `La partie avec le code '<strong>${hostCode}</strong>' a déjà commencé. Vous ne pouvez plus la rejoindre !`;
} else {
    // Par défaut (ou si reason === "not_found")
    titleElement.textContent = "Partie introuvable";
    messageElement.innerHTML = `La partie avec le code '<strong>${hostCode}</strong>' n'existe pas.`;
}

// Gestion de la nouvelle tentative
document.getElementById("form-code").addEventListener("submit", (event) => {
    event.preventDefault();

    const newHostCode = inputCode.value.toUpperCase();
    
    window.location.href = "/" + newHostCode; 
});