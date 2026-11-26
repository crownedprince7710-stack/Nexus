
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    const headers = {
      "Content-Type":"application/json",
      "Access-Control-Allow-Origin":"*",
      "Access-Control-Allow-Methods":"GET, OPTIONS",
      "Access-Control-Allow-Headers":"Content-Type"
    };

    if(request.method === "OPTIONS") {
      return new Response(null,{headers});
    }

    if(!query || query.length > 300) {
      return Response.json(
        {error:"Invalid search query"},
        {status:400,headers}
      );
    }

    try {
      const api = new URL(
        "https://api.duckduckgo.com/"
      );

      api.searchParams.set("q",query);
      api.searchParams.set("format","json");
      api.searchParams.set("no_html","1");
      api.searchParams.set("no_redirect","1");

      const response = await fetch(api);
      const data = await response.json();

      const results = [];

      if(data.AbstractURL) {
        results.push({
          title:data.Heading || query,
          url:data.AbstractURL,
          description:data.AbstractText || ""
        });
      }

      for(const topic of data.RelatedTopics || []) {
        if(topic.FirstURL) {
          results.push({
            title:topic.Text?.split(" - ")[0] || "Result",
            url:topic.FirstURL,
            description:topic.Text || ""
          });
        }

        for(const child of topic.Topics || []) {
          if(child.FirstURL) {
            results.push({
              title:child.Text?.split(" - ")[0] || "Result",
              url:child.FirstURL,
              description:child.Text || ""
            });
          }
        }
      }

      return Response.json(
        {query,results:results.slice(0,15)},
        {headers}
      );

    } catch(error) {
      return Response.json(
        {error:"Search service unavailable"},
        {status:502,headers}
      );
    }
  }
};

