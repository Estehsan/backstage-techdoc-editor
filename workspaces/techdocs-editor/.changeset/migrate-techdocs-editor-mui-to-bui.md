---
'@estehsaan/backstage-plugin-techdocs-editor-react': minor
'@estehsaan/backstage-plugin-techdocs-editor': minor
---

**Migrate React components from Material UI to Backstage UI.**

All React components in `techdocs-editor-react` and the `TechDocsEditPageAddon` addon have been migrated from Material UI v4 (`@material-ui/core`, `@material-ui/icons`) to Backstage UI (BUI, `@backstage/ui`). Component props and public types remain unchanged; this is a visual/DOM refactor.

- Replaced `makeStyles` with CSS modules using BUI design tokens.
- Replaced MUI components with BUI equivalents: `Button`→`Button`/`ButtonLink`/`ButtonIcon`, `Checkbox`→`Checkbox`, `Dialog`→`Dialog` (with `DialogHeader`/`DialogBody`/`DialogFooter`), `Tabs`/`Tab`→BUI equivalents, `TextField`→`TextField`/`<textarea>`, `Typography`→`Text`, `Tooltip`→`TooltipTrigger`+`Tooltip`, `ButtonGroup`→`ToggleButtonGroup`, `Snackbar`→`Alert`, `List`/`Collapse`→native HTML tree.
- Replaced `@material-ui/icons` imports with `@remixicon/react`.
- Updated jest CSS module mapper and added an ambient `.module.css` type declaration.

No breaking changes to public component APIs.
