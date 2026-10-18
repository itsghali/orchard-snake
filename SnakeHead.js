class SnakeHead extends Vehicle {
  constructor(x, y, skin = { body:'#527d45', dark:'#18382d', light:'#b8c982', belly:'#d7d59f' }) {
    super(x, y);
    this.maxForce = 0.55;
    this.rayonZoneDeFreinage = 85;
    this.bodyWidth = 24;
    this.headingAngle = 0;
    this.skin = skin;
  }
  show() {
    if (this.vel.mag() > 0.05) this.headingAngle = this.vel.heading();
    push(); translate(this.pos.x, this.pos.y); rotate(this.headingAngle);
    noStroke(); fill(this.skin.dark); ellipse(-2, 0, this.bodyWidth * 1.78, this.bodyWidth * 1.2);
    fill(this.skin.body); ellipse(1, 0, this.bodyWidth * 1.64, this.bodyWidth * 1.08);
    fill(this.skin.belly); ellipse(this.bodyWidth * .22, 0, this.bodyWidth * .88, this.bodyWidth * .66);
    noFill(); stroke(this.skin.light); strokeWeight(1);
    arc(-this.bodyWidth*.18,-this.bodyWidth*.18,this.bodyWidth*.42,this.bodyWidth*.3,0,Math.PI);
    arc(-this.bodyWidth*.18,this.bodyWidth*.18,this.bodyWidth*.42,this.bodyWidth*.3,Math.PI,Math.PI*2);
    noStroke(); fill('#d6c467'); circle(this.bodyWidth*.42,-this.bodyWidth*.3,7); circle(this.bodyWidth*.42,this.bodyWidth*.3,7);
    stroke('#101815'); strokeWeight(2); line(this.bodyWidth*.43,-this.bodyWidth*.34,this.bodyWidth*.43,-this.bodyWidth*.26); line(this.bodyWidth*.43,this.bodyWidth*.26,this.bodyWidth*.43,this.bodyWidth*.34);
    noStroke(); fill(this.skin.dark); circle(this.bodyWidth*.72,-this.bodyWidth*.15,2.3); circle(this.bodyWidth*.72,this.bodyWidth*.15,2.3);
    if (frameCount % 90 < 18) { stroke('#e76f83'); strokeWeight(2); line(this.bodyWidth*.82,0,this.bodyWidth*1.18,0); line(this.bodyWidth*1.18,0,this.bodyWidth*1.32,-4); line(this.bodyWidth*1.18,0,this.bodyWidth*1.32,4); }
    pop();
  }
}
