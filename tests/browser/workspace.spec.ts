import { test, expect } from "@playwright/test";

test("corporate and location share rules, rendering, and preserved drafts", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const frame = page.frameLocator('iframe[title="Fall Rate Promo preview"]');
  await expect(frame.locator("img")).toBeVisible();
  await expect
    .poll(() =>
      frame
        .locator("img")
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBe(800);
  await page.getByRole("button", { name: "Location", exact: true }).click();
  await page
    .getByLabel("Local offer", { exact: true })
    .fill("Downtown draft <script> & {phone}");
  await expect(frame.locator("p")).toHaveText(
    "Downtown draft <script> & {phone}",
  );
  await page.getByLabel("Your location").selectOption("LOC-002");
  await expect(page.getByLabel("Local offer", { exact: true })).toHaveValue("");
  await page.getByLabel("Local offer", { exact: true }).fill("Eastside draft");
  await page.getByLabel("Your location").selectOption("LOC-001");
  await expect(page.getByLabel("Local offer", { exact: true })).toHaveValue(
    "Downtown draft <script> & {phone}",
  );
  await page.getByRole("button", { name: "Corporate", exact: true }).click();
  await page.getByLabel("Local offer mode").selectOption("locked");
  await page
    .getByLabel("Corporate value for local offer")
    .fill("Corporate campaign");
  await page.getByRole("button", { name: "Location", exact: true }).click();
  await expect(page.getByLabel("Local offer", { exact: true })).toHaveCount(0);
  await expect(frame.locator("p")).toHaveText("Corporate campaign");
  await page.getByRole("button", { name: "Corporate", exact: true }).click();
  await page.getByLabel("Local offer mode").selectOption("database");
  await expect(
    page.getByRole("region", { name: "Variable rules" }).getByRole("alert"),
  ).toContainText("choose a database field");
  await page
    .getByLabel("Database field for local offer")
    .selectOption("manager_name");
  await expect(frame.locator("p")).toHaveText("Marcus Hill");
  await expect(
    page
      .getByLabel("Database field for local offer")
      .locator("option[value='logo_file']"),
  ).toHaveCount(0);
  await page.getByLabel("Local offer mode").selectOption("input");
  await page.getByRole("button", { name: "Location", exact: true }).click();
  await expect(page.getByLabel("Local offer", { exact: true })).toHaveValue(
    "Downtown draft <script> & {phone}",
  );
  await page.getByRole("button", { name: /Branch Open House/ }).click();
  await page
    .getByLabel("Local offer", { exact: true })
    .fill("Flyer-only draft");
  await page
    .getByLabel("Event date & time", { exact: true })
    .fill("November 14, 2–5 PM");
  await expect(page.frameLocator("iframe").locator("p").first()).toContainText(
    "November 14, 2–5 PM",
  );
  await page.getByRole("button", { name: /Fall Rate Promo/ }).click();
  await expect(page.getByLabel("Local offer", { exact: true })).toHaveValue(
    "Downtown draft <script> & {phone}",
  );
  await page.getByRole("button", { name: /Branch Open House/ }).click();
  await expect(page.getByLabel("Local offer", { exact: true })).toHaveValue(
    "Flyer-only draft",
  );
  await page.screenshot({
    path: testInfo.outputPath("location-desktop.png"),
    fullPage: true,
  });
});

