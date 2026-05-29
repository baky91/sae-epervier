const inputCode = document.getElementById("game-code");
document.getElementById("form-code").addEventListener("submit", (event) => {
  event.preventDefault();

  const hostCode = inputCode.value.toUpperCase();
  window.location.href = hostCode;
});
