const SITE_ORIGIN = "https://shy-mountain-ddae.rutevapolina.workers.dev";

const corsHeaders = {
"Access-Control-Allow-Origin": SITE_ORIGIN,
"Access-Control-Allow-Methods": "POST, OPTIONS",
"Access-Control-Allow-Headers": "Content-Type",
"Vary": "Origin"
};

export default {
async fetch(request, env) {
const url = new URL(request.url);

if (url.pathname === "/api/chat" && request.method === "OPTIONS") {
  return new Response(null, { status: 204, headers: corsHeaders });
}

if (url.pathname === "/api/chat" && request.method === "POST") {
  try {
    const body = await request.json();
    const history = Array.isArray(body.messages) ? body.messages : [];

    const instructions = [
      "Ты — ведущий ролевой игры. Играй за своего персонажа и NPC.",
      "Никогда не пиши реплики, действия, мысли или чувства персонажа пользователя.",
      "Текст в круглых скобках — внеигровые инструкции. Выполняй их.",
      "Отвечай умеренно коротко и оставляй пользователю пространство для действий.",
      "Соблюдай безопасные границы общения с несовершеннолетними."
    ].join("\n");

    const messages = [
      { role: "system", content: instructions }
    ];

    const scenario = String(body.scenario || "");

    if (scenario) {
      messages.push({
        role: "user",
        content: "Сюжет и стартовая ситуация:\n" + scenario
      });
    }

    for (const m of history.slice(-30)) {
      messages.push({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "")
      });
    }

    const result = await env.AI.run(
      "@cf/meta/llama-3.2-3b-instruct",
      {
        messages,
        temperature: 0.9,
        max_tokens: 500
      }
    );

    return Response.json(
      { reply: result.response || "" },
      { headers: corsHeaders }
    );

  } catch (error) {
    return Response.json(
      { error: "Не удалось получить ответ ИИ" },
      { status: 500, headers: corsHeaders }
    );
  }
}

return new Response("Not found", { status: 404 });
}
};