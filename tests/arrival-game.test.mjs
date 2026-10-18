import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Vector {
  constructor(x=0,y=0){ this.set(x,y); }
  set(x,y){ if(typeof x==='object'){this.x=x.x;this.y=x.y;}else{this.x=x;this.y=y;} return this; }
  copy(){ return new Vector(this.x,this.y); }
  add(v){ this.x+=v.x;this.y+=v.y;return this; }
  mult(n){ this.x*=n;this.y*=n;return this; }
  mag(){ return Math.hypot(this.x,this.y); }
  heading(){ return Math.atan2(this.y,this.x); }
  setMag(n){ const m=this.mag(); return m?this.mult(n/m):this; }
  limit(n){ return this.mag()>n?this.setMag(n):this; }
  static sub(a,b){ return new Vector(a.x-b.x,a.y-b.y); }
  static dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }
  static random2D(){ return new Vector(1,0); }
}

function audioParameter(){ return {setValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}}; }
class FakeAudioContext {
  constructor(){ this.currentTime=0; this.destination={}; this.created=0; this.state='suspended'; }
  createGain(){ return {gain:audioParameter(),connect(){}}; }
  createOscillator(){ this.created++; return {type:'',frequency:audioParameter(),connect(){},start(){},stop(){}}; }
  resume(){ this.state='running'; return Promise.resolve(); }
}

function scene(){
  const context=vm.createContext({
    createVector:(x,y)=>new Vector(x,y), p5:{Vector}, random:(a,b)=>b===undefined?a/2:(a+b)/2,
    map:(v,a,b,c,d)=>c+(d-c)*(v-a)/(b-a), Math, console, window:{AudioContext:FakeAudioContext}, document:{hidden:false,addEventListener(){},removeEventListener(){}}, setInterval:()=>1,
    push(){},pop(){},fill(){},stroke(){},strokeWeight(){},noFill(){},noStroke(){},circle(){},ellipse(){},rect(){},triangle(){},line(){},translate(){},rotate(){},
    sin:Math.sin, cos:Math.cos, frameCount:0, millis:()=>0, width:800, height:600
  });
  for(const file of ['vehicle.js','arrivalBehaviors.js','SnakeHead.js','AnneauSnake.js','Snake.js','Food.js','TextPixel.js','pixelText.js','gameState.js','libraries/webaudiox.js','GameMusic.js'])
    vm.runInContext(readFileSync(new URL(`../${file}`,import.meta.url),'utf8'),context);
  return vm.runInContext('({Vehicle,SnakeHead,AnneauSnake,Snake,Food,TextPixel,ArrivalBehaviors,PixelText,OrchardRules,GameMusic,WebAudiox})',context);
}

test('all visible entities inherit Vehicle and configurable snake keeps inherited locomotion',()=>{
  const {Vehicle,SnakeHead,AnneauSnake,Snake,Food,TextPixel}=scene();
  const snake=new Snake(100,100,{speed:7,length:14,width:30});
  assert.ok(snake instanceof Vehicle); assert.ok(snake.head instanceof SnakeHead); assert.ok(snake.head instanceof Vehicle);
  assert.ok(snake.rings.every(r=>r instanceof AnneauSnake&&r instanceof Vehicle)); assert.equal(snake.rings.length,14);
  assert.equal(snake.head.maxSpeed,7); assert.equal(snake.head.bodyWidth,30);
  assert.ok(snake.rings.at(-1).bodyWidth<snake.rings[0].bodyWidth, 'tail tapers naturally');
  assert.ok(new Food(0,0) instanceof Vehicle); assert.ok(new TextPixel(0,0,new Vector(),new Vector(10,10),'',2) instanceof Vehicle);
  assert.equal(SnakeHead.prototype.update,Vehicle.prototype.update); assert.equal(AnneauSnake.prototype.update,Vehicle.prototype.update);
});

test('head and rings calculate limited arrival forces without moving directly',()=>{
  const {Snake,ArrivalBehaviors}=scene();
  const snake=new Snake(100,100,{speed:6,length:5,width:20}); const before=[snake.head.pos.x,snake.head.pos.y];
  const force=ArrivalBehaviors.head(snake.head,new Vector(500,100),[]);
  assert.ok(force.x>0); assert.ok(force.mag()<=snake.head.maxForce+1e-12); assert.deepEqual([snake.head.pos.x,snake.head.pos.y],before);
  const ring=snake.rings[0]; ring.pos.set(20,100); const follow=ArrivalBehaviors.follow(ring,snake.head,13);
  assert.ok(follow.x>0); assert.ok(follow.mag()<=ring.maxForce+1e-12);
});

