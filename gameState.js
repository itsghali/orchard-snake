const OrchardRules = {
  duration: 60,
  readBest(storage) {
    try { const value = Number(storage.getItem('arrival-orchard-best')); return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0; }
    catch { return 0; }
  },
  saveBest(storage, score, best) {
    const next = Math.max(score, best);
    try { storage.setItem('arrival-orchard-best', String(next)); } catch { /* Session value remains valid. */ }
    return next;
  },
  collect(head, fruits) {
    let points = 0;
    for (const fruit of fruits) {
      if (!fruit.eaten && p5.Vector.dist(head.pos, fruit.pos) < head.bodyWidth * 0.55 + 12) {
        fruit.eaten = true; points += fruit.points;
      }
    }
    return points;
  },
  spawn(bounds, head, rng = Math.random) {
    let point;
    for (let i = 0; i < 30; i++) {
      point = createVector(bounds.x + 30 + rng() * Math.max(0, bounds.w - 60), bounds.y + 30 + rng() * Math.max(0, bounds.h - 60));
      if (p5.Vector.dist(point, head.pos) > 160) break;
    }
    return point;
  }
};
