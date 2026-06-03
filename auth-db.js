export async function createUser() {
  const error = new Error("db.createUser uygulamasi baglanmadi.");
  error.statusCode = 501;
  throw error;
}

export async function findUserByIdentifier() {
  const error = new Error("db.findUserByIdentifier uygulamasi baglanmadi.");
  error.statusCode = 501;
  throw error;
}
