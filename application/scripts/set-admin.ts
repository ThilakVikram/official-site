// npm run setAdmin [-- email]
// Gives an existing user admin access, or creates a new admin account when
// no user has that email.
import { createInterface } from "node:readline";
import { hash } from "argon2";
import { prisma } from "@/database/lib/prisma";
import { checkEmail, checkPassword, checkUserName, normalizeEmail } from "@/app/_auth/validation";

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
// Read lines through the iterator so piped input isn't dropped between prompts.
const lines = rl[Symbol.asyncIterator]();

// readline echoes typed characters through this internal method; muting it hides passwords.
let muted = false;
const output = rl as unknown as { _writeToOutput: (s: string) => void };
const write = output._writeToOutput.bind(rl);
output._writeToOutput = (s) => {
  if (!muted) write(s);
};

async function ask(question: string, hidden = false) {
  process.stdout.write(question);
  muted = hidden;
  const { value, done } = await lines.next();
  muted = false;
  if (hidden) process.stdout.write("\n");
  if (done) throw new Error("Input ended before all details were entered.");
  return String(value);
}

// Asks until `check` accepts the answer.
async function askValid(question: string, check: (v: string) => string | null | Promise<string | null>, hidden = false) {
  for (;;) {
    const value = hidden ? await ask(question, true) : (await ask(question)).trim();
    const error = await check(value);
    if (!error) return value;
    console.log(`  ${error}`);
  }
}

async function main() {
  const email = normalizeEmail(process.argv[2] ?? (await askValid("Email: ", (v) => checkEmail(normalizeEmail(v)))));
  const invalid = checkEmail(email);
  if (invalid) throw new Error(invalid);

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, userName: true, isAdmin: true } });
  if (user) {
    if (user.isAdmin) {
      console.log(`${email} (@${user.userName}) is already an admin.`);
    } else {
      await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } });
      console.log(`${email} (@${user.userName}) is now an admin.`);
    }
    return;
  }

  console.log(`No mail id available: no user has the email ${email}.`);
  console.log("Enter the details to create a new admin account.\n");

  const userName = await askValid("User name: ", async (v) => {
    const invalidName = checkUserName(v);
    if (invalidName) return invalidName;
    return (await prisma.user.findUnique({ where: { userName: v }, select: { id: true } })) ? "That user name is taken." : null;
  });
  const name = (await ask("Full name (optional): ")).trim() || null;
  let password = "";
  for (;;) {
    password = await askValid("Password: ", checkPassword, true);
    if ((await ask("Confirm password: ", true)) === password) break;
    console.log("  Passwords don't match.");
  }

  await prisma.user.create({ data: { email, userName, name, passwordHash: await hash(password), isAdmin: true } });
  console.log(`\nCreated admin @${userName} (${email}). Log in at /auth/login.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
