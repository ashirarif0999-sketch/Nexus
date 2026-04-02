# Navbar Dropdown Structure - CSS & JavaScript Documentation

## Overview
This document contains all CSS and JavaScript code related to the navbar dropdown window structure, which includes three dropdown groups (Products, Solutions, Resources) with 3-column layouts and interactive video playback.

---

## CSS STYLING

### Main Navbar Container
```css
/* ============================================
   NAVBAR DROPDOWN WINDOW (Main Container)
   ============================================ */
.navbar-dropdown-window {
    position: absolute;
    top: calc(60px + 0.5rem);
    left: 50%;
    transform: translateX(-50%);
    width: 90vw;
    max-width: 1000px;
    max-height: max-content !important;
    overflow: hidden;
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.12);
    transition: max-height 300ms var(--ease-out);
    z-index: 100;
}

.navbar-nav:has(.navbar-link:hover) .navbar-dropdown-window {
    max-height: max-content;
}

.navbar-link[href*="pricing"]:hover ~ .navbar-dropdown-window {
    max-height: max-content !important;
}
```

### Dropdown Groups (Products / Solutions / Resources)
```css
/* ============================================
   NAVBAR DROPDOWN GROUPS
   (Products / Solutions / Resources)
   ============================================ */
.navbar-dropdown-group {
    display: none;
}

.navbar-dropdown-group.active {
    display: block;
}

.navbar-dropdown-group-products {
    /* Visible when products group is active */
}

.navbar-dropdown-group-solutions {
    /* Visible when solutions group is active */
}

.navbar-dropdown-group-resources {
    /* Visible when resources group is active */
}
```

### Dropdown Content Grid Layout
```css
/* ============================================
   DROPDOWN CONTENT WRAPPER
   ============================================ */
.navbar-dropdown-content {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    padding: 20px;
    min-height: 350px;
    justify-items: center;
    width: fit-content;
    margin: 0 auto;
}
```

### Dropdown Columns
```css
/* ============================================
   DROPDOWN COLUMNS
   ============================================ */
.navbar-dropdown-column {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 182px;
}

.navbar-dropdown-column.navbar-dropdown-showcase {
    gap: 12px;
    background: #f1f3ff;
    padding: 40px;
    width: max-content;
    border-radius: 8px;
}
```

### Section Titles
```css
/* ============================================
   SECTION TITLES
   ============================================ */
.navbar-dropdown-section-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #999999;
    margin: 0;
    line-height: 1;
}
```

### Dropdown Lists
```css
/* ============================================
   DROPDOWN LIST (Container for links)
   ============================================ */
.navbar-dropdown-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
```

### Dropdown Links
```css
/* ============================================
   DROPDOWN LINKS
   ============================================ */
.navbar-dropdown-link {
    font-family: 'DM Sans', sans-serif;
    font-size: 18px;
    font-weight: 400;
    color: #1a1a1a;
    text-decoration: none;
    transition: color 200ms var(--ease-out);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
}

.navbar-dropdown-link:hover {
    color: #405CFF;
}

.navbar-dropdown-link-inline {
    color: #405CFF;
    font-weight: 500;
    text-decoration: none;
    transition: color 200ms var(--ease-out);
}

.navbar-dropdown-link-inline:hover {
    color: #2d3fa6;
}
```

### Beta Badge
```css
/* ============================================
   BETA BADGE
   ============================================ */
.badge-beta {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    color: #999999;
    background: #d8d8d8;
    letter-spacing: 0.05em;
    margin-left: 4px;
    padding: 0px 4px;
    border-radius: 3px;
}
```

### Footer Text in Dropdown
```css
/* ============================================
   FOOTER TEXT (in dropdown)
   ============================================ */
.navbar-dropdown-footer-text {
    font-size: 14px;
    color: #666666;
    margin-top: 8px;
    line-height: 1.4;
    position: absolute;
    bottom: 24px;
    left: 28px;
    width: max-content;
}
```

