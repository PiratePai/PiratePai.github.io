/* Small, self-contained animation scheduler. No work while paused or off-screen. */
(function () {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  window.PaiMotion = {
    mount(root, step, draw, isPlaying, options = {}) {
      const interval = 1000 / Math.max(1, Math.min(20, options.fps || 20));
      const controls = root.querySelector('.ppx-bar') || root;
      let enabled = false, visible = false, timer = 0, raf = 0, last = 0, queued = false;
      if (!isPlaying) {
        const play = document.createElement('button');
        play.type = 'button'; play.className = 'motion-play'; play.textContent = '播放';
        play.setAttribute('aria-pressed', 'false');
        play.addEventListener('click', () => {
          enabled = !enabled;
          play.textContent = enabled ? '暂停' : '播放';
          play.setAttribute('aria-pressed', String(enabled));
        });
        controls.append(play);
        isPlaying = () => enabled;
      }
      const next = document.createElement('button');
      next.type = 'button'; next.className = 'motion-step'; next.textContent = '单步';
      next.addEventListener('click', () => step(0.25, true));
      controls.append(next);
      const note = document.createElement('span');
      note.className = 'motion-note';
      const noteText = () => { note.textContent = reduced.matches ? '系统已减少动态效果，可用单步查看。' : '按需播放 · 离屏暂停'; };
      noteText(); controls.append(note);
      const active = () => visible && !document.hidden && !reduced.matches && isPlaying() && !!root.getClientRects().length;
      function paint() {
        draw();
        const button = root.querySelector('.ppx-play');
        if (button) button.setAttribute('aria-pressed', String(isPlaying()));
        root.dataset.motionFrames = String(+(root.dataset.motionFrames || 0) + 1);
      }
      function stop() {
        clearTimeout(timer); cancelAnimationFrame(raf); timer = raf = last = 0;
        root.dataset.motionState = 'idle';
      }
      function schedule() {
        if (!active()) { stop(); return; }
        if (timer || raf) return;
        root.dataset.motionState = 'playing';
        // A timer gates rAF itself: paused demos do not wake up at display refresh rate.
        timer = setTimeout(() => {
          timer = 0;
          raf = requestAnimationFrame(now => {
            raf = 0;
            if (!active()) { stop(); return; }
            const dt = last ? Math.min(interval / 1000 + 0.08, (now - last) / 1000) : interval / 1000;
            last = now; step(dt); paint(); schedule();
          });
        }, interval);
      }
      function refresh() {
        if (queued) return;
        queued = true;
        queueMicrotask(() => {
          queued = false;
          const button = root.querySelector('.ppx-play');
          if (button) button.setAttribute('aria-pressed', String(isPlaying()));
          if (visible && !document.hidden) paint();
          schedule();
        });
      }
      ['click', 'input', 'change'].forEach(type => root.addEventListener(type, refresh));
      document.addEventListener('visibilitychange', refresh);
      reduced.addEventListener('change', () => { noteText(); refresh(); });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
          // Reader pagination can move a demo twice before one observer delivery.
          // The final record describes its current visibility, not the first one.
          visible = entries[entries.length - 1].isIntersecting;
          refresh();
        }).observe(root);
      } else {
        // Old browsers retain manual controls without a continuously running fallback.
        visible = true; enabled = false;
        isPlaying = () => false;
      }
      root.dataset.motionState = 'idle';
      // Defer until each demo has initialized its data and event handlers.
      queueMicrotask(paint);
      return {refresh};
    },
    static(root, draw) {
      let queued = false;
      const paint = () => {
        if (queued) return;
        queued = true;
        queueMicrotask(() => {
          queued = false; draw();
          root.dataset.motionFrames = String(+(root.dataset.motionFrames || 0) + 1);
        });
      };
      ['input', 'change', 'click'].forEach(type => root.addEventListener(type, paint));
      root.dataset.motionState = 'static'; paint();
    }
  };
})();
