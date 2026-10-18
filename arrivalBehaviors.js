const ArrivalBehaviors = {
  head(head, pointer, fruits) {
    const nearby = fruits.filter(f => !f.eaten && p5.Vector.dist(head.pos, f.pos) < 115)
      .sort((a, b) => p5.Vector.dist(head.pos, a.pos) - p5.Vector.dist(head.pos, b.pos));
    const force = head.arrive(pointer);
    if (nearby.length) force.mult(0.3).add(head.arrive(nearby[0].pos).mult(0.7));
    return force.limit(head.maxForce);
  },
  follow(ring, leader, spacing) {
    return ring.arrive(leader.pos, spacing).limit(ring.maxForce);
  },
  fruit(fruit, head) {
    if (p5.Vector.dist(fruit.pos, head.pos) <= fruit.attractionRadius) return fruit.arrive(head.pos);
    return fruit.vel.copy().mult(-1).limit(fruit.maxForce);
  }
};
