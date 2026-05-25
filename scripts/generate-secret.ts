import crypto from "crypto";

console.log(`JWT_SECRET=${crypto.randomBytes(32).toString("hex")}`);
