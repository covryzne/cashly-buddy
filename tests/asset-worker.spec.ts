import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync("public/asset-worker.js", "utf8");
type FetchEvent = {
  request: Request;
  respondWith: (response: Promise<Response>) => void;
};

function worker(
  storage: unknown,
  fetcher: (request: Request, init?: RequestInit) => Promise<Response>,
) {
  const handlers = new Map<string, (event: FetchEvent) => void>();
  runInNewContext(source, {
    self: {
      location: { origin: "https://cashly.test" },
      addEventListener: (type: string, handler: (event: FetchEvent) => void) =>
        handlers.set(type, handler),
    },
    caches: storage,
    fetch: fetcher,
    Request,
    Response,
    URL,
    AbortController,
    setTimeout,
    clearTimeout,
  });
  return (request: Request) => {
    let result: Promise<Response> | undefined;
    handlers.get("fetch")!({
      request,
      respondWith: (value) => {
        result = value;
      },
    });
    return result;
  };
}

test("Worker tidak mengintersep HTML, API, auth, foto privat, atau request Authorization", () => {
  const dispatch = worker({}, async () => {
    throw new Error("Unexpected fetch");
  });
  for (const path of [
    "/login",
    "/beranda?_rsc=abc",
    "/api/expenses",
    "/auth/token",
    "/receipts/private.png",
    "/_next/image?url=%2Freceipts%2Fprivate.png&w=256&q=75",
    "/branding/cashly-header-source.png",
  ]) {
    expect(dispatch(new Request(`https://cashly.test${path}`))).toBeUndefined();
  }
  expect(
    dispatch(
      new Request("https://cashly.test/mascot/mochi-crown-transparent.webp", {
        headers: { Authorization: "Bearer test-only" },
      }),
    ),
  ).toBeUndefined();
});

for (const failure of ["open", "put"] as const) {
  test(`Penyimpanan cache gagal saat ${failure}, response aset tetap dapat digunakan`, async () => {
    const dispatch = worker(
      {
        open: async () => {
          if (failure === "open") throw new Error("Storage blocked");
          return {
            match: async () => undefined,
            put: async () => {
              throw new Error("Quota exceeded");
            },
          };
        },
      },
      async () =>
        new Response("image-bytes", {
          headers: { "Content-Type": "image/webp" },
        }),
    );
    const response = await dispatch(
      new Request("https://cashly.test/mascot/mochi-crown-transparent.webp"),
    );
    expect(response?.ok).toBe(true);
    expect(await response?.text()).toBe("image-bytes");
  });
}

test("Error server dan HTML pengganti gambar tidak dimasukkan cache", async () => {
  const saved: string[] = [];
  const dispatch = worker(
    {
      open: async () => ({
        match: async () => undefined,
        put: async (request: Request) => {
          saved.push(request.url);
        },
      }),
    },
    async (request) =>
      new Response("unavailable", {
        status: request.url.includes("mascot") ? 503 : 200,
        headers: { "Content-Type": "text/html" },
      }),
  );
  await dispatch(
    new Request("https://cashly.test/mascot/mochi-crown-transparent.webp"),
  );
  await dispatch(
    new Request("https://cashly.test/branding/cashly-header.webp"),
  );
  expect(saved).toEqual([]);
});

test("Sesi tunnel dibawa untuk aset satu origin; cookie CDN tetap tidak dikirim", async () => {
  const requests: Request[] = [];
  const dispatch = worker(
    {
      open: async () => {
        throw new Error("Storage unavailable");
      },
    },
    async (request, init) => {
      requests.push(new Request(request, init));
      return new Response("asset", {
        headers: { "Content-Type": "application/octet-stream" },
      });
    },
  );
  await dispatch(
    new Request("https://cashly.test/mascot/mochi-crown-transparent.webp"),
  );
  await dispatch(
    new Request(
      "https://prod.spline.design/R4tRoaLYG0dA8fQD/scene.splinecode",
      { credentials: "include" },
    ),
  );
  expect(requests[0].credentials).toBe("same-origin");
  expect(requests[1].credentials).toBe("omit");
});
