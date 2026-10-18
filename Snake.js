class Snake extends Vehicle {
  constructor(x, y, settings) {
    super(x, y);
    const skins = [
      {body:'#527d45',dark:'#18382d',light:'#789f58',belly:'#d7d59f'},
      {body:'#8b633f',dark:'#39281f',light:'#b78b58',belly:'#dfc59b'},
      {body:'#4b756f',dark:'#163b3a',light:'#76a89b',belly:'#c9d6b3'},
      {body:'#6c6950',dark:'#28291f',light:'#999164',belly:'#d8cfaa'}
    ];
    this.skin = skins[Math.floor(random(skins.length))];
    this.head = new SnakeHead(x, y, this.skin);
    this.rings = [];
    this.configure(settings);
  }
  configure({ speed, length, width }) {
    this.maxSpeed = Math.max(1, Math.min(12, Number(speed) || 5));
    this.bodyWidth = Math.max(12, Math.min(36, Number(width) || 24));
    this.ringSpacing = this.bodyWidth * 0.64;
    const count = Math.max(4, Math.min(80, Math.round(Number(length) || 12)));
    while (this.rings.length < count) {
      const leader = this.rings.at(-1) || this.head;
      this.rings.push(new AnneauSnake(leader.pos.x - this.ringSpacing, leader.pos.y, this.rings.length, this.skin));
    }
    this.rings.length = count;
    this.head.maxSpeed=this.maxSpeed; this.head.bodyWidth=this.bodyWidth;
    this.rings.forEach((ring,index)=>{ ring.maxSpeed=this.maxSpeed+6; ring.bodyWidth=Math.max(this.bodyWidth*.35,this.bodyWidth*(1-index/(this.rings.length*1.35))); ring.skin=this.skin; });
  }
  step(pointer, fruits) {
    this.head.applyForce(ArrivalBehaviors.head(this.head, pointer, fruits)); this.head.update();
    let leader = this.head;
    for (const ring of this.rings) {
      ring.applyForce(ArrivalBehaviors.follow(ring, leader, this.ringSpacing));
      ring.update(); leader = ring;
    }
  }
  show() {
    const parts=[this.head,...this.rings];
    push();
    for(const [color,extra] of [[this.skin.dark,5],[this.skin.body,0]]) {
      stroke(color);
      for(let i=0;i<parts.length-1;i++) {
        strokeWeight((parts[i].bodyWidth+parts[i+1].bodyWidth)/2+extra);
        line(parts[i].pos.x,parts[i].pos.y,parts[i+1].pos.x,parts[i+1].pos.y);
      }
    }
    pop();
    for (const ring of [...this.rings].reverse()) ring.show(); this.head.show();
  }
}
