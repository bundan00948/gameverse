# Tighter homepage, bigger background pattern, Login button

## 1. Less empty space on the homepage
The main section currently stretches to fill the whole screen, leaving a large gap above and below the title. Cut that height by about 25% so the title, tagline and buttons sit closer to the menu and footer. Also trim the spacing under the section by the same amount.

## 2. Bigger background pattern
Make the drifting rounded squares roughly 1.6x larger (and the repeat spacing to match), in both Dark and Bright modes. The drift animation is scaled so it still loops smoothly.

## 3. Login button and page
- Add a "Login" outline button in the top menu, next to Register (on every page).
- Add a Login button beside Register on the homepage? No - homepage keeps Register + Discord; Login lives in the menu.
- New Login page in the same style as the sign-up page: username, password, a Login button, and a "Don't have an account? Register" link. Like sign-up, it shows a "not open yet" message for now, since real accounts aren't set up.
- Sign-up page gets an "Already have an account? Login" link.

## Technical details
- `src/routes/index.tsx`: change `lg:min-h-[calc(100vh-88px)]` to `lg:min-h-[calc(75vh-88px)]`, `pb-20/lg:pb-24` to `pb-14/lg:pb-18`.
- `src/styles.css`: `--tiles-image` SVG to 200x200 with 66px squares (both themes); `background-size: 200px`; keyframe end `200px -200px`.
- `src/components/site-header.tsx`: add Link to `/login` using `ghostButtonClass`.
- New `src/routes/login.tsx` with its own head() metadata; update routing test if it lists routes.