### Showcase Section (Product Cards)
```css
/* ============================================
   SHOWCASE SECTION (Product Cards)
   ============================================ */
.navbar-dropdown-showcase-list {
    display: flex;
    flex-direction: column;
}

.navbar-dropdown-showcase-card {
    display: flex;
    flex-direction: row;
    gap: 8px;
    cursor: pointer;
    padding-top: 20px;
    transition: transform 200ms var(--ease-out);
}

.navbar-dropdown-showcase-card-single {
    flex-direction: row;
    gap: 12px;
    align-items: flex-start;
}

.navbar-dropdown-showcase-card-content {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    width: 100%;
}

.navbar-dropdown-showcase-card-g1 .navbar-dropdown-showcase-image {
    width: 130px;
}

.navbar-dropdown-showcase-card.navbar-dropdown-showcase-card-g3 {
    width: 400px;
}
```

### Showcase Image Placeholder
```css
/* ============================================
   SHOWCASE IMAGE PLACEHOLDER
   ============================================ */
.navbar-dropdown-showcase-image {
    height: -webkit-fill-available;
    aspect-ratio: 1/1;
    overflow: hidden;
    background: linear-gradient(135deg, #f0f0f0 0%, #e8e8e8 100%);
    border-radius: 8px;
    flex-shrink: 0;
}

.navbar-dropdown-showcase-card-g2 .navbar-dropdown-showcase-image {
    width: max-content !important;
    aspect-ratio: 16/9;
    border-radius: 6px;
}

.navbar-dropdown-showcase-card-g2 {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.navbar-dropdown-showcase-card-g3 .navbar-dropdown-showcase-image {
    width: stretch !important;
    height: stretch !important;
    max-width: 200px !important;
    aspect-ratio: 16/9;
}

.navbar-dropdown-showcase-card-single .navbar-dropdown-showcase-image {
    width: stretch !important;
    aspect-ratio: 3 / 2;
    min-width: 120px;
    border-radius: 6px;
}
```

### Showcase Title & Description
```css
/* ============================================
   SHOWCASE TITLE
   ============================================ */
.navbar-dropdown-showcase-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: #1a1a1a;
    margin: 0;
    line-height: 1.3;
}

/* ============================================
   SHOWCASE DESCRIPTION & TAG
   ============================================ */
.navbar-dropdown-showcase-description {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    color: #666666;
    margin: 0;
    line-height: 1.4;
}

.navbar-dropdown-showcase-tag {
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    color: #999999;
    margin: 0;
    letter-spacing: 0.05em;
}
```

### Navbar Links Active State
```css
/* ============================================
   NAVBAR LINK STYLING
   ============================================ */
.navbar-link {
    font-family: 'DM Sans', sans-serif;
    font-size: 16px;
    font-weight: 400;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 200ms var(--ease-out) !important;
    white-space: nowrap;
    padding: 9px 18px;
    border-radius: 30px;
    position: relative;
    color: aliceblue;
}

.navbar-link:hover {
    background: #E6E6F2;
    color: #20243b !important;
}

.navbar-link.active {
    background: #405cff;
    color: #ffffff !important;
    font-size: 21px;
    border-radius: 7px;
    padding: 5px 23px;
    transition: all 200ms var(--ease-out) !important;
}

.navbar-link svg {
    width: 12px;
    height: 12px;
    opacity: 0.6;
}

.navbar-link:hover svg {
    opacity: 1;
}
```

### Showcase Wrapper Groups
```css
.navbar-dropdown-showcase-card-g2 .navbar-dropdown-showcase-image {
    width: stretch !important;
    height: stretch !important;
    max-width: 400px;
}

.showcase-wrapper-group-1 {
    /* Text content wrapper for group 1 */
}

.showcase-wrapper-group-2 {
    /* Text content wrapper for group 2 */
}

.showcase-wrapper-group-3 {
    align-self: center;
}
```

