/* =========================================================
   build.js — la página "se arma sola" delante del visitante.
   Varios agentes (cursores con nombre) recuadran cada pieza,
   hacen clic y la pieza aparece. Lo de abajo se arma con el scroll.
   Capa aparte: no cambia el diseño de la página.
   ========================================================= */
(function () {
  'use strict';

  var html = document.documentElement;
  // Si el <head> no activó el efecto (movimiento reducido, etc.), no hacemos nada
  if (!html.classList.contains('bld')) return;
  // Avisamos al <head> que arrancamos, para que no quite .bld a los 9 s
  window.__bldOK = true;

  /* ---------- Configuración ---------- */
  // Misma lista que en build.css
  var PIEZAS = 'nav b, nav .links a, .hero > img, .hero h1, .hero .tag, .hero .meta, .logline, section h2, ' +
    '#story > p, #story > .brk, details.ending, .read > p, .cast > div, .cols2 > div > p, figure, ' +
    '#referencias .lbl, .pal, .palnotes > div, .prodgrid h3, .prodgrid table, .note, footer .wrap';
  var COLORES = ['#ff6b6b', '#ffd166', '#06d6a0', '#4d7cff', '#c77dff', '#ff9f1c', '#2ec4f1', '#f15bb5'];
  // "Leo" pasa a "Lía" para no confundirse con el protagonista del corto
  var NOMBRES = ['Ana', 'Lía', 'Mia', 'Teo', 'Sol', 'Iker', 'Noa', 'Gael'];
  var CHARS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  var esMovil = function (w) { return window.matchMedia('(max-width:' + w + 'px)').matches; };
  var azar = function (a, b) { return a + Math.random() * (b - a); };
  var espera = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var seg = function (ms) { return (ms / 1000).toFixed(1).replace('.', ','); };

  /* ---------- Estado ---------- */
  var piezas = [].slice.call(document.querySelectorAll(PIEZAS));
  var total = piezas.length;
  var hechas = 0;
  var cola = [];
  var trabajando = 0;
  var agentes = [];
  var esperando = [];
  var gen = 0;            // generación: invalida bucles viejos al repetir o saltar
  var inicio = 0;         // inicio de toda la animación
  var inicioTanda = 0;    // inicio de la tanda actual (primera pantalla o un scroll)
  var enTanda = false;
  var terminado = false;
  var observador = null;
  var timers = [];

  /* ---------- Capa de los agentes ---------- */
  var capa = document.createElement('div');
  capa.className = 'bld-layer';
  capa.setAttribute('aria-hidden', 'true');
  document.body.appendChild(capa);

  var pendienteTam = false;
  function ajustarCapa() {
    if (pendienteTam) return;
    pendienteTam = true;
    requestAnimationFrame(function () {
      pendienteTam = false;
      capa.style.height = document.documentElement.scrollHeight + 'px';
    });
  }
  window.addEventListener('scroll', ajustarCapa, { passive: true });
  window.addEventListener('resize', ajustarCapa);
  ajustarCapa();

  /* ---------- Barra de estado (HUD) ---------- */
  var hud = document.createElement('div');
  hud.className = 'bld-hud hide';
  hud.innerHTML =
    '<span class="bld-dots" aria-hidden="true"></span>' +
    '<span class="bld-text" role="status" aria-live="polite">Armando la página…</span>' +
    '<span class="bld-bar" aria-hidden="true"><i></i></span>' +
    '<button type="button" class="bld-btn">Ver todo</button>';
  document.body.appendChild(hud);
  var hudTexto = hud.querySelector('.bld-text');
  var hudBarra = hud.querySelector('.bld-bar i');
  var hudBoton = hud.querySelector('.bld-btn');
  var hudPuntos = hud.querySelector('.bld-dots');
  var hudTimer = 0;

  function mostrarHud() { clearTimeout(hudTimer); hud.classList.remove('hide'); }
  function ocultarHud(ms) {
    clearTimeout(hudTimer);
    hudTimer = setTimeout(function () { hud.classList.add('hide'); }, ms);
  }
  function actualizarHud() {
    if (terminado) return;
    var activos = agentes.filter(function (a) { return a.ocupado; }).length;
    hudTexto.innerHTML = esMovil(560)
      ? 'Armando · ' + hechas + '/' + total + ' capas'
      : 'Armando la página · <b>' + Math.max(activos, 1) + '</b> agentes · ' + hechas + '/' + total + ' capas';
    hudBarra.style.width = (hechas / total * 100) + '%';
  }

  // Enlace discreto en el footer para repetir
  var pie = document.querySelector('footer .wrap');
  if (pie) {
    var otra = document.createElement('a');
    otra.href = '#';
    otra.className = 'bld-again';
    otra.textContent = 'Ver cómo se arma otra vez';
    otra.addEventListener('click', function (e) { e.preventDefault(); repetir(); });
    pie.appendChild(document.createElement('br'));
    pie.appendChild(otra);
  }

  hudBoton.addEventListener('click', function () {
    if (terminado) repetir(); else verTodo();
  });

  /* ---------- Agentes ---------- */
  var FLECHA = '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M2 1.5 L2 15 L5.6 11.6 L8.2 16.6 L10.6 15.4 L8 10.6 L13.2 10.6 Z" ' +
    'stroke="#17161b" stroke-width="1.2" stroke-linejoin="round"/></svg>';

  function crearAgente(i) {
    var el = document.createElement('div');
    el.className = 'bld-cursor';
    el.innerHTML = FLECHA + '<span>' + NOMBRES[i] + '</span>';
    el.querySelector('path').setAttribute('fill', COLORES[i]);
    el.querySelector('span').style.background = COLORES[i];
    capa.appendChild(el);
    // Arranca cerca de un borde de la pantalla visible
    var vw = window.innerWidth, vh = window.innerHeight;
    var ag = {
      el: el, color: COLORES[i], ocupado: false, raf: 0,
      x: Math.random() < 0.5 ? azar(-30, vw * 0.2) : azar(vw * 0.8, vw + 10),
      y: window.scrollY + azar(vh * 0.1, vh * 0.9),
      poner: function (x, y) { this.x = x; this.y = y; el.style.transform = 'translate(' + x + 'px,' + y + 'px)'; }
    };
    ag.poner(ag.x, ag.y);
    return ag;
  }

  // Movimiento natural: Bézier cuadrática, easing in-out cúbico y temblor de mano
  function mover(ag, x, y, dur) {
    return new Promise(function (listo) {
      var x0 = ag.x, y0 = ag.y, dx = x - x0, dy = y - y0;
      var dist = Math.hypot(dx, dy) || 1;
      var desv = Math.min(dist * 0.45, 380) * (Math.random() * 2 - 1);
      var cx = (x0 + x) / 2 - dy / dist * desv;
      var cy = (y0 + y) / 2 + dx / dist * desv;
      var amp = azar(0.6, 2.2), fase = azar(0, 6.28), t0 = performance.now();
      cancelAnimationFrame(ag.raf);
      function paso(ahora) {
        var t = Math.min(1, (ahora - t0) / dur);
        var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        var u = 1 - e;
        var px = u * u * x0 + 2 * u * e * cx + e * e * x;
        var py = u * u * y0 + 2 * u * e * cy + e * e * y;
        var m = Math.sin(Math.PI * t); // el temblor se apaga al llegar
        px += Math.sin(ahora / 45 + fase) * amp * m;
        py += Math.cos(ahora / 53 + fase) * amp * m;
        ag.poner(px, py);
        if (t < 1) ag.raf = requestAnimationFrame(paso);
        else { ag.poner(x, y); listo(); }
      }
      ag.raf = requestAnimationFrame(paso);
    });
  }

  /* ---------- Cola de piezas ---------- */
  function rectDoc(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
  }
  function tomarPieza() {
    if (!cola.length) return null;
    cola.sort(function (a, b) {
      var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return (ra.top - rb.top) || (ra.left - rb.left);
    });
    var n = Math.min(cola.length, esMovil(700) ? 2 : 4);
    return cola.splice(Math.floor(Math.random() * n), 1)[0];
  }
  function avisar() { esperando.splice(0).forEach(function (r) { r(); }); }

  function tipo(el) {
    var t = el.tagName.toLowerCase();
    if (/^h[1-3]$/.test(t)) return t;
    if (t === 'a' || t === 'button') return 'button';
    if (t === 'p') return 'texto';
    if (t === 'img' || t === 'figure') return 'imagen';
    if (t === 'table') return 'tabla';
    return el.classList[0] || t;
  }

  // Texto que se "decodifica" en los títulos cortos
  function decodificar(el) {
    var real = el.dataset.bldTxt || el.textContent;
    el.dataset.bldTxt = real;
    var pasos = 10, i = 0;
    var iv = setInterval(function () {
      i++;
      var fijos = Math.floor(real.length * i / pasos);
      el.textContent = real.split('').map(function (c, k) {
        if (c === ' ' || k < fijos) return c;
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join('');
      if (i >= pasos) { clearInterval(iv); el.textContent = real; }
    }, 34);
  }

  function quitar(nodos) {
    nodos.forEach(function (n) { n.classList.add('bld-out'); });
    setTimeout(function () { nodos.forEach(function (n) { n.remove(); }); }, 260);
  }

  /* ---------- Armado de una pieza ---------- */
  function armar(ag, el, g) {
    var r = rectDoc(el);
    var arriba = Math.random() < 0.7;
    var izq = Math.random() < 0.5;
    var ex = izq ? r.x : r.x + r.w, ey = arriba ? r.y : r.y + r.h;   // esquina inicial
    var ox = izq ? r.x + r.w : r.x, oy = arriba ? r.y + r.h : r.y;   // esquina opuesta
    var rojo = Math.random() < 0.16;

    return mover(ag, ex, ey, azar(380, 820)).then(function () {
      if (g !== gen) return;
      // Recuadro de selección que crece desde la esquina
      var caja = document.createElement('div');
      caja.className = 'bld-box' + (rojo ? ' red' : '') + (r.y - window.scrollY < 24 ? ' abajo' : '');
      // (si la pieza está pegada al borde superior, la etiqueta va debajo para que se lea)
      caja.innerHTML = '<i></i><i></i><i></i><i></i><b>' + tipo(el) + ' · ' + Math.round(r.w) + '×' + Math.round(r.h) + '</b>';
      caja.style.cssText = 'left:' + ex + 'px;top:' + ey + 'px;width:0;height:0';
      capa.appendChild(caja);

      // Líneas guía alineadas con los bordes
      var guias = [];
      function guia(clase, css) {
        var d = document.createElement('div');
        d.className = 'bld-guide ' + clase;
        d.style.cssText = css;
        capa.appendChild(d);
        guias.push(d);
      }
      var vy = window.scrollY, vh = window.innerHeight;
      guia('h', 'top:' + r.y + 'px');
      guia('h', 'top:' + (r.y + r.h) + 'px');
      if (Math.random() > 0.35) guia('v', 'left:' + r.x + 'px;top:' + vy + 'px;height:' + vh + 'px');
      if (Math.random() > 0.35) guia('v', 'left:' + (r.x + r.w) + 'px;top:' + vy + 'px;height:' + vh + 'px');
      if (rojo) guias[Math.floor(Math.random() * guias.length)].classList.add('red');

      void caja.offsetWidth; // fuerza el reflujo para que la transición arranque
      caja.style.cssText = 'left:' + r.x + 'px;top:' + r.y + 'px;width:' + r.w + 'px;height:' + r.h + 'px';
      guias.forEach(function (d) { d.classList.add('in'); });

      // Arrastra hasta la esquina opuesta, como dibujando el recuadro
      return mover(ag, ox, oy, azar(300, 460)).then(function () {
        if (g !== gen) { quitar([caja].concat(guias)); return; }
        // Clic: anillo de su color y la pieza aparece
        var anillo = document.createElement('div');
        anillo.className = 'bld-ring';
        anillo.style.cssText = 'left:' + ox + 'px;top:' + oy + 'px;border-color:' + ag.color;
        capa.appendChild(anillo);
        setTimeout(function () { anillo.remove(); }, 520);

        el.classList.add('built');
        var t = el.tagName;
        if ((t === 'H2' || t === 'H3') && !el.children.length && el.textContent.trim().length < 70) decodificar(el);

        return espera(azar(160, 420)).then(function () { quitar([caja].concat(guias)); });
      });
    });
  }

  /* ---------- Bucle de cada agente ---------- */
  function trabajar(ag, g) {
    if (g !== gen) return;
    var el = tomarPieza();
    if (!el) {
      // Sin trabajo: deambula un poco, se desvanece y espera piezas nuevas
      ag.ocupado = false;
      revisarTanda();
      mover(ag, ag.x + azar(-140, 140), ag.y + azar(-90, 90), azar(700, 1400)).then(function () {
        if (g !== gen) return;
        if (cola.length) return trabajar(ag, g);
        ag.el.classList.remove('on');
        esperando.push(function () { trabajar(ag, g); });
      });
      return;
    }
    if (!enTanda) { enTanda = true; inicioTanda = performance.now(); }
    ag.ocupado = true;
    ag.el.classList.add('on');
    trabajando++;
    actualizarHud();
    armar(ag, el, g).then(function () {
      if (g !== gen) return;
      trabajando--;
      hechas++;
      actualizarHud();
      trabajar(ag, g);
    });
  }

  // ¿Terminó la tanda actual o toda la página?
  function revisarTanda() {
    if (terminado || cola.length || trabajando) return;
    if (hechas >= total) return terminar(false);
    if (enTanda) {
      enTanda = false;
      hudTexto.textContent = 'Pantalla armada en ' + seg(performance.now() - inicioTanda) + ' s · baja para ver el resto';
      ocultarHud(3500);
    }
  }

  function terminar(saltado) {
    terminado = true;
    if (observador) observador.disconnect();
    agentes.forEach(function (a) { cancelAnimationFrame(a.raf); a.el.classList.remove('on'); });
    setTimeout(function () { if (terminado) html.classList.remove('bld'); }, 500);
    hudTexto.innerHTML = saltado
      ? 'Página completa'
      : 'Armada por <b>' + agentes.length + ' agentes</b> en ' + seg(performance.now() - inicio) + ' s';
    hudBarra.style.width = '100%';
    hudBoton.textContent = 'Repetir';
    mostrarHud();
    ocultarHud(5000);
  }

  function verTodo() {
    gen++;
    cola = [];
    piezas.forEach(function (p) { p.classList.add('built'); });
    hechas = total;
    limpiarCapa();
    terminar(true);
  }

  function limpiarCapa() {
    agentes.forEach(function (a) { cancelAnimationFrame(a.raf); });
    while (capa.firstChild) capa.firstChild.remove();
    agentes = [];
    esperando = [];
  }

  /* ---------- Arranque (y repetición) ---------- */
  function empezar() {
    gen++;
    var g = gen;
    terminado = false;
    hechas = 0;
    cola = [];
    trabajando = 0;
    enTanda = false;
    inicio = performance.now();
    hudBoton.textContent = 'Ver todo';
    hudTexto.textContent = 'Armando la página…';
    hudBarra.style.width = '0';
    mostrarHud();

    // Piezas ocultas (sin tamaño) se dan por armadas
    piezas.forEach(function (p) {
      var r = p.getBoundingClientRect();
      if (!r.width && !r.height) { p.classList.add('built'); hechas++; }
    });

    // Agentes: 8 en escritorio, 4 en móvil, con arranque escalonado
    var n = esMovil(700) ? 4 : 8;
    hudPuntos.innerHTML = '';
    var demora = 0;
    for (var i = 0; i < n; i++) {
      var ag = crearAgente(i);
      agentes.push(ag);
      hudPuntos.insertAdjacentHTML('beforeend', '<i style="background:' + COLORES[i] + '"></i>');
      (function (a, d) {
        timers.push(setTimeout(function () { if (g === gen) trabajar(a, g); }, d));
      })(ag, demora);
      demora += azar(0, 420);
    }

    // Sin IntersectionObserver: se muestra todo de inmediato
    if (!('IntersectionObserver' in window)) { verTodo(); return; }

    if (observador) observador.disconnect();
    observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting || en.target.classList.contains('built')) return;
        observador.unobserve(en.target);
        cola.push(en.target);
      });
      if (cola.length) { mostrarHud(); actualizarHud(); avisar(); }
    }, { rootMargin: '0px 0px -8% 0px' });
    piezas.forEach(function (p) { if (!p.classList.contains('built')) observador.observe(p); });
    if (hechas >= total) terminar(false);
  }

  function repetir() {
    timers.forEach(clearTimeout);
    timers = [];
    limpiarCapa();
    window.scrollTo({ top: 0, behavior: 'instant' });
    html.classList.add('bld');
    piezas.forEach(function (p) {
      p.classList.remove('built');
      if (p.dataset.bldTxt) p.textContent = p.dataset.bldTxt;
    });
    // Espera un cuadro para que el scroll y el ocultamiento se apliquen
    requestAnimationFrame(function () { requestAnimationFrame(empezar); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', empezar);
  else empezar();
})();
