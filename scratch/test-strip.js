function stripExercisesWithoutVideo(plan) {
  const valid = plan.exercises.filter(
    (e) => e.videoUrl && e.videoProvider === "local"
  );
  if (valid.length < plan.exercises.length) {
    const removed = plan.exercises
      .filter((e) => !e.videoUrl || e.videoProvider !== "local")
      .map((e) => e.id || 'NO_ID');
    console.log(`[DEBUG] Removed: ${removed.join(", ")}`);
  }
  return { ...plan, exercises: valid };
}

const samplePlan = {
  exercises: [
    {
      id: "supino_reto",
      name: "Supino Reto",
      videoUrl: "/exercise/visuals/peito/supino_reto.mp4",
      videoProvider: "local"
    },
    {
      id: "bike_academia",
      name: "Bike",
      videoUrl: "/exercise/visuals/aquecimento-aerobico/bike_academia.mp4",
      videoProvider: "local"
    }
  ]
};

const result = stripExercisesWithoutVideo(samplePlan);
console.log(`Exercises remaining: ${result.exercises.length}`);
if (result.exercises.length === 0) {
    console.log("FAIL: All exercises stripped!");
} else {
    console.log("PASS: Exercises preserved.");
}
