function esc(s) {
  return String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const back = (qs) => Response.redirect(new URL("/reportar?" + qs, request.url).toString(), 303);
  try {
    const form = await request.formData();
    const mensaje = (form.get("mensaje") || "").toString().trim().slice(0, 5000);
    const contacto = (form.get("contacto") || "").toString().trim().slice(0, 200);
    const version = (form.get("version") || "").toString().trim().slice(0, 40);
    const detalle = (form.get("detalle") || "").toString().trim().slice(0, 5000);
    if (!mensaje) return back("e=1");

    const ua = request.headers.get("user-agent") || "";
    const html = `<h2>Reporte — Horarios Escolares</h2>
<p><b>Mensaje:</b><br>${esc(mensaje).replace(/\n/g, "<br>")}</p>
<p><b>Contacto:</b> ${esc(contacto) || "(no dejó)"}</p>
<p><b>Versión:</b> ${esc(version) || "(desconocida)"}</p>
<p><b>Detalle técnico:</b><br><pre style="white-space:pre-wrap;background:#f5f8fd;padding:10px;border-radius:8px">${esc(detalle) || "(ninguno)"}</pre></p>
<p style="color:#8a97ad;font-size:12px">${esc(ua)}</p>`;

    const r = await fetch("https://email.geosdata.com/emails/send", {
      method: "POST",
      headers: { "X-API-Key": env.EMAIL_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "jotive@gmail.com",
        subject: "Reporte — Horarios Escolares",
        html,
        from: "Horarios Escolares <noreply@geosdata.com>",
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || data.ok === false) return back("e=1");
    return back("ok=1");
  } catch (e) {
    return back("e=1");
  }
}
