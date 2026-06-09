<template>
  <div class="ide-login">
    <!-- Panel izquierdo -->
    <div class="ide-login__brand">
      <div class="ide-login__brand-inner">
        <div class="ide-login__logo">
          <span style="font-size: 40px;">✦</span>
        </div>
        <h1 class="ide-login__title">IDE-IA</h1>
        <p class="ide-login__subtitle">
          Plataforma de gestión de Agentes Inteligentes con Anthropic Claude
        </p>
        <div class="ide-login__dots">
          <span></span><span></span><span></span>
        </div>
        <div class="ide-login__features">
          <div v-for="f in features" :key="f.text" class="ide-login__feature">
            <span class="ide-login__feature-icon">{{ f.icon }}</span>
            <span>{{ f.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel derecho -->
    <div class="ide-login__form-panel">
      <div class="ide-login__card">
        <div class="ide-login__card-header">
          <div class="ide-login__card-icon">✦</div>
          <h2 class="ide-login__card-title">Bienvenido</h2>
          <p class="ide-login__card-sub">Ingresa tus credenciales para continuar</p>
        </div>

        <v-alert v-if="error" type="error" dense text border="left" class="mb-4" style="border-radius: 8px; font-size: 13px;">
          {{ error }}
        </v-alert>

        <div class="ide-login__form">
          <div class="ide-login__field">
            <label>Usuario</label>
            <input
              v-model="form.usuario"
              type="text"
              placeholder="usuario"
              class="ide-login__input"
              @keydown.enter="handleLogin"
            />
          </div>
          <div class="ide-login__field">
            <label>Contraseña</label>
            <div style="position: relative;">
              <input
                v-model="form.contrasena"
                :type="showPass ? 'text' : 'password'"
                placeholder="••••••••"
                class="ide-login__input"
                @keydown.enter="handleLogin"
              />
              <button class="ide-login__eye" @click="showPass = !showPass" type="button">
                {{ showPass ? '🙈' : '👁' }}
              </button>
            </div>
          </div>

          <button
            class="ide-login__btn"
            :class="{ 'ide-login__btn--loading': loading }"
            :disabled="loading"
            @click="handleLogin"
          >
            <span v-if="!loading">Ingresar</span>
            <span v-else>Verificando...</span>
          </button>
        </div>

        <div class="ide-login__footer">
          <span>IDE-IA v1.0.0 · Anthropic Claude</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Login',
  data: () => ({
    form: { usuario: '', contrasena: '' },
    loading: false,
    showPass: false,
    error: '',
    features: [
      { icon: '🤖', text: 'Agentes IA con Claude' },
      { icon: '🛠', text: 'Herramientas personalizadas' },
      { icon: '💬', text: 'Historial de conversaciones' },
      { icon: '📊', text: 'Reportes y analítica' },
    ],
  }),
  methods: {
    async handleLogin() {
      if (!this.form.usuario || !this.form.contrasena) {
        this.error = 'Completa todos los campos';
        return;
      }
      this.loading = true;
      this.error = '';
      try {
        const encoded = btoa(this.form.contrasena);
        const base = process.env.VUE_APP_BASE_SERVER || 'http://localhost:3001/api/';
        const res = await axios.post(`${base}auth/login`, {
          usuario: this.form.usuario,
          contrasena: encoded,
        });
        const datos = res.data?.datos || res.data;
        if (datos?.access_token) {
          const userInfo = {
            id: datos.id,
            usuario: datos.usuario,
            nombres: datos.nombres,
            rol: datos.rol,
            clienteId: datos.clienteId ?? null,
          };
          this.$storage.set('token', datos.access_token);
          this.$storage.set('user', userInfo);
          this.$store.commit('setAuth', true);
          this.$store.commit('setUser', userInfo);
          this.$store.commit('setClienteId', userInfo.clienteId);
          this.$router.push({ name: 'home' });
        } else {
          this.error = 'Credenciales inválidas';
        }
      } catch (err) {
        this.error = err?.response?.data?.mensaje || err.message || 'Error al iniciar sesión';
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.ide-login {
  display: flex;
  min-height: 100vh;
  background: #0f172a;
}

.ide-login__brand {
  flex: 1;
  background: linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  position: relative;
  overflow: hidden;
}
.ide-login__brand::before {
  content: '';
  position: absolute;
  width: 500px; height: 500px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.08);
  top: -120px; left: -120px;
}
.ide-login__brand::after {
  content: '';
  position: absolute;
  width: 350px; height: 350px;
  border-radius: 50%;
  background: rgba(139, 92, 246, 0.08);
  bottom: -80px; right: -80px;
}

.ide-login__brand-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  z-index: 1;
}

.ide-login__logo {
  width: 80px; height: 80px;
  background: rgba(99, 102, 241, 0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  border: 1px solid rgba(99, 102, 241, 0.4);
}

.ide-login__title {
  font-size: 2.5rem;
  font-weight: 900;
  color: #f1f5f9;
  margin-bottom: 12px;
  letter-spacing: -1px;
}

.ide-login__subtitle {
  font-size: 14px;
  color: rgba(241, 245, 249, 0.65);
  max-width: 280px;
  line-height: 1.7;
  margin-bottom: 40px;
}

.ide-login__dots {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
}
.ide-login__dots span {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
}
.ide-login__dots span:first-child {
  background: #6366f1;
  width: 24px;
  border-radius: 4px;
}

.ide-login__features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}
.ide-login__feature {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: rgba(241, 245, 249, 0.7);
}
.ide-login__feature-icon {
  font-size: 16px;
}

/* Formulario */
.ide-login__form-panel {
  flex: 0 0 440px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0d1526;
  padding: 40px 24px;
}

.ide-login__card {
  width: 100%;
  max-width: 360px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 36px 32px;
}

.ide-login__card-header {
  text-align: center;
  margin-bottom: 28px;
}

.ide-login__card-icon {
  width: 48px; height: 48px;
  background: linear-gradient(135deg, #c96442, #e8956d);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin: 0 auto 16px;
}

.ide-login__card-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #f1f5f9;
  margin-bottom: 6px;
  letter-spacing: -0.3px;
}

.ide-login__card-sub {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.ide-login__form { display: flex; flex-direction: column; gap: 16px; }

.ide-login__field label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 6px;
}

.ide-login__input {
  width: 100%;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #f1f5f9;
  font-size: 13px;
  padding: 10px 12px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s;
}
.ide-login__input:focus { border-color: #6366f1; }
.ide-login__input::placeholder { color: #475569; }

.ide-login__eye {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
}

.ide-login__btn {
  width: 100%;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  padding: 12px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  margin-top: 4px;
}
.ide-login__btn:hover:not(:disabled) {
  background: #4f46e5;
  transform: translateY(-1px);
}
.ide-login__btn--loading, .ide-login__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ide-login__footer {
  text-align: center;
  margin-top: 20px;
  font-size: 11px;
  color: #334155;
}

@media (max-width: 767px) {
  .ide-login { flex-direction: column; }
  .ide-login__brand { min-height: 180px; padding: 24px; }
  .ide-login__features { display: none; }
  .ide-login__form-panel { flex: 1; padding: 20px; }
}
</style>
