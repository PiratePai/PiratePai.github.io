const sessions = new Map();
const encoder = new TextEncoder();
const decoder = new TextDecoder();
let releaseRequest;
let currentRelease;

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

async function readRelease() {
  const response = await fetch('/_invite/release.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Release unavailable');
  const release = await response.json();
  if (!/^[0-9a-f]{24}$/.test(release.revision)) throw new Error('Invalid release');
  return release;
}

function loadRelease(refresh) {
  if (currentRelease && !refresh) return Promise.resolve(currentRelease);
  releaseRequest ??= readRelease().then(release => {
    currentRelease = release;
    return release;
  }).finally(() => {
    releaseRequest = undefined;
  });
  return releaseRequest;
}

async function decrypt(key, release, id, name) {
  const response = await fetch(`/_invite/${release.revision}/${id}.bin`);
  if (!response.ok) throw new Error('Encrypted resource unavailable');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 28) throw new Error('Invalid encrypted resource');
  return crypto.subtle.decrypt({
    name: 'AES-GCM',
    iv: bytes.subarray(0, 12),
    additionalData: encoder.encode(`${release.revision}:${name}`),
  }, key, bytes.subarray(12));
}

async function openVault(release, raw) {
  const bytes = Uint8Array.from(atob(raw), value => value.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['decrypt']);
  const plain = await decrypt(key, release, 'index', 'index');
  return { release, key, entries: JSON.parse(decoder.decode(plain)) };
}

self.addEventListener('message', event => {
  const port = event.ports[0];
  if (event.data?.type !== 'invite-unlock' || !port || event.source?.type !== 'window') return;
  event.waitUntil((async () => {
    try {
      const vault = await openVault(await loadRelease(true), event.data.key);
      sessions.set(event.source.id, { revision: vault.release.revision, result: Promise.resolve(vault) });
      port.postMessage('ok');
    } catch (error) {
      port.postMessage(error.name === 'OperationError' ? 'invalid' : 'unavailable');
    }
  })());
});

async function askForKey(clientId) {
  const client = await self.clients.get(clientId);
  if (!client) return null;
  return new Promise(resolve => {
    const channel = new MessageChannel();
    const timeout = setTimeout(() => {
      channel.port1.close();
      resolve(null);
    }, 600);
    channel.port1.onmessage = event => {
      clearTimeout(timeout);
      channel.port1.close();
      resolve(event.data);
    };
    client.postMessage('invite-key', [channel.port2]);
  });
}

function getVault(clientId, release) {
  if (!clientId) return null;
  const session = sessions.get(clientId);
  if (session?.revision === release.revision) return session.result;
  const result = askForKey(clientId).then(key => key ? openVault(release, key) : null).catch(() => null);
  const pending = { revision: release.revision, result };
  sessions.set(clientId, pending);
  result.then(vault => {
    if (!vault && sessions.get(clientId) === pending) sessions.delete(clientId);
  });
  return result;
}

function response(body, status, mimeType, extra = {}) {
  return new Response(body, { status, headers: {
    'Content-Type': mimeType,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow',
    ...extra,
  } });
}

async function lockPage() {
  const shell = await fetch('/404.html', { cache: 'no-store' });
  return response(shell.body, 200, 'text/html; charset=utf-8');
}

function findEntry(entries, pathname) {
  const path = decodeURIComponent(pathname);
  const candidates = path.endsWith('/') ? [path + 'index.html'] :
    [path, path + '.html', path + '/index.html'];
  return candidates.find(candidate => Object.hasOwn(entries, candidate));
}

async function serve(event, url) {
  const { request } = event;
  const navigation = request.mode === 'navigate';
  try {
    const release = await loadRelease(navigation);
    const clientId = (navigation && event.replacesClientId) || event.clientId;
    const vault = await getVault(clientId, release);
    if (!vault) {
      return navigation ? lockPage() : response('请先解锁本站。', 401, 'text/plain; charset=utf-8');
    }
    const path = findEntry(vault.entries, url.pathname);
    if (!path) return response('找不到资源。', 404, 'text/plain; charset=utf-8');
    const entry = vault.entries[path];
    const body = request.method === 'HEAD' ? null : await decrypt(vault.key, release, entry.id, path);
    if (event.resultingClientId) sessions.set(event.resultingClientId, {
      revision: release.revision, result: Promise.resolve(vault),
    });
    return response(body, 200, entry.mimeType, { 'X-Invite-Decrypted': '1' });
  } catch {
    return navigation ? lockPage() : response('暂时无法加载资源。', 503, 'text/plain; charset=utf-8');
  }
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !['GET', 'HEAD'].includes(event.request.method)) return;
  if (url.pathname.startsWith('/_invite/') || url.pathname === '/invite-worker.js' ||
      url.pathname === '/robots.txt') return;
  event.respondWith(serve(event, url));
});
