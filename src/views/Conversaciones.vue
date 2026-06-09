<template>
  <!-- Standalone route: 3-column inbox layout -->
  <div v-if="!agenteId" style="display:flex; height:100%; overflow:hidden;">

    <!-- ── Column 1: Conversation List (320px) ── -->
    <div style="width:320px; flex-shrink:0; border-right:1px solid #1e3a5f44; display:flex; flex-direction:column; overflow:hidden;">
      <!-- Header -->
      <div style="padding:16px 16px 12px; border-bottom:1px solid #1e3a5f44;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:15px; font-weight:700; color:#f1f5f9;">Conversaciones</span>
            <span v-if="conversaciones.length" class="cv-count-badge">{{ conversaciones.length }}</span>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <div v-if="pollingActivo" class="cv-pulse-dot" title="Actualizando automáticamente"></div>
            <button @click="cargar(true)" class="cv-refresh-btn" title="Actualizar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            </button>
          </div>
        </div>
        <div style="position:relative;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); pointer-events:none;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="busqueda" class="cv-search" placeholder="Buscar conversación…" />
        </div>
      </div>

      <!-- Channel tabs -->
      <div style="display:flex; border-bottom:1px solid #1e3a5f44; overflow-x:auto; padding:0 8px;">
        <button v-for="tab in filtros" :key="tab.id" @click="filtroActivo = tab.id" class="cv-tab" :class="{ 'cv-tab--active': filtroActivo === tab.id }">{{ tab.label }}</button>
      </div>

      <!-- List -->
      <div style="flex:1; overflow-y:auto;">
        <div v-if="loading" style="display:flex; justify-content:center; padding:32px;">
          <div class="cv-spinner cv-spinner--28"></div>
        </div>
        <div v-else-if="conversacionesFiltradas.length === 0" style="padding:32px; text-align:center; color:#475569; font-size:13px;">Sin conversaciones</div>
        <div v-else v-for="conv in conversacionesFiltradas" :key="conv.id" class="cv-row" :class="{ 'cv-row--active': seleccionadaId === conv.id }" @click="seleccionar(conv)">
          <div style="display:flex; align-items:flex-start; gap:10px;">
            <div class="cv-avatar" :style="{ background: canalColor(conv.canal)+'33', color: canalColor(conv.canal) }">
              {{ conv.contacto ? conv.contacto.slice(0,2).toUpperCase() : '??' }}
            </div>
            <div style="flex:1; min-width:0;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
                <span style="font-size:13px; font-weight:700; color:#f1f5f9; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; min-width:0;">{{ conv.contacto }}</span>
                <span style="font-size:10px; color:#475569; flex-shrink:0;">{{ formatTime(conv.fechaCreacion) }}</span>
              </div>
              <p style="margin:0 0 6px; font-size:11.5px; color:#64748b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ ultimoMensaje(conv) }}</p>
              <div style="display:flex; align-items:center; gap:4px;">
                <span class="cv-badge" :style="{ background: canalColor(conv.canal)+'22', color: canalColor(conv.canal) }">{{ conv.canal }}</span>
                <span v-if="conv.escalado" class="cv-badge" style="background:#f9731622; color:#f97316;">Escalado</span>
              </div>
            </div>
            <div style="text-align:center; flex-shrink:0; margin-left:4px;">
              <div style="font-size:15px; font-weight:900;" :style="{ color: scoreColor(conv.score) }">{{ conv.score }}</div>
              <div style="font-size:9px; color:#475569;">score</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Column 2: Chat / Messages ── -->
    <div style="flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0;">
      <template v-if="seleccionada">
        <!-- Chat Header -->
        <div style="padding:12px 16px; border-bottom:1px solid #1e3a5f44; display:flex; align-items:center; justify-content:space-between; flex-shrink:0;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="position:relative; flex-shrink:0;">
              <div class="cv-avatar-md" :style="{ background: canalColor(seleccionada.canal)+'33', color: canalColor(seleccionada.canal) }">
                {{ seleccionada.contacto ? seleccionada.contacto.slice(0,2).toUpperCase() : '??' }}
              </div>
            </div>
            <div>
              <div style="font-size:14px; font-weight:700; color:#f1f5f9;">{{ seleccionada.contacto }}</div>
              <div style="font-size:11px; color:#64748b; display:flex; align-items:center; gap:6px;">
                <span>{{ seleccionada.canal }}</span>
                <span>·</span>
                <span>{{ seleccionada.totalMensajes }} mensajes</span>
                <span>·</span>
                <span>{{ formatDate(seleccionada.fechaCreacion) }}</span>
              </div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <div v-if="cargandoMensajes" style="width:16px; height:16px;">
              <div class="cv-spinner cv-spinner--16"></div>
            </div>
            <div class="cv-score-chip" :style="{ background: scoreColor(seleccionada.score)+'18', border: '1px solid '+scoreColor(seleccionada.score)+'33', color: scoreColor(seleccionada.score) }">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              {{ seleccionada.score }}
            </div>
          </div>
        </div>

        <!-- Messages -->
        <div ref="msgContainer" style="flex:1; overflow-y:auto; padding:16px 20px; display:flex; flex-direction:column; gap:12px;">
          <div v-if="!seleccionada.mensajes || !seleccionada.mensajes.length"
            style="display:flex; align-items:center; justify-content:center; height:100%; color:#475569; font-size:13px;">
            Sin mensajes registrados
          </div>
          <template v-else>
            <div v-for="(msg, i) in seleccionada.mensajes" :key="i"
              style="display:flex; gap:8px; align-items:flex-end;"
              :style="{ justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }">
              <div v-if="msg.role !== 'user'" class="cv-avatar-sm" style="background:#c9644233; color:#e8956d; flex-shrink:0;">✦</div>
              <div style="max-width:68%;">
                <div class="cv-bubble" :class="msg.role === 'user' ? 'cv-bubble--user' : 'cv-bubble--ai'">{{ msg.content }}</div>
                <div style="font-size:10px; color:#475569; margin-top:3px;" :style="{ textAlign: msg.role === 'user' ? 'right' : 'left' }">
                  {{ msg.role === 'user' ? seleccionada.contacto : 'Claude AI' }}
                  <span v-if="msg.timestamp" style="margin-left:4px;">· {{ formatTime(msg.timestamp) }}</span>
                </div>
              </div>
            </div>
            <!-- Typing indicator while sending -->
            <div v-if="enviando" style="display:flex; gap:8px; align-items:flex-end; justify-content:flex-start;">
              <div class="cv-avatar-sm" style="background:#c9644233; color:#e8956d; flex-shrink:0;">✦</div>
              <div class="cv-bubble cv-bubble--ai cv-typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          </template>
        </div>

        <!-- Reply Input -->
        <div style="padding:12px 16px; border-top:1px solid #1e3a5f44; flex-shrink:0;">
          <div v-if="errorEnvio" style="font-size:11px; color:#ef4444; margin-bottom:6px; padding:6px 10px; background:#ef444410; border-radius:6px; border:1px solid #ef444430;">
            {{ errorEnvio }}
          </div>
          <div style="display:flex; align-items:flex-end; gap:8px;">
            <textarea
              v-model="respuesta"
              @keydown.enter.exact.prevent="enviarRespuesta"
              class="cv-reply-input"
              :placeholder="seleccionada.canal === 'whatsapp' ? 'Responder por WhatsApp… (Enter para enviar)' : 'Escribir mensaje… (Enter para enviar)'"
              rows="1"
              :disabled="enviando"
            ></textarea>
            <button @click="enviarRespuesta" class="cv-send-btn" :disabled="!respuesta.trim() || enviando">
              <svg v-if="!enviando" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              <div v-else class="cv-spinner cv-spinner--14 cv-spinner--white"></div>
            </button>
          </div>
          <div v-if="seleccionada.canal === 'whatsapp'" style="font-size:10px; color:#475569; margin-top:5px; display:flex; align-items:center; gap:4px;">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Enviará por WhatsApp al número {{ seleccionada.contacto }}
          </div>
        </div>
      </template>

      <div v-else style="flex:1; display:flex; align-items:center; justify-content:center; color:#475569; font-size:13px; flex-direction:column; gap:12px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        <span>Selecciona una conversación</span>
      </div>
    </div>

    <!-- ── Column 3: Detail Panel (280px) ── -->
    <div v-if="seleccionada" style="width:280px; flex-shrink:0; border-left:1px solid #1e3a5f44; overflow-y:auto; padding:16px 14px; display:flex; flex-direction:column; gap:16px;">

      <!-- Contact -->
      <div>
        <div class="cv-panel-label">Contacto</div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div class="cv-panel-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>{{ seleccionada.contacto }}</span>
          </div>
          <div class="cv-panel-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <span style="text-transform:capitalize;">{{ seleccionada.canal }}</span>
          </div>
          <div class="cv-panel-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>{{ formatDate(seleccionada.fechaCreacion) }}</span>
          </div>
        </div>
      </div>

      <!-- Score bar -->
      <div>
        <div class="cv-panel-label">Puntuación Lead</div>
        <div style="margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span style="font-size:11px; color:#64748b;">Lead Score</span>
            <span style="font-size:12px; font-weight:700;" :style="{ color: scoreColor(seleccionada.score) }">{{ seleccionada.score }}/100</span>
          </div>
          <div style="height:6px; border-radius:3px; background:#1e293b; overflow:hidden;">
            <div :style="{ width: seleccionada.score+'%', height:'100%', background: scoreColor(seleccionada.score), borderRadius:'3px', transition:'width 0.4s' }"></div>
          </div>
        </div>
        <div class="cv-tier-badge" :style="{ background: scoreColor(seleccionada.score)+'18', border: '1px solid '+scoreColor(seleccionada.score)+'33', color: scoreColor(seleccionada.score) }">
          {{ seleccionada.score >= 70 ? '🔥 Hot Lead' : seleccionada.score >= 40 ? '🌡 Warm Lead' : '❄️ Cold Lead' }}
        </div>
        <div v-if="seleccionada.scoreMotivo" style="font-size:10px; color:#64748b; margin-top:6px; line-height:1.4;">{{ seleccionada.scoreMotivo }}</div>
      </div>

      <!-- Calificación IA -->
      <div v-if="seleccionada.intencion || seleccionada.sentimiento || seleccionada.urgencia || seleccionada.servicioDetectado">
        <div class="cv-panel-label">Análisis IA</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div v-if="seleccionada.intencion" style="display:flex; align-items:center; justify-content:space-between;">
            <span style="font-size:10px; color:#64748b;">Intención</span>
            <span class="cv-ia-chip" :style="intencionStyle(seleccionada.intencion)">{{ intencionLabel(seleccionada.intencion) }}</span>
          </div>
          <div v-if="seleccionada.sentimiento" style="display:flex; align-items:center; justify-content:space-between;">
            <span style="font-size:10px; color:#64748b;">Sentimiento</span>
            <span class="cv-ia-chip" :style="sentimientoStyle(seleccionada.sentimiento)">{{ sentimientoLabel(seleccionada.sentimiento) }}</span>
          </div>
          <div v-if="seleccionada.urgencia" style="display:flex; align-items:center; justify-content:space-between;">
            <span style="font-size:10px; color:#64748b;">Urgencia</span>
            <span class="cv-ia-chip" :style="urgenciaStyle(seleccionada.urgencia)">{{ urgenciaLabel(seleccionada.urgencia) }}</span>
          </div>
          <div v-if="seleccionada.etapaFunnel" style="display:flex; align-items:center; justify-content:space-between;">
            <span style="font-size:10px; color:#64748b;">Etapa</span>
            <span class="cv-ia-chip" style="background:#6366f115; border:1px solid #6366f133; color:#a5b4fc;">{{ etapaLabel(seleccionada.etapaFunnel) }}</span>
          </div>
          <div v-if="seleccionada.servicioDetectado" style="display:flex; align-items:center; justify-content:space-between;">
            <span style="font-size:10px; color:#64748b;">Servicio</span>
            <span class="cv-ia-chip" style="background:#0f172a; border:1px solid #334155; color:#94a3b8; max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ seleccionada.servicioDetectado }}</span>
          </div>
        </div>
      </div>

      <!-- Datos capturados -->
      <div v-if="seleccionada.datosCapturados && Object.keys(seleccionada.datosCapturados).some(k => seleccionada.datosCapturados[k])">
        <div class="cv-panel-label">Datos capturados</div>
        <div style="display:flex; flex-direction:column; gap:5px;">
          <div v-if="seleccionada.datosCapturados.nombre" class="cv-panel-row">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span style="font-size:11px;">{{ seleccionada.datosCapturados.nombre }}</span>
          </div>
          <div v-if="seleccionada.datosCapturados.telefono" class="cv-panel-row">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            <span style="font-size:11px;">{{ seleccionada.datosCapturados.telefono }}</span>
          </div>
          <div v-if="seleccionada.datosCapturados.email" class="cv-panel-row">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span style="font-size:11px;">{{ seleccionada.datosCapturados.email }}</span>
          </div>
        </div>
      </div>

      <!-- Pipeline / Estado -->
      <div>
        <div class="cv-panel-label">Estado</div>
        <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:10px;">
          <div v-for="step in pipeline" :key="step.valor" class="cv-pipeline-step"
            :style="{ background: seleccionada.estadoConversacion === step.valor ? step.color+'22' : '#1e293b', color: seleccionada.estadoConversacion === step.valor ? step.color : '#475569', border: seleccionada.estadoConversacion === step.valor ? '1px solid '+step.color+'55' : '1px solid #334155', cursor: seleccionada.estadoConversacion !== step.valor ? 'pointer' : 'default' }"
            @click="cambiarEstado(step.valor)">
            {{ step.label }}
          </div>
        </div>
      </div>

      <!-- Resolution -->
      <div v-if="seleccionada.resolucion">
        <div class="cv-panel-label">Resolución IA</div>
        <div style="font-size:12px; color:#94a3b8; line-height:1.5; padding:10px; background:#0f172a; border-radius:8px; border:1px solid #1e3a5f33;">
          {{ seleccionada.resolucion }}
        </div>
      </div>

      <!-- Stats -->
      <div>
        <div class="cv-panel-label">Estadísticas</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div class="cv-stat-box">
            <div style="font-size:18px; font-weight:900; color:#818cf8;">{{ seleccionada.totalMensajes || 0 }}</div>
            <div style="font-size:9px; color:#64748b;">Mensajes</div>
          </div>
          <div class="cv-stat-box">
            <div style="font-size:18px; font-weight:900;" :style="{ color: seleccionada.escalado ? '#f97316' : '#22c55e' }">{{ seleccionada.escalado ? 'Sí' : 'No' }}</div>
            <div style="font-size:9px; color:#64748b;">Escalado</div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="seleccionada.notas">
        <div class="cv-panel-label">Notas</div>
        <div style="font-size:12px; color:#94a3b8; line-height:1.5; padding:10px; background:#0f172a; border-radius:8px; border:1px solid #1e3a5f33;">
          {{ seleccionada.notas }}
        </div>
      </div>
    </div>

  </div>

  <!-- Embedded in AgenteDetalle: compact list -->
  <div v-else>
    <div v-if="loading" style="display:flex; justify-content:center; padding:32px;">
      <div class="cv-spinner cv-spinner--28"></div>
    </div>
    <div v-else-if="conversaciones.length === 0" style="text-align:center; padding:48px; color:#64748b;">
      <div style="font-size:32px; margin-bottom:12px;">💬</div>
      <div style="font-size:13px;">No hay conversaciones registradas</div>
    </div>
    <div v-else style="display:flex; flex-direction:column; gap:10px;">
      <div v-for="conv in conversaciones" :key="conv.id" class="cv-compact-row">
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="cv-avatar" :style="{ background: canalColor(conv.canal)+'33', color: canalColor(conv.canal) }">
            {{ conv.contacto ? conv.contacto.slice(0,2).toUpperCase() : '??' }}
          </div>
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:3px;">
              <span style="font-size:13px; font-weight:700; color:#e2e8f0;">{{ conv.contacto }}</span>
              <span class="cv-badge" :style="{ background: canalColor(conv.canal)+'22', color: canalColor(conv.canal) }">{{ conv.canal }}</span>
              <span v-if="conv.escalado" class="cv-badge" style="background:#f9731622; color:#f97316;">Escalado</span>
            </div>
            <div style="font-size:11px; color:#64748b;">{{ conv.totalMensajes }} mensajes · {{ formatDate(conv.fechaCreacion) }}</div>
          </div>
          <div style="text-align:center; flex-shrink:0;">
            <div style="font-size:18px; font-weight:900;" :style="{ color: scoreColor(conv.score) }">{{ conv.score }}</div>
            <div style="font-size:9px; color:#475569;">score</div>
          </div>
        </div>
        <div v-if="conv.resolucion" style="font-size:11px; color:#64748b; margin-top:8px; padding-top:8px; border-top:1px solid #1e3a5f22;">{{ conv.resolucion }}</div>
      </div>
    </div>
  </div>
