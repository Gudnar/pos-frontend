<template>
  <div class="pac-root">

    <!-- ── Panel izquierdo: lista ── -->
    <div class="pac-lista">
      <!-- Buscador -->
      <div class="pac-lista-hd">
        <div class="pac-search-wrap">
          <svg class="pac-search-ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="busqueda" class="pac-search-input" placeholder="Buscar paciente…" @input="onBusqueda" />
        </div>
        <button class="pac-new-btn" title="Nuevo paciente" @click="abrirModalPaciente()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>

      <!-- Conteo -->
      <div class="pac-lista-count">{{ pacientes.length }} paciente{{ pacientes.length !== 1 ? 's' : '' }}</div>

      <!-- Loading -->
      <div v-if="cargandoLista" style="display:flex; justify-content:center; padding:32px;">
        <div class="pac-spinner"></div>
      </div>

      <!-- Empty -->
      <div v-else-if="pacientes.length === 0" class="pac-lista-empty">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="1.25"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
        <span>Sin pacientes{{ busqueda ? ' con ese criterio' : '' }}</span>
      </div>

      <!-- Items -->
      <div v-else class="pac-lista-items">
        <button
          v-for="p in pacientes"
          :key="p.id"
          class="pac-item"
          :class="{ 'pac-item--active': pacienteActivo && pacienteActivo.id === p.id }"
          @click="seleccionar(p)"
        >
          <div class="pac-item-avatar" :style="{ background: avatarColor(p.nombre) }">{{ iniciales(p.nombre) }}</div>
          <div class="pac-item-info">
            <div class="pac-item-nombre">
              {{ p.nombre }}
              <span v-if="p.origenRegistro === 'IA_AGENTE'" class="pac-badge-ia">IA</span>
            </div>
            <div class="pac-item-sub">{{ p.telefono }}</div>
          </div>
          <div v-if="pacienteActivo && pacienteActivo.id === p.id" class="pac-item-dot"></div>
        </button>
      </div>
    </div>

    <!-- ── Panel derecho: detalle ── -->
    <div class="pac-detalle">

      <!-- Sin selección -->
      <div v-if="!pacienteActivo" class="pac-empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="1"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
        <div class="pac-empty-title">Selecciona un paciente</div>
        <div class="pac-empty-sub">Elige un paciente de la lista para ver su expediente</div>
        <button class="pac-btn-primary" @click="abrirModalPaciente()">+ Nuevo Paciente</button>
      </div>

      <template v-else>

        <!-- Header del paciente -->
        <div class="pac-det-hd">
          <div class="pac-det-avatar" :style="{ background: avatarColor(pacienteActivo.nombre) }">
            {{ iniciales(pacienteActivo.nombre) }}
          </div>
          <div class="pac-det-info">
            <div class="pac-det-nombre">
              {{ pacienteActivo.nombre }}
              <span v-if="pacienteActivo.origenRegistro === 'IA_AGENTE'" class="pac-badge-ia pac-badge-ia--lg">IA Agente</span>
            </div>
            <div class="pac-det-meta">
              <span v-if="edad(pacienteActivo.fechaNacimiento)">{{ edad(pacienteActivo.fechaNacimiento) }} años</span>
              <span v-if="pacienteActivo.grupoSanguineo" class="pac-sangre">{{ pacienteActivo.grupoSanguineo }}</span>
              <span>{{ pacienteActivo.telefono }}</span>
              <span v-if="pacienteActivo.email" style="color:#64748b;">{{ pacienteActivo.email }}</span>
            </div>
          </div>
          <div class="pac-det-actions">
            <button class="pac-ico-btn" title="Editar datos" @click="abrirModalPaciente(pacienteActivo)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="pac-ico-btn pac-ico-btn--del" title="Eliminar paciente" @click="eliminarPaciente(pacienteActivo)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            </button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="pac-tabs">
          <button v-for="t in tabs" :key="t.id" class="pac-tab" :class="{ 'pac-tab--active': tabActivo === t.id }" @click="cambiarTab(t.id)">
            {{ t.label }}
          </button>
        </div>

        <!-- ── Tab: Ficha ── -->
        <div v-if="tabActivo === 'ficha'" class="pac-tab-body">
          <div class="pac-form-grid">
            <div class="ide-field">
              <label>Nombre completo *</label>
              <input v-model="formaFicha.nombre" class="ide-input" />
            </div>
            <div class="ide-field">
              <label>Teléfono *</label>
              <input v-model="formaFicha.telefono" class="ide-input" />
            </div>
            <div class="ide-field">
              <label>Email</label>
              <input v-model="formaFicha.email" class="ide-input" type="email" />
            </div>
            <div class="ide-field">
              <label>Cédula / CI / DNI</label>
              <input v-model="formaFicha.ci" class="ide-input" placeholder="Ej: 12345678" />
            </div>
            <div class="ide-field">
              <label>Fecha de nacimiento</label>
              <input v-model="formaFicha.fechaNacimiento" class="ide-input" type="date" />
            </div>
            <div class="ide-field">
              <label>Género</label>
              <select v-model="formaFicha.genero" class="ide-select">
                <option value="">— Sin especificar —</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </div>
            <div class="ide-field">
              <label>Grupo sanguíneo</label>
              <select v-model="formaFicha.grupoSanguineo" class="ide-select">
                <option value="">— Sin especificar —</option>
                <option v-for="gs in gruposSanguineos" :key="gs" :value="gs">{{ gs }}</option>
              </select>
            </div>
            <div class="ide-field">
              <label>Dirección</label>
              <input v-model="formaFicha.direccion" class="ide-input" placeholder="Calle, número, ciudad" />
            </div>
            <div class="ide-field pac-form-full">
              <label>Contacto de emergencia — Nombre</label>
              <input v-model="formaFicha.contactoEmergenciaNombre" class="ide-input" placeholder="Nombre del familiar" />
            </div>
            <div class="ide-field pac-form-full">
              <label>Contacto de emergencia — Teléfono</label>
              <input v-model="formaFicha.contactoEmergenciaTelefono" class="ide-input" placeholder="Teléfono de contacto" />
            </div>
          </div>
          <div class="pac-form-footer">
            <button class="pac-btn-primary" :disabled="guardando" @click="guardarFicha">
              <span v-if="guardando" class="pac-spinner pac-spinner--sm"></span>
              Guardar ficha
            </button>
          </div>
        </div>

        <!-- ── Tab: Antecedentes ── -->
        <div v-if="tabActivo === 'antecedentes'" class="pac-tab-body">
          <div class="pac-form-stack">
            <div class="ide-field">
              <label>Alergias conocidas</label>
              <textarea v-model="formaAntecedentes.alergias" class="ide-textarea" rows="3" placeholder="Ej: Penicilina, polvo, mariscos…"></textarea>
            </div>
            <div class="ide-field">
              <label>Enfermedades crónicas</label>
              <textarea v-model="formaAntecedentes.enfermedadesCronicas" class="ide-textarea" rows="3" placeholder="Ej: Diabetes tipo 2, hipertensión…"></textarea>
            </div>
            <div class="ide-field">
              <label>Cirugías previas</label>
              <textarea v-model="formaAntecedentes.cirugiasPrevias" class="ide-textarea" rows="3" placeholder="Ej: Apendicectomía 2018, rodilla 2021…"></textarea>
            </div>
            <div class="ide-field">
              <label>Medicamentos actuales</label>
              <textarea v-model="formaAntecedentes.medicamentosActuales" class="ide-textarea" rows="3" placeholder="Ej: Metformina 500mg, Losartán 50mg…"></textarea>
            </div>
            <div class="ide-field">
              <label>Observaciones generales</label>
              <textarea v-model="formaAntecedentes.observaciones" class="ide-textarea" rows="3" placeholder="Información adicional de importancia clínica…"></textarea>
            </div>
          </div>
          <div class="pac-form-footer">
            <button class="pac-btn-primary" :disabled="guardando" @click="guardarAntecedentes">
              <span v-if="guardando" class="pac-spinner pac-spinner--sm"></span>
              Guardar antecedentes
            </button>
          </div>
        </div>

        <!-- ── Tab: Citas ── -->
        <div v-if="tabActivo === 'citas'" class="pac-tab-body">
          <div class="pac-tab-toolbar">
            <span style="font-size:13px; color:#64748b;">Historial de citas agendadas</span>
            <button class="pac-btn-outline" @click="$router.push({ name: 'citas-medicas' })">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Nueva cita
            </button>
          </div>

          <div v-if="cargandoCitas" style="display:flex; justify-content:center; padding:32px;">
            <div class="pac-spinner"></div>
          </div>

          <div v-else-if="citasPaciente.length === 0" class="pac-tab-empty">
            Sin historial de citas
          </div>

          <div v-else class="pac-citas-list">
            <div v-for="c in citasPaciente" :key="c.id" class="pac-cita-row ide-ia-card">
              <div class="pac-cita-fecha">
                <div class="pac-cita-dia">{{ formatFecha(c.fecha) }}</div>
                <div class="pac-cita-hora">{{ c.horaInicio }} – {{ c.horaFin }}</div>
              </div>
              <div class="pac-cita-svc">{{ c.servicio }}</div>
              <span class="pac-cita-estado" :class="estadoClass(c.estadoCita)">{{ c.estadoCita }}</span>
              <div v-if="c.notas" class="pac-cita-notas">{{ c.notas }}</div>
            </div>
          </div>
        </div>

        <!-- ── Tab: Consultas ── -->
        <div v-if="tabActivo === 'consultas'" class="pac-tab-body">
          <div class="pac-tab-toolbar">
            <span style="font-size:13px; color:#64748b;">Expediente clínico</span>
            <button class="pac-btn-primary pac-btn-sm" @click="abrirModalConsulta()">+ Nueva consulta</button>
          </div>

          <div v-if="cargandoConsultas" style="display:flex; justify-content:center; padding:32px;">
            <div class="pac-spinner"></div>
          </div>

          <div v-else-if="consultas.length === 0" class="pac-tab-empty">
            Sin consultas registradas
          </div>

          <div v-else class="pac-consultas-list">
            <div v-for="c in consultas" :key="c.id" class="pac-consulta-card ide-ia-card">
              <div class="pac-consulta-hd">
                <div>
                  <div class="pac-consulta-fecha">{{ formatFecha(c.fecha) }}</div>
                  <div v-if="c.servicio" class="pac-consulta-svc">{{ c.servicio }}</div>
                </div>
                <div style="display:flex; gap:4px;">
                  <button class="pac-ico-btn" title="Editar" @click="abrirModalConsulta(c)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="pac-ico-btn pac-ico-btn--del" title="Eliminar" @click="eliminarConsulta(c)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                  </button>
                </div>
              </div>
              <div class="pac-consulta-section">
                <div class="pac-consulta-label">Diagnóstico</div>
                <div class="pac-consulta-txt">{{ c.diagnostico }}</div>
              </div>
              <div v-if="c.tratamiento" class="pac-consulta-section">
                <div class="pac-consulta-label">Tratamiento</div>
                <div class="pac-consulta-txt">{{ c.tratamiento }}</div>
              </div>
              <div v-if="c.medicamentos" class="pac-consulta-section">
                <div class="pac-consulta-label">Medicamentos</div>
                <div class="pac-consulta-txt">{{ c.medicamentos }}</div>
              </div>
              <div v-if="c.observaciones" class="pac-consulta-section">
                <div class="pac-consulta-label">Observaciones</div>
                <div class="pac-consulta-txt">{{ c.observaciones }}</div>
              </div>
              <div v-if="c.proximaCita" class="pac-consulta-proxima">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Próxima cita: {{ formatFecha(c.proximaCita) }}
              </div>
            </div>
          </div>
        </div>

      </template>
    </div>

    <!-- ── Modal: nuevo/editar paciente ── -->
    <transition name="modal-fade">
      <div v-if="modalPaciente" class="pac-modal-backdrop" @mousedown.self="cerrarModalPaciente">
        <div class="pac-modal">
          <div class="pac-modal-hd">
            <span>{{ pacienteEditando ? 'Editar Paciente' : 'Nuevo Paciente' }}</span>
            <button class="pac-modal-close" @click="cerrarModalPaciente">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="pac-modal-body">
            <div class="pac-form-grid">
              <div class="ide-field">
                <label>Nombre completo *</label>
                <input v-model="formaPaciente.nombre" class="ide-input" placeholder="Nombre y apellidos" />
              </div>
              <div class="ide-field">
                <label>Teléfono *</label>
                <input v-model="formaPaciente.telefono" class="ide-input" placeholder="+591 70000000" />
              </div>
              <div class="ide-field">
                <label>Email</label>
                <input v-model="formaPaciente.email" class="ide-input" type="email" />
              </div>
              <div class="ide-field">
                <label>Cédula / CI</label>
                <input v-model="formaPaciente.ci" class="ide-input" placeholder="12345678" />
              </div>
              <div class="ide-field">
                <label>Fecha de nacimiento</label>
                <input v-model="formaPaciente.fechaNacimiento" class="ide-input" type="date" />
              </div>
              <div class="ide-field">
                <label>Género</label>
                <select v-model="formaPaciente.genero" class="ide-select">
                  <option value="">— Sin especificar —</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="O">Otro</option>
                </select>
              </div>
              <div class="ide-field">
                <label>Grupo sanguíneo</label>
                <select v-model="formaPaciente.grupoSanguineo" class="ide-select">
                  <option value="">— Sin especificar —</option>
                  <option v-for="gs in gruposSanguineos" :key="gs" :value="gs">{{ gs }}</option>
                </select>
              </div>
              <div class="ide-field">
                <label>Dirección</label>
                <input v-model="formaPaciente.direccion" class="ide-input" />
              </div>
              <div class="ide-field pac-form-full">
                <label>Contacto de emergencia — Nombre</label>
                <input v-model="formaPaciente.contactoEmergenciaNombre" class="ide-input" />
              </div>
              <div class="ide-field pac-form-full">
                <label>Contacto de emergencia — Teléfono</label>
                <input v-model="formaPaciente.contactoEmergenciaTelefono" class="ide-input" />
              </div>
            </div>
          </div>
          <div class="pac-modal-ft">
            <button class="pac-btn-cancel" @click="cerrarModalPaciente">Cancelar</button>
            <button class="pac-btn-primary" :disabled="guardandoPaciente || !formaPaciente.nombre || !formaPaciente.telefono" @click="guardarPaciente">
              <span v-if="guardandoPaciente" class="pac-spinner pac-spinner--sm"></span>
              {{ pacienteEditando ? 'Actualizar' : 'Crear Paciente' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ── Modal: nueva/editar consulta ── -->
    <transition name="modal-fade">
      <div v-if="modalConsulta" class="pac-modal-backdrop" @mousedown.self="cerrarModalConsulta">
        <div class="pac-modal pac-modal--lg">
          <div class="pac-modal-hd">
            <span>{{ consultaEditando ? 'Editar Consulta' : 'Nueva Consulta' }}</span>
            <button class="pac-modal-close" @click="cerrarModalConsulta">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="pac-modal-body">
            <div class="pac-form-grid">
              <div class="ide-field">
                <label>Fecha *</label>
                <input v-model="formaConsulta.fecha" class="ide-input" type="date" />
              </div>
              <div class="ide-field">
                <label>Servicio</label>
                <select v-model="formaConsulta.servicio" class="ide-select">
                  <option value="">— Sin especificar —</option>
                  <option v-for="s in servicios" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
              <div class="ide-field pac-form-full">
                <label>Diagnóstico *</label>
                <textarea v-model="formaConsulta.diagnostico" class="ide-textarea" rows="3" placeholder="Diagnóstico clínico…"></textarea>
              </div>
              <div class="ide-field pac-form-full">
                <label>Tratamiento</label>
                <textarea v-model="formaConsulta.tratamiento" class="ide-textarea" rows="2" placeholder="Plan de tratamiento…"></textarea>
              </div>
              <div class="ide-field pac-form-full">
                <label>Medicamentos recetados</label>
                <textarea v-model="formaConsulta.medicamentos" class="ide-textarea" rows="2" placeholder="Ej: Amoxicilina 500mg cada 8h por 7 días…"></textarea>
              </div>
              <div class="ide-field pac-form-full">
                <label>Observaciones</label>
                <textarea v-model="formaConsulta.observaciones" class="ide-textarea" rows="2" placeholder="Observaciones adicionales…"></textarea>
              </div>
              <div class="ide-field pac-form-full">
                <label>Próxima cita recomendada</label>
                <input v-model="formaConsulta.proximaCita" class="ide-input" type="date" />
              </div>
            </div>
          </div>
          <div class="pac-modal-ft">
            <button class="pac-btn-cancel" @click="cerrarModalConsulta">Cancelar</button>
            <button class="pac-btn-primary" :disabled="guardandoConsulta || !formaConsulta.fecha || !formaConsulta.diagnostico" @click="guardarConsulta">
              <span v-if="guardandoConsulta" class="pac-spinner pac-spinner--sm"></span>
              {{ consultaEditando ? 'Actualizar' : 'Registrar consulta' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
const FORMA_PACIENTE = () => ({
  nombre: '', telefono: '', email: '', ci: '',
  fechaNacimiento: '', genero: '', grupoSanguineo: '', direccion: '',
  contactoEmergenciaNombre: '', contactoEmergenciaTelefono: '',
});

const FORMA_CONSULTA = () => ({
  fecha: new Date().toISOString().slice(0, 10),
  servicio: '', diagnostico: '', tratamiento: '',
  medicamentos: '', observaciones: '', proximaCita: '',
});

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#14b8a6', '#3b82f6', '#ef4444'];

export default {
  name: 'Pacientes',
  data() {
    return {
      pacientes: [],
      cargandoLista: false,
      busqueda: '',
      buscarTimer: null,
      pacienteActivo: null,

      tabActivo: 'ficha',
      tabs: [
        { id: 'ficha',         label: 'Ficha' },
        { id: 'antecedentes',  label: 'Antecedentes' },
        { id: 'citas',         label: 'Citas' },
        { id: 'consultas',     label: 'Consultas' },
      ],

      formaFicha: {},
      formaAntecedentes: {},
      guardando: false,

      citasPaciente: [],
      cargandoCitas: false,

      consultas: [],
      cargandoConsultas: false,

      modalPaciente: false,
      pacienteEditando: null,
      formaPaciente: FORMA_PACIENTE(),
      guardandoPaciente: false,

      modalConsulta: false,
      consultaEditando: null,
      formaConsulta: FORMA_CONSULTA(),
      guardandoConsulta: false,

      gruposSanguineos: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    };
  },
  computed: {
    servicios() {
      return this.$store.getters.clienteInfo?.servicios || [];
    },
  },
  mounted() {
    this.cargarLista();
  },
  methods: {
    // ── Lista ────────────────────────────────────────────────────────────────
    async cargarLista() {
      this.cargandoLista = true;
      try {
        const data = await this.$service.list('pacientes', this.busqueda ? { q: this.busqueda } : {});
        this.pacientes = Array.isArray(data) ? data : [];
      } catch {
        this.pacientes = [];
      } finally {
        this.cargandoLista = false;
      }
    },
    onBusqueda() {
      clearTimeout(this.buscarTimer);
      this.buscarTimer = setTimeout(() => this.cargarLista(), 300);
    },
    async seleccionar(p) {
      this.pacienteActivo = p;
      this.formaFicha = { ...p };
      this.formaAntecedentes = {
        alergias: p.alergias || '',
        enfermedadesCronicas: p.enfermedadesCronicas || '',
        cirugiasPrevias: p.cirugiasPrevias || '',
        medicamentosActuales: p.medicamentosActuales || '',
        observaciones: p.observaciones || '',
      };
      this.citasPaciente = [];
      this.consultas = [];
      if (this.tabActivo === 'citas') this.cargarCitas();
      if (this.tabActivo === 'consultas') this.cargarConsultas();
    },
    cambiarTab(id) {
      this.tabActivo = id;
      if (id === 'citas' && this.pacienteActivo) this.cargarCitas();
      if (id === 'consultas' && this.pacienteActivo) this.cargarConsultas();
    },

    // ── Ficha ────────────────────────────────────────────────────────────────
    async guardarFicha() {
      if (!this.pacienteActivo) return;
      this.guardando = true;
      try {
        const updated = await this.$service.put(`pacientes/${this.pacienteActivo.id}`, this.formaFicha);
        this.$message.success('Ficha actualizada.');
        this.pacienteActivo = { ...this.pacienteActivo, ...updated };
        this.cargarLista();
      } catch {
        // interceptor muestra el error
      } finally {
        this.guardando = false;
      }
    },

    // ── Antecedentes ─────────────────────────────────────────────────────────
    async guardarAntecedentes() {
      if (!this.pacienteActivo) return;
      this.guardando = true;
      try {
        const updated = await this.$service.put(`pacientes/${this.pacienteActivo.id}`, this.formaAntecedentes);
        this.$message.success('Antecedentes guardados.');
        this.pacienteActivo = { ...this.pacienteActivo, ...updated };
      } catch {
        // interceptor
      } finally {
        this.guardando = false;
      }
    },

    // ── Citas ────────────────────────────────────────────────────────────────
    async cargarCitas() {
      if (!this.pacienteActivo) return;
      this.cargandoCitas = true;
      try {
        const data = await this.$service.get(`pacientes/${this.pacienteActivo.id}/citas`);
        this.citasPaciente = Array.isArray(data) ? data : [];
      } catch {
        this.citasPaciente = [];
      } finally {
        this.cargandoCitas = false;
      }
    },

    // ── Consultas ────────────────────────────────────────────────────────────
    async cargarConsultas() {
      if (!this.pacienteActivo) return;
      this.cargandoConsultas = true;
      try {
        const data = await this.$service.get(`pacientes/${this.pacienteActivo.id}/consultas`);
        this.consultas = Array.isArray(data) ? data : [];
      } catch {
        this.consultas = [];
      } finally {
        this.cargandoConsultas = false;
      }
    },
    abrirModalConsulta(consulta) {
      this.consultaEditando = consulta || null;
      this.formaConsulta = consulta
        ? { fecha: consulta.fecha, servicio: consulta.servicio || '', diagnostico: consulta.diagnostico, tratamiento: consulta.tratamiento || '', medicamentos: consulta.medicamentos || '', observaciones: consulta.observaciones || '', proximaCita: consulta.proximaCita || '' }
        : FORMA_CONSULTA();
      this.modalConsulta = true;
    },
    cerrarModalConsulta() {
      this.modalConsulta = false;
      this.consultaEditando = null;
      this.formaConsulta = FORMA_CONSULTA();
    },
    async guardarConsulta() {
      if (!this.pacienteActivo || !this.formaConsulta.fecha || !this.formaConsulta.diagnostico) return;
      this.guardandoConsulta = true;
      try {
        if (this.consultaEditando) {
          await this.$service.put(`pacientes/${this.pacienteActivo.id}/consultas/${this.consultaEditando.id}`, this.formaConsulta);
          this.$message.success('Consulta actualizada.');
        } else {
          await this.$service.post(`pacientes/${this.pacienteActivo.id}/consultas`, this.formaConsulta);
          this.$message.success('Consulta registrada.');
        }
        this.cerrarModalConsulta();
        this.cargarConsultas();
      } catch {
        // interceptor
      } finally {
        this.guardandoConsulta = false;
      }
    },
    eliminarConsulta(c) {
      this.$confirm('¿Eliminar este registro de consulta?', async () => {
        try {
          await this.$service.delete(`pacientes/${this.pacienteActivo.id}/consultas/${c.id}`);
          this.$message.success('Consulta eliminada.');
          this.cargarConsultas();
        } catch {
          // interceptor
        }
      });
    },

    // ── Modal paciente ────────────────────────────────────────────────────────
    abrirModalPaciente(p) {
      this.pacienteEditando = p || null;
      this.formaPaciente = p
        ? { nombre: p.nombre, telefono: p.telefono, email: p.email || '', ci: p.ci || '', fechaNacimiento: p.fechaNacimiento || '', genero: p.genero || '', grupoSanguineo: p.grupoSanguineo || '', direccion: p.direccion || '', contactoEmergenciaNombre: p.contactoEmergenciaNombre || '', contactoEmergenciaTelefono: p.contactoEmergenciaTelefono || '' }
        : FORMA_PACIENTE();
      this.modalPaciente = true;
    },
    cerrarModalPaciente() {
      this.modalPaciente = false;
      this.pacienteEditando = null;
      this.formaPaciente = FORMA_PACIENTE();
    },
    async guardarPaciente() {
      if (!this.formaPaciente.nombre || !this.formaPaciente.telefono) return;
      this.guardandoPaciente = true;
      try {
        let resultado;
        if (this.pacienteEditando) {
          resultado = await this.$service.put(`pacientes/${this.pacienteEditando.id}`, this.formaPaciente);
          this.$message.success('Paciente actualizado.');
          if (this.pacienteActivo && this.pacienteActivo.id === this.pacienteEditando.id) {
            this.pacienteActivo = { ...this.pacienteActivo, ...resultado };
            this.formaFicha = { ...this.pacienteActivo };
          }
        } else {
          resultado = await this.$service.post('pacientes', this.formaPaciente);
          this.$message.success('Paciente creado.');
          this.seleccionar(resultado);
        }
        this.cerrarModalPaciente();
        this.cargarLista();
      } catch {
        // interceptor
      } finally {
        this.guardandoPaciente = false;
      }
    },
    eliminarPaciente(p) {
      this.$confirm(`¿Eliminar al paciente ${p.nombre}?`, async () => {
        try {
          await this.$service.delete(`pacientes/${p.id}`);
          this.$message.success('Paciente eliminado.');
          this.pacienteActivo = null;
          this.cargarLista();
        } catch {
          // interceptor
        }
      });
    },

    // ── Helpers ───────────────────────────────────────────────────────────────
    iniciales(nombre) {
      if (!nombre) return '?';
      return nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
    },
    avatarColor(nombre) {
      if (!nombre) return AVATAR_COLORS[0];
      const code = nombre.charCodeAt(0) + (nombre.charCodeAt(1) || 0);
      return AVATAR_COLORS[code % AVATAR_COLORS.length] + '33';
    },
    edad(fechaNacimiento) {
      if (!fechaNacimiento) return null;
      const hoy = new Date();
      const nac = new Date(fechaNacimiento + 'T12:00:00');
      let e = hoy.getFullYear() - nac.getFullYear();
      const m = hoy.getMonth() - nac.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
      return e;
    },
    formatFecha(f) {
      if (!f) return '';
      return new Date(f + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    },
    estadoClass(estado) {
      const m = { PENDIENTE: 'pac-cita-pend', CONFIRMADA: 'pac-cita-conf', CANCELADA: 'pac-cita-canc', COMPLETADA: 'pac-cita-comp' };
      return m[estado] || '';
    },
  },
};
</script>

<style scoped>
/* ── Root: two-panel layout ── */
.pac-root {
  display: flex;
  height: 100%;
  overflow: hidden;
  background: #0a0f1e;
}

/* ── Panel izquierdo: lista ── */
.pac-lista {
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid #1e3a5f44;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #0d1526;
}
.pac-lista-hd {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 12px 10px;
  border-bottom: 1px solid #1e3a5f44;
  flex-shrink: 0;
}
.pac-search-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}
.pac-search-ico {
  position: absolute;
  left: 9px;
  color: #475569;
  pointer-events: none;
}
.pac-search-input {
  width: 100%;
  background: #111827;
  border: 1px solid #1e3a5f66;
  border-radius: 8px;
  padding: 6px 10px 6px 28px;
  font-size: 12px;
  color: #e2e8f0;
  outline: none;
  transition: border-color 0.15s;
}
.pac-search-input:focus { border-color: #6366f1; }
.pac-search-input::placeholder { color: #475569; }
.pac-new-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  background: #6366f1;
  border: none;
  border-radius: 7px;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s;
}
.pac-new-btn:hover { background: #4f46e5; }
.pac-lista-count {
  padding: 6px 14px;
  font-size: 10px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}
.pac-lista-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 16px;
  color: #475569;
  font-size: 12px;
  text-align: center;
}
.pac-lista-items {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}
.pac-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
  position: relative;
}
.pac-item:hover { background: #1e293b55; }
.pac-item--active { background: #6366f122 !important; }
.pac-item-avatar {
  width: 34px; height: 34px;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #818cf8;
  flex-shrink: 0;
}
.pac-item-info { flex: 1; min-width: 0; }
.pac-item-nombre { font-size: 13px; font-weight: 600; color: #e2e8f0; display: flex; align-items: center; gap: 5px; }
.pac-item-sub { font-size: 11px; color: #64748b; }
.pac-item-dot { width: 6px; height: 6px; border-radius: 50%; background: #6366f1; flex-shrink: 0; }
.pac-badge-ia { display: inline-flex; align-items: center; font-size: 9px; font-weight: 700; letter-spacing: .04em; padding: 1px 5px; border-radius: 4px; background: #6366f118; border: 1px solid #6366f166; color: #a5b4fc; flex-shrink: 0; }
.pac-badge-ia--lg { font-size: 11px; padding: 2px 8px; border-radius: 5px; }

/* ── Panel derecho: detalle ── */
.pac-detalle {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.pac-empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #334155;
}
.pac-empty-title { font-size: 15px; font-weight: 700; color: #475569; }
.pac-empty-sub { font-size: 12px; color: #334155; }

/* ── Header paciente seleccionado ── */
.pac-det-hd {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 24px;
  border-bottom: 1px solid #1e3a5f44;
  flex-shrink: 0;
  background: #0d1526;
}
.pac-det-avatar {
  width: 42px; height: 42px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 800; color: #818cf8;
  flex-shrink: 0;
}
.pac-det-info { flex: 1; min-width: 0; }
.pac-det-nombre { font-size: 16px; font-weight: 800; color: #f1f5f9; }
.pac-det-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 3px;
  font-size: 12px;
  color: #94a3b8;
}
.pac-sangre {
  background: #ef444422;
  color: #ef4444;
  border: 1px solid #ef444444;
  border-radius: 4px;
  padding: 1px 6px;
  font-weight: 700;
  font-size: 11px;
}
.pac-det-actions { display: flex; gap: 6px; flex-shrink: 0; }
.pac-ico-btn {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px;
  border: 1px solid #1e3a5f66;
  border-radius: 7px;
  background: #111827;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}
.pac-ico-btn:hover { border-color: #6366f1; color: #818cf8; }
.pac-ico-btn--del:hover { border-color: #ef4444; color: #ef4444; background: #ef444411; }

/* ── Tabs ── */
.pac-tabs {
  display: flex;
  gap: 2px;
  padding: 10px 24px 0;
  border-bottom: 1px solid #1e3a5f44;
  flex-shrink: 0;
  background: #0d1526;
}
.pac-tab {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: -1px;
}
.pac-tab:hover { color: #94a3b8; }
.pac-tab--active { color: #818cf8; border-bottom-color: #6366f1; }

/* ── Tab body ── */
.pac-tab-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}
.pac-tab-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.pac-tab-empty {
  text-align: center;
  padding: 40px;
  color: #475569;
  font-size: 13px;
}
.pac-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 20px;
}
.pac-form-full { grid-column: span 2; }
.pac-form-stack { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
.pac-form-footer { display: flex; justify-content: flex-end; padding-top: 4px; }

/* ── Historial citas ── */
.pac-citas-list { display: flex; flex-direction: column; gap: 8px; }
.pac-cita-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  padding: 10px 14px !important;
}
.pac-cita-fecha { min-width: 100px; }
.pac-cita-dia { font-size: 13px; font-weight: 700; color: #e2e8f0; }
.pac-cita-hora { font-size: 11px; color: #64748b; }
.pac-cita-svc { flex: 1; font-size: 13px; color: #94a3b8; }
.pac-cita-estado {
  font-size: 10px;
  font-weight: 700;
  border-radius: 5px;
  padding: 2px 8px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.pac-cita-pend  { background: #f59e0b22; color: #f59e0b; border: 1px solid #f59e0b44; }
.pac-cita-conf  { background: #22c55e22; color: #22c55e; border: 1px solid #22c55e44; }
.pac-cita-canc  { background: #ef444422; color: #ef4444; border: 1px solid #ef444444; }
.pac-cita-comp  { background: #6366f122; color: #818cf8; border: 1px solid #6366f144; }
.pac-cita-notas { width: 100%; font-size: 11px; color: #64748b; padding-top: 4px; }

/* ── Consultas ── */
.pac-consultas-list { display: flex; flex-direction: column; gap: 12px; }
.pac-consulta-card { display: flex; flex-direction: column; gap: 10px; }
.pac-consulta-hd { display: flex; align-items: flex-start; justify-content: space-between; }
.pac-consulta-fecha { font-size: 13px; font-weight: 700; color: #e2e8f0; }
.pac-consulta-svc { font-size: 11px; color: #818cf8; margin-top: 2px; font-weight: 600; }
.pac-consulta-section { display: flex; flex-direction: column; gap: 3px; }
.pac-consulta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; }
.pac-consulta-txt { font-size: 13px; color: #cbd5e1; line-height: 1.5; white-space: pre-wrap; }
.pac-consulta-proxima {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #818cf8;
  font-weight: 600;
  padding: 5px 8px;
  background: #6366f111;
  border-radius: 6px;
  width: fit-content;
}

/* ── Buttons ── */
.pac-btn-primary {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 18px;
  background: #6366f1;
  border: none; border-radius: 8px;
  color: #fff; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: background 0.15s;
}
.pac-btn-primary:hover:not(:disabled) { background: #4f46e5; }
.pac-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.pac-btn-sm { padding: 6px 14px; font-size: 12px; }
.pac-btn-cancel {
  padding: 8px 16px;
  border: 1px solid #1e3a5f66;
  border-radius: 8px;
  background: none;
  color: #64748b;
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.pac-btn-cancel:hover { border-color: #475569; color: #94a3b8; }
.pac-btn-outline {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  border: 1px solid #1e3a5f66;
  border-radius: 7px;
  background: none;
  color: #64748b;
  font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.pac-btn-outline:hover { border-color: #6366f1; color: #818cf8; }

/* ── Modal ── */
.pac-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.pac-modal {
  background: #111827;
  border: 1px solid #1e3a5f66;
  border-radius: 14px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.pac-modal--lg { max-width: 620px; }
.pac-modal-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #1e3a5f44;
  font-size: 15px; font-weight: 700; color: #f1f5f9;
  flex-shrink: 0;
}
.pac-modal-close {
  background: none; border: none; cursor: pointer;
  color: #64748b; padding: 2px; display: flex; border-radius: 5px;
  transition: color 0.15s;
}
.pac-modal-close:hover { color: #94a3b8; }
.pac-modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; }
.pac-modal-ft {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 14px 24px;
  border-top: 1px solid #1e3a5f44;
  flex-shrink: 0;
}

/* ── Spinner ── */
.pac-spinner {
  width: 22px; height: 22px;
  border: 3px solid #1e3a5f;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: pac-spin 0.75s linear infinite;
}
.pac-spinner--sm { width: 13px; height: 13px; border-width: 2px; border-color: rgba(255,255,255,0.3); border-top-color: #fff; }
@keyframes pac-spin { to { transform: rotate(360deg); } }

/* ── Transition ── */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter, .modal-fade-leave-to { opacity: 0; }
</style>
