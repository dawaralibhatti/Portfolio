/* Galaxy-to-Earth scroll journey, nav, rocket buddy */
(function () {
  var cv = document.getElementById('galaxy'), ctx = cv.getContext('2d');
  var hero = document.querySelector('.hero'), cap = document.getElementById('cap'), pin = document.getElementById('pin');
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CS = ['rgb(255,228,176)', 'rgb(176,196,255)', 'rgb(150,124,255)', 'rgb(255,150,210)'], ALP = [.22, .4, .62, .9];
  var FL = 0.46, BA = 0.5, ZM = 14, TL = -0.42, MSG = ['Scroll to travel to our solar system', 'The Milky Way, about 100,000 light-years across', 'Zooming in on the Orion Arm, 26,000 light-years from the center', 'Our solar system', 'Earth, our home, and its Moon', ''];
  var PL = [[.1, '#b9b9b9', 2.4, 'Mercury'], [.17, '#e8c98a', 3.8, 'Venus'], [.24, '#5aa2ff', 4.2, 'Earth, home'], [.33, '#e0643c', 3.2, 'Mars'], [.55, '#d9a066', 9, 'Jupiter'], [.7, '#e6d29a', 7, 'Saturn'], [.84, '#8fe3e8', 5, 'Uranus'], [.97, '#5c78ff', 5, 'Neptune']];
  var W, H, dpr, R, cx, cy, small, B, BR, DU, ST, WA = new Float32Array(110), WD = new Float32Array(110), BL, neb, S = {}, SUN0 = [0, 0];
  var EX = 0, EY = 0, SX = 0, SY = 0, EZ = 0, PZ = 0, rE = 0, zE = 1, Ecx = 0, Ecy = 0, gl, glc = document.getElementById('earth'), glP, glU = {}, glState = 0, shoot = null, nextShoot = 4000, mx = 0, my = 0, px = 0, py = 0, scrollT = 0, scrollS = 0, wv = 0, Q = 1, cur = -1, rt;
  function rnd() { return Math.random(); }
  function gauss() { return (rnd() + rnd() + rnd() - 1.5) / 1.5; }
  function sstep(a, b, x) { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
  function spr(sz, stops) {
    var c = document.createElement('canvas'); c.width = c.height = sz;
    var g = c.getContext('2d'), r = g.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, sz / 2);
    stops.forEach(function (s) { r.addColorStop(s[0], s[1]); }); g.fillStyle = r; g.fillRect(0, 0, sz, sz); return c;
  }
  function rotAt(t) { return t * 0.00004 + 2.2 * Math.exp(-t * 0.0009); }
  function make() {
    S.halo = spr(256, [[0, 'rgba(150,120,255,.26)'], [.5, 'rgba(90,80,220,.09)'], [1, 'rgba(90,80,220,0)']]);
    S.core = spr(256, [[0, 'rgba(255,244,215,.95)'], [.08, 'rgba(255,215,150,.55)'], [.35, 'rgba(190,150,255,.14)'], [1, 'rgba(120,100,255,0)']]);
    S.bar = spr(128, [[0, 'rgba(255,214,150,.38)'], [.5, 'rgba(255,190,130,.12)'], [1, 'rgba(255,190,130,0)']]);
    S.sun = spr(256, [[0, 'rgba(255,246,220,1)'], [.15, 'rgba(255,205,120,.6)'], [1, 'rgba(255,150,60,0)']]);
    S.col = ['255,228,176', '176,196,255', '150,124,255', '255,150,210'].map(function (c) { return spr(64, [[0, 'rgba(' + c + ',1)'], [.18, 'rgba(' + c + ',.45)'], [1, 'rgba(' + c + ',0)']]); });
  }
  function nebula() {
    var c = document.createElement('canvas'); c.width = Math.ceil(W / 2); c.height = Math.ceil(H / 2);
    var g = c.getContext('2d'), m = Math.max(c.width, c.height);
    [[.72, .4, .55, '110,70,230', .3], [.2, .78, .5, '30,100,200', .26], [.9, .9, .4, '200,70,170', .16], [.3, .15, .4, '60,60,190', .16]].forEach(function (b) {
      var x = b[0] * c.width, y = b[1] * c.height, r = g.createRadialGradient(x, y, 0, x, y, b[2] * m);
      r.addColorStop(0, 'rgba(' + b[3] + ',' + b[4] + ')'); r.addColorStop(1, 'rgba(' + b[3] + ',0)'); g.fillStyle = r; g.fillRect(0, 0, c.width, c.height);
    });
    return c;
  }
  function build() {
    small = innerWidth < 700; dpr = Math.min(devicePixelRatio || 1, small ? 1.25 : 1.5);
    W = cv.width = Math.round(innerWidth * dpr); H = cv.height = Math.round(innerHeight * dpr);
    glc.width = W; glc.height = H; R = small ? W * .95 : Math.max(W, H) * .4; cx = W * (small ? .5 : .7); cy = H * (small ? .73 : .46);
    var tmp = [], i, r, t, c, a, u, bl, bw, n = small ? 3200 : 7000;
    for (i = 0; i < 16; i++) tmp.push({ x: [], y: [], s: [] }); BR = [];
    function add(r, t, g, sz, o) { var v = o * (1 - r * .55), q = tmp[g * 4 + (v < .18 ? 0 : v < .32 ? 1 : v < .5 ? 2 : 3)]; q.x.push(Math.cos(t) * r * R); q.y.push(Math.sin(t) * r * R); q.s.push(sz * dpr); }
    for (i = 0; i < (small ? 700 : 1500); i++) {
      bl = gauss() * .32; bw = gauss() * .14 * (1 - Math.abs(bl / .32) * .5);
      add(Math.sqrt(bl * bl + bw * bw), Math.atan2(bw, bl) + BA, rnd() < .8 ? 0 : 1, .5 + rnd() * 1.1, .3 + rnd() * .6);
    }
    for (i = 0; i < n; i++) {
      u = rnd(); a = u < .34 ? 0 : u < .68 ? 2 : u < .84 ? 1 : 3;
      if (rnd() < .18) { r = .1 + rnd() * .9; t = rnd() * 6.283; }
      else { r = .22 * Math.pow(4.55, Math.pow(rnd(), 1.3)); t = Math.log(r / .22) * 4.4 + a * Math.PI / 2 + BA + gauss() * (.2 + r * .22); }
      c = r < .3 ? 0 : r < .62 ? 1 : 2; if (rnd() < .1) c = 3; if (r < .4 && rnd() < .45) c = 0;
      add(r, t, c, .5 + rnd() * 1.3, .2 + rnd() * .7);
      if (rnd() < .035) BR.push(Math.cos(t) * r * R, Math.sin(t) * r * R, c);
    }
    for (i = 0; i < (small ? 500 : 1100); i++) { r = Math.abs(gauss()) * .22; add(r, rnd() * 6.283, r < .1 || rnd() < .7 ? 0 : 1, .5 + rnd() * 1.1, .25 + rnd() * .6); }
    B = tmp.map(function (q) { return { n: q.x.length, x: Float32Array.from(q.x), y: Float32Array.from(q.y), s: Float32Array.from(q.s) }; });
    DU = []; for (i = 0; i < (small ? 500 : 1100); i++) { r = .25 * Math.pow(4, rnd()); a = rnd() < .7 ? 0 : 1; t = Math.log(r / .22) * 4.4 + (a ? 1 : 0) * Math.PI + BA - .14 + gauss() * .07; DU.push(Math.cos(t) * r * R, Math.sin(t) * r * R, (2 + rnd() * 3) * dpr); }
    ST = []; for (i = 0; i < (small ? 160 : 320); i++) ST.push({ x: rnd() * W, y: rnd() * H, s: (.4 + rnd() * 1.2) * dpr, p: rnd() * 6.28, v: .4 + rnd() * 1.6, z: .3 + rnd() });
    BL = []; for (i = 0; i < 420; i++) BL.push({ a: rnd() * 6.283, d: .405 + rnd() * .07, s: (.5 + rnd() * .9) * dpr });
    for (i = 0; i < WA.length; i++) { WA[i] = rnd() * 6.283; WD[i] = rnd(); }
    var T0 = Math.log(.62 / .22) * 4.4 + Math.PI / 2 + BA; SUN0 = [Math.cos(T0) * .62 * R, Math.sin(T0) * .62 * R];
    neb = nebula();
  }
  function drawSolar(t, ss) {
    var U = small ? W * .5 : Math.min(W * .5, H * .85), ox = W / 2 + px * 10 * dpr, oy = H / 2 + py * 8 * dpr, ys = .38, tl = -.28, cr = Math.cos(tl), sr = Math.sin(tl), i, d, a, X = [], Y = [], A = [], k, sz;
    if (EZ > 0) { ctx.save(); ctx.transform(zE, 0, 0, zE, Ecx - EX * zE, Ecy - EY * zE); }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = ss;
    ctx.save(); ctx.translate(ox, oy); ctx.rotate(tl); ctx.scale(1, ys); ctx.strokeStyle = 'rgba(190,200,255,.16)'; ctx.lineWidth = dpr;
    for (i = 0; i < PL.length; i++) { ctx.beginPath(); ctx.arc(0, 0, PL[i][0] * U, 0, 6.283); ctx.stroke(); } ctx.restore();
    ctx.fillStyle = '#a8a6b8'; ctx.globalAlpha = ss * .6; ctx.beginPath();
    for (i = 0; i < BL.length; i++) { k = BL[i]; a = k.a + t * .00003 / Math.pow(k.d, 1.5); var x = Math.cos(a) * k.d * U, y = Math.sin(a) * k.d * U * ys; ctx.rect(ox + x * cr - y * sr, oy + x * sr + y * cr, k.s, k.s); } ctx.fill();
    ctx.globalAlpha = ss;
    for (i = 0; i < PL.length; i++) { d = PL[i][0]; a = i * 1.9 + t * .00003 / Math.pow(d, 1.5); var x2 = Math.cos(a) * d * U, y2 = Math.sin(a) * d * U * ys; X[i] = ox + x2 * cr - y2 * sr; Y[i] = oy + x2 * sr + y2 * cr; A[i] = Math.sin(a); }
    function planet(i) {
      var r = PL[i][2] * dpr, dx = ox - X[i], dy = oy - Y[i], l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      if (i === 5) { ctx.strokeStyle = 'rgba(230,210,154,.7)'; ctx.lineWidth = dpr * 1.2; ctx.beginPath(); ctx.ellipse(X[i], Y[i], r * 2, r * .65, tl, Math.PI, 6.283); ctx.stroke(); }
      ctx.fillStyle = PL[i][1]; ctx.beginPath(); ctx.arc(X[i], Y[i], r, 0, 6.283); ctx.fill();
      var g = ctx.createLinearGradient(X[i] + dx * r, Y[i] + dy * r, X[i] - dx * r, Y[i] - dy * r); g.addColorStop(.35, 'rgba(0,0,10,0)'); g.addColorStop(1, 'rgba(0,0,10,.78)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X[i], Y[i], r, 0, 6.283); ctx.fill();
      if (i === 5) { ctx.strokeStyle = 'rgba(230,210,154,.8)'; ctx.beginPath(); ctx.ellipse(X[i], Y[i], r * 2, r * .65, tl, 0, Math.PI); ctx.stroke(); }
      if (i === 2) { ctx.fillStyle = '#cfd0d8'; ctx.beginPath(); ctx.arc(X[i] + Math.cos(t * .004) * 11 * dpr, Y[i] + Math.sin(t * .004) * 5 * dpr, 1.5 * dpr, 0, 6.283); ctx.fill(); }
      if (EZ < .02) { ctx.fillStyle = 'rgba(230,232,250,.8)'; ctx.fillText(PL[i][3], X[i] + (PL[i][2] + 6) * dpr, Y[i] - 6 * dpr); }
    }
    ctx.font = '500 ' + Math.round(12 * dpr) + 'px Bricolage Grotesque, sans-serif';
    for (i = 0; i < PL.length; i++) if (A[i] < 0) planet(i);
    sz = U * .3 * (1 + .04 * Math.sin(t * .002)); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(S.sun, ox - sz / 2, oy - sz / 2, sz, sz);
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#fff4d6'; ctx.beginPath(); ctx.arc(ox, oy, 8 * dpr, 0, 6.283); ctx.fill();
    for (i = 0; i < PL.length; i++) if (A[i] >= 0) planet(i);
    ctx.globalAlpha = 1; if (EZ > 0) ctx.restore();
  }
  var VS = '#version 300 es\nin vec2 a;uniform vec2 uC,uRes;uniform float uR;void main(){vec2 p=uC+a*uR*1.25;gl_Position=vec4(p.x/uRes.x*2.-1.,1.-p.y/uRes.y*2.,0.,1.);}';
  var FS = `#version 300 es
precision highp float;
uniform sampler2D tA,tB,tC,tM;
uniform int uMode; uniform vec2 uC,uRes; uniform float uR,uRot,uCR,uTilt,uAlpha; uniform vec3 uSun;
out vec4 o;
vec3 spin(vec3 n){ float c=cos(uTilt),s=sin(uTilt); n=vec3(n.x,c*n.y+s*n.z,-s*n.y+c*n.z); float cr=cos(uRot),sr=sin(uRot); return vec3(cr*n.x-sr*n.z,n.y,sr*n.x+cr*n.z); }
vec3 tx(sampler2D t,vec3 q,float sh){ float u=atan(q.x,q.z)/6.2831853+.5+sh; float v=.5-asin(clamp(q.y,-1.,1.))/3.1415927;
  vec2 a=vec2(fract(u),v), b=vec2(fract(u+.5),v); bool pa=fwidth(a.x)<fwidth(b.x); vec2 dx=pa?dFdx(a):dFdx(b), dy=pa?dFdy(a):dFdy(b); return textureGrad(t,a,dx,dy).rgb; }
void main(){
  vec2 p=(gl_FragCoord.xy-vec2(uC.x,uRes.y-uC.y))/uR; float r=length(p); vec3 L=normalize(uSun);
  if(r>1.){ if(uMode==1||r>1.18) discard; float g=pow(1.-(r-1.)/.18,3.); float d=.15+.85*smoothstep(-.5,.6,dot(normalize(p),normalize(L.xy)));
    o=vec4(vec3(.35,.6,1.)*g*d*uAlpha*.8,g*d*uAlpha*.5); return; }
  float z=sqrt(max(1.-r*r,0.)); vec3 n=vec3(p,z); float nd=dot(n,L); vec3 q=spin(n); vec3 c;
  if(uMode==1){ c=tx(tM,q,0.)*(.025+1.15*max(nd,0.)); }
  else { vec3 day=tx(tA,q,0.), ni=tx(tB,q,0.); float cl=tx(tC,q,uCR).r; float lit=max(nd,0.), dl=smoothstep(-.1,.18,nd);
    float oc=smoothstep(.05,.2,day.b-max(day.r,day.g)); vec3 H=normalize(L+vec3(0.,0.,1.)); float sp=pow(max(dot(n,H),0.),80.)*oc*(1.-cl);
    c=day*(.03+1.05*lit)+vec3(1.,.95,.85)*sp*.55; c+=ni*vec3(2.4,2.,1.4)*(1.-dl);
    c=mix(c,vec3(.03+lit),cl*.88); c+=vec3(.9,.4,.2)*exp(-pow(nd*7.,2.))*.07;
    c+=vec3(.3,.55,1.)*pow(1.-z,2.6)*(.2+.9*smoothstep(-.25,.4,nd)); }
  float cov=1.-smoothstep(1.-1.5/uR,1.,r); o=vec4(c*cov*uAlpha,cov*uAlpha);
}`;
  function sGeom(t) {
    var U = small ? W * .5 : Math.min(W * .5, H * .85), ox = W / 2 + px * 10 * dpr, oy = H / 2 + py * 8 * dpr, a = 3.8 + t * .00003 / Math.pow(.24, 1.5), x = Math.cos(a) * .24 * U, y = Math.sin(a) * .24 * U * .38;
    EX = ox + x * Math.cos(-.28) - y * Math.sin(-.28); EY = oy + x * Math.sin(-.28) + y * Math.cos(-.28); SX = ox; SY = oy;
  }
  function initGL() {
    glState = 1; gl = glc.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) { glState = -1; return; }
    function sh(type, src) { var h = gl.createShader(type); gl.shaderSource(h, src); gl.compileShader(h); return h; }
    glP = gl.createProgram(); gl.attachShader(glP, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(glP, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(glP);
    if (!gl.getProgramParameter(glP, gl.LINK_STATUS)) { gl = null; glState = -1; return; }
    gl.useProgram(glP);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(glP, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['uC', 'uRes', 'uR', 'uRot', 'uCR', 'uTilt', 'uAlpha', 'uSun', 'uMode', 'tA', 'tB', 'tC', 'tM'].forEach(function (n) { glU[n] = gl.getUniformLocation(glP, n); });
    gl.uniform1i(glU.tA, 0); gl.uniform1i(glU.tB, 1); gl.uniform1i(glU.tC, 2); gl.uniform1i(glU.tM, 3);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    var left = 4, ext = gl.getExtension('EXT_texture_filter_anisotropic');
    ['day', 'night', 'clouds', 'moon'].forEach(function (nm, i) {
      var im = new Image(); im.onload = function () {
        var tx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tx);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
        if (--left === 0) glState = 2;
      }; im.src = TEX[nm];
    });
  }
  function drawEarth(t) {
    if (glState === 0 && scrollS > .45) initGL();
    if (EZ <= .001 || glState !== 2) { if (glc.style.display !== 'none') glc.style.display = 'none'; return; }
    glc.style.display = 'block'; gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.uniform2f(glU.uRes, W, H);
    var dx = SX - EX, dy = SY - EY, l = Math.hypot(dx, dy) || 1; gl.uniform3f(glU.uSun, dx / l * (1 - PZ) + .5 * PZ, -dy / l * (1 - PZ) + .4 * PZ, .35 * (1 - PZ) + .8 * PZ);
    var ma = t * .00025 + .5, rM = rE * .27, dM = Math.min(4 * rE, W * .5 - rM * 1.1), mxp = Ecx + Math.cos(ma) * dM, myp = Ecy + Math.sin(ma) * dM * .3, ea = sstep(.04, .25, EZ), mal = sstep(.3, .7, EZ) * (1 - sstep(0, .35, PZ));
    function body(mode, cx_, cy_, r_, rot, tilt, al) {
      gl.uniform1i(glU.uMode, mode); gl.uniform2f(glU.uC, cx_, cy_); gl.uniform1f(glU.uR, r_); gl.uniform1f(glU.uRot, rot); gl.uniform1f(glU.uTilt, tilt); gl.uniform1f(glU.uAlpha, al); gl.uniform1f(glU.uCR, t * .000012); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    if (Math.sin(ma) < 0 && mal > .001) body(1, mxp, myp, rM, 0, .1, mal);
    var rb = -1.22 + t * .00006, dr = (-1.274 - rb) % 6.283185; if (dr > 3.1416) dr -= 6.283185; if (dr < -3.1416) dr += 6.283185;
    body(0, Ecx, Ecy, rE * Math.pow(5, PZ), rb + dr * PZ, .41 + .175 * PZ, ea * (1 - .4 * PZ));
    if (Math.sin(ma) >= 0 && mal > .001) body(1, mxp, myp, rM, 0, .1, mal);
  }
  function ui(sp, ez, pz) {
    hero.style.opacity = 1 - sstep(.02, .2, sp); pin.style.opacity = sstep(.85, 1, pz); hero.style.transform = small ? 'translateY(' + (-sstep(.02, .2, sp) * innerHeight * .14).toFixed(1) + 'px)' : 'scale(' + (1 + sp * 2.5).toFixed(3) + ')';
    var s = scrollY > scrollM * .86 ? 5 : ez > .5 ? 4 : sp < .1 ? 0 : sp < .45 ? 1 : sp < .72 ? 2 : 3;
    if (s !== cur) { cur = s; cap.style.opacity = 0; clearTimeout(rt); rt = setTimeout(function () { cap.textContent = MSG[s]; cap.style.opacity = 1; }, 300); }
  }
  function draw(t) {
    var prev = scrollS, i, b, q, n, x, y, xr, yr;
    px += (mx - px) * .04; py += (my - py) * .04; scrollS += (scrollT - scrollS) * (still ? 1 : .07);
    wv = still ? 0 : wv + (Math.abs(scrollS - prev) * 40 - wv) * .15;
    var us = Math.min(1, scrollS / .58), ss = sstep(.55, .85, us), ga = 1 - sstep(.3, .62, us), zp = sstep(0, .62, us), z = Math.pow(ZM, zp), zs = Math.pow(z, .8);
    EZ = sstep(0, 1, Math.min(1, Math.max(0, (scrollS - .52) / .32))); PZ = 0; sGeom(t); /* no Pakistan zoom: Earth stays face-on and scrolls away with the page */
    var r0 = 4.2 * dpr, Rt = small ? W * .27 : Math.min(W, H) * .28; rE = r0 * Math.pow(Rt / r0, EZ); zE = rE / r0; Ecx = EX + (W / 2 - EX) * EZ; Ecy = EY + (H / 2 - EY) * EZ - Math.max(0, scrollY - scrollM * .84) * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
    var nz = 1 + zp * .6; ctx.drawImage(neb, (W - W * nz) / 2 - px * 10 * dpr, (H - H * nz) / 2 - py * 8 * dpr, W * nz, H * nz);
    ctx.globalCompositeOperation = 'lighter';
    for (i = 0; i < ST.length; i++) { var s0 = ST[i]; ctx.globalAlpha = .25 + .4 * (.5 + .5 * Math.sin(s0.p + t * .0007 * s0.v)); ctx.fillStyle = i % 7 ? '#dfe6ff' : '#ffe6c8'; ctx.fillRect(s0.x + px * 14 * s0.z * dpr, s0.y + py * 10 * s0.z * dpr, s0.s, s0.s); }
    var wx = W / 2, wy = H / 2;
    if (ga > .005) {
      var gx = cx + px * 26 * dpr, gy = cy + py * 18 * dpr, tilt = TL + px * .04, cr = Math.cos(tilt), sr = Math.sin(tilt), rot = rotAt(t), c = Math.cos(rot), s = Math.sin(rot);
      var sxr = SUN0[0] * c - SUN0[1] * s, syr = (SUN0[0] * s + SUN0[1] * c) * FL, sx = gx + sxr * cr - syr * sr, sy = gy + sxr * sr + syr * cr;
      var Px = (ZM * sx - W / 2) / (ZM - 1), Py = (ZM * sy - H / 2) / (ZM - 1), ph = zp * .7;
      var zx = Px + z * (sx - Px) - W / 2, zy = Py + z * (sy - Py) - H / 2; wx = W / 2 + zx * Math.cos(ph) - zy * Math.sin(ph); wy = H / 2 + zx * Math.sin(ph) + zy * Math.cos(ph);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, W / 2, H / 2); ctx.rotate(ph); ctx.translate(-W / 2, -H / 2); ctx.transform(z, 0, 0, z, Px * (1 - z), Py * (1 - z));
      ctx.save(); ctx.translate(gx, gy); ctx.rotate(tilt); ctx.scale(1, .55); ctx.globalAlpha = ga; ctx.drawImage(S.halo, -R, -R, R * 2, R * 2); ctx.restore();
      for (b = 0; b < 16; b++) {
        q = B[b]; n = (q.n * Q) | 0; ctx.globalAlpha = ALP[b & 3] * ga; ctx.fillStyle = CS[b >> 2]; ctx.beginPath();
        for (i = 0; i < n; i++) { x = q.x[i]; y = q.y[i]; xr = x * c - y * s; yr = (x * s + y * c) * FL; ctx.rect(gx + xr * cr - yr * sr, gy + xr * sr + yr * cr, q.s[i] / zs, q.s[i] / zs); }
        ctx.fill();
      }
      for (i = 0; i < BR.length; i += 3) { x = BR[i]; y = BR[i + 1]; xr = x * c - y * s; yr = (x * s + y * c) * FL; var bs = 14 * dpr / zs; ctx.globalAlpha = .5 * ga; ctx.drawImage(S.col[BR[i + 2]], gx + xr * cr - yr * sr - bs / 2, gy + xr * sr + yr * cr - bs / 2, bs, bs); }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = .3 * ga; ctx.fillStyle = 'rgb(3,4,10)'; ctx.beginPath();
      for (i = 0; i < DU.length; i += 3) { x = DU[i]; y = DU[i + 1]; xr = x * c - y * s; yr = (x * s + y * c) * FL; ctx.rect(gx + xr * cr - yr * sr, gy + xr * sr + yr * cr, DU[i + 2] / zs, DU[i + 2] / zs); }
      ctx.fill(); ctx.globalCompositeOperation = 'lighter';
      var L = R * .36; ctx.save(); ctx.translate(gx, gy); ctx.rotate(tilt); ctx.scale(1, FL); ctx.rotate(BA + rot); ctx.scale(1, .34); ctx.globalAlpha = ga; ctx.drawImage(S.bar, -L, -L, L * 2, L * 2); ctx.restore();
      var cs = R * .55; ctx.globalAlpha = ga; ctx.drawImage(S.core, gx - cs, gy - cs, cs * 2, cs * 2);
      var ms = 26 * dpr / zs, mk = sstep(.005, .08, us), fl = .65 + .35 * Math.sin(t * .02) * Math.sin(t * .013); ctx.globalAlpha = ga * mk * fl; ctx.drawImage(S.col[0], sx - ms / 2, sy - ms / 2, ms, ms);
      ctx.globalAlpha = ga * mk * .8; ctx.strokeStyle = 'rgb(255,230,180)'; ctx.lineWidth = dpr / z; ctx.beginPath(); ctx.arc(sx, sy, ms * (.55 + (1 - mk) * 1.5 + .08 * Math.sin(t * .004)), 0, 6.283); ctx.stroke();
      ctx.restore();
    }
    if (wv > .03) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgb(200,210,255)'; ctx.lineWidth = dpr; ctx.globalAlpha = Math.min(.7, wv * .8); ctx.beginPath();
      var dg = Math.hypot(W, H) * .8, pp = scrollS * 5;
      for (i = 0; i < WA.length; i++) { var u = (WD[i] + pp) % 1, d0 = u * u * dg, d1 = d0 + Math.min(wv, 1.5) * dg * .12 * u, ca = Math.cos(WA[i]), sa = Math.sin(WA[i]); ctx.moveTo(wx + ca * d0, wy + sa * d0); ctx.lineTo(wx + ca * d1, wy + sa * d1); }
      ctx.stroke();
    }
    var sf = ss * (1 - sstep(0, .4, EZ)); if (sf > .001) drawSolar(t, sf);
    drawEarth(t);
    if (!still && ga > .3) {
      if (!shoot && t > nextShoot) { shoot = { x: W * (.45 + rnd() * .5), y: H * rnd() * .35, l: 0 }; nextShoot = t + 7000 + rnd() * 9000; }
      if (shoot) {
        shoot.l += .03; var hx = shoot.x - shoot.l * W * .3, hy = shoot.y + shoot.l * H * .2, sg = ctx.createLinearGradient(hx, hy, hx + W * .07, hy - H * .047);
        sg.addColorStop(0, 'rgba(255,255,255,' + Math.max(1 - shoot.l, 0) + ')'); sg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1; ctx.strokeStyle = sg; ctx.lineWidth = 1.5 * dpr; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + W * .07, hy - H * .047); ctx.stroke();
        if (shoot.l >= 1) shoot = null;
      }
    }
    ui(us, EZ, PZ);
  }
  var last = 0, slow = 0;
  function loop(t) {
    var dt = t - last; last = t; if (dt > 26) slow++; else if (slow > 0) slow--;
    if (slow > 40 && Q > .4) { Q -= .15; slow = 0; }
    if (!covered) draw(t); requestAnimationFrame(loop);
  }
  var siteTop = 0, scrollM = 0, covered = false, galEl = document.getElementById('galaxy');
  function measure() { siteTop = document.querySelector('.site').offsetTop; scrollM = document.querySelector('.scroller').offsetHeight - innerHeight; }
  function setCovered(c) { if (c === covered) return; covered = c; var v = c ? 'hidden' : 'visible'; galEl.style.visibility = v; glc.style.visibility = v; hero.style.visibility = v; pin.style.visibility = v; cap.style.visibility = v; }
  function onScroll() { if (!scrollM) measure(); scrollT = scrollM > 0 ? Math.min(1, scrollY / scrollM) : 0; setCovered(scrollY >= siteTop + innerHeight * .7); if (still && !covered) draw(0); }
  var rz, lw = innerWidth, lh = innerHeight; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (innerWidth === lw && Math.abs(innerHeight - lh) < 200) { measure(); onScroll(); return; } lw = innerWidth; lh = innerHeight; build(); measure(); onScroll(); if (still && !covered) draw(0); }, 150); });
  addEventListener('scroll', onScroll, { passive: true });
  var snapping = false;
  (function () {
    var site = document.querySelector('.site'), items = [].slice.call(site.querySelectorAll('.intro .lead, #about .abtxt, #work .proj, #contact .cta'));
    if (!items.length) return;
    var r = document.createElement('div'); r.className = 'rkt'; r.setAttribute('aria-hidden', 'true');
    r.innerHTML = '<div class="rkr"><div class="rkb"><svg viewBox="0 0 70 100" width="48" height="70"><defs><linearGradient id="agB" x1="0" x2="1"><stop offset="0" stop-color="#9aa3d6"/><stop offset=".35" stop-color="#f4f6ff"/><stop offset=".6" stop-color="#ffffff"/><stop offset="1" stop-color="#8189bb"/></linearGradient><radialGradient id="agV" cx=".3" cy=".25" r=".95"><stop offset="0" stop-color="#ffe9a8"/><stop offset=".45" stop-color="#e0a23a"/><stop offset="1" stop-color="#6b3d0c"/></radialGradient><linearGradient id="agO" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a2e"/><stop offset="1" stop-color="#ff4d1a" stop-opacity="0"/></linearGradient><linearGradient id="agY" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#ff9a2e" stop-opacity="0"/></linearGradient></defs><g class="rkf"><path d="M12 72 Q16 98 20 72Z" fill="url(#agO)"/><path d="M14 72 Q16 90 18 72Z" fill="url(#agY)"/><path d="M50 72 Q54 98 58 72Z" fill="url(#agO)"/><path d="M52 72 Q54 90 56 72Z" fill="url(#agY)"/></g><rect x="8" y="36" width="54" height="34" rx="9" fill="#a9b0d6"/><rect x="11" y="66" width="10" height="7" rx="2" fill="#454a73"/><rect x="49" y="66" width="10" height="7" rx="2" fill="#454a73"/><rect x="22" y="60" width="11" height="24" rx="5.5" fill="url(#agB)"/><rect x="37" y="60" width="11" height="24" rx="5.5" fill="url(#agB)"/><rect x="21" y="80" width="13" height="9" rx="4.5" fill="#6a72a6"/><rect x="36" y="80" width="13" height="9" rx="4.5" fill="#6a72a6"/><rect x="19" y="37" width="32" height="31" rx="12" fill="url(#agB)"/><rect x="28" y="46" width="14" height="10" rx="2.5" fill="#2d3566"/><circle cx="31.5" cy="49.5" r="1.4" fill="#ff5a6e"/><circle cx="35" cy="49.5" r="1.4" fill="#5cf29a"/><circle cx="38.5" cy="49.5" r="1.4" fill="#ffc94d"/><rect x="30" y="52.5" width="10" height="1.6" rx=".8" fill="#6c7bff"/><rect x="8" y="40" width="12" height="25" rx="6" fill="url(#agB)"/><circle cx="14" cy="67" r="5.5" fill="#dfe3f7"/><rect x="9.5" y="44" width="9" height="6" rx="1.5" fill="#01411c"/><circle cx="13" cy="47" r="1.5" fill="#fff"/><g class="rka"><rect x="50" y="40" width="12" height="25" rx="6" fill="url(#agB)"/><circle cx="56" cy="67" r="5.5" fill="#dfe3f7"/></g><rect x="25" y="38" width="20" height="6" rx="3" fill="#aab2de"/><circle cx="14.5" cy="24" r="4" fill="#8f98cf"/><circle cx="55.5" cy="24" r="4" fill="#8f98cf"/><circle cx="35" cy="24" r="20.5" fill="url(#agB)" stroke="#aab2de" stroke-width="1.2"/><ellipse cx="35" cy="25.5" rx="14.5" ry="12.5" fill="url(#agV)" stroke="#5a4a2a" stroke-width="1"/><ellipse cx="29" cy="20.5" rx="5" ry="3" fill="#fff" opacity=".65" transform="rotate(-30 29 20.5)"/><circle cx="41.5" cy="30" r="1.6" fill="#fff" opacity=".35"/><line x1="35" y1="4" x2="35" y2="-1" stroke="#aab2de" stroke-width="1.5"/><circle cx="35" cy="-2" r="2" fill="#ff5a6e"/></svg></div></div>';
    site.appendChild(r);
    var rot = r.querySelector('.rkr'), ang = 0, trailT = 0, cur = -1, px = 0, py = 0, tm = 0, busy = false;
    function target(i) {
      var el = items[i], sr = site.getBoundingClientRect(), b = el.getBoundingClientRect(), dflt = [b.right - sr.left - 62, b.top - sr.top - 50];
      if (innerWidth < 900) return dflt;
      var gut = parseFloat(getComputedStyle(site).paddingRight) || 0, cr = sr.width - gut, cy = (b.top + b.bottom) / 2 - sr.top - 35, x, q, a;
      if (el.classList.contains('lead')) return [cr - 110, cy];
      if (el.classList.contains('abtxt')) { q = site.querySelector('#about .lbl'); if (!q) return dflt; return [q.getBoundingClientRect().left - sr.left + 6, b.top - sr.top + Math.min(b.height * .35, 260)]; }
      if (el.classList.contains('prow')) { a = el.querySelector('.arr'); q = el.querySelector('p'); if (!a || !q) return dflt; x = a.getBoundingClientRect().left - sr.left - 84; return x < q.getBoundingClientRect().right - sr.left + 20 ? dflt : [x, cy]; }
      if (el.classList.contains('cta')) { q = el.querySelector('.copy') || el.querySelector('.mail'); if (!q) return dflt; var mb = q.getBoundingClientRect(); x = mb.right - sr.left + 40; return x + 48 > cr ? dflt : [x, (mb.top + mb.bottom) / 2 - sr.top - 35]; }
      return dflt;
    }
    function go(i, instant) {
      var t = target(i), dx = t[0] - px, dy = t[1] - py; cur = i; px = t[0]; py = t[1];
      if (instant) { r.style.transition = 'none'; r.style.transform = 'translate(' + px + 'px,' + py + 'px) scale(1)'; void r.offsetWidth; r.style.transition = ''; return; }
      r.style.transform = 'translate(' + px + 'px,' + py + 'px) scale(1)';
      if (Math.abs(dx) + Math.abs(dy) < 6) return;
      ang = Math.max(-35, Math.min(35, dx * .08)); rot.style.transform = 'rotate(' + ang + 'deg)'; r.classList.add('fly'); startTrail();
      clearTimeout(tm); tm = setTimeout(function () { ang = 0; rot.style.transform = 'rotate(0deg)'; r.classList.remove('fly'); clearInterval(trailT); startWave(); }, 900);
    }
    function puff() {
      var sr = site.getBoundingClientRect(), b = r.getBoundingClientRect(), a = ang * Math.PI / 180;
      var side = Math.random() < .5 ? -17 : 17, x = b.left + b.width / 2 - sr.left - Math.sin(a) * 30 + side, y = b.top + b.height / 2 - sr.top + Math.cos(a) * 30;
      var p = document.createElement('i'), s = 5 + Math.random() * 7;
      p.className = 'rkp'; p.style.cssText = 'left:' + (x - s / 2) + 'px;top:' + (y - s / 2) + 'px;width:' + s + 'px;height:' + s + 'px;--dx:' + ((Math.random() - .5) * 22) + 'px;--dy:' + ((Math.random() - .5) * 22) + 'px';
      p.addEventListener('animationend', function () { p.remove(); }); site.appendChild(p);
    }
    function startWave() { if (!on || cur !== 0) return; r.classList.add('wave'); setTimeout(function () { r.classList.remove('wave'); }, 1800); }
    function startTrail() { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; clearInterval(trailT); trailT = setInterval(puff, 45); }
    var on = false, navEl = document.querySelector('nav');
    function pillXY() { var sr = site.getBoundingClientRect(), n = navEl.getBoundingClientRect(); return [n.left + n.width / 2 - sr.left - 24, n.top + n.height / 2 - sr.top - 35]; }
    function bestItem() {
      var mid = innerHeight * .5, best = 0, bd = 1e9, i, b, d;
      for (i = 0; i < items.length; i++) { b = items[i].getBoundingClientRect(); d = Math.abs((b.top + b.bottom) / 2 - mid); if (d < bd) { bd = d; best = i; } }
      return best;
    }
    function launch() {
      var p = pillXY(); px = p[0]; py = p[1]; cur = -1;
      r.style.transition = 'none'; r.style.transform = 'translate(' + px + 'px,' + py + 'px) scale(.3)'; void r.offsetWidth; r.style.transition = '';
      r.classList.add('on'); go(bestItem(), false);
    }
    function retreat() {
      var p = pillXY(), dx = p[0] - px, dy = p[1] - py; cur = -1; px = p[0]; py = p[1];
      ang = Math.max(-35, Math.min(35, dx * .08)); rot.style.transform = 'rotate(' + ang + 'deg)'; r.classList.add('fly'); startTrail();
      r.style.transform = 'translate(' + px + 'px,' + py + 'px) scale(.3)'; r.classList.remove('on');
      clearTimeout(tm); tm = setTimeout(function () { ang = 0; rot.style.transform = 'rotate(0deg)'; r.classList.remove('fly'); clearInterval(trailT); }, 900);
    }
    function pick() {
      busy = false;
      if (scrollY < siteTop - innerHeight * .5) { if (on) { on = false; retreat(); } return; }
      if (!on) { on = true; launch(); return; }
      var best = bestItem();
      if (best !== cur) go(best, false);
    }
    addEventListener('scroll', function () { if (!busy) { busy = true; requestAnimationFrame(pick); } }, { passive: true });
    addEventListener('resize', function () { setTimeout(function () { if (on) go(cur < 0 ? 0 : cur, true); }, 200); });
    addEventListener('load', function () { if (on) go(cur < 0 ? 0 : cur, true); });
    go(0, true);
  })();
  (function () {
    var site = document.querySelector('.site');
    var rvs = [].slice.call(site.querySelectorAll('.rv'));
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
      rvs.forEach(function (el) { io.observe(el); });
    } else rvs.forEach(function (el) { el.classList.add('in'); });
    var fmt; try { fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch (e) { fmt = new Intl.DateTimeFormat([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
    var clks = [].slice.call(site.querySelectorAll('.clk'));
    function tick() { if (document.hidden || scrollY < siteTop - innerHeight) return; var t = fmt.format(new Date()); clks.forEach(function (c) { c.textContent = t; }); }
    tick(); setInterval(tick, 1000);
    var gl = 0;
    addEventListener('pointermove', function (e) { if (gl) return; gl = requestAnimationFrame(function () { gl = 0; var sr = site.getBoundingClientRect(); site.style.setProperty('--mx', (e.clientX - sr.left) + 'px'); site.style.setProperty('--my', (e.clientY - sr.top) + 'px'); }); }, { passive: true });
    (function () {
      var root = document.getElementById('pshow'); if (!root) return;
      var slides = [].slice.call(root.querySelectorAll('.pslide')), vis = [].slice.call(root.querySelectorAll('.pvis')), tabs = [].slice.call(root.querySelectorAll('.ptab')), deck = root.querySelector('.pdeck'), n = slides.length, cur = 0, hov = false, foc = false, seen = false;
      var reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
      function offsets() { vis.forEach(function (v, i) { v.setAttribute('data-o', (i - cur + n) % n); }); }
      function paused() { root.classList.toggle('paused', hov || foc || !seen || document.hidden); }
      function go(k, dir) {
        k = (k + n) % n; if (k === cur) return;
        dir = dir || (k > cur ? 1 : -1); root.style.setProperty('--dx', (dir * 44) + 'px');
        var out = slides[cur], inn = slides[k];
        out.classList.remove('on'); out.classList.add('out');
        inn.classList.add('noanim'); inn.classList.remove('out'); void inn.offsetWidth; inn.classList.remove('noanim'); inn.classList.add('on');
        slides.forEach(function (s, i) { s.setAttribute('aria-hidden', i !== k); });
        tabs.forEach(function (t, i) { t.classList.remove('on'); t.setAttribute('aria-selected', i === k); });
        void root.offsetWidth; tabs[k].classList.add('on');
        cur = k; offsets();
      }
      tabs.forEach(function (t, i) { t.addEventListener('click', function () { go(i); }); });
      root.addEventListener('animationend', function (e) { if (e.animationName === 'pfill' && !reduce) go(cur + 1, 1); });
      root.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { go(cur + 1, 1); } else if (e.key === 'ArrowLeft') { go(cur - 1, -1); } });
      root.addEventListener('pointerenter', function () { hov = true; paused(); }); root.addEventListener('pointerleave', function () { hov = false; paused(); });
      root.addEventListener('focusin', function () { foc = true; paused(); }); root.addEventListener('focusout', function () { foc = false; paused(); });
      document.addEventListener('visibilitychange', paused);
      var sx = null; root.addEventListener('pointerdown', function (e) { sx = e.clientX; }); root.addEventListener('pointercancel', function () { sx = null; });
      root.addEventListener('pointerup', function (e) { if (sx === null) return; var d = e.clientX - sx; sx = null; if (Math.abs(d) > 60) go(cur + (d < 0 ? 1 : -1), d < 0 ? 1 : -1); });
      deck.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch' || reduce) return; var r = deck.getBoundingClientRect(); deck.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 10) + 'deg'); deck.style.setProperty('--rx', ((.5 - (e.clientY - r.top) / r.height) * 8) + 'deg'); });
      deck.addEventListener('pointerleave', function () { deck.style.setProperty('--ry', '0deg'); deck.style.setProperty('--rx', '0deg'); });
      slides.forEach(function (s, i) { s.setAttribute('aria-hidden', i !== 0); });
      offsets(); paused();
      if ('IntersectionObserver' in window) { new IntersectionObserver(function (es) { es.forEach(function (e) { seen = e.isIntersecting; paused(); }); }, { threshold: .4 }).observe(root); }
      else { seen = true; paused(); }
    })();
    document.getElementById('toTop').addEventListener('click', function () { scrollTo({ top: 0, behavior: 'smooth' }); });
  })();
  (function () {
    var btn = document.getElementById('journey'), icon = document.getElementById('jIcon'), txt = document.getElementById('jText');
    var playing = false, pos = 0, last = 0, raf = 0, resumeAt = 0;
    function setUI() { icon.innerHTML = playing ? '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.4" fill="currentColor"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.4" fill="currentColor"/></svg>' : '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M8 5.6v12.8a1 1 0 0 0 1.52.85l10.2-6.4a1 1 0 0 0 0-1.7L9.52 4.75A1 1 0 0 0 8 5.6Z" fill="currentColor"/></svg>'; txt.textContent = playing ? 'Pause' : 'Journey'; btn.setAttribute('aria-pressed', playing); }
    function maxY() { var t = document.getElementById('top'); return Math.round(t.getBoundingClientRect().top + scrollY); }
    function stop() { playing = false; cancelAnimationFrame(raf); setUI(); }
    function step(t) {
      if (!playing) return;
      if (snapping) { stop(); return; }
      var dt = Math.min(64, t - last) / 1000; last = t;
      pos += innerHeight * 0.17 * dt;
      var m = maxY();
      if (pos >= m) { scrollTo(0, m); stop(); return; }
      scrollTo(0, pos);
      raf = requestAnimationFrame(step);
    }
    function start() {
      if (maxY() - scrollY < 4) { scrollTo(0, 0); }
      pos = scrollY; playing = true; last = performance.now(); setUI(); raf = requestAnimationFrame(step);
    }
    btn.addEventListener('click', function () { playing ? stop() : start(); });
    ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { addEventListener(ev, function (e) { if (playing && !(e.type === 'keydown' && e.target === btn)) stop(); }, { passive: true }); });
    var fadeEl = document.getElementById('fade'), fadeT = 0, fadeOff = 0, rm = matchMedia('(prefers-reduced-motion:reduce)').matches;
    function goTo(y) {
      if (rm) { scrollTo(0, y); return; }
      clearTimeout(fadeT); clearTimeout(fadeOff); fadeEl.style.display = 'block'; void fadeEl.offsetWidth; fadeEl.style.opacity = 1;
      fadeT = setTimeout(function () { scrollTo(0, y); requestAnimationFrame(function () { requestAnimationFrame(function () { fadeEl.style.opacity = 0; clearTimeout(fadeOff); fadeOff = setTimeout(function () { fadeEl.style.display = 'none'; }, 450); }); }); }, 400);
    }
    document.getElementById('brand').addEventListener('click', function (e) { e.preventDefault(); stop(); goTo(0); });
    [].slice.call(document.querySelectorAll('nav a.navlink')).forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); stop(); var el = document.getElementById(a.getAttribute('href').slice(1)); if (el) goTo(Math.round(el.getBoundingClientRect().top + scrollY)); });
    });
  })();
  addEventListener('pointermove', function (e) { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  make(); build(); onScroll();
  if (still) draw(0); else requestAnimationFrame(loop);
})();
  (function () {
    var el = document.getElementById('nowT'); if (!el) return;
    var lines = ['That’s cool', 'We learnt something about our galaxy', 'Now that we are home', 'Here’s my intro'], li = 0, started = false;
    if (matchMedia('(prefers-reduced-motion:reduce)').matches || !('IntersectionObserver' in window)) return;
    el.textContent = '';
    function type(txt, done) { var i = 0; (function t() { el.textContent = txt.slice(0, ++i); if (i < txt.length) setTimeout(t, 48); else done(); })(); }
    function erase(done) { (function e() { var n = el.textContent.length - 1; el.textContent = el.textContent.slice(0, Math.max(0, n)); if (n > 0) setTimeout(e, 18); else done(); })(); }
    function next() { type(lines[li], function () { if (li === lines.length - 1) return; setTimeout(function () { erase(function () { li++; setTimeout(next, 220); }); }, 1100); }); }
    new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting && !started) { started = true; o.disconnect(); setTimeout(next, 350); } }); }, { threshold: .6 }).observe(el.parentNode);
  })();

