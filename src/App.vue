<template>
  <div id="ide-root">
    <router-view />
  </div>
</template>

<script>
export default { name: 'App' };
</script>

<style>
/* ══════════════════════════════════════════════════
   CSS CUSTOM PROPERTIES — Dark (default) & Light
══════════════════════════════════════════════════ */
:root {
  /* backgrounds */
  --bg:    #0a0f1e;
  --bg-s:  #0d1526;   /* sidebar / topbar */
  --bg-c:  #1e293b;   /* cards / surfaces */
  --bg-e:  #0f172a;   /* inputs / body bg */
  --bg-n:  #161d2f;   /* nested inset */

  /* text */
  --t1: #f1f5f9;
  --t2: #e2e8f0;
  --t3: #94a3b8;
  --t4: #64748b;
  --t5: #475569;

  /* borders */
  --b0: #1e3a5f;              /* navy accent (dividers, btn borders) */
  --b1: rgba(30,58,95,.27);   /* #1e3a5f44 */
  --b2: rgba(30,58,95,.20);   /* #1e3a5f33 */
  --b3: #334155;
  --b4: rgba(30,58,95,.40);   /* #1e3a5f66 */

  /* nav */
  --nav-t:  #64748b;
  --nav-h:  rgba(30,41,59,.27);
  --nav-ht: #94a3b8;
  --nav-a:  rgba(99,102,241,.13);
  --nav-at: #818cf8;
  --nav-cb: rgba(30,58,95,.40);

  /* misc */
  --scroll:   #334155;
  --scroll-h: #475569;
  --ph:       #475569;
  --modal:    #0d1526;
  --modal-b:  rgba(30,58,95,.40);
}

body.theme-light {
  --bg:        #f0f4f8;
  --bg-s:      #e8f0fc;    /* topbar — azul cielo suave */
  --bg-sidebar: #1e3a5f;  /* sidebar — azul marino profundo */
  --bg-c:      #ffffff;
  --bg-e:      #eef4fb;   /* inputs — azul muy tenue para distinguir del card */
  --bg-n:      #dde8f5;   /* table headers / nested — azul claro visible */

  /* texto general (fondo claro) */
  --t1: #0f172a;
  --t2: #1e293b;
  --t3: #334155;
  --t4: #475569;
  --t5: #64748b;  /* no usar tonos super-claros en tema claro */

  /* texto interno del sidebar (fondo oscuro azul) */
  --sidebar-bd: rgba(255,255,255,.10);  /* bordes/divisores en sidebar */
  --sidebar-t:  #dde9f6;               /* texto primario en sidebar */
  --sidebar-t2: #7fb0cc;               /* texto secundario en sidebar */
  --sidebar-t3: #4a7a98;               /* botones/iconos tenues en sidebar */
  --sidebar-ui: rgba(0,0,0,.20);       /* fondo del bloque de usuario */

  --b0: #2563eb;              /* navy → medium blue accent */
  --b1: rgba(37,99,235,.18);  /* separadores/hover con tono azul */
  --b2: rgba(37,99,235,.12);  /* bordes fila tabla — azul tenue visible */
  --b3: #c5d5e8;              /* bordes inputs — azul-gris */
  --b4: rgba(37,99,235,.28);  /* bordes más marcados */

  /* nav — corre sobre fondo oscuro del sidebar */
  --nav-t:  #7fb0cc;
  --nav-h:  rgba(255,255,255,.08);
  --nav-ht: #c2dded;
  --nav-a:  rgba(130,175,215,.22);
  --nav-at: #a8d0e8;
  --nav-cb: rgba(255,255,255,.12);

  --scroll:   #2d6aa0;   /* scrollbar thumb — azul visible sobre fondo claro */
  --scroll-h: #1e4f7a;
  --ph:       #7a9fc0;   /* placeholder — azul-gris suave */
  --modal:    #ffffff;
  --modal-b:  rgba(37,99,235,.18);
}

/* ══════════════════════════════════════════════════
   Base Reset
══════════════════════════════════════════════════ */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #app, #ide-root { height: 100%; width: 100%; overflow: hidden; }
body {
  font-family: 'Inter', sans-serif;
  background: var(--bg-e);
  color: var(--t1);
  -webkit-font-smoothing: antialiased;
  transition: background 0.25s, color 0.25s;
}
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--scroll); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--scroll-h); }
input::placeholder, textarea::placeholder { color: var(--ph); }
button, select, textarea, input { font-family: 'Inter', sans-serif; }
input, textarea, select { transition: background-color 0.25s, color 0.25s, border-color 0.25s; }

/* Vuetify reset */
.v-application { font-family: 'Inter', sans-serif !important; background: transparent !important; }
.v-application--wrap { min-height: unset !important; }
.v-btn { letter-spacing: 0 !important; text-transform: none !important; font-family: 'Inter', sans-serif !important; }
.v-dialog > .v-card { border-radius: 12px !important; }

