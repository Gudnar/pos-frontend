<template>
  <div class="ide-error-page">
    <div class="ide-error-page__content">
      <div class="ide-error-page__code">403</div>
      <h2 class="ide-error-page__title">Acceso denegado</h2>
      <p class="ide-error-page__sub">No tienes permisos para ver esta página.</p>
      <router-link :to="{ name: 'home' }">
        <v-btn depressed color="primary" style="border-radius: 8px; font-size: 13px;">
          Volver al inicio
        </v-btn>
      </router-link>
    </div>
  </div>
</template>

<script>
export default { name: 'AppForbidden' };
</script>

<style scoped>
.ide-error-page {
  min-height: 100vh; background: #0f172a;
  display: flex; align-items: center; justify-content: center;
}
.ide-error-page__content { text-align: center; }
.ide-error-page__code {
  font-size: 80px; font-weight: 900;
  background: linear-gradient(135deg, #ef4444, #f97316);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  line-height: 1;
}
.ide-error-page__title { color: #f1f5f9; font-size: 22px; margin: 12px 0 8px; }
.ide-error-page__sub { color: #64748b; font-size: 13px; margin-bottom: 24px; }
</style>