test("both original assets render all ten logos, missing phones, and fixed logos securely", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("iframe")).toHaveAttribute("sandbox", "");
  for (const assetName of [/Fall Rate Promo/, /Branch Open House/]) {
    await page.getByRole("button", { name: assetName }).click();
    for (let number = 1; number <= 10; number++) {
      const id = `LOC-${String(number).padStart(3, "0")}`;
      await page.getByLabel("Preview as location").selectOption(id);
      const image = page.frameLocator("iframe").locator("img");
      await expect(image).toBeVisible();
      await expect
        .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
        .toBe([800, 300, 200, 1200, 400, 900, 250, 600, 1000, 350][number - 1]);
      await expect
        .poll(() =>
          image.evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
        )
        .toBe(true);
      expect(
        await image.evaluate(
          (img) =>
            img.getBoundingClientRect().width <=
              img.parentElement!.getBoundingClientRect().width &&
            img.getBoundingClientRect().height <=
              img.parentElement!.getBoundingClientRect().height,
        ),
      ).toBe(true);
      if (number === 3 || number === 7)
        await expect(
          page.getByRole("list", { name: "Preview notes" }),
        ).toContainText("phone number not provided");
    }
  }
  await page.getByLabel("Logo mode").selectOption("locked");
  await page
    .getByLabel("Fixed logo for all locations")
    .selectOption("logos/LOC-003.png");
  await page.getByLabel("Preview as location").selectOption("LOC-001");
  await expect
    .poll(() =>
      page
        .frameLocator("iframe")
        .locator("img")
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBe(200);
  await expect(
    page.getByLabel("Logo mode").locator("option[value='input']"),
  ).toHaveCount(0);
});

test("mobile workspace fits the viewport and a refresh resets session state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Location", exact: true }).click();
  await page.getByLabel("Local offer", { exact: true }).fill("Mobile draft");
  await expect(page.frameLocator("iframe").locator("p")).toHaveText(
    "Mobile draft",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.reload();
  await page.getByRole("button", { name: "Location", exact: true }).click();
  await expect(page.getByLabel("Local offer", { exact: true })).toHaveValue("");
});

test("assessment defaults and unmapped database fields stay explicit in Corporate", async ({
  page,
}) => {
  await page.goto("/");
  for (const assetName of [/Fall Rate Promo/, /Branch Open House/]) {
    await page.getByRole("button", { name: assetName }).click();
    for (const [label, source] of [
      ["Logo", "logo_file"],
      ["Location name", "location_name"],
      ["Address", "address"],
      ["Phone number", "phone"],
      ...(String(assetName).includes("Branch")
        ? [["Manager name", "manager_name"]]
        : []),
    ]) {
      await expect(
        page.getByLabel(`${label} mode`, { exact: true }),
      ).toHaveValue("database");
      await expect(
        page.getByLabel(`Database field for ${label.toLowerCase()}`, {
          exact: true,
        }),
      ).toHaveValue(source);
    }
    await expect(page.getByLabel("Local offer mode")).toHaveValue("input");
    await expect(page.getByLabel("Disclaimer mode")).toHaveValue("locked");
    await expect(page.getByLabel("Corporate value for disclaimer")).toHaveValue(
      "Member FDIC. Rates subject to change.",
    );
    await expect(page.frameLocator("iframe").locator("body")).toContainText(
      "Member FDIC. Rates subject to change.",
    );
    const labels = ["Local offer", "Disclaimer"];
    if (String(assetName).includes("Branch")) {
      await expect(page.getByLabel("Event date & time mode")).toHaveValue(
        "input",
      );
      labels.push("Event date & time");
    }
    for (const label of labels) {
      await page
        .getByLabel(`${label} mode`, { exact: true })
        .selectOption("database");
      const source = page.getByLabel(
        `Database field for ${label.toLowerCase()}`,
        { exact: true },
      );
      await expect(source).toHaveValue("");
      await expect(source).toHaveAttribute("aria-invalid", "true");
      await expect(source).toHaveAccessibleDescription(
        /choose a database field in Corporate; no source is selected/,
      );
      const preview = page.frameLocator("iframe");
      if (label === "Local offer") {
        await expect(preview.locator("p").last()).toHaveText("");
      } else if (label === "Disclaimer") {
        await expect(preview.locator(".asset > div").last()).toHaveText("");
      } else {
        await expect(preview.locator("p").first()).toContainText(
          " on for refreshments",
        );
      }
      await page.getByLabel("Preview as location").selectOption("LOC-002");
      await expect(source).toHaveValue("");
      await expect(source).toHaveAttribute("aria-invalid", "true");
      await page.getByLabel("Preview as location").selectOption("LOC-001");
      await source.selectOption("address");
      await expect(source).toHaveAttribute("aria-invalid", "false");
      if (label === "Local offer") {
        await expect(preview.locator("p").last()).toHaveText(
          "120 Main St, Grand Rapids, MI 49503",
        );
      } else if (label === "Disclaimer") {
        await expect(preview.locator(".asset > div").last()).toHaveText(
          "120 Main St, Grand Rapids, MI 49503",
        );
      } else {
        await expect(preview.locator("p").first()).toContainText(
          " on 120 Main St, Grand Rapids, MI 49503 for refreshments",
        );
      }
    }
  }
});

