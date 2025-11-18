/**
 * MobileEntryManager handles the mobile-optimized entry flow for Ocean King 3
 * Features:
 * - Portrait mode detection with rotation prompt
 * - Landscape swipe-up prompt
 * - Fullscreen entry trigger
 * - Scroll locking during gameplay
 */
export class MobileEntryManager {
    private overlayElement: HTMLDivElement;
    private gameContainer: HTMLElement;
    private isFullscreen: boolean = false;
    private gameStartCallback: (() => void) | null = null;
    private scrollThreshold: number = 50; // pixels to scroll before triggering fullscreen
    
    constructor(gameContainer: HTMLElement) {
        this.gameContainer = gameContainer;
        this.overlayElement = this.createOverlay();
        document.body.appendChild(this.overlayElement);
        
        this.initializeEventListeners();
        
        // Don't check orientation yet - wait for initialize() to be called
        // after the game start callback has been set
    }
    
    /**
     * Initialize the manager and check orientation
     * This should be called after setting the game start callback
     */
    public initialize(): void {
        console.log('MobileEntryManager: Initializing...');
        
        // Check orientation immediately
        this.checkOrientation();
        
        // Also check after a small delay to catch hash timing issues
        // This handles cases where the hash might not be immediately available
        setTimeout(() => {
            // Only recheck if we haven't started the game yet
            if (this.overlayElement && this.overlayElement.parentNode) {
                const hashValue = window.location.hash;
                if (hashValue && hashValue.includes('testMobile')) {
                    console.log('MobileEntryManager: Late hash detection - testMobile found, switching to swipe prompt');
                    this.showSwipePrompt();
                }
            }
        }, 100);
    }
    
