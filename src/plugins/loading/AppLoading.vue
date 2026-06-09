<template>
  <v-overlay v-if="visible" z-index="9998" color="#0f172a" opacity="0.85">
    <div class="d-flex flex-column align-center" style="gap: 16px;">
      <div class="ide-ia-spinner">
        <div></div><div></div><div></div>
      </div>
      <span style="color: #94a3b8; font-size: 13px; font-weight: 500;">{{ message }}</span>
    </div>
  </v-overlay>
</template>

<script>
export default {
  data: () => ({ visible: false, message: 'Cargando...' }),
  methods: {
    show(msg) { this.message = msg; this.visible = true; },
    hide() { this.visible = false; },
  },
};
</script>

<style>
.ide-ia-spinner {
  display: flex;
  gap: 6px;
}
.ide-ia-spinner div {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #6366f1;
  animation: ide-ia-bounce 1.2s ease-in-out infinite;
}
.ide-ia-spinner div:nth-child(2) { animation-delay: 0.15s; background: #8b5cf6; }
.ide-ia-spinner div:nth-child(3) { animation-delay: 0.3s; background: #c96442; }
@keyframes ide-ia-bounce {
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50% { transform: translateY(-8px); opacity: 1; }
}
</style>
