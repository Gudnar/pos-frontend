<template>
  <div class="ide-page">
    <div class="ide-page__header">
      <div>
        <h1 class="ide-page__title">Campañas y Canales</h1>
        <p class="ide-page__sub">Asigna agentes IA a canales específicos o a publicaciones y anuncios en redes sociales</p>
      </div>
      <v-btn depressed color="primary" @click="abrirNueva" style="border-radius:10px; font-size:13px;">
        + Nueva campaña
      </v-btn>
    </div>

    <!-- Canal legend -->
    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px;">
      <span v-for="c in canalesInfo" :key="c.id"
        style="display:flex; align-items:center; gap:6px; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:600;"
        :style="{ background: c.color + '18', color: c.color, border: '1px solid ' + c.color + '44' }">
        <span v-html="c.icon" style="display:flex;"></span>{{ c.label }}
      </span>
    </div>

    <!-- Empty state -->
    <div v-if="!cargando && campanas.length === 0" class="ide-empty">
      <div style="font-size:36px; margin-bottom:12px;">📢</div>
      <div style="font-size:15px; font-weight:700; color:#e2e8f0; margin-bottom:6px;">Sin campañas configuradas</div>
      <div style="font-size:13px; color:#64748b; max-width:380px;">Crea una campaña para asignar un agente específico a un canal o a una publicación de redes sociales</div>
    </div>

    <!-- Campaigns grid -->
    <div v-else style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:14px;">
      <div v-for="camp in campanas" :key="camp.id" class="ide-ia-card" style="position:relative;">
        <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:12px;">
          <div class="camp-canal-badge" :style="{ background: canalColor(camp.canal) + '18', color: canalColor(camp.canal), border: '1px solid ' + canalColor(camp.canal) + '44' }">
            <span v-html="canalIcon(camp.canal)" style="display:flex;"></span>
          </div>
          <div style="flex:1; min-width:0;">
            <div style="font-size:14px; font-weight:700; color:#e2e8f0; margin-bottom:2px;">{{ camp.nombre }}</div>
            <div style="font-size:11px; color:#64748b;">{{ canalLabel(camp.canal) }}</div>
          </div>
          <div style="display:flex; gap:6px; flex-shrink:0;">
            <div class="ide-toggle" :class="{ 'ide-toggle--on': camp.activa }" @click="toggleActiva(camp)" style="cursor:pointer;"><div></div></div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:14px;">
          <div v-if="camp.origen" style="display:flex; gap:8px; align-items:center;">
            <span style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; white-space:nowrap;">Origen</span>
            <code style="font-size:10px; color:#818cf8; background:#6366f118; padding:2px 6px; border-radius:4px; word-break:break-all;">{{ camp.origen }}</code>
          </div>
          <div v-else style="font-size:11px; color:#475569; font-style:italic;">Sin origen específico — aplica a todo el canal</div>
          <div style="display:flex; gap:8px; align-items:center;">
            <span style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em;">Agente</span>
            <span style="font-size:12px; color:#e2e8f0; font-weight:600;">{{ nombreAgente(camp.agenteId) }}</span>
          </div>
          <div v-if="camp.descripcion" style="font-size:11px; color:#94a3b8; margin-top:2px;">{{ camp.descripcion }}</div>
        </div>

        <div style="display:flex; gap:8px;">
          <button class="ide-btn-ghost" @click="abrirEditar(camp)">Editar</button>
          <button class="ide-btn-ghost ide-btn-ghost--danger" @click="confirmarEliminar(camp)">Eliminar</button>
        </div>

        <div class="camp-status-dot" :style="{ background: camp.activa ? '#22c55e' : '#ef4444' }"></div>
      </div>
    </div>

    <!-- Dialog create/edit -->
    <div v-if="dialog" class="ag-modal-backdrop" @mousedown.self="dialog = false">
      <div class="ag-modal" style="max-width:520px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
          <h3 style="font-size:15px; font-weight:700; color:#e2e8f0;">{{ editando ? 'Editar campaña' : 'Nueva campaña' }}</h3>
          <button class="ag-modal-close" @click="dialog = false">✕</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:14px;">
          <div class="ide-field">
            <label>Nombre de la campaña *</label>
            <input v-model="form.nombre" class="ide-input" placeholder="Ej: Campaña verano, Post Instagram julio…" />
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div class="ide-field">
              <label>Canal *</label>
              <select v-model="form.canal" class="ide-select">
                <option value="">— Seleccionar —</option>
                <option v-for="c in canalesInfo" :key="c.id" :value="c.id">{{ c.label }}</option>
              </select>
            </div>
            <div class="ide-field">
              <label>Agente IA *</label>
              <select v-model="form.agenteId" class="ide-select">
                <option value="">— Seleccionar —</option>
                <option v-for="ag in agentes" :key="ag.id" :value="ag.id">{{ ag.nombre }}</option>
              </select>
            </div>
          </div>

          <div class="ide-field">
            <label>Identificador de origen <span style="color:#64748b;">(opcional)</span></label>
            <input v-model="form.origen" class="ide-input" :placeholder="origenPlaceholder" />
            <div style="font-size:10px; color:#475569; margin-top:3px;">{{ origenHint }}</div>
          </div>

          <div class="ide-field">
            <label>Descripción <span style="color:#64748b;">(opcional)</span></label>
            <input v-model="form.descripcion" class="ide-input" placeholder="Describe el objetivo de esta campaña" />
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:#0f172a; border-radius:8px;">
            <div style="font-size:13px; font-weight:600; color:#e2e8f0;">Campaña activa</div>
            <div class="ide-toggle" :class="{ 'ide-toggle--on': form.activa }" @click="form.activa = !form.activa"><div></div></div>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:20px;">
          <button class="ag-btn-cancel" @click="dialog = false">Cancelar</button>
          <v-btn depressed color="primary" :loading="guardando" @click="guardar" style="border-radius:8px; font-size:13px;">
            {{ editando ? 'Guardar cambios' : 'Crear campaña' }}
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Delete confirmation -->
    <div v-if="confirmando" class="ag-modal-backdrop" @mousedown.self="confirmando = null">
      <div class="ag-modal" style="max-width:380px;">
        <div style="font-size:15px; font-weight:700; color:#e2e8f0; margin-bottom:8px;">¿Eliminar campaña?</div>
        <div style="font-size:13px; color:#94a3b8; margin-bottom:20px;">Se eliminará <strong style="color:#e2e8f0;">{{ confirmando.nombre }}</strong>. Esta acción no se puede deshacer.</div>
        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button class="ag-btn-cancel" @click="confirmando = null">Cancelar</button>
          <v-btn depressed color="error" :loading="eliminando" @click="eliminar" style="border-radius:8px; font-size:13px;">Eliminar</v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const CANALES = [
  { id: 'whatsapp',  label: 'WhatsApp',           color: '#25D366', icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' },
  { id: 'instagram', label: 'Instagram',           color: '#E1306C', icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>' },
  { id: 'messenger', label: 'Facebook Messenger',  color: '#0084ff', icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z"/></svg>' },
  { id: 'chatweb',   label: 'Chat Web',            color: '#6366f1', icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>' },
  { id: 'otro',      label: 'Otro canal',          color: '#64748b', icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>' },
]

const ORIGEN_HINTS = {
  whatsapp:  { placeholder: 'Ej: 1234567890 (source_id del anuncio Click-to-WhatsApp)', hint: 'Meta envía el source_id en el campo referral.source_id del mensaje. Déjalo vacío para aplicar a todos los mensajes de WhatsApp.' },
  instagram: { placeholder: 'Ej: ID del post o story (source_id de Meta Ads)',           hint: 'ID del post o story desde donde el usuario inicia la conversación.' },
  messenger: { placeholder: 'Ej: ID del anuncio o página de Facebook',                   hint: 'ID del anuncio de Facebook o del post que generó el mensaje.' },
  chatweb:   { placeholder: 'Ej: utm_source=google, landing-julio-2026',                 hint: 'Valor del parámetro utm_source o campaign que envía tu snippet de chat web.' },
  otro:      { placeholder: 'Identificador libre del origen',                             hint: 'Cualquier identificador que uses para distinguir la fuente del mensaje.' },
}

export default {
  name: 'Campanas',
  data() {
    return {
      cargando: false,
      guardando: false,
      eliminando: false,
      campanas: [],
      agentes: [],
      dialog: false,
      editando: null,
      confirmando: null,
      canalesInfo: CANALES,
      form: {
        nombre: '', canal: '', origen: '', descripcion: '', agenteId: '', activa: true,
      },
    };
  },
  computed: {
    origenPlaceholder() {
      return ORIGEN_HINTS[this.form.canal]?.placeholder || 'ID del origen específico';
    },
    origenHint() {
      return ORIGEN_HINTS[this.form.canal]?.hint || 'Déjalo vacío para que aplique a todo el canal.';
    },
  },
  async mounted() {
    await Promise.all([this.cargar(), this.cargarAgentes()]);
  },
  methods: {
    async cargar() {
      this.cargando = true;
      try { this.campanas = (await this.$service.list('campanas')) || []; }
      catch (_e) { /* silently ignore */ }
      finally { this.cargando = false; }
    },
    async cargarAgentes() {
      try { this.agentes = (await this.$service.list('agentes')) || []; }
      catch (_e) { /* silently ignore */ }
    },
    abrirNueva() {
      this.editando = null;
      this.form = { nombre: '', canal: '', origen: '', descripcion: '', agenteId: '', activa: true };
      this.dialog = true;
    },
    abrirEditar(camp) {
      this.editando = camp;
      this.form = { nombre: camp.nombre, canal: camp.canal, origen: camp.origen || '', descripcion: camp.descripcion || '', agenteId: camp.agenteId, activa: camp.activa };
      this.dialog = true;
    },
    async guardar() {
      if (!this.form.nombre || !this.form.canal || !this.form.agenteId) {
        this.$message.error('Nombre, canal y agente son obligatorios');
        return;
      }
      this.guardando = true;
      try {
        const payload = { ...this.form, origen: this.form.origen || undefined };
        if (this.editando) {
          await this.$service.put(`campanas/${this.editando.id}`, payload);
          this.$message.success('Campaña actualizada');
        } else {
          await this.$service.post('campanas', payload);
          this.$message.success('Campaña creada');
        }
        this.dialog = false;
        await this.cargar();
      } catch (e) {
        this.$message.error(e?.mensaje || 'Error al guardar');
      } finally { this.guardando = false; }
    },
    confirmarEliminar(camp) { this.confirmando = camp; },
    async eliminar() {
      this.eliminando = true;
      try {
        await this.$service.delete(`campanas/${this.confirmando.id}`);
        this.$message.success('Campaña eliminada');
        this.confirmando = null;
        await this.cargar();
      } catch (e) {
        this.$message.error(e?.mensaje || 'Error al eliminar');
      } finally { this.eliminando = false; }
    },
    async toggleActiva(camp) {
      try {
        await this.$service.put(`campanas/${camp.id}`, { activa: !camp.activa });
        camp.activa = !camp.activa;
      } catch (e) {
        this.$message.error(e?.mensaje || 'Error al actualizar');
      }
    },
    nombreAgente(id) {
      const ag = this.agentes.find(a => String(a.id) === String(id));
      return ag ? ag.nombre : '—';
    },
    canalInfo(canal) { return CANALES.find(c => c.id === canal) || CANALES[CANALES.length - 1]; },
    canalColor(canal) { return this.canalInfo(canal).color; },
    canalIcon(canal)  { return this.canalInfo(canal).icon; },
    canalLabel(canal) { return this.canalInfo(canal).label; },
  },
};
</script>

<style scoped>
.camp-canal-badge { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.camp-status-dot  { position:absolute; top:14px; right:14px; width:7px; height:7px; border-radius:50%; }
.ide-btn-ghost    { padding:5px 12px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; background:#1e293b; border:1px solid #334155; color:#94a3b8; font-family:inherit; }
.ide-btn-ghost:hover { background:#334155; color:#e2e8f0; }
.ide-btn-ghost--danger:hover { background:#ef444422; border-color:#ef444444; color:#ef4444; }
</style>
