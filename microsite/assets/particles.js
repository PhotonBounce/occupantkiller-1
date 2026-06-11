/* Canvas particle system — hero background */
(function(){
  var canvas = document.getElementById('heroCanvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var W,H,particles=[],sparks=[];
  var RAF;

  function resize(){
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  var COLORS = ['#ff4444','#ff6622','#ffcc00','#44aaff','#44ff88'];

  function Particle(){
    this.reset();
  }
  Particle.prototype.reset = function(){
    this.type = Math.random()<.55 ? 'dust' : Math.random()<.5 ? 'bullet' : 'ember';
    if(this.type==='bullet'){
      this.x  = Math.random()*W;
      this.y  = Math.random()*H;
      this.vx = (Math.random()*3+2)*(Math.random()<.5?1:-1);
      this.vy = (Math.random()*.6-.3);
      this.w  = Math.random()*5+3;
      this.h  = 1.5;
      this.alpha = Math.random()*.7+.3;
      this.color = Math.random()<.7?'#fff':'#ffcc88';
      this.life = Math.random()*90+60;
    } else if(this.type==='ember'){
      this.x  = Math.random()*W;
      this.y  = H + 10;
      this.vx = (Math.random()-.5)*1.2;
      this.vy = -(Math.random()*1.5+.5);
      this.r  = Math.random()*2.5+1;
      this.alpha = Math.random()*.8+.2;
      this.color = COLORS[Math.floor(Math.random()*3)];
      this.life = Math.random()*120+80;
    } else {
      this.x  = Math.random()*W;
      this.y  = Math.random()*H;
      this.vx = (Math.random()-.5)*.4;
      this.vy = (Math.random()-.5)*.4;
      this.r  = Math.random()*1.5+.5;
      this.alpha = Math.random()*.35+.1;
      this.color = '#44aaff';
      this.life = Math.random()*200+100;
    }
    this.maxLife = this.life;
  };
  Particle.prototype.update = function(){
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    if(this.life<=0 || this.x<-20 || this.x>W+20 || this.y<-20 || this.y>H+20) this.reset();
  };
  Particle.prototype.draw = function(){
    var a = this.alpha*(this.life/this.maxLife);
    ctx.globalAlpha = Math.max(0,a);
    ctx.fillStyle = this.color;
    if(this.type==='bullet'){
      ctx.save();
      ctx.translate(this.x,this.y);
      ctx.rotate(Math.atan2(this.vy,this.vx));
      ctx.fillRect(-this.w/2,-this.h/2,this.w,this.h);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
      ctx.fill();
    }
  };

  function Spark(x,y){
    this.x=x; this.y=y;
    var angle=Math.random()*Math.PI*2;
    var speed=Math.random()*6+2;
    this.vx=Math.cos(angle)*speed;
    this.vy=Math.sin(angle)*speed;
    this.r=Math.random()*3+1;
    this.color=COLORS[Math.floor(Math.random()*COLORS.length)];
    this.life=Math.random()*30+15;
    this.maxLife=this.life;
  }
  Spark.prototype.update=function(){ this.x+=this.vx; this.y+=this.vy; this.vy+=.15; this.life--; };
  Spark.prototype.draw=function(){
    ctx.globalAlpha=this.life/this.maxLife;
    ctx.fillStyle=this.color;
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.r*(this.life/this.maxLife),0,Math.PI*2);
    ctx.fill();
  };

  /* spawn */
  for(var i=0;i<120;i++) particles.push(new Particle());

  function loop(){
    RAF=requestAnimationFrame(loop);
    ctx.clearRect(0,0,W,H);
    for(var i=0;i<particles.length;i++){ particles[i].update(); particles[i].draw(); }
    sparks=sparks.filter(function(s){ s.update(); s.draw(); return s.life>0; });
    ctx.globalAlpha=1;
  }

  window.addEventListener('resize',resize);
  resize();
  loop();

  /* click explosion on hero */
  canvas.addEventListener('click',function(e){
    var rect=canvas.getBoundingClientRect();
    var mx=e.clientX-rect.left, my=e.clientY-rect.top;
    for(var k=0;k<22;k++) sparks.push(new Spark(mx,my));
  });

  /* expose for cleanup */
  window._particlesStop=function(){ cancelAnimationFrame(RAF); };
})();
