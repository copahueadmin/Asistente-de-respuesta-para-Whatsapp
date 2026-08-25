// Acceso administrador compartido: mismas credenciales que usa el botón
// "Ingresar al panel" del Asistente de respuestas. Se valida en el cliente
// (no hay backend propio) y la sesión se recuerda en sessionStorage mientras
// dure la pestaña — se pide de nuevo al cerrarla o en una pestaña nueva.
export const ADMIN_USER = '33717567639'
export const ADMIN_PASS = 'Copahue'

const AUTH_KEY = 'copahue_admin_authed'

export function isAuthed() {
  try {
    return sessionStorage.getItem(AUTH_KEY) === '1'
  } catch {
    return false
  }
}

export function setAuthed(value) {
  try {
    if (value) sessionStorage.setItem(AUTH_KEY, '1')
    else sessionStorage.removeItem(AUTH_KEY)
  } catch {
    // sessionStorage no disponible (modo privado, etc.): la sesión no persiste,
    // pero el login en memoria durante esta carga de página sigue funcionando.
  }
}
