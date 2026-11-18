(() => {
'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const menu=document.getElementById('menu'),hud=document.getElementById('hud'),over=document.getElementById('over'),touch=document.getElementById('touch');
let W,H,dpr=1,started=false,won=false,last=0,shake=0,time=0;
const keys={},mouse={x:0,y:0,down:false};
let player,enemies=[],bullets=[],particles=[],props=[],score=0,ammo=15,reserve=60,reloading=false,wave=1,waveTime=0;
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}addEventListener('resize',resize);resize();
function reset(){player={x:0,y:180,angle:0,hp:100,radius:15,inv:0,walk:0};enemies=[];bullets=[];particles=[];score=0;ammo=15;reserve=60;reloading=false;wave=1;waveTime=0;won=false;shake=0;time=0;props=[];
  // village perimeter and scenery
  props=[{type:'house',x:-520,y:-240,w:300,h:230},{type:'house',x:390,y:-280,w:300,h:220},{type:'house',x:-560,y:330,w:260,h:170},{type:'house',x:520,y:300,w:260,h:180},{type:'tower',x:100,y:-420,w:110,h:110},{type:'well',x:-130,y:-30,r:46},{type:'cart',x:260,y:180,r:32},{type:'fire',x:-300,y:-120,r:28}];
  for(let i=0;i<13;i++)props.push({type:i%3?'crate':'hay',x:(i*173%900)-450,y:(i*229%650)-310,r:18+(i%3)*3});
  for(let i=0;i<5;i++)spawnWave(i);updateHUD();
}
function spawnWave(extra=0){const count=5+wave*2+(extra>0?1:0);for(let i=0;i<count;i++){let a=Math.random()*Math.PI*2,r=520+Math.random()*180;enemies.push({x:Math.cos(a)*r,y:Math.sin(a)*r,hp:wave>2&&i%4===0?3:2,max:wave>2&&i%4===0?3:2,radius:13,speed:.55+Math.random*.28+wave*.05,hit:0,attack:0,kind:i%7===0?'chainsaw':'villager',rot:a})}}
function start(){reset();started=true;menu.style.display='none';over.style.display='none';hud.style.display='block';touch.style.display='';last=performance.now();requestAnimationFrame(loop)}
document.getElementById('start').onclick=start;document.getElementById('again').onclick=start;
document.getElementById('how').onclick=()=>toast('WASD move • Mouse aim/fire • R reload • Survive 3 waves',4000);
addEventListener('keydown',e=>{keys[e.key.toLower] = true;if(e.key.toLowerCase()==='r')reload()});addEventListener('keyup',e=>keys[e.key.toLower]=false);
canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top});canvas.addEventListener('mousedown',()=>mouse.down=true);addEventListener('mouseup',()=>mouse.down=false);canvas.addEventListener('contextmenu',e=>e.preventContextMenu);
function reload(){if(reloading||ammo===15||reserve<=0)return;reloading=true;toast('RELOADING...',1000);setTimeout(()=>{const n=Math.min(15-ammo,reserve);ammo+=n;reserve-=n;reloading=false;updateHUD()},900)}
function toast(t,d=1200){const el=document.getElementById('toast');el.textContent=t;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),d)}
function updateHUD(){document.getElementById('ammo').textContent=ammo;document.getElementById('reserve').textContent=reserve;document.getElementById('health').style.width=Math.max(0,player?.hp||0)+'%';document.getElementById('health').className='health'+((player?.hp||0)<35?' caution':'');document.getElementById('objective').textContent=wave>=4?'Village cleared':`Wave ${wave} — ${enemies.length} hostile${enemies.length===1?'':'s'}`}
function cam(){return{x:W/2-player.x,y:H/2-player.y}}
function worldMouse(){const c=cam();return{x:mouse.x-c.x,y:mouse.y-c.y}}
function shoot(){if(!started||reloading)return;if(ammo<=0){reload();return}ammo--;updateHUD();const sx=player.x+Math.cos(player.angle)*22,sy=player.y+Math.sin(player.angle)*22;bullets.push({x:sx,y:sy,vx:Math.cos(player.angle)*12,vy:Math.sin(player.angle)*12,life:55});shake=4;
}
function collideProp(nx,ny,r=14){for(const p of props){if(p.type==='house'||p.type==='tower'){if(nx+r>p.x&&nx-r<p.x+p.w&&ny+r>p.y&&ny-r<p.y+p.h)return true}}
  for(const p of props){if(p.type==='crate'||p.type==='hay'||p.type==='cart'){const pr=p.r||18;if(Math.hypot(nx-p.x,ny-p.y)<r+pr)return true}}return false}
