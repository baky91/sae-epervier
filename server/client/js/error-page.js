const hostCode = window.location.pathname.split("/")[1];
const inputCode = document.getElementById("game-code");

document.getElementById("error-message").innerHTML = `
    La partie avec le code '<strong>${hostCode}</strong>' n'existe pas.
`;

document.getElementById("form-code").addEventListener("submit", (event) => {
  event.preventDefault();

  const hostCode = inputCode.value.toUpperCase();
  window.location.href = hostCode;
});
