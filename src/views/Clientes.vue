<template>
  <div class="ide-mod">

    <!-- Header -->
    <div class="ide-clientes-hd">
      <div style="display:flex; align-items:center; gap:14px;">
        <div class="ide-cl-ico">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <div>
          <h1 style="font-size:18px; font-weight:800; color:var(--t1); margin:0;">Clientes</h1>
          <p style="font-size:12px; color:var(--t5); margin:0;">{{ clientes.length }} cliente{{ clientes.length !== 1 ? 's' : '' }} registrado{{ clientes.length !== 1 ? 's' : '' }}</p>
        </div>
      </div>
      <v-btn depressed color="primary" @click="abrirCrear" style="font-size:12px; border-radius:8px; font-weight:700;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:6px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nuevo cliente
      </v-btn>
    </div>

    <!-- Grid de clientes -->
    <div class="ide-cl-grid" v-if="!cargando">
      <div
        v-for="cl in clientes"
        :key="cl.id"
        class="ide-cl-card"
      >
        <div class="ide-cl-card-header">
          <div class="ide-cl-avatar" :style="{ background: avatarColor(cl.nombre) }">
            {{ cl.nombre.charAt(0).toUpperCase() }}
          </div>
          <div style="flex:1; min-width:0;">
            <div class="ide-cl-nombre">{{ cl.nombre }}</div>
            <div class="ide-cl-slug">{{ cl.slug }}</div>
          </div>
          <span class="ide-cl-plan" :class="`ide-cl-plan--${cl.plan}`">{{ cl.plan }}</span>
        </div>

        <div class="ide-cl-meta">
          <div v-if="cl.correoContacto" class="ide-cl-meta-row">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span class="ide-cl-meta-txt">{{ cl.correoContacto }}</span>
          </div>
          <div v-if="cl.telefono" class="ide-cl-meta-row">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            <span class="ide-cl-meta-txt">{{ cl.telefono }}</span>
          </div>
          <div v-if="cl.diasAtencion && cl.diasAtencion.length" class="ide-cl-meta-row">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span class="ide-cl-meta-txt">{{ cl.diasAtencion.join(', ') }}<template v-if="cl.horaInicioAtencion"> · {{ cl.horaInicioAtencion }}–{{ cl.horaFinAtencion }}</template></span>
          </div>
          <div v-if="cl.servicios && cl.servicios.length" style="margin-top:8px; display:flex; flex-wrap:wrap; gap:4px;">
            <span v-for="s in cl.servicios.slice(0,3)" :key="s" class="ide-cl-tag">{{ s }}</span>
            <span v-if="cl.servicios.length > 3" class="ide-cl-tag ide-cl-tag--more">+{{ cl.servicios.length - 3 }}</span>
          </div>
        </div>

        <div class="ide-cl-actions">
          <div style="display:flex; align-items:center; gap:6px;">
            <span class="ide-cl-status" :class="cl.activo ? 'ide-cl-status--on' : 'ide-cl-status--off'">
              {{ cl.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="ide-cl-btn" @click="abrirEditar(cl)" title="Editar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="ide-cl-btn ide-cl-btn--danger" @click="confirmarEliminar(cl)" title="Eliminar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!clientes.length" class="ide-cl-empty">
        <div style="font-size:36px; margin-bottom:12px;">🏢</div>
        <div style="font-size:14px; font-weight:700; color:var(--t2); margin-bottom:6px;">Sin clientes registrados</div>
        <div style="font-size:12px; color:var(--t5);">Crea el primer cliente para comenzar</div>
      </div>
    </div>

    <div v-else style="display:flex; justify-content:center; padding:60px;">
      <v-progress-circular indeterminate color="primary" size="32" />
    </div>

    <!-- ── Dialog crear / editar ── -->
    <v-dialog v-model="dialog" max-width="620" persistent>
      <div class="ide-cl-dialog">
        <div class="ide-cl-dialog-hd">
          <span style="font-size:15px; font-weight:800; color:var(--t1);">{{ editando ? 'Editar cliente' : 'Nuevo cliente' }}</span>
          <button class="ide-cl-dialog-close" @click="cerrarDialog">✕</button>
        </div>

        <div class="ide-cl-dialog-body">
          <!-- Nombre + Slug -->
          <div class="cfg-form-row">
            <div class="ide-field">
              <label>Nombre de la empresa *</label>
              <input v-model="form.nombre" class="ide-input" placeholder="MiDoc" @input="autoSlug" />
            </div>
            <div class="ide-field">
              <label>Slug (URL) *</label>
              <input v-model="form.slug" class="ide-input" placeholder="midoc" />
              <div style="font-size:10px; color:var(--t5); margin-top:3px;">Solo letras minúsculas, números y guiones</div>
            </div>
          </div>

          <!-- Contacto -->
          <div class="cfg-form-row">
            <div class="ide-field">
              <label>Correo de contacto</label>
              <input v-model="form.correoContacto" class="ide-input" placeholder="contacto@empresa.com" type="email" />
            </div>
            <div class="ide-field">
              <label>Teléfono</label>
              <input v-model="form.telefono" class="ide-input" placeholder="+591 70000000" />
            </div>
          </div>

          <!-- Plan -->
          <div class="ide-field" style="max-width:200px;">
            <label>Plan</label>
            <select v-model="form.plan" class="ide-select">
              <option value="basico">Básico</option>
              <option value="profesional">Profesional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <!-- Días de atención -->
          <div class="ide-field">
            <label>Días de atención</label>
            <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;">
              <label
                v-for="d in diasOpciones"
                :key="d.value"
                class="ide-cl-dia"
                :class="{ 'ide-cl-dia--on': form.diasAtencion.includes(d.value) }"
                @click="toggleDia(d.value)"
              >{{ d.label }}</label>
            </div>
          </div>

          <!-- Horario -->
          <div class="cfg-form-row">
            <div class="ide-field">
              <label>Hora inicio atención</label>
              <input v-model="form.horaInicioAtencion" class="ide-input" type="time" />
            </div>
            <div class="ide-field">
              <label>Hora fin atención</label>
              <input v-model="form.horaFinAtencion" class="ide-input" type="time" />
            </div>
          </div>

          <!-- Servicios -->
          <div class="ide-field">
            <label>Servicios (presiona Enter para agregar)</label>
            <input
              v-model="servicioInput"
              class="ide-input"
              placeholder="Ej: Consulta médica"
              @keydown.enter.prevent="agregarServicio"
            />
            <div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:6px;">
              <span
                v-for="(s, i) in form.servicios"
                :key="i"
                class="ide-cl-tag ide-cl-tag--editable"
                @click="quitarServicio(i)"
              >{{ s }} ✕</span>
            </div>
          </div>

          <!-- Activo (solo al editar) -->
          <div v-if="editando" style="display:flex; align-items:center; gap:10px; margin-top:4px;">
            <div class="ide-toggle" :class="{ 'ide-toggle--on': form.activo }" @click="form.activo = !form.activo"><div></div></div>
            <span style="font-size:13px; color:var(--scroll);">{{ form.activo ? 'Cliente activo' : 'Cliente inactivo' }}</span>
          </div>
        </div>

        <div class="ide-cl-dialog-ft">
          <button class="ide-cl-btn-sec" @click="cerrarDialog">Cancelar</button>
          <v-btn depressed color="primary" :loading="guardando" @click="guardar" style="font-size:12px; border-radius:8px;">
            {{ editando ? 'Guardar cambios' : 'Crear cliente' }}
          </v-btn>
        </div>
      </div>
    </v-dialog>

  </div>
</template>

<script>
const DIAS = [
  { value: 'lunes',    label: 'Lun' },
  { value: 'martes',   label: 'Mar' },
  { value: 'miercoles',label: 'Mié' },
  { value: 'jueves',   label: 'Jue' },
  { value: 'viernes',  label: 'Vie' },
  { value: 'sabado',   label: 'Sáb' },
  { value: 'domingo',  label: 'Dom' },
];

const emptyForm = () => ({
  nombre: '',
  slug: '',
  correoContacto: '',
  telefono: '',
  plan: 'basico',
  diasAtencion: [],
  horaInicioAtencion: '08:00',
  horaFinAtencion: '18:00',
  servicios: [],
  activo: true,
});

const COLORS = ['#6366f1','#c96442','#22c55e','#0ea5e9','#a855f7','#f59e0b','#ef4444'];

export default {
  name: 'Clientes',
  data() {
    return {
      clientes: [],
      cargando: false,
      dialog: false,
      editando: null,   // id del cliente si estamos editando
      form: emptyForm(),
      servicioInput: '',
      guardando: false,
      diasOpciones: DIAS,
    };
  },
  async mounted() {
    await this.cargar();
  },
  methods: {
    async cargar() {
      this.cargando = true;
      try {
        this.clientes = (await this.$service.list('clientes')) || [];
      } catch (e) {
        this.$message.error('Error al cargar clientes');
      } finally {
        this.cargando = false;
      }
    },

    avatarColor(nombre) {
      const i = nombre.charCodeAt(0) % COLORS.length;
      return COLORS[i] + '33';
    },

    autoSlug() {
      if (this.editando) return;
      this.form.slug = this.form.nombre
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    },

    toggleDia(dia) {
      const idx = this.form.diasAtencion.indexOf(dia);
      if (idx >= 0) this.form.diasAtencion.splice(idx, 1);
      else this.form.diasAtencion.push(dia);
    },

    agregarServicio() {
      const s = this.servicioInput.trim();
      if (s && !this.form.servicios.includes(s)) this.form.servicios.push(s);
      this.servicioInput = '';
    },

    quitarServicio(i) {
      this.form.servicios.splice(i, 1);
    },

    abrirCrear() {
      this.editando = null;
      this.form = emptyForm();
      this.servicioInput = '';
      this.dialog = true;
    },

    abrirEditar(cl) {
      this.editando = cl.id;
      this.form = {
        nombre: cl.nombre,
        slug: cl.slug,
        correoContacto: cl.correoContacto || '',
        telefono: cl.telefono || '',
        plan: cl.plan || 'basico',
        diasAtencion: [...(cl.diasAtencion || [])],
        horaInicioAtencion: cl.horaInicioAtencion || '08:00',
        horaFinAtencion: cl.horaFinAtencion || '18:00',
        servicios: [...(cl.servicios || [])],
        activo: cl.activo !== false,
      };
      this.servicioInput = '';
      this.dialog = true;
    },

    cerrarDialog() {
      this.dialog = false;
      this.editando = null;
    },

    async guardar() {
      if (!this.form.nombre.trim() || !this.form.slug.trim()) {
        this.$message.error('Nombre y slug son obligatorios');
        return;
      }
      this.guardando = true;
      try {
        if (this.editando) {
          await this.$service.put(`clientes/${this.editando}`, this.form);
          this.$message.success('Cliente actualizado');
        } else {
          await this.$service.post('clientes', this.form);
          this.$message.success('Cliente creado');
        }
        this.cerrarDialog();
        await this.cargar();
      } catch (e) {
        this.$message.error(e?.mensaje || 'Error al guardar');
      } finally {
        this.guardando = false;
      }
    },

    confirmarEliminar(cl) {
      this.$confirm(`¿Eliminar el cliente "${cl.nombre}"? Esta acción no se puede deshacer.`, async () => {
        try {
          await this.$service.delete(`clientes`, cl.id);
          this.$message.success('Cliente eliminado');
          await this.cargar();
        } catch (e) {
          this.$message.error(e?.mensaje || 'Error al eliminar');
        }
      });
    },
  },
};
</script>

<style scoped>
.ide-clientes-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--b2);
}

