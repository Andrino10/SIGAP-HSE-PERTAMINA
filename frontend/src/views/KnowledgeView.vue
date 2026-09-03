<template>
  <main class="view-panel active" id="view-services-panel">
    <div class="panel-header">
      <span class="section-kicker">KNOWLEDGE BASE</span>
      <h2>Direktori keselamatan kerja HSSE</h2>
      <p>Seluruh artikel dari <code>knowledge.json</code>, lengkap dengan identifikasi bahaya, tingkat risiko, kata kunci, dan tindakan pengendalian.</p>
    </div>

    <!-- FAQ Search & Category Filter Bar -->
    <div class="faq-search-box">
      <div class="faq-search-meta">
        <span id="faq-counter-badge">
          {{ metaBadgeText }}
        </span>
      </div>

      <div class="faq-search-controls">
        <!-- Category Select Dropdown -->
        <div class="faq-category-control">
          <select class="faq-cat-select" v-model="selectedCategory">
            <option value="Semua">Semua Kategori ({{ allEntries.length }} Artikel)</option>
            <option v-for="cat in uniqueCategories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>

        <!-- Keyword Search Input -->
        <div class="faq-keyword-control">
          <input
            type="text"
            v-model="searchQuery"
            class="faq-search-input"
            placeholder="Cari kata kunci bahaya... (misal: helm, harness, kabel terbuka, confined space, APAR, tumpahan B3)"
          />
        </div>
      </div>

      <!-- Category Filter Chips -->
      <div class="faq-filter-scroll" id="faq-cat-filters">
        <button
          class="chip-btn"
          :class="{ active: selectedCategory === 'Semua' }"
          type="button"
          @click="selectedCategory = 'Semua'"
        >
          Semua ({{ allEntries.length }})
        </button>
        <button
          v-for="cat in uniqueCategories"
          :key="cat"
          class="chip-btn"
          :class="{ active: selectedCategory === cat }"
          type="button"
          @click="selectedCategory = cat"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="knowledge-state knowledge-loading" role="status" style="margin-top: 24px;">
      <span class="button-spinner" aria-hidden="true"></span>
      <strong>Memuat Knowledge Base</strong>
      <span>Menyiapkan panduan keselamatan dari knowledge.json.</span>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="knowledge-state" style="margin-top: 24px;">
      <strong>Gagal Memuat Knowledge Base</strong>
      <span>{{ errorMessage }}</span>
      <button type="button" class="btn btn-secondary" @click="fetchData(true)">Coba lagi</button>
    </div>

    <!-- Empty Filtered Results -->
    <div v-else-if="filteredEntries.length === 0" class="knowledge-state" style="margin-top: 24px;">
      <strong>Tidak ada artikel yang cocok</strong>
      <span>Coba kata kunci yang lebih umum atau pilih kategori lain.</span>
    </div>

    <!-- Articles List Grouped by Category -->
    <div v-else class="faq-list" style="margin-top: 24px;">
      <section
        v-for="group in groupedEntries"
        :key="group.category"
        class="faq-category-group"
      >
        <div class="faq-category-header">
          <div class="faq-category-title-group">
            <span class="faq-category-icon">{{ getCategoryIcon(group.category) }}</span>
            <div>
              <h3>{{ group.category }}</h3>
              <span>Artikel lengkap dari knowledge.json</span>
            </div>
          </div>
          <span class="faq-category-count">{{ group.items.length }} artikel</span>
        </div>

        <div class="faq-category-articles">
          <article
            v-for="(item, idx) in group.items"
            :key="item.id || idx"
            class="faq-item"
            :data-knowledge-id="item.id"
          >
            <div class="faq-item-meta">
              <div class="faq-item-identifiers">
                <span class="faq-item-category">{{ item.kategori || item.category || 'Umum' }}</span>
                <span class="faq-item-id">ID {{ item.id || `HSSE-${idx+1}` }}</span>
              </div>
              <span
                :class="[
                  'res-status-badge',
                  (item.tingkat_risiko || item.risk_level || '').toUpperCase() === 'TINGGI' ? 'status-risk-high' :
                  (item.tingkat_risiko || item.risk_level || '').toUpperCase() === 'SEDANG' ? 'status-risk-medium' : 'status-risk-low'
                ]"
              >
                RISIKO {{ (item.tingkat_risiko || item.risk_level || 'SEDANG').toUpperCase() }}
              </span>
            </div>

            <h4 class="faq-item-title">{{ item.judul || item.title || '-' }}</h4>

            <div v-if="item.penjelasan_risiko && item.penjelasan_risiko.trim() !== '-'" class="knowledge-detail-block risk-detail">
              <div class="knowledge-detail-heading">
                <div class="knowledge-detail-label">Analisis risiko K3</div>
                <span>Ringkasan dan poin penting untuk memudahkan pemahaman</span>
              </div>
              <p style="font-size: 13.5px; line-height: 1.6; margin: 4px 0 0 0; color: var(--text-primary, #f8fafc);">
                {{ item.penjelasan_risiko }}
              </p>
            </div>

            <div v-if="item.solusi" class="knowledge-detail-block solution-detail">
              <div class="knowledge-detail-label">Prosedur solusi dan pengendalian</div>
              <div class="knowledge-solution-list" style="margin-top: 6px;">
                <div v-for="(step, sIdx) in parseSteps(item.solusi)" :key="sIdx" style="margin-bottom: 4px; font-size: 13.5px; line-height: 1.55;">
                  &bull; {{ step }}
                </div>
              </div>
            </div>

            <div v-if="item.referensi && item.referensi.length > 0" class="knowledge-detail-block" style="margin-top: 10px;">
              <div class="knowledge-detail-label">Referensi &amp; Regulasi Terkait</div>
              <ul style="margin: 4px 0 0 18px; padding: 0; font-size: 12.5px; color: #38bdf8;">
                <li v-for="(refItem, rIdx) in item.referensi" :key="rIdx">
                  {{ refItem.judul || refItem }}
                </li>
              </ul>
            </div>
          </article>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getKnowledgeList } from '../services/api';