test('rings use the correction follow model and settle without repeated overshoot',()=>{
  const {Snake,ArrivalBehaviors}=scene();
  const snake=new Snake(0,0,{speed:12,length:4,width:24});
  const leader=snake.head, ring=snake.rings[0], spacing=snake.bodyWidth*.64;
  assert.equal(ring.maxSpeed,leader.maxSpeed+6);
  assert.equal(ring.maxForce,2);
  assert.equal(ring.rayonZoneDeFreinage,100);

  leader.pos.set(0,0); leader.vel.set(0,0);
  ring.pos.set(-100,0); ring.vel.set(ring.maxSpeed,0);
  let previous=Vector.dist(ring.pos,leader.pos)-spacing, crossings=0;
  for(let frame=0;frame<240;frame++){
    ring.applyForce(ArrivalBehaviors.follow(ring,leader,spacing));
    ring.update();
    const error=Vector.dist(ring.pos,leader.pos)-spacing;
    if(previous*error<0) crossings++;
    previous=error;
  }
  assert.ok(crossings<=1,`ring crossed its rest distance ${crossings} times`);
  assert.ok(Math.abs(previous)<.01,`remaining spacing error: ${previous}`);
});

test('near fruit is attracted with arrival; far fruit brakes; force stays limited',()=>{
  const {SnakeHead,Food,ArrivalBehaviors}=scene(); const head=new SnakeHead(100,100);
  const near=new Food(200,100); const attraction=ArrivalBehaviors.fruit(near,head);
  assert.ok(attraction.x<0); assert.ok(attraction.mag()<=near.maxForce+1e-12);
  const far=new Food(400,100); far.vel.set(2,0); const braking=ArrivalBehaviors.fruit(far,head);
  assert.ok(braking.x<0); assert.ok(braking.mag()<=far.maxForce+1e-12);
  near.pos.set(100,100); near.vel.set(0,0); assert.equal(ArrivalBehaviors.fruit(near,head).mag(),0);
});

test('fruit collection scores once and best score storage is robust',()=>{
  const {SnakeHead,Food,OrchardRules}=scene(); const head=new SnakeHead(100,100);
  const hit=new Food(105,100,2), miss=new Food(500,100,3);
  assert.equal(OrchardRules.collect(head,[hit,miss]),20); assert.equal(OrchardRules.collect(head,[hit,miss]),0);
  const values=new Map(); const storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  assert.equal(OrchardRules.readBest(storage),0); assert.equal(OrchardRules.saveBest(storage,35,20),35); assert.equal(OrchardRules.readBest(storage),35);
  assert.equal(OrchardRules.saveBest(storage,10,35),35);
});

test('pixel text creates exactly one arrival Vehicle for each occupied glyph cell',()=>{
  const {PixelText,TextPixel}=scene(); const points=PixelText.points('START',10,20,3);
  const expected=[...'START'].reduce((sum,c)=>sum+PixelText.glyphs[c].replaceAll('/','').split('').filter(v=>v==='1').length,0);
  assert.equal(points.length,expected); const cache={}; PixelText.set(cache,'start','START',10,20,3,'#fff');
  assert.equal(cache.start.pixels.length,expected); assert.ok(cache.start.pixels.every(p=>p instanceof TextPixel));
  assert.ok(cache.start.pixels.every(p=>p.acc.mag()===0), 'Vehicle.update clears acceleration after arrival force');
});

test('text pixels start dispersed then form quickly with arrival',()=>{
  const {PixelText}=scene(); const cache={};
  PixelText.set(cache,'title','START',10,20,3,'#fff',false,{x:0,y:0,w:800,h:600});
  const pixel=cache.title.pixels[0], initialDistance=Vector.dist(pixel.pos,pixel.target);
  assert.ok(initialDistance>100);
  for(let i=0;i<30;i++) PixelText.set(cache,'title','START',10,20,3,'#fff',true,{x:0,y:0,w:800,h:600});
  assert.ok(Vector.dist(pixel.pos,pixel.target)<initialDistance);
  assert.ok(Vector.dist(pixel.pos,pixel.target)>20, 'formation should take multiple seconds, not snap instantly');
  assert.equal(PixelText.isFormed(cache,new Set(['title'])),false);
  for(const current of cache.title.pixels) current.pos.set(current.target);
  assert.equal(PixelText.isFormed(cache,new Set(['title'])),true);
});

test('mouse disperses only nearby text pixels; arrival restores them afterward',()=>{
  const {TextPixel}=scene(); const target=new Vector(100,100);
  const near=new TextPixel(100,100,target.copy(),new Vector(500,500),'#fff',3);
  const far=new TextPixel(220,100,new Vector(220,100),new Vector(500,500),'#fff',3);
  near.step(true,-1.2,new Vector(105,100)); far.step(true,-1.2,new Vector(105,100));
  assert.ok(near.pos.x<100); assert.equal(far.pos.x,220); assert.ok(Vector.dist(far.pos,new Vector(220,100))<1);
  const displaced=Vector.dist(near.pos,target);
  for(let i=0;i<20;i++) near.step(true,-1.2,null);
  assert.ok(Vector.dist(near.pos,target)<displaced);
});

