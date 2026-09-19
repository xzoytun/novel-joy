// js/data.js — logika bisnis: dompet, transaksi berulang, rutinitas
(function (SK) {
  'use strict';

  const todayStr = SK.todayStr, thisMonth = SK.thisMonth,
        addMonth = SK.addMonth, addDays = SK.addDays,
        daysInMonth = SK.daysInMonth, todayDayOfWeek = SK.todayDayOfWeek,
        rStartMin = SK.rStartMin, rEndMin = SK.rEndMin;

  // ---- Wallet math ----
  SK.walletDelta = function (t, w) {
    if (t.type === 'in') return t.wallet === w.id ? t.amount : 0;
    if (t.type === 'out') return t.wallet === w.id ? -t.amount : 0;
    if (t.type === 'transfer') {
      let d = 0;
      if (t.wallet === w.id) d -= t.amount;
      if (t.toWallet === w.id) d += t.amount;
      return d;
    }
    return 0;
  };
  SK.walletBalance = function (w) {
    const db = SK.db;
    return db.tx.reduce((s,t) => s + SK.walletDelta(t, w), w.start);
  };
  SK.walletName = function (id) {
    const db = SK.db;
    return (db.wallets.find(w => w.id === id) || { name:'Dompet dihapus' }).name;
  };

  // ---- Recurring transactions ----
  SK.runRecurring = function () {
    const db = SK.db;
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
        db.tx.push({ id: SK.uid(), type: r.type, cat: r.cat, wallet: r.wallet, amount: r.amount, note: r.note, date: ds, rec: r.id });
        created++;
        r.lastRun = m;
        m = addMonth(m, 1);
      }
    });
    return created;
  };

  // ---- Recurring tasks ----
  SK.matchTaskRec = function (r, ds) {
    const d = todayDayOfWeek(ds);
    if (r.freq === 'daily') return true;
    if (r.freq === 'weekly') return d === r.dow;
    if (r.freq === 'monthly') {
      const dim = daysInMonth(ds.slice(0,7));
      return Number(ds.slice(-2)) === Math.min(r.dom, dim);
    }
    return false;
  };
  SK.runTaskRecurring = function () {
    const db = SK.db;
    const today = todayStr();
    let created = 0;
    db.taskRec.forEach((r) => {
      if (!r.lastRun) r.lastRun = addDays(today, -1);
      let cur = addDays(r.lastRun, 1);
      let guard = 0;
      while (cur <= today && guard++ < 400) {
        if (SK.matchTaskRec(r, cur)) {
          const exists = db.tasks.some(t => t.rec === r.id && t.date === cur);
          if (!exists) {
            db.tasks.push({ id: SK.uid(), title: r.title, date: cur, time: r.time||'', done: false, cost: r.cost||0, cat: r.cat, wallet: r.wallet, rec: r.id });
            created++;
          }
        }
        cur = addDays(cur, 1);
      }
      r.lastRun = today;
    });
    return created;
  };

  // ---- Routines ----
  SK.routinesForDay = function (ds) {
    const db = SK.db;
    const d = todayDayOfWeek(ds);
    return db.routines.filter(r => r.days.includes(d));
  };
  SK.routineDone = function (ds) {
    const db = SK.db;
    return db.routineLog[ds] || [];
  };
  SK.isRoutineDone = function (ds, id) {
    return SK.routineDone(ds).includes(id);
  };
  SK.toggleRoutineDone = function (ds, id, val) {
    const db = SK.db;
    const arr = db.routineLog[ds] || [];
    const i = arr.indexOf(id);
    if (val && i < 0) arr.push(id);
    if (!val && i >= 0) arr.splice(i, 1);
    if (arr.length) db.routineLog[ds] = arr; else delete db.routineLog[ds];
  };
  SK.routineActiveNow = function (r, nowMin) {
    const s = rStartMin(r), e = rEndMin(r);
    if (nowMin >= s && nowMin < e) return { active: true, remain: e - nowMin };
    if (e > 1440 && nowMin < (e - 1440)) return { active: true, remain: e - 1440 - nowMin };
    return { active: false, remain: 0 };
  };
  SK.detectConflicts = function (routines) {
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
  };
  SK.computeStreak = function () {
    const t = todayStr();
    let streak = 0;
    const todayRs = SK.routinesForDay(t);
    if (todayRs.length && SK.routineDone(t).length >= todayRs.length) streak = 1;
    let check = addDays(t, -1);
    let guard = 0;
    while (guard++ < 400) {
      const rs = SK.routinesForDay(check);
      if (!rs.length) break;
      if (SK.routineDone(check).length >= rs.length) { streak++; check = addDays(check, -1); }
      else break;
    }
    return streak;
  };

  // ---- Catat biaya jadi pengeluaran ----
  SK.recordTaskAsExpense = function (taskId) {
    const db = SK.db;
    const t = db.tasks.find(x => x.id === taskId);
    if (!t || !t.cost || t.expenseId) return;
    const walletId = t.wallet && db.wallets.find(w => w.id === t.wallet) ? t.wallet : (db.wallets[0] && db.wallets[0].id);
    if (!walletId) { SK.toast('Tambah dompet dulu.'); return; }
    const txId = SK.uid();
    db.tx.push({ id: txId, type:'out', cat: SK.TASK_TO_TX_CAT[t.cat] || 'Lainnya', wallet: walletId, amount: t.cost, note: t.title, date: t.date, taskId: t.id });
    t.expenseId = txId;
    SK.save(); SK.renderAll();
    SK.toast('Pengeluaran dicatat ' + SK.rp(t.cost));
  };
  SK.recordRoutineAsExpense = function (ds, id) {
    const db = SK.db;
    const r = db.routines.find(x => x.id === id);
    if (!r || !r.cost) return;
    const key = ds + ':' + id;
    if (db.routineExpense[key]) return;
    const walletId = r.wallet && db.wallets.find(w => w.id === r.wallet) ? r.wallet : (db.wallets[0] && db.wallets[0].id);
    if (!walletId) { SK.toast('Tambah dompet dulu.'); return; }
    const txId = SK.uid();
    db.tx.push({ id: txId, type:'out', cat: SK.ROUTINE_TO_TX_CAT[r.cat] || 'Lainnya', wallet: walletId, amount: r.cost, note: r.title, date: ds, routineId: r.id });
    db.routineExpense[key] = txId;
    SK.save(); SK.renderAll();
    SK.toast('Pengeluaran dicatat ' + SK.rp(r.cost));
  };

})(window.SK);
