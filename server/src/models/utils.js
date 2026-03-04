export function generateUniqueCode(hosts) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const codeLength = 4;
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = "";
    for (let i = 0; i < codeLength; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    if (!hosts.has(code)) {
      isUnique = true;
    }
  }

  return code;
}

export function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function toSquare(val) {
  if (val == 0) return 0;
  return val * val;
}
