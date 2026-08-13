
  # Design and Slice Menu Items

  This is a code bundle for Design and Slice Menu Items. The original project is available at https://www.figma.com/design/qzDx0YdEIGfs7jGFEYeOqW/Design-and-Slice-Menu-Items.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

## Environment

Copy the values into `.env`. Both are read at build time, so restart the dev
server after changing either.

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_URL` | no | Base URL of the Lao Citizen Center API. Defaults to `http://localhost:8080/api/v1`. |
| `VITE_GOOGLE_CLIENT_ID` | for Google sign-in | Google OAuth client id. Must be **identical** to `GOOGLE_CLIENT_ID` on the API, which rejects any ID token not addressed to it. |

A Google client id is public by design and ships in the browser bundle. The
client **secret** belongs to a different OAuth flow, is not used here, and must
never appear in this repository.

Leave `VITE_GOOGLE_CLIENT_ID` unset and the "Continue with Google" button
renders disabled with an explanation instead of failing when pressed.

The origin this app is served from must be listed under the OAuth client's
**Authorized JavaScript origins** in Google Cloud Console — `http://localhost:5173`
for `npm run dev`, `http://localhost:4173` for `npm run preview`. Setup and
troubleshooting: `docs/GOOGLE-SIGN-IN.md` in the API repository.
