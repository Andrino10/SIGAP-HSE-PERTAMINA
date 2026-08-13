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
      hostname: 'sigap-hsse.vercel.app',
      protocol: 'https:',
      origin: 'https://sigap-hsse.vercel.app',
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
  'https://sigap-hsse.vercel.app/api',
  'Deployment Vercel harus memakai API pada origin HTTPS yang sama.',
);

function run(script) {
  return vm.runInContext(script, context);
}

const categoryGroups = JSON.parse(run('JSON.stringify(KELOMPOK_KATEGORI_UI)'));
const problemSuggestions = JSON.parse(run('JSON.stringify(SARAN_PERMASALAHAN_KATEGORI)'));
const groupedCategories = categoryGroups.flatMap(group => group.kategori);
const uniqueGroupedCategories = [...new Set(groupedCategories)].sort((a, b) => a.localeCompare(b, 'id'));
const knowledgeEntries = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'backend', 'data', 'knowledge.json'), 'utf8'),
);
const knowledgeCategories = [...new Set(knowledgeEntries.map(item => item.kategori))]
  .sort((a, b) => a.localeCompare(b, 'id'));

assert.equal(categoryGroups.length, 6, 'Antarmuka harus merangkum kategori ke dalam 6 kelompok.');
assert.deepEqual(
  Object.keys(problemSuggestions).sort(),
  categoryGroups.map(group => group.id).sort(),
  'Setiap kategori utama harus memiliki saran permasalahan.',
);
assert.ok(
  Object.values(problemSuggestions).every(suggestions => suggestions.length === 3),
  'Setiap kategori utama harus menyediakan tiga saran permasalahan.',
);
assert.equal(groupedCategories.length, uniqueGroupedCategories.length, 'Kategori tidak boleh muncul pada dua kelompok.');
assert.deepEqual(uniqueGroupedCategories, knowledgeCategories, 'Seluruh kategori Knowledge Base harus tetap tersedia.');

assert.equal(
  run("deteksiKategoriDariPesan('Pekerja mengelas tanpa fire watcher', 'aktivitas-berisiko')"),
  'Pekerjaan Panas (Hot Work)',
  'Kelompok utama harus mengarahkan deteksi ke kategori rinci yang sesuai.',
);
assert.equal(
  run("deteksiKategoriDariPesan('Forklift melintas dekat pekerja', 'peralatan-kendaraan')"),
  'Alat Berat & Kendaraan',
  'Kategori rinci peralatan harus ditentukan otomatis dari pesan.',
);
assert.equal(
  run("deteksiKategoriDariPesan('Ada tumpahan bahan kimia', 'aktivitas-berisiko')"),
  'Bahan Kimia & B3',
  'Sistem harus mengoreksi kelompok bila isi laporan jelas berada di kelompok lain.',
);
assert.equal(
  run("tentukanKategoriRinci('aktivitas-berisiko', 'Pekerja mengelas tanpa fire watcher')"),
  'Pekerjaan Panas (Hot Work)',
  'Pilihan kategori utama harus tetap dipetakan ke kategori teknis berdasarkan isi laporan.',
);

const groupedOptionHtml = run(`buatOpsiKategoriTerkelompok(
  KELOMPOK_KATEGORI_UI.flatMap(group => group.kategori.map(nama => ({ nama, jumlah: 20 }))),
  '',
  '-- Pilih Kategori --',
  true
)`);
assert.equal((groupedOptionHtml.match(/<optgroup\b/g) || []).length, 6, 'Dropdown harus memakai 6 optgroup.');
assert.equal((groupedOptionHtml.match(/<option\b/g) || []).length, 28, 'Placeholder dan 27 kategori harus tetap ada.');

