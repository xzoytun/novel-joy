// js/core.js — konstanta, utility, storage, state global
window.SK = window.SK || {};
(function (SK) {
  'use strict';

  SK.KEY = 'sakukita:v1';
  SK.APP_VERSION = '1.0';

  SK.CATS = {
    out: [['Makan','🍜'],['Transport','🛵'],['Belanja','🛍'],['Tagihan','💡'],['Hiburan','🎮'],['Kesehatan','💊'],['Pendidikan','📚'],['Lainnya','📦']],
    in:  [['Gaji','💼'],['Bonus','🎁'],['Usaha','🏪'],['Kiriman','💌'],['Lainnya','💰']]
  };
  SK.EMOJI = Object.fromEntries([...SK.CATS.out, ...SK.CATS.in, ['Transfer','🔄']]);

  SK.TASK_CATS = [['Kerja','#4285F4'],['Belajar','#9C27B0'],['Pribadi','#FF9800'],['Keluarga','#E91E63'],['Lainnya','#607D8B']];
  SK.TASK_COLOR = Object.fromEntries(SK.TASK_CATS);
  SK.TASK_EMOJI = { Kerja:'💼', Belajar:'📚', Pribadi:'🙋', Keluarga:'👨👩👧', Lainnya:'📌' };
  SK.TASK_TO_TX_CAT = { Kerja:'Lainnya', Belajar:'Pendidikan', Pribadi:'Lainnya', Keluarga:'Lainnya', Lainnya:'Lainnya' };

  SK.ROUTINE_CATS = [
    ['Tidur','😴','#5E6AD2'],['Belajar','📚','#9C27B0'],['Kerja','💼','#4285F4'],
    ['Olahraga','🏃','#1F8A70'],['Makan','🍽','#FF9800'],['Santai','🎮','#E91E63'],
    ['Persiapan','🚿','#00BCD4'],['Lainnya','📌','#607D8B']
  ];
  SK.RCOLOR = Object.fromEntries(SK.ROUTINE_CATS.map(c => [c[0], c[2]]));
  SK.REMOJI = Object.fromEntries(SK.ROUTINE_CATS.map(c => [c[0], c[1]]));
  SK.ROUTINE_TO_TX_CAT = { Makan:'Makan', Olahraga:'Kesehatan', Belajar:'Pendidikan', Kerja:'Lainnya', Tidur:'Lainnya', Santai:'Hiburan', Persiapan:'Lainnya', Lainnya:'Lainnya' };

  SK.DOW = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

  SK.ROUTINE_TEMPLATES = {
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
      name: '🧑💻 Freelancer',
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

  SK.ICON_MOON = '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
  SK.ICON_SUN = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  SK.ICON_CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5 10 17l9-10"/></svg>';

  // ---- Utility ----
  SK.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  SK.todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
  SK.$ = (id) => document.getElementById(id);
  SK.rp = (n) => (n < 0 ? '-' : '') + 'Rp ' + Math.abs(Math.round(n)).toLocaleString('id-ID');
  SK.digits = (s) => Number(String(s).replace(/\D/g,'')) || 0;
  SK.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  SK.monthKey = (ds) => ds.slice(0,7);
  SK.thisMonth = () => SK.todayStr().slice(0,7);
  SK.t2m = (t) => { const [h,m] = t.split(':').map(Number); return h*60+m; };
  SK.m2t = (m) => String(Math.floor(m/60)%24).padStart(2,'0') + ':' + String(m%60).padStart(2,'0');
  SK.addMonth = function (mk, n) { let [y,m] = mk.split('-').map(Number); m += n; y += Math.floor((m-1)/12); m = ((m-1)%12+12)%12+1; return y + '-' + String(m).padStart(2,'0'); };
  SK.addDays = function (ds, n) { const [y,m,d] = ds.split('-').map(Number); const dt = new Date(y, m-1, d); dt.setDate(dt.getDate()+n); return dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2,'0') + '-' + String(dt.getDate()).padStart(2,'0'); };
  SK.daysInMonth = function (mk) { const [y,m] = mk.split('-').map(Number); return new Date(y, m, 0).getDate(); };
  SK.daysBetween = function (a, b) { const [y1,m1,d1] = a.split('-').map(Number); const [y2,m2,d2] = b.split('-').map(Number); return Math.round(Math.abs(new Date(y2,m2-1,d2) - new Date(y1,m1-1,d1)) / 86400000); };
  SK.monthLabel = function (mk) { const [y,m] = mk.split('-').map(Number); return new Date(y, m-1, 1).toLocaleDateString('id-ID', {month:'long', year:'numeric'}); };
  SK.dayLabel = function (ds) {
    const t = SK.todayStr();
    if (ds === t) return 'Hari ini';
    if (ds === SK.addDays(t,-1)) return 'Kemarin';
    if (ds === SK.addDays(t,1)) return 'Besok';
    const [y,m,d] = ds.split('-').map(Number);
    return new Date(y, m-1, d).toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long'});
  };
  SK.todayDayOfWeek = (ds) => { const [y,m,d] = ds.split('-').map(Number); return new Date(y, m-1, d).getDay(); };
  SK.rStartMin = (r) => SK.t2m(r.start);
  SK.rEndMin = (r) => { const s = SK.t2m(r.start), e = SK.t2m(r.end); return e <= s ? e + 1440 : e; };
  SK.rDuration = (r) => SK.rEndMin(r) - SK.rStartMin(r);

  SK.hashPin = function (pin) {
    let h = 5381;
    const s = 'sakukita-pin-salt-v1|' + String(pin);
    for (let i = 0; i < s.length; i++) { h = ((h << 5) + h) + s.charCodeAt(i); h = h | 0; }
    return (h >>> 0).toString(36);
  };

  let toastTimer;
  SK.toast = function (msg) {
    const el = SK.$('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  };

  // ---- Storage ----
  SK.defaults = function () {
    return {
      theme: 'light', budget: 0, catBudgets: {},
      wallets: [ { id:'w_tunai', name:'Tunai', start:0 }, { id:'w_bank', name:'Bank', start:0 } ],
      tx: [], recurring: [], tasks: [], taskRec: [],
      routines: [], routineLog: {}, routineExpense: {},
      notified: {}, pinHash: null, lastBackup: null
    };
  };
  SK.load = function () {
    try {
      const raw = localStorage.getItem(SK.KEY);
      SK.db = raw ? Object.assign(SK.defaults(), JSON.parse(raw)) : SK.defaults();
      if (!SK.db.catBudgets || typeof SK.db.catBudgets !== 'object') SK.db.catBudgets = {};
      if (!Array.isArray(SK.db.recurring)) SK.db.recurring = [];
      if (!Array.isArray(SK.db.tasks)) SK.db.tasks = [];
      if (!Array.isArray(SK.db.taskRec)) SK.db.taskRec = [];
      if (!Array.isArray(SK.db.routines)) SK.db.routines = [];
      if (!SK.db.routineLog || typeof SK.db.routineLog !== 'object') SK.db.routineLog = {};
      if (!SK.db.routineExpense || typeof SK.db.routineExpense !== 'object') SK.db.routineExpense = {};
      if (!SK.db.notified || typeof SK.db.notified !== 'object') SK.db.notified = {};
    } catch (e) { SK.db = SK.defaults(); }
  };
  SK.save = function () {
    try { localStorage.setItem(SK.KEY, JSON.stringify(SK.db)); }
    catch (e) { SK.toast('Gagal menyimpan. Penyimpanan browser penuh atau diblokir.'); }
  };

  // ---- State ----
  SK.db = null;
  SK.viewMonth = null;
  SK.scheduleDate = null;
  SK.scheduleSeg = 'routines';
  SK.currentView = 'Home';
  SK.filter = 'all';
  SK.query = '';
  SK.form = { id:null, type:'out', cat:'Makan', wallet:null, toWallet:null };
  SK.recForm = { type:'out', cat:'Makan', wallet:null };
  SK.taskForm = { id:null, cat:'Pribadi', wallet:null };
  SK.trForm = { freq:'daily', dow:1, cat:'Pribadi', wallet:null };
  SK.rForm = { id:null, cat:'Olahraga', days:[1,2,3,4,5], wallet:null };
  SK.pendingPinAction = null;

})(window.SK);