---

## JAVASCRIPT FUNCTIONALITY

### Dropdown Control Script
```javascript
// ============================================
// DROPDOWN WINDOW SHOW/HIDE WITH GROUP CONTROL
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const dropdownWindow = document.querySelector('.navbar-dropdown-window');
    const navbarNav = document.querySelector('.navbar-nav');
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.navbar-link:not([href*="pricing"])');
    const groups = {
        products: document.querySelector('.navbar-dropdown-group-products'),
        solutions: document.querySelector('.navbar-dropdown-group-solutions'),
        resources: document.querySelector('.navbar-dropdown-group-resources')
    };
    
    let hideTimeout;
    let currentActiveGroup = null;
    let activeLink = null; // Track which link is currently active

    function showDropdown(groupName) {
        clearTimeout(hideTimeout);
        
        // Hide all groups
        Object.values(groups).forEach(group => {
            if (group) group.classList.remove('active');
        });
        
        // Show the requested group
        if (groups[groupName]) {
            groups[groupName].classList.add('active');
            currentActiveGroup = groupName;
        }
        
        if (dropdownWindow) {
            dropdownWindow.style.maxHeight = 'max-content';
        }
    }

    function hideDropdown() {
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
            // Hide all groups
            Object.values(groups).forEach(group => {
                if (group) group.classList.remove('active');
            });
            
            if (dropdownWindow) {
                dropdownWindow.style.maxHeight = '0';
            }
            currentActiveGroup = null;
        }, 300);
    }

    // Map each navbar link to its corresponding group
    const linkGroupMap = {
        0: 'products',    // First link (Products)
        1: 'solutions',    // Second link (Solutions)
        2: 'resources'     // Third link (Resources - Pricing is excluded from selection)
    };

    navLinks.forEach((link, index) => {
        if (linkGroupMap[index]) {
            // Hover functionality
            link.addEventListener('mouseenter', () => {
                if (!activeLink) {
                    showDropdown(linkGroupMap[index]);
                }
            });
            link.addEventListener('mouseleave', () => {
                if (!activeLink) {
                    hideDropdown();
                }
            });
            
            // Click functionality
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (activeLink === link) {
                    // Clicking the same link again closes it
                    activeLink = null;
                    link.classList.remove('active');
                    hideDropdown();
                } else {
                    // Switching to a different link
                    if (activeLink) {
                        activeLink.classList.remove('active');
                    }
                    activeLink = link;
                    link.classList.add('active');
                    showDropdown(linkGroupMap[index]);
                }
            });
        }
    });

    if (dropdownWindow) {
        dropdownWindow.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
        });
        dropdownWindow.addEventListener('mouseleave', () => {
            if (!activeLink) {
                hideDropdown();
            }
        });
    }
    
    // Close dropdown when clicking outside (but not on navbar items)
    document.addEventListener('click', (e) => {
        if (activeLink && !navbar.contains(e.target)) {
            activeLink.classList.remove('active');
            activeLink = null;
            hideDropdown();
        }
    });
});
```

### Video Playback Control Script
```javascript
// ============================================
// NAVBAR SHOWCASE VIDEO HOVER CONTROL
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const showcaseCards = document.querySelectorAll('.navbar-dropdown-showcase-card-g1');
    
    showcaseCards.forEach(card => {
        const video = card.querySelector('video');
        if (!video) return;
        
        let isPlaying = false;
        let playbackDirection = 1; // 1 for forward, -1 for reverse
        let animationFrameId = null;
        
        // Initialize video to start
        video.currentTime = 0;
        
        function playVideoForward() {
            playbackDirection = 1;
            video.playbackRate = 1;
            
            // Stop any existing animation
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            
            // Play the video forward
            if (video.paused) {
                video.play().catch(err => console.log('Play error:', err));
            }
        }
        
        function playVideoReverse() {
            playbackDirection = -1;
            
            // Stop any existing animation
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            
            // Play video in reverse by manipulating currentTime
            function reverse() {
                video.pause();
                video.currentTime = Math.max(0, video.currentTime - 0.05);
                
                if (video.currentTime > 0) {
                    animationFrameId = requestAnimationFrame(reverse);
                }
            }
            
            reverse();
        }
        
        // Add hover listeners to the card
        card.addEventListener('mouseenter', playVideoForward);
        card.addEventListener('mouseleave', playVideoReverse);
    });
});
```

