<template>
  <div class="probar-wrapper">
    <div class="section-header mb-4">
      <div style="font-size: 16px; font-weight: 700; color: #e2e8f0;">Probar Agente IA</div>
      <div style="font-size: 12px; color: #64748b;">
        Conversando con {{ agente.modelo }}
      </div>
    </div>

    <div class="chat-box">
      <!-- Header del chat -->
      <div class="chat-header">
        <div class="chat-avatar" :style="{ background: agente.color + '33', color: agente.color }">
          {{ agente.avatar }}
        </div>
        <div>
          <div style="font-size: 13px; font-weight: 700; color: #e2e8f0;">{{ agente.nombre }}</div>
          <div style="font-size: 10px; font-weight: 600; color: #22c55e;">● En línea · {{ agente.modelo }}</div>
        </div>
        <button class="chat-reset" @click="reiniciar">Reiniciar</button>
      </div>

      <!-- Mensajes -->
      <div class="chat-messages" ref="messagesEl">
        <div v-for="(msg, i) in mensajes" :key="i" class="chat-msg-wrapper" :class="msg.role === 'user' ? 'chat-msg-wrapper--user' : ''">
          <div v-if="msg.role === 'assistant'" class="chat-msg-ai-avatar" :style="{ background: agente.color + '33', color: agente.color }">
            {{ agente.avatar }}
          </div>
          <div>
            <div class="chat-bubble" :class="msg.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--ai'">
              {{ msg.content }}
            </div>
            <div style="font-size: 10px; color: #475569; margin-top: 3px;" :class="msg.role === 'user' ? 'text-right' : ''">
              {{ msg.time }}
            </div>
          </div>
        </div>

        <!-- Typing -->
        <div v-if="typing" class="chat-msg-wrapper">
          <div class="chat-msg-ai-avatar" :style="{ background: agente.color + '33', color: agente.color }">{{ agente.avatar }}</div>
          <div class="chat-bubble chat-bubble--ai">
            <div class="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="chat-input-area">
        <input
          v-model="inputMsg"
          @keydown.enter="enviar"
          placeholder="Escribe como si fueras un cliente…"
          class="chat-input"
          :disabled="typing"
        />
        <button class="chat-send" @click="enviar" :disabled="typing || !inputMsg.trim()">
          Enviar
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProbarAgente',
  props: { agente: { type: Object, required: true } },
  data() {
    return {
      mensajes: [
        {
          role: 'assistant',
          content: `¡Hola! Soy ${this.agente.nombre} 👋 ¿En qué te puedo ayudar hoy?`,
          time: 'ahora',
        },
      ],
      inputMsg: '',
      typing: false,
    };
  },
  methods: {
    now() {
      return new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
    },
    scrollAbajo() {
      this.$nextTick(() => {
        const el = this.$refs.messagesEl;
        if (el) el.scrollTop = el.scrollHeight;
      });
    },
    async enviar() {
      const texto = this.inputMsg.trim();
      if (!texto || this.typing) return;

      this.mensajes.push({ role: 'user', content: texto, time: this.now() });
      this.inputMsg = '';
      this.typing = true;
      this.scrollAbajo();

      // Build history excluding the initial greeting and timestamps
      const historial = this.mensajes
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(0, -1) // exclude the message we just pushed
        .map(m => ({ role: m.role, content: m.content }));

      try {
        const res = await this.$service.post(`agentes/${this.agente.id}/test`, {
          mensaje: texto,
          historial,
        });
        const reply = res?.respuesta || 'Lo siento, no pude procesar tu mensaje.';
        this.mensajes.push({ role: 'assistant', content: reply, time: this.now() });
      } catch (e) {
        const errMsg = e?.response?.data?.mensaje || e?.message || 'Error al conectar con Claude.';
        this.mensajes.push({
          role: 'assistant',
          content: `❌ ${errMsg}`,
          time: this.now(),
        });
      } finally {
        this.typing = false;
        this.scrollAbajo();
      }
    },
    reiniciar() {
      this.mensajes = [{
        role: 'assistant',
        content: `¡Hola! Soy ${this.agente.nombre} 👋 ¿En qué te puedo ayudar hoy?`,
        time: 'ahora',
      }];
    },
  },
};
</script>

<style scoped>
.probar-wrapper { display: flex; flex-direction: column; height: 100%; max-width: 600px; }
.chat-box {
  background: #1e293b; border: 1px solid #1e3a5f33; border-radius: 12px;
  overflow: hidden; display: flex; flex-direction: column;
  flex: 1; min-height: 400px;
}
.chat-header {
  padding: 12px 16px; border-bottom: 1px solid #1e3a5f44;
  display: flex; align-items: center; gap: 10px;
}
.chat-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 14px;
}
.chat-reset {
  margin-left: auto; background: none; border: 1px solid #334155;
  color: #64748b; border-radius: 6px; padding: 4px 10px;
  font-size: 11px; cursor: pointer;
}
.chat-reset:hover { border-color: #6366f1; color: #818cf8; }
.chat-messages {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 10px;
}
.chat-msg-wrapper {
  display: flex; align-items: flex-end; gap: 8px;
}
.chat-msg-wrapper--user { justify-content: flex-end; }
.chat-msg-ai-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; flex-shrink: 0;
}
.chat-bubble {
  max-width: 76%; padding: 10px 14px;
  font-size: 13px; line-height: 1.5; color: #f1f5f9;
}
.chat-bubble--ai {
  background: #1e293b; border: 1px solid #334155;
  border-radius: 16px 16px 16px 4px;
}
.chat-bubble--user {
  background: #4f46e5;
  border-radius: 16px 16px 4px 16px;
}
.typing-dots { display: flex; gap: 4px; padding: 2px 4px; }
.typing-dots span {
  width: 6px; height: 6px; border-radius: 50%; background: #6366f1;
  animation: pulse 1s ease-in-out infinite;
}
.typing-dots span:nth-child(2) { animation-delay: 0.15s; }
.typing-dots span:nth-child(3) { animation-delay: 0.3s; }
@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
}
.chat-input-area {
  padding: 12px 14px; border-top: 1px solid #1e3a5f44;
  display: flex; gap: 8px;
}
.chat-input {
  flex: 1; background: #0f172a; border: 1px solid #334155;
  border-radius: 8px; color: #f1f5f9; font-size: 13px; padding: 9px 12px;
  outline: none; font-family: inherit;
}
.chat-input:focus { border-color: #6366f1; }
.chat-send {
  background: #6366f1; color: #fff; border: none; border-radius: 8px;
  font-size: 12px; font-weight: 700; padding: 0 16px; cursor: pointer;
  transition: background 0.15s;
}
.chat-send:hover:not(:disabled) { background: #4f46e5; }
.chat-send:disabled { opacity: 0.5; cursor: not-allowed; }
.text-right { text-align: right; }
</style>
