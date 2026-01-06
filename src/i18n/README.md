# i18n

To add a new language:

1. Create `src/i18n/locales/<code>/` and add JSON files for `app`, `addZone`, `privacy`, `timeBar`, `assets`, and `geo`.
2. Add the language code to `supportedLanguages` in `src/i18n/supportedLanguages.ts`.
3. Import the new resources in `src/i18n/index.ts`.

Validation:

- Run `npx tsx scripts/validate-i18n.ts` to verify all `pl/` and `ja/` keys match `en/`.
- Run `npx tsx scripts/validate-geo-i18n.ts` to verify `geo.json` keys match `en/`.
