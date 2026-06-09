<template>
  <div v-if="visible" class="ide-ia-progress-bar">
    <div class="ide-ia-progress-fill" :style="{ width: progress + '%' }"></div>
  </div>
</template>

<script>
export default {
  data: () => ({ visible: false, progress: 0, timer: null }),
  methods: {
    start() {
      this.visible = true;
      this.progress = 0;
      this.timer = setInterval(() => {
        if (this.progress < 85) this.progress += Math.random() * 10;
      }, 200);
    },
    close() {
      clearInterval(this.timer);
      this.progress = 100;
      setTimeout(() => { this.visible = false; this.progress = 0; }, 300);
    },
  },
};
</script>

<style>
.ide-ia-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  z-index: 9997;
  background: #1e293b;
}
.ide-ia-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  transition: width 0.2s ease;
}
</style>
