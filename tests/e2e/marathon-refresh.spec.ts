import { test, expect } from "@playwright/test";

test("aggiorna maratone recupera nuovi inviti e conserva la lista se il servizio non risponde", async ({
  page,
}) => {
  const invites = [
    {
      id: "qa-marathon",
      name: "Una nuova saga insieme",
      owner: "qa-partner",
      status: "invited",
      seen: 0,
      members: [
        { username: "qa-partner", status: "accepted" },
        { username: "qa-refresh", status: "invited" },
      ],
    },
  ];
  let updated = false,
    fail = false,
    hold = false,
    release: (() => void) | undefined;
  const requests: string[] = [];
  await page.addInitScript(() => {
    localStorage.setItem("marvel-watchverse.profile.v1", "qa-refresh");
    localStorage.setItem("marvel-watchverse.opening-audio.v2", "seen");
  });
  await page.route("**/functions/v1/watchverse-sync", async (route) => {
    const data = route.request().postDataJSON();
    if (data.action !== "social")
      return route.fulfill({ json: { progress: [] } });
    requests.push(data.action);
    if (hold)
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    if (fail)
      return route.fulfill({
        status: 503,
        json: { error: "Sync unavailable" },
      });
    return route.fulfill({
      json: { friends: [], marathons: updated ? invites : [] },
    });
  });
  await page.goto("#friends");
  const refresh = page.getByRole("button", {
    name: "Aggiorna richieste di maratona",
  });
  await expect(refresh).toBeEnabled();
  await expect(page.locator(".marathon-list")).toContainText(
    "Nessuna maratona ancora",
  );
  const before = requests.length;
  updated = true;
  hold = true;
  await refresh.click();
  await expect(page.locator(".marathon-refresh-status")).toContainText(
    "Controllo nuovi inviti",
  );
  await expect(refresh).toBeDisabled();
  await expect.poll(() => requests.length).toBe(before + 1);
  release!();
  hold = false;
  await expect(
    page.getByRole("heading", { name: "Una nuova saga insieme" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Accetta invito" }),
  ).toBeVisible();
  await expect(refresh).toBeEnabled();
  await expect(page.locator(".marathon-refresh-status")).toContainText(
    "Richieste aggiornate alle",
  );
  await page.screenshot({
    path: `reports/marathon-refresh-${test.info().project.name}.png`,
  });
  fail = true;
  await refresh.click();
  await expect(page.getByRole("alert")).toContainText(
    "Il servizio non risponde",
  );
  await expect(
    page.getByRole("heading", { name: "Una nuova saga insieme" }),
  ).toBeVisible();
  fail = false;
  updated = false;
  await refresh.click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".marathon-list")).toContainText(
    "Nessuna maratona ancora",
  );
});
