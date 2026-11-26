
export default {
  async fetch(request,env) {
    const headers = {
      "Content-Type":"application/json",
      "Access-Control-Allow-Origin":env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods":"POST, OPTIONS",
      "Access-Control-Allow-Headers":"Content-Type"
    };

    if(request.method === "OPTIONS") {
      return new Response(null,{headers});
    }

    if(request.method !== "POST") {
      return Response.json(
        {error:"Method not allowed"},
        {status:405,headers}
      );
    }

    if(!env.AI_API_KEY || !env.AI_API_URL || !env.AI_MODEL) {
      return Response.json(
        {error:"AI service is not configured"},
        {status:503,headers}
      );
    }

    try {
      const body = await request.json();
      const message = String(body.message || "").trim();

      if(!message || message.length > 10000) {
        return Response.json(
          {error:"Invalid message"},
          {status:400,headers}
        );
      }

      const response = await fetch(env.AI_API_URL,{
        method:"POST",
        headers:{
          "Authorization":`Bearer ${env.AI_API_KEY}`,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          model:env.AI_MODEL,
          messages:[
            {
              role:"system",
              content:"You are NEXUS AI, a helpful desktop assistant. Be clear, accurate and concise. Never claim to have performed actions on the user's device unless a connected tool confirms them."
            },
            {role:"user",content:message}
          ]
        })
      });

      if(!response.ok) {
        throw new Error("AI provider request failed");
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content;

      return Response.json(
        {reply:reply || "No response received."},
        {headers}
      );

    } catch(error) {
      return Response.json(
        {error:"AI service unavailable"},
        {status:502,headers}
      );
    }
  }
};

