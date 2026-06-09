<template>
  <v-snackbar
    v-model="visible"
    :color="color"
    :timeout="3500"
    top
    right
    multi-line
    max-width="420"
    style="z-index: 9999;"
  >
    <div class="d-flex align-center" style="gap: 8px;">
      <v-icon small>{{ icon }}</v-icon>
      <span style="font-size: 13px; font-weight: 500;">{{ text }}</span>
    </div>
    <template #action="{ attrs }">
      <v-btn icon x-small v-bind="attrs" @click="visible = false">
        <v-icon small>mdi-close</v-icon>
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script>
export default {
  data: () => ({
    visible: false,
    text: '',
    color: 'success',
    icon: 'mdi-check-circle',
  }),
  methods: {
    show(type, text) {
      const map = {
        success: { color: '#22c55e', icon: 'mdi-check-circle' },
        error:   { color: '#ef4444', icon: 'mdi-alert-circle' },
        warning: { color: '#f59e0b', icon: 'mdi-alert' },
        info:    { color: '#3b82f6', icon: 'mdi-information' },
      };
      this.text = text;
      this.color = map[type]?.color || '#6366f1';
      this.icon = map[type]?.icon || 'mdi-information';
      this.visible = true;
    },
  },
};
</script>
