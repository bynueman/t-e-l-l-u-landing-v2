import assert from "node:assert/strict";
import { test } from "node:test";
import { contactConfig, siteConfig } from "./site.ts";

test("contactConfig has verified official TELLU contact information", () => {
  assert.equal(contactConfig.whatsapp.displayNumber, "+62 815-8819-099");
  assert.equal(contactConfig.whatsapp.url, "https://wa.me/628158819099");
  assert.equal(contactConfig.whatsapp.number, "628158819099");

  assert.equal(contactConfig.email.address, "info@tellu.co");
  assert.equal(contactConfig.email.url, "mailto:info@tellu.co");

  assert.equal(contactConfig.instagram.handle, "@tellu.co");
  assert.equal(contactConfig.instagram.url, "https://www.instagram.com/tellu.co/");

  assert.equal(contactConfig.location.label, "Yogyakarta, Indonesia");
  assert.ok(contactConfig.location.mapUrl.includes("Yogyakarta"));
});

test("contactConfig.whatsapp.getDirectUrl formats message correctly", () => {
  const direct = contactConfig.whatsapp.getDirectUrl();
  assert.equal(direct, "https://wa.me/628158819099");

  const withMsg = contactConfig.whatsapp.getDirectUrl("Halo TELLU!");
  assert.equal(withMsg, "https://wa.me/628158819099?text=Halo%20TELLU!");
});

test("siteConfig contains reference to contactConfig", () => {
  assert.equal(siteConfig.contact, contactConfig);
});
