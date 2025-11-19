import http from "http";
import { Server } from "http";
import ExpressApplication from "./app";
import { config } from "./config";
import { fetchPage } from "./services/fetcher";
import { parsePage } from "./services/parser";

let appServer: Server;
appServer = http.createServer(ExpressApplication);
const PORT = config?.PORT ? config.PORT : 3000;

const startServer = (server: Server) => {
  server.listen(PORT, () => console.log(`server running on PORT ${PORT}`));
};
startServer(appServer);
(async (url: string) => {
  //https://www.scrapethissite.com/pages/simple/
  try {
    const data = await fetchPage(url);
    console.log(data);
    const doc = parsePage(data.html as string);
    const text = doc.$("h1").text();
    console.log(text);
  } catch (error) {}
})("https://example.com");
