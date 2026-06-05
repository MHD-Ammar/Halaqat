import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("*/api/circles", () =>
    HttpResponse.json([{ id: "c1", name: "حلقة الفجر" }]),
  ),
  http.post("*/api/circles", async ({ request }: { request: Request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ id: "new-circle", ...body });
  }),
  http.get("*/api/users", () =>
    HttpResponse.json([{ id: "u1", fullName: "Teacher One" }]),
  ),
];