---

## HTML STRUCTURE REFERENCE

### Products Dropdown Group
```html
<div class="navbar-dropdown-group navbar-dropdown-group-products">
    <div class="navbar-dropdown-content">
        <!-- Left Column: Fund Administration -->
        <div class="navbar-dropdown-column">
            <h4 class="navbar-dropdown-section-title">FUND ADMINISTRATION</h4>
            <div class="navbar-dropdown-list">
                <a href="#" class="navbar-dropdown-link">Venture Funds</a>
                <a href="#" class="navbar-dropdown-link">Rolling Funds</a>
                <a href="#" class="navbar-dropdown-link">Scout Funds</a>
                <a href="#" class="navbar-dropdown-link">SPVs</a>
                <a href="#" class="navbar-dropdown-link">Roll Up Vehicles</a>
                <p class="navbar-dropdown-footer-text">Looking for tools for startups? Explore <a href="#" class="navbar-dropdown-link-inline">Rollups</a></p>
            </div>
        </div>

        <!-- Center Column: Investor Management + Intelligence -->
        <div class="navbar-dropdown-column">
            <h4 class="navbar-dropdown-section-title">INVESTOR MANAGEMENT</h4>
            <div class="navbar-dropdown-list">
                <a href="#" class="navbar-dropdown-link">Digital Subscriptions</a>
                <a href="#" class="navbar-dropdown-link">Data Room</a>
            </div>
            
            <h4 class="navbar-dropdown-section-title" style="margin-top: 16px;">INTELLIGENCE</h4>
            <div class="navbar-dropdown-list">
                <a href="#" class="navbar-dropdown-link">Fin <span class="badge-beta">BETA</span></a>
            </div>
        </div>

        <!-- Right Column: Product Suites Showcase -->
        <div class="navbar-dropdown-column navbar-dropdown-showcase">
            <h4 class="navbar-dropdown-section-title">PRODUCT SUITES</h4>
            <div class="navbar-dropdown-showcase-list">
                <div class="navbar-dropdown-showcase-card navbar-dropdown-showcase-card-g1">
                    <div class="navbar-dropdown-showcase-image">
                        <video src="videos/Video Project 3.mp4" width="100%" height="100%" muted></video>
                    </div>
                    <div class="showcase-wrapper-group-1">
                        <h5 class="navbar-dropdown-showcase-title">Fund Administration</h5>
                        <p class="navbar-dropdown-showcase-description">All-in-one partner to launch an investment vehicle</p>
                    </div>
                </div>
                <div class="navbar-dropdown-showcase-card navbar-dropdown-showcase-card-g1">
                    <div class="navbar-dropdown-showcase-image">
                        <video src="videos/Video Project (1).mp4" width="100%" height="100%" muted></video>
                    </div>
                    <div class="showcase-wrapper-group-1">
                        <h5 class="navbar-dropdown-showcase-title">Investor Management</h5>
                        <p class="navbar-dropdown-showcase-description">Explore all offerings to streamline the investor experience</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
```

