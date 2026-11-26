
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";

export function initCloudSync(Nexus) {
  const configured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

  Nexus.cloud = {
    connected:false,
    configured,

    async connect() {
      if(!configured) {
        Nexus.notify("Cloud sync is not configured.");
        return false;
      }

      try {
        const response = await fetch(
          `${SUPABASE_URL}/auth/v1/health`,
          {
            headers:{
              apikey:SUPABASE_ANON_KEY
            }
          }
        );

        if(!response.ok) throw new Error("Connection failed");

        this.connected = true;
        Nexus.notify("Cloud service connected.");
        return true;
      } catch(error) {
        Nexus.notify("Cloud connection failed.");
        return false;
      }
    }
  };
}

