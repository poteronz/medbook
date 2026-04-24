const db = require("./index");
const { seedDemoData } = require("./seedDemo");

async function seed() {
  const result = await seedDemoData({ reset: true });

  if (result.seeded) {
    console.log(`Готово: создано ${result.doctors} врачей и демо-данные для MedBook.`);
  } else {
    console.log("База уже заполнена, повторный сид не потребовался.");
  }
}

seed()
  .catch((error) => {
    console.error("Ошибка при заполнении базы:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    db.close();
  });
