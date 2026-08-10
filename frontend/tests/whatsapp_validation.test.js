'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  toggle(name, force) {
    if (force) this.values.add(name);
    else this.values.delete(name);
  }

  remove(name) {
    this.values.delete(name);
  }
}

class FakeElement {
  constructor(value = '') {
    this.value = value;
    this.dataset = {};
    this.classList = new FakeClassList();
    this.attributes = {};
    this.disabled = false;
    this.textContent = '';
    this.customValidity = '';
  }

  setCustomValidity(message) {
    this.customValidity = message;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  addEventListener() {}
  focus() {}
}

const elements = {
  'wa-tech-select': new FakeElement('6281234567890'),
  'wa-input-name': new FakeElement(),
  'wa-input-division': new FakeElement(),
  'wa-input-location': new FakeElement(),
  'wa-input-category': new FakeElement(),
  'wa-input-device': new FakeElement(),
  'wa-input-urgency': new FakeElement(),
  'wa-input-description': new FakeElement(),
  'wa-form-status': new FakeElement(),
  'wa-preview-text': new FakeElement(),
  'wa-action-link': new FakeElement(),
};

const documentStub = {
  addEventListener() {},
  getElementById(id) {
    return elements[id] || null;
  },
};

const context = vm.createContext({
  document: documentStub,
  window: {
    location: { hostname: 'localhost', protocol: 'http:' },
    SIGAP_API_URL: 'http://localhost:5000/api',
  },
  console,
  setTimeout,
  clearTimeout,
  AbortController,
  URL,
});

const appPath = path.join(__dirname, '..', 'app.js');
const appSource = fs.readFileSync(appPath, 'utf8');
vm.runInContext(appSource, context, { filename: appPath });

const productionContext = vm.createContext({
  document: documentStub,
  window: {
    location: {
      hostname: 'sigap-hse.vercel.app',
      protocol: 'https:',
      origin: 'https://sigap-hse.vercel.app',
      port: '',
    },
  },
  console,
  setTimeout,
  clearTimeout,
  AbortController,
  URL,
});
vm.runInContext(appSource, productionContext, { filename: appPath });
assert.equal(
  vm.runInContext('URL_DASAR_API', productionContext),
  'https://sigap-hse.vercel.app/api',
  'Deployment Vercel harus memakai API pada origin HTTPS yang sama.',
);

function run(script) {
  return vm.runInContext(script, context);
}

const categoryGroups = JSON.parse(run('JSON.stringify(KELOMPOK_KATEGORI_UI)'));
const groupedCategories = categoryGroups.flatMap(group => group.kategori);
const uniqueGroupedCategories = [...new Set(groupedCategories)].sort((a, b) => a.localeCompare(b, 'id'));
const knowledgeEntries = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'backend', 'data', 'knowledge.json'), 'utf8'),
);
const knowledgeCategories = [...new Set(knowledgeEntries.map(item => item.kategori))]
  .sort((a, b) => a.localeCompare(b, 'id'));

assert.equal(categoryGroups.length, 6, 'Antarmuka harus merangkum kategori ke dalam 6 kelompok.');
assert.equal(groupedCategories.length, uniqueGroupedCategories.length, 'Kategori tidak boleh muncul pada dua kelompok.');
assert.deepEqual(uniqueGroupedCategories, knowledgeCategories, 'Seluruh kategori Knowledge Base harus tetap tersedia.');

const groupedOptionHtml = run(`buatOpsiKategoriTerkelompok(
  KELOMPOK_KATEGORI_UI.flatMap(group => group.kategori.map(nama => ({ nama, jumlah: 20 }))),
  '',
  '-- Pilih Kategori --',
  true
)`);
assert.equal((groupedOptionHtml.match(/<optgroup\b/g) || []).length, 6, 'Dropdown harus memakai 6 optgroup.');
assert.equal((groupedOptionHtml.match(/<option\b/g) || []).length, 28, 'Placeholder dan 27 kategori harus tetap ada.');

