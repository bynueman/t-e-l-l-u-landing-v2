# Editorial and locale foundation

Indonesian is the active default. Named dictionary exports keep each UI import focused; English is type checked but is not imported by live components. Static pages and their copy remain server rendered. Portfolio names, URLs, and eligibility stay in the factual project registry. Search matching remains in its independent intent registry.

Voice: clear, practical, friendly, and confident. Address customers as “kamu” in Indonesian. Explain the service before describing the brand. Keep Technology, Creative, Business, Starter, and Custom Solution as official names. Avoid promises about rankings, deadlines, unlimited services, or business results.

Future routing: implement `/[locale]` for `id` and `en`, validate the locale on the server, load only that locale's dictionary, and pass small translated sections into interactive components. Set the real document language and localized metadata in the locale layout. Preserve existing routes through intentional redirects and retain hashes. Add a working language switcher that preserves route and fragment only once both route trees exist. Add alternate URLs only when the production origin and both published routes are known.

Deferred: translated routes, language persistence/switching, Creative and Business page translation, and hreflang. No language control is shown in this phase.

Portfolio descriptions remain source-backed Indonesian business data. Translate their display alongside locale routes; do not change project IDs, URLs, or embedding eligibility.
