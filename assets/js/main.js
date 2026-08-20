/* Eastern Pest Control — site interactions */
(function () {
  'use strict';

  var doc = document;

  /* ---------- Current year ---------- */
  doc.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Active nav state ---------- */
  var current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  doc.querySelectorAll('.nav__item').forEach(function (item) {
    var link = item.querySelector('.nav__link');
    if (!link) return;
    var matches = Array.prototype.some.call(item.querySelectorAll('a'), function (a) {
      var href = (a.getAttribute('href') || '').split('#')[0].toLowerCase();
      return href && href === current;
    });
    if (matches) item.classList.add('is-current');
  });

  /* ---------- Sticky header shadow ---------- */
  var masthead = doc.querySelector('.masthead');
  if (masthead) {
    var onScroll = function () {
      masthead.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Promo bar dismiss ---------- */
  var promo = doc.querySelector('.promo-bar');
  if (promo) {
    try {
      if (sessionStorage.getItem('epc-promo-dismissed') === '1') promo.hidden = true;
    } catch (e) { /* storage blocked */ }
    var promoClose = promo.querySelector('.promo-bar__close');
    if (promoClose) {
      promoClose.addEventListener('click', function () {
        promo.hidden = true;
        try { sessionStorage.setItem('epc-promo-dismissed', '1'); } catch (e) { /* noop */ }
      });
    }
  }

  /* ---------- Mobile drawer ---------- */
  var drawer = doc.querySelector('.drawer');
  var burger = doc.querySelector('.burger');
  if (drawer && burger) {
    var openDrawer = function () {
      drawer.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      doc.documentElement.style.overflow = 'hidden';
      var first = drawer.querySelector('.drawer__close');
      if (first) first.focus();
    };
    var closeDrawer = function () {
      drawer.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      doc.documentElement.style.overflow = '';
    };
    burger.addEventListener('click', openDrawer);
    drawer.querySelectorAll('[data-drawer-close]').forEach(function (el) {
      el.addEventListener('click', closeDrawer);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeDrawer();
        burger.focus();
      }
    });
  }

  /* ---------- FAQ accordion ---------- */
  doc.querySelectorAll('.faq').forEach(function (faq) {
    var buttons = faq.querySelectorAll('.faq__q');
    buttons.forEach(function (btn) {
      var panel = doc.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;

      if (btn.getAttribute('aria-expanded') === 'true') {
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }

      btn.addEventListener('click', function () {
        var isOpen = btn.getAttribute('aria-expanded') === 'true';

        buttons.forEach(function (other) {
          if (other === btn) return;
          var otherPanel = doc.getElementById(other.getAttribute('aria-controls'));
          other.setAttribute('aria-expanded', 'false');
          if (otherPanel) otherPanel.style.maxHeight = '0px';
        });

        btn.setAttribute('aria-expanded', String(!isOpen));
        panel.style.maxHeight = isOpen ? '0px' : panel.scrollHeight + 'px';
      });
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var revealables = doc.querySelectorAll('.reveal');
  if (revealables.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
    );
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Forms (static demo handling) ---------- */
  doc.querySelectorAll('form[data-form]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var name = (form.querySelector('[name="first-name"]') || {}).value || '';
      if (status) {
        status.textContent =
          'Thanks' + (name ? ', ' + name.trim().split(' ')[0] : '') +
          ' — your request has been received. A scheduler will call you back shortly. ' +
          '(Demo form: connect this to your CRM or email service before launch.)';
        status.hidden = false;
      }
      form.reset();
    });
  });
})();
