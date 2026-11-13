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
  function update() {
    busy = false;
    var ref = scrollY + innerHeight * .45;
    rail.classList.toggle('show', scrollY > tops[0] - innerHeight * .35);
    rail.classList.toggle('light', ref > hz);
    mark.style.top = place(ref) + 'px';
    var t = fmt(altitudeAt(ref)); if (t !== lastText) { out.textContent = t; lastText = t; }
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