/* ══════════════════════════════════════════════════
   Global Utility Classes
══════════════════════════════════════════════════ */
.ide-ia-card {
  background: var(--bg-c);
  border: 1px solid var(--b2);
  border-radius: 12px;
  padding: 16px;
  transition: background 0.25s, border-color 0.25s;
}
.ide-ia-card--hover { cursor: pointer; transition: border-color 0.15s; }
.ide-ia-card--hover:hover { border-color: #6366f133; }

.section-title    { font-size: 18px; font-weight: 800; color: var(--t1); margin-bottom: 4px; letter-spacing: -0.3px; }
.section-subtitle { font-size: 12px; color: var(--t4); margin-bottom: 16px; }
.stat-value       { font-size: 28px; font-weight: 900; color: var(--t1); line-height: 1.1; }
.score-bar        { height: 4px; background: var(--b2); border-radius: 2px; overflow: hidden; }

/* ── Module Layout ── */
.ide-mod        { display: flex; height: 100%; overflow: hidden; }
.ide-page       { height: 100%; overflow-y: auto; padding: 20px 24px; }
.ide-subnav     { width: 200px; flex-shrink: 0; border-right: 1px solid var(--b1); padding: 12px 8px; overflow-y: auto; background: var(--bg-e); transition: background 0.25s, border-color 0.25s; }
.ide-body       { flex: 1; overflow-y: auto; padding: 24px 28px; }
.ide-body--bare { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

.ide-sn-hd {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px 14px;
  border-bottom: 1px solid var(--b2);
  margin-bottom: 8px;
}
.ide-sn-ico {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; flex-shrink: 0;
}
.ide-sn-title { font-size: 12px; font-weight: 800; color: var(--t2); }
.ide-sn-sub   { font-size: 9px; font-weight: 700; }
.ide-sn-sep   { font-size: 11px; font-weight: 700; color: var(--t5); text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px 10px; }

.ide-sn-btn {
  display: flex; align-items: center; gap: 9px;
  width: 100%; padding: 9px 12px; margin-bottom: 2px;
  border-radius: 8px; border: none; cursor: pointer;
  background: transparent; color: var(--t4);
  font-size: 12px; font-weight: 500;
  transition: all 0.15s; text-align: left;
  font-family: 'Inter', sans-serif;
}
.ide-sn-btn:hover    { background: var(--bg-c); color: var(--t3); }
.ide-sn-btn--o { background: #c9644222 !important; color: #e8956d !important; font-weight: 700; }
.ide-sn-btn--i { background: #6366f122 !important; color: #818cf8 !important; font-weight: 700; }

/* ── Global Form Elements ── */
.ide-field       { display: flex; flex-direction: column; gap: 6px; margin-bottom: 0; }
.ide-field label { font-size: 12px; font-weight: 700; color: var(--t3); }
.ide-input, .ide-select, .ide-textarea {
  background: var(--bg-e); border: 1px solid var(--b3); border-radius: 8px;
  color: var(--t1); font-size: 13px; padding: 8px 12px;
  outline: none; font-family: inherit; width: 100%;
  transition: border-color 0.15s, background 0.25s, color 0.25s;
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
  background: var(--modal); border: 1px solid var(--modal-b);
  border-radius: 14px; width: 100%; max-width: 520px;
  max-height: 90vh; display: flex; flex-direction: column;
  overflow: hidden; box-shadow: 0 20px 60px #00000044;
  transition: background 0.25s;
}
.ct-modal--xl {
  max-width: 1100px;
}
.ct-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--b1);
  font-size: 15px; font-weight: 800; color: var(--t1); flex-shrink: 0;
}
.ct-modal-close {
  background: none; border: none; color: var(--t4);
  cursor: pointer; font-size: 16px; padding: 2px 6px; border-radius: 6px;
}
.ct-modal-close:hover { color: #ef4444; }
.ct-modal-body { flex: 1; overflow-y: auto; padding: 20px; }
.ct-modal-footer {
  display: flex; gap: 8px; justify-content: flex-end;
  padding: 12px 20px; border-top: 1px solid var(--b1); flex-shrink: 0;
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
  padding: 8px 16px; border-radius: 8px; background: var(--b1);
  color: var(--t4); border: 1px solid var(--b2); cursor: pointer;
  font-size: 12px; font-family: inherit; transition: color 0.15s;
}
.ct-btn-cancel:hover { color: var(--t3); }

/* ── Global Badge ── */
.ct-badge {
  display: inline-block; font-size: 10px; font-weight: 700;
  padding: 2px 7px; border-radius: 5px; border: 1px solid;
}
.ct-badge--on  { background: #22c55e22; color: #4ade80; border-color: #22c55e44; }
.ct-badge--off { background: #ef444422; color: #f87171; border-color: #ef444444; }

/* Light-mode badge adjustments */
body.theme-light .ct-badge--on  { color: #16a34a; }
body.theme-light .ct-badge--off { color: #dc2626; }

/* Light-mode button overrides — no transparent/ghosted buttons */
body.theme-light .ct-btn-cancel {
  background: #d4e5f7;
  color: #1e3a5f;
  border-color: #93b8d7;
}
body.theme-light .ct-btn-cancel:hover {
  background: #bdd5ee;
  color: #1e3a5f;
}

/* ── Modal transition ── */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter, .modal-fade-leave-to { opacity: 0; }

/* ── Toggle Switch ── */
.ide-toggle     { width: 36px; height: 20px; border-radius: 10px; background: var(--b3); cursor: pointer; position: relative; transition: background 0.2s; flex-shrink: 0; }
.ide-toggle--on { background: #6366f1; }
.ide-toggle div { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: left 0.2s; }
.ide-toggle--on div { left: 18px; }

/* ── Section header inside modules ── */
.ide-sec-hd     { margin-bottom: 20px; }
.ide-sec-hd h2  { font-size: 15px; font-weight: 800; color: var(--t1); letter-spacing: -0.3px; margin-bottom: 4px; }
.ide-sec-hd p   { font-size: 12px; color: var(--t4); }
</style>
