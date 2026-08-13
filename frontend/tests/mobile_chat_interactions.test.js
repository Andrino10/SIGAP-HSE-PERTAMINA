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
    this.dataset = {};
    this.textContent = '';
    this.value = '';
    this.dispatchedEvents = [];
    this.childrenFromHtml = [];
    this._innerHTML = '';
  }
  addEventListener(type, callback) { this.listeners[type] = callback; }
  dispatchEvent(event) {
    this.dispatchedEvents.push(event.type);
    this.listeners[event.type]?.(event);
    return true;
  }
  click() { this.listeners.click?.({ currentTarget: this, target: this }); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  removeAttribute(name) { delete this.attributes[name]; }
  focus() { this.ownerDocument.activeElement = this; }
  blur() { if (this.ownerDocument.activeElement === this) this.ownerDocument.activeElement = null; }
  querySelector(selector) {
    if (selector.includes('chat-drawer-close')) return this.ownerDocument.getElementById('drawer-close');
    if (selector.includes('mobile-category-close') || selector.includes('summary')) return this.ownerDocument.getElementById('category-close');
    return null;
  }
  querySelectorAll(selector) {
    if (selector === '[data-suggestion-index]') return this.childrenFromHtml;
    return [];
  }
  set innerHTML(value) {
    this._innerHTML = String(value);
    if (this.id !== 'group-suggestion-list') return;
    this.childrenFromHtml = [...this._innerHTML.matchAll(/data-suggestion-index="(\d+)"/g)].map(match => {
      const button = new FakeElement(`suggestion-${match[1]}`, this.ownerDocument);
      button.dataset.suggestionIndex = match[1];
      return button;
    });
  }
  get innerHTML() { return this._innerHTML; }
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
  documentStub.chatView = {
    appendChild(element) { element.parentElement = this; },
    insertBefore(element) { element.parentElement = this; },
  };

  for (const id of [
    'chat-input', 'chat-session-drawer', 'chat-drawer-backdrop', 'chat-drawer-trigger',
    'drawer-close', 'category-selector-bar', 'mobile-category-backdrop',
    'mobile-category-trigger', 'category-close', 'mobile-inline-category-picker',
    'mobile-inline-category-options', 'mobile-inline-category-close',
    'view-chatbot', 'group-suggestion-popover', 'group-suggestion-list', 'group-suggestion-title',
    'group-suggestion-description',
  ]) {
    documentStub.elements[id] = new FakeElement(id, documentStub);
  }
  documentStub.elements['category-selector-bar'].parentElement = documentStub.chatView;

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
    clearTimeout() {},
    scrollTo() {},
  };

  const context = vm.createContext({
    document: documentStub,
    window: windowStub,
    console,
    setTimeout: windowStub.setTimeout,
    clearTimeout: windowStub.clearTimeout,
    AbortController,
    Event: class Event { constructor(type, options = {}) { this.type = type; this.bubbles = Boolean(options.bubbles); } },
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

test('pemilih kategori mobile dapat dibuka hampir selayar dengan backdrop dan ditutup kembali', () => {
  const { context, documentStub } = createMobileContext();
  const panel = documentStub.getElementById('category-selector-bar');
  const backdrop = documentStub.getElementById('mobile-category-backdrop');
  const inlinePicker = documentStub.getElementById('mobile-inline-category-picker');
  vm.runInContext('pasangOverlayChatPadaBody()', context);

  vm.runInContext('bukaPemilihKategoriMobile()', context);
  assert.equal(panel.parentElement, documentStub.chatView);
  assert.equal(inlinePicker.classList.contains('open'), true);
  assert.equal(inlinePicker.attributes['aria-hidden'], 'false');
  assert.equal(inlinePicker.attributes.role, 'dialog');
  assert.equal(inlinePicker.attributes['aria-modal'], 'true');
  assert.equal(backdrop.hidden, false);
  assert.equal(documentStub.body.classList.contains('mobile-inline-category-open'), true);
  assert.equal(documentStub.body.classList.contains('mobile-category-open'), false);

  vm.runInContext('tutupPemilihKategoriMobile(false)', context);
  assert.equal(inlinePicker.classList.contains('open'), false);
  assert.equal(inlinePicker.attributes['aria-hidden'], 'true');
  assert.equal(inlinePicker.attributes.role, undefined);
  assert.equal(inlinePicker.attributes['aria-modal'], undefined);
  assert.equal(backdrop.hidden, true);
  assert.equal(documentStub.body.classList.contains('mobile-inline-category-open'), false);
  assert.equal(documentStub.body.classList.contains('mobile-category-open'), false);
  assert.equal(panel.parentElement, documentStub.chatView);
});

test('memilih kelompok mobile menyimpan konteks, menutup panel, lalu menampilkan saran', () => {
  const { context, documentStub } = createMobileContext();
  vm.runInContext(`
    perbaruiTampilanKategoriTerpilih = () => {};
    perbaruiKategoriPadaSesiChat = () => {};
    tampilkanKelompokKategoriBeranda = () => {};
    tampilkanNotifikasi = () => {};
    document.getElementById('view-chatbot').classList.add('active');
    document.getElementById('mobile-inline-category-picker').classList.add('open');
    document.body.classList.add('mobile-inline-category-open');
    pilihKelompokKategori('aktivitas-berisiko');
  `, context);
  assert.equal(vm.runInContext("kelompokKategoriTerpilih", context), 'aktivitas-berisiko');
  assert.equal(vm.runInContext("kategoriTerpilih.length", context), 0);
  assert.equal(documentStub.body.classList.contains('mobile-inline-category-open'), false);
  assert.equal(documentStub.getElementById('mobile-inline-category-picker').classList.contains('open'), false);
  assert.equal(documentStub.getElementById('group-suggestion-popover').classList.contains('open'), true);
  assert.equal(documentStub.activeElement, documentStub.getElementById('mobile-category-trigger'));
});

test('pop-up kategori menampilkan saran dan klik hanya mengisi draf pesan', () => {
  const { context, documentStub } = createMobileContext();
  vm.runInContext(`
    jumlahKirimPengujian = 0;
    jumlahNavigasiPengujian = 0;
    kirimPesanChat = () => { jumlahKirimPengujian += 1; };
    alihkanTampilan = () => { jumlahNavigasiPengujian += 1; };
    tampilkanNotifikasi = () => {};
    document.getElementById('view-chatbot').classList.add('active');
    tampilkanPopupSaranKelompok('peralatan-kendaraan');
  `, context);

  const popover = documentStub.getElementById('group-suggestion-popover');
  const suggestionList = documentStub.getElementById('group-suggestion-list');
  const input = documentStub.getElementById('chat-input');
  assert.equal(popover.classList.contains('open'), true);
  assert.equal(popover.hidden, false);
  assert.match(documentStub.getElementById('group-suggestion-title').textContent, /Peralatan/);
  assert.equal(suggestionList.childrenFromHtml.length, 3);

  suggestionList.childrenFromHtml[1].click();
  assert.match(input.value, /Pelindung mesin dilepas/);
  assert.deepEqual(input.dispatchedEvents, ['input']);
  assert.equal(popover.classList.contains('open'), false);
  assert.equal(popover.hidden, true);
  assert.equal(vm.runInContext('jumlahKirimPengujian', context), 0);
  assert.equal(vm.runInContext('jumlahNavigasiPengujian', context), 0);
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