const mainCategoryOptionHtml = run("buatOpsiKelompokKategori('', '-- Pilih kategori utama --')");
assert.equal((mainCategoryOptionHtml.match(/<option\b/g) || []).length, 7, 'Formulir laporan hanya boleh menampilkan placeholder dan 6 kategori utama.');
assert.doesNotMatch(mainCategoryOptionHtml, /<optgroup\b/i, 'Formulir laporan tidak boleh menampilkan subkategori.');
assert.doesNotMatch(mainCategoryOptionHtml, /jenis/i, 'Pilihan kategori tidak boleh memuat jumlah jenis.');

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
    kelompokKategori: 'aktivitas-berisiko',
    pesan: [{ peran: 'user', pengirim: 'Pelapor', teks: 'Kabel terbuka', terstruktur: false }]
  }];
  simpanRiwayatChatLokal();
  return JSON.stringify(bacaRiwayatChatLokal());
})()`));
assert.equal(restoredChatSessions.length, 1, 'Riwayat chat lokal harus dapat dibaca kembali.');
assert.equal(restoredChatSessions[0].id, 'SESSION-LOCAL-TEST');
assert.deepEqual(restoredChatSessions[0].kategori, ['Kelistrikan']);
assert.equal(restoredChatSessions[0].kelompokKategori, 'aktivitas-berisiko');

function setCompleteReport() {
  elements['wa-tech-select'].value = '6281234567890';
  elements['wa-input-name'].value = 'Budi Santoso';
  elements['wa-input-division'].value = 'Operations';
  elements['wa-input-location'].value = 'Workshop Welding';
  elements['wa-input-category'].value = 'aktivitas-berisiko';
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
  'Pekerjaan Berisiko',
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
for (const selectId of ['cons-category', 'wa-input-category']) {
  const selectHtml = indexHtml.match(new RegExp(`<select\\b(?=[^>]*\\bid="${selectId}")[^>]*>[\\s\\S]*?<\\/select>`, 'i'))?.[0] || '';
  assert.equal((selectHtml.match(/<option\b/g) || []).length, 7, `${selectId} hanya boleh memuat 6 kategori utama dan placeholder.`);
  assert.doesNotMatch(selectHtml, /<optgroup\b/i, `${selectId} tidak boleh menampilkan subkategori.`);
}
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
assert.doesNotMatch(
  indexHtml.match(/<textarea\b(?=[^>]*\bid="chat-input")[^>]*>/i)?.[0] || '',
  /\bdisabled\b/i,
  'Pengguna harus dapat langsung menulis tanpa memilih kategori lebih dahulu.',
);
assert.match(indexHtml, /id="mobile-category-trigger"/i, 'Chatbot harus memiliki pemicu kategori ringkas di mobile.');
assert.match(indexHtml, /id="mobile-inline-category-picker"/i, 'Kategori mobile harus tersedia langsung di dalam area chatbot.');
assert.match(indexHtml, /id="mobile-inline-category-options"/i, 'Kategori mobile harus memiliki daftar pilihan yang dapat digulir.');
assert.doesNotMatch(indexHtml, /id="mobile-category-search"/i, 'Pencarian kategori rinci tidak diperlukan ketika UI hanya menampilkan 6 kelompok utama.');
assert.match(indexHtml, /data-category-group="aktivitas-berisiko"/i, 'Fallback HTML harus menampilkan kelompok utama, bukan kategori rinci.');
assert.doesNotMatch(indexHtml, /data-mobile-category=/i, 'Kategori rinci tidak boleh diekspos sebagai pilihan mobile.');
assert.match(indexHtml, /id="mobile-category-backdrop"/i, 'Pemilih kategori mobile harus memiliki backdrop yang dapat ditutup.');
assert.match(indexHtml, /id="group-suggestion-modal"/i, 'Pemilihan kategori harus menyediakan pop-up saran permasalahan.');
assert.match(indexHtml, /id="group-suggestion-list"/i, 'Pop-up harus memiliki daftar saran yang dapat dipilih.');
assert.match(indexHtml, /Draf tidak akan dikirim otomatis/i, 'Pop-up harus menjelaskan bahwa draf tidak dikirim otomatis.');
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
assert.match(styleSource, /\.mobile-inline-category-picker\.open\s*\{[^}]*display:\s*flex/s, 'Pemilih kategori inline harus terlihat ketika dibuka.');
assert.match(styleSource, /\.mobile-inline-category-options\s*\{[^}]*overflow-y:\s*auto/s, 'Daftar kategori inline harus dapat digulir di mobile.');
assert.match(styleSource, /\.group-suggestion-list\s*\{[^}]*display:\s*grid/s, 'Saran permasalahan harus tersusun sebagai daftar yang rapi.');
assert.match(styleSource, /@media \(max-width: 620px\)[\s\S]*\.group-suggestion-modal\s*\{[^}]*align-items:\s*flex-end/s, 'Pop-up saran harus nyaman digunakan di mobile.');
assert.match(
  appSource.match(/function bukaChatDenganKelompok[\s\S]*?\n\}/)?.[0] || '',
  /alihkanTampilan\s*\(/,
  'Memilih kategori di beranda harus langsung mengarahkan pengguna ke area laporan.',
);
const groupSelectionSource = appSource.match(/function pilihKelompokKategori[\s\S]*?\n\}/)?.[0] || '';
assert.doesNotMatch(groupSelectionSource, /\.focus\s*\(/, 'Memilih kelompok tidak boleh memindahkan fokus ke input chat.');
assert.match(groupSelectionSource, /tutupPemilihKategoriMobile\s*\(/, 'Panel mobile harus tertutup setelah kategori dipilih.');
assert.match(groupSelectionSource, /tampilkanPopupSaranKelompok\(idKelompok\)/, 'Pemilihan kategori harus membuka pop-up saran permasalahan.');
const useSuggestionSource = appSource.slice(
  appSource.indexOf('function gunakanSaranPermasalahan'),
  appSource.indexOf('function useProblemSuggestion'),
);
assert.match(useSuggestionSource, /input\.value\s*=\s*suggestion\.teks/, 'Saran permasalahan harus dimasukkan ke input sebagai draf.');
assert.match(useSuggestionSource, /dispatchEvent\(new Event\('input'/, 'Input harus diperbarui setelah saran dipilih.');
assert.doesNotMatch(useSuggestionSource, /kirimPesanChat/, 'Memilih saran tidak boleh langsung mengirim laporan.');
const structuredRiskHtml = run(`formatStructuredResponseHTML(
  'PENJELASAN RISIKO\\nKabel terbuka berada di jalur pekerja. Mekanisme bahayanya adalah kontak langsung dengan konduktor. Konsekuensi yang perlu dicegah adalah sengatan dan kebakaran. Faktor penentu meliputi tegangan dan jumlah pekerja terpapar. Temuan harus diverifikasi terhadap kondisi aktual dan SOP.'
)`);
assert.match(structuredRiskHtml, /res-analysis-summary/, 'Analisis risiko harus memiliki ringkasan temuan.');
assert.match(structuredRiskHtml, /res-analysis-points/, 'Analisis risiko panjang harus dipecah menjadi poin yang mudah dibaca.');
assert.match(structuredRiskHtml, /Mengapa kondisi ini berbahaya/, 'Mekanisme bahaya harus diberi label yang jelas.');
assert.match(structuredRiskHtml, /Dampak yang dapat terjadi/, 'Dampak risiko harus diberi label yang jelas.');
assert.match(structuredRiskHtml, /Verifikasi sebelum bekerja/, 'Kebutuhan verifikasi harus diberi label yang jelas.');

const knowledgeRiskHtml = run(`buatHtmlAnalisisRisikoKnowledge(
  'Kabel terbuka berada di jalur pekerja. Tanpa pengendalian, pekerja dapat menyentuh konduktor. Mekanisme bahayanya adalah kontak dengan bagian bertegangan. Konsekuensi yang perlu dicegah adalah sengatan dan kebakaran. Faktor penentu meliputi tegangan dan jumlah pekerja terpapar. Temuan harus diverifikasi terhadap kondisi aktual dan SOP.'
)`);
assert.match(knowledgeRiskHtml, /knowledge-risk-summary/, 'Direktori harus menampilkan ringkasan analisis risiko.');
assert.match(knowledgeRiskHtml, /knowledge-risk-list/, 'Direktori harus memecah uraian panjang menjadi daftar poin.');
assert.match(knowledgeRiskHtml, /Bahaya utama/, 'Direktori harus memberi label pada bahaya utama.');
assert.match(knowledgeRiskHtml, /Faktor yang memperbesar risiko/, 'Direktori harus menjelaskan faktor risiko secara terpisah.');
assert.match(indexHtml, /Direktori keselamatan kerja HSSE/i, 'Nama direktori harus memakai HSSE.');
assert.doesNotMatch(indexHtml, /\bH[S]E\b/, 'Antarmuka utama tidak boleh menampilkan akronim lama.');
assert.equal(run("deteksiKategoriDariPesan('Ada kabel listrik terbuka di dekat panel')"), 'Kelistrikan');
assert.equal(run("deteksiKategoriDariPesan('Pekerja mengelas tanpa fire watcher')"), 'Pekerjaan Panas (Hot Work)');
assert.equal(run("deteksiKategoriDariPesan('Kondisi yang belum dapat dikenali')"), null);
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
