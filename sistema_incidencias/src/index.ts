export default {
  fetch(request: Request) {
    return new Response(JSON.stringify({ ok: true, message: 'Worker mínimo funcionando' }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}