### Solutions Dropdown Group
```html
<div class="navbar-dropdown-group navbar-dropdown-group-solutions">
    <div class="navbar-dropdown-content">
        <!-- Left Column: By Product Suite -->
        <div class="navbar-dropdown-column">
            <h4 class="navbar-dropdown-section-title">BY PRODUCT SUITE</h4>
            <div class="navbar-dropdown-list">
                <a href="#" class="navbar-dropdown-link">Fund Administration</a>
                <a href="#" class="navbar-dropdown-link">Investor Management</a>
            </div>
        </div>

        <!-- Center Column: Who We Serve -->
        <div class="navbar-dropdown-column">
            <h4 class="navbar-dropdown-section-title">WHO WE SERVE</h4>
            <div class="navbar-dropdown-list">
                <a href="#" class="navbar-dropdown-link">Emerging Managers</a>
                <a href="#" class="navbar-dropdown-link">Established Venture</a>
                <a href="#" class="navbar-dropdown-link">Institutional Investors</a>
                <a href="#" class="navbar-dropdown-link">Crypto</a>
            </div>
        </div>

        <!-- Right Column: Featured Use Case -->
        <div class="navbar-dropdown-column navbar-dropdown-showcase">
            <h4 class="navbar-dropdown-section-title">FEATURED USE CASE</h4>
            <div class="navbar-dropdown-showcase-card navbar-dropdown-showcase-card-single">
                <div class="navbar-dropdown-showcase-card-content navbar-dropdown-showcase-card-g2">
                    <div class="navbar-dropdown-showcase-image">
                        <img src="https://www.rillion.com/hs-fs/hubfs/website-images/Featured/1_1_Custom%20approval%20workflows_Featured8_1080x1080.png?width=600&height=600&name=1_1_Custom%20approval%20workflows_Featured8_1080x1080.png" width="100%" height="100%" alt="Browder Capital" style="object-fit: cover; border-radius: var(--radius-lg);">
                    </div>
                    <div class="showcase-wrapper-group-2">
                        <h5 class="navbar-dropdown-showcase-title"></h5>
                        <p class="navbar-dropdown-showcase-description">Switch your fund admin with confidence</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
```

### Resources Dropdown Group
```html
<div class="navbar-dropdown-group navbar-dropdown-group-resources">
    <div class="navbar-dropdown-content">
        <!-- Left Column: Explore -->
        <div class="navbar-dropdown-column">
            <h4 class="navbar-dropdown-section-title">EXPLORE</h4>
            <div class="navbar-dropdown-list">
                <a href="#" class="navbar-dropdown-link">Blog</a>
                <a href="#" class="navbar-dropdown-link">Help Center</a>
                <a href="#" class="navbar-dropdown-link">Education Center</a>
                <a href="#" class="navbar-dropdown-link">Data Center</a>
            </div>
        </div>

        <!-- Center Column: Company -->
        <div class="navbar-dropdown-column">
            <h4 class="navbar-dropdown-section-title">COMPANY</h4>
            <div class="navbar-dropdown-list">
                <a href="#" class="navbar-dropdown-link">About Us</a>
                <a href="#" class="navbar-dropdown-link">Careers</a>
                <a href="#" class="navbar-dropdown-link">Engineering</a>
            </div>
        </div>

        <!-- Right Column: Featured Resources -->
        <div class="navbar-dropdown-column navbar-dropdown-showcase">
            <h4 class="navbar-dropdown-section-title">FEATURED</h4>
            <div class="navbar-dropdown-showcase-list">
                <div class="navbar-dropdown-showcase-card navbar-dropdown-showcase-card-g3">
                    <div class="navbar-dropdown-showcase-image">
                        <image src="navbar 3.png" width="100%" height="100%" alt="Fund Benchmarks Report 2025" style="object-fit: cover; border-radius: var(--radius-lg);"></image>
                    </div>
                    <div class="showcase-wrapper-group-3">
                        <h5 class="navbar-dropdown-showcase-title">The Fund Benchmarks Report 2025</h5>
                        <p class="navbar-dropdown-showcase-tag">DATA CENTER</p>
                    </div>
                </div>
                <div class="navbar-dropdown-showcase-card navbar-dropdown-showcase-card-g3">
                    <div class="navbar-dropdown-showcase-image">
                        <img src="navbar 4.png" width="100%" height="100%" alt="How Browder Capital Launched Institutional Fund IV with AngelList" style="object-fit: cover; border-radius: var(--radius-lg);">
                    </div>
                    <div class="showcase-wrapper-group-3">
                        <h5 class="navbar-dropdown-showcase-title">How Browder Capital Launched Institutional Fund IV with AngelList</h5>
                        <p class="navbar-dropdown-showcase-tag">BLOG</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
```

