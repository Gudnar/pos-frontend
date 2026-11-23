<template>
  <div class="cm">
    <div v-if="esBase" class="cm-nota">El pago está en {{ codBase }}: no requiere tipo de cambio.</div>
    <template v-else>
      <div class="cm-modo">
        <button type="button" class="cm-modo__btn" :class="{ 'cm-modo__btn--on': !dosPasos }" @click="setDosPasos(false)">
          Directo {{ codPago }} → {{ codBase }}
        </button>
        <button type="button" class="cm-modo__btn" :class="{ 'cm-modo__btn--on': dosPasos }" @click="setDosPasos(true)">
          ⇄ En dos pasos ({{ codPago }} → {{ codInter || 'otra' }} → {{ codBase }})
        </button>
      </div>

      <div v-if="dosPasos" class="cm-fila">
        <label class="cm-label">Moneda intermedia</label>
        <select :value="value.monedaIntermediaId || ''" class="ide-input" @change="set('monedaIntermediaId', $event.target.value || null)">
          <option value="">— Seleccionar —</option>
          <option v-for="m in monedasIntermedias" :key="m.id" :value="m.id">{{ m.codigo }} — {{ m.nombre }}</option>
        </select>
      </div>

      <!-- Paso 1 -->
      <div class="cm-fila">
        <label class="cm-label">{{ dosPasos ? 'Paso 1 · ' : '' }}Tipo de cambio {{ codPago }} → {{ dosPasos ? (codInter || 'intermedia') : codBase }}</label>
        <div class="cm-tc">
          <select :value="value.tcOperacion || 'MULTIPLICAR'" class="ide-input cm-tc__op" @change="set('tcOperacion', $event.target.value)">
            <option value="MULTIPLICAR">1 {{ codPago }} = X {{ destino1 }}</option>
            <option value="DIVIDIR">1 {{ destino1 }} = X {{ codPago }}</option>
          </select>
          <input :value="value.tipoCambio" class="ide-input cm-tc__val" type="number" min="0" step="any" placeholder="X"
            @input="set('tipoCambio', num($event.target.value))" />
        </div>
      </div>

      <!-- Paso 2 -->
      <div v-if="dosPasos" class="cm-fila">
        <label class="cm-label">Paso 2 · Tipo de cambio {{ codInter || 'intermedia' }} → {{ codBase }}</label>
        <div class="cm-tc">
          <select :value="value.tcPaso2Operacion || 'MULTIPLICAR'" class="ide-input cm-tc__op" @change="set('tcPaso2Operacion', $event.target.value)">
            <option value="MULTIPLICAR">1 {{ codInter || 'inter.' }} = X {{ codBase }}</option>
            <option value="DIVIDIR">1 {{ codBase }} = X {{ codInter || 'inter.' }}</option>
          </select>
          <input :value="value.tcPaso2" class="ide-input cm-tc__val" type="number" min="0" step="any" placeholder="X"
            @input="set('tcPaso2', num($event.target.value))" />
        </div>
      </div>
    </template>

    <!-- Resultado -->
    <div v-if="calculo.valido && total > 0" class="cm-resultado">
      <span>{{ fmt(total) }} <small>{{ codPago }}</small></span>
      <template v-if="!esBase">
        <template v-if="dosPasos">
          <span class="cm-op">{{ simbolo(value.tcOperacion) }} {{ value.tipoCambio }}</span>
          <span>= <strong class="cm-inter">{{ fmt(calculo.montoIntermedio) }}</strong> <small>{{ codInter }}</small></span>
          <span class="cm-op">{{ simbolo(value.tcPaso2Operacion) }} {{ value.tcPaso2 }}</span>
        </template>
        <span v-else class="cm-op">{{ simbolo(value.tcOperacion) }} {{ value.tipoCambio }}</span>
      </template>
      <span>= <strong class="cm-base">{{ fmt(calculo.montoBase) }}</strong> <small>{{ codBase }}</small></span>
    </div>
  </div>
</template>

<script>
// Misma lógica que backend/src/common/lib/conversion-moneda.ts (cada paso redondeado a centavos)
const centavos = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100
const aplicar = (x, tc, op) => (op === 'DIVIDIR' ? x / tc : x * tc)

