import { auth } from "../lib/auth";

async function main() {
  const email = "danish@indek.test";
  const password = "indek1234";
  const name = "Danish Khan";

  const result = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name,
      role: "operator",
    },
  });

  console.log("Created operator:", result);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
