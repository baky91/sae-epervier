function generateUniqueCode(hosts) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const codeLength = 4;
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = "";
    for (let i = 0; i < codeLength; i++) {
      code += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    if (!hosts.has(code)) {
      isUnique = true;
    }
  }

  return code;
}

module.exports = { generateUniqueCode };