const restoredChatSessions = JSON.parse(run(`(() => {
  const storageData = {};
  window.localStorage = {
    getItem(key) { return Object.prototype.hasOwnProperty.call(storageData, key) ? storageData[key] : null; },
    setItem(key, value) { storageData[key] = String(value); }
  };
  idSesiSaatIni = 'SESSION-LOCAL-TEST';
  daftarSesiChatLokal = [{
    id: idSesiSaatIni,
    judul: 'Kabel terbuka',
    dibuat: '2026-08-10T08:00:00.000Z',
    diperbarui: '2026-08-10T08:01:00.000Z',
    kategori: ['Kelistrikan'],
    pesan: [{ peran: 'user', pengirim: 'Pelapor', teks: 'Kabel terbuka', terstruktur: false }]
  }];
  simpanRiwayatChatLokal();
  return JSON.stringify(bacaRiwayatChatLokal());
})()`));
assert.equal(restoredChatSessions.length, 1, 'Riwayat chat lokal harus dapat dibaca kembali.');
assert.equal(restoredChatSessions[0].id, 'SESSION-LOCAL-TEST');
assert.deepEqual(restoredChatSessions[0].kategori, ['Kelistrikan']);

function setCompleteReport() {
  elements['wa-tech-select'].value = '6281234567890';
  elements['wa-input-name'].value = 'Budi Santoso';
  elements['wa-input-division'].value = 'Operations';
  elements['wa-input-location'].value = 'Workshop Welding';
  elements['wa-input-category'].value = 'Pekerjaan Panas (Hot Work)';
  elements['wa-input-device'].value = 'Percikan las dekat bahan mudah terbakar';
  elements['wa-input-urgency'].value = 'Berat';
  elements['wa-input-description'].value = 'Percikan las mengenai area penyimpanan bahan mudah terbakar.';
}

let result = run('perbaruiPesanWhatsAppLangsung()');
assert.equal(result.valid, false, 'Form kosong wajib ditolak.');
assert.equal(elements['wa-action-link'].disabled, true, 'Tombol kirim harus nonaktif saat form belum lengkap.');
assert.equal(run('tautanWhatsAppTerakhir'), null, 'URL WhatsApp tidak boleh dibuat untuk form belum lengkap.');
assert.match(elements['wa-preview-text'].textContent, /\[Belum diisi\]/);

setCompleteReport();
result = run('perbaruiPesanWhatsAppLangsung()');
assert.equal(result.valid, true, 'Form lengkap harus diterima.');
assert.equal(elements['wa-action-link'].disabled, false, 'Tombol kirim harus aktif setelah seluruh data valid.');

const whatsappUrl = run('tautanWhatsAppTerakhir');
assert.ok(whatsappUrl.startsWith('https://wa.me/6281234567890?text='));
const message = decodeURIComponent(whatsappUrl.split('?text=')[1]);
for (const expected of [
  'Budi Santoso',
  'Operations',
  'Workshop Welding',
  'Pekerjaan Panas (Hot Work)',
  'Percikan las dekat bahan mudah terbakar',
  'Berat',
]) {
  assert.ok(message.includes(expected), `Pesan WhatsApp harus memuat: ${expected}`);
}
assert.ok(!message.includes('[Belum diisi]'));
assert.ok(!message.includes('Pelapor Anonim'));

