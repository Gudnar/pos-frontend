<template>
  <div class="ide-mod">

    <!-- Sub-nav -->
    <div class="ide-subnav">
      <div class="ide-sn-hd">
        <div class="ide-sn-ico" style="background:linear-gradient(135deg,#c96442,#e8956d);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </div>
        <div>
          <div class="ide-sn-title">Configuración</div>
          <div class="ide-sn-sub" style="color:#c96442;">Sistema</div>
        </div>
      </div>

      <button v-for="s in secciones" :key="s.id" class="ide-sn-btn" :class="seccion === s.id ? 'ide-sn-btn--o' : ''" @click="seccion = s.id">
        <span v-html="s.svg" style="flex-shrink:0; display:flex;"></span>
        {{ s.label }}
        <span v-if="s.id === 'whatsapp' && waStatus.valida" style="margin-left:auto; width:7px; height:7px; border-radius:50%; background:#22c55e; flex-shrink:0;"></span>
      </button>
    </div>

    <!-- Content -->
    <div class="ide-body">

      <!-- SUPER_ADMIN without a clienteId context -->
      <div v-if="!clienteId" style="padding:40px 0; text-align:center; color:var(--t5);">
        <div style="font-size:32px; margin-bottom:12px;">🔐</div>
        <div style="font-size:15px; font-weight:700; color:var(--t4); margin-bottom:6px;">Selecciona un cliente</div>
        <div style="font-size:12px;">La configuración se gestiona por cliente. Accede desde la sección <strong style="color:#818cf8;">Clientes</strong>.</div>
      </div>

      <template v-else>

      <!-- ── API Key ── -->
      <template v-if="seccion === 'api'">
        <div class="ide-sec-hd"><h2>Configuración API Anthropic</h2><p>Conecta Claude para activar todos los agentes IA</p></div>
        <div style="max-width:620px;">
          <div class="cfg-info-card">
            <div style="font-size:12px; font-weight:700; color:#e8956d; margin-bottom:8px;">🔑 ¿Cómo obtener tu API Key?</div>
            <div v-for="(step, i) in pasos" :key="i" style="display:flex; gap:10px; margin-bottom:6px;">
              <div class="cfg-step-num">{{ i+1 }}</div>
              <span style="font-size:12px; color:var(--t3);"><strong style="color:var(--t2);">{{ step.bold }}:</strong> {{ step.text }}</span>
            </div>
            <a href="https://console.anthropic.com" target="_blank" style="display:inline-flex; align-items:center; gap:5px; margin-top:8px; font-size:11px; color:#e8956d; font-weight:600; text-decoration:none;">
              Ir a console.anthropic.com ↗
            </a>
          </div>

          <div class="cfg-form-row">
            <div class="ide-field">
              <label>API Key de Anthropic *</label>
              <div style="position:relative;">
                <input v-model="apiKey" :type="showKey ? 'text' : 'password'" class="ide-input" placeholder="sk-ant-api03-xxxxxxxxxxxxxxxx" />
                <button class="cfg-eye" @click="showKey = !showKey" type="button">{{ showKey ? '🙈' : '👁' }}</button>
              </div>
            </div>
            <div class="ide-field">
              <label>Modelo por defecto</label>
              <select v-model="modelo" class="ide-select">
                <option value="claude-haiku-4-5">Claude Haiku 4.5 — Rápido y económico</option>
                <option value="claude-sonnet-4-6">Claude Sonnet 4.6 — Equilibrio calidad/costo</option>
                <option value="claude-opus-4-7">Claude Opus 4.7 — Máxima calidad</option>
              </select>
            </div>
          </div>

          <div v-if="resultadoVerif" class="cfg-result" :class="resultadoVerif.ok ? 'cfg-result--ok' : 'cfg-result--err'">{{ resultadoVerif.msg }}</div>

          <div style="display:flex; gap:8px; margin-top:16px;">
            <v-btn depressed :color="resultadoVerif && resultadoVerif.ok ? 'success' : 'primary'" :loading="verificando" @click="verificarKey" style="font-size:12px; border-radius:8px;">
              {{ verificando ? 'Verificando…' : 'Verificar API Key' }}
            </v-btn>
            <v-btn v-if="resultadoVerif && resultadoVerif.ok" depressed color="primary" :loading="guardando" @click="guardarApiKey" style="font-size:12px; border-radius:8px;">
              Guardar configuración
            </v-btn>
          </div>
        </div>
      </template>

      <!-- ── Auto-respuesta ── -->
      <template v-else-if="seccion === 'canales'">
        <div class="ide-sec-hd"><h2>Auto-respuesta por canal</h2><p>Activa o desactiva el agente IA en cada canal</p></div>
        <div style="max-width:520px;">
          <div class="ide-ia-card" style="margin-bottom:16px;">
            <div style="display:flex; flex-direction:column; gap:12px;">
              <div v-for="canal in canales" :key="canal.id" style="display:flex; align-items:center; gap:12px; padding:10px 12px; background:var(--bg-e); border-radius:8px; border:1px solid var(--b2);">
                <div style="font-size:20px; flex-shrink:0;">{{ canal.emoji }}</div>
                <span style="font-size:13px; color:var(--scroll); flex:1;">{{ canal.label }}</span>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:11px;" :style="{ color: canal.activo ? '#22c55e' : '#ef4444' }">{{ canal.activo ? 'Activo' : 'Inactivo' }}</span>
                  <div class="ide-toggle" :class="{ 'ide-toggle--on': canal.activo }" @click="canal.activo = !canal.activo"><div></div></div>
                </div>
              </div>
            </div>
          </div>
          <div style="display:flex; justify-content:flex-end;">
            <v-btn depressed color="primary" :loading="guardando" @click="guardarCanales" style="font-size:12px; border-radius:8px;">Guardar canales</v-btn>
          </div>
        </div>
      </template>

      <!-- ── Modelos ── -->
      <template v-else-if="seccion === 'modelos'">
        <div class="ide-sec-hd"><h2>Modelos disponibles</h2><p>Referencia de capacidades de cada modelo Claude</p></div>
        <div style="display:flex; flex-direction:column; gap:12px; max-width:620px;">
          <div v-for="m in modelosInfo" :key="m.id" class="ide-ia-card" :style="{ border: modelo === m.id ? '1px solid #c9644244' : '1px solid var(--b2)' }">
            <div style="display:flex; align-items:flex-start; gap:14px;">
              <div style="width:40px; height:40px; border-radius:10px; background:linear-gradient(135deg,#c96442,#e8956d); display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">{{ m.emoji }}</div>
              <div style="flex:1;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                  <span style="font-size:13px; font-weight:700; color:var(--t2);">{{ m.nombre }}</span>
                  <span v-if="m.recomendado" style="font-size:10px; font-weight:700; background:#22c55e22; color:#22c55e; padding:2px 7px; border-radius:999px;">Recomendado</span>
                </div>
                <div style="font-size:11px; color:var(--t4); line-height:1.6; margin-bottom:10px;">{{ m.desc }}</div>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                  <span v-for="tag in m.tags" :key="tag" style="font-size:10px; font-weight:600; background:#6366f122; color:#818cf8; padding:2px 8px; border-radius:999px;">{{ tag }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ── WhatsApp Cloud ── -->
      <template v-else-if="seccion === 'whatsapp'">
        <div class="ide-sec-hd"><h2>WhatsApp Cloud API</h2><p>Conecta tu número de WhatsApp Business para que los agentes IA atiendan conversaciones</p></div>
        <div style="max-width:660px;">

          <!-- Status banner -->
          <div v-if="waStatus.valida" class="cfg-result cfg-result--ok" style="margin-bottom:20px; display:flex; align-items:center; gap:10px;">
            <span style="font-size:16px;">✅</span>
            <div>
              <div style="font-weight:700;">Canal conectado</div>
              <div v-if="waStatus.info" style="font-size:11px; margin-top:2px;">
                {{ waStatus.info.verifiedName }} · {{ waStatus.info.displayPhone }} · Calidad: {{ waStatus.info.qualityRating || 'N/D' }}
              </div>
            </div>
          </div>

          <!-- Setup guide -->
          <div class="cfg-info-card" style="margin-bottom:20px;">
            <div style="font-size:12px; font-weight:700; color:#25D366; margin-bottom:10px;">📱 Configuración en Meta for Developers</div>
            <div v-for="(step, i) in pasosWa" :key="i" style="display:flex; gap:10px; margin-bottom:8px; font-size:12px; color:var(--t3);">
              <div class="cfg-step-num" style="background:#25D36633; color:#25D366;">{{ i+1 }}</div>
              <span><strong style="color:var(--t2);">{{ step.bold }}:</strong> {{ step.text }}</span>
            </div>
            <div style="margin-top:12px; padding:10px 12px; background:var(--bg-e); border-radius:8px; border:1px solid #25D36622;">
              <div style="font-size:11px; font-weight:700; color:var(--t4); margin-bottom:6px;">URL del Webhook (copiar en Meta)</div>
              <div style="display:flex; align-items:center; gap:8px;">
                <code style="font-size:11px; color:#25D366; flex:1; word-break:break-all;">{{ webhookUrl }}</code>
                <button class="cfg-copy-btn" @click="copiar(webhookUrl)">Copiar</button>
              </div>
              <div style="margin-top:8px; font-size:11px; font-weight:700; color:var(--t4); margin-bottom:4px;">Token de verificación</div>
              <div style="display:flex; align-items:center; gap:8px;">
                <code style="font-size:11px; color:#818cf8;">{{ waForm.verifyToken || 'ide_ia_verify_token' }}</code>
                <button class="cfg-copy-btn" @click="copiar(waForm.verifyToken || 'ide_ia_verify_token')">Copiar</button>
              </div>
            </div>
          </div>

          <!-- Credentials form -->
          <div class="ide-ia-card" style="margin-bottom:16px;">
            <div style="font-size:13px; font-weight:700; color:var(--t2); margin-bottom:14px;">Credenciales de la API</div>
            <div style="display:flex; flex-direction:column; gap:12px;">
              <div class="ide-field">
                <label>Access Token (token permanente o de sistema) *</label>
                <div style="position:relative;">
                  <input v-model="waForm.accessToken" :type="showWaToken ? 'text' : 'password'" class="ide-input" placeholder="EAAMKqRkf07MBQ…" />
                  <button class="cfg-eye" @click="showWaToken = !showWaToken" type="button">{{ showWaToken ? '🙈' : '👁' }}</button>
                </div>
              </div>
              <div class="cfg-form-row">
                <div class="ide-field">
                  <label>Phone Number ID *</label>
                  <input v-model="waForm.phoneNumberId" class="ide-input" placeholder="123456789012345" />
                  <div style="font-size:10px; color:var(--t5); margin-top:3px;">API → WhatsApp → Getting Started</div>
                </div>
                <div class="ide-field">
                  <label>WhatsApp Business Account ID</label>
                  <input v-model="waForm.wabaId" class="ide-input" placeholder="987654321098765" />
                  <div style="font-size:10px; color:var(--t5); margin-top:3px;">Business Manager → Configuración</div>
                </div>
              </div>
              <div class="ide-field">
                <label>Token de verificación del webhook</label>
                <input v-model="waForm.verifyToken" class="ide-input" placeholder="ide_ia_verify_token" />
                <div style="font-size:10px; color:var(--t5); margin-top:3px;">Puedes usar cualquier cadena — debe coincidir con lo que ingresas en Meta</div>
              </div>
            </div>
          </div>

          <!-- Test connection -->
          <div v-if="waTestResult" class="cfg-result" :class="waTestResult.valida ? 'cfg-result--ok' : 'cfg-result--err'" style="margin-bottom:12px;">
            {{ waTestResult.mensaje }}
            <div v-if="waTestResult.info" style="margin-top:6px; font-size:11px; opacity:0.9;">
              Número: {{ waTestResult.info.displayPhone }} · Estado: {{ waTestResult.info.status }} · Calidad: {{ waTestResult.info.qualityRating }}
            </div>
          </div>

          <div style="display:flex; gap:8px; margin-bottom:20px;">
            <v-btn depressed color="success" :loading="waTestando" :disabled="!waForm.accessToken || !waForm.phoneNumberId" @click="testConexionWa" style="font-size:12px; border-radius:8px; background:#25D36622 !important; color:#25D366 !important;">
              {{ waTestando ? 'Verificando…' : 'Probar conexión' }}
            </v-btn>
          </div>

          <!-- Agent assignment + enable -->
          <div class="ide-ia-card" style="margin-bottom:16px;">
            <div style="font-size:13px; font-weight:700; color:var(--t2); margin-bottom:14px;">Configuración del canal</div>
            <div style="display:flex; flex-direction:column; gap:14px;">
              <div class="ide-field">
                <label>Agente IA asignado a WhatsApp</label>
                <select v-model="waForm.agenteId" class="ide-select">
                  <option value="">— Sin agente asignado —</option>
                  <option v-for="ag in agentes" :key="ag.id" :value="ag.id">{{ ag.nombre }} ({{ ag.modelo }})</option>
                </select>
                <div style="font-size:10px; color:var(--t5); margin-top:3px;">Este agente responderá automáticamente los mensajes de WhatsApp</div>
              </div>
              <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:var(--bg-e); border-radius:8px; border:1px solid var(--b2);">
                <div>
                  <div style="font-size:13px; font-weight:700; color:var(--t2);">Canal WhatsApp activo</div>
                  <div style="font-size:11px; color:var(--t4); margin-top:2px;">El agente responderá mensajes entrantes automáticamente</div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-size:12px; font-weight:600;" :style="{ color: waForm.enabled ? '#22c55e' : '#ef4444' }">{{ waForm.enabled ? 'Activo' : 'Inactivo' }}</span>
                  <div class="ide-toggle" :class="{ 'ide-toggle--on': waForm.enabled }" @click="waForm.enabled = !waForm.enabled"><div></div></div>
                </div>
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; margin-bottom:24px;">
            <v-btn depressed color="primary" :loading="guardando" @click="guardarWa" style="font-size:12px; border-radius:8px;">
              Guardar configuración WhatsApp
            </v-btn>
          </div>

          <!-- Routing rules -->
          <div class="ide-ia-card" style="margin-bottom:16px;">
            <div style="font-size:13px; font-weight:700; color:var(--t2); margin-bottom:4px;">Enrutamiento por palabras clave</div>
            <div style="font-size:11px; color:var(--t4); margin-bottom:14px;">Dirige mensajes al agente correcto según palabras clave. Si ya hay una conversación abierta con el contacto, se mantiene ese agente.</div>

            <!-- Existing rules -->
            <div v-if="routingRules.length === 0" style="padding:12px; background:var(--bg-e); border-radius:8px; text-align:center; color:var(--t5); font-size:12px; margin-bottom:12px;">
              Sin reglas — todos los mensajes irán al agente por defecto
            </div>
            <div v-for="(regla, idx) in routingRules" :key="idx" style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--bg-e); border-radius:8px; margin-bottom:8px;">
              <div style="flex:1; min-width:0;">
                <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:5px;">
                  <span v-for="kw in regla.palabrasClave" :key="kw" style="padding:2px 8px; border-radius:12px; background:#6366f122; border:1px solid #6366f133; color:#818cf8; font-size:11px;">{{ kw }}</span>
                </div>
                <div style="font-size:11px; color:var(--t3);">
                  Agente: <strong style="color:var(--t2);">{{ nombreAgente(regla.agenteId) }}</strong>
                </div>
              </div>
              <button @click="eliminarRegla(idx)" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:16px; padding:4px; flex-shrink:0;" title="Eliminar regla">✕</button>
            </div>

            <!-- Add new rule -->
            <div style="border-top:1px solid var(--bg-c); padding-top:14px; margin-top:4px;">
              <div style="font-size:11px; font-weight:700; color:var(--t3); margin-bottom:10px; text-transform:uppercase; letter-spacing:0.05em;">Nueva regla</div>
              <div style="display:flex; flex-direction:column; gap:10px;">
                <div class="ide-field">
                  <label>Palabras clave (separadas por coma)</label>
                  <input v-model="routingNuevo.keywords" class="ide-input" placeholder="urgente, emergencia, dolor" @keydown.enter.prevent="agregarRegla" />
                  <div style="font-size:10px; color:var(--t5); margin-top:3px;">El mensaje será enrutado si contiene alguna de estas palabras</div>
                </div>
                <div class="ide-field">
                  <label>Agente destino</label>
                  <select v-model="routingNuevo.agenteId" class="ide-select">
                    <option value="">— Seleccionar agente —</option>
                    <option v-for="ag in agentes" :key="ag.id" :value="ag.id">{{ ag.nombre }}</option>
                  </select>
                </div>
                <div>
                  <v-btn depressed small :disabled="!routingNuevo.keywords.trim() || !routingNuevo.agenteId" @click="agregarRegla" style="font-size:12px; border-radius:8px;">
                    Agregar regla
                  </v-btn>
                </div>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; margin-top:14px;">
              <v-btn depressed color="primary" :loading="guardandoRouting" @click="guardarRoutingRules" style="font-size:12px; border-radius:8px;">
                Guardar reglas
              </v-btn>
            </div>
          </div>

        </div>
      </template>

      <template v-else-if="seccion === 'facebook'">
        <div class="ide-sec-hd"><h2>Facebook</h2><p>Conecta tu Página de Facebook para responder Mensajes (Messenger) y comentarios en publicaciones con IA</p></div>
        <div style="max-width:660px;">

          <!-- Status -->
          <div v-if="fbStatus.valida" class="cfg-result cfg-result--ok" style="margin-bottom:20px; display:flex; align-items:center; gap:10px;">
            <span style="font-size:16px;">✅</span>
            <div>
              <div style="font-weight:700;">Página conectada</div>
              <div v-if="fbStatus.info" style="font-size:11px; margin-top:2px;">
                {{ fbStatus.info.nombre }} · {{ fbStatus.info.seguidores?.toLocaleString() }} seguidores
              </div>
            </div>
          </div>

          <!-- Setup guide -->
          <div class="cfg-info-card" style="margin-bottom:20px; border-color:#1877f244;">
            <div style="font-size:12px; font-weight:700; color:#1877f2; margin-bottom:10px;">📘 Configuración en Meta for Developers</div>
            <div v-for="(step, i) in pasosFb" :key="i" style="display:flex; gap:10px; margin-bottom:8px; font-size:12px; color:var(--t3);">
              <div class="cfg-step-num" style="background:#1877f233; color:#1877f2;">{{ i+1 }}</div>
              <span><strong style="color:var(--t2);">{{ step.bold }}:</strong> {{ step.text }}</span>
            </div>
            <div style="margin-top:12px; padding:10px 12px; background:var(--bg-e); border-radius:8px; border:1px solid #1877f222;">
              <div style="font-size:11px; font-weight:700; color:var(--t4); margin-bottom:6px;">URL del Webhook de Facebook (copiar en Meta)</div>
              <div style="display:flex; align-items:center; gap:8px;">
                <code style="font-size:11px; color:#1877f2; flex:1; word-break:break-all;">{{ fbWebhookUrl }}</code>
                <button class="cfg-copy-btn" @click="copiar(fbWebhookUrl)">Copiar</button>
              </div>
              <div style="margin-top:8px; font-size:11px; font-weight:700; color:var(--t4); margin-bottom:4px;">Token de verificación</div>
              <div style="display:flex; align-items:center; gap:8px;">
                <code style="font-size:11px; color:#818cf8;">{{ fbForm.verifyToken || 'fb_verify_token' }}</code>
                <button class="cfg-copy-btn" @click="copiar(fbForm.verifyToken || 'fb_verify_token')">Copiar</button>
              </div>
            </div>
          </div>

          <!-- Credentials -->
          <div class="ide-ia-card" style="margin-bottom:16px;">
            <div style="font-size:13px; font-weight:700; color:var(--t2); margin-bottom:14px;">Credenciales de la Página</div>
            <div style="display:flex; flex-direction:column; gap:12px;">
              <div class="ide-field">
                <label>Page Access Token *</label>
                <div style="position:relative;">
                  <input v-model="fbForm.pageAccessToken" :type="showFbToken ? 'text' : 'password'" class="ide-input" placeholder="EAAMKqRkf07MBQ…" />
                  <button class="cfg-eye" @click="showFbToken = !showFbToken" type="button">{{ showFbToken ? '🙈' : '👁' }}</button>
                </div>
                <div style="font-size:10px; color:var(--t5); margin-top:3px;">Token de larga duración de la Página (no de usuario). Meta for Developers → Herramientas → Explorador de la API de Graph → generar token de página</div>
              </div>
              <div class="cfg-form-row">
                <div class="ide-field">
                  <label>Page ID *</label>
                  <input v-model="fbForm.pageId" class="ide-input" placeholder="123456789012345" />
                  <div style="font-size:10px; color:var(--t5); margin-top:3px;">Información de tu Página → Acerca de → ID de página</div>
                </div>
                <div class="ide-field">
                  <label>Token de verificación webhook</label>
                  <input v-model="fbForm.verifyToken" class="ide-input" placeholder="fb_verify_token" />
                </div>
              </div>
            </div>
          </div>

          <!-- Test -->
          <div v-if="fbTestResult" class="cfg-result" :class="fbTestResult.valida ? 'cfg-result--ok' : 'cfg-result--err'" style="margin-bottom:12px;">
            {{ fbTestResult.mensaje }}
            <div v-if="fbTestResult.info" style="margin-top:6px; font-size:11px; opacity:0.9;">
              {{ fbTestResult.info.nombre }} · {{ fbTestResult.info.seguidores?.toLocaleString() }} seguidores
            </div>
          </div>
          <div style="display:flex; gap:8px; margin-bottom:20px;">
            <v-btn depressed color="success" :loading="fbTestando" :disabled="!fbForm.pageAccessToken || !fbForm.pageId" @click="testConexionFb" style="font-size:12px; border-radius:8px; background:#1877f222 !important; color:#1877f2 !important;">
              {{ fbTestando ? 'Verificando…' : 'Probar conexión' }}
            </v-btn>
          </div>

          <!-- Agent config -->
          <div class="ide-ia-card" style="margin-bottom:16px;">
            <div style="font-size:13px; font-weight:700; color:var(--t2); margin-bottom:14px;">Agentes y comportamiento</div>
            <div style="display:flex; flex-direction:column; gap:14px;">
              <div class="cfg-form-row">
                <div class="ide-field">
                  <label>Agente para Messenger</label>
                  <select v-model="fbForm.messengerAgenteId" class="ide-select">
                    <option value="">— Sin agente —</option>
                    <option v-for="ag in agentes" :key="ag.id" :value="ag.id">{{ ag.nombre }}</option>
                  </select>
                  <div style="font-size:10px; color:var(--t5); margin-top:3px;">Responde mensajes directos a la Página</div>
                </div>
                <div class="ide-field">
                  <label>Agente para comentarios</label>
                  <select v-model="fbForm.commentsAgenteId" class="ide-select">
                    <option value="">— Igual que Messenger —</option>
                    <option v-for="ag in agentes" :key="ag.id" :value="ag.id">{{ ag.nombre }}</option>
                  </select>
                  <div style="font-size:10px; color:var(--t5); margin-top:3px;">Responde comentarios en publicaciones</div>
                </div>
              </div>
              <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--bg-e); border-radius:8px;">
                <div>
                  <div style="font-size:13px; font-weight:700; color:var(--t2);">Responder comentarios en publicaciones</div>
                  <div style="font-size:11px; color:var(--t4); margin-top:2px;">El agente comentará automáticamente en respuesta a cada nuevo comentario</div>
                </div>
                <div class="ide-toggle" :class="{ 'ide-toggle--on': fbForm.replyComments }" @click="fbForm.replyComments = !fbForm.replyComments"><div></div></div>
              </div>
              <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--bg-e); border-radius:8px;">
                <div>
                  <div style="font-size:13px; font-weight:700; color:var(--t2);">Canal activo</div>
                  <div style="font-size:11px; color:var(--t4); margin-top:2px;">Activa o pausa toda la integración con Facebook</div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-size:12px; font-weight:600;" :style="{ color: fbForm.enabled ? '#22c55e' : '#ef4444' }">{{ fbForm.enabled ? 'Activo' : 'Inactivo' }}</span>
                  <div class="ide-toggle" :class="{ 'ide-toggle--on': fbForm.enabled }" @click="fbForm.enabled = !fbForm.enabled"><div></div></div>
                </div>
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; margin-bottom:28px;">
            <v-btn depressed color="primary" :loading="guardando" @click="guardarFb" style="font-size:12px; border-radius:8px;">
              Guardar configuración Facebook
            </v-btn>
          </div>

          <!-- Publicaciones -->
          <div style="border-top:1px solid var(--bg-c); padding-top:24px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
              <div>
                <div style="font-size:14px; font-weight:700; color:var(--t2);">Publicaciones recientes</div>
                <div style="font-size:11px; color:var(--t4); margin-top:2px;">Asigna un agente específico a cada publicación para responder sus comentarios</div>
              </div>
              <v-btn depressed small :loading="fbPubsCargando" @click="cargarPublicaciones" style="font-size:12px; border-radius:8px;">
                {{ fbPublicaciones.length ? 'Actualizar' : 'Cargar publicaciones' }}
              </v-btn>
            </div>

            <!-- Error -->
            <div v-if="fbPubsError" class="cfg-result cfg-result--err" style="margin-bottom:12px;">{{ fbPubsError }}</div>

            <!-- Empty -->
            <div v-if="!fbPubsCargando && !fbPublicaciones.length && !fbPubsError" style="padding:20px; text-align:center; background:var(--bg-e); border-radius:10px; color:var(--t5); font-size:12px;">
              Haz clic en "Cargar publicaciones" para ver tus posts recientes
            </div>

            <!-- Post list -->
            <div style="display:flex; flex-direction:column; gap:10px;">
              <div v-for="pub in fbPublicaciones" :key="pub.id"
                style="display:flex; gap:12px; padding:12px 14px; background:var(--bg-e); border-radius:10px; border:1px solid var(--bg-c); align-items:flex-start;">

                <!-- Thumbnail -->
                <div style="flex-shrink:0; width:56px; height:56px; border-radius:8px; overflow:hidden; background:var(--bg-c); display:flex; align-items:center; justify-content:center;">
                  <img v-if="pub.imagen" :src="pub.imagen" style="width:100%; height:100%; object-fit:cover;" />
                  <span v-else style="font-size:22px;">📄</span>
                </div>

                <!-- Content -->
                <div style="flex:1; min-width:0;">
                  <div style="font-size:12px; color:var(--t2); line-height:1.4; margin-bottom:6px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
                    {{ pub.texto }}
                  </div>
                  <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                    <span style="font-size:10px; color:var(--t5);">{{ formatearFecha(pub.fechaPublicacion) }}</span>
                    <a v-if="pub.enlace" :href="pub.enlace" target="_blank" style="font-size:10px; color:#1877f2; text-decoration:none;">Ver publicación ↗</a>
                  </div>
                </div>

                <!-- Agent selector -->
                <div style="flex-shrink:0; min-width:170px;">
                  <div style="font-size:10px; font-weight:700; color:var(--t4); text-transform:uppercase; letter-spacing:.05em; margin-bottom:4px;">Agente para comentarios</div>
                  <select :value="agenteDePub(pub.id)" @change="asignarAgentePub(pub, $event.target.value)" class="ide-select" style="font-size:12px; padding:6px 8px;">
                    <option value="">— Agente por defecto —</option>
                    <option v-for="ag in agentes" :key="ag.id" :value="ag.id">{{ ag.nombre }}</option>
                  </select>
                  <div v-if="agenteDePub(pub.id)" style="font-size:10px; color:#22c55e; margin-top:3px;">
                    ● Agente asignado
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </template>

      <!-- ── Asistente del Dueño ── -->
      <template v-else-if="seccion === 'owner'">
        <div class="ide-sec-hd"><h2>Asistente del Dueño</h2><p>El dueño puede consultar ventas, stock, finanzas e importaciones enviando un mensaje por WhatsApp</p></div>
        <div style="max-width:620px;">

          <div class="cfg-info-card" style="margin-bottom:20px;">
            <div style="font-size:12px; font-weight:700; color:#e8956d; margin-bottom:8px;">🤖 ¿Cómo funciona?</div>
            <div style="font-size:12px; color:var(--t3); line-height:1.6;">
              Cuando el número registrado aquí envíe un mensaje por WhatsApp, el sistema activará un agente IA que consulta datos reales del negocio. Los clientes normales siguen siendo atendidos por sus agentes habituales.
            </div>
          </div>

          <div class="ide-ia-card" style="margin-bottom:16px;">
            <div style="font-size:13px; font-weight:700; color:var(--t2); margin-bottom:14px;">Número del dueño</div>
            <div class="ide-field">
              <label>Número de WhatsApp *</label>
              <input v-model="ownerForm.telefono" class="ide-input" placeholder="591XXXXXXXXX" />
              <div style="font-size:10px; color:var(--t5); margin-top:3px;">Formato internacional sin + ni espacios: código de país + número (ej. 59170000000)</div>
            </div>
          </div>

          <div class="ide-ia-card" style="margin-bottom:16px;">
            <div style="font-size:13px; font-weight:700; color:var(--t2); margin-bottom:4px;">Instrucciones del asistente</div>
            <div style="font-size:11px; color:var(--t4); margin-bottom:12px;">Personaliza el comportamiento del asistente. Si lo dejas vacío se aplica una instrucción predeterminada.</div>
            <div class="ide-field">
              <label>System prompt (opcional)</label>
              <textarea v-model="ownerForm.systemPrompt" class="ide-input" rows="5"
                placeholder="Eres el asistente de inteligencia de negocio del dueño. Responde de forma concisa y directa con los datos solicitados..."></textarea>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px;">
            <div v-for="cap in ownerCapacidades" :key="cap.titulo"
              style="padding:12px 14px; background:var(--bg-e); border-radius:10px; border:1px solid var(--bg-c);">
              <div style="font-size:18px; margin-bottom:6px;">{{ cap.emoji }}</div>
              <div style="font-size:12px; font-weight:700; color:var(--t2); margin-bottom:3px;">{{ cap.titulo }}</div>
              <div style="font-size:11px; color:var(--t4); line-height:1.4;">{{ cap.desc }}</div>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end;">
            <v-btn depressed color="primary" :loading="guardandoOwner" @click="guardarOwnerAgent" style="font-size:12px; border-radius:8px;">
              Guardar configuración
            </v-btn>
          </div>

        </div>
      </template>

      </template><!-- end v-else clienteId -->

    </div>
  </div>
