# Button — component library entry

Shared CTA primitive: `src/app/components/Button.tsx`.

Addresses UI/UX evaluation item **AN#2** ("Document and implement full component
state set"), which scored Component Visual Polish 8.5 because only happy-path
states existed.

```tsx
import { Button } from "./components/Button";

<Button variant="primary" size="lg" fullWidth loading={submitting}>
  Sign In
</Button>
```

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `primary \| secondary \| amber \| danger \| ghost` | `primary` | See colour table below |
| `size` | `sm \| md \| lg` | `md` | `sm` still meets the 24×24 target minimum |
| `loading` | `boolean` | `false` | Spinner + `aria-busy`; clicks swallowed, stays focusable |
| `error` | `string` | – | Danger border + `role="alert"` message, linked via `aria-describedby` |
| `disabled` | `boolean` | `false` | 50% opacity, removed from tab order by the browser |
| `fullWidth` | `boolean` | `false` | Wrapper becomes `block w-full` |
| `leadingIcon` / `trailingIcon` | `ReactNode` | – | `leadingIcon` is replaced by the spinner while loading |

## State set

| State | Trigger | Behaviour |
|---|---|---|
| default | — | Solid brand fill |
| hover | `:hover` | 90% opacity — no transform, so no cursor-boundary flicker |
| focus | `:focus-visible` | 3px ring from the global `:focus-visible` rule (WCAG 2.4.7) |
| loading | `loading` | Spinner, `aria-busy="true"`, `cursor-wait`, click prevented |
| disabled | `disabled` | 50% opacity, `cursor-not-allowed`, not focusable |
| error | `error="…"` | Red border + inline live message below |

## Contrast (WCAG 1.4.3, measured)

| Variant | Pair | Ratio |
|---|---|---|
| primary | `#FFFFFF` on `#344EAD` | 7.40:1 |
| secondary | `#344EAD` on `#FFFFFF` | 7.40:1 |
| amber | `#1F2937` on `#F59E0B` | 6.83:1 |
| danger | `#FFFFFF` on `#DC2626` | 4.83:1 |
| ghost | `#4B5563` on `#FFFFFF` | 7.56:1 |

> **Amber uses dark text on purpose.** White on `#F59E0B` measures **2.15:1** and
> fails AA. Any new amber CTA must keep `#1F2937` text.

## Rules

- Do not hand-roll a `<button>` with inline brand colours — extend a variant here
  so state coverage and contrast stay guaranteed in one place.
- Prefer `loading` over disabling a submit button during async work: disabling
  removes it from the tab order and strands screen-reader users mid-form.
- Anything that *navigates* should be an `<a href={tabHref(tab)}>`, not a Button —
  see `src/app/routes.ts`. Buttons are for actions only.

## Verification

`npm run a11y` runs axe-core over every route at mobile + desktop and must report
0 violations.
