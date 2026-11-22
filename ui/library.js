// Galaktos — preset library: factory presets, user presets (localStorage), imports, favourites.
import { el } from './widgets.js';
import { FACTORY } from '../engine/presets.js';
import { normalizePreset } from '../engine/modulation.js';

const LS_FAV = 'galaktos.favs';
const LS_MINE = 'galaktos.mine';
const readLS = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const writeLS = (k, v) => { localStorage.setItem(k, JSON.stringify(v)); };
const byName = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });

export class Library {
  constructor(app) {
    this.app = app;
    this.entries = new Map(); // id -> {id, name, kind: factory|mine|imported, preset}
    this.factoryIds = [];
    for (const f of FACTORY) {
      const id = `f::${f.name}`;
      this.entries.set(id, { id, name: f.name, kind: 'factory', preset: normalizePreset(f) });
      this.factoryIds.push(id);
    }
    this.favs = new Set(readLS(LS_FAV, []));
    this.mine = readLS(LS_MINE, []).filter((m) => m && m.name && m.preset);
    this.imported = [];
    this._syncMine();
    this.view = [];
    this.currentId = null;
    this.filter = 'all';
    this.search = '';
  }

  _syncMine() {
    for (const id of [...this.entries.keys()]) if (id.startsWith('m::')) this.entries.delete(id);
    for (const m of this.mine) this.entries.set(`m::${m.name}`, { id: `m::${m.name}`, name: m.name, kind: 'mine', preset: normalizePreset({ ...m.preset, name: m.name }) });
  }

  // ---- UI ----
  mount(container) {
    this.$search = el('input', { type: 'search', placeholder: 'Search presets…' });
    this.$sel = el('select', { title: 'Collection' });
    this.$list = el('div', { class: 'plist' });
    this.$count = el('span', { class: 'dim' });
    this.$fav = el('button', { title: 'Toggle favourite (F)' }, '☆');
    this.$search.addEventListener('input', () => { this.search = this.$search.value; this.refresh(); });
    this.$sel.addEventListener('change', () => { this.filter = this.$sel.value; this.refresh(); });
    this.$list.addEventListener('click', (e) => { const d = e.target.closest('[data-id]'); if (d) this.app.loadById(d.dataset.id); });
    this.$fav.onclick = () => this.toggleFav();
    container.append(
      el('div', { class: 'brow' }, this.$search, this.$sel),
      this.$list,
      el('div', { class: 'brow' },
        el('button', { title: 'Previous (P)', onclick: () => this.step(-1) }, '◀'),
        el('button', { title: 'Next (N)', onclick: () => this.step(1) }, '▶'),
        el('button', { title: 'Random from this list (R)', onclick: () => this.random() }, '🎲'),
        this.$fav, this.$count),
    );
    this.buildSelect();
    this.refresh();
  }

  buildSelect() {
    const cur = this.filter;
    this.$sel.innerHTML = '';
    const opt = (v, t) => this.$sel.append(el('option', { value: v }, t));
    opt('all', `All (${this.factoryIds.length + this.mine.length})`);
    opt('factory', `Factory (${this.factoryIds.length})`);
    opt('mine', `My presets (${this.mine.length})`);
    opt('fav', `★ Favourites (${[...this.favs].filter((id) => this.entries.has(id)).length})`);
    if (this.imported.length) opt('imported', `Imported (${this.imported.length})`);
    this.$sel.value = [...this.$sel.options].some((o) => o.value === cur) ? cur : 'all';
    this.filter = this.$sel.value;
  }

  ids(filter) {
    const mineIds = this.mine.map((m) => `m::${m.name}`);
    switch (filter) {
      case 'factory': return this.factoryIds;
      case 'mine': return mineIds;
      case 'fav': return [...this.favs].filter((id) => this.entries.has(id));
      case 'imported': return this.imported.filter((id) => this.entries.has(id));
      default: return [...this.factoryIds, ...mineIds];
    }
  }