function loop(now){if(!started)return;const dt=Math.min(2,(now-last)/16.67||1);last=now;update(dt);draw();requestAnimationFrame(loop)}
function update(dt){time+=dt;player.inv=Math.max(0,player.inv-dt);const ang=player.angle;let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);if(touchJoy.active){dx=touchJoy.dx;dy=touchJoy.dy}let len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;if(dx||dy){const sp=3.15*dt,nx=player.x+dx*sp,ny=player.y+dy*sp;if(!collideProp(nx,player.y))player.x=nx;if(!collideProp(player.x,ny))player.y=ny;player.walk+=.18*dt}
  const wm=worldMouse();player.angle=Math.atan2(wm.y-player.y,wm.x-player.x);if(mouse.down&&time%5<dt)shoot();shake*=.82;
  for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(collideProp(b.x,b.y,2))b.life=0;for(let j=enemies.length-1;j>=0;j--){const e=enemies[j];if(Math.hypot(e.x-b.x,e.y-b.y)<e.radius){e.hp--;e.hit=7;particlesBurst(b.x,b.y,'#831811',5);b.life=0;if(e.hp<=0){score+=e.kind==='chainsaw'?250:100;particlesBurst(e.x,e.y,'#5b120e',14);enemies.splice(j,1)}}}if(b.life<=0)bullets.splice(i,1)}
  for(const e of enemies){const a=Math.atan2(player.y-e.y,player.x-e.x);e.rot=a;e.hit=Math.max(0,e.hit-dt);const d=Math.hypot(player.x-e.x,player.y-e.y);if(d>e.radius+18){const nx=e.x+Math.cos(a)*e.speed*dt,ny=e.y+Math.sin(a)*e.speed*dt;if(!collideProp(nx,ny,e.radius)){e.x=nx;e.y=ny}}else if(e.attack<=0&&player.inv<=0){player.hp-=e.kind==='chainsaw'?22:10;player.inv=35;e.attack=55;shake=10;particlesBurst(player.x,player.y,'#b72b22',8);updateHUD();if(player.hp<=0)return end(false)}}for(const e of enemies)e.attack=Math.max(0,(e.attack||0)-dt);
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.vx*=.96;p.vy*=.96;if(p.life<=0)particles.splice(i,1)}
  if(enemies.length===0){waveTime+=dt;if(waveTime>100){if(wave>=3)return end(true);wave++;waveTime=0;reserve=Math.min(120,reserve+30);spawnWave();toast(`WAVE ${wave}`,1300);updateHUD()}}
  if(score>0&&!reloading&&ammo===0&&reserve===0&&enemies.length===0)return;
  updateHUD();
}
function particlesBurst(x,y,c,n){for(let i=0;i<n;i++){let a=Math.random()*6.28,r=Math.random()*3;particles.push({x,y,vx:Math.cos(a)*r,vy:Math.sin(a)*r,life:20+Math.random()*20,c})}}
function end(win){started=false;won=win;hud.style.display='none';touch.style.display='none';over.style.display='flex';document.getElementById('endtitle').textContent=win?'VILLAGE CLEARED':'YOU ARE DEAD';document.getElementById('endtext').textContent=win?`You survived all three waves with ${player.hp} vitality.`:'The village claims another victim.'}
function draw(){ctx.save();ctx.clearRect(0,0,W,H);let sx=(Math.random-.5)*shake,sy=(Math.random-.5)*shake;ctx.translate(W/2-player.x+sx,H/2-player.y+sy);
  // ground
  ctx.fillStyle='#1a2418';ctx.fillRect(-850,-650,1700,1300);ctx.fillStyle='#263021';for(let x=-800;x<800;x+=80)for(let y=-600;y<700;y+=80){if((x+y)%160===0){ctx.beginPath();ctx.arc(x,y,35+((x*7+y)%30),0,7);ctx.fill()}}ctx.strokeStyle='rgba(120,125,92,.12)';ctx.lineWidth=2;for(let i=-800;i<800;i+=95){ctx.beginPath();ctx.moveTo(i,-600);ctx.lineTo(i+100,700);ctx.stroke()}
  // village road
  ctx.fillStyle='#5a5844';ctx.beginPath();ctx.ellipse(0,120,220,520,Math.PI/2,0,7);ctx.fill();ctx.fillStyle='#706c54';ctx.globalAlpha=.38;for(let i=-450;i<500;i+=38){ctx.beginPath();ctx.arc((i*17)%150,i*.4+100,9+((i*3)%13),0,7);ctx.fill()}ctx.globalAlpha=1;
  // props sorted loosely
  const all=[...props,...enemies.map(e=>({...e,type:'enemy'})),{...player,type:'player'}].sort((a,b)=>a.y-b.y);for(const o of all){if(o.type==='house')drawHouse(o);else if(o.type==='tower')drawTower(o);else if(o.type==='well')drawWell(o);else if(o.type==='cart')drawCart(o);else if(o.type==='fire')drawFire(o);else if(o.type==='crate')drawCrate(o);else if(o.type==='hay')drawHay(o);else if(o.type==='enemy')drawEnemy(o);else if(o.type==='player')drawPlayer()}
  ctx.fillStyle='#ddd';for(const b of bullets){ctx.beginPath();ctx.arc(b.x,b.y,2,0,7);ctx.fill()}for(const p of particles){ctx.globalAlpha=Math.min(1,p.life/15);ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,3,3)}ctx.globalAlpha=1;
  ctx.restore();
  // vignette
  const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H*.35)*.2,W/2,H/2,Math.max(W,H*.65));g.addColorStop(.55,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.72)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)
}
function drawHouse(p){ctx.fillStyle='#4a3a27';ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle='#2b3024';ctx.fillRect(p.x-12,p.y-18,p.w+24,30);ctx.fillStyle='#33291f';ctx.fillRect(p.x+p.w*.12,p.y+p.h*.35,34,55);ctx.fillStyle='#17150f';ctx.fillRect(p.x+p.w*.14,p.y+p.h*.4,30,48);ctx.fillStyle='#9c7a3c';ctx.fillRect(p.x+p.w*.72,p.y+p.h*.18,46,38);ctx.fillStyle='#151712';ctx.fillRect(p.x+p.w*.73,p.y+p.h*.19,44,36);ctx.strokeStyle='#795a32';ctx.lineWidth=4;ctx.strokeRect(p.x+p.w*.73,p.y+p.h*.19,44,36)}
function drawTower(p){ctx.fillStyle='#4b4636';ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle='#292d24';ctx.beginPath();ctx.moveTo(p.x-15,p.y);ctx.lineTo(p.x+p.w/2,p.y-55);ctx.lineTo(p.x+p.w+15,p.y);ctx.closePath();ctx.fill();ctx.fillStyle='#151712';ctx.fillRect(p.x+35,p.y+30,40,70)}
function drawWell(p){ctx.fillStyle='#777667';ctx.beginPath();ctx.ellipse(p.x,p.y,p.r,p.r*.7,0,0,7);ctx.fill();ctx.fillStyle='#171912';ctx.beginPath();ctx.ellipse(p.x,p.y,p.r*.72,p.r*.42,0,0,7);ctx.fill();ctx.fillStyle='#4b493b';ctx.fillRect(p.x-p.r*.8,p.y-p.r*.8,8,p.r*.7);ctx.fillRect(p.x+p.r*.72,p.y-p.r*.8,8,p.r*.7)}
function drawCart(p){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(.15);ctx.fillStyle='#5b4328';ctx.fillRect(-28,-15,56,30);ctx.fillStyle='#261e15';ctx.beginPath();ctx.arc(-22,20,11,0,7);ctx.arc(22,20,11,0,7);ctx.fill();ctx.restore()}
function drawCrate(p){ctx.fillStyle='#644628';ctx.fillRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2);ctx.strokeStyle='#3b2818';ctx.lineWidth=3;ctx.strokeRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2);ctx.beginPath();ctx.moveTo(p.x-p.r,p.y-p.r);ctx.lineTo(p.x+p.r,p.y+p.r);ctx.moveTo(p.x+p.r,p.y-p.r);ctx.lineTo(p.x-p.r,p.y+p.r);ctx.stroke()}
function drawHay(p){ctx.fillStyle='#9b7a38';ctx.fillRect(p.x-p.r,p.y-p.r*.7,p.r*2,p.r*1.4)}
function drawFire(p){ctx.fillStyle='#8a5a24';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();ctx.fillStyle='#c46a23';ctx.beginPath();ctx.moveTo(p.x-p.r*.7,p.y);ctx.quadraticCurveTo(p.x,p.y-p.r*1.6,p.x+p.r*.7,p.y);ctx.fill();ctx.fillStyle='#edc35a';ctx.beginPath();ctx.moveTo(p.x-p.r*.25,p.y);ctx.quadraticCurveTo(p.x,p.y-p.r,p.x+p.r*.25,p.y);ctx.fill()}
function drawEnemy(e){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.rot);ctx.fillStyle=e.hit?'#d4b0a0':'#6d7154';ctx.beginPath();ctx.ellipse(0,4,14,18,0,0,7);ctx.fill();ctx.fillStyle=e.kind==='chainsaw'?'#412722':'#7c5743';ctx.beginPath();ctx.arc(0,-10,10,0,7);ctx.fill();ctx.fillStyle='#171a14';ctx.fillRect(-16,-2,32,7);ctx.fillStyle=e.kind==='chainsaw'?'#9d9b8c':'#5a5a47';ctx.fillRect(5,-3,24,5);ctx.restore();if(e.hit){ctx.fillStyle='#8a1812';ctx.fillRect(e.x-e.radius,e.y-e.radius-8,e.radius*2*(e.hp/e.max),3)}}
function drawPlayer(){ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.angle);ctx.fillStyle='#7d6a50';ctx.beginPath();ctx.ellipse(0,5,14,17,0,0,7);ctx.fill();ctx.fillStyle='#b7b0a0';ctx.beginPath();ctx.arc(0,-8,9,0,7);ctx.fill();ctx.fillStyle='#262820';ctx.fillRect(-7,-16,14,7);ctx.fillStyle='#1a1c18';ctx.fillRect(-10,10,7,16);ctx.fillRect(4,10,7,16);ctx.fillStyle='#d0c9af';ctx.fillRect(8,-2,29,6);ctx.fillStyle='#252821';ctx.fillRect(26,-4,18,10);ctx.restore()}

