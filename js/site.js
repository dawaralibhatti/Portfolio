/* Altitude rail and the copy-email button */
(function () {
  var rail = document.getElementById('alt'), out = document.getElementById('altNow');
  if (!rail || !out) return;
  var ids = ['top', 'about', 'work', 'contact'], heights = [100000, 32000, 11000, 508];
  var els = ids.map(function (id) { return document.getElementById(id); });
  var ticks = [].slice.call(rail.querySelectorAll('.tick')), mark = rail.querySelector('.now-alt');
  var horizon = document.querySelector('.l-horizon');
  var tops = [], hz = 0, H = 0, busy = false, lastText = '';

  function docTop(el) { return el.getBoundingClientRect().top + scrollY; }
  function measure() {
    tops = els.map(docTop); hz = horizon ? docTop(horizon) + horizon.offsetHeight * .45 : tops[3];
    H = rail.clientHeight;
    ticks.forEach(function (t, i) { t.style.top = place(tops[i]) + 'px'; });
  }
  function place(y) { var a = tops[0], b = tops[3]; return Math.max(0, Math.min(1, (y - a) / (b - a))) * H; }
  function altitudeAt(y) {
    if (y <= tops[0]) return heights[0];
    for (var i = 0; i < 3; i++) {
      if (y < tops[i + 1]) {
        var f = (y - tops[i]) / (tops[i + 1] - tops[i]);
        return Math.exp(Math.log(heights[i]) + (Math.log(heights[i + 1]) - Math.log(heights[i])) * f);
      }
    }
    return heights[3];
  }
  function fmt(m) {
    if (m >= 10000) return Math.round(m / 1000) + ' km';
    if (m >= 1000) return (m / 1000).toFixed(1) + ' km';
    return Math.round(m).toLocaleString('en') + ' m';
  }
  var clouds = [].slice.call(document.querySelectorAll('.cloud')), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var baseTitle = document.title, lastTitle = '';
  function setTitle(t) { if (t !== lastTitle) { document.title = t; lastTitle = t; } }
  function update() {
    busy = false;
    var ref = scrollY + innerHeight * .45, inSite = scrollY > tops[0] - innerHeight * .35, night = document.documentElement.dataset.sky === 'night';
    rail.classList.toggle('show', inSite);
    rail.classList.toggle('light', ref > hz && !night);
    var mt = place(ref); mark.style.top = mt + 'px';
    ticks.forEach(function (tk) { tk.style.visibility = Math.abs(parseFloat(tk.style.top) - mt) < 26 ? 'hidden' : ''; });
    var t = fmt(altitudeAt(ref)); if (t !== lastText) { out.textContent = t; lastText = t; }
    setTitle(!inSite ? baseTitle : document.body.classList.contains('landed') ? 'Landed in Rawalpindi | ' + baseTitle : t + ' up | ' + baseTitle);
    if (!still && horizon) {
      var r = horizon.getBoundingClientRect();
      if (r.bottom > -200 && r.top < innerHeight + 200) {
        var k = (innerHeight - r.top) / (innerHeight + r.height);
        clouds.forEach(function (c) { var sp = +c.getAttribute('data-s'); c.style.transform = 'translate3d(' + (k * sp * 60).toFixed(2) + 'vw,' + (k * Math.abs(sp) * -14).toFixed(2) + 'vh,0)'; });
      }
    }
  }
  function req() { if (!busy) { busy = true; requestAnimationFrame(update); } }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', function () { measure(); req(); });
  addEventListener('load', function () { measure(); req(); });
  measure(); update();
})();

(function () {
  var b = document.getElementById('copyMail');
  if (!b) return;
  var t = 0;
  b.addEventListener('click', function () {
    var mail = b.getAttribute('data-mail');
    function done(ok) {
      b.textContent = ok ? 'Email copied' : 'Select the address to copy it';
      b.classList.toggle('done', ok);
      clearTimeout(t); t = setTimeout(function () { b.textContent = 'Copy email'; b.classList.remove('done'); }, 2200);
    }
    try { navigator.clipboard.writeText(mail).then(function () { done(true); }, function () { done(false); }); }
    catch (e) { done(false); }
  });
})();

/* Real Rawalpindi time: sky mode (set early in <head>) and the time in the footer */
(function () {
  var el = document.getElementById('pkTime'), f;
  try { f = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', hour: 'numeric', minute: '2-digit' }); } catch (e) { return; }
  function tick() {
    var now = new Date(), h = +new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: 'numeric', hourCycle: 'h23' }).format(now);
    document.documentElement.dataset.sky = h < 5 || h >= 19 ? 'night' : h < 7 ? 'dawn' : h < 17 ? 'day' : 'dusk';
    if (el) el.textContent = f.format(now).toLowerCase();
  }
  tick(); setInterval(tick, 30000);
})();

/* The astronaut parachutes onto the ground, plants a flag, and can be launched back to space */
(function () {
  var ground = document.getElementById('ground'), lander = document.getElementById('lander');
  if (!ground || !lander) return;
  var state = 'away', tm = 0, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function setLanded(on) { if (document.body.classList.contains('landed') !== on) { document.body.classList.toggle('landed', on); dispatchEvent(new Event('scroll')); } }
  function land() {
    if (state !== 'away') return;
    state = 'falling'; setLanded(true);
    lander.classList.remove('liftoff', 'landed'); void lander.offsetWidth; lander.classList.add('falling');
    clearTimeout(tm); tm = setTimeout(function () { lander.classList.remove('falling'); lander.classList.add('landed'); state = 'landed'; }, reduce ? 0 : 2600);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) land();
        else if (state === 'landed' || state === 'falling') setLanded(false);
        if (e.isIntersecting && state === 'landed') setLanded(true);
      });
    }, { threshold: .55 }).observe(ground);
  } else land();
  lander.addEventListener('click', function () {
    if (state !== 'landed') return;
    state = 'launching'; lander.classList.remove('landed'); lander.classList.add('liftoff');
    setTimeout(function () {
      setLanded(false);
      var b = document.getElementById('brand'); if (b) b.click(); else scrollTo(0, 0);
      setTimeout(function () { lander.classList.remove('liftoff'); state = 'away'; }, 1200);
    }, reduce ? 0 : 1300);
  });
})();
