class Food extends Vehicle {
  constructor(x, y, kind = 0, phase = 0) {
    super(x, y);
    this.kind = kind; this.phase = phase; this.eaten = false;
    this.maxSpeed = 3; this.maxForce = 0.25;
    this.rayonZoneDeFreinage = 65; this.attractionRadius = 130;
    this.points = [10, 15, 20, 25][kind];
  }
  step(head) { this.applyForce(ArrivalBehaviors.fruit(this, head)); this.update(); }
  show() {
    push(); translate(this.pos.x, this.pos.y);
    const pulse = sin(frameCount * 0.05 + this.phase);
    noFill(); stroke(130, 232, 175, 35); circle(0, 0, 43 + pulse * 4);
    rotate(pulse * 0.12); translate(0, pulse * 3); noStroke();
    if (this.kind === 0) {
      fill('#ff6b79'); ellipse(-5, 2, 19, 24); ellipse(5, 2, 19, 24); fill('#ffd0bd'); ellipse(-7, -2, 4, 8);
    } else if (this.kind === 1) {
      fill('#ffb659'); circle(0, 2, 27); fill('#ffe49c'); ellipse(-6, -3, 5, 9);
    } else if (this.kind === 2) {
      fill('#fa719b'); triangle(-14, -8, 14, -8, 0, 17); fill('#87d694'); rect(-14, -11, 28, 5, 2);
      fill('#542d50'); circle(-5, 0, 2); circle(5, 0, 2); circle(0, 8, 2);
    } else {
      fill('#b58beb'); for (const [x,y] of [[-7,-4],[7,-4],[0,5],[-6,7],[6,7],[0,16]]) circle(x,y,12);
    }
    stroke('#a0e8a0'); strokeWeight(3); line(0,-10,2,-18); noStroke(); fill('#8fe9a8'); ellipse(8,-16,12,6); pop();
  }
}