export function calcularConversion(total, v, esBase) {
  const t = Number(total) || 0
  if (esBase) return { valido: true, montoBase: centavos(t), montoIntermedio: null }
  const tc1 = Number(v.tipoCambio)
  if (!(tc1 > 0)) return { valido: false, montoBase: 0, montoIntermedio: null }
  if (v.monedaIntermediaId) {
    const tc2 = Number(v.tcPaso2)
    if (!(tc2 > 0)) return { valido: false, montoBase: 0, montoIntermedio: null }
    const inter = centavos(aplicar(t, tc1, v.tcOperacion))
    return { valido: true, montoIntermedio: inter, montoBase: centavos(aplicar(inter, tc2, v.tcPaso2Operacion)) }
  }
  return { valido: true, montoIntermedio: null, montoBase: centavos(aplicar(t, tc1, v.tcOperacion)) }
}

export function conversionVacia() {
  return { tipoCambio: 1, tcOperacion: 'MULTIPLICAR', monedaIntermediaId: null, tcPaso2: null, tcPaso2Operacion: 'MULTIPLICAR' }
}

/** Valores del formulario a partir de un registro guardado */
export function conversionDesde(r) {
  return {
    tipoCambio: r.tcPaso1 != null ? Number(r.tcPaso1) : Number(r.tipoCambio || 1),
    tcOperacion: r.tcOperacion || 'MULTIPLICAR',
    monedaIntermediaId: r.monedaIntermediaId || null,
    tcPaso2: r.tcPaso2 != null ? Number(r.tcPaso2) : null,
    tcPaso2Operacion: r.tcPaso2Operacion || 'MULTIPLICAR',
  }
}

export default {
  name: 'ConversionMoneda',
  props: {
    value: { type: Object, required: true },
    monedas: { type: Array, default: () => [] },
    monedaPagoId: { type: String, default: '' },
    total: { type: Number, default: 0 },
    // En compras «sin moneda» = Bs; en ítems de logística «sin especificar» igual requiere TC
    sinMonedaEsBase: { type: Boolean, default: true },
  },
  data: () => ({ dosPasosManual: false }),
  computed: {
    base() { return this.monedas.find(m => m.esMonedaBase) || null },
    codBase() { return this.base ? this.base.codigo : 'Bs' },
    // Sin moneda elegida (compras) = pago en moneda base
    esBase() {
      if (!this.monedaPagoId) return this.sinMonedaEsBase
      return !!this.base && this.monedaPagoId === this.base.id
    },
    codPago() { const m = this.monedas.find(x => x.id === this.monedaPagoId); return m ? m.codigo : 'moneda' },
    codInter() { const m = this.monedas.find(x => x.id === this.value.monedaIntermediaId); return m ? m.codigo : '' },
    dosPasos() { return this.dosPasosManual || !!this.value.monedaIntermediaId },
    destino1() { return this.dosPasos ? (this.codInter || 'inter.') : this.codBase },
    monedasIntermedias() {
      return this.monedas.filter(m => m.id !== this.monedaPagoId && !m.esMonedaBase && m.activo !== false)
    },
    calculo() { return calcularConversion(this.total, this.value, this.esBase) },
  },
  watch: {
    calculo: { immediate: true, handler(c) { this.$emit('calculo', c) } },
    esBase(v) { if (v) this.$emit('input', conversionVacia()) },
  },
  methods: {
    set(campo, valor) { this.$emit('input', { ...this.value, [campo]: valor }) },
    setDosPasos(on) {
      this.dosPasosManual = on
      if (!on) this.$emit('input', { ...this.value, monedaIntermediaId: null, tcPaso2: null })
    },
    num(v) { return v === '' ? '' : Number(v) },
    simbolo(op) { return op === 'DIVIDIR' ? '÷' : '×' },
    fmt(n) { return Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
  },
}
</script>

<style scoped>
.cm { display: flex; flex-direction: column; gap: 8px; }
.cm-nota { font-size: 12px; color: var(--t4); }
.cm-modo { display: flex; gap: 6px; flex-wrap: wrap; }
.cm-modo__btn { flex: 1 1 auto; font-size: 12px; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--b2); background: transparent; color: var(--t3); cursor: pointer; }
.cm-modo__btn--on { border-color: #6366f1; background: #6366f11a; color: #a5b4fc; font-weight: 700; }
.cm-fila { display: flex; flex-direction: column; gap: 4px; }
.cm-label { font-size: 11px; color: var(--t4); font-weight: 600; }
.cm-tc { display: flex; gap: 6px; }
.cm-tc__op { flex: 1 1 55%; min-width: 0; }
.cm-tc__val { flex: 1 1 45%; min-width: 0; }
.cm-resultado { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; font-size: 13px; padding: 8px 12px; border-radius: 7px; background: #6366f111; border: 1px solid #6366f133; }
.cm-resultado small { color: var(--t4); font-size: 10px; }
.cm-op { color: var(--t4); }
.cm-inter { color: #f97316; }
.cm-base { color: #4ade80; font-size: 15px; }
</style>
