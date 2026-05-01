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
    history: [
      { role: "user", text: "oi" },
      { role: "assistant", text: "E aí. Treino de peito e tríceps te espera amanhã. Já tá na mente?" },
      { role: "user", text: "academia" },
      { role: "assistant", text: "Beleza, Will. Academia é o lugar. Amanhã tem peito e tríceps te esperando lá. Hoje já foi." },
      { role: "user", text: "ontem fiz perna" },
      { role: "assistant", text: "Entendi. Perna feita ontem. Amanhã tem peito e tríceps na academia, como planejado." }
    ]
  };

  const res = await fetch("http://localhost:3001/guto", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  console.log(await res.text());
}
run();