test("Location keeps corporate values read-only and distinguishes missing configuration from no inputs", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Local offer mode").selectOption("database");
  await page.getByRole("button", { name: "Location", exact: true }).click();
  await expect(page.locator("input, textarea")).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Customize your asset" }),
  ).toContainText("No location inputs are required. Review Preview notes");
  await expect(
    page.getByText("Needs corporate configuration", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/ready to use/i)).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Provided by corporate" }),
  ).toContainText("Member FDIC. Rates subject to change.");
  await page.getByRole("button", { name: "Corporate", exact: true }).click();
  await page
    .getByLabel("Database field for local offer")
    .selectOption("manager_name");
  await page.getByRole("button", { name: "Location", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Customize your asset" }),
  ).toContainText("All asset values are provided.");
  await expect(page.locator("input, textarea")).toHaveCount(0);
  await page.getByRole("button", { name: "Corporate", exact: true }).click();
  await page.getByLabel("Corporate value for disclaimer").fill("");
  await page.getByRole("button", { name: "Location", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Customize your asset" }),
  ).toContainText("Review Preview notes");
});

test("multiline drafts and corporate text preserve visible breaks without interpreting HTML", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Corporate value for disclaimer")
    .fill("Member FDIC.\n<script>literal</script>");
  await page.getByRole("button", { name: "Location", exact: true }).click();
  await page
    .getByLabel("Local offer", { exact: true })
    .fill("First line\n<img src=x> & {phone}\nLast line");
  const frame = page.frameLocator("iframe");
  await expect(frame.locator("p br")).toHaveCount(2);
  await expect(frame.locator("p")).toHaveJSProperty(
    "innerText",
    "First line\n<img src=x> & {phone}\nLast line",
  );
  await expect(frame.locator(".asset > div").last()).toHaveJSProperty(
    "innerText",
    "Member FDIC.\n<script>literal</script>",
  );
  await expect(frame.locator("script")).toHaveCount(0);
  await expect(frame.locator("img")).toHaveCount(1);
});

test("both previews fit a laptop viewport, remain sticky, and resize proportionally", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  const preview = page.getByRole("region", { name: "Live preview" });
  for (const [name, width, height] of [
    ["Fall Rate Promo", 1200, 628],
    ["Branch Open House", 816, 1056],
  ] as const) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
    for (const viewportHeight of [768, 650]) {
      await page.setViewportSize({ width: 1366, height: viewportHeight });
      await page.getByLabel("Disclaimer mode").scrollIntoViewIfNeeded();
      await expect
        .poll(async () => {
          const panel = await preview.boundingBox();
          const artwork = await page.locator("iframe").boundingBox();
          return Boolean(
            panel &&
            artwork &&
            panel.y >= 0 &&
            panel.y + panel.height <= viewportHeight + 1 &&
            artwork.y >= panel.y &&
            artwork.y + artwork.height <= panel.y + panel.height,
          );
        })
        .toBe(true);
      const artwork = (await page.locator("iframe").boundingBox())!;
      expect(artwork.width / artwork.height).toBeCloseTo(width / height, 4);
      await expect(page.locator("iframe")).toHaveAttribute(
        "width",
        String(width),
      );
      await expect(page.locator("iframe")).toHaveAttribute(
        "height",
        String(height),
      );
    }
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("link", { name: "Jump to preview" }).click();
  await expect(page.locator("#asset-preview")).toBeFocused();
  const panel = (await preview.boundingBox())!;
  expect(panel.y).toBeGreaterThanOrEqual(0);
  expect(panel.y).toBeLessThan(60);
});
