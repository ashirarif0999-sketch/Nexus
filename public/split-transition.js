// Split Page Transition System (Vertical Panels)
(function() {
    // 1. Inject Transition Styles immediately
    const style = document.createElement('style');
    style.textContent = `
        .transition-overlay {
            position: fixed;
            top: 0;
            width: 50%;
            height: 100%;
            background: #e2e2e2;
            z-index: 999999;
            pointer-events: none;
            will-change: transform;
            visibility: visible !important;
            opacity: 1 !important;
        }
        #transition-left { left: 0; }
        #transition-right { right: 0; }
        
        #transition-loader-wrapper {
            position: fixed;
            inset: 0;
            z-index: 9999999;
            display: none;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            visibility: visible !important;
            opacity: 1;
        }
        
        .loading-spinner-dot {
            fill: #000000;
            transition: cx 0.5s cubic-bezier(0.3, 1.4, 0.4, 1),
                        cy 0.5s cubic-bezier(0.3, 1.4, 0.4, 1),
                        r 0.5s cubic-bezier(0.3, 1.4, 0.4, 1);
        }
        
        .loading-spinner-gooey {
            transform-origin: 100px 100px;
            transition: transform 0.5s linear;
        }
    `;
    document.documentElement.appendChild(style);

    // 2. Create Transition Elements
    function createElements() {
        if (document.getElementById('transition-left')) return;
        
        const left = document.createElement('div');
        left.id = 'transition-left';
        left.className = 'transition-overlay';
        
        const right = document.createElement('div');
        right.id = 'transition-right';
        right.className = 'transition-overlay';
        
        const loaderWrapper = document.createElement('div');
        loaderWrapper.id = 'transition-loader-wrapper';
        loaderWrapper.innerHTML = `
            <svg viewBox="0 0 200 200" style="width: 192px; height: 192px;">
                <defs>
                    <filter id="goo-transition">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0
                            0 1 0 0 0
                            0 0 1 0 0
                            0 0 0 20 -10" result="goo" />
                        <feBlend in="SourceGraphic" in2="goo" />
                    </filter>
                </defs>
                <g id="transition-gooey" class="loading-spinner-gooey">
                    <circle class="loading-spinner-dot" cx="100" cy="100" r="6" fill="black" />
                </g>
            </svg>
        `;
        
        // Append to HTML instead of body, so it stays visible even when body is hidden
        document.documentElement.appendChild(left);
        document.documentElement.appendChild(right);
        document.documentElement.appendChild(loaderWrapper);
    }

    // 3. Spinner Animation Logic (Adapted from TransitionWrapper.tsx)
    function runSpinner() {
        const svgGroup = document.getElementById('transition-gooey');
        if (!svgGroup) return;

        const spacing = 25;
        const createDot = (cx, cy, r) => {
            const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            dot.setAttribute("cx", cx.toString());
            dot.setAttribute("cy", cy.toString());
            dot.setAttribute("r", r.toString());
            dot.classList.add("loading-spinner-dot");
            svgGroup.appendChild(dot);
            return dot;
        };

        const animateSpinner = () => {
            // Clear existing dots except center
            const dots = svgGroup.querySelectorAll(".loading-spinner-dot");
            dots.forEach((dot, index) => {
                if (index > 0) dot.remove();
            });

            const allDots = [];
            // Cardinal directions
            const cardinal = [
                { cx: 100, cy: 100 - spacing },
                { cx: 100, cy: 100 + spacing },
                { cx: 100 - spacing, cy: 100 },
                { cx: 100 + spacing, cy: 100 }
            ];

            cardinal.forEach(pos => {
                const dot = createDot(100, 100, 6);
                allDots.push(dot);
                setTimeout(() => {
                    dot.setAttribute("r", "8");
                    dot.setAttribute("cx", ((100 + pos.cx) / 2).toString());
                    dot.setAttribute("cy", ((100 + pos.cy) / 2).toString());
                }, 50);
                setTimeout(() => {
                    dot.setAttribute("r", "6");
                    dot.setAttribute("cx", pos.cx.toString());
                    dot.setAttribute("cy", pos.cy.toString());
                }, 500);
            });

            // Diagonals
            setTimeout(() => {
                const ds = spacing / Math.sqrt(2);
                const diagonals = [
                    { cx: 100 - ds, cy: 100 - ds },
                    { cx: 100 + ds, cy: 100 - ds },
                    { cx: 100 - ds, cy: 100 + ds },
                    { cx: 100 + ds, cy: 100 + ds }
                ];
                diagonals.forEach(pos => {
                    const dot = createDot(100, 100, 6);
                    allDots.push(dot);
                    setTimeout(() => {
                        dot.setAttribute("r", "8");
                        dot.setAttribute("cx", ((100 + pos.cx) / 2).toString());
                        dot.setAttribute("cy", ((100 + pos.cy) / 2).toString());
                    }, 50);
                    setTimeout(() => {
                        dot.setAttribute("r", "6");
                        dot.setAttribute("cx", pos.cx.toString());
                        dot.setAttribute("cy", pos.cy.toString());
                    }, 500);
                });
            }, 800);

            // Rotate
            setTimeout(() => {
                svgGroup.style.transform = "rotate(360deg)";
            }, 2000);

            // Collapse
            setTimeout(() => {
                svgGroup.style.transition = "transform 0.5s linear";
                svgGroup.style.transform = "rotate(0deg)";
                allDots.forEach(dot => {
                    dot.setAttribute("cx", "100");
                    dot.setAttribute("cy", "100");
                    dot.setAttribute("r", "6");
                });
            }, 2500);
        };
        animateSpinner();
    }

    // 4. Transition In (On Load)
    function transitionIn() {
        createElements();
        const left = document.getElementById('transition-left');
        const right = document.getElementById('transition-right');
        const loader = document.getElementById('transition-loader-wrapper');

        // Initial state: FULLY COVERED (y: 0)
        gsap.set([left, right], { yPercent: 0 });
        gsap.set(loader, { display: 'flex', opacity: 1 });
        runSpinner();

        // Reveal the actual webpage 0.5s AFTER the load, ensuring white background is drawn first
        setTimeout(() => {
            const antiFlash = document.getElementById('anti-flash');
            if (antiFlash) antiFlash.remove();
            
            // Just in case, force body to visible
            document.body.style.setProperty('visibility', 'visible', 'important');
            document.body.style.setProperty('opacity', '1', 'important');
            document.documentElement.style.background = '';
        }, 500);

        // 2.5s stay duration, smoothly going DOWN
        setTimeout(() => {
            const tl = gsap.timeline();
            tl.to(loader, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => gsap.set(loader, { display: 'none' })
            })
            .to([left, right], {
                yPercent: 100,
                duration: 1.2,
                stagger: 0.1,
                ease: "power4.inOut"
            }, "-=0.2");
        }, 2500);
    }

    // 5. Transition Out (Navigation)
    function transitionOut(url) {
        createElements();
        const left = document.getElementById('transition-left');
        const right = document.getElementById('transition-right');
        
        // Start from BELOW
        gsap.set([left, right], { yPercent: 100 });
        
        const tl = gsap.timeline({
            onComplete: () => {
                window.location.href = url;
            }
        });

        // Splits come UP to cover
        tl.to([left, right], {
            yPercent: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power4.inOut"
        });
    }

    // 6. Link Interception
    function initLinks() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link || link.target === '_blank') return;
            
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.includes('javascript:')) return;

            const isInternal = href.startsWith('/') || !href.includes('://') || href.includes(window.location.hostname);
            
            if (isInternal) {
                e.preventDefault();
                transitionOut(href);
            }
        });
    }

    // Initialize
    initLinks();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', transitionIn);
    } else {
        transitionIn();
    }
})();