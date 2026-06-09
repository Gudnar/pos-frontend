<template>
  <transition name="modal-fade">
    <div v-if="visible" class="modal-backdrop" @mousedown.self="onBackdropClick">
      <div class="modal-box" role="dialog" aria-modal="true">
        <div class="modal-title">{{ title }}</div>
        <div class="modal-text">{{ text }}</div>
        <div class="modal-actions">
          <button v-if="isConfirm" class="modal-btn modal-btn--cancel" @click="cancel">Cancelar</button>
          <button class="modal-btn modal-btn--ok" @click="ok">
            {{ isConfirm ? 'Confirmar' : 'Aceptar' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  data: () => ({
    visible: false,
    title: '',
    text: '',
    isConfirm: false,
    callbackOk: null,
    callbackCancel: null,
  }),
  methods: {
    showConfirm(text, callbackOk, callbackCancel) {
      this.title = '¿Confirmar acción?';
      this.text = text;
      this.isConfirm = true;
      this.callbackOk = callbackOk;
      this.callbackCancel = callbackCancel;
      this.visible = true;
    },
    showAlert(title, text) {
      this.title = title;
      this.text = text;
      this.isConfirm = false;
      this.callbackOk = null;
      this.visible = true;
    },
    ok() {
      this.visible = false;
      if (this.callbackOk) this.callbackOk();
    },
    cancel() {
      this.visible = false;
      if (this.callbackCancel) this.callbackCancel();
    },
    onBackdropClick() {
      if (!this.isConfirm) this.ok();
    },
  },
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-box {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
.modal-title {
  font-size: 15px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 10px;
}
.modal-text {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
  margin-bottom: 24px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.modal-btn {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: opacity 0.15s;
}
.modal-btn:hover { opacity: 0.85; }
.modal-btn--cancel {
  background: transparent;
  border: 1px solid #334155;
  color: #64748b;
}
.modal-btn--cancel:hover { border-color: #475569; color: #94a3b8; opacity: 1; }
.modal-btn--ok {
  background: #6366f1;
  color: #fff;
}

.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter, .modal-fade-leave-to { opacity: 0; }
</style>