const requiredIds = [
  'wa-tech-select',
  'wa-input-name',
  'wa-input-division',
  'wa-input-location',
  'wa-input-category',
  'wa-input-device',
  'wa-input-urgency',
  'wa-input-description',
];

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const styleSource = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
const inlineHandlers = [...indexHtml.matchAll(/\bonclick="([A-Za-z_$][\w$]*)\(/g)]
  .map(match => match[1]);
for (const handler of new Set(inlineHandlers)) {
  assert.match(
    appSource,
    new RegExp(`function\\s+${handler}\\s*\\(`),
    `Handler tombol ${handler} harus tersedia di app.js.`,
  );
}
assert.match(
  indexHtml,
  /<textarea\b(?=[^>]*\bid="chat-input")(?=[^>]*\brows="2")[^>]*>/i,
  'Input chatbot mobile harus mendukung pesan dua baris.',
);
assert.match(indexHtml, /id="mobile-category-trigger"/i, 'Chatbot harus memiliki pemicu kategori ringkas di mobile.');
assert.match(indexHtml, /id="mobile-category-backdrop"/i, 'Pemilih kategori mobile harus memiliki backdrop yang dapat ditutup.');
assert.match(indexHtml, /id="chat-session-drawer"/i, 'Chatbot mobile harus memiliki drawer riwayat sesi.');
assert.match(
  indexHtml,
  /<aside\b(?=[^>]*\bid="chat-session-drawer")(?=[^>]*\binert\b)[^>]*>/i,
  'Drawer tersembunyi tidak boleh menangkap fokus atau sentuhan.',
);
assert.match(indexHtml, /id="chat-session-list"/i, 'Drawer harus menyediakan daftar sesi percakapan.');
assert.match(appSource, /window\.visualViewport/, 'Tinggi chatbot harus mengikuti viewport saat keyboard mobile terbuka.');
assert.match(appSource, /document\.body\.appendChild\(element\)/, 'Overlay mobile harus dipasang di body agar tidak terpotong kontainer chat.');
assert.match(appSource, /window\.localStorage/, 'Riwayat sesi chatbot harus disimpan pada perangkat pengguna.');
assert.doesNotMatch(appSource, /\/chatbot\/reset/, 'Membuat chat baru tidak boleh menghapus sesi lama di backend.');
assert.match(styleSource, /\.chat-session-drawer\.open\s*\{[^}]*pointer-events:\s*auto/s, 'Drawer aktif harus dapat menerima sentuhan.');
assert.match(styleSource, /\.chat-drawer-history\s*\{[^}]*overflow-y:\s*auto/s, 'Daftar sesi harus dapat digulir vertikal.');
assert.match(styleSource, /#view-chatbot \.chat-messages-stream\s*\{[^}]*touch-action:\s*pan-y/s, 'Isi chat harus mendukung gestur gulir vertikal.');
assert.equal(
  run("buatJudulSesiChat('Kabel terbuka di area pompa utama')"),
  'Kabel terbuka di area pompa utama',
  'Judul sesi harus berasal dari pesan pertama pengguna.',
);
for (const id of requiredIds) {
  const requiredControl = new RegExp(
    `<(?:input|select|textarea)\\b(?=[^>]*\\bid="${id}")(?=[^>]*\\brequired\\b)[^>]*>`,
    'i',
  );
  assert.match(indexHtml, requiredControl, `${id} harus tetap memakai atribut required di HTML.`);
}
assert.match(
  indexHtml,
  /<button\b(?=[^>]*\bid="wa-action-link")(?=[^>]*\bdisabled\b)[^>]*>/i,
  'Aksi WhatsApp harus berupa tombol yang nonaktif secara default.',
);

for (const id of requiredIds) {
  setCompleteReport();
  elements[id].value = '   ';
  result = run('perbaruiPesanWhatsAppLangsung()');
  assert.equal(result.valid, false, `${id} wajib divalidasi.`);
  assert.equal(elements['wa-action-link'].disabled, true, `${id} kosong wajib menonaktifkan tombol kirim.`);
  assert.equal(run('tautanWhatsAppTerakhir'), null, `${id} kosong tidak boleh menghasilkan URL WhatsApp.`);
}

setCompleteReport();
elements['wa-input-name'].value = 'Pelapor Anonim';
result = run('perbaruiPesanWhatsAppLangsung()');
assert.equal(result.valid, false, 'Identitas anonim tidak boleh digunakan untuk pengiriman langsung.');

console.log('WhatsApp validation tests passed.');
