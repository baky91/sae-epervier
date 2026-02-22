function generate_random_code() {
  let code = "";
  const codeLength = 4;
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const charactersLength = characters.length;

  for (let i = 0; i < codeLength; i++) {
    code += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return code;
}

module.exports = { generate_random_code };