/* Nav pill hides on scroll down, returns on scroll up */
(function () {
  var nav = document.querySelector('nav'), last = scrollY, hidden = false, force = null, ft;
  if (!nav) return;
  function set(h) { if (h !== hidden) { hidden = h; nav.classList.toggle('hide', h); } }
  function lock(mode) { force = mode; set(mode === 'hide'); clearTimeout(ft); ft = setTimeout(function () { force = null; last = scrollY; }, 700); }
  nav.addEventListener('animationend', function () { nav.style.animation = 'none'; });
  /* dawar.dev / Intro / About / Work / Contact: pill stays visible while the page scrolls there */
  [].forEach.call(nav.querySelectorAll('a.navlink, a.brand'), function (a) { a.addEventListener('click', function () { lock('show'); }, true); });
  /* Journey: pill hides */
  [].forEach.call(nav.querySelectorAll('#journey'), function (el) { el.addEventListener('click', function () { lock('hide'); }, true); });
  addEventListener('scroll', function () {
    if (force) { set(force === 'hide'); clearTimeout(ft); ft = setTimeout(function () { force = null; last = scrollY; }, 700); return; }
    var y = Math.max(0, scrollY), d = y - last;
    if (Math.abs(d) < 6) return;
    set(d > 0 && y > 60);
    last = y;
  }, { passive: true });
})();
