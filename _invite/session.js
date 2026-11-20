(() => {
  const sessionKey = 'pp-invite-session';
  const serviceWorker = navigator.serviceWorker;
  const form = document.getElementById('invite-form');

  function rememberedKey() {
    try {
      return sessionStorage.getItem(sessionKey);
    } catch {
      return null;
    }
  }

  function remember(key) {
    try {
      if (key) sessionStorage.setItem(sessionKey, key);
      else sessionStorage.removeItem(sessionKey);
    } catch {
      // The active Worker can still serve pages while tab storage is disabled.
    }
  }

  serviceWorker?.addEventListener('message', event => {
    if (event.source === serviceWorker.controller && event.data === 'invite-key') {
      event.ports[0]?.postMessage(rememberedKey());
    }
  });

  if (!form) {
    window.addEventListener('pageshow', event => {
      if (event.persisted) location.reload();
    });
    return;
  }

  const input = form.querySelector('input');
  const button = form.querySelector('button');
  const status = document.getElementById('invite-status');

  async function controller() {
    await serviceWorker.register('/invite-worker.js', { updateViaCache: 'none' });
    if (serviceWorker.controller) return serviceWorker.controller;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        serviceWorker.removeEventListener('controllerchange', changed);
        reject(new Error('Service Worker timeout'));
      }, 8000);
      function changed() {
        if (!serviceWorker.controller) return;
        clearTimeout(timeout);
        serviceWorker.removeEventListener('controllerchange', changed);
        resolve(serviceWorker.controller);
      }
      serviceWorker.addEventListener('controllerchange', changed);
      changed();
    });
  }

  async function derive(code) {
    const response = await fetch('/_invite/release.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Release unavailable');
    const release = await response.json();
    const material = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveBits'],
    );
    const bits = await crypto.subtle.deriveBits({
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: Uint8Array.from(atob(release.salt), value => value.charCodeAt(0)),
      iterations: release.iterations,
    }, material, 256);
    return btoa(String.fromCharCode(...new Uint8Array(bits)));
  }

  function authorize(worker, key) {
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timeout = setTimeout(() => {
        channel.port1.close();
        reject(new Error('Unlock timeout'));
      }, 12000);
      channel.port1.onmessage = event => {
        clearTimeout(timeout);
        channel.port1.close();
        resolve(event.data);
      };
      worker.postMessage({ type: 'invite-unlock', key }, [channel.port2]);
    });
  }

  async function showContent(worker, key) {
    const result = await authorize(worker, key);
    if (result === 'invalid') {
      remember(null);
      return false;
    }
    if (result !== 'ok') throw new Error('Release unavailable');
    remember(key);
    // The first document is the lock page. Keep its URL and load the verified
    // document through the Worker after it has authorized this browser tab.
    const response = await fetch(location.pathname + location.search, { cache: 'no-store' });
    if (response.status === 404) {
      status.textContent = '找不到这个页面。请检查网址。';
      return true;
    }
    if (!response.ok || response.headers.get('X-Invite-Decrypted') !== '1') {
      throw new Error('Content unavailable');
    }
    if (!response.headers.get('Content-Type')?.startsWith('text/html')) {
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = decodeURIComponent(location.pathname.split('/').at(-1));
      status.replaceChildren(link);
      link.textContent = '下载文件';
      return true;
    }
    const html = await response.text();
    document.open();
    window.addEventListener('load', () => {
      if (!location.hash) return;
      try {
        document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
      } catch {
        // A malformed fragment must not prevent reading.
      }
    }, { once: true });
    document.write(html);
    document.close();
    return true;
  }

  function failed() {
    status.textContent = '暂时无法解锁。请刷新页面后重试。';
  }

  if (!serviceWorker || !window.crypto?.subtle) {
    status.textContent = '请在支持 Service Worker 的浏览器中通过 HTTPS 打开本站。';
    return;
  }

  const ready = controller();
  ready.then(async worker => {
    const key = rememberedKey();
    if (key && await showContent(worker, key)) return;
    if (key) status.textContent = '请输入当前邀请码。';
    button.disabled = false;
  }).catch(failed);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled || !input.value) return;
    button.disabled = true;
    input.removeAttribute('aria-invalid');
    status.textContent = '正在解锁…';
    try {
      const code = input.value;
      input.value = '';
      if (!await showContent(await ready, await derive(code))) {
        status.textContent = '邀请码不正确，请重试。';
        input.setAttribute('aria-invalid', 'true');
        input.focus();
      }
    } catch {
      failed();
    } finally {
      button.disabled = false;
    }
  });
})();
