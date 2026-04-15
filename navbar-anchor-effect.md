# Navbar Cursor-Following Bubble Effect Implementation

## Summary of Changes

This document outlines the CSS changes implemented to add a cursor-following bubble effect to the navbar links in `landingpage.html`. The effect uses the CSS Anchor Positioning API to create a smooth, animated background highlight that follows mouse hover on `.navbar-link` elements.

## Key Changes Made

1. **Added `interpolate-size: allow-keywords` to `html`** - Enables interpolation of size values for smooth animations.

2. **Modified `.navbar-nav`** - Added `anchor-name: --hovered-link` and `isolation: isolate` to establish the anchor reference.

3. **Updated `.navbar-link:hover`** - Added `anchor-name: --hovered-link` to dynamically set the anchor on hover.

4. **Added pseudo-elements to `.navbar-nav`** - Implemented `::before` and `::after` with anchor positioning for the bubble effect.

## Full CSS Code Implemented

```css
/* Added to html */
html {
    scroll-behavior: smooth;
    interpolate-size: allow-keywords;
}

/* Modified .navbar-nav */
.navbar-nav {
            display: flex;
    align-items: center;
    position: relative;
    anchor-name: --hovered-link;
    isolation: isolate;
        }

/* New pseudo-elements for bubble effect */
.navbar-nav::before,
.navbar-nav::after {
    content: "";
    position: absolute;
    top: calc(anchor(bottom) - 10px);
    left: calc(anchor(left) + 1rem);
    right: calc(anchor(right) + 1rem);
    bottom: calc(anchor(bottom) + 5px);
    border-radius: 30px;
    position-anchor: --hovered-link;
    transition: 500ms linear(0, 0.029 1.6%, 0.123 3.5%, 0.651 10.6%, 0.862 14.1%, 1.002 17.7%, 1.046 19.6%, 1.074 21.6%, 1.087 23.9%, 1.086 26.6%, 1.014 38.5%, 0.994 46.3%, 1);
}

.navbar-nav::before {
    z-index: -1;
    background: rgb(255, 255, 255);
    backdrop-filter: blur(2px);
}

.navbar-nav::after {
    z-index: -2;
    background: rgba(255, 255, 255, 0.05);
}

/* Hover state positioning */
.navbar-nav:has(.navbar-link:hover)::before,
.navbar-nav:has(.navbar-link:hover)::after {
    top: anchor(top);
    left: anchor(left);
    right: anchor(right);
    bottom: anchor(bottom);
    border-radius: 30px;
}

/* Edge link border-radius adjustments */
.navbar-nav:has(.navbar-link:first-of-type:hover)::before,
.navbar-nav:has(.navbar-link:first-of-type:hover)::after {
    border-radius: 32px 30px 30px 32px;
}

.navbar-nav:has(.navbar-link:last-of-type:hover)::before,
.navbar-nav:has(.navbar-link:last-of-type:hover)::after {
    border-radius: 30px 32px 32px 30px;
}


/* Modified .navbar-link:hover */
.navbar-link:hover {
    color: #20243b !important;
    transition: all 300ms var(--ease-in-out) !important;
    anchor-name: --hovered-link;
}

.navbar-link {
            font-family: 'oldschool-grotesk-regular', sans-serif;
            font-size: 16px;
            font-weight: 400;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 200ms var(--custom-curve) !important;
            white-space: nowrap;
            padding: 9px 18px;
            position: relative;
            color: aliceblue;
        }

        ```
## How It Works

- The `anchor-name` property creates a named anchor point that can be referenced by positioned elements.
- When a `.navbar-link` is hovered, it takes the `--hovered-link` anchor name, causing the pseudo-elements to reposition to that element.
- The `position-anchor` property on the pseudo-elements makes them anchor to the `--hovered-link`.
- The `anchor()` function calculates positions relative to the anchored element.
- The custom `linear()` easing provides a bouncy, organic animation feel.

## Browser Support

This effect uses modern CSS Anchor Positioning API, which is currently supported in:
- Chrome 125+
- Firefox (behind flag)
- Safari (limited support)

For broader compatibility, consider using the [Anchor Positioning Polyfill](https://github.com/oddbird/css-anchor-positioning).</content>
<parameter name="filePath">navbar-anchor-effect.md