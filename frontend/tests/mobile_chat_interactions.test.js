'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

class FakeClassList {
  constructor() { this.values = new Set(); }
  add(...names) { names.forEach(name => this.values.add(name)); }
  remove(...names) { names.forEach(name => this.values.delete(name)); }
  contains(name) { return this.values.has(name); }
  toggle(name, force) {
    const enabled = force === undefined ? !this.values.has(name) : Boolean(force);
    if (enabled) this.values.add(name);
    else this.values.delete(name);
    return enabled;
  }
}

class FakeElement {
  constructor(id, documentStub) {
    this.id = id;
    this.ownerDocument = documentStub;
    this.classList = new FakeClassList();
    this.attributes = {};
    this.listeners = {};
    this.hidden = true;
    this.inert = true;
    this.parentElement = null;
  }
  addEventListener(type, callback) { this.listeners[type] = callback; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  removeAttribute(name) { delete this.attributes[name]; }
  focus() { this.ownerDocument.activeElement = this; }
  blur() { if (this.ownerDocument.activeElement === this) this.ownerDocument.activeElement = null; }
  querySelector(selector) {
    if (selector.includes('chat-drawer-close')) return this.ownerDocument.getElementById('drawer-close');
    if (selector.includes('mobile-category-close') || selector.includes('summary')) return this.ownerDocument.getElementById('category-close');
    return null;
  }
  scrollIntoView() {}
}

function createMobileContext() {
  const documentStub = {
    activeElement: null,
    listeners: {},
    elements: {},
    addEventListener(type, callback) { this.listeners[type] = callback; },
    getElementById(id) { return this.elements[id] || null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    documentElement: { style: { setProperty() {} }, clientHeight: 800 },
  };
  documentStub.body = {
    classList: new FakeClassList(),
    appendChild(element) { element.parentElement = this; },
  };

  for (const id of [
    'chat-input', 'chat-session-drawer', 'chat-drawer-backdrop', 'chat-drawer-trigger',
    'drawer-close', 'category-selector-bar', 'mobile-category-backdrop',
    'mobile-category-trigger', 'category-close',
  ]) {
    documentStub.elements[id] = new FakeElement(id, documentStub);
  }

  const viewportListeners = {};
  const visualViewport = {
    height: 800,
    addEventListener(type, callback) { viewportListeners[type] = callback; },
  };
  const windowStub = {
    innerHeight: 800,
    location: { hostname: 'localhost', protocol: 'http:', origin: 'http://localhost' },
    matchMedia: () => ({ matches: true }),
    visualViewport,
    addEventListener() {},
    requestAnimationFrame(callback) { callback(); },
    setTimeout(callback) { callback(); return 1; },
    scrollTo() {},
  };

  const context = vm.createContext({
    document: documentStub,
    window: windowStub,
    console,
    setTimeout: windowStub.setTimeout,
    clearTimeout() {},
    AbortController,
    URL,
  });
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  vm.runInContext(source, context, { filename: 'app.js' });
  return { context, documentStub, viewportListeners, visualViewport };
}

test('drawer mobile membuka, menutup, dan tidak menghalangi klik saat tersembunyi', () => {
  const { context, documentStub } = createMobileContext();
  vm.runInContext('pasangOverlayChatPadaBody()', context);

  const drawer = documentStub.getElementById('chat-session-drawer');
  const backdrop = documentStub.getElementById('chat-drawer-backdrop');
  assert.equal(drawer.parentElement, documentStub.body);
  assert.equal(backdrop.parentElement, documentStub.body);

  vm.runInContext('bukaDrawerChat()', context);
  assert.equal(drawer.classList.contains('open'), true);
  assert.equal(drawer.inert, false);
  assert.equal(backdrop.hidden, false);
  assert.equal(documentStub.body.classList.contains('chat-drawer-open'), true);

  vm.runInContext('tutupDrawerChat(false)', context);
  assert.equal(drawer.classList.contains('open'), false);
  assert.equal(drawer.inert, true);
  assert.equal(backdrop.hidden, true);
  assert.equal(documentStub.body.classList.contains('chat-drawer-open'), false);
});

test('pemilih kategori mobile dapat dibuka dan ditutup tanpa menyisakan scroll lock', () => {
  const { context, documentStub } = createMobileContext();
  const panel = documentStub.getElementById('category-selector-bar');
  const backdrop = documentStub.getElementById('mobile-category-backdrop');

  vm.runInContext('bukaPemilihKategoriMobile()', context);
  assert.equal(panel.classList.contains('mobile-open'), true);
  assert.equal(backdrop.hidden, false);
  assert.equal(documentStub.body.classList.contains('mobile-category-open'), true);

  vm.runInContext('tutupPemilihKategoriMobile(false)', context);
  assert.equal(panel.classList.contains('mobile-open'), false);
  assert.equal(backdrop.hidden, true);
  assert.equal(documentStub.body.classList.contains('mobile-category-open'), false);
});

test('mode keyboard dilepas saat visual viewport kembali penuh meski input tetap fokus', () => {
  const { context, documentStub, viewportListeners, visualViewport } = createMobileContext();
  const input = documentStub.getElementById('chat-input');
  vm.runInContext('inisialisasiModeChatSeluler()', context);

  documentStub.activeElement = input;
  visualViewport.height = 500;
  viewportListeners.resize();
  assert.equal(documentStub.body.classList.contains('chat-composer-active'), true);

  visualViewport.height = 800;
  viewportListeners.resize();
  assert.equal(documentStub.activeElement, input);
  assert.equal(documentStub.body.classList.contains('chat-composer-active'), false);
  assert.equal(documentStub.body.classList.contains('chat-keyboard-open'), false);
});
