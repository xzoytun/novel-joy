// js/sheets.js — sheet & form handlers
(function (SK) {
  'use strict';

  const $ = SK.$, rp = SK.rp, esc = SK.esc, digits = SK.digits,
        uid = SK.uid, todayStr = SK.todayStr, thisMonth = SK.thisMonth,
        addMonth = SK.addMonth, addDays = SK.addDays, toast = SK.toast,
        walletName = SK.walletName, walletBalance = SK.walletBalance,
        CATS = SK.CATS, TASK_CATS = SK.TASK_CATS, ROUTINE_CATS = SK.ROUTINE_CATS,
        ROUTINE_TEMPLATES = SK.ROUTINE_TEMPLATES, DOW = SK.DOW;

  // ---- Overlay open/close ----
  SK.openOv = (id) => $(id).classList.add('open');
  SK.closeOv = (id) => $(id).classList.remove('open');

  document.querySelectorAll('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')); });

  // ---- Navigation between views ----
  SK.showView = function (name) {
    SK.currentView = name;
    ['Home','History','Schedule','Report'].forEach(v => $('view'+v).classList.toggle('hidden', v !== name));
    document.querySelectorAll('.nav button[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    window.scrollTo(0, 0);
  };

  // ---- Money input binding ----
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

  // ==================== TRANSACTION SHEET ====================
  function renderFormChips() {
    const form = SK.form;
    const isTf = form.type === 'transfer';
    $('catBlock').classList.toggle('hidden', isTf);
    $('toWalletBlock').classList.toggle('hidden', !isTf);
    $('walletLabel').textContent = isTf ? 'Dari dompet' : 'Dompet';
    if (!isTf) $('catChips').innerHTML = CATS[form.type].map(([n,e]) => `<button class="chip ${form.cat===n?'on':''}" data-cat="${n}">${e} ${n}</button>`).join('');
    $('walletChips').innerHTML = SK.db.wallets.map(w => `<button class="chip ${form.wallet===w.id?'on':''}" data-w="${w.id}">${esc(w.name)}</button>`).join('');
    $('toWalletChips').innerHTML = SK.db.wallets.map(w => `<button class="chip ${form.toWallet===w.id?'on':''}" data-tw="${w.id}">${esc(w.name)}</button>`).join('');
    document.querySelectorAll('#typeSeg button').forEach(b => { b.className = b.dataset.type === form.type ? 'on ' + form.type : ''; });
  }

  SK.openTx = function (tx) {
    if (!SK.db.wallets.length) { toast('Tambah dompet dulu lewat ikon dompet di atas.'); return; }
    if (tx) {
      SK.form = { id: tx.id, type: tx.type, cat: tx.cat || 'Makan', wallet: tx.wallet, toWallet: tx.toWallet || null };
      $('txTitle').textContent = 'Ubah transaksi';
      $('amountInput').value = tx.amount.toLocaleString('id-ID');
      $('noteInput').value = tx.note || '';
      $('dateInput').value = tx.date;
      $('deleteTx').classList.remove('hidden');
    } else {
      SK.form = { id: null, type: 'out', cat: 'Makan', wallet: SK.db.wallets[0].id, toWallet: SK.db.wallets[1] ? SK.db.wallets[1].id : null };
      $('txTitle').textContent = 'Catat transaksi';
      $('amountInput').value = ''; $('noteInput').value = '';
      $('dateInput').value = todayStr();
      $('deleteTx').classList.add('hidden');
    }
    renderFormChips();
    SK.openOv('txOverlay');
    setTimeout(() => $('amountInput').focus(), 120);
  };

  $('typeSeg').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    SK.form.type = b.dataset.type;
    if (SK.form.type === 'transfer') {
      SK.form.cat = 'Transfer';
      if (!SK.form.toWallet || SK.form.toWallet === SK.form.wallet) {
        const other = SK.db.wallets.find(w => w.id !== SK.form.wallet);
        SK.form.toWallet = other ? other.id : null;
      }
    } else SK.form.cat = CATS[SK.form.type][0][0];
    renderFormChips();
  });
  $('catChips').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (b) { SK.form.cat = b.dataset.cat; renderFormChips(); } });
  $('walletChips').addEventListener('click', e => { const b = e.target.closest('[data-w]'); if (b) { SK.form.wallet = b.dataset.w; renderFormChips(); } });
  $('toWalletChips').addEventListener('click', e => { const b = e.target.closest('[data-tw]'); if (b) { SK.form.toWallet = b.dataset.tw; renderFormChips(); } });

  $('saveTx').addEventListener('click', () => {
    const db = SK.db, form = SK.form;
    const amount = digits($('amountInput').value);
    if (!amount) { toast('Isi nominalnya dulu ya.'); $('amountInput').focus(); return; }
    if (!form.wallet) { toast('Pilih dompet dulu.'); return; }
    if (form.type === 'transfer') {
      if (!form.toWallet) { toast('Pilih dompet tujuan.'); return; }
      if (form.toWallet === form.wallet) { toast('Dompet asal dan tujuan nggak boleh sama.'); return; }
    }
    const date = $('dateInput').value || todayStr();
    const note = $('noteInput').value.trim();
    const payload = { type: form.type, wallet: form.wallet, amount, note, date };
    if (form.type === 'transfer') { payload.cat = 'Transfer'; payload.toWallet = form.toWallet; }
    else payload.cat = form.cat;
    if (form.id) {
      const t = db.tx.find(x => x.id === form.id);
      Object.assign(t, payload);
      if (form.type !== 'transfer') delete t.toWallet;
      toast('Transaksi diperbarui');
    } else {
      db.tx.push(Object.assign({ id: uid() }, payload));
      toast(form.type === 'in' ? 'Pemasukan tersimpan' : form.type === 'transfer' ? 'Transfer tersimpan' : 'Pengeluaran tersimpan');
    }
    SK.save(); SK.renderAll(); SK.closeOv('txOverlay');
  });
  $('deleteTx').addEventListener('click', () => {
    if (!confirm('Hapus transaksi ini?')) return;
    SK.db.tx = SK.db.tx.filter(t => t.id !== SK.form.id);
    SK.save(); SK.renderAll(); SK.closeOv('txOverlay'); toast('Transaksi dihapus');
  });

  // ==================== BUDGET SHEET ====================
  $('editBudget').addEventListener('click', () => {
    $('budgetInput').value = SK.db.budget ? SK.db.budget.toLocaleString('id-ID') : '';
    $('catBudgetList').innerHTML = CATS.out.map(([n,e]) => {
      const v = SK.db.catBudgets[n] || 0;
      return `<div class="brow"><span>${e} ${n}</span><input class="binput" data-cb="${n}" inputmode="numeric" placeholder="0" value="${v ? v.toLocaleString('id-ID') : ''}"></div>`;
    }).join('');
    SK.openOv('budgetOverlay');
    setTimeout(() => $('budgetInput').focus(), 120);
  });
  $('saveBudget').addEventListener('click', () => {
    SK.db.budget = digits($('budgetInput').value);
    const cb = {};
    $('catBudgetList').querySelectorAll('[data-cb]').forEach(inp => {
      const v = digits(inp.value);
      if (v) cb[inp.dataset.cb] = v;
    });
    SK.db.catBudgets = cb;
    SK.save(); SK.renderAll(); SK.closeOv('budgetOverlay');
    toast(SK.db.budget || Object.keys(cb).length ? 'Budget disimpan' : 'Budget dimatikan');
  });

  // ==================== WALLET SHEET ====================
  SK.renderWalletManage = function () {
    $('walletManage').innerHTML = SK.db.wallets.map(w => `<div class="tx" style="cursor:default">
      <div class="emoji">👛</div>
      <div class="meta"><b>${esc(w.name)}</b><small>Saldo ${rp(walletBalance(w))}</small></div>
      <button class="chip" data-delw="${w.id}" style="color:var(--out)">Hapus</button></div>`).join('')
      || '<p class="hint">Belum ada dompet.</p>';
  };
  $('walletNavBtn').addEventListener('click', () => { SK.renderWalletManage(); SK.openOv('walletOverlay'); });
  $('walletManage').addEventListener('click', e => {
    const b = e.target.closest('[data-delw]'); if (!b) return;
    const id = b.dataset.delw;
    const db = SK.db;
    const used = db.tx.some(t => t.wallet === id || t.toWallet === id) || db.tasks.some(t => t.wallet === id) || db.routines.some(r => r.wallet === id);
    if (!confirm(used ? 'Dompet ini punya data. Kalau dihapus, datanya ikut terhapus. Lanjut?' : 'Hapus dompet ini?')) return;
    db.wallets = db.wallets.filter(w => w.id !== id);
    db.tx = db.tx.filter(t => t.wallet !== id && t.toWallet !== id);
    db.recurring = db.recurring.filter(r => r.wallet !== id);
    db.tasks = db.tasks.filter(t => t.wallet !== id);
    db.taskRec = db.taskRec.filter(r => r.wallet !== id);
    SK.save(); SK.renderWalletManage(); SK.renderAll(); toast('Dompet dihapus');
  });
  $('addWallet').addEventListener('click', () => {
    const name = $('newWalletName').value.trim();
    if (!name) { toast('Isi nama dompetnya dulu.'); return; }
    SK.db.wallets.push({ id: 'w_' + uid(), name, start: digits($('newWalletBal').value) });
    $('newWalletName').value = ''; $('newWalletBal').value = '';
    SK.save(); SK.renderWalletManage(); SK.renderAll(); toast('Dompet ditambahkan');
  });

  // ==================== RECURRING TX SHEET ====================
  function renderRecChips() {
    const recForm = SK.recForm;
    $('recCatChips').innerHTML = CATS[recForm.type].map(([n,e]) => `<button class="chip ${recForm.cat===n?'on':''}" data-rcat="${n}">${e} ${n}</button>`).join('');
    $('recWalletChips').innerHTML = SK.db.wallets.map(w => `<button class="chip ${recForm.wallet===w.id?'on':''}" data-rw="${w.id}">${esc(w.name)}</button>`).join('');
    document.querySelectorAll('#recTypeSeg button').forEach(b => { b.className = b.dataset.rt === recForm.type ? 'on ' + recForm.type : ''; });
  }
  $('addRec').addEventListener('click', () => {
    if (!SK.db.wallets.length) { toast('Tambah dompet dulu.'); return; }
    SK.recForm = { type: 'out', cat: 'Makan', wallet: SK.db.wallets[0].id };
    $('recAmount').value = ''; $('recNote').value = ''; $('recDay').value = 1;
    renderRecChips(); SK.openOv('recOverlay');
    setTimeout(() => $('recAmount').focus(), 120);
  });
  $('recTypeSeg').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    SK.recForm.type = b.dataset.rt; SK.recForm.cat = CATS[SK.recForm.type][0][0]; renderRecChips();
  });
  $('recCatChips').addEventListener('click', e => { const b = e.target.closest('[data-rcat]'); if (b) { SK.recForm.cat = b.dataset.rcat; renderRecChips(); } });
  $('recWalletChips').addEventListener('click', e => { const b = e.target.closest('[data-rw]'); if (b) { SK.recForm.wallet = b.dataset.rw; renderRecChips(); } });
  $('saveRec').addEventListener('click', () => {
    const amount = digits($('recAmount').value);
    if (!amount) { toast('Isi nominalnya dulu.'); $('recAmount').focus(); return; }
    if (!SK.recForm.wallet) { toast('Pilih dompet dulu.'); return; }
    const day = Math.min(Math.max(parseInt($('recDay').value, 10) || 1, 1), 31);
    const cur = thisMonth();
    const dayNow = new Date().getDate();
    SK.db.recurring.push({ id: uid(), type: SK.recForm.type, cat: SK.recForm.cat, wallet: SK.recForm.wallet, amount, note: $('recNote').value.trim(), day, lastRun: day <= dayNow ? cur : addMonth(cur, -1) });
    SK.save();
    const n = SK.runRecurring();
    SK.save(); SK.renderAll(); SK.closeOv('recOverlay');
    toast(n ? 'Berulang disimpan, ' + n + ' transaksi dicatat' : 'Transaksi berulang disimpan');
  });
  $('recList').addEventListener('click', e => {
    const b = e.target.closest('[data-delrec]'); if (!b) return;
    if (!confirm('Hentikan transaksi berulang ini?')) return;
    SK.db.recurring = SK.db.recurring.filter(r => r.id !== b.dataset.delrec);
    SK.save(); SK.renderAll(); toast('Transaksi berulang dihentikan');
  });

  // ==================== TASK SHEET ====================
  function renderTaskChips() {
    const taskForm = SK.taskForm;
    $('taskCatChips').innerHTML = TASK_CATS.map(([n,c]) => `<button class="chip ${taskForm.cat===n?'on':''}" data-tcat="${n}"><span class="cat-dot" style="background:${c}"></span>${n}</button>`).join('');
    $('taskWalletChips').innerHTML = SK.db.wallets.map(w => `<button class="chip ${taskForm.wallet===w.id?'on':''}" data-tw2="${w.id}">${esc(w.name)}</button>`).join('');
  }
  SK.openTaskForm = function (t) {
    if (t) {
      SK.taskForm = { id: t.id, cat: t.cat || 'Pribadi', wallet: t.wallet || (SK.db.wallets[0] && SK.db.wallets[0].id) };
      $('taskTitle').textContent = 'Ubah tugas';
      $('taskTitleInput').value = t.title;
      $('taskDate').value = t.date;
      $('taskTime').value = t.time || '';
      $('taskCost').value = t.cost ? t.cost.toLocaleString('id-ID') : '';
      $('deleteTask').classList.remove('hidden');
    } else {
      SK.taskForm = { id: null, cat: 'Pribadi', wallet: SK.db.wallets[0] ? SK.db.wallets[0].id : null };
      $('taskTitle').textContent = 'Tambah tugas';
      $('taskTitleInput').value = '';
      $('taskDate').value = SK.scheduleDate;
      $('taskTime').value = '';
      $('taskCost').value = '';
      $('deleteTask').classList.add('hidden');
    }
    renderTaskChips();
    SK.openOv('taskOverlay');
    setTimeout(() => $('taskTitleInput').focus(), 120);
  };
  $('taskCatChips').addEventListener('click', e => { const b = e.target.closest('[data-tcat]'); if (b) { SK.taskForm.cat = b.dataset.tcat; renderTaskChips(); } });
  $('taskWalletChips').addEventListener('click', e => { const b = e.target.closest('[data-tw2]'); if (b) { SK.taskForm.wallet = b.dataset.tw2; renderTaskChips(); } });
  $('saveTask').addEventListener('click', () => {
    const title = $('taskTitleInput').value.trim();
    if (!title) { toast('Isi judulnya dulu.'); $('taskTitleInput').focus(); return; }
    const date = $('taskDate').value || todayStr();
    const time = $('taskTime').value || '';
    const cost = digits($('taskCost').value);
    const payload = { title, date, time, cost, cat: SK.taskForm.cat, wallet: SK.taskForm.wallet || null };
    if (SK.taskForm.id) {
      const t = SK.db.tasks.find(x => x.id === SK.taskForm.id);
      Object.assign(t, payload);
      toast('Tugas diperbarui');
    } else {
      SK.db.tasks.push(Object.assign({ id: uid(), done: false }, payload));
      toast('Tugas ditambahkan');
    }
    SK.save(); SK.renderAll(); SK.closeOv('taskOverlay');
  });
  $('deleteTask').addEventListener('click', () => {
    if (!confirm('Hapus tugas ini?')) return;
    SK.db.tasks = SK.db.tasks.filter(t => t.id !== SK.taskForm.id);
    SK.save(); SK.renderAll(); SK.closeOv('taskOverlay'); toast('Tugas dihapus');
  });

  // ==================== RECURRING TASK SHEET ====================
  function renderTrChips() {
    const trForm = SK.trForm;
    document.querySelectorAll('#trFreqSeg button').forEach(b => { b.className = b.dataset.freq === trForm.freq ? 'on transfer' : ''; });
    $('trWeeklyBlock').classList.toggle('hidden', trForm.freq !== 'weekly');
    $('trMonthlyBlock').classList.toggle('hidden', trForm.freq !== 'monthly');
    $('trDowChips').innerHTML = DOW.map((d,i) => `<button class="chip ${trForm.dow===i?'on':''}" data-dow="${i}">${d}</button>`).join('');
    $('trCatChips').innerHTML = TASK_CATS.map(([n,c]) => `<button class="chip ${trForm.cat===n?'on':''}" data-trcat="${n}"><span class="cat-dot" style="background:${c}"></span>${n}</button>`).join('');
    $('trWalletChips').innerHTML = SK.db.wallets.map(w => `<button class="chip ${trForm.wallet===w.id?'on':''}" data-trw="${w.id}">${esc(w.name)}</button>`).join('');
  }
  $('addTaskRec').addEventListener('click', () => {
    if (!SK.db.wallets.length) { toast('Tambah dompet dulu.'); return; }
    SK.trForm = { freq: 'daily', dow: 1, cat: 'Pribadi', wallet: SK.db.wallets[0].id };
    $('trTitle').value = ''; $('trDom').value = 1; $('trTime').value = ''; $('trCost').value = '';
    renderTrChips(); SK.openOv('taskRecOverlay');
    setTimeout(() => $('trTitle').focus(), 120);
  });
  $('trFreqSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; SK.trForm.freq = b.dataset.freq; renderTrChips(); });
  $('trDowChips').addEventListener('click', e => { const b = e.target.closest('[data-dow]'); if (!b) return; SK.trForm.dow = Number(b.dataset.dow); renderTrChips(); });
  $('trCatChips').addEventListener('click', e => { const b = e.target.closest('[data-trcat]'); if (!b) return; SK.trForm.cat = b.dataset.trcat; renderTrChips(); });
  $('trWalletChips').addEventListener('click', e => { const b = e.target.closest('[data-trw]'); if (!b) return; SK.trForm.wallet = b.dataset.trw; renderTrChips(); });
  $('saveTaskRec').addEventListener('click', () => {
    const title = $('trTitle').value.trim();
    if (!title) { toast('Isi judulnya dulu.'); $('trTitle').focus(); return; }
    const dom = Math.min(Math.max(parseInt($('trDom').value, 10) || 1, 1), 31);
    const today = todayStr();
    SK.db.taskRec.push({ id: uid(), title, freq: SK.trForm.freq, dow: SK.trForm.dow, dom, time: $('trTime').value || '', cost: digits($('trCost').value), cat: SK.trForm.cat, wallet: SK.trForm.wallet || null, lastRun: addDays(today, -1) });
    SK.save();
    const n = SK.runTaskRecurring();
    SK.save(); SK.renderAll(); SK.closeOv('taskRecOverlay');
    toast(n ? 'Kegiatan berulang disimpan, ' + n + ' kegiatan dibuat' : 'Kegiatan berulang disimpan');
  });
  $('taskRecList').addEventListener('click', e => {
    const b = e.target.closest('[data-deltr]'); if (!b) return;
    if (!confirm('Hentikan kegiatan berulang ini?')) return;
    SK.db.taskRec = SK.db.taskRec.filter(r => r.id !== b.dataset.deltr);
    SK.save(); SK.renderAll(); toast('Kegiatan berulang dihentikan');
  });

  // ==================== ROUTINE SHEET ====================
  function renderRoutineChips() {
    const rForm = SK.rForm;
    $('rCatChips').innerHTML = ROUTINE_CATS.map(([n,e,c]) => `<button class="chip ${rForm.cat===n?'on':''}" data-rcat2="${n}"><span class="cat-dot" style="background:${c}"></span>${e} ${n}</button>`).join('');
    $('rDayChips').innerHTML = DOW.map((d,i) => `<button class="chip ${rForm.days.includes(i)?'on':''}" data-rday="${i}">${d}</button>`).join('');
    $('rWalletChips').innerHTML = SK.db.wallets.map(w => `<button class="chip ${rForm.wallet===w.id?'on':''}" data-rwallet="${w.id}">${esc(w.name)}</button>`).join('');
  }
  SK.openRoutineForm = function (r) {
    if (r) {
      SK.rForm = { id: r.id, cat: r.cat || 'Olahraga', days: [...r.days], wallet: r.wallet || (SK.db.wallets[0] && SK.db.wallets[0].id) };
      $('routineTitle').textContent = 'Ubah rutinitas';
      $('rTitle').value = r.title;
      $('rStart').value = r.start;
      $('rEnd').value = r.end;
      $('rCost').value = r.cost ? r.cost.toLocaleString('id-ID') : '';
      $('deleteRoutine').classList.remove('hidden');
    } else {
      SK.rForm = { id: null, cat: 'Olahraga', days: [1,2,3,4,5], wallet: SK.db.wallets[0] ? SK.db.wallets[0].id : null };
      $('routineTitle').textContent = 'Tambah rutinitas';
      $('rTitle').value = '';
      $('rStart').value = '06:00';
      $('rEnd').value = '07:00';
      $('rCost').value = '';
      $('deleteRoutine').classList.add('hidden');
    }
    renderRoutineChips();
    SK.openOv('routineOverlay');
    setTimeout(() => $('rTitle').focus(), 120);
  };
  $('rCatChips').addEventListener('click', e => { const b = e.target.closest('[data-rcat2]'); if (b) { SK.rForm.cat = b.dataset.rcat2; renderRoutineChips(); } });
  $('rDayChips').addEventListener('click', e => {
    const b = e.target.closest('[data-rday]'); if (!b) return;
    const d = Number(b.dataset.rday);
    const i = SK.rForm.days.indexOf(d);
    if (i >= 0) SK.rForm.days.splice(i, 1); else SK.rForm.days.push(d);
    SK.rForm.days.sort((a,b) => a-b);
    renderRoutineChips();
  });
  document.querySelectorAll('[data-daypreset]').forEach(b => b.addEventListener('click', () => {
    const p = b.dataset.daypreset;
    SK.rForm.days = p === 'weekday' ? [1,2,3,4,5] : p === 'weekend' ? [0,6] : [0,1,2,3,4,5,6];
    renderRoutineChips();
  }));
  $('rWalletChips').addEventListener('click', e => { const b = e.target.closest('[data-rwallet]'); if (b) { SK.rForm.wallet = b.dataset.rwallet; renderRoutineChips(); } });
  $('saveRoutine').addEventListener('click', () => {
    const title = $('rTitle').value.trim();
    if (!title) { toast('Isi judulnya dulu.'); $('rTitle').focus(); return; }
    if (!SK.rForm.days.length) { toast('Pilih minimal satu hari aktif.'); return; }
    const start = $('rStart').value || '06:00';
    const end = $('rEnd').value || '07:00';
    if (start === end) { toast('Jam mulai dan selesai nggak boleh sama.'); return; }
    const cost = digits($('rCost').value);
    const payload = { title, cat: SK.rForm.cat, start, end, days: [...SK.rForm.days], cost, wallet: cost > 0 ? (SK.rForm.wallet || null) : null };
    if (SK.rForm.id) {
      const r = SK.db.routines.find(x => x.id === SK.rForm.id);
      Object.assign(r, payload);
      toast('Rutinitas diperbarui');
    } else {
      SK.db.routines.push(Object.assign({ id: uid() }, payload));
      toast('Rutinitas ditambahkan');
    }
    SK.save(); SK.renderAll(); SK.closeOv('routineOverlay');
  });
  $('deleteRoutine').addEventListener('click', () => {
    if (!confirm('Hapus rutinitas ini?')) return;
    SK.db.routines = SK.db.routines.filter(r => r.id !== SK.rForm.id);
    SK.save(); SK.renderAll(); SK.closeOv('routineOverlay'); toast('Rutinitas dihapus');
  });

  // ==================== TEMPLATES ====================
  $('openTemplates').addEventListener('click', () => {
    $('templateList').innerHTML = Object.entries(ROUTINE_TEMPLATES).map(([k,t]) =>
      `<button class="tpl-card" data-tpl="${k}">
        <b>${t.name}</b>
        <small>${esc(t.desc)}<br>${t.items.length} blok rutinitas</small>
      </button>`
    ).join('');
    SK.openOv('templateOverlay');
  });
  $('templateList').addEventListener('click', e => {
    const b = e.target.closest('[data-tpl]'); if (!b) return;
    const t = ROUTINE_TEMPLATES[b.dataset.tpl];
    if (!t) return;
    if (SK.db.routines.length && !confirm('Ini bakal menambahkan rutinitas dari template di atas rutinitas yang sudah ada. Lanjut?')) return;
    t.items.forEach(item => {
      SK.db.routines.push({ id: uid(), title: item.title, cat: item.cat, start: item.start, end: item.end, days: [...item.days], cost: item.cost || 0, wallet: item.cost > 0 ? (SK.db.wallets[0] && SK.db.wallets[0].id) : null });
    });
    SK.save(); SK.renderAll(); SK.closeOv('templateOverlay');
    toast(t.items.length + ' rutinitas ditambahkan');
  });

  // ==================== ABOUT ====================
  SK.openAbout = function () { SK.openOv('aboutOverlay'); };

  // ==================== PIN ====================
  function renderPinSheet() {
    if (SK.db.pinHash) {
      $('pinSetupBlock').classList.add('hidden');
      $('pinManageBlock').classList.remove('hidden');
    } else {
      $('pinSetupBlock').classList.remove('hidden');
      $('pinManageBlock').classList.add('hidden');
      $('pinNew').value = '';
      $('pinConfirm').value = '';
      $('pinSetupErr').textContent = '';
    }
  }
  $('pinManageBtn').addEventListener('click', () => { renderPinSheet(); SK.openOv('pinOverlay'); });
  $('pinSave').addEventListener('click', () => {
    const a = $('pinNew').value.trim();
    const b = $('pinConfirm').value.trim();
    const err = $('pinSetupErr');
    if (!/^\d{4,6}$/.test(a)) { err.textContent = 'PIN harus 4–6 digit angka.'; return; }
    if (a !== b) { err.textContent = 'PIN dan ulangannya nggak sama.'; return; }
    SK.db.pinHash = SK.hashPin(a);
    SK.save();
    SK.closeOv('pinOverlay');
    toast('PIN aktif. Jangan lupa ya.');
  });
  $('pinChange').addEventListener('click', () => {
    $('pinVerify').value = ''; $('pinVerifyErr').textContent = '';
    SK.pendingPinAction = 'change';
    SK.openOv('pinConfirmOverlay');
  });
  $('pinRemove').addEventListener('click', () => {
    $('pinVerify').value = ''; $('pinVerifyErr').textContent = '';
    SK.pendingPinAction = 'remove';
    SK.openOv('pinConfirmOverlay');
  });
  $('pinVerifyOk').addEventListener('click', () => {
    const v = $('pinVerify').value.trim();
    if (SK.hashPin(v) !== SK.db.pinHash) {
      $('pinVerifyErr').textContent = 'PIN salah.';
      $('pinVerify').classList.add('error');
      setTimeout(() => $('pinVerify').classList.remove('error'), 400);
      return;
    }
    SK.closeOv('pinConfirmOverlay');
    if (SK.pendingPinAction === 'remove') {
      SK.db.pinHash = null;
      SK.save(); SK.closeOv('pinOverlay');
      toast('PIN dimatikan');
    } else if (SK.pendingPinAction === 'change') {
      $('pinSetupBlock').classList.remove('hidden');
      $('pinManageBlock').classList.add('hidden');
      $('pinNew').value = ''; $('pinConfirm').value = ''; $('pinSetupErr').textContent = '';
      setTimeout(() => $('pinNew').focus(), 120);
    }
    SK.pendingPinAction = null;
  });
  SK.showPinLock = function () {
    $('pinLock').classList.add('open');
    $('pinLockInput').value = '';
    $('pinLockErr').textContent = '';
    setTimeout(() => $('pinLockInput').focus(), 120);
  };
  SK.tryUnlock = function () {
    const v = $('pinLockInput').value.trim();
    if (SK.hashPin(v) === SK.db.pinHash) {
      $('pinLock').classList.remove('open');
      SK.renderAll();
      SK.setupNotifications();
    } else {
      $('pinLockErr').textContent = 'PIN salah, coba lagi.';
      $('pinLockInput').classList.add('error');
      setTimeout(() => $('pinLockInput').classList.remove('error'), 400);
      $('pinLockInput').value = '';
      $('pinLockInput').focus();
    }
  };
  $('pinUnlock').addEventListener('click', SK.tryUnlock);
  $('pinLockInput').addEventListener('keydown', e => { if (e.key === 'Enter') SK.tryUnlock(); });
  $('pinLockInput').addEventListener('input', () => { $('pinLockErr').textContent = ''; });

})(window.SK);