  refresh() {
    if (!this.$list) return;
    const terms = this.search.toLowerCase().split(/\s+/).filter(Boolean);
    const ids = this.ids(this.filter);
    this.view = terms.length ? ids.filter((id) => terms.every((t) => this.entries.get(id).name.toLowerCase().includes(t))) : ids;
    const frag = document.createDocumentFragment();
    for (const id of this.view) {
      const e = this.entries.get(id);
      const d = el('div', { 'data-id': id, class: id === this.currentId ? 'cur' : '' });
      if (this.favs.has(id)) d.append(el('span', { class: 'fav' }, '★ '));
      d.append(e.name);
      if (e.kind !== 'factory') d.append(el('span', { class: 'pk' }, e.kind === 'mine' ? 'mine' : 'imported'));
      frag.append(d);
    }
    this.$list.innerHTML = '';
    this.$list.append(frag);
    this.$count.textContent = `${this.view.length}`;
    this._scroll();
  }

  setCurrent(id) {
    this.currentId = id;
    if (!this.$list) return;
    for (const d of this.$list.querySelectorAll('.cur')) d.classList.remove('cur');
    const d = this.$list.querySelector(`[data-id="${CSS.escape(id || '')}"]`);
    if (d) d.classList.add('cur');
    this.$fav.textContent = id && this.favs.has(id) ? '★' : '☆';
    this._scroll();
  }

  _scroll() {
    const d = this.$list && this.$list.querySelector('.cur');
    if (!d) return;
    const top = d.offsetTop, h = this.$list.clientHeight;
    if (top < this.$list.scrollTop || top > this.$list.scrollTop + h - 24) this.$list.scrollTop = top - h / 2;
  }

  step(dir) {
    const v = this.view.length ? this.view : this.ids('all');
    if (!v.length) return;
    let i = v.indexOf(this.currentId);
    i = i < 0 ? 0 : (i + dir + v.length) % v.length;
    this.app.loadById(v[i]);
  }

  random() {
    const v = this.view.length ? this.view : this.ids('all');
    if (!v.length) return;
    let id = v[Math.floor(Math.random() * v.length)];
    if (id === this.currentId && v.length > 1) id = v[(v.indexOf(id) + 1) % v.length];
    this.app.loadById(id);
  }

  toggleFav() {
    const id = this.currentId;
    if (!id || !this.entries.has(id)) return;
    if (this.favs.has(id)) this.favs.delete(id); else this.favs.add(id);
    try { writeLS(LS_FAV, [...this.favs]); } catch { /* */ }
    this.buildSelect(); this.refresh(); this.setCurrent(id);
  }

  get(id) { return this.entries.get(id); }

  saveMine(name, preset) {
    const rec = { name, preset: { ...preset, name } };
    const i = this.mine.findIndex((m) => m.name === name);
    const before = this.mine.slice();
    if (i >= 0) this.mine[i] = rec; else this.mine.push(rec);
    this.mine.sort((a, b) => byName(a.name, b.name));
    try { writeLS(LS_MINE, this.mine); } catch {
      this.mine = before;
      throw new Error('Browser storage is full — export the preset to a file instead.');
    }
    this._syncMine(); this.buildSelect(); this.refresh();
    return `m::${name}`;
  }

  deleteMine(name) {
    this.mine = this.mine.filter((m) => m.name !== name);
    this.favs.delete(`m::${name}`);
    try { writeLS(LS_MINE, this.mine); writeLS(LS_FAV, [...this.favs]); } catch { /* */ }
    this._syncMine(); this.buildSelect(); this.refresh();
  }

  addImported(preset) {
    let n = preset.name || 'Imported', k = 2;
    const base = n;
    while (this.entries.has(`i::${n}`)) n = `${base} (${k++})`;
    const id = `i::${n}`;
    this.entries.set(id, { id, name: n, kind: 'imported', preset: { ...preset, name: n } });
    this.imported.push(id);
    return id;
  }

  showImported() {
    this.buildSelect();
    this.filter = 'imported'; this.$sel.value = 'imported';
    this.refresh();
  }
}
