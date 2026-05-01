async function run() {
  const payload = {
    profile: {
      userId: "Lucas",
      name: "Lucas",
      streak: 0,
      trainedToday: false,
    },
    input: "meu joelho tá estranho",
    language: "pt-BR",
    history: []
  };

  const res = await fetch("http://localhost:3001/guto", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  console.log(await res.text());
}
run();
