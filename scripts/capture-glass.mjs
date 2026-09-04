const WS = globalThis.WebSocket;
import fs from "node:fs";

async function run() {
  const listRes = await fetch("http://127.0.0.1:9222/json/list");
  const targets = await listRes.json();
  const pageTarget = targets.find((t) => t.type === "page") || targets[0];

  const ws = new WS(pageTarget.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(new Error(data.error.message));
      else resolve(data.result);
    }
  };

  await new Promise((r) => { ws.onopen = r; });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log("Navigating to http://localhost:3111/ ...");
  await send("Page.navigate", { url: "http://localhost:3111/" });

  // Wait for 3D scene initialization
  for (let i = 0; i < 40; i++) {
    const evalRes = await send("Runtime.evaluate", {
      expression: `Boolean(window.__miskova && window.__miskova.bottle && window.__miskova.bottle.juice && window.__miskova.scene)`,
      returnByValue: true,
    });
    if (evalRes.result?.value === true) break;
    await new Promise((r) => setTimeout(r, 250));
  }

  // Wait 1.5s for frames to settle
  await new Promise((r) => setTimeout(r, 1500));

  const screenshot = await send("Page.captureScreenshot", {
    format: "png",
    clip: {
      x: 0,
      y: 0,
      width: 1440,
      height: 900,
      scale: 1,
    },
  });

  fs.writeFileSync("/tmp/bottle-crystal-glass.png", Buffer.from(screenshot.data, "base64"));
  console.log("Screenshot written to /tmp/bottle-crystal-glass.png");

  // Lift cap and capture
  await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.querySelector('.bottleStage__control');
      if (btn) btn.click();
    })()`,
  });

  await new Promise((r) => setTimeout(r, 1200));

  const capScreenshot = await send("Page.captureScreenshot", {
    format: "png",
    clip: {
      x: 0,
      y: 0,
      width: 1440,
      height: 900,
      scale: 1,
    },
  });

  fs.writeFileSync("/tmp/bottle-crystal-glass-cap.png", Buffer.from(capScreenshot.data, "base64"));
  console.log("Cap screenshot written to /tmp/bottle-crystal-glass-cap.png");

  ws.close();
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
