// js/app.js — theme, notifications, backup, nav, event wiring, init
(function (SK) {
  'use strict';

  const $ = SK.$, todayStr = SK.todayStr, thisMonth = SK.thisMonth,
        addMonth = SK.addMonth, addDays = SK.addDays,
        rStartMin = SK.rStartMin, rp = SK.rp, toast = SK.toast;

  // ==================== THEME ====================
  SK.applyTheme = function () {
    document.documentElement.dataset.theme = SK.db.theme;
    $('themeBtn').innerHTML = SK.db.theme === 'dark' ? SK.ICON_SUN : SK.ICON_MOON;
    document.querySelector('meta[name="theme-color"]').content = SK.db.theme === 'dark' ? '#0C1424' : '#14213D';
  };
  $('themeBtn').addEventListener('click', () => {
    SK.db.theme = SK.db.theme === 'dark' ? 'light' : 'dark';
    SK.save(); SK.applyTheme();
  });

  // ==================== NOTIFICATIONS ====================
  let notifTimer = null;
  SK.setupNotifications = function () {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (notifTimer) clearInterval(notifTimer);
    notifTimer = setInterval(SK.checkNotifications, 45000);
    SK.checkNotifications();
  };
  SK.checkNotifications = function () {
    const db = SK.db;
    const now = new Date();
    const today = todayStr();
    const day = now.getDay();
    const nowMin = now.getHours() * 60 + now.getMinutes();
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
    if (changed) SK.save();
  };
  $('notifBtn').addEventListener('click', async () => {
    if (!('Notification' in window)) { toast('Browser ini nggak dukung notifikasi.'); return; }
    const p = await Notification.requestPermission();
    if (p === 'granted') { SK.setupNotifications(); toast('Pengingat aktif'); }
    else toast('Izin notifikasi ditolak');
  });

  // ==================== BACKUP ====================
  $('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(SK.db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sakukita-backup-' + todayStr() + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    SK.db.lastBackup = todayStr();
    SK.save();
    SK.renderHome();
    toast('Backup diunduh');
  });
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!Array.isArray(data.tx) || !Array.isArray(data.wallets)) throw new Error('format');
        if (!confirm('Data sekarang akan diganti dengan isi backup. Lanjut?')) return;
        SK.db = Object.assign(SK.defaults(), data);
        if (!SK.db.catBudgets || typeof SK.db.catBudgets !== 'object') SK.db.catBudgets = {};
        if (!Array.isArray(SK.db.recurring)) SK.db.recurring = [];
        if (!Array.isArray(SK.db.tasks)) SK.db.tasks = [];
        if (!Array.isArray(SK.db.taskRec)) SK.db.taskRec = [];
        if (!Array.isArray(SK.db.routines)) SK.db.routines = [];
        if (!SK.db.routineLog || typeof SK.db.routineLog !== 'object') SK.db.routineLog = {};
        if (!SK.db.routineExpense || typeof SK.db.routineExpense !== 'object') SK.db.routineExpense = {};
        if (!SK.db.notified || typeof SK.db.notified !== 'object') SK.db.notified = {};
        SK.save(); SK.applyTheme(); SK.renderAll(); toast('Data berhasil dipulihkan');
      } catch (err) { toast('File backup nggak valid.'); }
    };
    r.readAsText(file);
    e.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (!confirm('Semua data akan dihapus permanen. Yakin?')) return;
    const theme = SK.db.theme;
    const pinHash = SK.db.pinHash;
    SK.db = SK.defaults();
    SK.db.theme = theme;
    SK.db.pinHash = pinHash;
    SK.save(); SK.renderAll(); toast('Semua data dihapus');
  });

  // ==================== NAVIGATION ====================
  document.querySelectorAll('.nav button[data-view]').forEach(b => b.addEventListener('click', () => SK.showView(b.dataset.view)));
  $('seeAll').addEventListener('click', () => SK.showView('History'));
  $('goSchedule').addEventListener('click', () => SK.showView('Schedule'));
  document.querySelectorAll('#schedSeg button').forEach(b => b.addEventListener('click', () => { SK.scheduleSeg = b.dataset.seg; SK.renderSchedule(); }));

  // Month nav
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-mv]');
    if (!b || b.disabled) return;
    const next = addMonth(SK.viewMonth, Number(b.dataset.mv));
    if (next > thisMonth()) return;
    SK.viewMonth = next;
    SK.renderAll();
  });
  // Day nav
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-dv]');
    if (!b || b.disabled) return;
    const next = addDays(SK.scheduleDate, Number(b.dataset.dv));
    if (next > todayStr()) return;
    SK.scheduleDate = next;
    SK.renderDayBars(); SK.renderSchedule();
  });
  $('todayBtn').addEventListener('click', () => {
    SK.scheduleDate = todayStr();
    SK.renderDayBars(); SK.renderSchedule();
  });

  // FAB
  $('fab').addEventListener('click', () => {
    if (SK.currentView === 'Schedule') {
      if (SK.scheduleSeg === 'routines') SK.openRoutineForm();
      else SK.openTaskForm();
    } else SK.openTx();
  });

  // About
  $('aboutBtn').addEventListener('click', SK.openAbout);
  $('aboutBtn2').addEventListener('click', SK.openAbout);

  // Search
  $('searchInput').addEventListener('input', e => { SK.query = e.target.value.toLowerCase().trim(); SK.renderHistory(); });

  // ==================== DELEGATED HANDLERS ====================
  document.addEventListener('click', e => {
    // Transaction row → buka editor
    const row = e.target.closest('.tx');
    if (row && row.dataset.id) {
      const t = SK.db.tx.find(x => x.id === row.dataset.id);
      if (t) SK.openTx(t);
    }
    // Filter chip
    const f = e.target.closest('[data-f]');
    if (f) { SK.filter = f.dataset.f; SK.renderHistory(); }
    // Task toggle
    const tg = e.target.closest('[data-toggle]');
    if (tg) {
      const t = SK.db.tasks.find(x => x.id === tg.dataset.toggle);
      if (t) { t.done = !t.done; SK.save(); SK.renderAll(); }
      return;
    }
    // Task edit
    const ed = e.target.closest('[data-edit]');
    if (ed) {
      const t = SK.db.tasks.find(x => x.id === ed.dataset.edit);
      if (t) SK.openTaskForm(t);
      return;
    }
    // Task record as expense
    const rec = e.target.closest('[data-record]');
    if (rec) { SK.recordTaskAsExpense(rec.dataset.record); return; }
    // Routine toggle
    const rtg = e.target.closest('[data-rtoggle]');
    if (rtg) {
      const ds = rtg.dataset.rdate, id = rtg.dataset.rtoggle;
      const cur = SK.isRoutineDone(ds, id);
      SK.toggleRoutineDone(ds, id, !cur);
      SK.save(); SK.renderAll();
      return;
    }
    // Routine record as expense
    const rrec = e.target.closest('[data-rrec]');
    if (rrec) { SK.recordRoutineAsExpense(rrec.dataset.rdate, rrec.dataset.rrec); return; }
    // Routine card click → edit (kalau bukan di dalam tombol check/record)
    const r = e.target.closest('.routine[data-routine]');
    if (r && !e.target.closest('[data-rtoggle]') && !e.target.closest('[data-rrec]')) {
      const obj = SK.db.routines.find(x => x.id === r.dataset.routine);
      if (obj) SK.openRoutineForm(obj);
    }
  });

  // ==================== INIT ====================
  SK.load();
  SK.applyTheme();
  SK.viewMonth = thisMonth();
  SK.scheduleDate = todayStr();

  const nTx = SK.runRecurring();
  const nTask = SK.runTaskRecurring();
  if (nTx || nTask) SK.save();

  if (SK.db.pinHash) {
    SK.showPinLock();
  } else {
    SK.renderAll();
    SK.setupNotifications();
  }

  if (nTask && !nTx) toast(nTask + ' kegiatan berulang dibuat');
  else if (nTx && !nTask) toast(nTx + ' transaksi berulang dicatat');
  else if (nTx && nTask) toast(nTx + ' transaksi & ' + nTask + ' kegiatan berulang dibuat');

})(window.SK);