    /**
     * Creates the overlay element that displays entry prompts
     */
    private createOverlay(): HTMLDivElement {
        const overlay = document.createElement('div');
        overlay.id = 'mobile-entry-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #001a33 0%, #003366 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            transition: opacity 0.5s ease-in-out;
            touch-action: manipulation;
        `;
        
        // Add Ocean King 3 logo at the top
        const logo = document.createElement('div');
        logo.innerHTML = `
            <h1 style="
                color: #FFD700;
                font-size: 48px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                margin-bottom: 40px;
                text-align: center;
            ">OCEAN KING 3</h1>
        `;
        overlay.appendChild(logo);
        
        return overlay;
    }
    
    /**
     * Shows the portrait rotation prompt
     */
    private showRotationPrompt(): void {
        // Clear existing content
        this.overlayElement.innerHTML = '';
        
        // Create a container for all content
        const contentContainer = document.createElement('div');
        contentContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            gap: 20px;
        `;
        
        // Re-create logo
        const logoContainer = document.createElement('div');
        logoContainer.innerHTML = `
            <h1 style="
                color: #FFD700;
                font-size: 48px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                margin-bottom: 40px;
                text-align: center;
            ">OCEAN KING 3</h1>
        `;
        contentContainer.appendChild(logoContainer);
        
        const promptContainer = document.createElement('div');
        promptContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        `;
        
        // Rotating phone icon using SVG
        const rotateIcon = document.createElement('div');
        rotateIcon.innerHTML = `
            <svg width="120" height="120" viewBox="0 0 120 120" style="
                animation: rotatePhone 2s ease-in-out infinite;
            ">
                <style>
                    @keyframes rotatePhone {
                        0%, 100% { transform: rotate(0deg); }
                        50% { transform: rotate(90deg); }
                    }
                </style>
                <!-- Phone in portrait -->
                <rect x="35" y="20" width="50" height="80" rx="5" fill="none" stroke="#FFD700" stroke-width="3"/>
                <rect x="42" y="30" width="36" height="60" fill="#FFD700" opacity="0.3"/>
                <circle cx="60" cy="95" r="3" fill="#FFD700"/>
                
                <!-- Rotation arrow -->
                <path d="M 90 60 A 25 25 0 0 1 60 85" fill="none" stroke="#00FF00" stroke-width="2" stroke-linecap="round"/>
                <polygon points="57,82 60,88 63,82" fill="#00FF00"/>
            </svg>
        `;
        promptContainer.appendChild(rotateIcon);
        
        // Rotation text
        const rotateText = document.createElement('p');
        rotateText.style.cssText = `
            color: white;
            font-size: 24px;
            text-align: center;
            font-weight: 300;
        `;
        rotateText.textContent = 'Please rotate your device to landscape';
        promptContainer.appendChild(rotateText);
        
        // Add prompt container to content container
        contentContainer.appendChild(promptContainer);
        
        // Add content container to overlay
        this.overlayElement.appendChild(contentContainer);
        
        console.log('MobileEntryManager: Rotation prompt displayed');
    }
    
    /**
     * Shows the swipe-up prompt in landscape mode
     */
    private showSwipePrompt(): void {
        // Clear existing content
        this.overlayElement.innerHTML = '';
        
        // Create a container for all content
        const contentContainer = document.createElement('div');
        contentContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            gap: 20px;
        `;
        
        // Re-create logo
        const logoContainer = document.createElement('div');
        logoContainer.innerHTML = `
            <h1 style="
                color: #FFD700;
                font-size: 48px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                margin-bottom: 40px;
                text-align: center;
            ">OCEAN KING 3</h1>
        `;
        contentContainer.appendChild(logoContainer);
        
        // Create prompt container
        const promptContainer = document.createElement('div');
        promptContainer.id = 'swipePrompt';
        promptContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            padding-bottom: 40px;
        `;
        
        // Add CSS animation to document head if not already present
        if (!document.getElementById('swipe-animations')) {
            const style = document.createElement('style');
            style.id = 'swipe-animations';
            style.textContent = `
                @keyframes bounceUp {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Animated up arrow
        const arrowIcon = document.createElement('div');
        arrowIcon.className = 'arrow-icon';
        arrowIcon.innerHTML = `
            <svg width="80" height="80" viewBox="0 0 80 80" style="animation: bounceUp 1.5s ease-in-out infinite;">
                <path d="M 40 60 L 40 20 M 25 35 L 40 20 L 55 35" 
                      stroke="#00FF00" 
                      stroke-width="4" 
                      stroke-linecap="round" 
                      stroke-linejoin="round"
                      fill="none"/>
            </svg>
        `;
        promptContainer.appendChild(arrowIcon);
        
        // Swipe text
        const swipeText = document.createElement('p');
        swipeText.className = 'swipe-text';
        swipeText.style.cssText = `
            color: white;
            font-size: 28px;
            text-align: center;
            font-weight: 300;
            letter-spacing: 1px;
            margin: 0;
        `;
        swipeText.textContent = 'Swipe Up to Begin';
        promptContainer.appendChild(swipeText);
        
        // Subtle instruction text
        const instructionText = document.createElement('p');
        instructionText.className = 'instruction-text';
        instructionText.style.cssText = `
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            text-align: center;
            margin-top: 10px;
        `;
        instructionText.textContent = 'This will enter fullscreen mode';
        promptContainer.appendChild(instructionText);
        
        // Add prompt container to content container
        contentContainer.appendChild(promptContainer);
        
        // Add content container to overlay
        this.overlayElement.appendChild(contentContainer);
        
        console.log('MobileEntryManager: Swipe prompt displayed');
        
        // Enable scroll detection
        this.enableScrollDetection();
    }
    
    /**
     * Checks device orientation and shows appropriate prompt
     */
    private checkOrientation(): void {
        const isPortrait = window.innerHeight > window.innerWidth;
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                        (window.innerWidth <= 768);
        
        // Check for test mode via query parameter, hash, localStorage, or window property
        const urlParams = new URLSearchParams(window.location.search);
        
        // Parse hash properly - window.location.hash includes the # symbol
        const hashValue = window.location.hash;
        const hashContainsTestMobile = hashValue === '#testMobile' || 
                                      hashValue.includes('testMobile');
        
        const testMobile = urlParams.get('testMobile') === 'true' || 
                          hashContainsTestMobile ||
                          window.localStorage.getItem('testMobile') === 'true' ||
                          (window as any).testMobile === true;
        
        // Allow setting test mode via console for easier testing
        (window as any).setTestMobile = (value: boolean) => {
            window.localStorage.setItem('testMobile', value ? 'true' : 'false');
            window.location.reload();
        };
        
        console.log('MobileEntryManager: URL params', {
            href: window.location.href,
            search: window.location.search,
            hash: window.location.hash,
            hashValue: hashValue,
            hashContainsTestMobile: hashContainsTestMobile,
            testMobileParam: urlParams.get('testMobile'),
            localStorageTestMobile: window.localStorage.getItem('testMobile'),
            testMobile
        });
        
        console.log('MobileEntryManager: checkOrientation', {
            isPortrait,
            isMobile,
            testMobile,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight
        });
        
        if (!isMobile && !testMobile) {
            // Desktop - skip directly to game after a brief delay
            // This ensures the DOM is ready
            console.log('MobileEntryManager: Desktop mode, auto-starting game');
            setTimeout(() => {
                this.startGame();
            }, 100);
        } else if (testMobile) {
            // Test mode - always show swipe prompt regardless of orientation
            console.log('MobileEntryManager: Test mode enabled, showing swipe prompt');
            this.showSwipePrompt();
        } else if (isPortrait) {
            // Mobile in portrait (not test mode) - show rotation prompt
            console.log('MobileEntryManager: Portrait mode, showing rotation prompt');
            this.showRotationPrompt();
        } else {
            // Mobile in landscape - show swipe prompt
            console.log('MobileEntryManager: Mobile landscape mode, showing swipe prompt');
            this.showSwipePrompt();
        }
    }
    
    /**
     * Enables scroll detection to trigger fullscreen
     */
    private enableScrollDetection(): void {
        // Make the page scrollable by adding content below
        document.body.style.height = '200vh';
        document.body.style.overflow = 'auto';
        
        const scrollHandler = (e: Event) => {
            if (window.scrollY > this.scrollThreshold && !this.isFullscreen) {
                this.enterFullscreen();
                window.removeEventListener('scroll', scrollHandler);
                window.removeEventListener('touchmove', scrollHandler);
            }
        };
        
        window.addEventListener('scroll', scrollHandler, { passive: true });
        window.addEventListener('touchmove', scrollHandler, { passive: true });
    }
    
    /**
     * Enters fullscreen mode and starts the game
     */
    private async enterFullscreen(): Promise<void> {
        this.isFullscreen = true;
        
        // Request fullscreen
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            } else if ((document.documentElement as any).webkitRequestFullscreen) {
                await (document.documentElement as any).webkitRequestFullscreen();
            } else if ((document.documentElement as any).msRequestFullscreen) {
                await (document.documentElement as any).msRequestFullscreen();
            }
        } catch (err) {
            console.log('Fullscreen request failed:', err);
        }
        