const isLoading = ref(true);
const errorMessage = ref('');
const allEntries = ref([]);
const selectedCategory = ref('Semua');
const searchQuery = ref('');

const uniqueCategories = computed(() => {
  const set = new Set();
  allEntries.value.forEach(item => {
    const c = item.kategori || item.category;
    if (c) set.add(c);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'id'));
});

const filteredEntries = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  const cat = selectedCategory.value;

  return allEntries.value.filter(item => {
    const itemCat = item.kategori || item.category || 'Umum';
    if (cat !== 'Semua' && itemCat !== cat) {
      return false;
    }

    if (!q) return true;

    const title = (item.judul || item.title || '').toLowerCase();
    const risk = (item.penjelasan_risiko || item.risk_explanation || '').toLowerCase();
    const solution = (item.solusi || item.solution || '').toLowerCase();
    const id = (item.id || '').toLowerCase();

    return title.includes(q) || risk.includes(q) || solution.includes(q) || id.includes(q);
  });
});

const groupedEntries = computed(() => {
  const map = {};
  filteredEntries.value.forEach(item => {
    const c = item.kategori || item.category || 'Umum';
    if (!map[c]) map[c] = [];
    map[c].push(item);
  });

  return Object.keys(map).sort((a, b) => a.localeCompare(b, 'id')).map(c => ({
    category: c,
    items: map[c]
  }));
});

const metaBadgeText = computed(() => {
  if (isLoading.value) return 'Memuat data Knowledge Base HSSE...';
  return `Menampilkan ${filteredEntries.value.length} dari ${allEntries.value.length} artikel • ${uniqueCategories.value.length} kategori • knowledge.json`;
});

function parseSteps(solutionStr) {
  if (!solutionStr) return [];
  return String(solutionStr)
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
}

function getCategoryIcon(name) {
  const icons = {
    'Alat Pelindung Diri (APD)': '⛑️',
    'Pekerjaan di Ketinggian': '🧗',
    'Kelistrikan': '⚡',
    'Alat Berat & Kendaraan': '🚜',
    'Bahan Kimia & B3': '🧪',
    'Tanggap Darurat': '🚨',
    'Lingkungan Kerja': '🌿',
    'Pengawasan & Prosedur': '📋',
    'Pengangkatan & Rigging': '⚓',
    'Ruang Terbatas (Confined Space)': '🚪',
    'Pekerjaan Panas (Hot Work)': '🔥'
  };
  return icons[name] || '🛡️';
}

async function fetchData(force = false) {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const res = await getKnowledgeList();
    if (res && res.success && res.data) {
      const list = res.data.knowledge_base || res.data.entri || res.data.entries || res.data;
      allEntries.value = Array.isArray(list) ? list : [];
    } else {
      throw new Error(res?.message || 'Gagal memuat daftar artikel.');
    }
  } catch (err) {
    errorMessage.value = err.message || 'Gagal memuat Knowledge Base.';
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchData();
});
</script>
