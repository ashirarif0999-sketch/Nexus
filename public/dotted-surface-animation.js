/**
 * Dotted Surface Animation
 * Vanilla JavaScript version of the DottedSurface React component
 * Creates a THREE.js animated dotted surface background overlay
 */

class DottedSurfaceAnimation {
    constructor(options = {}) {
        this.options = {
            containerId: 'dotted-surface-container',
            zIndex: 0,
            // Color options: can be 'auto' (detects theme), 'light', 'dark', or custom RGB
            colorMode: 'auto', // 'auto', 'light', 'dark', or custom hex like '#FF0000'
            lightColor: '#000000', // Color for light theme
            darkColor: '#C8C8C8',  // Color for dark theme
            customColor: null,     // Override both with custom color
            ...options
        };

        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.points = null;
        this.animationId = null;
        this.count = 0;

        // Configuration
        this.SEPARATION = 150;
        this.AMOUNTX = 40;
        this.AMOUNTY = 60;

        this.init();
    }

    init() {
        // Create container if it doesn't exist
        this.createContainer();
        
        // Setup THREE.js scene
        this.setupScene();
        
        // Create particles
        this.createParticles();
        
        // Start animation
        this.animate();
    }

    createContainer() {
        let container = document.getElementById(this.options.containerId);
        
        if (!container) {
            container = document.createElement('div');
            container.id = this.options.containerId;
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100vh;
                pointer-events: none;
                z-index: ${this.options.zIndex};
                background: transparent;
                overflow: visible;
                transform-origin: center;
                animation: fadeinbg 20s ease infinite;
            `;
            document.body.insertBefore(container, document.body.firstChild);
        }
        
        this.container = container;
    }

    setupScene() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0xffffff, 2000, 10000);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            1,
            10000,
        );
        this.camera.position.set(0, 355, 1220);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(this.scene.fog.color, 0);

        this.container.appendChild(this.renderer.domElement);

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    createParticles() {
        const positions = [];
        const colors = [];

        // Get the color to use
        let dotColor = { r: 0, g: 0, b: 0 };

        if (this.options.customColor) {
            // Use custom color
            dotColor = this.hexToRgb(this.options.customColor);
        } else if (this.options.colorMode === 'auto') {
            // Detect current theme (light/dark)
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
                          window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            if (isDark) {
                dotColor = this.hexToRgb(this.options.darkColor);
            } else {
                dotColor = this.hexToRgb(this.options.lightColor);
            }
        } else if (this.options.colorMode === 'light') {
            dotColor = this.hexToRgb(this.options.lightColor);
        } else if (this.options.colorMode === 'dark') {
            dotColor = this.hexToRgb(this.options.darkColor);
        }

        // Create geometry for all particles
        const geometry = new THREE.BufferGeometry();

        for (let ix = 0; ix < this.AMOUNTX; ix++) {
            for (let iy = 0; iy < this.AMOUNTY; iy++) {
                const x = ix * this.SEPARATION - (this.AMOUNTX * this.SEPARATION) / 2;
                const y = 0; // Will be animated
                const z = iy * this.SEPARATION - (this.AMOUNTY * this.SEPARATION) / 2;

                positions.push(x, y, z);
                
                // Use the determined color
                colors.push(dotColor.r / 255, dotColor.g / 255, dotColor.b / 255);
            }
        }

        geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(positions, 3),
        );
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        // Create material
        const material = new THREE.PointsMaterial({
            size: 8,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
        });

        // Create points object
        this.points = new THREE.Points(geometry, material);
        this.scene.add(this.points);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    animate = () => {
        this.animationId = requestAnimationFrame(this.animate);

        const positionAttribute = this.points.geometry.attributes.position;
        const positions = positionAttribute.array;

        let i = 0;
        for (let ix = 0; ix < this.AMOUNTX; ix++) {
            for (let iy = 0; iy < this.AMOUNTY; iy++) {
                const index = i * 3;

                // Animate Y position with sine waves
                positions[index + 1] =
                    Math.sin((ix + this.count) * 0.3) * 50 +
                    Math.sin((iy + this.count) * 0.5) * 50;

                i++;
            }
        }

        positionAttribute.needsUpdate = true;

        this.renderer.render(this.scene, this.camera);
        this.count += 0.1;
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (this.scene) {
            this.scene.traverse((object) => {
                if (object instanceof THREE.Points) {
                    object.geometry.dispose();
                    if (Array.isArray(object.material)) {
                        object.material.forEach((material) => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }

        if (this.renderer) {
            this.renderer.dispose();
            if (this.container && this.renderer.domElement) {
                this.container.removeChild(this.renderer.domElement);
            }
        }

        window.removeEventListener('resize', () => this.handleResize());
    }
}

// Auto-initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Example color options:
    // Option 1: Auto-detect theme (default)
    // window.dottedSurfaceAnimation = new DottedSurfaceAnimation({ zIndex: 0 });
    
    // Option 2: Custom color (e.g., red)
    // window.dottedSurfaceAnimation = new DottedSurfaceAnimation({ zIndex: 0, customColor: '#FF0000' });
    
    // Option 3: Specific light color
    // window.dottedSurfaceAnimation = new DottedSurfaceAnimation({ zIndex: 0, lightColor: '#FF6B6B' });
    
    // Option 4: Specific dark color
    // window.dottedSurfaceAnimation = new DottedSurfaceAnimation({ zIndex: 0, darkColor: '#FFD700' });

    window.dottedSurfaceAnimation = new DottedSurfaceAnimation({
        zIndex: 0,
        // Dot color set to medium gray
        customColor: '#6a6a6a',
    });
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.dottedSurfaceAnimation) {
        window.dottedSurfaceAnimation.dispose();
    }
});