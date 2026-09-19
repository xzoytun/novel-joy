(() => {
  'use strict';

  const KEY = 'sakukita:v1';
  const APP_VERSION = '1.0';
  const CATS = {
    out: [['Makan','🍜'],['Transport','🛵'],['Belanja','🛍'],['Tagihan','💡'],['Hiburan','🎮'],['Kesehatan','💊'],['Pendidikan','📚'],['Lainnya','📦']],
    in: [['Gaji','💼'],['Bonus','🎁'],['Usaha','🏪'],['Kiriman','💌'],['Lainnya','💰']]
  };
  const EMOJI = Object.fromEntries([...CATS.out, ...CATS.in, ['Transfer','🔄']]);

  const TASK_CATS = [['Kerja','#4285F4'],['Belajar','#9C27B0'],['Pribadi','#FF9800'],['Keluarga','#E91E63'],['Lainnya','#607D8B']];
  const TASK_COLOR = Object.fromEntries(TASK_CATS);
  const TASK_EMOJI = { Kerja:'💼', Belajar:'📚', Pribadi:'🙋', Keluarga:'👨‍👩‍👧', Lainnya:'📌' };
  const TASK_TO_TX_CAT = { Kerja:'Lainnya', Belajar:'Pendidikan', Pribadi:'Lainnya', Keluarga:'Lainnya', Lainnya:'Lainnya' };

  const ROUTINE_CATS = [
    ['Tidur','😴','#5E6AD2'],['Belajar','📚','#9C27B0'],['Kerja','💼','#4285F4'],
    ['Olahraga','🏃','#1F8A70'],['Makan','🍽','#FF9800'],['Santai','🎮','#E91E63'],
    ['Persiapan','🚿','#00BCD4'],['Lainnya','📌','#607D8B']
  ];
  const RCOLOR = Object.fromEntries(ROUTINE_CATS.map(c => [c[0], c[2]]));
  const REMOJI = Object.fromEntries(ROUTINE_CATS.map(c => [c[0], c[1]]));
  const ROUTINE_TO_TX_CAT = { Makan:'Makan', Olahraga:'Kesehatan', Belajar:'Pendidikan', Kerja:'Lainnya', Tidur:'Lainnya', Santai:'Hiburan', Persiapan:'Lainnya', Lainnya:'Lainnya' };

  const DOW = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

  const ROUTINE_TEMPLATES = {
    pelajar: {
      name: '🎒 Pelajar',
      desc: 'Sekolah pagi + belajar sore. Sen–Jum.',
      items: [
        { title:'Bangun & mandi', cat:'Persiapan', start:'05:30', end:'06:00', days:[1,2,3,4,5] },
        { title:'Sarapan', cat:'Makan', start:'06:00', end:'06:30', days:[1,2,3,4,5], cost:15000 },
        { title:'Sekolah', cat:'Belajar', start:'07:00', end:'14:00', days:[1,2,3,4,5] },
        { title:'Istirahat', cat:'Santai', start:'14:00', end:'15:30', days:[1,2,3,4,5] },
        { title:'Belajar', cat:'Belajar', start:'16:00', end:'17:30', days:[1,2,3,4,5] },
        { title:'Makan malam', cat:'Makan', start:'19:00', end:'19:45', days:[0,1,2,3,4,5,6], cost:25000 },
        { title:'Belajar / tugas', cat:'Belajar', start:'20:00', end:'22:00', days:[0,1,2,3,4,5,6] },
        { title:'Tidur', cat:'Tidur', start:'22:30', end:'05:30', days:[0,1,2,3,4,5,6] }
      ]
    },
    pekerja: {
      name: '💼 Pekerja kantoran',
      desc: 'Jam kerja 9–5 dengan olahraga pagi. Sen–Jum.',
      items: [
        { title:'Bangun', cat:'Persiapan', start:'05:30', end:'06:00', days:[1,2,3,4,5] },
        { title:'Olahraga', cat:'Olahraga', start:'06:00', end:'06:30', days:[1,2,3,4,5] },
        { title:'Mandi & sarapan', cat:'Persiapan', start:'06:30', end:'07:15', days:[1,2,3,4,5] },
        { title:'Berangkat kerja', cat:'Persiapan', start:'07:15', end:'08:00', days:[1,2,3,4,5], cost:15000 },
        { title:'Kerja', cat:'Kerja', start:'08:00', end:'12:00', days:[1,2,3,4,5] },
        { title:'Makan siang', cat:'Makan', start:'12:00', end:'13:00', days:[1,2,3,4,5], cost:25000 },
        { title:'Kerja', cat:'Kerja', start:'13:00', end:'17:00', days:[1,2,3,4,5] },
        { title:'Pulang', cat:'Persiapan', start:'17:00', end:'18:00', days:[1,2,3,4,5], cost:15000 },
        { title:'Istirahat', cat:'Santai', start:'18:00', end:'19:00', days:[0,1,2,3,4,5,6] },
        { title:'Makan malam', cat:'Makan', start:'19:00', end:'19:45', days:[0,1,2,3,4,5,6], cost:25000 },
        { title:'Waktu bebas', cat:'Santai', start:'20:00', end:'22:00', days:[0,1,2,3,4,5,6] },
        { title:'Tidur', cat:'Tidur', start:'22:30', end:'05:30', days:[0,1,2,3,4,5,6] }
      ]
    },
    freelancer: {
      name: '🧑‍💻 Freelancer',
      desc: 'Jam fleksibel, olahraga & deep work. Tiap hari.',
      items: [
        { title:'Bangun', cat:'Persiapan', start:'06:00', end:'06:30', days:[0,1,2,3,4,5,6] },
        { title:'Olahraga pagi', cat:'Olahraga', start:'06:30', end:'07:30', days:[0,1,2,3,4,5,6] },
        { title:'Sarapan & santai', cat:'Makan', start:'07:30', end:'08:30', days:[0,1,2,3,4,5,6], cost:20000 },
        { title:'Deep work', cat:'Kerja', start:'09:00', end:'12:00', days:[0,1,2,3,4,5,6] },
        { title:'Makan siang', cat:'Makan', start:'12:00', end:'13:00', days:[0,1,2,3,4,5,6], cost:25000 },
        { title:'Kerja', cat:'Kerja', start:'13:00', end:'15:00', days:[0,1,2,3,4,5,6] },
        { title:'Istirahat', cat:'Santai', start:'15:00', end:'16:00', days:[0,1,2,3,4,5,6] },
        { title:'Meeting / klien', cat:'Kerja', start:'16:00', end:'18:00', days:[1,2,3,4,5] },
        { title:'Olahraga sore', cat:'Olahraga', start:'18:00', end:'19:00', days:[1,2,3,4,5] },
        { title:'Makan malam', cat:'Makan', start:'19:00', end:'20:00', days:[0,1,2,3,4,5,6], cost:25000 },
        { title:'Belajar / hobi', cat:'Belajar', start:'20:00', end:'22:30', days:[0,1,2,3,4,5,6] },
        { title:'Tidur', cat:'Tidur', start:'22:30', end:'06:00', days:[0,1,2,3,4,5,6] }
      ]
    }
  };

  const ICON_MOON = '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
  const ICON_SUN = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const ICON_CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5 10 17l9-10"/></svg>';

  // ---------- Utilities ----------
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const todayStr = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  };
  const $ = (id) => document.getElementById(id);
  const rp = (n) => (n < 0 ? '-' : '') + 'Rp ' + Math.abs(Math.round(n)).toLocaleString('id-ID');
  const digits = (s) => Number(String(s).replace(/\D/g,'')) || 0;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const monthKey = (ds) => ds.slice(0,7);
  const thisMonth = () => todayStr().slice(0,7);
  const t2m = (t) => { const [h,m] = t.split(':').map(Number); return h*60+m; };
  const m2t = (m) => String(Math.floor(m/60)%24).padStart(2,'0') + ':' + String(m%60).padStart(2,'0');

  function addMonth(mk, n) {
    let [y,m] = mk.split('-').map(Number);
    m += n;
    y += Math.floor((m-1)/12);
    m = ((m-1)%12+12)%12+1;
    return y + '-' + String(m).padStart(2,'0');
  }
  function addDays(ds, n) {
    const [y,m,d] = ds.split('-').map(Number);
    const dt = new Date(y, m-1, d);
    dt.setDate(dt.getDate()+n);
    return dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2,'0') + '-' + String(dt.getDate()).padStart(2,'0');
  }
  function daysInMonth(mk) {
    const [y,m] = mk.split('-').map(Number);
    return new Date(y, m, 0).getDate();
  }
  function daysBetween(a, b) {
    const [y1,m1,d1] = a.split('-').map(Number);
    const [y2,m2,d2] = b.split('-').map(Number);
    return Math.round(Math.abs(new Date(y2,m2-1,d2) - new Date(y1,m1-1,d1)) / 86400000);
  }
  function monthLabel(mk) {
    const [y,m] = mk.split('-').map(Number);
    return new Date(y, m-1, 1).toLocaleDateString('id-ID', {month:'long', year:'numeric'});
  }
  function dayLabel(ds) {
    const t = todayStr();
    if (ds === t) return 'Hari ini';
    if (ds === addDays(t,-1)) return 'Kemarin';
    if (ds === addDays(t,1)) return 'Besok';
    const [y,m,d] = ds.split('-').map(Number);
    return new Date(y, m-1, d).toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long'});
  }
  const todayDayOfWeek = (ds) => {
    const [y,m,d] = ds.split('-').map(Number);
    return new Date(y, m-1, d).getDay();
  };
  const rStartMin = (r) => t2m(r.start);
  const rEndMin = (r) => { const s = t2m(r.start), e = t2m(r.end); return e <= s ? e + 1440 : e; };
  const rDuration = (r) => rEndMin(r) - rStartMin(r);

  function hashPin(pin) {
    let h = 5381;
    const s = 'sakukita-pin-salt-v1|' + String(pin);
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) + h) + s.charCodeAt(i);
      h = h | 0;
    }
    return (h >>> 0).toString(36);
  }

  let toastTimer;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  // ---------- Storage ----------
  function defaults() {
    return {
      theme: 'light', budget: 0, catBudgets: {},
      wallets: [
        { id:'w_tunai', name:'Tunai', start:0 },
        { id:'w_bank', name:'Bank', start:0 }
      ],
      tx: [], recurring: [],
      tasks: [], taskRec: [],
      routines: [], routineLog: {}, routineExpense: {},
      notified: {},
      pinHash: null,
      lastBackup: null
    };
  }
  let db;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      db = raw ? Object.assign(defaults(), JSON.parse(raw)) : defaults();
      if (!db.catBudgets || typeof db.catBudgets !== 'object') db.catBudgets = {};
      if (!Array.isArray(db.recurring)) db.recurring = [];
      if (!Array.isArray(db.tasks)) db.tasks = [];
      if (!Array.isArray(db.taskRec)) db.taskRec = [];
      if (!Array.isArray(db.routines)) db.routines = [];
      if (!db.routineLog || typeof db.routineLog !== 'object') db.routineLog = {};
      if (!db.routineExpense || typeof db.routineExpense !== 'object') db.routineExpense = {};
      if (!db.notified || typeof db.notified !== 'object') db.notified = {};
    } catch (e) { db = defaults(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { toast('Gagal menyimpan. Penyimpanan browser penuh atau diblokir.'); }
  }

  // ---------- Wallets ----------
  function walletDelta(t, w) {
    if (t.type === 'in') return t.wallet === w.id ? t.amount : 0;
    if (t.type === 'out') return t.wallet === w.id ? -t.amount : 0;
    if (t.type === 'transfer') {
      let d = 0;
      if (t.wallet === w.id) d -= t.amount;
      if (t.toWallet === w.id) d += t.amount;
      return d;
    }
    return 0;
  }
  const walletBalance = (w) => db.tx.reduce((s,t) => s + walletDelta(t,w), w.start);
  const walletName = (id) => (db.wallets.find(w => w.id === id) || { name:'Dompet dihapus' }).name;

  // ---------- Recurring transactions ----------
  function runRecurring() {
    const today = todayStr();
    const cur = thisMonth();
    let created = 0;
    db.recurring.forEach((r) => {
      let m = addMonth(r.lastRun || cur, 1);
      let guard = 0;
      while (m <= cur && guard++ < 36) {
        const day = Math.min(r.day, daysInMonth(m));
        const ds = m + '-' + String(day).padStart(2,'0');
        if (ds > today) break;
        db.tx.push({ id:uid(), type:r.type, cat:r.cat, wallet:r.wallet, amount:r.amount, note:r.note, date:ds, rec:r.id });
        created++;
        r.lastRun = m;
        m = addMonth(m, 1);
      }
    });
    return created;
  }

  // ---------- Recurring tasks ----------
  function matchTaskRec(r, ds) {
    const d = todayDayOfWeek(ds);
    if (r.freq === 'daily') return true;
    if (r.freq === 'weekly') return d === r.dow;
    if (r.freq === 'monthly') {
      const dim = daysInMonth(ds.slice(0,7));
      return Number(ds.slice(-2)) === Math.min(r.dom, dim);
    }
    return false;
  }
  function runTaskRecurring() {
    const today = todayStr();
    let created = 0;
    db.taskRec.forEach((r) => {
      if (!r.lastRun) r.lastRun = addDays(today, -1);
      let cur = addDays(r.lastRun, 1);
      let guard = 0;
      while (cur <= today && guard++ < 400) {
        if (matchTaskRec(r, cur)) {
          const exists = db.tasks.some(t => t.rec === r.id && t.date === cur);
          if (!exists) {
            db.tasks.push({ id:uid(), title:r.title, date:cur, time:r.time||'', done:false, cost:r.cost||0, cat:r.cat, wallet:r.wallet, rec:r.id });
            created++;
          }
        }
        cur = addDays(cur, 1);
      }
      r.lastRun = today;
    });
    return created;
  }

  // ---------- Routines ----------
  const routinesForDay = (ds) => {
    const d = todayDayOfWeek(ds);
    return db.routines.filter(r => r.days.includes(d));
  };
  const routineDone = (ds) => db.routineLog[ds] || [];
  function isRoutineDone(ds, id) { return routineDone(ds).includes(id); }
  function toggleRoutineDone(ds, id, val) {
    const arr = db.routineLog[ds] || [];
    const i = arr.indexOf(id);
    if (val && i < 0) arr.push(id);
    if (!val && i >= 0) arr.splice(i, 1);
    if (arr.length) db.routineLog[ds] = arr; else delete db.routineLog[ds];
  }
  function routineActiveNow(r, nowMin) {
    const s = rStartMin(r), e = rEndMin(r);
    if (nowMin >= s && nowMin < e) return { active:true, remain: e - nowMin };
    if (rEndMin(r) > 1440 && nowMin < (e - 1440)) return { active:true, remain: e - 1440 - nowMin };
    return { active:false, remain:0 };
  }
  function detectConflicts(routines) {
    const out = [];
    for (let i = 0; i < routines.length; i++) {
      for (let j = i+1; j < routines.length; j++) {
        const a = routines[i], b = routines[j];
        if (!a.days.some(d => b.days.includes(d))) continue;
        const as = rStartMin(a), ae = rEndMin(a);
        const bs = rStartMin(b), be = rEndMin(b);
        if (as < be && bs < ae) out.push([a, b]);
      }
    }
    return out;
  }
  function computeStreak() {
    const t = todayStr();
    let streak = 0;
    const todayRs = routinesForDay(t);
    if (todayRs.length && routineDone(t).length >= todayRs.length) streak = 1;
    let check = addDays(t, -1);
    let guard = 0;
    while (guard++ < 400) {
      const rs = routinesForDay(check);
      if (!rs.length) break;
      if (routineDone(check).length >= rs.length) { streak++; check = addDays(check, -1); }
      else break;
    }
    return streak;
  }

  // ---------- Render: transactions ----------
  function txRow(t) {
    if (t.type === 'transfer') {
      return `<button class="tx" data-id="${t.id}">
        <div class="emoji">🔄</div>
        <div class="meta"><b>${esc(t.note || 'Transfer')}</b><small>${esc(walletName(t.wallet))} → ${esc(walletName(t.toWallet))}${t.rec ? ' • 🔁' : ''}</small></div>
        <div class="amt">${rp(t.amount)}</div></button>`;
    }
    const emoji = EMOJI[t.cat] || '📦';
    const sign = t.type === 'in' ? '+' : '-';
    return `<button class="tx" data-id="${t.id}">
      <div class="emoji">${emoji}</div>
      <div class="meta"><b>${esc(t.note || t.cat)}</b><small>${esc(t.cat)} • ${esc(walletName(t.wallet))}${t.rec ? ' • 🔁' : ''}</small></div>
      <div class="amt ${t.type}">${sign}${rp(t.amount)}</div></button>`;
  }
  function groupedList(list) {
    const sorted = [...list].sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    const g = {};
    sorted.forEach(t => (g[t.date] = g[t.date] || []).push(t));
    return Object.keys(g).map(d => `<div class="tx-group"><div class="tx-date">${dayLabel(d)}</div>${g[d].map(txRow).join('')}</div>`).join('');
  }
  const emptyBox = `<div class="empty"><b>Belum ada transaksi</b>Tekan tombol + buat catat pengeluaran atau pemasukan pertamamu.</div>`;
  const emptySearch = `<div class="empty"><b>Nggak ketemu</b>Coba kata kunci atau filter lain.</div>`;

  function renderMonthBars() {
    document.querySelectorAll('[data-mlabel]').forEach(el => el.textContent = monthLabel(viewMonth));
    const atNow = viewMonth >= thisMonth();
    document.querySelectorAll('[data-mv="1"]').forEach(b => b.disabled = atNow);
  }
  function renderDayBars() {
    document.querySelectorAll('[data-dlabel]').forEach(el => el.textContent = dayLabel(scheduleDate));
    const atNow = scheduleDate >= todayStr();
    document.querySelectorAll('[data-dv="1"]').forEach(b => b.disabled = atNow);
  }

  function renderBackupReminder() {
    const t = todayStr();
    let show = false, days = 0;
    if (!db.lastBackup) show = db.tx.length > 0;
    else {
      days = daysBetween(db.lastBackup, t);
      show = days >= 14;
    }
    if (!show) { $('backupReminder').innerHTML = ''; return; }
    const txt = !db.lastBackup ? 'Kamu belum pernah unduh backup.' : `Terakhir backup: ${days} hari lalu.`;
    $('backupReminder').innerHTML = `<div class="banner-warn">
      <span class="ico">💾</span>
      <div style="flex:1">
        <b>Waktunya backup</b>
        <small>${txt} Buka Laporan → Kelola data buat unduh file JSON.</small>
      </div>
    </div>`;
  }

  function renderHome() {
    const total = db.wallets.reduce((s,w) => s + walletBalance(w), 0);
    const m = viewMonth;
    const mtx = db.tx.filter(t => monthKey(t.date) === m && t.type !== 'transfer');
    const mIn = mtx.filter(t => t.type === 'in').reduce((s,t) => s + t.amount, 0);
    const mOut = mtx.filter(t => t.type === 'out').reduce((s,t) => s + t.amount, 0);

    $('totalBalance').textContent = rp(total);
    $('monthIn').textContent = rp(mIn);
    $('monthOut').textContent = rp(mOut);

    $('walletList').innerHTML = db.wallets.map(w =>
      `<div class="wallet"><small>${esc(w.name)}</small><b>${rp(walletBalance(w))}</b></div>`
    ).join('');

    renderBackupReminder();

    const td = todayStr();
    const routines = routinesForDay(td).sort((a,b) => rStartMin(a) - rStartMin(b));
    const now = new Date();
    const nowMin = now.getHours()*60 + now.getMinutes();
    let current = null, remainMin = 0;
    for (const r of routines) {
      const a = routineActiveNow(r, nowMin);
      if (a.active) { current = r; remainMin = a.remain; break; }
    }
    let next = null;
    for (const r of routines) if (rStartMin(r) > nowMin) { next = r; break; }
    const tasks = db.tasks.filter(t => t.date === td);
    const doneTasks = tasks.filter(t => t.done).length;
    const taskCost = tasks.filter(t => !t.expenseId && t.cost > 0).reduce((s,t) => s + t.cost, 0);
    const routineCost = routines.filter(r => !db.routineExpense[td+':'+r.id] && r.cost > 0).reduce((s,r) => s + r.cost, 0);
    const totalCost = taskCost + routineCost;

    const c = $('todayCard');
    let html = '';
    if (current) {
      html += `<div class="nowblock"><span class="nowdot"></span><div><b>${esc(current.title)}</b><small>sisa ${remainMin} menit • ${current.start}–${current.end}</small></div></div>`;
    } else if (routines.length) {
      html += `<div class="nowblock free"><span class="nowdot"></span><div><b>Sedang bebas</b><small>Nggak ada rutinitas aktif sekarang</small></div></div>`;
    } else {
      html += `<div class="nowblock free"><span class="nowdot"></span><div><b>Belum ada rutinitas</b><small>Buka tab Jadwal buat nyusun harianmu</small></div></div>`;
    }
    if (next) html += `<div class="nextline">⏭ Berikutnya: <b>${esc(next.title)}</b> jam ${next.start}</div>`;
    html += `<div class="divline"></div>`;
    html += `<div class="home-row"><span>Tugas hari ini</span><b>${doneTasks} / ${tasks.length}</b></div>`;
    if (totalCost > 0) html += `<div class="home-row"><span>Estimasi uang keluar</span><b>${rp(totalCost)}</b></div>`;
    c.innerHTML = html;

    const bc = $('budgetCard');
    if (!db.budget) {
      bc.innerHTML = `<div class="row"><span>Belum ada budget</span></div><p style="margin-top:0">Atur batas pengeluaran bulanan biar jajan nggak kebablasan.</p>`;
    } else {
      const pct = Math.round((mOut / db.budget) * 100);
      const cls = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : '';
      const left = db.budget - mOut;
      const msg = pct >= 100 ? `Udah lewat ${rp(-left)} dari budget. Tahan dulu jajannya.`
        : pct >= 80 ? `Hati-hati, ${pct}% budget udah kepake. Sisa ${rp(left)}.`
        : `Aman. Sisa ${rp(left)}.`;
      bc.innerHTML = `<div class="row"><b>${rp(mOut)}</b><span>dari ${rp(db.budget)}</span></div>
        <div class="bar"><i class="${cls}" style="width:${Math.min(pct,100)}%"></i></div><p>${msg}</p>`;
    }

    const recent = db.tx.filter(t => monthKey(t.date) === m)
      .sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0,5);
    $('recentList').innerHTML = recent.length ? recent.map(txRow).join('') : emptyBox;
  }

  let filter = 'all';
  let query = '';
  function renderHistory() {
    const opts = [['all','Semua'],['out','Keluar'],['in','Masuk'],['transfer','Transfer']];
    $('filterChips').innerHTML = opts.map(([k,l]) => `<button class="chip ${filter===k?'on':''}" data-f="${k}">${l}</button>`).join('');
    let list = db.tx.filter(t => filter === 'all' || t.type === filter);
    if (query) {
      list = list.filter(t => {
        const hay = [t.note, t.cat, walletName(t.wallet), t.type === 'transfer' ? walletName(t.toWallet) : '', String(t.amount)].join(' ').toLowerCase();
        return hay.includes(query);
      });
    }
    $('historyList').innerHTML = list.length ? groupedList(list) : (query ? emptySearch : emptyBox);
  }

  function renderReport() {
    const m = viewMonth;
    const outs = db.tx.filter(t => t.type === 'out' && monthKey(t.date) === m);
    const total = outs.reduce((s,t) => s + t.amount, 0);
    const by = {};
    outs.forEach(t => (by[t.cat] = (by[t.cat] || 0) + t.amount));
    const rows = Object.entries(by).sort((a,b) => b[1]-a[1]);
    $('catBreakdown').innerHTML = rows.length
      ? rows.map(([c,v]) => {
          const p = total ? Math.round((v/total)*100) : 0;
          const b = db.catBudgets[c] || 0;
          let extra = '';
          if (b) {
            const left = b - v;
            const bp = Math.round((v/b)*100);
            const cls = bp >= 100 ? 'over' : bp >= 80 ? 'warn' : '';
            extra = `<div class="csmall ${cls}">Budget ${rp(b)} • ${left >= 0 ? 'sisa ' + rp(left) : 'lewat ' + rp(-left)}</div>`;
          }
          return `<div class="cat"><div class="head"><b>${EMOJI[c]||'📦'} ${esc(c)}</b><span>${rp(v)} • ${p}%</span></div><div class="bar"><i style="width:${p}%"></i></div>${extra}</div>`;
        }).join('')
      : `<div class="empty" style="border:0;padding:12px"><b>Belum ada pengeluaran</b>Nggak ada catatan pengeluaran di ${monthLabel(m)}.</div>`;

    $('recList').innerHTML = db.recurring.length
      ? db.recurring.map(r => `<div class="tx" style="cursor:default">
          <div class="emoji">🔁</div>
          <div class="meta"><b>${esc(r.note || r.cat)}</b><small>Tiap tgl ${r.day} • ${esc(walletName(r.wallet))} • ${r.type === 'in' ? '+' : '-'}${rp(r.amount)}</small></div>
          <button class="chip" data-delrec="${r.id}" style="color:var(--out)">Hapus</button>
        </div>`).join('')
      : `<div class="empty" style="border:0;padding:14px"><b>Belum ada transaksi berulang</b>Gaji, kos, atau langganan bisa dicatat otomatis tiap bulan.</div>`;
  }

  function taskRow(t) {
    const color = TASK_COLOR[t.cat] || '#607D8B';
    const parts = [];
    if (t.time) parts.push(`🕐 ${t.time}`);
    parts.push(`<span class="cat-dot" style="background:${color}"></span>${esc(t.cat)}`);
    if (t.rec) parts.push(`<span class="rec-badge">🔁 berulang</span>`);
    if (t.cost > 0) parts.push(`💰 ${rp(t.cost)}`);
    const actions = t.done
      ? (t.cost > 0 && !t.expenseId
          ? `<button class="task-action" data-record="${t.id}">💰 Catat jadi pengeluaran</button>`
          : (t.expenseId ? `<span class="task-recorded">✓ Sudah tercatat sebagai pengeluaran</span>` : ''))
      : '';
    return `<div class="task ${t.done?'done':''}" data-task="${t.id}">
      <button class="check" data-toggle="${t.id}" aria-label="Tandai selesai">${ICON_CHECK}</button>
      <div class="tmeta" data-edit="${t.id}">
        <b>${esc(t.title)}</b>
        <small>${parts.join(' • ')}</small>
        ${actions}
      </div>
    </div>`;
  }
  function recurringReminders(ds) {
    const dim = daysInMonth(ds.slice(0,7));
    const d = Number(ds.slice(-2));
    const out = [];
    db.recurring.forEach(r => {
      if (d === Math.min(r.day, dim)) {
        const already = db.tx.some(t => t.date === ds && t.note === r.note && t.amount === r.amount && t.type === r.type);
        if (!already) out.push(r);
      }
    });
    return out;
  }
  function renderTasksSegment() {
    const tasks = db.tasks.filter(t => t.date === scheduleDate).sort((a,b) => (a.time||'99').localeCompare(b.time||'99'));
    const reminders = recurringReminders(scheduleDate);
    const doneCount = tasks.filter(t => t.done).length;
    const totalCost = tasks.filter(t => !t.expenseId && t.cost > 0).reduce((s,t) => s + t.cost, 0);

    const pct = tasks.length ? Math.round((doneCount/tasks.length)*100) : 0;
    $('dayProgress').innerHTML = tasks.length
      ? `<div class="row"><b>${doneCount} dari ${tasks.length} selesai</b><span>${pct}%</span></div>
         <div class="bar"><i style="width:${pct}%"></i></div>
         ${totalCost ? `<p style="margin-top:10px;font-size:13px;color:var(--ink-soft)">Estimasi uang keluar: <b>${rp(totalCost)}</b></p>` : ''}`
      : `<div class="row"><b>Belum ada tugas</b><span>—</span></div><div class="bar"><i style="width:0%"></i></div>`;

    let html = '';
    if (reminders.length) {
      html += `<div class="task-group-title">Pengingat tagihan</div>`;
      html += reminders.map(r => `<div class="task-reminder">
        <div class="emoji">${r.type === 'in' ? '💰' : '💡'}</div>
        <div class="rmeta"><b>${esc(r.note || r.cat)}</b><small>Transaksi berulang • ${r.type === 'in' ? '+' : '-'}${rp(r.amount)} • ${esc(walletName(r.wallet))}</small></div>
      </div>`).join('');
    }
    if (tasks.length) {
      html += `<div class="task-group-title">${dayLabel(scheduleDate)}</div>`;
      html += tasks.map(taskRow).join('');
    } else if (!reminders.length) {
      html += `<div class="empty"><b>Belum ada tugas</b>Tekan tombol + buat tambah tugas di hari ini.</div>`;
    }
    $('taskList').innerHTML = html;

    $('taskRecList').innerHTML = db.taskRec.length
      ? db.taskRec.map(r => {
          const freq = r.freq === 'daily' ? 'Harian'
            : r.freq === 'weekly' ? 'Tiap ' + DOW[r.dow]
            : 'Tiap tgl ' + r.dom;
          const color = TASK_COLOR[r.cat] || '#607D8B';
          return `<div class="task" style="cursor:default">
            <div class="emoji" style="width:42px;height:42px;border-radius:13px;background:var(--paper);display:grid;place-items:center;font-size:20px;flex:none">${TASK_EMOJI[r.cat] || '📌'}</div>
            <div class="tmeta">
              <b>${esc(r.title)}</b>
              <small><span class="cat-dot" style="background:${color}"></span>${esc(r.cat)} • ${freq}${r.time ? ' • 🕐 ' + r.time : ''}${r.cost ? ' • 💰 ' + rp(r.cost) : ''}</small>
            </div>
            <button class="chip" data-deltr="${r.id}" style="color:var(--out)">Hapus</button>
          </div>`;
        }).join('')
      : `<div class="empty" style="border:0;padding:14px"><b>Belum ada kegiatan berulang</b>Olahraga pagi, minum vitamin, atau apapun yang rutin.</div>`;
  }

  function routineCardHtml(r, ds, nowMin, isToday) {
    const color = RCOLOR[r.cat] || '#607D8B';
    const emoji = REMOJI[r.cat] || '📌';
    const done = isRoutineDone(ds, r.id);
    const a = isToday ? routineActiveNow(r, nowMin) : { active:false, remain:0 };
    const durMin = rDuration(r);
    const durTxt = (durMin >= 60 ? Math.floor(durMin/60) + 'j ' : '') + (durMin % 60 ? (durMin%60) + 'm' : (durMin >= 60 ? '' : '0m'));
    const expKey = ds + ':' + r.id;
    const recorded = db.routineExpense[expKey];
    let inner = '';
    if (a.active) inner += `<div class="rnow">🔴 Sekarang • sisa ${a.remain} menit</div>`;
    if (done && r.cost > 0 && !recorded) inner += `<button class="task-action" data-rrec="${r.id}" data-rdate="${ds}">💰 Catat pengeluaran</button>`;
    if (recorded) inner += `<span class="task-recorded">✓ Sudah tercatat sebagai pengeluaran</span>`;

    return `<div class="routine ${a.active?'active':''} ${done?'done':''}" data-routine="${r.id}" style="--rc:${color}">
      <div class="rtime"><b>${r.start}</b><span>${r.end}</span></div>
      <div class="rbody">
        <div class="rtitle"><span class="remoji">${emoji}</span><b>${esc(r.title)}</b></div>
        <small>${esc(r.cat)} • ${durTxt}${r.cost ? ' • 💰 ' + rp(r.cost) : ''}</small>
        ${inner}
      </div>
      <button class="check ${done?'on':''}" data-rtoggle="${r.id}" data-rdate="${ds}" aria-label="Tandai selesai">${ICON_CHECK}</button>
    </div>`;
  }

  function renderRoutinesSegment() {
    const ds = scheduleDate;
    const routines = routinesForDay(ds).sort((a,b) => rStartMin(a) - rStartMin(b));
    const isToday = ds === todayStr();
    const now = new Date();
    const nowMin = isToday ? now.getHours()*60 + now.getMinutes() : -1;

    const nc = $('nowCard');
    if (!routines.length || !isToday) nc.innerHTML = '';
    else {
      let cur = null, rem = 0;
      for (const r of routines) {
        const a = routineActiveNow(r, nowMin);
        if (a.active) { cur = r; rem = a.remain; break; }
      }
      let next = null;
      for (const r of routines) if (rStartMin(r) > nowMin) { next = r; break; }
      const timeTxt = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
      nc.innerHTML = `<div class="budget" style="padding:14px 16px;margin-bottom:12px">
        <div class="nowblock ${cur?'':'free'}">
          <span class="nowdot"></span>
          <div>
            <b>${cur ? esc(cur.title) : 'Sedang bebas'}</b>
            <small>${cur ? `sisa ${rem} menit • ${cur.start}–${cur.end}` : 'Nggak ada rutinitas aktif • ' + timeTxt}</small>
          </div>
        </div>
        ${next ? `<div class="nextline">⏭ Berikutnya: <b>${esc(next.title)}</b> jam ${next.start}</div>` : ''}
      </div>`;
    }

    const conflicts = detectConflicts(routines);
    const cb = $('conflictBox');
    if (conflicts.length) {
      cb.innerHTML = `<div class="conflict-warn">
        <b>⚠ Jadwal bentrok</b>
        <ul>${conflicts.map(([a,b]) => `<li>${esc(a.title)} <small>(${a.start}–${a.end})</small> tumpang tindih dengan ${esc(b.title)} <small>(${b.start}–${b.end})</small></li>`).join('')}</ul>
      </div>`;
    } else cb.innerHTML = '';

    if (!routines.length) {
      $('routineTimeline').innerHTML = `<div class="empty"><b>Belum ada rutinitas</b>Tekan tombol + buat tambah blok jam, atau pakai template di bawah.</div>`;
    } else {
      let html = '';
      let nowInserted = false;
      routines.forEach(r => {
        if (isToday && !nowInserted && rStartMin(r) > nowMin) {
          html += `<div class="nowline">SEKARANG</div>`;
          nowInserted = true;
        }
        html += routineCardHtml(r, ds, nowMin, isToday);
      });
      if (isToday && !nowInserted) html += `<div class="nowline">SEKARANG</div>`;
      $('routineTimeline').innerHTML = html;
    }

    if (routines.length) {
      const byCat = {};
      routines.forEach(r => { byCat[r.cat] = (byCat[r.cat] || 0) + rDuration(r); });
      const total = Object.values(byCat).reduce((a,b) => a+b, 0);
      const free = Math.max(0, 1440 - total);
      const entries = Object.entries(byCat).sort((a,b) => b[1]-a[1]);
      let html = `<div class="section" style="padding:18px 0 0"><h2 style="margin-bottom:10px">Ringkasan durasi</h2><div class="cats">`;
      entries.forEach(([cat, min]) => {
        const pct = Math.round((min/1440)*100);
        const h = Math.floor(min/60), m = min%60;
        html += `<div class="cat"><div class="head"><b>${REMOJI[cat]||'📌'} ${esc(cat)}</b><span>${h}j${m?' '+m+'m':''}</span></div><div class="bar"><i style="width:${pct}%;background:${RCOLOR[cat]||'#607D8B'}"></i></div></div>`;
      });
      if (free > 0) {
        const pct = Math.round((free/1440)*100);
        const h = Math.floor(free/60), m = free%60;
        html += `<div class="cat"><div class="head"><b>🕊 Waktu bebas</b><span>${h}j${m?' '+m+'m':''}</span></div><div class="bar"><i style="width:${pct}%;background:var(--line)"></i></div></div>`;
      }
      html += `</div></div>`;
      $('durationSummary').innerHTML = html;
    } else $('durationSummary').innerHTML = '';

    if (routines.length) {
      const s = computeStreak();
      $('streakBox').innerHTML = s > 0
        ? `<div class="streak-card"><span class="fire">🔥</span><div><b>${s} hari berturut-turut</b><small>Semua rutinitas diselesaikan penuh</small></div></div>`
        : `<div class="streak-card" style="background:linear-gradient(135deg,var(--paper),var(--paper));color:var(--ink);border:1px solid var(--line)"><span class="fire">🔥</span><div><b style="color:var(--ink)">Streak belum mulai</b><small style="color:var(--ink-soft)">Centang semua rutinitas hari ini buat mulai</small></div></div>`;
    } else $('streakBox').innerHTML = '';
  }

  function renderSchedule() {
    const seg = scheduleSeg;
    $('segRoutines').classList.toggle('hidden', seg !== 'routines');
    $('segTasks').classList.toggle('hidden', seg !== 'tasks');
    $('tplSection').classList.toggle('hidden', seg !== 'routines');
    $('taskRecSection').classList.toggle('hidden', seg !== 'tasks');
    document.querySelectorAll('#schedSeg button').forEach(b => b.classList.toggle('on', b.dataset.seg === seg));
    if (seg === 'routines') renderRoutinesSegment();
    else renderTasksSegment();
  }

  let viewMonth = thisMonth();
  let scheduleDate = todayStr();
  let scheduleSeg = 'routines';
  let currentView = 'Home';

  function renderAll() {
    renderMonthBars();
    renderDayBars();
    renderHome();
    renderHistory();
    renderReport();
    renderSchedule();
  }

  function showView(name) {
    currentView = name;
    ['Home','History','Schedule','Report'].forEach(v => $('view'+v).classList.toggle('hidden', v !== name));
    document.querySelectorAll('.nav button[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('.nav button[data-view]').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
  $('seeAll').addEventListener('click', () => showView('History'));
  $('goSchedule').addEventListener('click', () => showView('Schedule'));
  document.querySelectorAll('#schedSeg button').forEach(b => b.addEventListener('click', () => { scheduleSeg = b.dataset.seg; renderSchedule(); }));

  const openOv = (id) => $(id).classList.add('open');
  const closeOv = (id) => $(id).classList.remove('open');
  document.querySelectorAll('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')); });

  function bindMoneyInput(el) {
    el.addEventListener('input', () => {
      const n = digits(el.value);
      el.value = n ? n.toLocaleString('id-ID') : '';
    });
  }
  ['amountInput','budgetInput','newWalletBal','recAmount','taskCost','trCost','rCost'].forEach(id => bindMoneyInput($(id)));
  $('catBudgetList').addEventListener('input', e => {
    if (!e.target.classList.contains('binput')) return;
    const n = digits(e.target.value);
    e.target.value = n ? n.toLocaleString('id-ID') : '';
  });

  // ---------- Transaction sheet ----------
  let form = { id:null, type:'out', cat:'Makan', wallet:null, toWallet:null };
  function renderFormChips() {
    const isTf = form.type === 'transfer';
    $('catBlock').classList.toggle('hidden', isTf);
    $('toWalletBlock').classList.toggle('hidden', !isTf);
    $('walletLabel').textContent = isTf ? 'Dari dompet' : 'Dompet';
    if (!isTf) $('catChips').innerHTML = CATS[form.type].map(([n,e]) => `<button class="chip ${form.cat===n?'on':''}" data-cat="${n}">${e} ${n}</button>`).join('');
    $('walletChips').innerHTML = db.wallets.map(w => `<button class="chip ${form.wallet===w.id?'on':''}" data-w="${w.id}">${esc(w.name)}</button>`).join('');
    $('toWalletChips').innerHTML = db.wallets.map(w => `<button class="chip ${form.toWallet===w.id?'on':''}" data-tw="${w.id}">${esc(w.name)}</button>`).join('');
    document.querySelectorAll('#typeSeg button').forEach(b => { b.className = b.dataset.type === form.type ? 'on ' + form.type : ''; });
  }
  function openTx(tx) {
    if (!db.wallets.length) { toast('Tambah dompet dulu lewat ikon dompet di atas.'); return; }
    if (tx) {
      form = { id:tx.id, type:tx.type, cat:tx.cat || 'Makan', wallet:tx.wallet, toWallet:tx.toWallet || null };
      $('txTitle').textContent = 'Ubah transaksi';
      $('amountInput').value = tx.amount.toLocaleString('id-ID');
      $('noteInput').value = tx.note || '';
      $('dateInput').value = tx.date;
      $('deleteTx').classList.remove('hidden');
    } else {
      form = { id:null, type:'out', cat:'Makan', wallet:db.wallets[0].id, toWallet:db.wallets[1] ? db.wallets[1].id : null };
      $('txTitle').textContent = 'Catat transaksi';
      $('amountInput').value = ''; $('noteInput').value = '';
      $('dateInput').value = todayStr();
      $('deleteTx').classList.add('hidden');
    }
    renderFormChips();
    openOv('txOverlay');
    setTimeout(() => $('amountInput').focus(), 120);
  }
  $('typeSeg').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    form.type = b.dataset.type;
    if (form.type === 'transfer') {
      form.cat = 'Transfer';
      if (!form.toWallet || form.toWallet === form.wallet) {
        const other = db.wallets.find(w => w.id !== form.wallet);
        form.toWallet = other ? other.id : null;
      }
    } else form.cat = CATS[form.type][0][0];
    renderFormChips();
  });
  $('catChips').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (b) { form.cat = b.dataset.cat; renderFormChips(); } });
  $('walletChips').addEventListener('click', e => { const b = e.target.closest('[data-w]'); if (b) { form.wallet = b.dataset.w; renderFormChips(); } });
  $('toWalletChips').addEventListener('click', e => { const b = e.target.closest('[data-tw]'); if (b) { form.toWallet = b.dataset.tw; renderFormChips(); } });

  $('saveTx').addEventListener('click', () => {
    const amount = digits($('amountInput').value);
    if (!amount) { toast('Isi nominalnya dulu ya.'); $('amountInput').focus(); return; }
    if (!form.wallet) { toast('Pilih dompet dulu.'); return; }
    if (form.type === 'transfer') {
      if (!form.toWallet) { toast('Pilih dompet tujuan.'); return; }
      if (form.toWallet === form.wallet) { toast('Dompet asal dan tujuan nggak boleh sama.'); return; }
    }
    const date = $('dateInput').value || todayStr();
    const note = $('noteInput').value.trim();
    const payload = { type:form.type, wallet:form.wallet, amount, note, date };
    if (form.type === 'transfer') { payload.cat = 'Transfer'; payload.toWallet = form.toWallet; }
    else payload.cat = form.cat;
    if (form.id) {
      const t = db.tx.find(x => x.id === form.id);
      Object.assign(t, payload);
      if (form.type !== 'transfer') delete t.toWallet;
      toast('Transaksi diperbarui');
    } else {
      db.tx.push(Object.assign({ id:uid() }, payload));
      toast(form.type === 'in' ? 'Pemasukan tersimpan' : form.type === 'transfer' ? 'Transfer tersimpan' : 'Pengeluaran tersimpan');
    }
    save(); renderAll(); closeOv('txOverlay');
  });
  $('deleteTx').addEventListener('click', () => {
    if (!confirm('Hapus transaksi ini?')) return;
    db.tx = db.tx.filter(t => t.id !== form.id);
    save(); renderAll(); closeOv('txOverlay'); toast('Transaksi dihapus');
  });
  document.addEventListener('click', e => {
    const row = e.target.closest('.tx');
    if (row && row.dataset.id) { const t = db.tx.find(x => x.id === row.dataset.id); if (t) openTx(t); }
    const f = e.target.closest('[data-f]');
    if (f) { filter = f.dataset.f; renderHistory(); }
  });
  $('searchInput').addEventListener('input', e => { query = e.target.value.toLowerCase().trim(); renderHistory(); });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-mv]');
    if (!b || b.disabled) return;
    const next = addMonth(viewMonth, Number(b.dataset.mv));
    if (next > thisMonth()) return;
    viewMonth = next;
    renderAll();
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-dv]');
    if (!b || b.disabled) return;
    const next = addDays(scheduleDate, Number(b.dataset.dv));
    if (next > todayStr()) return;
    scheduleDate = next;
    renderDayBars(); renderSchedule();
  });
  $('todayBtn').addEventListener('click', () => { scheduleDate = todayStr(); renderDayBars(); renderSchedule(); });

  $('fab').addEventListener('click', () => {
    if (currentView === 'Schedule') {
      if (scheduleSeg === 'routines') openRoutineForm();
      else openTaskForm();
    } else openTx();
  });

  // ---------- Budget ----------
  $('editBudget').addEventListener('click', () => {
    $('budgetInput').value = db.budget ? db.budget.toLocaleString('id-ID') : '';
    $('catBudgetList').innerHTML = CATS.out.map(([n,e]) => {
      const v = db.catBudgets[n] || 0;
      return `<div class="brow"><span>${e} ${n}</span><input class="binput" data-cb="${n}" inputmode="numeric" placeholder="0" value="${v ? v.toLocaleString('id-ID') : ''}"></div>`;
    }).join('');
    openOv('budgetOverlay');
    setTimeout(() => $('budgetInput').focus(), 120);
  });
  $('saveBudget').addEventListener('click', () => {
    db.budget = digits($('budgetInput').value);
    const cb = {};
    $('catBudgetList').querySelectorAll('[data-cb]').forEach(inp => {
      const v = digits(inp.value);
      if (v) cb[inp.dataset.cb] = v;
    });
    db.catBudgets = cb;
    save(); renderAll(); closeOv('budgetOverlay');
    toast(db.budget || Object.keys(cb).length ? 'Budget disimpan' : 'Budget dimatikan');
  });

  // ---------- Wallets ----------
  function renderWalletManage() {
    $('walletManage').innerHTML = db.wallets.map(w => `<div class="tx" style="cursor:default">
      <div class="emoji">👛</div>
      <div class="meta"><b>${esc(w.name)}</b><small>Saldo ${rp(walletBalance(w))}</small></div>
      <button class="chip" data-delw="${w.id}" style="color:var(--out)">Hapus</button></div>`).join('')
      || '<p class="hint">Belum ada dompet.</p>';
  }
  $('walletNavBtn').addEventListener('click', () => { renderWalletManage(); openOv('walletOverlay'); });
  $('walletManage').addEventListener('click', e => {
    const b = e.target.closest('[data-delw]'); if (!b) return;
    const id = b.dataset.delw;
    const used = db.tx.some(t => t.wallet === id || t.toWallet === id) || db.tasks.some(t => t.wallet === id) || db.routines.some(r => r.wallet === id);
    if (!confirm(used ? 'Dompet ini punya data. Kalau dihapus, datanya ikut terhapus. Lanjut?' : 'Hapus dompet ini?')) return;
    db.wallets = db.wallets.filter(w => w.id !== id);
    db.tx = db.tx.filter(t => t.wallet !== id && t.toWallet !== id);
    db.recurring = db.recurring.filter(r => r.wallet !== id);
    db.tasks = db.tasks.filter(t => t.wallet !== id);
    db.taskRec = db.taskRec.filter(r => r.wallet !== id);
    save(); renderWalletManage(); renderAll(); toast('Dompet dihapus');
  });
  $('addWallet').addEventListener('click', () => {
    const name = $('newWalletName').value.trim();
    if (!name) { toast('Isi nama dompetnya dulu.'); return; }
    db.wallets.push({ id:'w_' + uid(), name, start:digits($('newWalletBal').value) });
    $('newWalletName').value = ''; $('newWalletBal').value = '';
    save(); renderWalletManage(); renderAll(); toast('Dompet ditambahkan');
  });

  // ---------- Recurring transactions ----------
  let recForm = { type:'out', cat:'Makan', wallet:null };
  function renderRecChips() {
    $('recCatChips').innerHTML = CATS[recForm.type].map(([n,e]) => `<button class="chip ${recForm.cat===n?'on':''}" data-rcat="${n}">${e} ${n}</button>`).join('');
    $('recWalletChips').innerHTML = db.wallets.map(w => `<button class="chip ${recForm.wallet===w.id?'on':''}" data-rw="${w.id}">${esc(w.name)}</button>`).join('');
    document.querySelectorAll('#recTypeSeg button').forEach(b => { b.className = b.dataset.rt === recForm.type ? 'on ' + recForm.type : ''; });
  }
  $('addRec').addEventListener('click', () => {
    if (!db.wallets.length) { toast('Tambah dompet dulu.'); return; }
    recForm = { type:'out', cat:'Makan', wallet:db.wallets[0].id };
    $('recAmount').value = ''; $('recNote').value = ''; $('recDay').value = 1;
    renderRecChips(); openOv('recOverlay');
    setTimeout(() => $('recAmount').focus(), 120);
  });
  $('recTypeSeg').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    recForm.type = b.dataset.rt; recForm.cat = CATS[recForm.type][0][0]; renderRecChips();
  });
  $('recCatChips').addEventListener('click', e => { const b = e.target.closest('[data-rcat]'); if (b) { recForm.cat = b.dataset.rcat; renderRecChips(); } });
  $('recWalletChips').addEventListener('click', e => { const b = e.target.closest('[data-rw]'); if (b) { recForm.wallet = b.dataset.rw; renderRecChips(); } });
  $('saveRec').addEventListener('click', () => {
    const amount = digits($('recAmount').value);
    if (!amount) { toast('Isi nominalnya dulu.'); $('recAmount').focus(); return; }
    if (!recForm.wallet) { toast('Pilih dompet dulu.'); return; }
    const day = Math.min(Math.max(parseInt($('recDay').value, 10) || 1, 1), 31);
    const cur = thisMonth();
    const dayNow = new Date().getDate();
    db.recurring.push({ id:uid(), type:recForm.type, cat:recForm.cat, wallet:recForm.wallet, amount, note:$('recNote').value.trim(), day, lastRun: day <= dayNow ? cur : addMonth(cur, -1) });
    save();
    const n = runRecurring();
    save(); renderAll(); closeOv('recOverlay');
    toast(n ? 'Berulang disimpan, ' + n + ' transaksi dicatat' : 'Transaksi berulang disimpan');
  });
  $('recList').addEventListener('click', e => {
    const b = e.target.closest('[data-delrec]'); if (!b) return;
    if (!confirm('Hentikan transaksi berulang ini?')) return;
    db.recurring = db.recurring.filter(r => r.id !== b.dataset.delrec);
    save(); renderAll(); toast('Transaksi berulang dihentikan');
  });

  // ---------- Task sheet ----------
  let taskForm = { id:null, cat:'Pribadi', wallet:null };
  function renderTaskChips() {
    $('taskCatChips').innerHTML = TASK_CATS.map(([n,c]) => `<button class="chip ${taskForm.cat===n?'on':''}" data-tcat="${n}"><span class="cat-dot" style="background:${c}"></span>${n}</button>`).join('');
    $('taskWalletChips').innerHTML = db.wallets.map(w => `<button class="chip ${taskForm.wallet===w.id?'on':''}" data-tw2="${w.id}">${esc(w.name)}</button>`).join('');
  }
  function openTaskForm(t) {
    if (t) {
      taskForm = { id:t.id, cat:t.cat || 'Pribadi', wallet:t.wallet || (db.wallets[0] && db.wallets[0].id) };
      $('taskTitle').textContent = 'Ubah tugas';$('taskTitleInput').value = t.title;
      $('taskDate').value = t.date;
      $('taskTime').value = t.time \vert{}\vert{} '';$('taskCost').value = t.cost ? t.cost.toLocaleString('id-ID') : '';
      $('deleteTask').classList.remove('hidden');
    } else {
      taskForm = { id:null, cat:'Pribadi', wallet:db.wallets[0] ? db.wallets[0].id : null };
      $('taskTitle').textContent = 'Tambah tugas';
      $('taskTitleInput').value = '';$('taskDate').value = scheduleDate;
      $('taskTime').value = '';
      $('taskCost').value = '';$('deleteTask').classList.add('hidden');
    }
    renderTaskChips();
    openOv('taskOverlay');
    setTimeout(() => $('taskTitleInput').focus(), 120);   }$('taskCatChips').addEventListener('click', e => { const b = e.target.closest('[data-tcat]'); if (b) { taskForm.cat = b.dataset.tcat; renderTaskChips(); } });
  $('taskWalletChips').addEventListener('click', e => { const b = e.target.closest('[data-tw2]'); if (b) { taskForm.wallet = b.dataset.tw2; renderTaskChips(); } });$('saveTask').addEventListener('click', () => {
    const title = $('taskTitleInput').value.trim();
    if (!title) { toast('Isi judulnya dulu.'); $('taskTitleInput').focus(); return; }
    const date = $('taskDate').value || todayStr();
    const time = $('taskTime').value || '';
    const cost = digits($('taskCost').value);
    const payload = { title, date, time, cost, cat:taskForm.cat, wallet:taskForm.wallet || null };
    if (taskForm.id) {
      const t = db.tasks.find(x => x.id === taskForm.id);
      Object.assign(t, payload);
      toast('Tugas diperbarui');
    } else {
      db.tasks.push(Object.assign({ id:uid(), done:false }, payload));
      toast('Tugas ditambahkan');
    }
    save(); renderAll(); closeOv('taskOverlay');
  });
  $('deleteTask').addEventListener('click', () => {
    if (!confirm('Hapus tugas ini?')) return;
    db.tasks = db.tasks.filter(t => t.id !== taskForm.id);
    save(); renderAll(); closeOv('taskOverlay'); toast('Tugas dihapus');
  });

  document.addEventListener('click', e => {
    const tg = e.target.closest('[data-toggle]');
    if (tg) {
      const t = db.tasks.find(x => x.id === tg.dataset.toggle);
      if (t) { t.done = !t.done; save(); renderAll(); }
      return;
    }
    const ed = e.target.closest('[data-edit]');
    if (ed) { const t = db.tasks.find(x => x.id === ed.dataset.edit); if (t) openTaskForm(t); return; }
    const rec = e.target.closest('[data-record]');
    if (rec) { recordTaskAsExpense(rec.dataset.record); return; }
  });
  function recordTaskAsExpense(taskId) {
    const t = db.tasks.find(x => x.id === taskId);
    if (!t || !t.cost || t.expenseId) return;
    const walletId = t.wallet && db.wallets.find(w => w.id === t.wallet) ? t.wallet : (db.wallets[0] && db.wallets[0].id);
    if (!walletId) { toast('Tambah dompet dulu.'); return; }
    const txId = uid();
    db.tx.push({ id:txId, type:'out', cat:TASK_TO_TX_CAT[t.cat] || 'Lainnya', wallet:walletId, amount:t.cost, note:t.title, date:t.date, taskId:t.id });
    t.expenseId = txId;
    save(); renderAll(); toast('Pengeluaran dicatat ' + rp(t.cost));
  }

  // ---------- Recurring tasks ----------
  let trForm = { freq:'daily', dow:1, cat:'Pribadi', wallet:null };
  function renderTrChips() {
    document.querySelectorAll('#trFreqSeg button').forEach(b => { b.className = b.dataset.freq === trForm.freq ? 'on transfer' : ''; });
    $('trWeeklyBlock').classList.toggle('hidden', trForm.freq !== 'weekly');
    $('trMonthlyBlock').classList.toggle('hidden', trForm.freq !== 'monthly');$('trDowChips').innerHTML = DOW.map((d,i) => `<button class="chip ${trForm.dow===i?'on':''}" data-dow="${i}">${d}</button>`).join('');
    $('trCatChips').innerHTML = TASK_CATS.map(([n,c]) => `<button class="chip ${trForm.cat===n?'on':''}" data-trcat="${n}"><span class="cat-dot" style="background:${c}"></span>${n}</button>`).join('');
    $('trWalletChips').innerHTML = db.wallets.map(w => `<button class="chip ${trForm.wallet===w.id?'on':''}" data-trw="${w.id}">${esc(w.name)}</button>`).join('');
  }
  $('addTaskRec').addEventListener('click', () => {
    if (!db.wallets.length) { toast('Tambah dompet dulu.'); return; }
    trForm = { freq:'daily', dow:1, cat:'Pribadi', wallet:db.wallets[0].id };
    $('trTitle').value = '';$('trDom').value = 1; $('trTime').value = '';$('trCost').value = '';
    renderTrChips(); openOv('taskRecOverlay');
    setTimeout(() => $('trTitle').focus(), 120);   });$('trFreqSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; trForm.freq = b.dataset.freq; renderTrChips(); });
  $('trDowChips').addEventListener('click', e => { const b = e.target.closest('[data-dow]'); if (!b) return; trForm.dow = Number(b.dataset.dow); renderTrChips(); });$('trCatChips').addEventListener('click', e => { const b = e.target.closest('[data-trcat]'); if (!b) return; trForm.cat = b.dataset.trcat; renderTrChips(); });
  $('trWalletChips').addEventListener('click', e => { const b = e.target.closest('[data-trw]'); if (!b) return; trForm.wallet = b.dataset.trw; renderTrChips(); });$('saveTaskRec').addEventListener('click', () => {
    const title = $('trTitle').value.trim();
    if (!title) { toast('Isi judulnya dulu.'); $('trTitle').focus(); return; }
    const dom = Math.min(Math.max(parseInt($('trDom').value, 10) || 1, 1), 31);
    const today = todayStr();
    db.taskRec.push({ id:uid(), title, freq:trForm.freq, dow:trForm.dow, dom, time:$('trTime').value \vert{}\vert{} '', cost:digits($('trCost').value), cat:trForm.cat, wallet:trForm.wallet || null, lastRun: addDays(today, -1) });
    save();
    const n = runTaskRecurring();
    save(); renderAll(); closeOv('taskRecOverlay');
    toast(n ? 'Kegiatan berulang disimpan, ' + n + ' kegiatan dibuat' : 'Kegiatan berulang disimpan');
  });
  $('taskRecList').addEventListener('click', e => {
    const b = e.target.closest('[data-deltr]'); if (!b) return;
    if (!confirm('Hentikan kegiatan berulang ini?')) return;
    db.taskRec = db.taskRec.filter(r => r.id !== b.dataset.deltr);
    save(); renderAll(); toast('Kegiatan berulang dihentikan');
  });

  // ---------- Routine sheet ----------
  let rForm = { id:null, cat:'Olahraga', days:[1,2,3,4,5], wallet:null };
  function renderRoutineChips() {
    $('rCatChips').innerHTML = ROUTINE_CATS.map(([n,e,c]) => `<button class="chip ${rForm.cat===n?'on':''}" data-rcat2="${n}"><span class="cat-dot" style="background:${c}"></span>${e} ${n}</button>`).join('');
    $('rDayChips').innerHTML = DOW.map((d,i) => `<button class="chip ${rForm.days.includes(i)?'on':''}" data-rday="${i}">${d}</button>`).join('');
    $('rWalletChips').innerHTML = db.wallets.map(w => `<button class="chip ${rForm.wallet===w.id?'on':''}" data-rwallet="${w.id}">${esc(w.name)}</button>`).join('');
  }
  function openRoutineForm(r) {
    if (r) {
      rForm = { id:r.id, cat:r.cat || 'Olahraga', days:[...r.days], wallet:r.wallet || (db.wallets[0] && db.wallets[0].id) };
      $('routineTitle').textContent = 'Ubah rutinitas';$('rTitle').value = r.title;
      $('rStart').value = r.start;
      $('rEnd').value = r.end;
      $('rCost').value = r.cost ? r.cost.toLocaleString('id-ID') : '';
      $('deleteRoutine').classList.remove('hidden');
    } else {
      rForm = { id:null, cat:'Olahraga', days:[1,2,3,4,5], wallet:db.wallets[0] ? db.wallets[0].id : null };
      $('routineTitle').textContent = 'Tambah rutinitas';$('rTitle').value = '';
      $('rStart').value = '06:00';$('rEnd').value = '07:00';
      $('rCost').value = '';$('deleteRoutine').classList.add('hidden');
    }
    renderRoutineChips();
    openOv('routineOverlay');
    setTimeout(() => $('rTitle').focus(), 120);
  }
  $('rCatChips').addEventListener('click', e => { const b = e.target.closest('[data-rcat2]'); if (b) { rForm.cat = b.dataset.rcat2; renderRoutineChips(); } });$('rDayChips').addEventListener('click', e => {
    const b = e.target.closest('[data-rday]'); if (!b) return;
    const d = Number(b.dataset.rday);
    const i = rForm.days.indexOf(d);
    if (i >= 0) rForm.days.splice(i, 1); else rForm.days.push(d);
    rForm.days.sort((a,b) => a-b);
    renderRoutineChips();
  });
  document.querySelectorAll('[data-daypreset]').forEach(b => b.addEventListener('click', () => {
    const p = b.dataset.daypreset;
    rForm.days = p === 'weekday' ? [1,2,3,4,5] : p === 'weekend' ? [0,6] : [0,1,2,3,4,5,6];
    renderRoutineChips();
  }));
  $('rWalletChips').addEventListener('click', e => { const b = e.target.closest('[data-rwallet]'); if (b) { rForm.wallet = b.dataset.rwallet; renderRoutineChips(); } });

  $('saveRoutine').addEventListener('click', () => {
    const title = $('rTitle').value.trim();
    if (!title) { toast('Isi judulnya dulu.'); $('rTitle').focus(); return; }
    if (!rForm.days.length) { toast('Pilih minimal satu hari aktif.'); return; }
    const start = $('rStart').value || '06:00';
    const end = $('rEnd').value || '07:00';
    if (start === end) { toast('Jam mulai dan selesai nggak boleh sama.'); return; }
    const cost = digits($('rCost').value);
    const payload = { title, cat:rForm.cat, start, end, days:[...rForm.days], cost, wallet:cost > 0 ? (rForm.wallet || null) : null };
    if (rForm.id) {
      const r = db.routines.find(x => x.id === rForm.id);
      Object.assign(r, payload);
      toast('Rutinitas diperbarui');
    } else {
      db.routines.push(Object.assign({ id:uid() }, payload));
      toast('Rutinitas ditambahkan');
    }
    save(); renderAll(); closeOv('routineOverlay');
  });
  $('deleteRoutine').addEventListener('click', () => {
    if (!confirm('Hapus rutinitas ini?')) return;
    db.routines = db.routines.filter(r => r.id !== rForm.id);
    save(); renderAll(); closeOv('routineOverlay'); toast('Rutinitas dihapus');
  });

  document.addEventListener('click', e => {
    const tg = e.target.closest('[data-rtoggle]');
    if (tg) {
      const ds = tg.dataset.rdate, id = tg.dataset.rtoggle;
      const cur = isRoutineDone(ds, id);
      toggleRoutineDone(ds, id, !cur);
      save(); renderAll();
      return;
    }
    const rec = e.target.closest('[data-rrec]');
    if (rec) { recordRoutineAsExpense(rec.dataset.rdate, rec.dataset.rrec); return; }
    const r = e.target.closest('.routine[data-routine]');
    if (r && !e.target.closest('[data-rtoggle]') && !e.target.closest('[data-rrec]')) {
      const obj = db.routines.find(x => x.id === r.dataset.routine);
      if (obj) openRoutineForm(obj);
    }
  });
  function recordRoutineAsExpense(ds, id) {
    const r = db.routines.find(x => x.id === id);
    if (!r || !r.cost) return;
    const key = ds + ':' + id;
    if (db.routineExpense[key]) return;
    const walletId = r.wallet && db.wallets.find(w => w.id === r.wallet) ? r.wallet : (db.wallets[0] && db.wallets[0].id);
    if (!walletId) { toast('Tambah dompet dulu.'); return; }
    const txId = uid();
    db.tx.push({ id:txId, type:'out', cat:ROUTINE_TO_TX_CAT[r.cat] || 'Lainnya', wallet:walletId, amount:r.cost, note:r.title, date:ds, routineId:r.id });
    db.routineExpense[key] = txId;
    save(); renderAll(); toast('Pengeluaran dicatat ' + rp(r.cost));
  }

  // ---------- Templates ----------
  $('openTemplates').addEventListener('click', () => {$('templateList').innerHTML = Object.entries(ROUTINE_TEMPLATES).map(([k,t]) =>
      `<button class="tpl-card" data-tpl="${k}">
        <b>${t.name}</b>
        <small>${esc(t.desc)}<br>${t.items.length} blok rutinitas</small>
      </button>`
    ).join('');
    openOv('templateOverlay');
  });
  $('templateList').addEventListener('click', e => {
    const b = e.target.closest('[data-tpl]'); if (!b) return;
    const t = ROUTINE_TEMPLATES[b.dataset.tpl];
    if (!t) return;
    if (db.routines.length && !confirm('Ini bakal menambahkan rutinitas dari template di atas rutinitas yang sudah ada. Lanjut?')) return;
    t.items.forEach(item => {
      db.routines.push({ id: uid(), title:item.title, cat:item.cat, start:item.start, end:item.end, days:[...item.days], cost:item.cost || 0, wallet:item.cost > 0 ? (db.wallets[0] && db.wallets[0].id) : null });
    });
    save(); renderAll(); closeOv('templateOverlay');
    toast(t.items.length + ' rutinitas ditambahkan');
  });

  // ---------- About ----------
  function openAbout() { openOv('aboutOverlay'); }
  $('aboutBtn').addEventListener('click', openAbout);$('aboutBtn2').addEventListener('click', openAbout);

  // ---------- PIN ----------
  function renderPinSheet() {
    if (db.pinHash) {
      $('pinSetupBlock').classList.add('hidden');$('pinManageBlock').classList.remove('hidden');
    } else {
      $('pinSetupBlock').classList.remove('hidden');
      $('pinManageBlock').classList.add('hidden');$('pinNew').value = '';
      $('pinConfirm').value = '';$('pinSetupErr').textContent = '';
    }
  }
  $('pinManageBtn').addEventListener('click', () => { renderPinSheet(); openOv('pinOverlay'); });

  $('pinSave').addEventListener('click', () => {
    const a = $('pinNew').value.trim();
    const b = $('pinConfirm').value.trim();
    const err = $('pinSetupErr');
    if (!/^\d{4,6}$/.test(a)) { err.textContent = 'PIN harus 4–6 digit angka.'; return; }
    if (a !== b) { err.textContent = 'PIN dan ulangannya nggak sama.'; return; }
    db.pinHash = hashPin(a);
    save();
    closeOv('pinOverlay');
    toast('PIN aktif. Jangan lupa ya.');
  });

  $('pinChange').addEventListener('click', () => {
    $('pinVerify').value = '';$('pinVerifyErr').textContent = '';
    pendingPinAction = 'change';
    openOv('pinConfirmOverlay');
  });
  $('pinRemove').addEventListener('click', () => {
    $('pinVerify').value = '';$('pinVerifyErr').textContent = '';
    pendingPinAction = 'remove';
    openOv('pinConfirmOverlay');
  });

  let pendingPinAction = null;
  $('pinVerifyOk').addEventListener('click', () => {
    const v = $('pinVerify').value.trim();
    if (hashPin(v) !== db.pinHash) {
      $('pinVerifyErr').textContent = 'PIN salah.';$('pinVerify').classList.add('error');
      setTimeout(() => $('pinVerify').classList.remove('error'), 400);
      return;
    }
    closeOv('pinConfirmOverlay');
    if (pendingPinAction === 'remove') {
      db.pinHash = null;
      save(); closeOv('pinOverlay');
      toast('PIN dimatikan');
    } else if (pendingPinAction === 'change') {
      $('pinSetupBlock').classList.remove('hidden');
      $('pinManageBlock').classList.add('hidden');$('pinNew').value = '';
      $('pinConfirm').value = '';$('pinSetupErr').textContent = '';
      setTimeout(() => $('pinNew').focus(), 120);
    }
    pendingPinAction = null;
  });

  function showPinLock() {
    $('pinLock').classList.add('open');
    $('pinLockInput').value = '';$('pinLockErr').textContent = '';
    setTimeout(() => $('pinLockInput').focus(), 120);
  }
  function tryUnlock() {
    const v = $('pinLockInput').value.trim();
    if (hashPin(v) === db.pinHash) {
      $('pinLock').classList.remove('open');
      renderAll();
      setupNotifications();
    } else {
      $('pinLockErr').textContent = 'PIN salah, coba lagi.';$('pinLockInput').classList.add('error');
      setTimeout(() => $('pinLockInput').classList.remove('error'), 400);
      $('pinLockInput').value = '';$('pinLockInput').focus();
    }
  }
  $('pinUnlock').addEventListener('click', tryUnlock);$('pinLockInput').addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });
  $('pinLockInput').addEventListener('input', () => {$('pinLockErr').textContent = ''; });

  // ---------- Theme ----------
  function applyTheme() {
    document.documentElement.dataset.theme = db.theme;
    $('themeBtn').innerHTML = db.theme === 'dark' ? ICON_SUN : ICON_MOON;
    document.querySelector('meta[name="theme-color"]').content = db.theme === 'dark' ? '#0C1424' : '#14213D';
  }
  $('themeBtn').addEventListener('click', () => { db.theme = db.theme === 'dark' ? 'light' : 'dark'; save(); applyTheme(); });

  // ---------- Notifications ----------
  let notifTimer = null;
  function setupNotifications() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (notifTimer) clearInterval(notifTimer);
    notifTimer = setInterval(checkNotifications, 45000);
    checkNotifications();
  }
  function checkNotifications() {
    const now = new Date();
    const today = todayStr();
    const day = now.getDay();
    const nowMin = now.getHours()*60 + now.getMinutes();
    let changed = false;
    const hhmm = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');

    db.tasks.forEach(t => {
      if (t.date !== today || t.done || !t.time || t.time !== hhmm) return;
      const key = 'task:' + t.id;
      if (db.notified[key]) return;
      db.notified[key] = true; changed = true;
      try { new Notification('SakuKita • ' + t.title, { body: t.time + (t.cost ? ' • ' + rp(t.cost) : '') + ' • ' + (t.cat || 'Tugas'), tag: key }); } catch (e) {}
    });
    db.routines.forEach(r => {
      if (!r.days.includes(day)) return;
      const s = rStartMin(r);
      const diff = s - nowMin;
      if (diff < 1 || diff > 10) return;
      const key = 'routine:' + today + ':' + r.id;
      if (db.notified[key]) return;
      db.notified[key] = true; changed = true;
      try { new Notification('SakuKita • Sebentar lagi: ' + r.title, { body: r.start + '–' + r.end + ' • ' + r.cat, tag: key }); } catch (e) {}
    });
    if (changed) save();
  }
  $('notifBtn').addEventListener('click', async () => {
    if (!('Notification' in window)) { toast('Browser ini nggak dukung notifikasi.'); return; }
    const p = await Notification.requestPermission();
    if (p === 'granted') { setupNotifications(); toast('Pengingat aktif'); }
    else toast('Izin notifikasi ditolak');
  });

  // ---------- Backup ----------
  $('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sakukita-backup-' + todayStr() + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    db.lastBackup = todayStr();
    save();
    renderHome();
    toast('Backup diunduh');
  });
  $('importBtn').addEventListener('click', () => $('importFile').click());$('importFile').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!Array.isArray(data.tx) || !Array.isArray(data.wallets)) throw new Error('format');
        if (!confirm('Data sekarang akan diganti dengan isi backup. Lanjut?')) return;
        db = Object.assign(defaults(), data);
        if (!db.catBudgets || typeof db.catBudgets !== 'object') db.catBudgets = {};
        if (!Array.isArray(db.recurring)) db.recurring = [];
        if (!Array.isArray(db.tasks)) db.tasks = [];
        if (!Array.isArray(db.taskRec)) db.taskRec = [];
        if (!Array.isArray(db.routines)) db.routines = [];
        if (!db.routineLog || typeof db.routineLog !== 'object') db.routineLog = {};
        if (!db.routineExpense || typeof db.routineExpense !== 'object') db.routineExpense = {};
        if (!db.notified || typeof db.notified !== 'object') db.notified = {};
        save(); applyTheme(); renderAll(); toast('Data berhasil dipulihkan');
      } catch (err) { toast('File backup nggak valid.'); }
    };
    r.readAsText(file);
    e.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (!confirm('Semua data akan dihapus permanen. Yakin?')) return;
    const theme = db.theme;
    const pinHash = db.pinHash;
    db = defaults(); db.theme = theme; db.pinHash = pinHash;
    save(); renderAll(); toast('Semua data dihapus');
  });

  // ---------- Init ----------
  load();
  applyTheme();
  viewMonth = thisMonth();
  scheduleDate = todayStr();
  const nTx = runRecurring();
  const nTask = runTaskRecurring();
  if (nTx || nTask) save();

  if (db.pinHash) {
    showPinLock();
  } else {
    renderAll();
    setupNotifications();
  }

  if (nTask && !nTx) toast(nTask + ' kegiatan berulang dibuat');
  else if (nTx && !nTask) toast(nTx + ' transaksi berulang dicatat');
  else if (nTx && nTask) toast(nTx + ' transaksi & ' + nTask + ' kegiatan berulang dibuat');
})();
