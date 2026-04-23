// Tailwind configuration and other custom JS
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#E62117', // Red from the logo/buttons
                dark: '#111111',
                darker: '#0a0a0a',
                light: '#F8F8F8'
            },
            fontFamily: {
                sans: ['Montserrat', 'sans-serif'],
                serif: ['Playfair Display', 'serif'] // For some headings if needed
            }
        }
    }
}

// Dynamic Menu Filtering
document.addEventListener('DOMContentLoaded', () => {
    const isMenuPage = window.location.pathname.includes('menu.html');
    const menuSections = document.querySelectorAll('.menu-section');
    const categoryLinks = document.querySelectorAll('a[data-category]');

    // Function to filter sections based on category string
    function filterCategory(category) {
        if (!isMenuPage || !menuSections.length) return;

        let found = false;
        menuSections.forEach(section => {
            if (section.dataset.category === category || category === 'all') {
                section.classList.remove('hidden');
                found = true;
            } else {
                section.classList.add('hidden');
            }
        });

        // Optional: If a category was requested but doesn't exist yet, we could show all or a message
        // For now, if nothing matches, maybe just show everything
        if (!found && category !== 'all') {
            // Un-hide everything just in case
            menuSections.forEach(sec => sec.classList.remove('hidden'));
        }
    }

    // Handle clicks on data-category links
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // If we are on the menu page and the link points to the menu page hash
            const category = link.getAttribute('data-category');

            if (isMenuPage) {
                // If it's a link to #category or menu.html#category
                e.preventDefault();
                // Update URL hash without reloading
                window.history.pushState(null, null, `#${category}`);
                filterCategory(category);
            }
            // If on index.html, let the default behavior navigate to menu.html#category
        });
    });

    // Handle initial load on menu.html
    if (isMenuPage) {
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            filterCategory(hash);
        } else {
            // Default to showing all if no hash
            filterCategory('all');
        }

        // Handle browser back/forward buttons
        window.addEventListener('hashchange', () => {
            const newHash = window.location.hash.replace('#', '');
            filterCategory(newHash || 'all');
        });
    }
});

// Cart Logic & Animations
document.addEventListener('DOMContentLoaded', () => {
    let cart = []; // Store products
    const cartCounter = document.getElementById('cart-counter');
    const cartButton = document.getElementById('cart-button');
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');

    // Update the counter UI
    function updateCartCounter() {
        if (!cartCounter) return;

        const totalItems = cart.length;
        if (totalItems > 0) {
            cartCounter.textContent = totalItems;
            cartCounter.classList.remove('hidden');

            // Trigger bounce animation
            cartCounter.classList.remove('cart-bounce');
            // Trigger reflow to restart animation
            void cartCounter.offsetWidth;
            cartCounter.classList.add('cart-bounce');
        } else {
            cartCounter.classList.add('hidden');
        }
    }

    function animateFlyingImage(sourceImgElement) {
        if (!sourceImgElement || !cartButton) return;

        // Clone the image
        const flyingImg = sourceImgElement.cloneNode(true);
        flyingImg.classList.add('flying-img');

        // Get coordinates of original image
        const imgRect = sourceImgElement.getBoundingClientRect();

        // Initial setup for flying image (start at original position)
        flyingImg.style.width = `${imgRect.width}px`;
        flyingImg.style.height = `${imgRect.height}px`;
        flyingImg.style.top = `${imgRect.top}px`;
        flyingImg.style.left = `${imgRect.left}px`;
        flyingImg.style.margin = '0';

        document.body.appendChild(flyingImg);

        // Get target coordinates (cart icon)
        const cartRect = cartButton.getBoundingClientRect();

        // Calculate the center target point
        const targetTop = cartRect.top + cartRect.height / 2 - 20; // 20 is half of flying img target size
        const targetLeft = cartRect.left + cartRect.width / 2 - 20;

        // Start animation next frame
        requestAnimationFrame(() => {
            flyingImg.style.top = `${targetTop}px`;
            flyingImg.style.left = `${targetLeft}px`;
            flyingImg.style.width = '40px';
            flyingImg.style.height = '40px';
            flyingImg.style.opacity = '0.2';
        });

        // Cleanup after animation completes
        setTimeout(() => {
            flyingImg.remove();
        }, 600); // matches the 0.6s transition
    }

    // Attach click events
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); // Just in case it's inside an anchor or form

            const productCard = btn.closest('.product-card');
            if (productCard) {
                const img = productCard.querySelector('img');
                const title = productCard.querySelector('h4')?.textContent || 'Producto';
                const priceStr = productCard.querySelector('.text-primary.font-bold')?.textContent || 'S/ 0.00';

                // Add to cart array
                cart.push({
                    title: title,
                    price: priceStr
                });

                // Animate
                animateFlyingImage(img);

                // Delay counter update slightly so it syncs with the image arriving
                setTimeout(() => {
                    updateCartCounter();
                }, 500);
            }
        });
    });
});
