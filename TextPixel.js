class TextPixel extends Vehicle {
  constructor(x, y, target, scatterTarget, color, size) {
    super(x, y); this.target = target; this.scatterTarget = scatterTarget; this.color = color; this.size = size;
    this.maxSpeed = 11; this.maxForce = 0.65; this.rayonZoneDeFreinage = 75;
  }
  mouseRepulsion(mouse, radius = 72) {
    if (!mouse || p5.Vector.dist(this.pos, mouse) >= radius) return createVector(0, 0);
    const desired = p5.Vector.sub(this.pos, mouse);
    if (desired.mag() === 0) desired.set(1, 0);
    desired.setMag(this.maxSpeed);
    return p5.Vector.sub(desired, this.vel).limit(this.maxForce);
  }
  step(forming, time, mouse = null) {
    const target = (forming ? this.target : this.scatterTarget).copy();
    target.y += Math.sin(time * 1.5 + target.x * 0.018) * (forming ? 0.65 : 7);
    const repulsion = this.mouseRepulsion(mouse);
    this.applyForce(repulsion.mag() > 0 ? repulsion : this.arrive(target)); this.update();
  }
  show() { noStroke(); fill(this.color); rect(this.pos.x, this.pos.y, this.size, this.size, this.size * 0.2); }
}
