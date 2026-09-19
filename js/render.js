// js/render.js — semua fungsi render
(function (SK) {
  'use strict';

  const $ = SK.$, rp = SK.rp, esc = SK.esc, todayStr = SK.todayStr,
        monthKey = SK.monthKey, thisMonth = SK.thisMonth,
        addDays = SK.addDays, addMonth = SK.addMonth, daysInMonth = SK.daysInMonth,
        monthLabel = SK.monthLabel, dayLabel = SK.dayLabel,
        rStartMin = SK.rStartMin, rDuration = SK.rDuration,
        walletName = SK.walletName, walletBalance = SK.walletBalance,
        EMOJI = SK.EMOJI, TASK_COLOR = SK.TASK_COLOR, TASK_EMOJI = SK.TASK_EMOJI,
        RCOLOR = SK.RCOLOR, REMOJI = SK.REMOJI, ICON_CHECK = SK.ICON_CHECK;

  // ---- Transaction rows ----
  SK.txRow = function (t) {
    const db = SK.db;
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
  };
  SK.groupedList = function (list) {
    const sorted = [...list].sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    const g = {};
    sorted.forEach(t => (g[t.date] = g[t.date] || []).push(t));
    return Object.keys(g).map(d => `<div class="tx-group"><div class="tx-date">${dayLabel(d)}</div>${g[d].map(SK.txRow).join('')}</div>`).join('');
  };
  const emptyBox = `<div class="empty"><b>Belum ada transaksi</b>Tekan tombol + buat catat pengeluaran atau pemasukan pertamamu.</div>`;
  const emptySearch = `<div class="empty"><b>Nggak ketemu</b>Coba kata kunci atau filter lain.</div>`;

  SK.renderMonthBars = function () {
    const vm = SK.viewMonth;
    document.querySelectorAll('[data-mlabel]').forEach(el => el.textContent = monthLabel(vm));
    const atNow = vm >= thisMonth();
    document.querySelectorAll('[data-mv="1"]').forEach(b => b.disabled = atNow);
  };
  SK.renderDayBars = function () {
    const sd = SK.scheduleDate;
    document.querySelectorAll('[data-dlabel]').forEach(el => el.textContent = dayLabel(sd));
    const atNow = sd >= todayStr();
    document.querySelectorAll('[data-dv="1"]').forEach(b => b.disabled = atNow);
  };

  SK.renderBackupReminder = function () {
    const db = SK.db;
    const t = todayStr();
    let show = false, days = 0;
    if (!db.lastBackup) show = db.tx.length > 0;
    else { days = SK.daysBetween(db.lastBackup, t); show = days >= 14; }
    if (!show) { $('backupReminder').innerHTML = ''; return; }
    const txt = !db.lastBackup ? 'Kamu belum pernah unduh backup.' : `Terakhir backup: ${days} hari lalu.`;
    $('backupReminder').innerHTML = `<div class="banner-warn">
      <span class="ico">💾</span>
      <div style="flex:1">
        <b>Waktunya backup</b>
        <small>${txt} Buka Laporan → Kelola data buat unduh file JSON.</small>
      </div>
    </div>`;
  };

  // ---- Beranda ----
  SK.renderHome = function () {
    const db = SK.db;
    const vm = SK.viewMonth;
    const total = db.wallets.reduce((s,w) => s + walletBalance(w), 0);
    const mtx = db.tx.filter(t => monthKey(t.date) === vm && t.type !== 'transfer');
    const mIn = mtx.filter(t => t.type === 'in').reduce((s,t) => s + t.amount, 0);
    const mOut = mtx.filter(t => t.type === 'out').reduce((s,t) => s + t.amount, 0);

    $('totalBalance').textContent = rp(total);
    $('monthIn').textContent = rp(mIn);
    $('monthOut').textContent = rp(mOut);

    $('walletList').innerHTML = db.wallets.map(w =>
      `<div class="wallet"><small>${esc(w.name)}</small><b>${rp(walletBalance(w))}</b></div>`
    ).join('');

    SK.renderBackupReminder();

    const td = todayStr();
    const routines = SK.routinesForDay(td).sort((a,b) => rStartMin(a) - rStartMin(b));
    const now = new Date();
    const nowMin = now.getHours()*60 + now.getMinutes();
    let current = null, remainMin = 0;
    for (const r of routines) { const a = SK.routineActiveNow(r, nowMin); if (a.active) { current = r; remainMin = a.remain; break; } }
    let next = null;
    for (const r of routines) if (rStartMin(r) > nowMin) { next = r; break; }
    const tasks = db.tasks.filter(t => t.date === td);
    const doneTasks = tasks.filter(t => t.done).length;
    const taskCost = tasks.filter(t => !t.expenseId && t.cost > 0).reduce((s,t) => s + t.cost, 0);
    const routineCost = routines.filter(r => !db.routineExpense[td+':'+r.id] && r.cost > 0).reduce((s,r) => s + r.cost, 0);
    const totalCost = taskCost + routineCost;

    const c = $('todayCard');
    let html = '';
    if (current) html += `<div class="nowblock"><span class="nowdot"></span><div><b>${esc(current.title)}</b><small>sisa ${remainMin} menit • ${current.start}–${current.end}</small></div></div>`;
    else if (routines.length) html += `<div class="nowblock free"><span class="nowdot"></span><div><b>Sedang bebas</b><small>Nggak ada rutinitas aktif sekarang</small></div></div>`;
    else html += `<div class="nowblock free"><span class="nowdot"></span><div><b>Belum ada rutinitas</b><small>Buka tab Jadwal buat nyusun harianmu</small></div></div>`;
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

    const recent = db.tx.filter(t => monthKey(t.date) === vm)
      .sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0,5);
    $('recentList').innerHTML = recent.length ? recent.map(SK.txRow).join('') : emptyBox;
  };

  SK.renderHistory = function () {
    const db = SK.db;
    const filter = SK.filter, query = SK.query;
    const opts = [['all','Semua'],['out','Keluar'],['in','Masuk'],['transfer','Transfer']];
    $('filterChips').innerHTML = opts.map(([k,l]) => `<button class="chip ${filter===k?'on':''}" data-f="${k}">${l}</button>`).join('');
    let list = db.tx.filter(t => filter === 'all' || t.type === filter);
    if (query) {
      list = list.filter(t => {
        const hay = [t.note, t.cat, walletName(t.wallet), t.type === 'transfer' ? walletName(t.toWallet) : '', String(t.amount)].join(' ').toLowerCase();
        return hay.includes(query);
      });
    }
    $('historyList').innerHTML = list.length ? SK.groupedList(list) : (query ? emptySearch : emptyBox);
  };

  SK.renderReport = function () {
    const db = SK.db;
    const m = SK.viewMonth;
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
  };

  // ---- Tasks segment ----
  SK.taskRow = function (t) {
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
  };
  SK.recurringReminders = function (ds) {
    const db = SK.db;
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
  };
  SK.renderTasksSegment = function () {
    const db = SK.db;
    const sd = SK.scheduleDate;
    const tasks = db.tasks.filter(t => t.date === sd).sort((a,b) => (a.time||'99').localeCompare(b.time||'99'));
    const reminders = SK.recurringReminders(sd);
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
      html += `<div class="task-group-title">${dayLabel(sd)}</div>`;
      html += tasks.map(SK.taskRow).join('');
    } else if (!reminders.length) {
      html += `<div class="empty"><b>Belum ada tugas</b>Tekan tombol + buat tambah tugas di hari ini.</div>`;
    }
    $('taskList').innerHTML = html;

    $('taskRecList').innerHTML = db.taskRec.length
      ? db.taskRec.map(r => {
          const freq = r.freq === 'daily' ? 'Harian'
            : r.freq === 'weekly' ? 'Tiap ' + SK.DOW[r.dow]
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
  };

  // ---- Routines segment ----
  SK.routineCardHtml = function (r, ds, nowMin, isToday) {
    const color = RCOLOR[r.cat] || '#607D8B';
    const emoji = REMOJI[r.cat] || '📌';
    const done = SK.isRoutineDone(ds, r.id);
    const a = isToday ? SK.routineActiveNow(r, nowMin) : { active:false, remain:0 };
    const durMin = rDuration(r);
    const durTxt = (durMin >= 60 ? Math.floor(durMin/60) + 'j ' : '') + (durMin % 60 ? (durMin%60) + 'm' : (durMin >= 60 ? '' : '0m'));
    const expKey = ds + ':' + r.id;
    const recorded = SK.db.routineExpense[expKey];
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
  };
  SK.renderRoutinesSegment = function () {
    const db = SK.db;
    const ds = SK.scheduleDate;
    const routines = SK.routinesForDay(ds).sort((a,b) => rStartMin(a) - rStartMin(b));
    const isToday = ds === todayStr();
    const now = new Date();
    const nowMin = isToday ? now.getHours()*60 + now.getMinutes() : -1;

    const nc = $('nowCard');
    if (!routines.length || !isToday) nc.innerHTML = '';
    else {
      let cur = null, rem = 0;
      for (const r of routines) { const a = SK.routineActiveNow(r, nowMin); if (a.active) { cur = r; rem = a.remain; break; } }
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

    const conflicts = SK.detectConflicts(routines);
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
        if (isToday && !nowInserted && rStartMin(r) > nowMin) { html += `<div class="nowline">SEKARANG</div>`; nowInserted = true; }
        html += SK.routineCardHtml(r, ds, nowMin, isToday);
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
      const s = SK.computeStreak();
      $('streakBox').innerHTML = s > 0
        ? `<div class="streak-card"><span class="fire">🔥</span><div><b>${s} hari berturut-turut</b><small>Semua rutinitas diselesaikan penuh</small></div></div>`
        : `<div class="streak-card" style="background:linear-gradient(135deg,var(--paper),var(--paper));color:var(--ink);border:1px solid var(--line)"><span class="fire">🔥</span><div><b style="color:var(--ink)">Streak belum mulai</b><small style="color:var(--ink-soft)">Centang semua rutinitas hari ini buat mulai</small></div></div>`;
    } else $('streakBox').innerHTML = '';
  };

  SK.renderSchedule = function () {
    const seg = SK.scheduleSeg;
    $('segRoutines').classList.toggle('hidden', seg !== 'routines');
    $('segTasks').classList.toggle('hidden', seg !== 'tasks');
    $('tplSection').classList.toggle('hidden', seg !== 'routines');
    $('taskRecSection').classList.toggle('hidden', seg !== 'tasks');
    document.querySelectorAll('#schedSeg button').forEach(b => b.classList.toggle('on', b.dataset.seg === seg));
    if (seg === 'routines') SK.renderRoutinesSegment();
    else SK.renderTasksSegment();
  };

  SK.renderAll = function () {
    SK.renderMonthBars();
    SK.renderDayBars();
    SK.renderHome();
    SK.renderHistory();
    SK.renderReport();
    SK.renderSchedule();
  };

})(window.SK);
