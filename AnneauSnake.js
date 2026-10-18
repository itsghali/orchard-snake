class AnneauSnake extends Vehicle {
  constructor(x, y, index, skin = { body:'#527d45', dark:'#18382d', light:'#b8c982', belly:'#d7d59f' }) {
    super(x, y);
    this.index = index;
    this.bodyWidth = 24;
    this.maxForce = 2;
    this.rayonZoneDeFreinage = 100;
    this.skin = skin;
  }
  show() {
    push(); translate(this.pos.x,this.pos.y); if(this.vel.mag()>.05) rotate(this.vel.heading());
    noStroke(); fill(this.index%3===0?this.skin.light:this.skin.body); ellipse(0,0,this.bodyWidth*1.08,this.bodyWidth*.86);
    fill(this.skin.belly); ellipse(0,this.bodyWidth*.18,this.bodyWidth*.72,this.bodyWidth*.24);
    noFill(); stroke(this.skin.dark); strokeWeight(.8); arc(-this.bodyWidth*.18,-2,this.bodyWidth*.38,this.bodyWidth*.3,0,Math.PI);
    arc(this.bodyWidth*.18,2,this.bodyWidth*.38,this.bodyWidth*.3,Math.PI,Math.PI*2); pop();
  }
}
