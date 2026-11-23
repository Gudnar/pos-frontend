// El logo subido se guarda como ruta relativa al API (empresa-logo/...); las URL externas antiguas se usan tal cual.
export function resolverLogo (url) {
  if (!url) return null
  if (/^(https?:|data:)/i.test(url)) return url
  return (process.env.VUE_APP_BASE_SERVER || '') + url.replace(/^\/+/, '')
}
