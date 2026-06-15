<template>
  <div class="ide-page cm-page">

    <!-- Header -->
    <div class="cm-header">
      <div>
        <div class="section-title">Citas Médicas</div>
        <p class="section-subtitle" style="margin-bottom:0;">Administra las citas del día según horarios y servicios configurados</p>
      </div>
    </div>

    <!-- Body -->
    <div class="cm-body">

      <!-- Sidebar izquierdo -->
      <div class="cm-sidebar">
        <div class="cm-stats-card">
          <div class="cm-stat-row">
            <div class="cm-stat-dot" style="background:#f59e0b;"></div>
            <div class="cm-stat-info">
              <div class="cm-stat-val">{{ pendientes }}</div>
              <div class="cm-stat-lbl">Pendientes</div>
            </div>
          </div>
          <div class="cm-stat-row">
            <div class="cm-stat-dot" style="background:#22c55e;"></div>
            <div class="cm-stat-info">
              <div class="cm-stat-val">{{ confirmadas }}</div>
              <div class="cm-stat-lbl">Confirmadas</div>
            </div>
          </div>
          <div class="cm-stat-row">
            <div class="cm-stat-dot" style="background:#6366f1;"></div>
            <div class="cm-stat-info">
              <div class="cm-stat-val">{{ completadas }}</div>
              <div class="cm-stat-lbl">Completadas</div>
            </div>
          </div>
          <div class="cm-stat-row">
            <div class="cm-stat-dot" style="background:var(--t4);"></div>
            <div class="cm-stat-info">
              <div class="cm-stat-val">{{ citas.length }}</div>
              <div class="cm-stat-lbl">Total del día</div>
            </div>
          </div>
        </div>

        <button class="cm-new-btn" @click="abrirDialog()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva Cita
        </button>
      </div>

      <!-- Área principal -->
      <div class="cm-main">

        <!-- Navegador de fecha -->
        <div class="cm-date-nav">
          <button class="cm-nav-btn" @click="diaAnterior" title="Día anterior">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button class="cm-today-btn" @click="irHoy">Hoy</button>
          <button class="cm-nav-btn" @click="diaSiguiente" title="Día siguiente">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <div class="cm-date-display">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="1.75"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {{ fechaDisplay }}
          </div>
        </div>

        <!-- Loading -->
        <div v-if="cargando" style="display:flex; justify-content:center; padding:48px;">
          <div class="cm-spinner"></div>
        </div>

        <!-- Lista vacía -->
        <div v-else-if="citas.length === 0" class="ide-ia-card" style="text-align:center; padding:48px; margin-top:8px;">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--b3)" stroke-width="1.25" style="margin-bottom:14px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <div style="color:var(--t2); font-size:15px; font-weight:700; margin-bottom:6px;">No hay citas para este día</div>
          <div style="color:var(--t4); font-size:13px; margin-bottom:22px;">Agenda una nueva cita usando el botón "Nueva Cita"</div>
          <button class="cm-new-btn" style="margin:0 auto;" @click="abrirDialog()">+ Nueva Cita</button>
        </div>

        <!-- Lista de citas -->
        <div v-else class="cm-list">
          <div v-for="cita in citas" :key="cita.id" class="cm-row ide-ia-card">
            <!-- Hora -->
            <div class="cm-row__time">
              <span class="cm-time-badge">{{ cita.horaInicio }}</span>
              <span class="cm-time-sep">–</span>
              <span class="cm-time-badge">{{ cita.horaFin }}</span>
            </div>

            <!-- Info paciente -->
            <div class="cm-row__info">
              <div class="cm-paciente-nombre">{{ cita.pacienteNombre }}</div>
              <div class="cm-paciente-sub">{{ cita.pacienteTelefono }}</div>
            </div>

            <!-- Servicio -->
            <div class="cm-row__svc">
              <span class="cm-svc-badge">{{ cita.servicio }}</span>
              <span v-if="cita.origenRegistro === 'IA_AGENTE'" class="cm-ia-badge" title="Programada por el agente IA">IA</span>
            </div>

            <!-- Estado -->
            <div class="cm-row__estado">
              <span class="cm-estado" :class="estadoClass(cita.estadoCita)">{{ cita.estadoCita }}</span>
            </div>

            <!-- Acciones -->
            <div class="cm-row__actions">
              <button
                v-if="cita.estadoCita === 'PENDIENTE'"
                class="cm-action-btn cm-action-btn--ok"
                title="Confirmar cita"
                @click="confirmarRapido(cita)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
              <button
                v-if="cita.estadoCita === 'CONFIRMADA'"
                class="cm-action-btn cm-action-btn--done"
                title="Marcar como completada"
                @click="completarRapido(cita)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              </button>
              <button
                class="cm-action-btn"
                title="Editar cita"
                @click="abrirDialog(cita)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button
                class="cm-action-btn cm-action-btn--del"
                title="Eliminar cita"
                @click="eliminar(cita)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Modal nueva / editar cita -->
    <transition name="modal-fade">
      <div v-if="dialog" class="cm-modal-backdrop" @mousedown.self="cerrarDialog">
        <div class="cm-modal">
          <div class="cm-modal-header">
            <span>{{ editando ? 'Editar Cita' : 'Nueva Cita' }}</span>
            <button class="cm-modal-close" @click="cerrarDialog">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="cm-modal-body">
            <div class="cm-form-grid">

              <!-- Servicio -->
              <div class="ide-field">
                <label>Servicio *</label>
                <select v-model="form.servicio" class="ide-select">
                  <option value="" disabled>Selecciona un servicio</option>
                  <option v-for="s in servicios" :key="s" :value="s">{{ s }}</option>
                </select>
                <span v-if="servicios.length === 0" style="font-size:11px; color:#f59e0b;">Configura servicios en Mi Cuenta primero</span>
              </div>

              <!-- Fecha -->
              <div class="ide-field">
                <label>Fecha *</label>
                <input v-model="form.fecha" type="date" class="ide-input" @change="cargarDisponibilidad" />
              </div>

              <!-- Slot disponible (solo al crear) -->
              <div v-if="!editando" class="ide-field cm-form-full">
                <label>Horario disponible *</label>
                <select v-model="form.horaInicio" class="ide-select" :disabled="!form.fecha || cargandoSlots" @change="onSlotChange">
                  <option value="" disabled>{{ cargandoSlots ? 'Cargando disponibilidad…' : 'Selecciona un horario' }}</option>
                  <option v-for="s in disponibilidadSlots" :key="s.horaInicio" :value="s.horaInicio">
                    {{ s.horaInicio }} – {{ s.horaFin }}
                  </option>
                </select>
                <span v-if="form.fecha && !cargandoSlots && disponibilidadSlots.length === 0" style="font-size:11px; color:#f59e0b;">
                  No hay horarios disponibles para esta fecha
                </span>
              </div>

              <!-- Hora manual (solo al editar) -->
              <template v-if="editando">
                <div class="ide-field">
                  <label>Hora inicio</label>
                  <input v-model="form.horaInicio" type="time" class="ide-input" />
                </div>
                <div class="ide-field">
                  <label>Hora fin</label>
                  <input v-model="form.horaFin" type="time" class="ide-input" />
                </div>
              </template>

              <!-- Paciente: autocomplete con historial -->
              <div class="ide-field cm-form-full">
                <label>Paciente *</label>
                <div class="cm-autocomplete" ref="autocompleteRef">
                  <div class="cm-autocomplete-input-wrap">
                    <svg class="cm-autocomplete-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input
                      ref="pacienteInput"
                      v-model="pacienteBusqueda"
                      class="ide-input cm-autocomplete-input"
                      placeholder="Busca por nombre o teléfono…"
                      autocomplete="off"
                      @input="onPacienteInput"
                      @focus="mostrarDropdown = true"
                      @blur="onBlurPaciente"
                      @keydown.esc="mostrarDropdown = false"
                      @keydown.enter.prevent="onEnterPaciente"
                      @keydown.down.prevent="moverSeleccion(1)"
                      @keydown.up.prevent="moverSeleccion(-1)"
                    />
                    <button v-if="pacienteSeleccionado" class="cm-autocomplete-clear" @mousedown.prevent="limpiarPaciente" title="Limpiar selección">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>

                  <!-- Dropdown de sugerencias -->
                  <div v-if="mostrarDropdown && (sugerencias.length > 0 || pacienteBusqueda.length >= 2)" class="cm-autocomplete-dropdown">
                    <div
                      v-for="(p, idx) in sugerencias"
                      :key="p.id"
                      class="cm-autocomplete-item"
                      :class="{ 'cm-autocomplete-item--active': idx === dropdownIdx }"
                      @mousedown.prevent="seleccionarPaciente(p)"
                    >
                      <div class="cm-autocomplete-nombre">{{ p.nombre }}</div>
                      <div class="cm-autocomplete-sub">{{ p.telefono }}<span v-if="p.email"> · {{ p.email }}</span></div>
                    </div>

                    <div
                      v-if="pacienteBusqueda.length >= 2 && !sugerencias.some(p => p.nombre.toLowerCase() === pacienteBusqueda.toLowerCase())"
                      class="cm-autocomplete-item cm-autocomplete-item--new"
                      :class="{ 'cm-autocomplete-item--active': dropdownIdx === sugerencias.length }"
                      @mousedown.prevent="usarComoNuevo"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Nuevo paciente: <strong style="margin-left:4px;">{{ pacienteBusqueda }}</strong>
                    </div>

                    <div v-if="buscandoPacientes" class="cm-autocomplete-loading">
                      <div class="cm-spinner cm-spinner--sm" style="border-top-color:#6366f1;"></div>
                      Buscando…
                    </div>
                  </div>
                </div>

                <!-- Chip del paciente seleccionado -->
                <div v-if="pacienteSeleccionado" class="cm-paciente-chip">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {{ form.pacienteNombre }}
                  <span v-if="form.pacienteEmail" style="color:var(--t4);"> · {{ form.pacienteEmail }}</span>
                </div>
              </div>

              <div class="ide-field">
                <label>Teléfono *</label>
                <input v-model="form.pacienteTelefono" class="ide-input" placeholder="Ej: +591 70000000" />
              </div>

              <div class="ide-field">
                <label>Email (opcional)</label>
                <input v-model="form.pacienteEmail" class="ide-input" type="email" placeholder="correo@ejemplo.com" />
              </div>

              <!-- Estado (solo al editar) -->
              <div v-if="editando" class="ide-field cm-form-full">
                <label>Estado</label>
                <div class="cm-estado-selector">
                  <button
                    v-for="e in estadoOpts"
                    :key="e.val"
                    class="cm-estado-opt"
                    :style="form.estadoCita === e.val ? { background: e.color + '22', borderColor: e.color, color: e.color } : {}"
                    @click="form.estadoCita = e.val"
                  >
                    {{ e.label }}
                  </button>
                </div>
              </div>

              <!-- Notas -->
              <div class="ide-field cm-form-full">
                <label>Notas (opcional)</label>
                <textarea v-model="form.notas" class="ide-textarea" rows="2" placeholder="Observaciones adicionales…"></textarea>
              </div>

            </div>
          </div>

          <div class="cm-modal-footer">
            <button class="cm-btn-cancel" @click="cerrarDialog">Cancelar</button>
            <button class="cm-btn-ok" :disabled="saving || !formValido" @click="guardar">
              <span v-if="saving" class="cm-spinner cm-spinner--sm"></span>
              {{ editando ? 'Actualizar' : 'Crear Cita' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
const FORM_VACIO = () => ({
  servicio: '',
  fecha: '',
  horaInicio: '',
  horaFin: '',
  pacienteNombre: '',
  pacienteTelefono: '',
  pacienteEmail: '',
  notas: '',
  estadoCita: 'PENDIENTE',
});

export default {
  name: 'CitasMedicas',
  data() {
    return {
      fecha: new Date().toISOString().slice(0, 10),
      citas: [],
      cargando: false,
      dialog: false,
      saving: false,
      editando: null,
      form: FORM_VACIO(),
      disponibilidadSlots: [],
      cargandoSlots: false,
      estadoOpts: [
        { val: 'PENDIENTE',  label: 'Pendiente',  color: '#f59e0b' },
        { val: 'CONFIRMADA', label: 'Confirmada', color: '#22c55e' },
        { val: 'CANCELADA',  label: 'Cancelada',  color: '#ef4444' },
        { val: 'COMPLETADA', label: 'Completada', color: '#6366f1' },
      ],
      // Autocomplete paciente
      pacienteBusqueda: '',
      sugerencias: [],
      mostrarDropdown: false,
      buscandoPacientes: false,
      pacienteSeleccionado: false,
      dropdownIdx: -1,
      buscarTimer: null,
    };
  },
  computed: {
    servicios() {
      return this.$store.getters.clienteInfo?.servicios || [];
    },
    pendientes()  { return this.citas.filter(c => c.estadoCita === 'PENDIENTE').length; },
    confirmadas() { return this.citas.filter(c => c.estadoCita === 'CONFIRMADA').length; },
    completadas() { return this.citas.filter(c => c.estadoCita === 'COMPLETADA').length; },
    fechaDisplay() {
      if (!this.fecha) return '';
      return new Date(this.fecha + 'T12:00:00').toLocaleDateString('es-MX', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });
    },
    formValido() {
      return !!(this.form.servicio && this.form.fecha && this.form.horaInicio
        && this.form.horaFin && this.form.pacienteNombre && this.form.pacienteTelefono);
    },
  },
  mounted() {
    this.cargarCitas();
  },
  methods: {
    async cargarCitas() {
      this.cargando = true;
      try {
        const data = await this.$service.list('citas-medicas', { fecha: this.fecha });
        this.citas = Array.isArray(data) ? data : [];
      } catch {
        this.citas = [];
      } finally {
        this.cargando = false;
      }
    },
    async cargarDisponibilidad() {
      if (!this.form.fecha) return;
      this.cargandoSlots = true;
      this.disponibilidadSlots = [];
      this.form.horaInicio = '';
      this.form.horaFin = '';
      try {
        const data = await this.$service.list('citas-medicas/disponibilidad', { fecha: this.form.fecha });
        this.disponibilidadSlots = Array.isArray(data) ? data : [];
      } catch {
        this.disponibilidadSlots = [];
      } finally {
        this.cargandoSlots = false;
      }
    },
    onSlotChange() {
      const slot = this.disponibilidadSlots.find(s => s.horaInicio === this.form.horaInicio);
      if (slot) this.form.horaFin = slot.horaFin;
    },
    abrirDialog(cita) {
      this.editando = cita || null;
      if (cita) {
        this.form = { ...cita };
        this.pacienteBusqueda = cita.pacienteNombre;
        this.pacienteSeleccionado = true;
      } else {
        this.form = FORM_VACIO();
        this.form.fecha = this.fecha;
        this.disponibilidadSlots = [];
        this.cargarDisponibilidad();
        this.pacienteBusqueda = '';
        this.pacienteSeleccionado = false;
      }
      this.sugerencias = [];
      this.mostrarDropdown = false;
      this.dropdownIdx = -1;
      this.dialog = true;
    },
    cerrarDialog() {
      this.dialog = false;
      this.editando = null;
      this.form = FORM_VACIO();
      this.disponibilidadSlots = [];
      this.pacienteBusqueda = '';
      this.sugerencias = [];
      this.mostrarDropdown = false;
      this.pacienteSeleccionado = false;
      this.dropdownIdx = -1;
    },
    async guardar() {
      if (!this.formValido) return;
      this.saving = true;
      try {
        if (this.editando) {
          await this.$service.put(`citas-medicas/${this.editando.id}`, this.form);
          this.$message.success('Cita actualizada correctamente.');
        } else {
          await this.$service.post('citas-medicas', this.form);
          this.$message.success('Cita creada correctamente.');
        }
        this.cerrarDialog();
        this.cargarCitas();
      } catch {
        // el interceptor muestra el error del servidor
      } finally {
        this.saving = false;
      }
    },
    async confirmarRapido(cita) {
      try {
        await this.$service.put(`citas-medicas/${cita.id}`, { estadoCita: 'CONFIRMADA' });
        this.$message.success('Cita confirmada.');
        this.cargarCitas();
      } catch {
        // interceptor handles
      }
    },
    async completarRapido(cita) {
      try {
        await this.$service.put(`citas-medicas/${cita.id}`, { estadoCita: 'COMPLETADA' });
        this.$message.success('Cita completada.');
        this.cargarCitas();
      } catch {
        // interceptor handles
      }
    },
    eliminar(cita) {
      this.$confirm(`¿Eliminar la cita de ${cita.pacienteNombre}?`, async () => {
        try {
          await this.$service.delete(`citas-medicas/${cita.id}`);
          this.$message.success('Cita eliminada.');
          this.cargarCitas();
        } catch {
          // interceptor handles
        }
      });
    },
    // ── Autocomplete paciente ────────────────────────────────────────────────
    onPacienteInput() {
      this.pacienteSeleccionado = false;
      this.form.pacienteNombre = this.pacienteBusqueda;
      this.dropdownIdx = -1;
      clearTimeout(this._buscarTimer);
      if (this.pacienteBusqueda.length < 2) {
        this.sugerencias = [];
        return;
      }
      this._buscarTimer = setTimeout(() => this._fetchPacientes(), 280);
    },
    async _fetchPacientes() {
      this.buscandoPacientes = true;
      try {
        const data = await this.$service.list('citas-medicas/pacientes', { q: this.pacienteBusqueda });
        this.sugerencias = Array.isArray(data) ? data : [];
      } catch {
        this.sugerencias = [];
      } finally {
        this.buscandoPacientes = false;
      }
    },
    seleccionarPaciente(p) {
      this.form.pacienteNombre = p.nombre;
      this.form.pacienteTelefono = p.telefono;
      this.form.pacienteEmail = p.email || '';
      this.pacienteBusqueda = p.nombre;
      this.pacienteSeleccionado = true;
      this.mostrarDropdown = false;
      this.sugerencias = [];
      this.dropdownIdx = -1;
    },
    usarComoNuevo() {
      this.form.pacienteNombre = this.pacienteBusqueda;
      this.form.pacienteTelefono = '';
      this.form.pacienteEmail = '';
      this.pacienteSeleccionado = false;
      this.mostrarDropdown = false;
      this.$nextTick(() => {
        const el = this.$el.querySelector('input[placeholder*="591"]');
        if (el) el.focus();
      });
    },
    limpiarPaciente() {
      this.pacienteBusqueda = '';
      this.form.pacienteNombre = '';
      this.form.pacienteTelefono = '';
      this.form.pacienteEmail = '';
      this.pacienteSeleccionado = false;
      this.sugerencias = [];
      this.mostrarDropdown = false;
      this.dropdownIdx = -1;
      this.$nextTick(() => { if (this.$refs.pacienteInput) this.$refs.pacienteInput.focus(); });
    },
    onBlurPaciente() {
      setTimeout(() => { this.mostrarDropdown = false; }, 150);
    },
    onEnterPaciente() {
      const total = this.sugerencias.length + (this.pacienteBusqueda.length >= 2 ? 1 : 0);
      if (this.dropdownIdx >= 0 && this.dropdownIdx < this.sugerencias.length) {
        this.seleccionarPaciente(this.sugerencias[this.dropdownIdx]);
      } else if (this.dropdownIdx === this.sugerencias.length && total > this.sugerencias.length) {
        this.usarComoNuevo();
      }
    },
    moverSeleccion(dir) {
      const total = this.sugerencias.length + (this.pacienteBusqueda.length >= 2 && !this.sugerencias.some(p => p.nombre.toLowerCase() === this.pacienteBusqueda.toLowerCase()) ? 1 : 0);
      if (total === 0) return;
      this.dropdownIdx = (this.dropdownIdx + dir + total) % total;
    },
    // ────────────────────────────────────────────────────────────────────────

    diaAnterior() {
      const d = new Date(this.fecha + 'T12:00:00');
      d.setDate(d.getDate() - 1);
      this.fecha = d.toISOString().slice(0, 10);
      this.cargarCitas();
    },
    diaSiguiente() {
      const d = new Date(this.fecha + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      this.fecha = d.toISOString().slice(0, 10);
      this.cargarCitas();
    },
    irHoy() {
      this.fecha = new Date().toISOString().slice(0, 10);
      this.cargarCitas();
    },
    estadoClass(estado) {
      const map = {
        PENDIENTE:  'cm-estado--pendiente',
        CONFIRMADA: 'cm-estado--confirmada',
        CANCELADA:  'cm-estado--cancelada',
        COMPLETADA: 'cm-estado--completada',
      };
      return map[estado] || '';
    },
  },
};
</script>

<style scoped>
/* ── Layout ── */
.cm-page {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.cm-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-shrink: 0;
}
.cm-body {
  display: flex;
  gap: 20px;
  flex: 1;
  overflow: hidden;
}

/* ── Sidebar ── */
.cm-sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.cm-stats-card {
  background: var(--bg);
  border: 1px solid var(--b1);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.cm-stat-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cm-stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.cm-stat-info { display: flex; align-items: center; gap: 8px; flex: 1; }
.cm-stat-val  { font-size: 18px; font-weight: 800; color: var(--t1); line-height: 1; }
.cm-stat-lbl  { font-size: 12px; color: var(--t4); font-weight: 500; }
.cm-new-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  padding: 10px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}
.cm-new-btn:hover { background: #4f46e5; }

/* ── Main ── */
.cm-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.cm-date-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  flex-shrink: 0;
}
.cm-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1px solid var(--b4);
  background: var(--bg);
  color: var(--t3);
  cursor: pointer;
  transition: all 0.15s;
}
.cm-nav-btn:hover { border-color: #6366f1; color: #818cf8; }
.cm-today-btn {
  padding: 5px 12px;
  border-radius: 7px;
  border: 1px solid var(--b4);
  background: var(--bg);
  color: var(--t3);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.cm-today-btn:hover { border-color: #6366f1; color: #818cf8; }
.cm-date-display {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--t2);
  text-transform: capitalize;
  margin-left: 4px;
}

/* ── Lista citas ── */
.cm-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  flex: 1;
  padding-right: 4px;
}
.cm-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px !important;
}
.cm-row__time {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.cm-time-badge {
  font-size: 12px;
  font-weight: 700;
  color: #818cf8;
  background: #6366f122;
  border-radius: 5px;
  padding: 2px 7px;
  font-family: monospace;
}
.cm-time-sep { color: var(--t5); font-size: 11px; }
.cm-row__info {
  flex: 1;
  min-width: 0;
}
.cm-paciente-nombre {
  font-size: 14px;
  font-weight: 700;
  color: var(--t2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cm-paciente-sub {
  font-size: 11px;
  color: var(--t4);
  margin-top: 1px;
}
.cm-row__svc { flex-shrink: 0; }
.cm-svc-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--t3);
  background: var(--bg-c);
  border: 1px solid var(--b3);
  border-radius: 5px;
  padding: 2px 8px;
  white-space: nowrap;
}
.cm-ia-badge { display: inline-flex; align-items: center; font-size: 9px; font-weight: 700; letter-spacing: .04em; padding: 1px 5px; border-radius: 4px; background: #6366f118; border: 1px solid #6366f166; color: #a5b4fc; margin-left: 4px; }
.cm-row__svc { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.cm-row__estado { flex-shrink: 0; }
.cm-estado {
  font-size: 10px;
  font-weight: 700;
  border-radius: 5px;
  padding: 3px 8px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.cm-estado--pendiente  { background: #f59e0b22; color: #f59e0b; border: 1px solid #f59e0b44; }
.cm-estado--confirmada { background: #22c55e22; color: #22c55e; border: 1px solid #22c55e44; }
.cm-estado--cancelada  { background: #ef444422; color: #ef4444; border: 1px solid #ef444444; }
.cm-estado--completada { background: #6366f122; color: #818cf8; border: 1px solid #6366f144; }

/* ── Acciones de fila ── */
.cm-row__actions { display: flex; gap: 4px; flex-shrink: 0; }
.cm-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--b4);
  background: var(--bg);
  color: var(--t4);
  cursor: pointer;
  transition: all 0.15s;
}
.cm-action-btn:hover       { border-color: #6366f1; color: #818cf8; }
.cm-action-btn--ok:hover   { border-color: #22c55e; color: #22c55e; background: #22c55e11; }
.cm-action-btn--done:hover { border-color: #6366f1; color: #818cf8; background: #6366f111; }
.cm-action-btn--del:hover  { border-color: #ef4444; color: #ef4444; background: #ef444411; }

/* ── Modal ── */
.cm-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.cm-modal {
  background: var(--bg);
  border: 1px solid var(--b4);
  border-radius: 14px;
  width: 100%;
  max-width: 540px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.cm-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--b1);
  font-size: 15px;
  font-weight: 700;
  color: var(--t1);
}
.cm-modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--t4);
  padding: 2px;
  display: flex;
  border-radius: 5px;
  transition: color 0.15s;
}
.cm-modal-close:hover { color: var(--t3); }
.cm-modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}
.cm-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 24px;
  border-top: 1px solid var(--b1);
}

/* ── Form ── */
.cm-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.cm-form-full { grid-column: span 2; }

/* ── Estado selector ── */
.cm-estado-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.cm-estado-opt {
  padding: 5px 14px;
  border-radius: 7px;
  border: 1px solid var(--b4);
  background: var(--bg);
  color: var(--t4);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.cm-estado-opt:hover { border-color: var(--t5); color: var(--t3); }

/* ── Buttons modal ── */
.cm-btn-cancel {
  padding: 8px 18px;
  border-radius: 8px;
  border: 1px solid var(--b4);
  background: none;
  color: var(--t4);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.cm-btn-cancel:hover { border-color: var(--t5); color: var(--t3); }
.cm-btn-ok {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  background: #6366f1;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}
.cm-btn-ok:hover:not(:disabled) { background: #4f46e5; }
.cm-btn-ok:disabled { opacity: 0.55; cursor: not-allowed; }

/* ── Spinner ── */
.cm-spinner {
  width: 26px;
  height: 26px;
  border: 3px solid var(--b0);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}
.cm-spinner--sm {
  width: 13px;
  height: 13px;
  border-width: 2px;
  border-color: rgba(255,255,255,0.3);
  border-top-color: #fff;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Autocomplete paciente ── */
.cm-autocomplete { position: relative; }
.cm-autocomplete-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.cm-autocomplete-icon {
  position: absolute;
  left: 10px;
  color: var(--t5);
  pointer-events: none;
  flex-shrink: 0;
}
.cm-autocomplete-input {
  padding-left: 32px !important;
  padding-right: 32px !important;
}
.cm-autocomplete-clear {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--t5);
  display: flex;
  padding: 2px;
  border-radius: 4px;
  transition: color 0.15s;
}
.cm-autocomplete-clear:hover { color: var(--t3); }
.cm-autocomplete-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0; right: 0;
  background: #1a2234;
  border: 1px solid var(--b4);
  border-radius: 10px;
  overflow: hidden;
  z-index: 100;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  max-height: 220px;
  overflow-y: auto;
}
.cm-autocomplete-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 9px 13px;
  cursor: pointer;
  transition: background 0.12s;
}
.cm-autocomplete-item:hover,
.cm-autocomplete-item--active { background: #6366f122; }
.cm-autocomplete-nombre { font-size: 13px; font-weight: 600; color: var(--t2); }
.cm-autocomplete-sub { font-size: 11px; color: var(--t4); }
.cm-autocomplete-item--new {
  flex-direction: row;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: #818cf8;
  border-top: 1px solid var(--b1);
}
.cm-autocomplete-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 13px;
  font-size: 12px;
  color: var(--t4);
}
.cm-paciente-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 11px;
  color: #22c55e;
  font-weight: 600;
}

/* ── Transition ── */
.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter,
.modal-fade-leave-to { opacity: 0; }
</style>
