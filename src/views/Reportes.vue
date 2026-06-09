<template>
  <div class="ide-mod">

    <!-- Sub-nav -->
    <div class="ide-subnav">
      <div class="ide-sn-sep">Reportes</div>
      <button v-for="s in secciones" :key="s.id" class="ide-sn-btn" :class="seccion === s.id ? 'ide-sn-btn--i' : ''" @click="seccion = s.id">
        <span v-html="s.svg" style="flex-shrink:0;display:flex;"></span>
        {{ s.label }}
      </button>
    </div>

    <!-- Content -->
    <div class="ide-body--bare">

      <!-- Filter bar -->
      <div class="rep-filters">
        <span style="font-size:12px;color:#64748b;font-weight:600;flex-shrink:0;">Período:</span>
        <button
          v-for="p in periodos" :key="p"
          class="rep-period-btn" :class="{ 'rep-period-btn--active': periodo === p }"
          @click="setPeriodo(p)"
        >{{ p }}</button>
        <span v-if="loading" style="margin-left:auto;display:flex;align-items:center;gap:6px;font-size:11px;color:#475569;">
          <span class="rep-mini-spinner"></span> Cargando...
        </span>
      </div>

      <!-- Scrollable body -->
      <div style="flex:1;overflow-y:auto;padding:20px 24px;">

        <!-- ── RESUMEN ── -->
        <template v-if="seccion === 'resumen'">
          <div class="ide-sec-hd"><h2>Resumen General</h2><p>Vista consolidada del negocio en el período seleccionado</p></div>

          <div class="rep-kpi-grid">
            <div v-for="k in kpisResumen" :key="k.label" class="ide-ia-card rep-kpi">
              <span style="font-size:11px;color:#64748b;font-weight:600;display:block;margin-bottom:8px;">{{ k.label }}</span>
              <div style="font-size:26px;font-weight:900;letter-spacing:-1px;margin-bottom:4px;" :style="{ color: k.color }">{{ k.value }}</div>
              <span style="font-size:10px;color:#475569;">{{ k.sub }}</span>
            </div>
          </div>

          <!-- Actividad por día (REAL) -->
          <div class="ide-ia-card" style="margin-bottom:20px;">
            <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:16px;">Conversaciones — últimos 7 días</div>
            <div style="display:flex;align-items:flex-end;gap:8px;height:80px;padding:0 4px;">
              <div v-for="day in actividadPorDia" :key="day.fecha" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
                <span style="font-size:9px;color:#64748b;margin-bottom:2px;">{{ day.total || '' }}</span>
                <div :style="{ width:'100%', height: barH(day.total, maxActividad)+'px', background:'#6366f1', borderRadius:'3px 3px 0 0', minHeight: day.total > 0 ? '4px' : '2px', opacity: day.total > 0 ? 0.85 : 0.2, transition:'height 0.4s' }"></div>
                <span style="font-size:9px;color:#64748b;">{{ day.label }}</span>
              </div>
            </div>
          </div>

          <!-- Conversaciones por agente -->
          <div class="ide-ia-card">
            <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:14px;">Conversaciones por agente</div>
            <div v-if="agentes.length === 0" style="text-align:center;color:#475569;font-size:13px;padding:20px;">Sin agentes registrados</div>
            <div v-else style="display:flex;flex-direction:column;gap:0;">
              <div v-for="ag in agentes" :key="ag.id" class="rep-ag-row">
                <div class="rep-ag-avatar" :style="{ background: ag.color+'22', color: ag.color }">{{ ag.avatar }}</div>
                <div style="flex:1;min-width:0;">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                    <span style="font-size:13px;font-weight:600;color:#e2e8f0;">{{ ag.nombre }}</span>
                    <span style="font-size:11px;color:#64748b;">{{ ag.totalConversaciones || 0 }} conv.</span>
                  </div>
                  <div class="score-bar">
                    <div :style="{ width: maxConv > 0 ? Math.min(((ag.totalConversaciones||0)/maxConv)*100,100)+'%' : '0%', height:'100%', background: ag.color||'#6366f1', borderRadius:'2px', transition:'width 0.4s' }"></div>
                  </div>
                </div>
                <div style="text-align:center;min-width:56px;">
                  <div style="font-size:15px;font-weight:800;" :style="{ color: ag.activo ? '#22c55e' : '#64748b' }">{{ ag.totalMensajes || 0 }}</div>
                  <div style="font-size:9px;color:#475569;">msg</div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ── CONVERSACIONES ── -->
        <template v-else-if="seccion === 'conversaciones'">
          <div class="ide-sec-hd"><h2>Conversaciones</h2><p>Análisis de calidad y comportamiento de los chats gestionados por IA</p></div>

          <!-- KPIs -->
          <div class="rep-kpi-grid" style="margin-bottom:20px;">
            <div v-for="k in kpisConv" :key="k.label" class="ide-ia-card rep-kpi">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span style="font-size:11px;color:#64748b;font-weight:600;">{{ k.label }}</span>
                <span style="font-size:16px;">{{ k.icon }}</span>
              </div>
              <div style="font-size:26px;font-weight:900;letter-spacing:-1px;" :style="{ color: k.color }">{{ k.value }}</div>
            </div>
          </div>

          <!-- Score + Estado -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">

            <!-- Distribución lead score -->
            <div class="ide-ia-card">
              <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:14px;">Calificación de leads</div>
              <div style="display:flex;flex-direction:column;gap:10px;">
                <div v-for="tier in leadTiers" :key="tier.label" style="display:flex;align-items:center;gap:10px;">
                  <span style="font-size:13px;width:14px;flex-shrink:0;">{{ tier.icon }}</span>
                  <span style="font-size:12px;color:#cbd5e1;min-width:70px;">{{ tier.label }}</span>
                  <div class="score-bar" style="flex:1;height:10px;border-radius:5px;">
                    <div :style="{ width: metricas && metricas.total > 0 ? Math.round((tier.value/metricas.total)*100)+'%' : '0%', height:'100%', background: tier.color, borderRadius:'5px', transition:'width 0.4s' }"></div>
                  </div>
                  <span style="font-size:12px;font-weight:700;min-width:28px;text-align:right;" :style="{ color: tier.color }">{{ tier.value }}</span>
                </div>
              </div>
              <div v-if="metricas && metricas.scorePromedio > 0" style="margin-top:14px;padding-top:12px;border-top:1px solid #1e293b;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:11px;color:#64748b;">Score promedio</span>
                <span style="font-size:18px;font-weight:800;color:#818cf8;">{{ metricas.scorePromedio }}</span>
              </div>
            </div>

            <!-- Estado conversaciones -->
            <div class="ide-ia-card">
              <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:14px;">Estado de conversaciones</div>
              <div v-if="!metricas || metricas.total === 0" style="color:#475569;font-size:13px;text-align:center;padding:20px;">Sin datos en el período</div>
              <div v-else style="display:flex;flex-direction:column;gap:10px;">
                <div v-for="est in estadosConv" :key="est.label" style="display:flex;align-items:center;gap:10px;">
                  <div :style="{ width:'8px', height:'8px', borderRadius:'50%', background: est.color, flexShrink:0 }"></div>
                  <span style="font-size:12px;color:#cbd5e1;flex:1;">{{ est.label }}</span>
                  <div class="score-bar" style="flex:1;height:8px;border-radius:4px;">
                    <div :style="{ width: metricas.total > 0 ? Math.round((est.value/metricas.total)*100)+'%' : '0%', height:'100%', background: est.color, borderRadius:'4px', transition:'width 0.4s' }"></div>
                  </div>
                  <span style="font-size:12px;font-weight:700;min-width:28px;text-align:right;color:#f1f5f9;">{{ est.value }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Intenciones + Sentimientos -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">

            <div class="ide-ia-card">
              <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:14px;">Intenciones detectadas</div>
              <div v-if="!intencionesArr.length" style="color:#475569;font-size:13px;text-align:center;padding:20px;">Sin datos en el período</div>
              <div v-else style="display:flex;flex-direction:column;gap:8px;">
                <div v-for="item in intencionesArr" :key="item.label" style="display:flex;align-items:center;gap:10px;">
                  <span style="font-size:13px;flex-shrink:0;">{{ item.icon }}</span>
                  <span style="font-size:12px;color:#cbd5e1;min-width:80px;">{{ item.label }}</span>
                  <div class="score-bar" style="flex:1;height:8px;border-radius:4px;">
                    <div :style="{ width: totalIntenciones > 0 ? Math.round((item.value/totalIntenciones)*100)+'%' : '0%', height:'100%', background:'#6366f1', borderRadius:'4px', transition:'width 0.4s' }"></div>
                  </div>
                  <span style="font-size:11px;color:#818cf8;font-weight:700;min-width:24px;text-align:right;">{{ item.value }}</span>
                </div>
              </div>
            </div>

            <div class="ide-ia-card">
              <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:14px;">Sentimiento del paciente</div>
              <div v-if="!sentimientosArr.length" style="color:#475569;font-size:13px;text-align:center;padding:20px;">Sin datos en el período</div>
              <div v-else style="display:flex;flex-direction:column;gap:10px;">
                <div v-for="item in sentimientosArr" :key="item.label" style="display:flex;align-items:center;gap:10px;">
                  <span style="font-size:13px;flex-shrink:0;">{{ item.icon }}</span>
                  <span style="font-size:12px;color:#cbd5e1;min-width:80px;">{{ item.label }}</span>
                  <div class="score-bar" style="flex:1;height:8px;border-radius:4px;">
                    <div :style="{ width: totalSentimientos > 0 ? Math.round((item.value/totalSentimientos)*100)+'%' : '0%', height:'100%', background: item.color, borderRadius:'4px', transition:'width 0.4s' }"></div>
                  </div>
                  <span style="font-size:11px;font-weight:700;min-width:24px;text-align:right;" :style="{ color: item.color }">{{ item.value }}</span>
                </div>
              </div>
              <div v-if="metricas && metricas.tiempoRespuestaSegundos > 0" style="margin-top:14px;padding-top:12px;border-top:1px solid #1e293b;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:11px;color:#64748b;">Tiempo respuesta IA</span>
                <span style="font-size:18px;font-weight:800;color:#22c55e;">{{ metricas.tiempoRespuestaSegundos }}s</span>
              </div>
            </div>

          </div>
        </template>

        <!-- ── CONSULTAS ── -->
        <template v-else-if="seccion === 'consultas'">
          <div class="ide-sec-hd"><h2>Consultas Médicas</h2><p>Rendimiento de la agenda y conversión de pacientes en el período</p></div>

          <!-- KPIs consultas -->
          <div class="rep-kpi-grid" style="margin-bottom:20px;">
            <div v-for="k in kpisConsultas" :key="k.label" class="ide-ia-card rep-kpi">
              <span style="font-size:11px;color:#64748b;font-weight:600;display:block;margin-bottom:8px;">{{ k.label }}</span>
              <div style="font-size:26px;font-weight:900;letter-spacing:-1px;margin-bottom:4px;" :style="{ color: k.color }">{{ k.value }}</div>
              <span style="font-size:10px;color:#475569;">{{ k.sub }}</span>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">

            <!-- Estado consultas -->
            <div class="ide-ia-card">
              <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:14px;">Estado de consultas</div>
              <div v-if="!consultas || consultas.total === 0" style="color:#475569;font-size:13px;text-align:center;padding:20px;">Sin consultas en el período</div>
              <div v-else style="display:flex;flex-direction:column;gap:10px;">
                <div v-for="est in estadosConsulta" :key="est.label" style="display:flex;align-items:center;gap:10px;">
                  <div :style="{ width:'8px', height:'8px', borderRadius:'50%', background: est.color, flexShrink:0 }"></div>
                  <span style="font-size:12px;color:#cbd5e1;flex:1;">{{ est.label }}</span>
                  <div class="score-bar" style="flex:1;height:8px;border-radius:4px;">
                    <div :style="{ width: consultas.total > 0 ? Math.round((est.value/consultas.total)*100)+'%' : '0%', height:'100%', background: est.color, borderRadius:'4px', transition:'width 0.4s' }"></div>
                  </div>
                  <span style="font-size:11px;font-weight:700;min-width:32px;text-align:right;" :style="{ color: est.color }">
                    {{ est.value }} <span style="font-weight:400;color:#475569;">({{ consultas.total > 0 ? Math.round((est.value/consultas.total)*100) : 0 }}%)</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Origen de consultas -->
            <div class="ide-ia-card">
              <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:14px;">Origen de consultas</div>
              <div v-if="!consultas || consultas.total === 0" style="color:#475569;font-size:13px;text-align:center;padding:20px;">Sin datos en el período</div>
              <div v-else>
                <div style="display:flex;gap:12px;margin-bottom:16px;">
                  <div style="flex:1;text-align:center;padding:16px;background:#0f172a;border-radius:10px;">
                    <div style="font-size:28px;font-weight:900;color:#6366f1;">{{ consultas.porOrigenRegistro.ia }}</div>
                    <div style="font-size:11px;color:#64748b;margin-top:4px;">Agendadas por IA</div>
                  </div>
                  <div style="flex:1;text-align:center;padding:16px;background:#0f172a;border-radius:10px;">
                    <div style="font-size:28px;font-weight:900;color:#22c55e;">{{ consultas.porOrigenRegistro.staff }}</div>
                    <div style="font-size:11px;color:#64748b;margin-top:4px;">Agendadas por Staff</div>
                  </div>
                </div>
                <div v-if="consultas.total > 0">
                  <div style="font-size:11px;color:#64748b;margin-bottom:6px;">Proporción IA vs Staff</div>
                  <div style="height:10px;border-radius:5px;background:#1e293b;overflow:hidden;display:flex;">
                    <div :style="{ width: Math.round((consultas.porOrigenRegistro.ia/consultas.total)*100)+'%', height:'100%', background:'#6366f1', transition:'width 0.4s' }"></div>
                    <div :style="{ flex:1, height:'100%', background:'#22c55e' }"></div>
                  </div>
                  <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:10px;color:#475569;">
                    <span>IA {{ Math.round((consultas.porOrigenRegistro.ia/consultas.total)*100) }}%</span>
                    <span>Staff {{ Math.round((consultas.porOrigenRegistro.staff/consultas.total)*100) }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Por especialista -->
          <div class="ide-ia-card" style="margin-bottom:16px;">
            <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:14px;">Consultas por especialista</div>
            <div v-if="!consultas || !consultas.porEspecialista || consultas.porEspecialista.length === 0" style="color:#475569;font-size:13px;text-align:center;padding:20px;">Sin especialistas con consultas en el período</div>
            <div v-else style="display:flex;flex-direction:column;gap:8px;">
              <div v-for="esp in consultas.porEspecialista" :key="esp.id" style="display:flex;align-items:center;gap:12px;">
                <div style="width:32px;height:32px;border-radius:50%;background:#312e81;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                </div>
                <span style="font-size:13px;color:#e2e8f0;flex:1;font-weight:600;">{{ esp.nombre }}</span>
                <div class="score-bar" style="flex:1;height:8px;border-radius:4px;">
                  <div :style="{ width: maxEsp > 0 ? Math.round((esp.total/maxEsp)*100)+'%' : '0%', height:'100%', background:'#818cf8', borderRadius:'4px', transition:'width 0.4s' }"></div>
                </div>
                <span style="font-size:13px;font-weight:800;color:#818cf8;min-width:24px;text-align:right;">{{ esp.total }}</span>
              </div>
            </div>
          </div>

          <!-- Por servicio -->
          <div class="ide-ia-card">
            <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:14px;">Consultas por servicio</div>
            <div v-if="!consultas || !consultas.porServicio || consultas.porServicio.length === 0" style="color:#475569;font-size:13px;text-align:center;padding:20px;">Sin datos en el período</div>
            <div v-else style="display:flex;flex-direction:column;gap:8px;">
              <div v-for="svc in consultas.porServicio" :key="svc.nombre" style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:12px;color:#cbd5e1;flex:1;min-width:120px;">{{ svc.nombre }}</span>
                <div class="score-bar" style="flex:1;height:8px;border-radius:4px;">
                  <div :style="{ width: maxSvc > 0 ? Math.round((svc.total/maxSvc)*100)+'%' : '0%', height:'100%', background:'#22c55e', borderRadius:'4px', transition:'width 0.4s' }"></div>
                </div>
                <span style="font-size:13px;font-weight:800;color:#22c55e;min-width:24px;text-align:right;">{{ svc.total }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- ── AGENTES ── -->
        <template v-else-if="seccion === 'agentes'">
          <div class="ide-sec-hd"><h2>Rendimiento por Agente</h2><p>Métricas individuales de cada agente IA</p></div>

          <div class="rep-kpi-grid" style="margin-bottom:20px;">
            <div v-for="k in kpisAgentes" :key="k.label" class="ide-ia-card rep-kpi">
              <span style="font-size:11px;color:#64748b;font-weight:600;display:block;margin-bottom:8px;">{{ k.label }}</span>
              <div style="font-size:26px;font-weight:900;letter-spacing:-1px;" :style="{ color: k.color }">{{ k.value }}</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
            <div v-for="ag in agentes" :key="ag.id" class="ide-ia-card">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                <div class="rep-ag-avatar" :style="{ background: ag.color+'22', color: ag.color, width:'40px', height:'40px', borderRadius:'10px', fontSize:'18px' }">{{ ag.avatar }}</div>
                <div style="flex:1;">
                  <div style="font-size:14px;font-weight:800;color:#f1f5f9;">{{ ag.nombre }}</div>
                  <div :style="{ fontSize:'10px', fontWeight:600, color: ag.activo ? '#22c55e' : '#ef4444' }">{{ ag.activo ? '● Activo' : '● Inactivo' }}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:11px;color:#64748b;">{{ ag.modelo }}</div>
                  <div style="font-size:10px;color:#475569;margin-top:2px;text-transform:capitalize;">{{ ag.modoOperacion || 'hybrid' }}</div>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;">
                <div class="rep-ag-metric"><div style="font-size:14px;font-weight:800;color:#818cf8;">{{ ag.totalConversaciones || 0 }}</div><div style="font-size:9px;color:#64748b;">Conversaciones</div></div>
                <div class="rep-ag-metric"><div style="font-size:14px;font-weight:800;color:#22c55e;">{{ ag.totalMensajes || 0 }}</div><div style="font-size:9px;color:#64748b;">Mensajes</div></div>
                <div class="rep-ag-metric">
                  <div style="font-size:14px;font-weight:800;color:#f59e0b;">
                    {{ ag.totalConversaciones > 0 ? Math.round((ag.totalMensajes||0)/(ag.totalConversaciones||1)) : 0 }}
                  </div>
                  <div style="font-size:9px;color:#64748b;">Msg/conv</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <span style="font-size:11px;color:#64748b;text-transform:capitalize;">{{ ag.tono || 'profesional' }}</span>
                <span style="font-size:10px;color:#475569;">{{ ag.idioma || 'español' }}</span>
              </div>
            </div>
          </div>

          <div class="ide-ia-card">
            <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:14px;">Tabla comparativa</div>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#161d2f;">
                  <th v-for="h in ['Agente','Conv.','Mensajes','Msg/Conv','Modelo','Estado']" :key="h" style="padding:8px 12px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #334155;">{{ h }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ag in agentes" :key="ag.id" style="border-bottom:1px solid #1e3a5f22;">
                  <td style="padding:10px 12px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <div class="rep-ag-avatar" :style="{ background: ag.color+'22', color: ag.color }">{{ ag.avatar }}</div>
                      <span style="font-size:12px;font-weight:700;color:#e2e8f0;">{{ ag.nombre }}</span>
                    </div>
                  </td>
                  <td style="padding:10px 12px;font-size:13px;font-weight:700;color:#f1f5f9;">{{ ag.totalConversaciones || 0 }}</td>
                  <td style="padding:10px 12px;font-size:12px;color:#94a3b8;">{{ ag.totalMensajes || 0 }}</td>
                  <td style="padding:10px 12px;font-size:12px;color:#f59e0b;font-weight:700;">
                    {{ ag.totalConversaciones > 0 ? Math.round((ag.totalMensajes||0)/(ag.totalConversaciones||1)) : 0 }}
                  </td>
                  <td style="padding:10px 12px;font-size:11px;color:#64748b;">{{ ag.modelo }}</td>
                  <td style="padding:10px 12px;">
                    <span :style="{ fontSize:'11px', fontWeight:700, color: ag.activo ? '#22c55e' : '#ef4444' }">{{ ag.activo ? '● Activo' : '● Inactivo' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<script>
const SVGS = {
  grid:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  inbox:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
  calendar:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  bot:     `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
}

const INTENCION_META = {
  RESERVAR:  { label: 'Reservar',   icon: '📅' },
  INFORMAR:  { label: 'Informarse', icon: '💬' },
  CANCELAR:  { label: 'Cancelar',   icon: '❌' },
  QUEJAR:    { label: 'Queja',      icon: '😤' },
  OTRO:      { label: 'Otro',       icon: '📋' },
}
const SENTIMIENTO_META = {
  POSITIVO:   { label: 'Positivo',   icon: '😊', color: '#22c55e' },
  NEUTRAL:    { label: 'Neutral',    icon: '😐', color: '#94a3b8' },
  NEGATIVO:   { label: 'Negativo',   icon: '😞', color: '#f59e0b' },
  FRUSTRADO:  { label: 'Frustrado', icon: '😤', color: '#ef4444' },
}

function periodoFechas(periodo) {
  const hoy = new Date()
  const fmt = d => d.toISOString().slice(0, 10)
  const hasta = fmt(hoy)
  const dias = { 'Hoy': 0, 'Semana': 7, 'Mes': 30, 'Trimestre': 90, 'Año': 365 }
  const n = dias[periodo] ?? 7
  const desde = new Date(hoy)
  desde.setDate(desde.getDate() - n)
  return { desde: fmt(desde), hasta }
}

export default {
  name: 'Reportes',
  data: () => ({
    seccion: 'resumen',
    periodo: 'Semana',
    loading: false,
    agentes: [],
    metricas: null,
    consultas: null,
    periodos: ['Hoy', 'Semana', 'Mes', 'Trimestre', 'Año'],
    secciones: [
      { id: 'resumen',        label: 'Resumen',       svg: SVGS.grid     },
      { id: 'conversaciones', label: 'Conversaciones', svg: SVGS.inbox    },
      { id: 'consultas',      label: 'Consultas',      svg: SVGS.calendar },
      { id: 'agentes',        label: 'Agentes',        svg: SVGS.bot      },
    ],
  }),

  computed: {
    maxConv() { return Math.max(...this.agentes.map(a => a.totalConversaciones || 0), 1) },
    totalConv() { return this.agentes.reduce((s, a) => s + (a.totalConversaciones || 0), 0) },
    activeCount() { return this.agentes.filter(a => a.activo).length },

    actividadPorDia() { return (this.metricas && this.metricas.actividadPorDia) || [] },
    maxActividad() { return Math.max(...this.actividadPorDia.map(d => d.total), 1) },

    // ── Resumen ──
    kpisResumen() {
      const m = this.metricas || {}
      const c = this.consultas || {}
      return [
        { label: 'Conversaciones',      value: m.total || 0,          color: '#6366f1', sub: 'En el período' },
        { label: 'Resueltas',           value: m.resueltas || 0,       color: '#22c55e', sub: `${m.porcentajeResolucion || 0}% resolución` },
        { label: 'Consultas agendadas', value: c.total || 0,           color: '#818cf8', sub: 'En el período' },
        { label: 'Agendadas por IA',    value: c.porOrigenRegistro ? c.porOrigenRegistro.ia : 0, color: '#a78bfa', sub: 'Conversión IA→consulta' },
        { label: 'Score promedio',      value: m.scorePromedio ? m.scorePromedio + '/100' : '—', color: '#f59e0b', sub: 'Calidad conversaciones' },
        { label: 'Hot Leads',           value: m.hotLeads || 0,        color: '#22c55e', sub: 'Score ≥ 70' },
        { label: 'Tasa cancelación',    value: c.tasaCancelacion !== undefined ? c.tasaCancelacion + '%' : '—', color: c.tasaCancelacion > 20 ? '#ef4444' : '#94a3b8', sub: 'Consultas canceladas' },
        { label: 'Tiempo respuesta IA', value: m.tiempoRespuestaSegundos ? m.tiempoRespuestaSegundos + 's' : '—', color: '#22c55e', sub: 'Promedio por mensaje' },
      ]
    },

    // ── Conversaciones ──
    kpisConv() {
      const m = this.metricas || {}
      return [
        { label: 'Total',      value: m.total || 0,     color: '#6366f1', icon: '💬' },
        { label: 'Abiertas',   value: m.abiertas || 0,  color: '#f59e0b', icon: '🔓' },
        { label: 'Resueltas',  value: m.resueltas || 0, color: '#22c55e', icon: '✅' },
        { label: 'Escaladas',  value: m.escaladas || 0, color: '#ef4444', icon: '🔺' },
      ]
    },
    leadTiers() {
      const m = this.metricas || {}
      return [
        { label: 'Hot (≥70)',    value: m.hotLeads  || 0, color: '#22c55e', icon: '🔥' },
        { label: 'Warm (40-69)', value: m.warmLeads || 0, color: '#f59e0b', icon: '🌡' },
        { label: 'Frío (<40)',   value: m.coldLeads || 0, color: '#60a5fa', icon: '❄️' },
        { label: 'Sin score',    value: m.sinScore  || 0, color: '#475569', icon: '—' },
      ]
    },
    estadosConv() {
      const m = this.metricas || {}
      return [
        { label: 'Abiertas',  value: m.abiertas  || 0, color: '#f59e0b' },
        { label: 'Resueltas', value: m.resueltas || 0, color: '#22c55e' },
        { label: 'Escaladas', value: m.escaladas || 0, color: '#ef4444' },
      ]
    },
    intencionesArr() {
      if (!this.metricas || !this.metricas.intenciones) return []
      return Object.entries(this.metricas.intenciones)
        .map(([k, v]) => ({ label: (INTENCION_META[k] || {}).label || k, icon: (INTENCION_META[k] || {}).icon || '?', value: v }))
        .sort((a, b) => b.value - a.value)
    },
    sentimientosArr() {
      if (!this.metricas || !this.metricas.sentimientos) return []
      return Object.entries(this.metricas.sentimientos)
        .map(([k, v]) => ({ label: (SENTIMIENTO_META[k] || {}).label || k, icon: (SENTIMIENTO_META[k] || {}).icon || '?', color: (SENTIMIENTO_META[k] || {}).color || '#64748b', value: v }))
        .sort((a, b) => b.value - a.value)
    },
    totalIntenciones() { return this.intencionesArr.reduce((s, i) => s + i.value, 0) },
    totalSentimientos() { return this.sentimientosArr.reduce((s, i) => s + i.value, 0) },

    // ── Consultas ──
    kpisConsultas() {
      const c = this.consultas || {}
      return [
        { label: 'Total consultas',    value: c.total       || 0, color: '#6366f1', sub: 'En el período' },
        { label: 'Pendientes',         value: c.pendientes  || 0, color: '#f59e0b', sub: 'Por confirmar' },
        { label: 'Confirmadas',        value: c.confirmadas || 0, color: '#22c55e', sub: 'Confirmadas' },
        { label: 'Completadas',        value: c.completadas || 0, color: '#818cf8', sub: 'Atendidas' },
        { label: 'Canceladas',         value: c.canceladas  || 0, color: '#ef4444', sub: 'Tasa: ' + (c.tasaCancelacion || 0) + '%' },
        { label: 'Agendadas por IA',   value: c.porOrigenRegistro ? c.porOrigenRegistro.ia : 0, color: '#a78bfa', sub: 'Conversión directa' },
      ]
    },
    estadosConsulta() {
      const c = this.consultas || {}
      return [
        { label: 'Pendientes',  value: c.pendientes  || 0, color: '#f59e0b' },
        { label: 'Confirmadas', value: c.confirmadas || 0, color: '#22c55e' },
        { label: 'Completadas', value: c.completadas || 0, color: '#818cf8' },
        { label: 'Canceladas',  value: c.canceladas  || 0, color: '#ef4444' },
      ]
    },
    maxEsp() {
      if (!this.consultas || !this.consultas.porEspecialista) return 1
      return Math.max(...this.consultas.porEspecialista.map(e => e.total), 1)
    },
    maxSvc() {
      if (!this.consultas || !this.consultas.porServicio) return 1
      return Math.max(...this.consultas.porServicio.map(s => s.total), 1)
    },

    // ── Agentes ──
    kpisAgentes() {
      return [
        { label: 'Agentes activos',  value: this.activeCount, color: '#22c55e' },
        { label: 'Conv. históricas', value: this.totalConv,   color: '#6366f1' },
        { label: 'Mensajes totales', value: this.agentes.reduce((s, a) => s + (a.totalMensajes || 0), 0), color: '#f59e0b' },
        { label: 'Modelos usados',   value: [...new Set(this.agentes.map(a => a.modelo))].length || 0, color: '#8b5cf6' },
      ]
    },
  },

  async mounted() {
    await this.cargar()
  },

  methods: {
    barH(val, max) {
      if (!max || max === 0) return 2
      return Math.max(Math.round((val / max) * 72), val > 0 ? 4 : 2)
    },

    async setPeriodo(p) {
      this.periodo = p
      await this.cargar()
    },

    async cargar() {
      this.loading = true
      try {
        const { desde, hasta } = periodoFechas(this.periodo)
        const [agentes, metricas, consultas] = await Promise.all([
          this.$service.list('agentes'),
          this.$service.list(`conversaciones/metricas?desde=${desde}&hasta=${hasta}`),
          this.$service.list(`citas-medicas/estadisticas?desde=${desde}&hasta=${hasta}`),
        ])
        this.agentes   = agentes  || []
        this.metricas  = metricas
        this.consultas = consultas
      } catch (e) {
        console.error('Error cargando reportes', e)
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.rep-filters {
  padding: 10px 20px; border-bottom: 1px solid #1e3a5f44;
  display: flex; gap: 8px; align-items: center; flex-shrink: 0; flex-wrap: wrap;
}
.rep-period-btn {
  padding: 4px 12px; border-radius: 999px; border: 1px solid #334155;
  background: transparent; color: #64748b; font-size: 11px; font-weight: 600;
  cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.rep-period-btn--active { border-color: #6366f155; background: #6366f122; color: #818cf8; }

.rep-kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px,1fr)); gap: 12px; margin-bottom: 20px; }
.rep-kpi { padding: 14px 16px; }

.rep-ag-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0; border-bottom: 1px solid #1e3a5f22;
}
.rep-ag-row:last-child { border-bottom: none; }
.rep-ag-avatar { width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
.rep-ag-metric { text-align: center; padding: 8px; background: #0f172a; border-radius: 8px; }

.score-bar { height: 6px; border-radius: 3px; background: #1e293b; overflow: hidden; flex: 1; }

.rep-mini-spinner {
  width: 12px; height: 12px;
  border: 2px solid #334155; border-top-color: #6366f1;
  border-radius: 50%; animation: rspin .6s linear infinite;
}
@keyframes rspin { to { transform: rotate(360deg); } }
</style>