test('WebAudiox LineOut resumes suspended context, drives melody, and toggles mute',async()=>{
  const {GameMusic,WebAudiox}=scene(); const music=new GameMusic();
  assert.equal(music.start(),true); assert.equal(music.active,true); assert.ok(music.lineOut instanceof WebAudiox.LineOut);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(music.context.state,'running'); assert.equal(music.lineOut.volume,0.22); assert.ok(music.context.created>=2);
  const firstStep=music.step; music.schedule(); assert.equal(music.step,firstStep+1);
  assert.equal(music.toggle(),false); const mutedStep=music.step; music.schedule(); assert.equal(music.step,mutedStep);
  assert.equal(music.toggle(),true);
});

test('HTML exposes bounded speed, length, and width controls and leaves vehicle.js unchanged by extension',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(const [id,min,max] of [['speed','1','12'],['length','4','80'],['width','12','36']]){
    assert.match(html,new RegExp(`id="${id}"[^>]*min="${min}"[^>]*max="${max}"`));
  }
  assert.match(html,/aria-live="polite"/); assert.match(html,/SnakeHead\.js/); assert.match(html,/AnneauSnake\.js/);
  assert.match(html,/libraries\/webaudiox\.js[\s\S]*GameMusic\.js/);
  assert.doesNotMatch(html,/Arrival Snake/i);
  assert.doesNotMatch(readFileSync(new URL('../sketch.js',import.meta.url),'utf8'),/ARRIVAL \/ SNAKE/);
});

test('full sketch setup and ready/playing frames run without browser exceptions',()=>{
  const elements=new Map(['game','start','music','pause','reset','controls','speed','length','width','status'].map(id=>[id,{
    id,style:{},hidden:false,disabled:false,value:{speed:5,length:12,width:24}[id],addEventListener(){},setAttribute(){},textContent:'',onclick:null
  }]));
  const storage={getItem:()=>null,setItem(){}};
  const context=vm.createContext({
    createVector:(x,y)=>new Vector(x,y),p5:{Vector},random:(a,b)=>b===undefined?a/2:(a+b)/2,map:(v,a,b,c,d)=>c+(d-c)*(v-a)/(b-a),
    Math,console,window:{localStorage:storage,AudioContext:FakeAudioContext},document:{hidden:false,addEventListener(){},removeEventListener(){},getElementById:id=>elements.get(id),activeElement:{tagName:'BODY'}},windowWidth:1024,windowHeight:768,width:1024,height:768,
    createCanvas(){return{parent(){}}},resizeCanvas(){},pixelDensity(){},frameRate(){},background(){},push(){},pop(){},fill(){},stroke(){},strokeWeight(){},noFill(){},noStroke(){},
    circle(){},ellipse(){},rect(){},triangle(){},line(){},arc(){},point(){},translate(){},rotate(){},sin:Math.sin,cos:Math.cos,constrain:(v,a,b)=>Math.max(a,Math.min(b,v)),
    frameCount:1,millis:()=>16,deltaTime:16,TWO_PI:Math.PI*2,mouseX:500,mouseY:300,key:'',setTimeout,setInterval:()=>1
  });
  for(const file of ['vehicle.js','arrivalBehaviors.js','SnakeHead.js','AnneauSnake.js','Snake.js','Food.js','TextPixel.js','pixelText.js','gameState.js','libraries/webaudiox.js','GameMusic.js','sketch.js'])
    vm.runInContext(readFileSync(new URL(`../${file}`,import.meta.url),'utf8'),context);
  vm.runInContext('setup(); draw(); globalThis.introWasForming=textFormationStarted&&!introReady; globalThis.startInitiallyDisabled=document.getElementById("start").disabled; introReady=true; syncUI(); startRound(); draw(); key="b"; keyPressed(); globalThis.speedAfterB=settings.speed; key="s"; keyPressed(); globalThis.speedAfterS=settings.speed; key=" "; keyPressed(); draw();',context);
  assert.equal(vm.runInContext('mode',context),'playing'); assert.ok(vm.runInContext('snake.rings.length',context)>=4);
  assert.equal(vm.runInContext('introWasForming',context),true); assert.equal(vm.runInContext('startInitiallyDisabled',context),true);
  assert.equal(vm.runInContext('speedAfterB',context),6); assert.equal(vm.runInContext('speedAfterS',context),5);
  assert.equal(vm.runInContext('snakes.length',context),2); assert.equal(vm.runInContext('music.active',context),true);
});