        // Start the game
        this.startGame();
    }
    
    /**
     * Starts the game and removes the overlay
     */
    private startGame(): void {
        console.log('MobileEntryManager: startGame() called');
        
        // Check if overlay still exists
        if (!this.overlayElement) {
            console.warn('MobileEntryManager: Overlay element not found');
            return;
        }
        
        // Fade out overlay
        this.overlayElement.style.opacity = '0';
        console.log('MobileEntryManager: Fading out overlay');
        
        setTimeout(() => {
            console.log('MobileEntryManager: Removing overlay and starting game');
            
            // Remove overlay if it still exists
            if (this.overlayElement && this.overlayElement.parentNode) {
                this.overlayElement.remove();
                console.log('MobileEntryManager: Overlay removed');
            }
            
            // Reset body styles
            document.body.style.height = '100vh';
            document.body.style.overflow = 'hidden';
            
            // Lock scrolling
            this.lockScrolling();
            
            // Call the game start callback
            if (this.gameStartCallback) {
                console.log('MobileEntryManager: Calling game start callback');
                this.gameStartCallback();
            } else {
                console.error('MobileEntryManager: No game start callback set!');
            }
        }, 500);
    }
    
    /**
     * Locks scrolling to prevent browser gestures during gameplay
     */
    private lockScrolling(): void {
        // CSS approach - don't use position:fixed as it breaks HTML input positioning
        document.body.style.cssText += `
            width: 100vw;
            height: 100vh;
            overflow: hidden;
            touch-action: none;
            -webkit-overflow-scrolling: none;
            overscroll-behavior: none;
        `;
        
        // JavaScript approach - prevent all scroll-related events
        const preventScroll = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };
        
        // Block various scroll triggers
        window.addEventListener('scroll', preventScroll, { passive: false });
        window.addEventListener('touchmove', preventScroll, { passive: false });
        window.addEventListener('wheel', preventScroll, { passive: false });
        
        // Prevent pull-to-refresh
        let lastY = 0;
        window.addEventListener('touchstart', (e) => {
            lastY = e.touches[0].clientY;
        }, { passive: false });
        
        window.addEventListener('touchmove', (e) => {
            const y = e.touches[0].clientY;
            const isScrollingUp = y > lastY;
            const isAtTop = window.scrollY === 0;
            
            if (isScrollingUp && isAtTop) {
                e.preventDefault();
            }
            lastY = y;
        }, { passive: false });
    }
    
    /**
     * Initialize event listeners for orientation changes
     */
    private initializeEventListeners(): void {
        window.addEventListener('orientationchange', () => {
            if (!this.isFullscreen) {
                this.checkOrientation();
            }
        });
        
        window.addEventListener('resize', () => {
            if (!this.isFullscreen) {
                this.checkOrientation();
            }
        });
    }
    
    /**
     * Sets the callback function to be called when the game starts
     */
    public onGameStart(callback: () => void): void {
        this.gameStartCallback = callback;
    }
    
    /**
     * Cleanup method
     */
    public destroy(): void {
        if (this.overlayElement && this.overlayElement.parentNode) {
            this.overlayElement.remove();
        }
    }
}