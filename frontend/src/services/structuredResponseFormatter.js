/**
 * SIGAP-AI HSSE Structured Response Formatter
 * Mengonversi output teks analisis HSSE menjadi tampilan kartu visual kaya (Rich Visual Cards)
 * Sesuai dengan desain resmi Pertamina EP Lirik Field.
 */

function sanitasiHtml(teks) {
  if (teks === null || teks === undefined) return '';
  return String(teks)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitasiUrlReferensi(nilai) {
  try {
    const url = new URL(String(nilai || '').trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch (_) {
    return '';
  }
}

function formatReferensiHtml(teks) {
  const nilai = String(teks || '').trim();
  const hasil = nilai.match(/https?:\/\/[^\s]+$/i);
  if (!hasil) return sanitasiHtml(nilai);
  const url = sanitasiUrlReferensi(hasil[0]);
  if (!url) return sanitasiHtml(nilai);
  const label = nilai.slice(0, hasil.index).trim();
  return `${sanitasiHtml(label)} <a href="${sanitasiHtml(url)}" target="_blank" rel="noopener noreferrer" style="color:#0284c7; font-weight:600; text-decoration:underline;">Buka sumber resmi</a>`;
}

function pecahKalimatAnalisisRisiko(teks) {
  const nilai = String(teks || '').replace(/\s+/g, ' ').trim();
  const prefixMatch = nilai.match(/^(Kondisi #\d+)\s*:\s*/i);
  const judul = prefixMatch ? prefixMatch[1] : '';
  const isi = prefixMatch ? nilai.slice(prefixMatch[0].length) : nilai;
  const kalimat = (isi.match(/[^.!?]+(?:[.!?]+|$)/g) || [isi])
    .map(item => item.trim())
    .filter(Boolean);
  return { judul, kalimat };
}

function labelPoinAnalisisRisiko(kalimat, indeks) {
  const nilai = String(kalimat || '').toLowerCase();
  if (/verifik|dicocokkan|jsa|sop|izin kerja|sebelum pekerjaan|tidak menggantikan/.test(nilai)) {
    return 'VERIFIKASI SEBELUM BEKERJA';
  }
  if (/faktor|tingkat risiko|durasi|intensitas|jumlah orang|efektivitas barrier|kesiapan respons/.test(nilai)) {
    return 'FAKTOR YANG MEMPERBESAR RISIKO';
  }
  if (/konsekuensi|dampak|dapat mengalami|cedera|kerusakan|pencemaran|penyalaan dapat|kebakaran|ledakan/.test(nilai)) {
    return 'DAMPAK YANG DAPAT TERJADI';
  }
  if (/mekanisme|berkaitan|sumber bahaya|kegagalan|api terbuka|percikan|panas/.test(nilai)) {
    return 'MENGAPA KONDISI INI BERBAHAYA';
  }
  if (/tanpa|tidak adanya|meningkatkan kemungkinan|meningkatkan risiko|berisiko/.test(nilai)) {
    return 'BAHAYA UTAMA';
  }
  
  const defaultLabels = [
    'MENGAPA KONDISI INI BERBAHAYA',
    'DAMPAK YANG DAPAT TERJADI',
    'FAKTOR YANG MEMPERBESAR RISIKO',
    'VERIFIKASI SEBELUM BEKERJA'
  ];
  return defaultLabels[indeks % defaultLabels.length];
}

function buatDataAnalisisRisiko(teks) {
  const { judul, kalimat } = pecahKalimatAnalisisRisiko(teks);
  if (kalimat.length === 0) return { judul, ringkasan: '', poin: [] };

  return {
    judul,
    ringkasan: kalimat[0],
    poin: kalimat.slice(1).map((isi, indeks) => ({
      label: labelPoinAnalisisRisiko(isi, indeks),
      isi
    }))
  };
}

function buatHtmlAnalisisRisiko(teks, indeksKelompok) {
  const { judul, ringkasan, poin } = buatDataAnalisisRisiko(teks);
  if (!ringkasan) return '';

  const poinHtml = poin.map(item => `
    <div class="res-analysis-point">
      <span>${sanitasiHtml(item.label)}</span>
      <p>${sanitasiHtml(item.isi)}</p>
    </div>
  `).join('');

  return `
    <section class="res-analysis-case">
      ${judul ? `<div class="res-analysis-heading">${sanitasiHtml(judul)}</div>` : (indeksKelompok > 0 ? `<div class="res-analysis-heading">Analisis Tambahan</div>` : '')}
      <div class="res-analysis-summary">
        <span aria-hidden="true"></span>
        <p>${sanitasiHtml(ringkasan)}</p>
      </div>
      ${poinHtml ? `<div class="res-analysis-points">${poinHtml}</div>` : ''}
    </section>
  `;
}

/**
 * Memformat string teks respons menjadi HTML visual terstruktur
 */
export function formatHtmlResponsTerstruktur(teksMentah) {
  if (!teksMentah) return '';

  const bagian = {
    pertanyaan: '',
    jawaban: [],
    kondisi: [],
    risiko: '',
    penjelasan: [],
    solusi: [],
    rekomendasi: [],
    referensi: [],
    status: ''
  };

  const barisBaris = String(teksMentah).split('\n');
  let bagianSaatIni = '';
  let adaBagianTerstruktur = false;

  barisBaris.forEach(b => {
    const pangkas = b.trim();
    if (!pangkas) return;

    if (pangkas.startsWith('PERTANYAAN / LAPORAN ANDA') || pangkas.startsWith('**PERTANYAAN / LAPORAN ANDA**')) {
      bagianSaatIni = 'pertanyaan';
      adaBagianTerstruktur = true;
    } else if (pangkas.startsWith('JAWABAN LANGSUNG') || pangkas.startsWith('**JAWABAN LANGSUNG')) {
      bagianSaatIni = 'jawaban';
      adaBagianTerstruktur = true;
    } else if (pangkas.startsWith('KONDISI TERIDENTIFIKASI') || pangkas.startsWith('**KONDISI TERIDENTIFIKASI**')) {
      bagianSaatIni = 'kondisi';
      adaBagianTerstruktur = true;
    } else if (pangkas.startsWith('TINGKAT RISIKO') || pangkas.startsWith('**TINGKAT RISIKO**')) {
      bagianSaatIni = 'risiko';
      adaBagianTerstruktur = true;
    } else if (pangkas.startsWith('PENJELASAN RISIKO') || pangkas.startsWith('**PENJELASAN RISIKO**')) {
      bagianSaatIni = 'penjelasan';
      adaBagianTerstruktur = true;
    } else if (pangkas.startsWith('SOLUSI & TINDAKAN') || pangkas.startsWith('**SOLUSI & TINDAKAN**')) {
      bagianSaatIni = 'solusi';
      adaBagianTerstruktur = true;
    } else if (pangkas.startsWith('REKOMENDASI K3') || pangkas.startsWith('**REKOMENDASI K3**')) {
      bagianSaatIni = 'rekomendasi';
      adaBagianTerstruktur = true;
    } else if (pangkas.startsWith('REFERENSI KNOWLEDGE BASE') || pangkas.startsWith('**REFERENSI KNOWLEDGE BASE**')) {
      bagianSaatIni = 'referensi';
      adaBagianTerstruktur = true;
    } else if (pangkas.startsWith('STATUS PENANGANAN') || pangkas.startsWith('**STATUS PENANGANAN**')) {
      bagianSaatIni = 'status';
      adaBagianTerstruktur = true;
    } else {
      if (bagianSaatIni === 'pertanyaan') {
        bagian.pertanyaan += (bagian.pertanyaan ? ' ' : '') + pangkas;
      } else if (bagianSaatIni === 'jawaban') {
        bagian.jawaban.push(pangkas);
      } else if (bagianSaatIni === 'kondisi') {
        bagian.kondisi.push(pangkas);
      } else if (bagianSaatIni === 'risiko') {
        bagian.risiko += (bagian.risiko ? ' ' : '') + pangkas;
      } else if (bagianSaatIni === 'penjelasan') {
        bagian.penjelasan.push(pangkas);
      } else if (bagianSaatIni === 'solusi') {
        bagian.solusi.push(pangkas);
      } else if (bagianSaatIni === 'rekomendasi') {
        bagian.rekomendasi.push(pangkas);
      } else if (bagianSaatIni === 'referensi') {
        bagian.referensi.push(pangkas);
      } else if (bagianSaatIni === 'status') {
        bagian.status += (bagian.status ? ' ' : '') + pangkas;
      }
    }
  });

  if (!adaBagianTerstruktur) {
    // Markdown sederhana jika bukan format terstruktur
    return String(teksMentah)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  let html = `<div class="res-card-block">`;

  // 1. Pertanyaan Pelapor
  if (bagian.pertanyaan) {
    html += `
      <div class="res-question-block" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 8px;">
        <strong style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 3px;">Pertanyaan / Laporan Anda</strong>
        <p style="margin: 0; font-size: 13.5px; color: #1e293b; font-weight: 500;">${sanitasiHtml(bagian.pertanyaan)}</p>
      </div>
    `;
  }

  // 2. Jawaban Langsung
  if (bagian.jawaban.length > 0) {
    html += `
      <div class="res-direct-answer" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 14px; margin-bottom: 8px;">
        <div style="color: #166534; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
          🛡️ Jawaban Langsung & Arahan Utama
        </div>
        ${bagian.jawaban.map(item => `<p style="margin: 0 0 6px 0; font-size: 13.5px; color: #14532d; line-height: 1.5;">${sanitasiHtml(item)}</p>`).join('')}
      </div>
    `;
  }

  // 3. Kondisi Teridentifikasi
  if (bagian.kondisi.length > 0) {
    const kondisiTeksHtml = bagian.kondisi.map(k => {
      const kClean = sanitasiHtml(k);
      return `<div style="font-size: 13px; color: #0369a1; padding: 2px 0;">${kClean}</div>`;
    }).join('');

    html += `
      <div class="res-header-badge">
        <span class="res-block-icon" style="font-size: 16px;">🔍</span>
        <div>
          <strong>KONDISI TERIDENTIFIKASI</strong>
          <div class="res-block-content">${kondisiTeksHtml}</div>
        </div>
      </div>
    `;
  }

  // 4. Tingkat Risiko Badge
  if (bagian.risiko) {
    const adalahTinggi = bagian.risiko.toUpperCase().includes('TINGGI');
    const adalahSedang = bagian.risiko.toUpperCase().includes('SEDANG');
    const kelasLencana = adalahTinggi ? 'status-need-tech' : (adalahSedang ? 'status-user-try' : '');
    html += `
      <div class="res-risk-wrap">
        <span class="res-status-badge ${kelasLencana}">
          ${sanitasiHtml(bagian.risiko)}
        </span>
      </div>
    `;
  }

  // 5. Penjelasan Risiko (Grid 2x2: Mengapa Berbahaya, Dampak, Faktor, Verifikasi)
  if (bagian.penjelasan.length > 0) {
    const pFilt = bagian.penjelasan.filter(p => p.trim() !== '' && p.trim() !== '-');
    if (pFilt.length > 0) {
      const paragrafPenjelasan = pFilt.map(buatHtmlAnalisisRisiko).join('');

      html += `
        <div class="res-analysis-block">
          <div class="res-section-heading">
            <span class="res-section-icon" style="font-size: 16px;">⚠️</span>
            <div>
              <div class="res-section-title">Penjelasan Risiko & Analisis Bahaya</div>
              <small>Dianalisis berdasarkan matriks kepatuhan K3 Pertamina EP Lirik Field</small>
            </div>
          </div>
          ${paragrafPenjelasan}
        </div>
      `;
    }
  }

  // 6. Solusi & Tindakan Keselamatan
  if (bagian.solusi.length > 0) {
    const sFilt = bagian.solusi.filter(s => s.trim() !== '' && s.trim() !== '-');
    if (sFilt.length > 0) {
      const itemSolusiHtml = sFilt.map(s => {
        if (s.startsWith('---')) {
          const judulKelompok = sanitasiHtml(s.replace(/^---\s*/, '').replace(/\s*---$/, ''));
          return `<li class="res-solution-heading">${judulKelompok}</li>`;
        }
        return `<li class="res-solution-item">${sanitasiHtml(s)}</li>`;
      }).join('');

      html += `
        <div class="res-solution-block">
          <div class="res-section-title">Solusi dan Tindakan Keselamatan</div>
          <ul class="res-causes-list">
            ${itemSolusiHtml}
          </ul>
        </div>
      `;
    }
  }

  // 7. Rekomendasi K3
  if (bagian.rekomendasi.length > 0) {
    const rFilt = bagian.rekomendasi.filter(r => r.trim() !== '' && r.trim() !== '-');
    if (rFilt.length > 0) {
      const itemRekomendasiHtml = rFilt.map(r => `<div class="res-recommendation-item" style="padding: 2px 0;">${sanitasiHtml(r)}</div>`).join('');
      html += `
        <div class="res-rule-callout">
          <strong>Rekomendasi Standar K3 & Penanggung Jawab</strong>
          <div style="margin-top: 4px;">${itemRekomendasiHtml}</div>
        </div>
      `;
    }
  }

  // 8. Referensi Knowledge Base (dengan link resmi)
  if (bagian.referensi.length > 0) {
    const itemReferensi = bagian.referensi
      .filter(item => item.trim() && item.trim() !== '-')
      .map(item => `<li>${formatReferensiHtml(item)}</li>`)
      .join('');
    if (itemReferensi) {
      html += `
        <div class="res-reference-block" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-top: 8px;">
          <div class="res-section-title" style="color: #0f172a; margin-bottom: 2px;">REFERENSI KNOWLEDGE BASE</div>
          <div class="res-reference-source" style="font-size: 11px; color: #64748b; margin-bottom: 8px;">Sumber: knowledge.json</div>
          <ol style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: #334155;">${itemReferensi}</ol>
        </div>
      `;
    }
  }

  // 9. Status Penanganan
  if (bagian.status) {
    const statusKecil = bagian.status.toLowerCase();
    const butuhHsse = statusKecil.includes('segera') || statusKecil.includes('tim hsse') || statusKecil.includes('lapangan');
    html += `
      <div style="margin-top: 8px;">
        <span class="res-status-badge ${butuhHsse ? 'status-need-tech' : 'status-user-try'}">
          Status penanganan: ${sanitasiHtml(bagian.status)}
        </span>
      </div>
    `;
  }

  html += `</div>`;
  return html;
}
