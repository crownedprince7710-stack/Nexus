
const AI_ENDPOINT = "";
// Set this to your deployed AI worker URL.

export function initAI(root) {
  root.innerHTML = `
    <div class="panel" style="display:flex;flex-direction:column;height:100%">
      <h2>✦ NEXUS AI</h2>
      <p style="color:#9ba9c2;font-size:12px">
        Your desktop assistant.
      </p>

      <div id="ai-messages"
        style="flex:1;overflow:auto;padding:10px"></div>

      <form id="ai-form" style="display:flex;gap:8px">
        <input class="nexus-input" id="ai-input"
          placeholder="Ask NEXUS anything..." style="flex:1;max-width:none">
        <button class="nexus-button">Send</button>
      </form>
    </div>`;

  const messages = root.querySelector("#ai-messages");
  const form = root.querySelector("#ai-form");
  const input = root.querySelector("#ai-input");

  function addMessage(role,text) {
    const bubble = document.createElement("div");
    bubble.style.cssText =
      "padding:12px;margin:8px 0;border-radius:10px;background:rgba(255,255,255,.07);font-size:13px;white-space:pre-wrap;line-height:1.6";

    const heading = document.createElement("b");
    heading.textContent = role === "user" ? "YOU" : "NEXUS AI";

    const content = document.createElement("div");
    content.textContent = text;

    bubble.append(heading,content);
    messages.append(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  addMessage("ai","Hello! I'm NEXUS AI. How can I help?");

  form.onsubmit = async event => {
    event.preventDefault();
    const prompt = input.value.trim();
    if(!prompt) return;

    input.value = "";
    addMessage("user",prompt);

    if(!AI_ENDPOINT) {
      addMessage("ai",
        "AI service is not configured yet. Connect your secure AI backend to activate model responses.");
      return;
    }

    const waiting = document.createElement("p");
    waiting.textContent = "Thinking...";
    messages.append(waiting);

    try {
      const response = await fetch(AI_ENDPOINT,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({message:prompt})
      });

      if(!response.ok) throw new Error("AI request failed");

      const data = await response.json();
      waiting.remove();
      addMessage("ai",data.reply || "No response received.");
    } catch(error) {
      waiting.remove();
      addMessage("ai","Could not connect to the AI service.");
    }
  };
}

