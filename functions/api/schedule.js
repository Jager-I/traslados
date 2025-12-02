export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!env.SCHEDULE_STORE) {
    return new Response(JSON.stringify({ error: "KV Binding Missing: Agrega 'SCHEDULE_STORE' en Cloudflare Settings" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!id) {
    return new Response(JSON.stringify({ error: "Falta ID" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const value = await env.SCHEDULE_STORE.get(id);

  if (!value) {
    return new Response(JSON.stringify({ error: "Cronograma no encontrado" }), { 
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(value, {
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    if (!env.SCHEDULE_STORE) {
      throw new Error("Base de datos no conectada. Ve a Settings -> Functions -> KV Namespace Bindings y agrega 'SCHEDULE_STORE'.");
    }

    const body = await request.json();
    let id = body.id;

    // Generar ID si es nuevo
    if (!id) {
      id = crypto.randomUUID().split('-')[0];
    }

    const dataToSave = JSON.stringify(body.data);

    // Guardar en KV (Expira en 30 días)
    await env.SCHEDULE_STORE.put(id, dataToSave, { expirationTtl: 2592000 });

    return new Response(JSON.stringify({ id, success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}