---

## KEY BEHAVIORS & INTERACTIONS

### 1. **Hover Behavior**
- **When hovering over a navbar link (Products, Solutions, Resources):**
  - If no link is currently "active" (clicked), show the corresponding dropdown group
  - Display group with smooth max-height transition (300ms)

### 2. **Click Behavior**
- **First click on a link:**
  - Shows the dropdown and adds `.active` class to the link
  - Link appears with blue background (#405cff) and white text
  - Dropdown stays visible even when mouse leaves the navbar

- **Click on another link:**
  - Switches to that group's dropdown immediately
  - Updates active link styling
  - No need to close first

- **Click on same active link again:**
  - Closes the dropdown
  - Removes `.active` class from link
  - Returns to hover-only mode

### 3. **Click Outside Behavior**
- If a dropdown is active (has clicked link) and user clicks outside the navbar:
  - Closes the dropdown immediately
  - Removes `.active` class
  - Returns to hover mode

### 4. **Dropdown Window**
- Always positioned absolutely below the navbar
- Centered horizontally: `left: 50%; transform: translateX(-50%);`
- White background with subtle shadow
- Border-radius: 12px

### 5. **Group Visibility**
- Only ONE group visible at a time
- Groups hidden by default (`.navbar-dropdown-group { display: none; }`)
- Shown with `.active` class (`.navbar-dropdown-group.active { display: block; }`)

### 6. **Video Playback**
- **On mouseenter (card hover):**
  - Play video forward at normal speed
  - `video.play()`

- **On mouseleave (card unhover):**
  - Play video in reverse using requestAnimationFrame
  - Decrement currentTime by 0.05s per frame
  - Stop at currentTime = 0
  - Cancel existing animation frame to prevent conflicts

---

## CSS VARIABLES USED

```css
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--radius-lg: 12px
--radius-md: 8px
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.16)
--text-primary: #1a1a1a
--text-secondary: #404046
--text-tertiary: #767682
```

---

## Browser Compatibility

- **Desktop:** Full support for hover, click, and video playback
- **Tablet (≤1024px):** Hamburger menu visible, navbar dropdown hidden
- **Mobile (≤768px):** Fully mobile navigation overlay visible

---

## Performance Notes

1. **Video Loading:** Videos use `muted` attribute (no autoplay/loop)
2. **Animation Frames:** Video reverse playback uses `requestAnimationFrame` for smooth control
3. **Event Delegation:** Uses event listeners on individual links, not delegation
4. **Z-index:** Dropdown window z-index: 100; navbar z-index: 1000

---

## Customization Points

1. **Max-width:** Change `.navbar-dropdown-window` max-width (currently 1000px)
2. **Grid columns:** Modify `.navbar-dropdown-content` grid-template-columns
3. **Colors:** Update hover/active link colors in `.navbar-link:hover` and `.navbar-link.active`
4. **Animation timing:** Adjust transition values (currently 300ms)
5. **Video playback speed:** Modify `.navbar-dropdown-showcase-card-g1` video reverse step (currently 0.05s)

---

## File Location

All code is contained in: **`d:\.PROJECTS\Nexuso\public\landingpage.html`**

- CSS: Lines 565-850+ (embedded in `<style>` tag)
- JavaScript: Lines 3569-3690+ (dropdown control and video playback)
- HTML: Lines 2787-2945 (dropdown structure)