</template>

<script>
const POLL_INTERVAL = 8000;

export default {
  name: 'Conversaciones',
  props: { agenteId: { type: String, default: null } },
  data: () => ({
    conversaciones: [],
    loading: true,
    cargandoMensajes: false,
    filtroActivo: 'todas',
    busqueda: '',
    seleccionadaId: null,
    seleccionada: null,
    respuesta: '',
    enviando: false,
    errorEnvio: null,
    pollingActivo: false,
    pollTimer: null,
    filtros: [
      { id: 'todas',     label: 'Todos'      },
      { id: 'whatsapp',  label: 'WhatsApp'   },
      { id: 'instagram', label: 'Instagram'  },
      { id: 'facebook',  label: 'Facebook'   },
      { id: 'chat',      label: 'Chat Web'   },
      { id: 'escaladas', label: 'Escaladas'  },
    ],
    pipeline: [
      { valor: 'abierto',   label: 'Abierto',     color: '#22c55e' },
      { valor: 'pendiente', label: 'Pendiente',    color: '#f59e0b' },
      { valor: 'resuelto',  label: 'Resuelto',     color: '#818cf8' },
      { valor: 'cerrado',   label: 'Cerrado',      color: '#475569' },
    ],
  }),
  computed: {
    conversacionesFiltradas() {
      let list = this.conversaciones;
      if (this.filtroActivo === 'escaladas') list = list.filter(c => c.escalado);
      else if (this.filtroActivo !== 'todas') list = list.filter(c => c.canal === this.filtroActivo);
      if (this.busqueda.trim()) {
        const q = this.busqueda.toLowerCase();
        list = list.filter(c => (c.contacto || '').toLowerCase().includes(q) || (c.resolucion || '').toLowerCase().includes(q));
      }
      return [...list].sort((a, b) => {
        const ta = new Date(a.fechaModificacion || a.fechaCreacion).getTime();
        const tb = new Date(b.fechaModificacion || b.fechaCreacion).getTime();
        return tb - ta;
      });
    },
  },
  async mounted() {
    await this.cargar(true);
    if (!this.agenteId) this.iniciarPolling();
  },
  beforeDestroy() {
    this.detenerPolling();
  },
  methods: {
    // ── Data loading ──
    async cargar(mostrarSpinner = false) {
      try {
        if (mostrarSpinner) this.loading = true;
        const lista = await this.fetchSilencioso('conversaciones', this.agenteId ? { agenteId: this.agenteId } : {});
        if (!lista) return;
        this.conversaciones = lista;
        if (this.seleccionadaId) {
          const fresca = lista.find(c => c.id === this.seleccionadaId);
          if (fresca) {
            const prevCount = this.seleccionada ? (this.seleccionada.totalMensajes || 0) : 0;
            this.seleccionada = fresca;
            if (fresca.totalMensajes > prevCount) this.$nextTick(this.scrollAbajo);
          }
        }
      } finally {
        if (mostrarSpinner) this.loading = false;
      }
    },

    // Calls the API without triggering the global progress bar
    async fetchSilencioso(url, query) {
      const qs = query && Object.keys(query).length ? '?' + Object.entries(query).map(([k, v]) => `${k}=${v}`).join('&') : '';
      const base = this.$baseServer || '';
      try {
        const res = await this.$http.get(base + url + qs);
        const d = res.data;
        if (d && typeof d === 'object' && 'finalizado' in d) return d.datos;
        return d;
      } catch (_e) { return null; }
    },

    async seleccionar(conv) {
      this.seleccionadaId = conv.id;
      this.seleccionada = conv;
      this.respuesta = '';
      this.errorEnvio = null;
      this.$nextTick(this.scrollAbajo);
      // Fetch fresh data for this conversation
      try {
        this.cargandoMensajes = true;
        const fresca = await this.$service.get(`conversaciones/${conv.id}`);
        if (fresca) {
          this.seleccionada = fresca;
          this.$nextTick(this.scrollAbajo);
          // Update in list too
          const idx = this.conversaciones.findIndex(c => c.id === conv.id);
          if (idx !== -1) this.conversaciones.splice(idx, 1, fresca);
        }
      } catch (_e) { /* silently ignore */ } finally {
        this.cargandoMensajes = false;
      }
    },

    // ── Polling ──
    iniciarPolling() {
      this.pollingActivo = true;
      this.pollTimer = setInterval(() => this.cargar(false), POLL_INTERVAL);
    },
    detenerPolling() {
      this.pollingActivo = false;
      if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    },

    // ── Send reply ──
    async enviarRespuesta() {
      const texto = this.respuesta.trim();
      if (!texto || this.enviando || !this.seleccionada) return;
      this.enviando = true;
      this.errorEnvio = null;
      try {
        if (this.seleccionada.canal === 'whatsapp') {
          // Send via WhatsApp Cloud API
          await this.$service.post('whatsapp/send', {
            celular: this.seleccionada.contacto,
            mensaje: texto,
          });
          // Save the assistant message in the conversation record
          await this.$service.post(`conversaciones/${this.seleccionada.id}/mensajes`, {
            role: 'assistant',
            content: texto,
          });
        } else {
          // Other channels: just save as assistant message
          await this.$service.post(`conversaciones/${this.seleccionada.id}/mensajes`, {
            role: 'assistant',
            content: texto,
          });
        }
        this.respuesta = '';
        // Reload conversation to get updated messages
        await this.seleccionar(this.seleccionada);
      } catch (e) {
        this.errorEnvio = e?.response?.data?.message || e?.message || 'Error al enviar el mensaje';
      } finally {
        this.enviando = false;
      }
    },

    // ── Estado conversación ──
    async cambiarEstado(nuevoEstado) {
      if (!this.seleccionada || this.seleccionada.estadoConversacion === nuevoEstado) return;
      try {
        await this.$service.patch(`conversaciones/${this.seleccionada.id}/estado`, { estadoConversacion: nuevoEstado });
        this.seleccionada = { ...this.seleccionada, estadoConversacion: nuevoEstado };
        const idx = this.conversaciones.findIndex(c => c.id === this.seleccionada.id);
        if (idx !== -1) this.conversaciones.splice(idx, 1, { ...this.conversaciones[idx], estadoConversacion: nuevoEstado });
      } catch (_e) { /* error mostrado por service interceptor */ }
    },

    // ── UI helpers ──
    scrollAbajo() {
      const el = this.$refs.msgContainer;
      if (el) el.scrollTop = el.scrollHeight;
    },
    ultimoMensaje(conv) {
      if (!conv.mensajes || !conv.mensajes.length) return conv.resolucion || 'Sin mensajes';
      const ultimo = conv.mensajes[conv.mensajes.length - 1];
      return ultimo.content || '';
    },
    scoreColor(s) { return s >= 70 ? '#22c55e' : s >= 40 ? '#f59e0b' : '#ef4444'; },
    canalColor(c) {
      const m = { whatsapp:'#25D366', instagram:'#E1306C', facebook:'#1877F2', chat:'#818cf8' };
      return m[c] || '#64748b';
    },
    formatTime(d) {
      if (!d) return '';
      const date = new Date(d);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString('es-BO', { hour:'2-digit', minute:'2-digit' });
      return date.toLocaleDateString('es-BO', { day:'2-digit', month:'short' });
    },
    formatDate(d) {
      if (!d) return '';
      return new Date(d).toLocaleDateString('es-BO', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    },
    intencionLabel(v) {
      return { RESERVAR:'Reservar', INFORMAR:'Informar', CANCELAR:'Cancelar', QUEJAR:'Queja', OTRO:'Otro' }[v] || v;
    },
    intencionStyle(v) {
      const m = {
        RESERVAR: ['#22c55e','#4ade80'],
        INFORMAR: ['#818cf8','#a5b4fc'],
        CANCELAR: ['#ef4444','#f87171'],
        QUEJAR:   ['#f97316','#fb923c'],
        OTRO:     ['#64748b','#94a3b8'],
      };
      const [bg, cl] = m[v] || m.OTRO;
      return `background:${bg}15; border:1px solid ${bg}33; color:${cl};`;
    },
    sentimientoLabel(v) {
      return { POSITIVO:'Positivo', NEUTRAL:'Neutral', NEGATIVO:'Negativo', FRUSTRADO:'Frustrado' }[v] || v;
    },
    sentimientoStyle(v) {
      const m = {
        POSITIVO:  ['#22c55e','#4ade80'],
        NEUTRAL:   ['#64748b','#94a3b8'],
        NEGATIVO:  ['#ef4444','#f87171'],
        FRUSTRADO: ['#f97316','#fb923c'],
      };
      const [bg, cl] = m[v] || m.NEUTRAL;
      return `background:${bg}15; border:1px solid ${bg}33; color:${cl};`;
    },
    urgenciaLabel(v) {
      return { INMEDIATA:'Inmediata', ESTA_SEMANA:'Esta semana', SIN_URGENCIA:'Sin urgencia' }[v] || v;
    },
    urgenciaStyle(v) {
      const m = {
        INMEDIATA:    ['#ef4444','#f87171'],
        ESTA_SEMANA:  ['#f59e0b','#fbbf24'],
        SIN_URGENCIA: ['#64748b','#94a3b8'],
      };
      const [bg, cl] = m[v] || m.SIN_URGENCIA;
      return `background:${bg}15; border:1px solid ${bg}33; color:${cl};`;
    },
    etapaLabel(v) {
      return { DESCUBRIMIENTO:'Descubrimiento', CONSIDERACION:'Consideración', DECISION:'Decisión', RECURRENTE:'Recurrente' }[v] || v;
    },
  },
};
</script>

<style>
.cv-search { width:100%; background:#1e293b; border:1px solid #334155; border-radius:8px; color:#f1f5f9; font-size:13px; padding:8px 12px 8px 32px; outline:none; font-family:inherit; box-sizing:border-box; transition:border-color 0.15s; }
.cv-search:focus { border-color:#6366f1; }

.cv-tab { background:none; border:none; cursor:pointer; padding:10px 10px 8px; font-size:11px; font-weight:600; white-space:nowrap; color:#64748b; border-bottom:2px solid transparent; transition:all 0.15s; font-family:inherit; }
.cv-tab--active { color:#818cf8; border-bottom-color:#6366f1; }

.cv-row { padding:12px 14px; cursor:pointer; border-bottom:1px solid #1e3a5f33; border-left:3px solid transparent; transition:all 0.15s; }
.cv-row:hover { background:#6366f108; }
.cv-row--active { background:#6366f115; border-left-color:#6366f1; }

.cv-avatar { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; }
.cv-avatar-md { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; }
.cv-avatar-sm { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; }

.cv-badge { font-size:10px; font-weight:600; padding:1px 7px; border-radius:999px; }
.cv-count-badge { min-width:18px; height:18px; border-radius:999px; background:#6366f1; color:#fff; font-size:10px; font-weight:700; display:inline-flex; align-items:center; justify-content:center; padding:0 5px; }

.cv-score-chip { display:flex; align-items:center; gap:6px; padding:4px 10px; border-radius:8px; font-size:12px; font-weight:700; }

.cv-bubble { padding:10px 14px; font-size:13px; line-height:1.5; color:#f1f5f9; }
.cv-bubble--ai { background:#1e293b; border:1px solid #334155; border-radius:16px 16px 16px 4px; }
.cv-bubble--user { background:#4f46e5; border-radius:16px 16px 4px 16px; }

.cv-reply-input { flex:1; background:#1e293b; border:1px solid #334155; border-radius:10px; color:#f1f5f9; font-size:13px; padding:10px 14px; outline:none; font-family:inherit; resize:none; line-height:1.5; max-height:120px; transition:border-color 0.15s; }
.cv-reply-input:focus { border-color:#6366f1; }
.cv-reply-input:disabled { opacity:0.5; cursor:not-allowed; }

.cv-send-btn { width:40px; height:40px; border-radius:10px; background:#6366f1; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#fff; transition:background 0.15s; flex-shrink:0; }
.cv-send-btn:hover:not(:disabled) { background:#4f46e5; }
.cv-send-btn:disabled { opacity:0.4; cursor:not-allowed; }

.cv-refresh-btn { background:none; border:none; cursor:pointer; color:#475569; padding:4px; border-radius:6px; display:flex; align-items:center; transition:color 0.15s; }
.cv-refresh-btn:hover { color:#818cf8; }

.cv-pulse-dot { width:7px; height:7px; border-radius:50%; background:#22c55e; animation:cv-pulse 2s infinite; }
@keyframes cv-pulse { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:0.5; transform:scale(0.8); } }

.cv-typing { display:flex; align-items:center; gap:4px; padding:12px 16px; }
.cv-typing span { width:6px; height:6px; border-radius:50%; background:#475569; display:inline-block; animation:cv-bounce 1.2s infinite; }
.cv-typing span:nth-child(2) { animation-delay:0.2s; }
.cv-typing span:nth-child(3) { animation-delay:0.4s; }
@keyframes cv-bounce { 0%,80%,100%{ transform:translateY(0); } 40%{ transform:translateY(-6px); } }

.cv-panel-label { font-size:11px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px; }
.cv-panel-row { display:flex; align-items:center; gap:8px; font-size:12px; color:#94a3b8; }
.cv-tier-badge { display:inline-flex; align-items:center; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:700; }
.cv-pipeline-step { padding:3px 8px; border-radius:6px; font-size:11px; font-weight:600; cursor:default; }
.cv-stat-box { padding:10px; background:#0f172a; border-radius:8px; text-align:center; border:1px solid #1e3a5f22; }

.cv-compact-row { padding:12px 14px; background:#1e293b; border-radius:10px; border:1px solid #1e3a5f33; cursor:pointer; transition:border-color 0.15s; }
.cv-compact-row:hover { border-color:#6366f144; }

.cv-spinner { border-radius:50%; border-style:solid; border-color:#6366f1 #6366f133 #6366f133; animation:cv-spin 0.75s linear infinite; flex-shrink:0; }
.cv-spinner--28 { width:28px; height:28px; border-width:3px; }
.cv-spinner--16 { width:16px; height:16px; border-width:2px; }
.cv-spinner--14 { width:14px; height:14px; border-width:2px; }
.cv-spinner--white { border-color:#fff #ffffff44 #ffffff44; }
@keyframes cv-spin { to { transform:rotate(360deg); } }

.cv-ia-chip { font-size:10px; font-weight:700; padding:2px 9px; border-radius:999px; display:inline-flex; align-items:center; }
</style>