.ide-cl-ico {
  width: 40px; height: 40px;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.ide-cl-grid {
  padding: 20px 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

.ide-cl-card {
  background: var(--bg-c);
  border: 1px solid var(--b2);
  border-radius: 12px;
  padding: 16px;
  transition: border-color 0.15s;
}
.ide-cl-card:hover { border-color: #6366f133; }

.ide-cl-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.ide-cl-avatar {
  width: 38px; height: 38px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 800; color: var(--t2);
  flex-shrink: 0;
}

.ide-cl-nombre {
  font-size: 14px; font-weight: 700; color: var(--t2);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ide-cl-slug {
  font-size: 11px; color: var(--t5); font-family: monospace;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.ide-cl-plan {
  font-size: 10px; font-weight: 700; padding: 2px 8px;
  border-radius: 999px; flex-shrink: 0;
}
.ide-cl-plan--basico      { background: #6366f122; color: #818cf8; }
.ide-cl-plan--profesional { background: #f59e0b22; color: #f59e0b; }
.ide-cl-plan--enterprise  { background: #22c55e22; color: #22c55e; }

.ide-cl-meta { border-top: 1px solid var(--b2); padding-top: 10px; margin-bottom: 10px; }
.ide-cl-meta-row {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: var(--t4); margin-bottom: 4px;
  min-width: 0;
}
.ide-cl-meta-txt { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }

.ide-cl-tag {
  font-size: 10px; font-weight: 600;
  background: var(--bg-e); color: var(--t4);
  border: 1px solid var(--b1);
  padding: 2px 7px; border-radius: 999px;
}
.ide-cl-tag--more { color: var(--t5); }
.ide-cl-tag--editable { cursor: pointer; color: #818cf8; background: #6366f122; border-color: #6366f133; }
.ide-cl-tag--editable:hover { background: #6366f144; }

.ide-cl-actions {
  display: flex; align-items: center; justify-content: space-between;
  border-top: 1px solid var(--b2); padding-top: 10px;
}

.ide-cl-status {
  font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
}
.ide-cl-status--on  { background: #22c55e22; color: #22c55e; }
.ide-cl-status--off { background: #ef444422; color: #ef4444; }

.ide-cl-btn {
  width: 28px; height: 28px; border-radius: 6px;
  background: var(--bg-e); border: 1px solid var(--b1);
  color: var(--t4); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.ide-cl-btn:hover { background: var(--bg-c); color: var(--t3); }
.ide-cl-btn--danger:hover { background: #ef444411; border-color: #ef444433; color: #ef4444; }

.ide-cl-empty {
  grid-column: 1/-1;
  text-align: center;
  padding: 60px 20px;
  color: var(--t5);
}

/* Dialog */
.ide-cl-dialog {
  background: var(--bg-c);
  border: 1px solid var(--b3);
  border-radius: 14px;
  overflow: hidden;
}
.ide-cl-dialog-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--b2);
}
.ide-cl-dialog-close {
  background: none; border: none; color: var(--t5);
  cursor: pointer; font-size: 14px; padding: 4px 6px;
  border-radius: 4px;
}
.ide-cl-dialog-close:hover { color: #ef4444; }
.ide-cl-dialog-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; max-height: 60vh; overflow-y: auto; }
.ide-cl-dialog-ft {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--b2);
}

.ide-cl-btn-sec {
  padding: 7px 16px; border-radius: 8px;
  background: none; border: 1px solid var(--b3);
  color: var(--t4); font-size: 12px; font-weight: 600;
  cursor: pointer; font-family: inherit;
}
.ide-cl-btn-sec:hover { border-color: var(--t5); color: var(--t3); }

.ide-cl-dia {
  padding: 4px 10px; border-radius: 6px;
  background: var(--bg-e); border: 1px solid var(--b1);
  font-size: 11px; font-weight: 600; color: var(--t4);
  cursor: pointer; user-select: none; transition: all 0.12s;
}
.ide-cl-dia--on { background: #6366f122; border-color: #6366f144; color: #818cf8; }

/* Reuse existing form classes */
.cfg-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
</style>
