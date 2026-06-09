<template>
  <div class="cp-root">

    <!-- ══ NAVEGACIÓN PRINCIPAL ══ -->
    <div class="cp-nav">
      <button :class="['cp-nav-tab', mainTab==='catalogo' ? 'cp-nav-tab--active' : '']" @click="mainTab='catalogo'">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        Catálogo
      </button>
      <button :class="['cp-nav-tab', mainTab==='unidades' ? 'cp-nav-tab--active' : '']" @click="mainTab='unidades'">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><rect x="2" y="3" width="7" height="7" rx="1"/><rect x="9" y="3" width="7" height="7" rx="1"/><rect x="2" y="10" width="7" height="7" rx="1"/><rect x="9" y="10" width="7" height="7" rx="1"/></svg>
        Unidades de Medida
      </button>
    </div>

    <!-- ══ TAB: CATÁLOGO ══ -->
    <div v-show="mainTab==='catalogo'" class="cp-tab-content">
    <!-- ══ COLUMNAS DRILL-DOWN ══ -->
    <div class="cp-columns">

      <!-- ── Col 1: Categorías ── -->
      <div class="cp-col">
        <div class="cp-col-header">
          <div>
            <div class="cp-col-title">Categorías</div>
            <div class="cp-col-count">{{ categorias.length }} registros</div>
          </div>
          <button class="cp-add-btn" @click="abrirCatDialog()">+</button>
        </div>
        <input v-model="qCat" class="cp-search" placeholder="Buscar..." />
        <div class="cp-list">
          <div v-if="loadingCat" class="cp-loading"><div class="ct-spinner"></div></div>
          <div v-else-if="!categoriasFiltered.length" class="cp-empty">Sin categorías</div>
          <div
            v-else
            v-for="cat in categoriasFiltered" :key="cat.id"
            :class="['cp-item', selectedCat && selectedCat.id === cat.id ? 'cp-item--active' : '']"
            @click="seleccionarCat(cat)"
          >
            <div class="cp-dot" :style="`background:${cat.color || '#6366f1'}`"></div>
            <div class="cp-item-name">{{ cat.nombre }}</div>
            <div class="cp-item-btns">
              <button class="cp-icon-btn" title="Editar" @click.stop="abrirCatDialog(cat)">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="cp-icon-btn cp-icon-btn--danger" title="Eliminar" @click.stop="eliminarCat(cat)">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
            <svg v-if="selectedCat && selectedCat.id === cat.id" class="cp-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>
      </div>

      <!-- ── Col 2: Subcategorías ── -->
      <div class="cp-col" v-if="selectedCat">
        <div class="cp-col-header">
          <div>
            <div class="cp-col-title">Subcategorías</div>
            <div class="cp-col-count" style="color:#6366f1;">{{ selectedCat.nombre }}</div>
          </div>
          <button class="cp-add-btn" @click="abrirSubDialog()">+</button>
        </div>
        <input v-model="qSub" class="cp-search" placeholder="Buscar..." />
        <div class="cp-list">
          <div v-if="loadingSub" class="cp-loading"><div class="ct-spinner"></div></div>
          <div v-else-if="!subcategoriasFiltered.length" class="cp-empty">Sin subcategorías</div>
          <div
            v-else
            v-for="sub in subcategoriasFiltered" :key="sub.id"
            :class="['cp-item', selectedSub && selectedSub.id === sub.id ? 'cp-item--active' : '']"
            @click="seleccionarSub(sub)"
          >
            <div class="cp-dot cp-dot--sub"></div>
            <div class="cp-item-name">{{ sub.nombre }}</div>
            <div class="cp-item-btns">
              <button class="cp-icon-btn" title="Editar" @click.stop="abrirSubDialog(sub)">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="cp-icon-btn cp-icon-btn--danger" title="Eliminar" @click.stop="eliminarSub(sub)">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
            <svg v-if="selectedSub && selectedSub.id === sub.id" class="cp-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>
      </div>

      <!-- ── Col 3: Productos ── -->
      <div class="cp-col cp-col--wide" v-if="selectedSub">
        <div class="cp-col-header">
          <div>
            <div class="cp-col-title">Productos</div>
            <div class="cp-col-count" style="color:#6366f1;">{{ selectedSub.nombre }}</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <button class="cp-icon-btn cp-icon-btn--price" title="Exportar Excel" @click="exportarProductos">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button class="cp-icon-btn" title="Importar Excel" :disabled="importando" @click="triggerImport">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </button>
            <input ref="fileInput" type="file" accept=".xlsx,.xls" style="display:none" @change="onFileSelected" />
            <button class="cp-add-btn" @click="abrirProdDialog()">+ Producto</button>
          </div>
        </div>
        <input v-model="qProd" class="cp-search" placeholder="Buscar por nombre o código..." />
        <div class="cp-list">
          <div v-if="loadingProd" class="cp-loading"><div class="ct-spinner"></div></div>
          <div v-else-if="!productosFiltered.length" class="cp-empty">Sin productos en esta subcategoría</div>
          <div v-else v-for="prod in productosFiltered" :key="prod.id" class="cp-prod-row">
            <div class="cp-prod-main">
              <div class="cp-prod-name">{{ prod.nombre }}</div>
              <div class="cp-prod-codes">
                <span v-if="prod.codigoTienda" class="cp-code cp-code--tienda">T: {{ prod.codigoTienda }}</span>
                <span v-if="prod.codigoBarras" class="cp-code cp-code--barras">B: {{ prod.codigoBarras }}</span>
                <span v-if="prod.codigoProveedor" class="cp-code cp-code--prov">P: {{ prod.codigoProveedor }}</span>
                <span v-if="prod.unidadMedida" class="cp-code">{{ prod.unidadMedida }}</span>
              </div>
            </div>
            <div style="display:flex;gap:4px;align-items:center;">
              <span class="ct-badge" :class="prod.activo === false ? 'ct-badge--off' : 'ct-badge--on'" style="font-size:9px;">
                {{ prod.activo === false ? 'Inactivo' : 'Activo' }}
              </span>
              <button class="cp-icon-btn cp-icon-btn--price" title="Precios" @click="verPrecios(prod)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              </button>
              <button class="cp-icon-btn" title="Editar" @click="abrirProdDialog(prod)">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="cp-icon-btn cp-icon-btn--danger" title="Eliminar" @click="eliminarProd(prod)">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Placeholder cuando no hay selección -->
      <div v-if="!selectedCat" class="cp-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        <p>Selecciona una categoría para ver las subcategorías</p>
      </div>
      <div v-else-if="!selectedSub" class="cp-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        <p>Selecciona una subcategoría para ver los productos</p>
      </div>

    </div>
    </div><!-- /cp-tab-content catalogo -->

    <!-- ══ TAB: UNIDADES ══ -->
    <div v-show="mainTab==='unidades'" class="cp-tab-content">
      <div class="cp-uni-layout" style="max-width:560px;">

        <!-- Lista de unidades -->
        <div class="cp-uni-list-col" style="width:100%;">
          <div class="cp-col-header" style="border-radius:14px 14px 0 0;">
            <div>
              <div class="cp-col-title">Unidades de Medida</div>
              <div class="cp-col-count">{{ unidades.length }} registros</div>
            </div>
            <button class="cp-add-btn" @click="abrirUnidadForm()">+ Nueva</button>
          </div>
          <input v-model="qUni" class="cp-search" placeholder="Buscar unidad..." style="margin:8px 10px 4px;" />
          <div class="cp-list" style="flex:1;overflow-y:auto;padding:4px 8px 12px;">
            <div v-if="!unidadesFiltered.length" class="cp-empty">Sin unidades</div>
            <!-- Bases -->
            <div class="cp-uni-group-label">Unidades base</div>
            <div v-for="u in unidadesFiltered.filter(u=>u.esBase)" :key="u.id"
              :class="['cp-uni-row', editandoUnidad && editandoUnidad.id===u.id ? 'cp-uni-row--active' : '']"
              @click="abrirUnidadForm(u)">
              <div class="cp-dot" style="background:#6366f1;flex-shrink:0;"></div>
              <div class="cp-uni-info">
                <span class="cp-uni-name">{{ u.nombre }}</span>
                <span v-if="u.abreviacion" class="cp-uni-abrev">{{ u.abreviacion }}</span>
              </div>
              <span :class="['ct-badge', u.activo===false ? 'ct-badge--off' : 'ct-badge--on']" style="font-size:9px;">
                {{ u.activo===false ? 'Inactivo' : 'Activo' }}
              </span>
              <button class="cp-icon-btn cp-icon-btn--danger" style="flex-shrink:0;" title="Eliminar" @click.stop="eliminarUnidad(u)">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
            <!-- Empaques -->
            <div class="cp-uni-group-label" style="margin-top:10px;">Empaques / Presentaciones</div>
            <div v-if="!unidadesFiltered.filter(u=>!u.esBase).length" class="cp-empty" style="padding:8px 0;">Sin empaques</div>
            <div v-for="u in unidadesFiltered.filter(u=>!u.esBase)" :key="u.id"
              :class="['cp-uni-row', editandoUnidad && editandoUnidad.id===u.id ? 'cp-uni-row--active' : '']"
              @click="abrirUnidadForm(u)">
              <div class="cp-dot cp-dot--sub" style="flex-shrink:0;"></div>
              <div class="cp-uni-info">
                <span class="cp-uni-name">{{ u.nombre }}</span>
                <span v-if="u.abreviacion" class="cp-uni-abrev">{{ u.abreviacion }}</span>
                <span class="cp-uni-factor">×{{ u.factorConversion }} {{ u.unidadBaseNombre }}</span>
              </div>
              <span :class="['ct-badge', u.activo===false ? 'ct-badge--off' : 'ct-badge--on']" style="font-size:9px;">
                {{ u.activo===false ? 'Inactivo' : 'Activo' }}
              </span>
              <button class="cp-icon-btn cp-icon-btn--danger" style="flex-shrink:0;" title="Eliminar" @click.stop="eliminarUnidad(u)">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </div>
        </div>

        </div>
    </div><!-- /cp-tab-content unidades -->

    <!-- ══ MODAL UNIDAD DE MEDIDA ══ -->
    <transition name="modal-fade">
      <div v-if="unidadDialog" class="ct-modal-backdrop" @click.self="unidadDialog = false">
        <div class="ct-modal" style="max-width:440px;">
          <div class="ct-modal-header">
            <span>{{ editandoUnidad ? 'Editar Unidad' : 'Nueva Unidad' }}</span>
            <button class="ct-modal-close" @click="unidadDialog = false">✕</button>
          </div>
          <div class="ct-modal-body">
            <div class="ct-form-grid">
              <div class="ide-field">
                <label>Nombre *</label>
                <input v-model="unidadForm.nombre" class="ide-input" placeholder="Ej: Unidad, Caja, Litro..." />
              </div>
              <div class="ide-field">
                <label>Abreviación</label>
                <input v-model="unidadForm.abreviacion" class="ide-input" placeholder="Ej: Un, Cj, Lt" />
              </div>
              <div class="ide-field">
                <label>Estado</label>
                <select v-model="unidadForm.estado" class="ide-select">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div class="ide-field ct-form-full" style="flex-direction:row;align-items:center;gap:10px;padding-top:4px;">
                <input id="chk-base2" v-model="unidadForm.esBase" type="checkbox" style="width:15px;height:15px;cursor:pointer;" />
                <label for="chk-base2" style="cursor:pointer;font-size:12px;font-weight:600;color:#94a3b8;margin:0;">
                  Es unidad base (mínima, no contiene otras)
                </label>
              </div>
              <template v-if="!unidadForm.esBase">
                <div class="ide-field">
                  <label>Unidad base que contiene *</label>
                  <select v-model="unidadForm.unidadBaseId" class="ide-select">
                    <option value="">Seleccionar...</option>
                    <option v-for="u in unidades.filter(u=>u.esBase)" :key="u.id" :value="u.id">{{ u.nombre }}</option>
                  </select>
                </div>
                <div class="ide-field">
                  <label>Cantidad que contiene *</label>
                  <input v-model.number="unidadForm.factorConversion" class="ide-input" type="number" min="1" step="1" placeholder="Ej: 12" />
                </div>
              </template>
            </div>
            <div v-if="unidades.length === 0 && !editandoUnidad" class="cp-uni-hint" style="margin-top:12px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p>Primero crea las <strong>unidades base</strong> (Unidad, Litro, Metro...), luego podrás crear empaques que las contienen (Caja ×12, Balde ×20...).</p>
            </div>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="unidadDialog = false">Cancelar</button>
            <button class="ct-btn-ok" :disabled="saving" @click="guardarUnidad">
              {{ saving ? 'Guardando...' : (editandoUnidad ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ MODAL CATEGORÍA ══ -->
    <transition name="modal-fade">
      <div v-if="catDialog" class="ct-modal-backdrop" @click.self="catDialog = false">
        <div class="ct-modal" style="max-width:420px;">
          <div class="ct-modal-header">
            <span>{{ editandoCat ? 'Editar Categoría' : 'Nueva Categoría' }}</span>
            <button class="ct-modal-close" @click="catDialog = false">✕</button>
          </div>
          <div class="ct-modal-body">
            <div class="ct-form-grid">
              <div class="ide-field ct-form-full">
                <label>Nombre *</label>
                <input v-model="catForm.nombre" class="ide-input" placeholder="Ej: Alimentos, Limpieza..." />
              </div>
              <div class="ide-field">
                <label>Color</label>
                <input v-model="catForm.color" type="color" class="ide-input" style="height:38px;padding:2px 6px;cursor:pointer;" />
              </div>
              <div class="ide-field">
                <label>Estado</label>
                <select v-model="catForm.estado" class="ide-select">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div class="ide-field ct-form-full">
                <label>Descripción</label>
                <textarea v-model="catForm.descripcion" class="ide-textarea" rows="2" placeholder="Descripción opcional..."></textarea>
              </div>
            </div>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="catDialog = false">Cancelar</button>
            <button class="ct-btn-ok" :disabled="saving" @click="guardarCat">{{ saving ? 'Guardando...' : (editandoCat ? 'Actualizar' : 'Crear') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ MODAL SUBCATEGORÍA ══ -->
    <transition name="modal-fade">
      <div v-if="subDialog" class="ct-modal-backdrop" @click.self="subDialog = false">
        <div class="ct-modal" style="max-width:420px;">
          <div class="ct-modal-header">
            <span>{{ editandoSub ? 'Editar Subcategoría' : 'Nueva Subcategoría' }}</span>
            <button class="ct-modal-close" @click="subDialog = false">✕</button>
          </div>
          <div class="ct-modal-body">
            <div class="ct-form-grid">
              <div class="ide-field ct-form-full">
                <label>Nombre *</label>
                <input v-model="subForm.nombre" class="ide-input" placeholder="Nombre de la subcategoría" />
              </div>
              <div class="ide-field ct-form-full">
                <label>Descripción</label>
                <textarea v-model="subForm.descripcion" class="ide-textarea" rows="2" placeholder="Descripción opcional..."></textarea>
              </div>
            </div>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="subDialog = false">Cancelar</button>
            <button class="ct-btn-ok" :disabled="saving" @click="guardarSub">{{ saving ? 'Guardando...' : (editandoSub ? 'Actualizar' : 'Crear') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ MODAL PRODUCTO ══ -->
    <transition name="modal-fade">
      <div v-if="prodDialog" class="ct-modal-backdrop" @click.self="prodDialog = false">
        <div class="ct-modal">
          <div class="ct-modal-header">
            <span>{{ editandoProd ? 'Editar Producto' : 'Nuevo Producto' }}</span>
            <button class="ct-modal-close" @click="prodDialog = false">✕</button>
          </div>
          <div class="ct-modal-body">
            <div class="ct-form-grid">
              <div class="ide-field ct-form-full">
                <label>Nombre *</label>
                <input v-model="prodForm.nombre" class="ide-input" placeholder="Nombre del producto" />
              </div>
              <div class="ide-field">
                <label>Código de Tienda</label>
                <input v-model="prodForm.codigoTienda" class="ide-input" placeholder="Código interno" />
              </div>
              <div class="ide-field">
                <label>Código de Barras</label>
                <input v-model="prodForm.codigoBarras" class="ide-input" placeholder="EAN / UPC" />
              </div>
              <div class="ide-field">
                <label>Código de Proveedor</label>
                <input v-model="prodForm.codigoProveedor" class="ide-input" placeholder="Código del proveedor" />
              </div>
              <div class="ide-field">
                <label>Unidad base
                  <span style="float:right;font-size:10px;color:#6366f1;cursor:pointer;" @click="prodDialog=false; mainTab='unidades'; abrirUnidadForm()">+ Nueva unidad</span>
                </label>
                <select v-model="prodForm.unidadBaseId" class="ide-select">
                  <option value="">Sin unidad</option>
                  <optgroup label="Unidades base">
                    <option v-for="u in unidades.filter(u=>u.esBase)" :key="u.id" :value="u.id">{{ u.nombre }}{{ u.abreviacion ? ' ('+u.abreviacion+')' : '' }}</option>
                  </optgroup>
                  <optgroup label="Empaques / Presentaciones">
                    <option v-for="u in unidades.filter(u=>!u.esBase)" :key="u.id" :value="u.id">{{ u.nombre }}{{ u.abreviacion ? ' ('+u.abreviacion+')' : '' }}{{ u.factorConversion > 1 ? ' ×'+u.factorConversion : '' }}</option>
                  </optgroup>
                </select>
              </div>
              <div class="ide-field">
                <label>Estado</label>
                <select v-model="prodForm.estado" class="ide-select">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div class="ide-field ct-form-full">
                <label>Descripción</label>
                <textarea v-model="prodForm.descripcion" class="ide-textarea" rows="2" placeholder="Descripción del producto..."></textarea>
              </div>
              <!-- Lotes -->
              <div class="ide-field ct-form-full" style="border-top:1px solid #1e3a5f44;padding-top:10px;margin-top:2px;">
                <label style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Control de lotes / trazabilidad</label>
              </div>
              <div class="ide-field" style="display:flex;align-items:center;gap:10px;">
                <input id="chk-lote" v-model="prodForm.requiereLote" type="checkbox" style="width:15px;height:15px;cursor:pointer;" />
                <label for="chk-lote" style="cursor:pointer;margin:0;">Requiere control de lotes</label>
              </div>
              <div v-if="prodForm.requiereLote" class="ide-field">
                <label>Método de despacho</label>
                <select v-model="prodForm.metodoPicking" class="ide-select">
                  <option value="FEFO">FEFO — Primero en vencer, primero en salir</option>
                  <option value="FIFO">FIFO — Primero en entrar, primero en salir</option>
                  <option value="LIFO">LIFO — Último en entrar, primero en salir</option>
                </select>
              </div>
              <div v-if="prodForm.requiereLote" class="ide-field">
                <label>Alerta vencimiento (días previos)</label>
                <input v-model.number="prodForm.alertaVencimientoDias" class="ide-input" type="number" min="0" max="365" placeholder="30" />
              </div>
            </div>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="prodDialog = false">Cancelar</button>
            <button class="ct-btn-ok" :disabled="saving" @click="guardarProd">{{ saving ? 'Guardando...' : (editandoProd ? 'Actualizar' : 'Crear Producto') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ MODAL PRECIOS ══ -->
    <transition name="modal-fade">
      <div v-if="preciosModal" class="ct-modal-backdrop" @click.self="preciosModal = false">
        <div class="ct-modal" style="max-width:640px;">
          <div class="ct-modal-header">
            <div>
              <div style="font-weight:800;color:#f1f5f9;">{{ selectedProd && selectedProd.nombre }}</div>
              <div style="font-size:11px;color:#64748b;">Gestión de precios</div>
            </div>
            <button class="ct-modal-close" @click="preciosModal = false">✕</button>
          </div>

          <!-- Tabs -->
          <div class="cp-tabs">
            <button :class="['cp-tab', preciosTab==='precios'?'cp-tab--active':'']" @click="preciosTab='precios'">Precios</button>
            <button :class="['cp-tab', preciosTab==='promo'?'cp-tab--active':'']" @click="preciosTab='promo'">Promociones</button>
          </div>

          <div class="ct-modal-body" style="max-height:60vh;overflow-y:auto;">
            <div v-if="loadingPrecios" style="display:flex;justify-content:center;padding:32px;"><div class="ct-spinner"></div></div>

            <!-- ── Tab Precios ── -->
            <template v-else-if="preciosTab==='precios'">
              <!-- Escalas activas por tipo -->
              <div class="cp-price-types">
                <div v-for="tipo in ['COSTO','VENTA','MAYORISTA']" :key="tipo" class="cp-price-type-card">
                  <div class="cp-price-type-label">{{ tipo }}</div>
                  <template v-if="escalaActivaPorTipo(tipo)">
                    <div v-for="t in escalaActivaPorTipo(tipo).tiers" :key="t.id" style="display:flex;justify-content:space-between;align-items:center;margin-top:3px;">
                      <span style="font-size:10px;color:#64748b;">
                        {{ t.cantidadMin }}{{ t.cantidadMax ? '–'+t.cantidadMax : '+' }} uds
                      </span>
                      <span style="font-size:13px;font-weight:800;color:#e2e8f0;">
                        {{ escalaActivaPorTipo(tipo).moneda }} {{ Number(t.precio).toFixed(2) }}
                      </span>
                    </div>
                    <div class="cp-price-date">desde {{ escalaActivaPorTipo(tipo).fechaVigencia || '—' }}</div>
                  </template>
                  <div v-else class="cp-price-empty">Sin precio</div>
                  <button class="cp-set-price-btn" @click="abrirFormPrecio(tipo, null)">
                    {{ escalaActivaPorTipo(tipo) ? 'Actualizar escala' : 'Establecer precio' }}
                  </button>
                </div>

                <!-- Tarjeta "Con Factura" (display-only) -->
                <div class="cp-price-type-card cp-price-type-card--factura">
                  <div style="display:flex;align-items:center;justify-content:space-between;">
                    <div class="cp-price-type-label" style="color:#f59e0b;">CON FACTURA</div>
                    <span v-if="selectedProd && selectedProd.porcentajeFactura != null" style="font-size:10px;font-weight:700;color:#f59e0b;background:#f59e0b22;border:1px solid #f59e0b33;padding:1px 6px;border-radius:4px;">
                      +{{ selectedProd.porcentajeFactura }}%
                    </span>
                  </div>
                  <template v-if="escalaActivaPorTipo('VENTA') && selectedProd && selectedProd.porcentajeFactura != null">
                    <div v-for="t in escalaActivaPorTipo('VENTA').tiers" :key="'f'+t.id" style="display:flex;justify-content:space-between;align-items:center;margin-top:3px;">
                      <span style="font-size:10px;color:#64748b;">
                        {{ t.cantidadMin }}{{ t.cantidadMax ? '–'+t.cantidadMax : '+' }} uds
                      </span>
                      <span style="font-size:13px;font-weight:800;color:#fbbf24;">
                        {{ escalaActivaPorTipo('VENTA').moneda }} {{ (Number(t.precio) * (1 + Number(selectedProd.porcentajeFactura) / 100)).toFixed(2) }}
                      </span>
                    </div>
                    <div class="cp-price-date">+{{ selectedProd.porcentajeFactura }}% sobre Venta</div>
                  </template>
                  <div v-else-if="!escalaActivaPorTipo('VENTA')" class="cp-price-empty">Configura primero el precio de Venta</div>
                  <div v-else class="cp-price-empty">Sin % configurado</div>
                  <button class="cp-set-price-btn" style="border-color:#f59e0b33;color:#f59e0b;background:#f59e0b11;" @click="abrirFormPrecio('VENTA', null)">
                    {{ selectedProd && selectedProd.porcentajeFactura != null ? 'Actualizar %' : 'Configurar %' }}
                  </button>
                </div>
              </div>

              <!-- Form escala de precios -->
              <transition name="modal-fade">
                <div v-if="showPrecioForm" class="cp-price-form">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                    <span style="font-size:12px;font-weight:700;color:#94a3b8;">Escala de precios — {{ precioForm.tipo }}</span>
                  </div>
                  <div class="ct-form-grid" style="margin-bottom:12px;">
                    <div class="ide-field">
                      <label>Unidad (opcional)</label>
                      <select v-model="precioForm.unidadId" class="ide-select">
                        <option value="">Unidad base</option>
                        <option v-for="u in unidades" :key="u.id" :value="u.id">{{ u.nombre }}</option>
                      </select>
                    </div>
                    <div class="ide-field">
                      <label>Moneda</label>
                      <select v-model="precioForm.moneda" class="ide-select">
                        <option value="BOB">BOB</option><option value="USD">USD</option>
                      </select>
                    </div>
                    <div class="ide-field">
                      <label>Vigente desde</label>
                      <input v-model="precioForm.fechaVigencia" class="ide-input" type="date" />
                    </div>
                    <div class="ide-field ct-form-full">
                      <label>Notas</label>
                      <input v-model="precioForm.notas" class="ide-input" placeholder="Motivo del cambio..." />
                    </div>
                  </div>
                  <!-- % Con Factura (solo para tipos que no son COSTO) -->
                  <div v-if="precioForm.tipo !== 'COSTO'" style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding:10px 12px;background:#1a2538;border:1px solid #f59e0b33;border-radius:8px;">
                    <span style="font-size:11px;font-weight:700;color:#f59e0b;white-space:nowrap;">% Con Factura</span>
                    <input
                      v-model="precioForm.porcentajeFactura"
                      class="ide-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      style="width:80px;padding:4px 8px;font-size:12px;"
                    />
                    <span style="font-size:11px;color:#94a3b8;">%</span>
                    <span style="font-size:11px;color:#64748b;margin-left:4px;">— El precio con factura se calcula automáticamente</span>
                  </div>

                  <!-- Tiers de escala -->
                  <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Tramos de cantidad</div>
                  <div :class="['cp-tier-header', precioForm.tipo !== 'COSTO' ? 'cp-tier-header--factura' : '']">
                    <span>Desde</span><span>Hasta (vacío = sin límite)</span><span>Precio</span>
                    <span v-if="precioForm.tipo !== 'COSTO'" style="color:#f59e0b;">C/Factura</span>
                    <span></span>
                  </div>
                  <div v-for="(tier, idx) in precioForm.escala" :key="idx" :class="['cp-tier-row', precioForm.tipo !== 'COSTO' ? 'cp-tier-row--factura' : '']">
                    <input v-model.number="tier.cantidadMin" class="ide-input" type="number" min="1" placeholder="1" />
                    <input v-model.number="tier.cantidadMax" class="ide-input" type="number" min="1" placeholder="Sin límite" />
                    <input v-model="tier.precio" class="ide-input" type="number" step="0.01" min="0" placeholder="0.00" />
                    <div v-if="precioForm.tipo !== 'COSTO'" class="ide-input cp-factura-computed">
                      {{ tier.precio !== '' && precioForm.porcentajeFactura !== '' ? (Number(tier.precio) * (1 + Number(precioForm.porcentajeFactura) / 100)).toFixed(2) : '—' }}
                    </div>
                    <button class="cp-icon-btn cp-icon-btn--danger" :disabled="precioForm.escala.length===1" @click="quitarTier(idx)">✕</button>
                  </div>
                  <button class="cp-set-price-btn" style="margin-top:6px;" @click="agregarTier">+ Añadir tramo</button>
                  <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
                    <button class="ct-btn-cancel" @click="showPrecioForm = false">Cancelar</button>
                    <button class="ct-btn-ok" :disabled="saving" @click="guardarPrecio">{{ saving ? 'Guardando...' : 'Guardar escala' }}</button>
                  </div>
                </div>
              </transition>

              <!-- Historial de escalas -->
              <div style="margin-top:18px;">
                <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px;">Historial</div>
                <div v-if="!historico.length" style="color:#334155;font-size:12px;font-style:italic;">Sin historial</div>
                <div v-else v-for="p in historico" :key="p.id" class="cp-hist-row">
                  <span class="cp-hist-tipo">{{ p.tipo }}</span>
                  <span style="font-size:10px;color:#475569;">{{ p.cantidadMin }}–{{ p.cantidadMax || '∞' }}</span>
                  <span class="cp-hist-precio">{{ p.moneda }} {{ Number(p.precio).toFixed(2) }}</span>
                  <span class="cp-hist-fecha">{{ p.fechaVigencia || '—' }} → {{ p.fechaFin || '—' }}</span>
                  <span class="cp-hist-badge cp-hist-badge--off">Histórico</span>
                </div>
              </div>
            </template>

            <!-- ── Tab Promociones ── -->
            <template v-else-if="preciosTab==='promo'">
              <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
                <button class="ct-new-btn" style="font-size:12px;padding:6px 14px;" @click="abrirPromoDialog()">+ Nueva Promoción</button>
              </div>
              <div v-if="!promociones.length" style="color:#334155;font-size:12px;font-style:italic;text-align:center;padding:24px 0;">Sin promociones configuradas</div>
              <div v-else v-for="promo in promociones" :key="promo.id" class="cp-promo-card">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;">
                  <div>
                    <div style="font-weight:700;font-size:13px;color:#e2e8f0;">{{ promo.nombre }}</div>
                    <div style="font-size:12px;color:#6366f1;font-weight:700;margin-top:2px;">{{ promo.moneda }} {{ Number(promo.precio).toFixed(2) }}</div>
                    <div style="font-size:11px;color:#64748b;margin-top:3px;">
                      {{ promo.fechaInicio || '—' }} → {{ promo.fechaFin || '—' }}
                    </div>
                    <div v-if="promo.notas" style="font-size:11px;color:#475569;font-style:italic;margin-top:2px;">{{ promo.notas }}</div>
                  </div>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <button
                      :class="['cp-toggle-btn', promo.habilitado ? 'cp-toggle-btn--on' : 'cp-toggle-btn--off']"
                      :title="promo.habilitado ? 'Deshabilitar' : 'Habilitar'"
                      @click="togglePromo(promo)"
                    >{{ promo.habilitado ? 'ON' : 'OFF' }}</button>
                    <button class="cp-icon-btn" title="Editar" @click="abrirPromoDialog(promo)">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="cp-icon-btn cp-icon-btn--danger" title="Eliminar" @click="eliminarPromo(promo)">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ MODAL PROMOCIÓN ══ -->
    <transition name="modal-fade">
      <div v-if="promoDialog" class="ct-modal-backdrop" style="z-index:310;" @click.self="promoDialog = false">
        <div class="ct-modal" style="max-width:480px;">
          <div class="ct-modal-header">
            <span>{{ editandoPromo ? 'Editar Promoción' : 'Nueva Promoción' }}</span>
            <button class="ct-modal-close" @click="promoDialog = false">✕</button>
          </div>
          <div class="ct-modal-body">
            <div class="ct-form-grid">
              <div class="ide-field ct-form-full">
                <label>Nombre *</label>
                <input v-model="promoForm.nombre" class="ide-input" placeholder="Ej: Black Friday, Promo Verano..." />
              </div>
              <div class="ide-field">
                <label>Precio promocional *</label>
                <input v-model="promoForm.precio" class="ide-input" type="number" step="0.01" min="0" placeholder="0.00" />
              </div>
              <div class="ide-field">
                <label>Moneda</label>
                <select v-model="promoForm.moneda" class="ide-select">
                  <option value="BOB">BOB</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div class="ide-field">
                <label>Válido desde</label>
                <input v-model="promoForm.fechaInicio" class="ide-input" type="date" />
              </div>
              <div class="ide-field">
                <label>Válido hasta</label>
                <input v-model="promoForm.fechaFin" class="ide-input" type="date" />
              </div>
              <div class="ide-field ct-form-full" style="flex-direction:row;align-items:center;gap:10px;padding-top:6px;">
                <input id="chk-hab" v-model="promoForm.habilitado" type="checkbox" style="width:15px;height:15px;cursor:pointer;" />
                <label for="chk-hab" style="cursor:pointer;font-size:12px;font-weight:600;color:#94a3b8;margin:0;">Habilitada (activa ahora)</label>
              </div>
              <div class="ide-field ct-form-full">
                <label>Notas</label>
                <textarea v-model="promoForm.notas" class="ide-textarea" rows="2" placeholder="Descripción de la promoción..."></textarea>
              </div>
            </div>
          </div>
          <div class="ct-modal-footer">
            <button class="ct-btn-cancel" @click="promoDialog = false">Cancelar</button>
            <button class="ct-btn-ok" :disabled="saving" @click="guardarPromo">{{ saving ? 'Guardando...' : (editandoPromo ? 'Actualizar' : 'Crear Promoción') }}</button>
          </div>
        </div>
      </div>
    </transition>


  </div>
</template>

<script>
const emptyCatForm    = () => ({ nombre: '', color: '#6366f1', descripcion: '', estado: 'activo' })
const emptySubForm    = () => ({ nombre: '', descripcion: '', estado: 'activo' })
const emptyProdForm   = () => ({ nombre: '', codigoTienda: '', codigoBarras: '', codigoProveedor: '', unidadBaseId: '', descripcion: '', estado: 'activo', requiereLote: false, metodoPicking: 'FEFO', alertaVencimientoDias: 30 })
const emptyPrecioForm = () => ({
  tipo: 'VENTA', unidadId: '', moneda: 'BOB',
  fechaVigencia: new Date().toISOString().split('T')[0], notas: '',
  escala: [{ cantidadMin: 1, cantidadMax: null, precio: '' }],
  porcentajeFactura: '',
})
const emptyPromoForm  = () => ({ nombre: '', precio: '', moneda: 'BOB', fechaInicio: '', fechaFin: '', habilitado: true, notas: '' })
const emptyUnidadForm = () => ({ nombre: '', abreviacion: '', esBase: true, unidadBaseId: '', factorConversion: 1, estado: 'activo' })

export default {
  name: 'CatalogoProductos',
  data: () => ({
    // Navegación principal
    mainTab: 'catalogo',
    // Categorías
    categorias: [], loadingCat: false, qCat: '',
    selectedCat: null,
    catDialog: false, editandoCat: null, catForm: emptyCatForm(),
    // Subcategorías
    subcategorias: [], loadingSub: false, qSub: '',
    selectedSub: null,
    subDialog: false, editandoSub: null, subForm: emptySubForm(),
    // Productos
    productos: [], loadingProd: false, qProd: '',
    prodDialog: false, editandoProd: null, prodForm: emptyProdForm(),
    // Unidades
    unidades: [], qUni: '', editandoUnidad: null, unidadForm: emptyUnidadForm(),
    unidadDialog: false,
    // Precios
    preciosModal: false, selectedProd: null, preciosTab: 'precios',
    escalasActivas: [], historico: [], promociones: [], loadingPrecios: false,
    showPrecioForm: false, precioForm: emptyPrecioForm(),
    promoDialog: false, editandoPromo: null, promoForm: emptyPromoForm(),
    // Import/Export
    importando: false, resultadoImport: null,
    // Shared
    saving: false,
  }),
  computed: {
    categoriasFiltered() {
      if (!this.qCat.trim()) return this.categorias
      const q = this.qCat.toLowerCase()
      return this.categorias.filter(c => c.nombre.toLowerCase().includes(q))
    },
    subcategoriasFiltered() {
      if (!this.qSub.trim()) return this.subcategorias
      const q = this.qSub.toLowerCase()
      return this.subcategorias.filter(s => s.nombre.toLowerCase().includes(q))
    },
    productosFiltered() {
      if (!this.qProd.trim()) return this.productos
      const q = this.qProd.toLowerCase()
      return this.productos.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        (p.codigoTienda && p.codigoTienda.toLowerCase().includes(q)) ||
        (p.codigoBarras && p.codigoBarras.toLowerCase().includes(q)) ||
        (p.codigoProveedor && p.codigoProveedor.toLowerCase().includes(q))
      )
    },
    unidadesFiltered() {
      if (!this.qUni.trim()) return this.unidades
      const q = this.qUni.toLowerCase()
      return this.unidades.filter(u => u.nombre.toLowerCase().includes(q) || (u.abreviacion && u.abreviacion.toLowerCase().includes(q)))
    },
  },
  created() {
    this.cargarCategorias()
    this.cargarUnidades()
  },
  methods: {

    // ── Categorías ──────────────────────────────────────────────────────────────

    async cargarCategorias() {
      this.loadingCat = true
      try { this.categorias = await this.$service.list('categorias-producto') || [] }
      finally { this.loadingCat = false }
    },
    seleccionarCat(cat) {
      this.selectedCat = cat
      this.selectedSub = null
      this.subcategorias = []
      this.productos = []
      this.cargarSubcategorias(cat.id)
    },
    abrirCatDialog(cat = null) {
      this.editandoCat = cat
      this.catForm = cat ? { nombre: cat.nombre, color: cat.color || '#6366f1', descripcion: cat.descripcion || '', estado: cat.activo === false ? 'inactivo' : 'activo' } : emptyCatForm()
      this.catDialog = true
    },
    async guardarCat() {
      if (!this.catForm.nombre.trim()) return this.$message.error('El nombre es obligatorio')
      this.saving = true
      try {
        if (this.editandoCat) {
          await this.$service.put(`categorias-producto/${this.editandoCat.id}`, this.catForm)
          this.$message.success('Categoría actualizada')
        } else {
          await this.$service.post('categorias-producto', this.catForm)
          this.$message.success('Categoría creada')
        }
        this.catDialog = false
        await this.cargarCategorias()
        if (this.selectedCat && this.editandoCat && this.selectedCat.id === this.editandoCat.id) {
          this.selectedCat = this.categorias.find(c => c.id === this.editandoCat.id) || null
        }
      } finally { this.saving = false }
    },
    eliminarCat(cat) {
      this.$confirm(`¿Eliminar la categoría "${cat.nombre}"? También se eliminarán sus subcategorías y productos.`, async () => {
        await this.$service.delete(`categorias-producto/${cat.id}`)
        this.$message.success('Categoría eliminada')
        if (this.selectedCat && this.selectedCat.id === cat.id) {
          this.selectedCat = null; this.subcategorias = []; this.selectedSub = null; this.productos = []
        }
        await this.cargarCategorias()
      })
    },

    // ── Subcategorías ───────────────────────────────────────────────────────────

    async cargarSubcategorias(categoriaId) {
      this.loadingSub = true
      try { this.subcategorias = await this.$service.list(`subcategorias-producto?categoriaId=${categoriaId}`) || [] }
      finally { this.loadingSub = false }
    },
    seleccionarSub(sub) {
      this.selectedSub = sub
      this.productos = []
      this.cargarProductos(sub.id)
    },
    abrirSubDialog(sub = null) {
      this.editandoSub = sub
      this.subForm = sub ? { nombre: sub.nombre, descripcion: sub.descripcion || '', estado: sub.activo === false ? 'inactivo' : 'activo' } : emptySubForm()
      this.subDialog = true
    },
    async guardarSub() {
      if (!this.subForm.nombre.trim()) return this.$message.error('El nombre es obligatorio')
      this.saving = true
      try {
        const payload = { ...this.subForm, categoriaId: this.selectedCat.id }
        if (this.editandoSub) {
          await this.$service.put(`subcategorias-producto/${this.editandoSub.id}`, payload)
          this.$message.success('Subcategoría actualizada')
        } else {
          await this.$service.post('subcategorias-producto', payload)
          this.$message.success('Subcategoría creada')
        }
        this.subDialog = false
        await this.cargarSubcategorias(this.selectedCat.id)
      } finally { this.saving = false }
    },
    eliminarSub(sub) {
      this.$confirm(`¿Eliminar la subcategoría "${sub.nombre}"?`, async () => {
        await this.$service.delete(`subcategorias-producto/${sub.id}`)
        this.$message.success('Subcategoría eliminada')
        if (this.selectedSub && this.selectedSub.id === sub.id) {
          this.selectedSub = null; this.productos = []
        }
        await this.cargarSubcategorias(this.selectedCat.id)
      })
    },

    // ── Productos ───────────────────────────────────────────────────────────────

    async cargarProductos(subcategoriaId) {
      this.loadingProd = true
      try { this.productos = await this.$service.list(`productos?subcategoriaId=${subcategoriaId}`) || [] }
      finally { this.loadingProd = false }
    },
    abrirProdDialog(prod = null) {
      this.editandoProd = prod
      this.prodForm = prod
        ? { nombre: prod.nombre, codigoTienda: prod.codigoTienda || '', codigoBarras: prod.codigoBarras || '', codigoProveedor: prod.codigoProveedor || '', unidadBaseId: prod.unidadBaseId || '', descripcion: prod.descripcion || '', estado: prod.activo === false ? 'inactivo' : 'activo', requiereLote: !!prod.requiereLote, metodoPicking: prod.metodoPicking || 'FEFO', alertaVencimientoDias: prod.alertaVencimientoDias ?? 30 }
        : emptyProdForm()
      this.prodDialog = true
    },
    async guardarProd() {
      if (!this.prodForm.nombre.trim()) return this.$message.error('El nombre es obligatorio')
      this.saving = true
      try {
        const payload = { ...this.prodForm, subcategoriaId: this.selectedSub.id, unidadBaseId: this.prodForm.unidadBaseId || undefined }
        if (this.editandoProd) {
          await this.$service.put(`productos/${this.editandoProd.id}`, payload)
          this.$message.success('Producto actualizado')
        } else {
          await this.$service.post('productos', payload)
          this.$message.success('Producto creado')
        }
        this.prodDialog = false
        await this.cargarProductos(this.selectedSub.id)
      } finally { this.saving = false }
    },
    eliminarProd(prod) {
      this.$confirm(`¿Eliminar el producto "${prod.nombre}"?`, async () => {
        await this.$service.delete(`productos/${prod.id}`)
        this.$message.success('Producto eliminado')
        await this.cargarProductos(this.selectedSub.id)
      })
    },

    // ── Precios ─────────────────────────────────────────────────────────────────

    async verPrecios(prod) {
      this.selectedProd = prod
      this.preciosTab = 'precios'
      this.showPrecioForm = false
      this.preciosModal = true
      await this.cargarPrecios()
    },
    async cargarPrecios() {
      this.loadingPrecios = true
      try {
        const [precios, promociones] = await Promise.all([
          this.$service.list(`productos/${this.selectedProd.id}/precios`),
          this.$service.list(`productos/${this.selectedProd.id}/promociones`),
        ])
        this.escalasActivas = precios?.escalasActivas || []
        this.historico      = precios?.historico || []
        this.promociones    = promociones || []
      } finally { this.loadingPrecios = false }
    },
    escalaActivaPorTipo(tipo) {
      return this.escalasActivas.find(e => e.tipo === tipo && !e.unidadId) || null
    },
    abrirFormPrecio(tipo, unidadId) {
      const pct = tipo !== 'COSTO' && this.selectedProd?.porcentajeFactura != null
        ? String(this.selectedProd.porcentajeFactura)
        : ''
      this.precioForm = { ...emptyPrecioForm(), tipo, unidadId: unidadId || '', porcentajeFactura: pct }
      this.showPrecioForm = true
    },
    agregarTier() {
      const last = this.precioForm.escala[this.precioForm.escala.length - 1]
      const nextMin = last && last.cantidadMax ? last.cantidadMax + 1 : 1
      this.precioForm.escala.push({ cantidadMin: nextMin, cantidadMax: null, precio: '' })
    },
    quitarTier(idx) {
      if (this.precioForm.escala.length > 1) this.precioForm.escala.splice(idx, 1)
    },
    async guardarPrecio() {
      const tienePrecios = this.precioForm.escala.every(t => t.precio !== '' && t.precio !== null)
      if (!tienePrecios) return this.$message.error('Todos los tramos deben tener precio')
      this.saving = true
      try {
        const payload = {
          ...this.precioForm,
          unidadId: this.precioForm.unidadId || undefined,
          escala: this.precioForm.escala.map(t => ({
            cantidadMin: t.cantidadMin,
            cantidadMax: t.cantidadMax || undefined,
            precio: Number(t.precio),
          })),
        }
        await this.$service.post(`productos/${this.selectedProd.id}/precios`, payload)
        if (this.precioForm.tipo !== 'COSTO' && this.precioForm.porcentajeFactura !== '') {
          const pct = parseFloat(this.precioForm.porcentajeFactura)
          if (!isNaN(pct) && pct >= 0) {
            await this.$service.put(`productos/${this.selectedProd.id}`, { porcentajeFactura: pct })
            this.selectedProd = { ...this.selectedProd, porcentajeFactura: pct }
          }
        }
        this.$message.success('Escala de precios registrada')
        this.showPrecioForm = false
        await this.cargarPrecios()
      } finally { this.saving = false }
    },

    // ── Promociones ─────────────────────────────────────────────────────────────

    abrirPromoDialog(promo = null) {
      this.editandoPromo = promo
      this.promoForm = promo
        ? { nombre: promo.nombre, precio: promo.precio, moneda: promo.moneda || 'BOB', fechaInicio: promo.fechaInicio || '', fechaFin: promo.fechaFin || '', habilitado: promo.habilitado, notas: promo.notas || '' }
        : emptyPromoForm()
      this.promoDialog = true
    },
    async guardarPromo() {
      if (!this.promoForm.nombre.trim() || !this.promoForm.precio) return this.$message.error('Nombre y precio son obligatorios')
      this.saving = true
      try {
        if (this.editandoPromo) {
          await this.$service.put(`productos/${this.selectedProd.id}/promociones/${this.editandoPromo.id}`, this.promoForm)
          this.$message.success('Promoción actualizada')
        } else {
          await this.$service.post(`productos/${this.selectedProd.id}/promociones`, this.promoForm)
          this.$message.success('Promoción creada')
        }
        this.promoDialog = false
        await this.cargarPrecios()
      } finally { this.saving = false }
    },
    async togglePromo(promo) {
      await this.$service.patch(`productos/${this.selectedProd.id}/promociones/${promo.id}/toggle`, {})
      await this.cargarPrecios()
    },
    eliminarPromo(promo) {
      this.$confirm(`¿Eliminar la promoción "${promo.nombre}"?`, async () => {
        await this.$service.delete(`productos/${this.selectedProd.id}/promociones/${promo.id}`)
        this.$message.success('Promoción eliminada')
        await this.cargarPrecios()
      })
    },

    // ── Unidades de Medida ──────────────────────────────────────────────────────

    async cargarUnidades() {
      try { this.unidades = await this.$service.list('unidades-medida') || [] }
      catch { this.unidades = [] }
    },
    unidadNombre(id) {
      return this.unidades.find(u => u.id === id)?.nombre || '—'
    },
    abrirUnidadForm(unidad = null) {
      this.editandoUnidad = unidad
      this.unidadForm = unidad
        ? { nombre: unidad.nombre, abreviacion: unidad.abreviacion || '', esBase: unidad.esBase, unidadBaseId: unidad.unidadBaseId || '', factorConversion: unidad.factorConversion || 1, estado: unidad.activo === false ? 'inactivo' : 'activo' }
        : emptyUnidadForm()
      this.unidadDialog = true
    },
    abrirUnidadDialog(unidad = null) {
      this.mainTab = 'unidades'
      this.abrirUnidadForm(unidad)
    },
    async guardarUnidad() {
      if (!this.unidadForm.nombre.trim()) return this.$message.error('El nombre es obligatorio')
      this.saving = true
      try {
        const payload = {
          ...this.unidadForm,
          unidadBaseId: this.unidadForm.esBase ? undefined : (this.unidadForm.unidadBaseId || undefined),
          factorConversion: this.unidadForm.esBase ? 1 : Number(this.unidadForm.factorConversion),
        }
        if (this.editandoUnidad) {
          await this.$service.put(`unidades-medida/${this.editandoUnidad.id}`, payload)
          this.$message.success('Unidad actualizada')
        } else {
          await this.$service.post('unidades-medida', payload)
          this.$message.success('Unidad creada')
        }
        this.unidadDialog = false
        this.editandoUnidad = null
        this.unidadForm = emptyUnidadForm()
        await this.cargarUnidades()
      } finally { this.saving = false }
    },
    eliminarUnidad(u) {
      this.$confirm(`¿Eliminar la unidad "${u.nombre}"?`, async () => {
        await this.$service.delete(`unidades-medida/${u.id}`)
        this.$message.success('Unidad eliminada')
        if (this.editandoUnidad && this.editandoUnidad.id === u.id) {
          this.editandoUnidad = null
          this.unidadForm = emptyUnidadForm()
        }
        await this.cargarUnidades()
      })
    },

    // ── Import / Export ─────────────────────────────────────────────────────────

    async exportarProductos() {
      try {
        const response = await this.$http.get(`${this.$baseServer}productos/exportar`, { responseType: 'blob' })
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const a = document.createElement('a'); a.href = url
        a.download = `productos_${new Date().toISOString().slice(0,10)}.xlsx`
        a.click(); window.URL.revokeObjectURL(url)
      } catch { this.$message.error('Error al exportar') }
    },
    triggerImport() { this.$refs.fileInput.click() },
    async onFileSelected(e) {
      const file = e.target.files[0]; if (!file) return
      this.importando = true
      try {
        const formData = new FormData(); formData.append('file', file)
        const res = await this.$http.post(`${this.$baseServer}productos/importar`, formData)
        this.resultadoImport = res.data?.datos || res.data
        this.$message.success(`${this.resultadoImport?.importados || 0} productos importados`)
        if (this.selectedSub) await this.cargarProductos(this.selectedSub.id)
        await this.cargarCategorias()
      } catch { this.$message.error('Error al importar el archivo') }
      finally { this.importando = false; e.target.value = '' }
    },
  },
}
</script>

<style scoped>
.cp-root { height: 100%; overflow: hidden; padding: 24px; display: flex; flex-direction: column; gap: 0; }

/* Navegación principal */
.cp-nav {
  display: flex; gap: 4px; margin-bottom: 16px; flex-shrink: 0;
  border-bottom: 1px solid #1e3a5f44; padding-bottom: 0;
}
.cp-nav-tab {
  display: flex; align-items: center; padding: 8px 18px; font-size: 12px; font-weight: 700;
  color: #475569; background: none; border: none; border-bottom: 2px solid transparent;
  cursor: pointer; transition: all 0.15s; margin-bottom: -1px;
}
.cp-nav-tab:hover { color: #94a3b8; }
.cp-nav-tab--active { color: #818cf8; border-bottom-color: #6366f1; }

/* Contenedor de tab */
.cp-tab-content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

/* Layout unidades */
.cp-uni-layout { display: flex; gap: 12px; flex: 1; overflow: hidden; }
.cp-uni-list-col {
  width: 340px; flex-shrink: 0; background: #0d1526;
  border: 1px solid #1e3a5f44; border-radius: 14px;
  display: flex; flex-direction: column; overflow: hidden;
}
.cp-uni-form-col {
  flex: 1; background: #0d1526; border: 1px solid #1e3a5f44;
  border-radius: 14px; overflow-y: auto;
}

.cp-uni-group-label {
  font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase;
  letter-spacing: .5px; padding: 8px 4px 4px;
}
.cp-uni-row {
  display: flex; align-items: center; gap: 8px; padding: 9px 8px;
  border-radius: 8px; cursor: pointer; margin-bottom: 2px; transition: background 0.15s;
}
.cp-uni-row:hover { background: #1e293b; }
.cp-uni-row--active { background: #6366f114; border: 1px solid #6366f133; }
.cp-uni-info { flex: 1; display: flex; align-items: center; gap: 6px; min-width: 0; }
.cp-uni-name { font-size: 12px; color: #cbd5e1; font-weight: 600; }
.cp-uni-abrev { font-size: 10px; color: #475569; background: #1e293b; padding: 1px 6px; border-radius: 4px; }
.cp-uni-factor { font-size: 10px; color: #22c55e; background: #22c55e11; padding: 1px 6px; border-radius: 4px; border: 1px solid #22c55e22; }

.cp-uni-hint {
  display: flex; gap: 10px; align-items: flex-start; background: #1e293b;
  border: 1px solid #1e3a5f44; border-radius: 8px; padding: 12px; margin-top: 20px;
}
.cp-uni-hint p { font-size: 11px; color: #475569; margin: 0; line-height: 1.6; }
.cp-uni-hint strong { color: #818cf8; }

/* Columnas */
.cp-columns { display: flex; gap: 12px; flex: 1; overflow: hidden; }

.cp-col {
  background: #0d1526; border: 1px solid #1e3a5f44; border-radius: 14px;
  display: flex; flex-direction: column; width: 220px; flex-shrink: 0; overflow: hidden;
}
.cp-col--wide { flex: 1; width: auto; }

.cp-col-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 14px 8px; border-bottom: 1px solid #1e3a5f33; flex-shrink: 0;
}
.cp-col-title { font-size: 13px; font-weight: 800; color: #f1f5f9; }
.cp-col-count { font-size: 10px; color: #475569; margin-top: 1px; }

.cp-add-btn {
  background: #6366f122; border: 1px solid #6366f133; color: #818cf8;
  border-radius: 7px; padding: 3px 9px; font-size: 16px; cursor: pointer; font-weight: 700;
}
.cp-add-btn:hover { background: #6366f133; }

.cp-search {
  margin: 8px 10px 4px; background: #0f172a; border: 1px solid #1e3a5f44;
  border-radius: 7px; color: #94a3b8; font-size: 11px; padding: 6px 10px;
  outline: none; flex-shrink: 0;
}

.cp-list { flex: 1; overflow-y: auto; padding: 4px 6px 8px; }

/* Item de lista */
.cp-item {
  display: flex; align-items: center; gap: 7px; padding: 8px 8px;
  border-radius: 8px; cursor: pointer; margin-bottom: 2px;
  transition: background 0.15s; position: relative;
}
.cp-item:hover { background: #1e293b; }
.cp-item--active { background: #6366f114; border: 1px solid #6366f133; }

.cp-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.cp-dot--sub { background: #334155; }

.cp-item-name { flex: 1; font-size: 12px; color: #cbd5e1; font-weight: 600; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.cp-item-btns { display: flex; gap: 2px; opacity: 0; transition: opacity 0.15s; }
.cp-item:hover .cp-item-btns { opacity: 1; }

.cp-arrow { color: #6366f1; flex-shrink: 0; }

/* Producto row */
.cp-prod-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 10px; border-radius: 8px; margin-bottom: 3px;
  border: 1px solid #1e3a5f33;
}
.cp-prod-row:hover { background: #1e293b; }
.cp-prod-main { flex: 1; min-width: 0; }
.cp-prod-name { font-size: 13px; font-weight: 700; color: #e2e8f0; }
.cp-prod-codes { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 3px; }

.cp-code { font-size: 10px; padding: 1px 6px; border-radius: 4px; font-family: monospace; }
.cp-code--tienda  { background: #6366f122; color: #818cf8; border: 1px solid #6366f133; }
.cp-code--barras  { background: #0ea5e922; color: #38bdf8; border: 1px solid #0ea5e933; }
.cp-code--prov    { background: #10b98122; color: #34d399; border: 1px solid #10b98133; }
.cp-code          { background: #1e293b; color: #64748b; border: 1px solid #334155; }

/* Botones icono */
.cp-icon-btn {
  background: #0f172a; border: 1px solid #1e3a5f44; border-radius: 6px;
  padding: 5px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #64748b; transition: all 0.15s;
}
.cp-icon-btn:hover        { border-color: #6366f1; color: #818cf8; }
.cp-icon-btn--danger:hover { border-color: #ef4444; color: #f87171; }
.cp-icon-btn--price:hover  { border-color: #22c55e; color: #4ade80; }

/* Loading / empty */
.cp-loading { display: flex; justify-content: center; padding: 24px; }
.cp-empty   { text-align: center; padding: 20px 10px; font-size: 12px; color: #334155; font-style: italic; }

/* Placeholder central */
.cp-placeholder {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; color: #1e3a5f;
}
.cp-placeholder p { font-size: 12px; color: #334155; text-align: center; }

/* Tabs de precios */
.cp-tabs { display: flex; border-bottom: 1px solid #1e3a5f44; padding: 0 20px; flex-shrink: 0; }
.cp-tab {
  padding: 10px 18px; font-size: 12px; font-weight: 700; color: #475569;
  background: none; border: none; border-bottom: 2px solid transparent;
  cursor: pointer; transition: all 0.15s; margin-bottom: -1px;
}
.cp-tab--active { color: #818cf8; border-bottom-color: #6366f1; }

/* Cards de tipos de precio */
.cp-price-types { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
.cp-price-type-card {
  flex: 1; background: #1e293b; border: 1px solid #1e3a5f44; border-radius: 10px;
  padding: 12px; display: flex; flex-direction: column; gap: 4px; min-width: 130px;
}
.cp-price-type-card--factura { border-color: #f59e0b33; background: #1e293b; }
.cp-price-type-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: .6px; }
.cp-price-value { font-size: 15px; font-weight: 800; color: #e2e8f0; }
.cp-price-date  { font-size: 10px; color: #475569; font-weight: 400; display: block; margin-top: 2px; }
.cp-price-empty { font-size: 12px; color: #334155; font-style: italic; }
.cp-set-price-btn {
  margin-top: 6px; background: #6366f122; border: 1px solid #6366f133; color: #818cf8;
  border-radius: 6px; padding: 4px 10px; font-size: 10px; font-weight: 700; cursor: pointer;
}
.cp-set-price-btn:hover { background: #6366f133; }

/* Form precio */
.cp-price-form {
  background: #1e293b; border: 1px solid #6366f133; border-radius: 10px;
  padding: 14px; margin-bottom: 10px;
}

/* Historial precios */
.cp-hist-row {
  display: flex; align-items: center; gap: 10px; padding: 7px 0;
  border-bottom: 1px solid #1e3a5f22; flex-wrap: wrap;
}
.cp-hist-tipo   { font-size: 10px; font-weight: 700; color: #6366f1; background: #6366f122; padding: 1px 6px; border-radius: 4px; }
.cp-hist-precio { font-size: 12px; font-weight: 700; color: #e2e8f0; }
.cp-hist-fecha  { font-size: 10px; color: #475569; flex: 1; }
.cp-hist-badge  { font-size: 9px; padding: 1px 6px; border-radius: 4px; font-weight: 700; }
.cp-hist-badge--on  { background: #22c55e22; color: #4ade80; border: 1px solid #22c55e33; }
.cp-hist-badge--off { background: #33415522; color: #64748b; border: 1px solid #33415544; }

/* Promo card */
.cp-promo-card {
  background: #1e293b; border: 1px solid #1e3a5f44; border-radius: 10px;
  padding: 12px; margin-bottom: 8px;
}

/* Toggle button */
.cp-toggle-btn {
  border-radius: 6px; padding: 4px 10px; font-size: 10px; font-weight: 800;
  cursor: pointer; border: 1px solid; transition: all 0.15s;
}
.cp-toggle-btn--on  { background: #22c55e22; border-color: #22c55e44; color: #4ade80; }
.cp-toggle-btn--off { background: #33415522; border-color: #33415544; color: #64748b; }

/* Spinner */
.ct-spinner {
  width: 24px; height: 24px; border-radius: 50%;
  border: 3px solid #1e3a5f44; border-top-color: #6366f1;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Tiers de escala de precios */
.cp-tier-header {
  display: grid; grid-template-columns: 1fr 1fr 1fr 28px; gap: 6px;
  font-size: 10px; font-weight: 700; color: #475569;
  text-transform: uppercase; letter-spacing: .4px; margin-bottom: 4px;
}
.cp-tier-header--factura { grid-template-columns: 1fr 1fr 1fr 1fr 28px; }
.cp-tier-row {
  display: grid; grid-template-columns: 1fr 1fr 1fr 28px; gap: 6px; margin-bottom: 4px;
}
.cp-tier-row--factura { grid-template-columns: 1fr 1fr 1fr 1fr 28px; }
.cp-tier-row .ide-input { padding: 5px 8px; font-size: 12px; }
.cp-factura-computed {
  display: flex; align-items: center; justify-content: flex-end;
  font-size: 12px; font-weight: 700; color: #fbbf24;
  background: #f59e0b11; border-color: #f59e0b33;
  padding: 5px 8px; pointer-events: none;
}

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter, .modal-fade-leave-to { opacity: 0; }
</style>
