const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");

async function createAdmin() {

  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "TON_DATABASE"
  });

  const password = "Admin123456";

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.execute(
    `INSERT INTO users
    (nom, prenom, email, password, role)
    VALUES (?, ?, ?, ?, 'admin')`,
    [
      "Admin",
      "Principal",
      "admin@olived.tn",
      hashedPassword
    ]
  );

  console.log("Admin créé");

  await db.end();
}

createAdmin();