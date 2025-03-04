const bcrypt = require("bcryptjs");

async function testBcrypt() {
  const password = "test123";
  const hash = await bcrypt.hash(password, 10);
  console.log("Hash created:", hash);

  const result = await bcrypt.compare(password, hash);
  console.log("Comparison result:", result);
}

testBcrypt();
