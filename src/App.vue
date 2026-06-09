<template>
  <div id="ide-root">
    <router-view />
  </div>
</template>

<script>
export default { name: 'App' };
</script>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #app, #ide-root { height: 100%; width: 100%; overflow: hidden; }
body {
  font-family: 'Inter', sans-serif;
  background: #0f172a;
  color: #f1f5f9;
  -webkit-font-smoothing: antialiased;
}
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #475569; }
input::placeholder, textarea::placeholder { color: #475569; }
button, select, textarea { font-family: 'Inter', sans-serif; }

/* Vuetify reset */
.v-application { font-family: 'Inter', sans-serif !important; background: transparent !important; }
.v-application--wrap { min-height: unset !important; }
.v-btn { letter-spacing: 0 !important; text-transform: none !important; font-family: 'Inter', sans-serif !important; }
.v-dialog > .v-card { border-radius: 12px !important; }

/* ── Global Utility Classes ── */
.ide-ia-card {
  background: #1e293b;
  border: 1px solid #1e3a5f33;
  border-radius: 12px;
  padding: 16px;
}
.ide-ia-card--hover { cursor: pointer; transition: border-color 0.15s; }
.ide-ia-card--hover:hover { border-color: #6366f133; }

.section-title { font-size: 18px; font-weight: 800; color: #f1f5f9; margin-bottom: 4px; letter-spacing: -0.3px; }
.section-subtitle { font-size: 12px; color: #64748b; margin-bottom: 16px; }
.stat-value { font-size: 28px; font-weight: 900; color: #f1f5f9; line-height: 1.1; }
.score-bar { height: 4px; background: #1e3a5f33; border-radius: 2px; overflow: hidden; }

/* ── Module Layout (CRM Chat sub-nav pattern) ── */
.ide-mod        { display: flex; height: 100%; overflow: hidden; }
.ide-page       { height: 100%; overflow-y: auto; padding: 20px 24px; }
.ide-subnav     { width: 200px; flex-shrink: 0; border-right: 1px solid #1e3a5f44; padding: 12px 8px; overflow-y: auto; }
.ide-body       { flex: 1; overflow-y: auto; padding: 24px 28px; }
.ide-body--bare { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

.ide-sn-hd {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px 14px;
  border-bottom: 1px solid #1e3a5f33;
  margin-bottom: 8px;
}
.ide-sn-ico {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; flex-shrink: 0;
}
.ide-sn-title  { font-size: 12px; font-weight: 800; color: #e2e8f0; }
.ide-sn-sub    { font-size: 9px; font-weight: 700; }
.ide-sn-sep    { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px 10px; }

.ide-sn-btn {
  display: flex; align-items: center; gap: 9px;
  width: 100%; padding: 9px 12px; margin-bottom: 2px;
  border-radius: 8px; border: none; cursor: pointer;
  background: transparent; color: #64748b;
  font-size: 12px; font-weight: 500;
  transition: all 0.15s; text-align: left;
  font-family: 'Inter', sans-serif;
}
.ide-sn-btn:hover    { background: #1e293b55; color: #94a3b8; }
.ide-sn-btn--o { background: #c9644222 !important; color: #e8956d !important; font-weight: 700; }
.ide-sn-btn--i { background: #6366f122 !important; color: #818cf8 !important; font-weight: 700; }

/* ── Global Form Elements ── */
.ide-field       { display: flex; flex-direction: column; gap: 6px; margin-bottom: 0; }
.ide-field label { font-size: 12px; font-weight: 700; color: #94a3b8; }
.ide-input, .ide-select, .ide-textarea {
  background: #0f172a; border: 1px solid #334155; border-radius: 8px;
  color: #f1f5f9; font-size: 13px; padding: 8px 12px;
  outline: none; font-family: inherit; width: 100%;
  transition: border-color 0.15s;
}
.ide-input:focus, .ide-select:focus, .ide-textarea:focus { border-color: #6366f1; }
.ide-textarea { resize: vertical; }
.ide-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px;
}

/* ── Global Modal ── */
.ct-modal-backdrop {
  position: fixed; inset: 0; z-index: 300;
  background: #00000099;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.ct-modal {
  background: #0d1526; border: 1px solid #1e3a5f66;
  border-radius: 14px; width: 100%; max-width: 520px;
  max-height: 90vh; display: flex; flex-direction: column;
  overflow: hidden; box-shadow: 0 20px 60px #00000088;
}
.ct-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #1e3a5f44;
  font-size: 15px; font-weight: 800; color: #f1f5f9; flex-shrink: 0;
}
.ct-modal-close {
  background: none; border: none; color: #64748b;
  cursor: pointer; font-size: 16px; padding: 2px 6px; border-radius: 6px;
}
.ct-modal-close:hover { color: #ef4444; }
.ct-modal-body { flex: 1; overflow-y: auto; padding: 20px; }
.ct-modal-footer {
  display: flex; gap: 8px; justify-content: flex-end;
  padding: 12px 20px; border-top: 1px solid #1e3a5f44; flex-shrink: 0;
}

/* ── Global Form Grid ── */
.ct-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ct-form-full  { grid-column: 1 / -1; }

/* ── Global Buttons ── */
.ct-btn-ok {
  padding: 8px 20px; border-radius: 8px; background: #6366f1;
  color: #fff; border: none; cursor: pointer; font-size: 12px;
  font-weight: 600; font-family: inherit; transition: background 0.15s;
}
.ct-btn-ok:hover:not(:disabled) { background: #4f46e5; }
.ct-btn-ok:disabled { opacity: .5; cursor: not-allowed; }
.ct-btn-cancel {
  padding: 8px 16px; border-radius: 8px; background: #1e3a5f44;
  color: #64748b; border: 1px solid #1e3a5f; cursor: pointer;
  font-size: 12px; font-family: inherit;
}
.ct-btn-cancel:hover { color: #94a3b8; }

/* ── Global Badge ── */
.ct-badge {
  display: inline-block; font-size: 10px; font-weight: 700;
  padding: 2px 7px; border-radius: 5px; border: 1px solid;
}
.ct-badge--on  { background: #22c55e22; color: #4ade80; border-color: #22c55e44; }
.ct-badge--off { background: #ef444422; color: #f87171; border-color: #ef444444; }

/* ── Modal transition ── */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter, .modal-fade-leave-to { opacity: 0; }

/* ── Toggle Switch ── */
.ide-toggle     { width: 36px; height: 20px; border-radius: 10px; background: #334155; cursor: pointer; position: relative; transition: background 0.2s; flex-shrink: 0; }
.ide-toggle--on { background: #6366f1; }
.ide-toggle div { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: left 0.2s; }
.ide-toggle--on div { left: 18px; }

/* ── Section header inside modules ── */
.ide-sec-hd     { margin-bottom: 20px; }
.ide-sec-hd h2  { font-size: 15px; font-weight: 800; color: #f1f5f9; letter-spacing: -0.3px; margin-bottom: 4px; }
.ide-sec-hd p   { font-size: 12px; color: #64748b; }
</style>
