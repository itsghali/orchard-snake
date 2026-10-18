let snake, snakes = [], fruits = [], labels = {}, mode = 'ready', score = 0, best = 0, remaining = 60;
let arena, buttons = {}, controls, pointer, settings = { speed: 5, length: 12, width: 24 };
let textFormationStarted = false, introReady = false, introStartedAt = 0, music;
let activeLabelIds = new Set();
let textPointer = null;
const INTRO_MIN_FORMATION_MS = 500;

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight); canvas.parent('game'); pixelDensity(1); frameRate(60);
  best = OrchardRules.readBest(window.localStorage); controls = document.getElementById('controls'); music = new GameMusic();
  for (const name of ['speed','length','width']) document.getElementById(name).addEventListener('input', e => {
    settings[name] = Number(e.target.value); for(const current of snakes) current.configure(settings);
  });
  document.getElementById('start').onclick = startRound;
  document.getElementById('music').onclick = toggleMusic;
  document.getElementById('pause').onclick = togglePause;
  document.getElementById('reset').onclick = resetRound;
  layout(); resetRound();
}
function layout() {
  const compact = width < 700;
  arena = { x: 22, y: 115, w: width - 44, h: Math.max(160, height - (compact ? 340 : 260)) };
  controls.style.top = `${arena.y + arena.h + 68}px`;
  buttons = { start:{x:width/2-110,y:arena.y+arena.h/2+32,w:220,h:60}, music:{x:width-242,y:30,w:64,h:40}, pause:{x:width-166,y:30,w:64,h:40}, reset:{x:width-90,y:30,w:64,h:40} };
  for (const [id,b] of Object.entries(buttons)) Object.assign(document.getElementById(id).style,{left:`${b.x}px`,top:`${b.y}px`,width:`${b.w}px`,height:`${b.h}px`});
  pointer = createVector(width/2, arena.y + arena.h/2); labels = {};
}
function refill() {
  while (fruits.length < 9) { const p = OrchardRules.spawn(arena, snake.head); fruits.push(new Food(p.x,p.y,Math.floor(random(4)),random(TWO_PI))); }
}
function resetRound() {
  mode='ready'; score=0; remaining=OrchardRules.duration; textFormationStarted=true; introReady=false; introStartedAt=millis();
  snake=new Snake(width/2,arena.y+arena.h/2,settings); snakes=[snake]; fruits=[]; refill(); syncUI();
}
function startRound() {
  if(mode==='ready'&&!introReady) return;
  if(mode==='over') { resetRound(); introReady=true; }
  if(mode==='ready') { mode='playing'; music.start(); syncUI(); }
}
function togglePause() { if(mode==='playing') mode='paused'; else if(mode==='paused') mode='playing'; syncUI(); }
function toggleMusic() { const active=music.toggle(); document.getElementById('music').setAttribute('aria-label',active?'Mute music':'Play music'); }
function syncUI() {
  document.getElementById('start').hidden = !['ready','over'].includes(mode);
  document.getElementById('start').disabled = mode==='ready'&&!introReady;
  document.getElementById('pause').disabled = !['playing','paused'].includes(mode);
  document.getElementById('pause').setAttribute('aria-label',mode==='paused'?'Resume game':'Pause game');
  const introStatus=mode==='ready'&&!introReady?' Text is forming.':'';
  document.getElementById('status').textContent=`${mode}.${introStatus} Score ${score}. Best ${best}. Speed ${settings.speed}. Snakes ${snakes.length}. ${Math.ceil(remaining)} seconds left.`;
}
function label(id,text,x,y,scale=2,color) { activeLabelIds.add(id); PixelText.set(labels,id,text,x,y,scale,color,textFormationStarted,{x:0,y:0,w:width,h:height},textPointer); }
function centered(id,text,y,scale,color) { label(id,text,(width-(text.length*6-1)*scale)/2,y,scale,color); }
function draw() {
  activeLabelIds.clear();
  background('#0c1918'); noStroke(); fill('#112522'); rect(arena.x,arena.y,arena.w,arena.h,20);
  stroke('#203a31'); strokeWeight(1); for(let x=arena.x+24;x<arena.x+arena.w;x+=32) for(let y=arena.y+24;y<arena.y+arena.h;y+=32) point(x,y);
  noFill(); stroke('#345747'); rect(arena.x,arena.y,arena.w,arena.h,20);
  label('brand','ORCHARD',24,30,width<700?3:4,'#bafd72');
  const statScale=width<700?1.3:2;
  label('score',`SCORE ${String(score).padStart(3,'0')}`,width*.36,30,statScale,'#f0f5de');
  label('best',`BEST ${String(best).padStart(3,'0')}`,width*.36,56,statScale,'#9cb3a3'); label('time',`${Math.ceil(remaining)}S`,width-225,43,2,'#ffc37e');
  for(const id of ['music','pause','reset']) { const b=buttons[id]; noStroke(); fill('#213c32'); rect(b.x,b.y,b.w,b.h,10); const text=id==='music'?(music.active?'MUTE':'MUSIC'):id==='pause'?(mode==='paused'?'PLAY':'HOLD'):'RESET'; label(id,text,b.x+7,b.y+14,1.35,'#d2e7c8'); }
  if(mode==='playing') {
    remaining=Math.max(0,remaining-Math.min(deltaTime,100)/1000); for(const current of snakes) current.step(pointer,fruits); for(const fruit of fruits) fruit.step(nearestHead(fruit));
    const gained=snakes.reduce((total,current)=>total+OrchardRules.collect(current.head,fruits),0);
    if(gained) { score+=gained; best=OrchardRules.saveBest(window.localStorage,score,best); settings.length=Math.min(80,settings.length+Math.floor(gained/10)); document.getElementById('length').value=settings.length; for(const current of snakes) current.configure(settings); fruits=fruits.filter(f=>!f.eaten); refill(); syncUI(); }
    if(remaining===0) { mode='over'; syncUI(); }
  }
  for(const fruit of fruits) fruit.show(); for(const current of snakes) current.show();
  if(mode==='playing') { noFill(); stroke('#bafd72'); strokeWeight(1); circle(pointer.x,pointer.y,17); line(pointer.x-13,pointer.y,pointer.x-7,pointer.y); line(pointer.x+7,pointer.y,pointer.x+13,pointer.y); }
  else {
    noStroke(); fill(12,25,24,225); rect(arena.x+1,arena.y+1,arena.w-2,arena.h-2,20);
    const title=mode==='ready'?'FOLLOW YOUR APPETITE':mode==='over'?'HARVEST COMPLETE':'PAUSED';
    centered('title',title,arena.y+arena.h/2-85,Math.min(4,(arena.w-32)/(title.length*6)),'#bafd72');
    centered('hint',mode==='over'?`YOU COLLECTED ${score} POINTS`:'MOVE MOUSE. GATHER FRUIT.',arena.y+arena.h/2-28,Math.min(1.8,(arena.w-24)/144),'#c8d6b9');
    if(mode!=='paused') { const b=buttons.start; fill(introReady||mode==='over'?'#bafd72':'#54725a'); rect(b.x,b.y,b.w,b.h,14); centered('start',mode==='over'?'PLAY AGAIN':'START',b.y+19,3,'#18372c'); }
    else centered('resume','PRESS SPACE TO RESUME',arena.y+arena.h/2+50,1.7,'#e6edda');
  }
  const base=arena.y+arena.h; label('settings','TUNE YOUR SNAKE',24,base+24,1.6,'#91b69b'); const compact=width<700;
  ['speed','length','width'].forEach((name,i)=>{ const x=compact?24:24+i*(width-48)/3,y=base+50+(compact?i*44:0); label(name,`${name.toUpperCase()} ${settings[name]}`,x,y,1.7,'#edf1d8'); });
  centered('footer',`SPACE NEW SNAKE - B SPEED UP - S SLOW DOWN - ${snakes.length} SNAKES`,height-24,Math.min(1.25,(width-30)/354),'#729784');
  if(mode==='ready'&&!introReady&&millis()-introStartedAt>=INTRO_MIN_FORMATION_MS&&PixelText.isFormed(labels,activeLabelIds)) { introReady=true; syncUI(); }
}
function nearestHead(fruit){ return snakes.reduce((bestSnake,current)=>p5.Vector.dist(current.head.pos,fruit.pos)<p5.Vector.dist(bestSnake.head.pos,fruit.pos)?current:bestSnake,snakes[0]).head; }
function addSnake(){
  if(mode!=='playing'||snakes.length>=8) return;
  const x=random(arena.x+45,arena.x+arena.w-45),y=random(arena.y+45,arena.y+arena.h-45);
  snakes.push(new Snake(x,y,settings)); syncUI();
}
function increaseSpeed(){
  if(mode!=='playing') return;
  settings.speed=Math.min(12,settings.speed+1); document.getElementById('speed').value=settings.speed;
  for(const current of snakes) current.configure(settings); syncUI();
}
function decreaseSpeed(){
  if(mode!=='playing') return;
  settings.speed=Math.max(1,settings.speed-1); document.getElementById('speed').value=settings.speed;
  for(const current of snakes) current.configure(settings); syncUI();
}
function mouseMoved(){
  if(pointer) pointer.set(constrain(mouseX,arena.x+20,arena.x+arena.w-20),constrain(mouseY,arena.y+20,arena.y+arena.h-20));
  if(!textPointer) textPointer=createVector(mouseX,mouseY); else textPointer.set(mouseX,mouseY);
}
function mouseDragged(){ mouseMoved(); }
function touchMoved(){ mouseMoved(); return false; }
function keyPressed(){
  if(['INPUT','BUTTON'].includes(document.activeElement.tagName)) return;
  if(key==='b'||key==='B') increaseSpeed();
  if(key==='s'||key==='S') decreaseSpeed();
  if(key===' '){ addSnake(); return false; }
  if(key==='m'||key==='M') toggleMusic();
}
function windowResized(){ resizeCanvas(windowWidth,windowHeight); layout(); }