</template>

<script>
const SVGS = {
  key:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`,
  signal:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"/></svg>`,
  cpu:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`,
  whatsapp: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
  facebook: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  owner:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
};

export default {
  name: 'Configuracion',
  data() {
    return {
      seccion: 'api',
      // Anthropic
      apiKey: '',
      modelo: 'claude-haiku-4-5',
      showKey: false,
      verificando: false,
      guardando: false,
      resultadoVerif: null,
      // WhatsApp
      waForm: {
        accessToken: '',
        phoneNumberId: '',
        wabaId: '',
        verifyToken: 'ide_ia_verify_token',
        agenteId: '',
        enabled: false,
      },
      waTestResult: null,
      waTestando: false,
      waStatus: { valida: false },
      showWaToken: false,
      // Facebook
      fbForm: {
        pageAccessToken: '', pageId: '', verifyToken: 'fb_verify_token',
        messengerAgenteId: '', commentsAgenteId: '', enabled: false, replyComments: true,
      },
      fbTestResult: null,
      fbTestando: false,
      fbStatus: { valida: false },
      showFbToken: false,
      fbPublicaciones: [],
      fbPubsCargando: false,
      fbPubsError: null,
      fbCampanas: [],   // campanas con canal='facebook-comment'
      fbGuardandoPub: {},
      pasosFb: [
        { bold: 'Crear app',           text: 'developers.facebook.com → Mis Apps → Crear app → Empresa' },
        { bold: 'Agregar Messenger',   text: 'Panel → Agregar producto → Messenger → Configurar' },
        { bold: 'Suscribir Página',    text: 'Messenger → Configuración → Webhooks → Suscribirse a la página' },
        { bold: 'Page Access Token',   text: 'Herramientas → Explorador API → seleccionar app → generar token con pages_messaging + pages_read_engagement' },
        { bold: 'Configurar webhook',  text: 'Messenger → Configuración → Webhooks → Editar → Pegar URL y token → Verificar y guardar' },
        { bold: 'Suscribir campos',    text: 'Webhooks → Seleccionar página → Suscribirse a: messages, feed (para comentarios)' },
      ],
      agentes: [],
      // Routing
      routingRules: [],
      routingNuevo: { keywords: '', agenteId: '' },
      guardandoRouting: false,
      // Asistente del Dueño
      ownerForm: { telefono: '', systemPrompt: '' },
      guardandoOwner: false,
      ownerCapacidades: [
        { emoji: '📊', titulo: 'Ventas',      desc: 'Consulta ventas del día, semana o mes con totales e información por método de pago' },
        { emoji: '📦', titulo: 'Stock',       desc: 'Estado actual del inventario por producto con cantidad disponible en lotes' },
        { emoji: '💰', titulo: 'Finanzas',    desc: 'Ingresos, gastos y saldos por fuente en el período seleccionado' },
        { emoji: '🚢', titulo: 'Materiales',  desc: 'Estado de órdenes de importación y materiales en tránsito o pendientes' },
      ],
      // Nav
      secciones: [
        { id: 'api',       label: 'API Key Anthropic', svg: SVGS.key      },
        { id: 'canales',   label: 'Auto-respuesta',    svg: SVGS.signal   },
        { id: 'modelos',   label: 'Modelos Claude',    svg: SVGS.cpu      },
        { id: 'whatsapp',  label: 'WhatsApp Cloud',    svg: SVGS.whatsapp },
        { id: 'facebook',  label: 'Facebook',          svg: SVGS.facebook },
        { id: 'owner',     label: 'Asistente Dueño',   svg: SVGS.owner    },
      ],
      pasos: [
        { bold: 'Ir a',        text: 'console.anthropic.com → API Keys → Create Key' },
        { bold: 'Copiar',      text: 'la key que empieza con sk-ant-...' },
        { bold: 'Seleccionar', text: 'el modelo según tu plan (Haiku es más rápido y económico)' },
      ],
      pasosWa: [
        { bold: 'Crear app',         text: 'developers.facebook.com → Mis Apps → Crear app → Empresa' },
        { bold: 'Agregar WhatsApp',  text: 'Panel de la app → Agregar producto → WhatsApp → Configurar' },
        { bold: 'Número de teléfono',text: 'WhatsApp → Configuración → Agregar número de teléfono de producción' },
        { bold: 'Token permanente',  text: 'Configuración → Información del sistema → Crear token de sistema con whatsapp_business_messaging' },
        { bold: 'Configurar webhook',text: 'WhatsApp → Configuración → Webhook → Editar → Pegar URL y token de verificación → Verificar' },
        { bold: 'Suscribir campos',  text: 'Webhook → Administrar → Activar "messages"' },
      ],
      canales: [
        { id: 'whatsapp',  label: 'WhatsApp Cloud',     emoji: '💬', activo: true  },
        { id: 'instagram', label: 'Instagram DM',       emoji: '📷', activo: true  },
        { id: 'facebook',  label: 'Facebook Messenger', emoji: '📘', activo: false },
        { id: 'chat',      label: 'Chat Web',           emoji: '🌐', activo: true  },
      ],
      modelosInfo: [
        { id: 'claude-haiku-4-5',  emoji: '⚡', nombre: 'Claude Haiku 4.5',  desc: 'El más rápido y económico. Ideal para respuestas en tiempo real, soporte básico y flujos de alta frecuencia. Latencia ultra baja.', tags: ['Rápido', 'Económico', 'Alta frecuencia'], recomendado: true  },
        { id: 'claude-sonnet-4-6', emoji: '🎯', nombre: 'Claude Sonnet 4.6', desc: 'El equilibrio perfecto entre calidad y velocidad. Excelente para calificación de leads, análisis de conversaciones y tareas complejas.',   tags: ['Equilibrado', 'Calificación', 'Análisis'], recomendado: false },
        { id: 'claude-opus-4-7',   emoji: '🧠', nombre: 'Claude Opus 4.7',   desc: 'Máxima inteligencia. Para tareas que requieren razonamiento profundo, redacción avanzada o análisis estratégico.',                            tags: ['Máxima calidad', 'Razonamiento', 'Estratégico'], recomendado: false },
      ],
    };
  },
  computed: {
    clienteId() {
      return this.$store.getters.clienteId || this.$storage.get('user')?.clienteId || null;
    },
    webhookUrl() {
      const base = window.location.hostname === 'localhost'
        ? 'https://tu-dominio.com'
        : `${window.location.protocol}//${window.location.host}`;
      return `${base}/api/whatsapp/webhook`;
    },
    fbWebhookUrl() {
      const base = window.location.hostname === 'localhost'
        ? 'https://tu-dominio.com'
        : `${window.location.protocol}//${window.location.host}`;
      return `${base}/api/facebook/webhook`;
    },
  },
  async mounted() {
    await Promise.all([this.cargarConfig(), this.cargarAgentes()]);
    await Promise.all([this.cargarConfigWa(), this.cargarConfigFb()]);
    await Promise.all([this.actualizarEstadoWa(), this.actualizarEstadoFb(), this.cargarRoutingRules(), this.cargarOwnerAgent()]);
  },
  methods: {
    async cargarConfig() {
      if (!this.clienteId) return;
      try {
        const configs = await this.$service.list(`clientes/${this.clienteId}/configuracion`);
        if (!configs) return;
        const apiConf   = configs.find(c => c.clave === 'ANTHROPIC_API_KEY');
        const modelConf = configs.find(c => c.clave === 'ANTHROPIC_DEFAULT_MODEL');
        if (apiConf   && apiConf.valor   && !apiConf.valor.includes('•'))  this.apiKey = apiConf.valor;
        if (modelConf && modelConf.valor) this.modelo = modelConf.valor;
      } catch (_e) { /* silently ignore load errors */ }
    },
    async cargarAgentes() {
      try {
        this.agentes = (await this.$service.list('agentes')) || [];
      } catch (_e) { /* silently ignore */ }
    },
    async cargarConfigWa() {
      try {
        const cfg = await this.$service.get('whatsapp/config');
        if (!cfg) return;
        this.waForm.phoneNumberId = cfg.phoneNumberId || '';
        this.waForm.wabaId        = cfg.wabaId        || '';
        this.waForm.verifyToken   = cfg.verifyToken   || 'ide_ia_verify_token';
        this.waForm.agenteId      = cfg.agenteId      || '';
        this.waForm.enabled       = cfg.enabled       || false;
      } catch (_e) { /* silently ignore */ }
    },
    async actualizarEstadoWa() {
      try {
        this.waStatus = await this.$service.get('whatsapp/status') || { valida: false };
      } catch (_e) { /* silently ignore */ }
    },

    // ── Anthropic ──
    async verificarKey() {
      if (!this.apiKey.trim()) { this.resultadoVerif = { ok: false, msg: 'Ingresa tu API Key de Anthropic.' }; return; }
      this.verificando = true;
      this.resultadoVerif = null;
      try {
        const result = await this.$service.post('configuracion/verificar-api-key', { apiKey: this.apiKey, modelo: this.modelo });
        this.resultadoVerif = { ok: result?.valida || false, msg: result?.mensaje || 'Error' };
      } catch (e) {
        this.resultadoVerif = { ok: false, msg: e?.mensaje || 'Error al verificar' };
      } finally { this.verificando = false; }
    },
    async guardarApiKey() {
      if (!this.clienteId) return;
      this.guardando = true;
      try {
        await Promise.all([
          this.$service.post(`clientes/${this.clienteId}/configuracion`, { clave: 'ANTHROPIC_API_KEY',       valor: this.apiKey, esSecreto: true, descripcion: 'API Key de Anthropic' }),
          this.$service.post(`clientes/${this.clienteId}/configuracion`, { clave: 'ANTHROPIC_DEFAULT_MODEL', valor: this.modelo,                  descripcion: 'Modelo de Claude por defecto' }),
        ]);
        this.$message.success('Configuración guardada correctamente');
      } catch (e) {
        this.$message.error(e?.mensaje || 'Error al guardar');
      } finally { this.guardando = false; }
    },
    async guardarCanales() {
      if (!this.clienteId) return;
      this.guardando = true;
      try {
        for (const c of this.canales) {
          await this.$service.post(`clientes/${this.clienteId}/configuracion`, { clave: `CANAL_${c.id.toUpperCase()}`, valor: String(c.activo), descripcion: `Auto-respuesta canal ${c.label}` });
        }
        this.$message.success('Canales actualizados');
      } catch (e) {
        this.$message.error(e?.mensaje || 'Error al guardar canales');
      } finally { this.guardando = false; }
    },

    // ── WhatsApp ──
    async testConexionWa() {
      if (!this.waForm.accessToken || !this.waForm.phoneNumberId) return;
      this.waTestando = true;
      this.waTestResult = null;
      try {
        this.waTestResult = await this.$service.post('whatsapp/test-connection', {
          accessToken: this.waForm.accessToken,
          phoneNumberId: this.waForm.phoneNumberId,
        });
      } catch (e) {
        this.waTestResult = { valida: false, mensaje: e?.mensaje || 'Error al conectar' };
      } finally { this.waTestando = false; }
    },
    async guardarWa() {
      this.guardando = true;
      try {
        await this.$service.post('whatsapp/config', {
          accessToken:   this.waForm.accessToken   || undefined,
          phoneNumberId: this.waForm.phoneNumberId,
          wabaId:        this.waForm.wabaId,
          verifyToken:   this.waForm.verifyToken,
          agenteId:      this.waForm.agenteId,
          enabled:       this.waForm.enabled,
        });
        this.$message.success('Configuración WhatsApp guardada');
        await this.actualizarEstadoWa();
      } catch (e) {
        this.$message.error(e?.mensaje || 'Error al guardar');
      } finally { this.guardando = false; }
    },
    // ── Facebook publicaciones ──
    async cargarPublicaciones() {
      this.fbPubsCargando = true;
      this.fbPubsError = null;
      try {
        const [pubs, campanas] = await Promise.all([
          this.$service.get('facebook/publicaciones'),
          this.$service.list('campanas'),
        ]);
        this.fbPublicaciones = pubs || [];
        this.fbCampanas = (campanas || []).filter(c => c.canal === 'facebook-comment');
      } catch (e) {
        this.fbPubsError = e?.mensaje || 'Error al cargar publicaciones. Verifica que el Page Access Token esté configurado y guardado.';
      } finally { this.fbPubsCargando = false; }
    },
    agenteDePub(postId) {
      const camp = this.fbCampanas.find(c => c.origen === postId);
      return camp ? camp.agenteId : '';
    },
    async asignarAgentePub(pub, agenteId) {
      const camp = this.fbCampanas.find(c => c.origen === pub.id);
      try {
        if (!agenteId) {
          if (camp) {
            await this.$service.delete(`campanas/${camp.id}`);
            this.fbCampanas = this.fbCampanas.filter(c => c.id !== camp.id);
          }
        } else if (camp) {
          await this.$service.put(`campanas/${camp.id}`, { agenteId });
          camp.agenteId = agenteId;
        } else {
          const nueva = await this.$service.post('campanas', {
            nombre: pub.texto.slice(0, 80),
            canal: 'facebook-comment',
            origen: pub.id,
            agenteId,
            activa: true,
          });
          this.fbCampanas.push(nueva);
        }
        this.$message.success(agenteId ? 'Agente asignado' : 'Asignación eliminada');
      } catch (e) {
        this.$message.error(e?.mensaje || 'Error al guardar');
      }
    },
    formatearFecha(iso) {
      if (!iso) return '';
      return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    },

    // ── Facebook ──
    async cargarConfigFb() {
      try {
        const cfg = await this.$service.get('facebook/config');
        if (!cfg) return;
        this.fbForm.pageId            = cfg.pageId            || '';
        this.fbForm.verifyToken       = cfg.verifyToken       || 'fb_verify_token';
        this.fbForm.messengerAgenteId = cfg.messengerAgenteId || '';
        this.fbForm.commentsAgenteId  = cfg.commentsAgenteId  || '';
        this.fbForm.enabled           = cfg.enabled           || false;
        this.fbForm.replyComments     = cfg.replyComments     !== false;
      } catch (_e) { /* silently ignore */ }
    },
    async actualizarEstadoFb() {
      try {
        this.fbStatus = await this.$service.get('facebook/status') || { valida: false };
      } catch (_e) { /* silently ignore */ }
    },
    async testConexionFb() {
      if (!this.fbForm.pageAccessToken || !this.fbForm.pageId) return;
      this.fbTestando = true; this.fbTestResult = null;
      try {
        this.fbTestResult = await this.$service.post('facebook/test-connection', {
          pageAccessToken: this.fbForm.pageAccessToken,
          pageId: this.fbForm.pageId,
        });
      } catch (e) {
        this.fbTestResult = { valida: false, mensaje: e?.mensaje || 'Error al conectar' };
      } finally { this.fbTestando = false; }
    },
    async guardarFb() {
      this.guardando = true;
      try {
        await this.$service.post('facebook/config', {
          pageAccessToken:   this.fbForm.pageAccessToken || undefined,
          pageId:            this.fbForm.pageId,
          verifyToken:       this.fbForm.verifyToken,
          messengerAgenteId: this.fbForm.messengerAgenteId,
          commentsAgenteId:  this.fbForm.commentsAgenteId,
          enabled:           this.fbForm.enabled,
          replyComments:     this.fbForm.replyComments,
        });
        this.$message.success('Configuración Facebook guardada');
        await this.actualizarEstadoFb();
      } catch (e) {
        this.$message.error(e?.mensaje || 'Error al guardar');
      } finally { this.guardando = false; }
    },

    copiar(texto) {
      navigator.clipboard?.writeText(texto).then(() => this.$message.success('Copiado al portapapeles'));
    },

    // ── Routing ──
    nombreAgente(id) {
      const ag = this.agentes.find(a => String(a.id) === String(id));
      return ag ? ag.nombre : id;
    },
    async cargarRoutingRules() {
      try {
        this.routingRules = (await this.$service.get('whatsapp/routing')) || [];
      } catch (_e) { /* silently ignore */ }
    },
    agregarRegla() {
      const keywords = this.routingNuevo.keywords.split(',').map(k => k.trim()).filter(k => k);
      if (!keywords.length || !this.routingNuevo.agenteId) return;
      this.routingRules.push({ palabrasClave: keywords, agenteId: this.routingNuevo.agenteId });
      this.routingNuevo = { keywords: '', agenteId: '' };
    },
    eliminarRegla(idx) {
      this.routingRules.splice(idx, 1);
    },
    async guardarRoutingRules() {
      this.guardandoRouting = true;
      try {
        await this.$service.put('whatsapp/routing', this.routingRules);
        this.$message.success('Reglas de enrutamiento guardadas');
      } catch (e) {
        this.$message.error(e?.mensaje || 'Error al guardar reglas');
      } finally { this.guardandoRouting = false; }
    },

    // ── Asistente del Dueño ──
    async cargarOwnerAgent() {
      try {
        const datos = await this.$service.get('whatsapp/owner-agent');
        if (!datos) return;
        this.ownerForm.telefono     = datos.telefono     || '';
        this.ownerForm.systemPrompt = datos.systemPrompt || '';
      } catch (_e) { /* silently ignore */ }
    },
    async guardarOwnerAgent() {
      this.guardandoOwner = true;
      try {
        await this.$service.put('whatsapp/owner-agent', this.ownerForm);
        this.$message.success('Configuración del asistente del dueño guardada');
      } catch (e) {
        this.$message.error(e?.mensaje || 'Error al guardar');
      } finally { this.guardandoOwner = false; }
    },
  },
};
</script>

<style scoped>
.cfg-info-card  { background: #1a0f0a; border: 1px solid #c9644244; border-radius: 8px; padding: 14px; margin-bottom: 16px; }
.cfg-step-num   { width: 18px; height: 18px; border-radius: 50%; background: #c9644233; color: #e8956d; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
.cfg-form-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 4px; }
.cfg-result     { padding: 10px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; line-height: 1.5; margin-top: 12px; }
.cfg-result--ok  { background: #22c55e18; border: 1px solid #22c55e33; color: #22c55e; }
.cfg-result--err { background: #ef444418; border: 1px solid #ef444433; color: #ef4444; }
.cfg-eye        { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 14px; padding: 4px; }
.cfg-copy-btn   { padding: 4px 10px; border-radius: 6px; background: #6366f122; border: 1px solid #6366f133; color: #818cf8; font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; }
.cfg-copy-btn:hover { background: #6366f133; }
</style>