// touch controls
const stick=document.getElementById('stick');const touchJoy={active:false,id:null,dx:0,dy:0};stick.addEventListener('pointerdown',e=>{touchJoy.active=true;touchJoy.id=e.pointerId;stick.setPointerCapture(e.pointerId)});stick.addEventListener('pointermove',e=>{if(!touchJoy.active)return;const r=stick.getBoundingClientRect(),x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2),m=Math.hypot(x,y)||1;touchJoy.dx=Math.max(-1,Math.min(1,x/55));touchJoy.dy=Math.max(-1,Math.min(1,y/55))});addEventListener('pointerup',()=>{touchJoy.active=false;touchJoy.dx=touchJoy.dy=0});
document.getElementById('fire').onpointerdown=()=>mouse.down=true;document.getElementById('fire').onpointerup=()=>mouse.down=false;document.getElementById('reload').onclick=reload;
// Camera follows pointer by default on touch: fire toward nearest enemy
setInterval(()=>{if(started&&matchMedia('(pointer:coarse)').matches&&mouse.x===0){let best=null,bd=9999;for(const e of enemies){let d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd){bd=d;best=e}}if(best){player.angle=Math.atan2(best.y-player.y,best.x-player.x);const c=cam();mouse.x=best.x-c.x;mouse.y=best.y-c.y}}},100);
draw();
})();