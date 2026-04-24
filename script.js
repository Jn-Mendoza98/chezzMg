
// Tailwind configuration and other custom JS
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#E62117',
                dark: '#111111',
                darker: '#0a0a0a',
                light: '#F8F8F8'
            },
            fontFamily: {
                sans: ['Montserrat', 'sans-serif'],
                serif: ['Playfair Display', 'serif']
            }
        }
    }
}

// Dynamic Menu Filtering
document.addEventListener('DOMContentLoaded', () => {
    const isMenuPage = window.location.pathname.includes('menu.html');
    const menuSections = document.querySelectorAll('.menu-section');
    const categoryLinks = document.querySelectorAll('a[data-category]');

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
        if (!found && category !== 'all') {
            menuSections.forEach(sec => sec.classList.remove('hidden'));
        }
    }

    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const category = link.getAttribute('data-category');
            if (isMenuPage) {
                e.preventDefault();
                window.history.pushState(null, null, `#${category}`);
                filterCategory(category);
            }
        });
    });

    if (isMenuPage) {
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            filterCategory(hash);
        } else {
            filterCategory('all');
        }
        window.addEventListener('hashchange', () => {
            const newHash = window.location.hash.replace('#', '');
            filterCategory(newHash || 'all');
        });
    }
});

// Cart Logic, Animations & Invoice Modal
document.addEventListener('DOMContentLoaded', () => {
    let cart = [];

    // Load from localStorage
    const savedCart = localStorage.getItem('chezMaggyCart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
            console.error("Error parsing cart from localStorage", e);
        }
    }

    const cartCounter = document.getElementById('cart-counter');
    const cartButton = document.getElementById('cart-button');
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');

    function getTotalQuantity() {
        return cart.reduce((total, item) => total + item.quantity, 0);
    }

    function saveCart() {
        localStorage.setItem('chezMaggyCart', JSON.stringify(cart));
    }

    function updateCartCounter(animate = false) {
        if (!cartCounter) return;
        const totalItems = getTotalQuantity();
        if (totalItems > 0) {
            cartCounter.textContent = totalItems;
            cartCounter.classList.remove('hidden');
            if (animate) {
                cartCounter.classList.remove('cart-bounce');
                void cartCounter.offsetWidth;
                cartCounter.classList.add('cart-bounce');
            }
        } else {
            cartCounter.classList.add('hidden');
        }
    }

    function animateFlyingImage(sourceImgElement) {
        if (!sourceImgElement || !cartButton) return;
        const flyingImg = sourceImgElement.cloneNode(true);
        flyingImg.classList.add('flying-img');
        const imgRect = sourceImgElement.getBoundingClientRect();

        flyingImg.style.width = `${imgRect.width}px`;
        flyingImg.style.height = `${imgRect.height}px`;
        flyingImg.style.top = `${imgRect.top}px`;
        flyingImg.style.left = `${imgRect.left}px`;
        flyingImg.style.margin = '0';

        document.body.appendChild(flyingImg);
        const cartRect = cartButton.getBoundingClientRect();

        const targetTop = cartRect.top + cartRect.height / 2 - 20;
        const targetLeft = cartRect.left + cartRect.width / 2 - 20;

        requestAnimationFrame(() => {
            flyingImg.style.top = `${targetTop}px`;
            flyingImg.style.left = `${targetLeft}px`;
            flyingImg.style.width = '40px';
            flyingImg.style.height = '40px';
            flyingImg.style.opacity = '0.2';
        });

        setTimeout(() => {
            flyingImg.remove();
        }, 600);
    }

    updateCartCounter(false);

    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const productCard = btn.closest('.product-card');
            if (productCard) {
                const img = productCard.querySelector('img');
                const title = productCard.querySelector('h4')?.textContent || 'Producto';
                const priceText = productCard.querySelector('.text-primary.font-bold')?.textContent || 'S/ 0.00';

                const priceMatch = priceText.match(/[\d.]+/);
                const priceVal = priceMatch ? parseFloat(priceMatch[0]) : 0;

                const existingItem = cart.find(item => item.title === title);
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    cart.push({
                        title: title,
                        price: priceVal,
                        quantity: 1,
                        imgUrl: img ? img.src : ''
                    });
                }

                saveCart();
                animateFlyingImage(img);
                setTimeout(() => {
                    updateCartCounter(true);
                }, 500);
            }
        });
    });

    // Invoice Modal
    function createInvoiceModal() {
        let modal = document.getElementById('invoice-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'invoice-modal';
            modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 hidden opacity-0 transition-opacity duration-300';

            modal.innerHTML = `
                <div class="bg-white rounded-xl shadow-lg w-11/12 max-w-lg overflow-hidden transform scale-95 transition-transform duration-300 flex flex-col max-h-[90vh]">
                    <div class="bg-darker text-white p-4 flex justify-between items-center">
                        <h2 class="text-xl font-bold uppercase"><i class="fas fa-receipt mr-2 text-primary"></i>Resumen de Pedido</h2>
                        <button id="close-modal" class="text-gray-300 hover:text-white transition">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    <div class="p-6 overflow-y-auto flex-grow">
                        <div id="invoice-items" class="space-y-4 mb-6">
                            <!-- Items will be injected here -->
                        </div>
                        <div class="border-t border-gray-200 pt-4 flex justify-between items-center">
                            <span class="font-bold text-lg text-gray-700">TOTAL GENERAL</span>
                            <span id="invoice-total" class="font-bold text-2xl text-primary">S/ 0.00</span>
                        </div>
                    </div>
                    <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        <button id="cancel-order" class="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 font-bold transition">Cerrar</button>
                        <button id="checkout-order" class="px-6 py-2 bg-primary text-white rounded-md font-bold hover:bg-red-700 transition shadow-sm">Finalizar Pedido</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('close-modal').addEventListener('click', closeInvoice);
            document.getElementById('cancel-order').addEventListener('click', closeInvoice);

            document.getElementById('checkout-order').addEventListener('click', () => {
                if (cart.length === 0) {
                    alert('Tu carrito está vacío');
                    return;
                }

                // Generar mensaje para WhatsApp
                let mensaje = "*🧾 Pedido - Chez Maggy*\n\n";
                let total = 0;

                cart.forEach(item => {
                    const subtotal = item.price * item.quantity;
                    total += subtotal;
                    mensaje += `🍕 *${item.title}* x${item.quantity} - S/ ${subtotal.toFixed(2)}\n`;
                });

                mensaje += `\n💰 *Total: S/ ${total.toFixed(2)}*\n\n`;
                mensaje += "📍 Hola, quiero realizar este pedido.";

                // Codificar el mensaje para la URL
                const mensajeCodificado = encodeURIComponent(mensaje);

                // Número de WhatsApp (ejemplo genérico de Perú)
                const numeroWhatsApp = "51999999999";
                const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensajeCodificado}`;

                // Abrir WhatsApp en una nueva pestaña
                window.open(urlWhatsApp, '_blank');

                // Vaciar carrito y cerrar modal
                cart = [];
                saveCart();
                updateCartCounter(false);
                closeInvoice();
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeInvoice();
            });
        }
        return modal;
    }

    function openInvoice() {
        const modal = createInvoiceModal();
        const itemsContainer = document.getElementById('invoice-items');
        const totalContainer = document.getElementById('invoice-total');

        itemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            itemsContainer.innerHTML = '<p class="text-gray-500 text-center py-4 italic">Tu carrito está vacío.</p>';
        } else {
            cart.forEach(item => {
                const subtotal = item.price * item.quantity;
                total += subtotal;

                itemsContainer.innerHTML += `
                    <div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded bg-gray-200 overflow-hidden flex-shrink-0 hidden sm:block">
                                ${item.imgUrl ? `<img src="${item.imgUrl}" class="w-full h-full object-cover">` : ''}
                            </div>
                            <div>
                                <h4 class="font-bold text-dark text-sm sm:text-base leading-tight">${item.title}</h4>
                                <p class="text-xs text-gray-500 mt-1">S/ ${item.price.toFixed(2)} x ${item.quantity}</p>
                            </div>
                        </div>
                        <div class="font-bold text-gray-800 flex-shrink-0 ml-2">
                            S/ ${subtotal.toFixed(2)}
                        </div>
                    </div>
                `;
            });
        }

        totalContainer.textContent = `S/ ${total.toFixed(2)}`;

        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('.transform').classList.remove('scale-95');
        }, 10);
    }

    function closeInvoice() {
        const modal = document.getElementById('invoice-modal');
        if (modal) {
            modal.classList.add('opacity-0');
            modal.querySelector('.transform').classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }
    }

    if (cartButton) {
        cartButton.addEventListener('click', (e) => {
            e.preventDefault();
            openInvoice();
        });
    }

    // Calzone Configurator Logic
    const calzoneTabs = document.querySelectorAll('.calzone-tab');
    const calzoneContents = document.querySelectorAll('.calzone-content');
    const calzoneTabIndicator = document.getElementById('calzone-tab-indicator');
    const calzoneStickyFooter = document.getElementById('calzone-sticky-footer');

    const summaryTitle = document.getElementById('calzone-summary-title');
    const summaryDetails = document.getElementById('calzone-summary-details');
    const summaryPrice = document.getElementById('calzone-summary-price');
    const addCalzoneBtn = document.getElementById('add-calzone-btn');

    let currentCalzoneType = 'tradicional';
    const calzonePrices = {
        tradicional: 25.90,
        vegetariano: 27.90,
        amigusto: 32.90
    };

    // "A Mi Gusto" Ingredients
    const amgIngredientsList = [
        "Aceituna", "Ají", "Albahaca", "Cabanossi", "Cebolla", "Cecina",
        "Champiñones", "Chorizo", "Durazno", "Espárrago", "Jamón", "Papaya",
        "Pepperoni", "Pimiento", "Piña", "Plátano", "Pollo", "Salame",
        "Salchicha", "Tocino", "Tomate en rodajas"
    ];
    let selectedAmgIngredients = [];
    const MAX_AMG_INGREDIENTS = 6;

    // Render "A Mi Gusto" Ingredients
    function renderAmgIngredients() {
        const grid = document.getElementById('amg-ingredients-grid');
        if (!grid) return;

        grid.innerHTML = amgIngredientsList.map(ing => `
            <label class="flex flex-col border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-primary transition amg-ing-label select-none relative overflow-hidden bg-gray-50 h-20">
                <input type="checkbox" value="${ing}" class="peer hidden amg-ing-checkbox">
                <div class="absolute inset-0 bg-primary/10 opacity-0 peer-checked:opacity-100 transition"></div>
                <div class="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center transition">
                    <i class="fas fa-check text-white text-[10px] opacity-0 peer-checked:opacity-100"></i>
                </div>
                <span class="text-xs font-bold text-gray-700 peer-checked:text-primary mt-auto relative z-10 text-center leading-tight">${ing}</span>
            </label>
        `).join('');

        const checkboxes = grid.querySelectorAll('.amg-ing-checkbox');
        const counter = document.getElementById('amg-counter');

        checkboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                if (e.target.checked) {
                    if (selectedAmgIngredients.length >= MAX_AMG_INGREDIENTS) {
                        e.target.checked = false;
                        alert('Máximo 6 ingredientes permitidos.');
                        return;
                    }
                    selectedAmgIngredients.push(e.target.value);
                } else {
                    selectedAmgIngredients = selectedAmgIngredients.filter(ing => ing !== e.target.value);
                }

                counter.textContent = `${selectedAmgIngredients.length}/${MAX_AMG_INGREDIENTS}`;

                // Visual feedback for max reached
                if (selectedAmgIngredients.length >= MAX_AMG_INGREDIENTS) {
                    counter.classList.replace('bg-dark', 'bg-primary');
                    checkboxes.forEach(box => {
                        if (!box.checked) box.closest('label').classList.add('opacity-50', 'cursor-not-allowed');
                    });
                } else {
                    counter.classList.replace('bg-primary', 'bg-dark');
                    checkboxes.forEach(box => {
                        box.closest('label').classList.remove('opacity-50', 'cursor-not-allowed');
                    });
                }

                updateCalzoneSummary();
            });
        });
    }

    // Update Footer Summary
    function updateCalzoneSummary() {
        if (!calzoneStickyFooter) return;

        let detailsText = '';
        let isValid = true;

        if (currentCalzoneType === 'tradicional') {
            summaryTitle.textContent = 'Calzone Tradicional';
            detailsText = 'Clásico';
            summaryPrice.textContent = `S/ ${calzonePrices.tradicional.toFixed(2)}`;
        } else if (currentCalzoneType === 'vegetariano') {
            summaryTitle.textContent = 'Calzone Vegetariano';
            const selectedOlive = document.querySelector('input[name="veg-aceitunas"]:checked')?.value || 'Ninguna';
            detailsText = selectedOlive !== 'Ninguna' ? `Aceitunas: ${selectedOlive}` : 'Sin Aceitunas';
            summaryPrice.textContent = `S/ ${calzonePrices.vegetariano.toFixed(2)}`;
        } else if (currentCalzoneType === 'amigusto') {
            summaryTitle.textContent = 'Calzone A Mi Gusto';
            if (selectedAmgIngredients.length === 0) {
                detailsText = 'Selecciona ingredientes...';
                isValid = false;
            } else {
                detailsText = selectedAmgIngredients.join(', ');
            }
            summaryPrice.textContent = `S/ ${calzonePrices.amigusto.toFixed(2)}`;
        }

        summaryDetails.textContent = detailsText;

        // Show/hide footer
        calzoneStickyFooter.classList.remove('hidden');

        // Disable/Enable Add button
        if (isValid) {
            addCalzoneBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            addCalzoneBtn.disabled = false;
        } else {
            addCalzoneBtn.classList.add('opacity-50', 'cursor-not-allowed');
            addCalzoneBtn.disabled = true;
        }
    }

    // Tab Switching Logic
    calzoneTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // Update Active Tab Styling
            calzoneTabs.forEach(t => {
                t.classList.remove('text-gray-800');
                t.classList.add('text-gray-500');
            });
            tab.classList.remove('text-gray-500');
            tab.classList.add('text-gray-800');

            // Move Indicator
            if (calzoneTabIndicator) {
                calzoneTabIndicator.style.transform = `translateX(${index * 100}%)`;
            }

            // Show Content
            const target = tab.dataset.target;
            currentCalzoneType = target;

            calzoneContents.forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById(`calzone-content-${target}`).classList.remove('hidden');

            updateCalzoneSummary();
        });
    });

    // Event listeners for Vegetariano Radios
    const vegRadios = document.querySelectorAll('input[name="veg-aceitunas"]');
    vegRadios.forEach(radio => {
        radio.addEventListener('change', updateCalzoneSummary);
    });

    // Add Calzone to Cart
    if (addCalzoneBtn) {
        addCalzoneBtn.addEventListener('click', () => {
            const title = summaryTitle.textContent;
            const details = summaryDetails.textContent;
            const price = parseFloat(summaryPrice.textContent.replace('S/ ', ''));

            const fullTitle = `${title} (${details})`;

            const existingItem = cart.find(item => item.title === fullTitle);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    title: fullTitle,
                    price: price,
                    quantity: 1,
                    imgUrl: 'IM/CAL.jpg'
                });
            }

            saveCart();
            updateCartCounter(true);

            // Visual feedback on button
            const originalText = addCalzoneBtn.innerHTML;
            addCalzoneBtn.innerHTML = '<i class="fas fa-check"></i> Añadido';
            addCalzoneBtn.classList.replace('bg-primary', 'bg-green-500');

            setTimeout(() => {
                addCalzoneBtn.innerHTML = originalText;
                addCalzoneBtn.classList.replace('bg-green-500', 'bg-primary');
            }, 1500);
        });
    }

    // Initialize Menu Category specific logic
    function onCategoryChange(category) {
        if (category === 'calzone') {
            calzoneStickyFooter?.classList.remove('hidden');
            updateCalzoneSummary();
        } else {
            calzoneStickyFooter?.classList.add('hidden');
        }
    }

    // Hook into existing menu filtering
    const originalFilterCategory = window.filterCategory;
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'calzone' && !mutation.target.classList.contains('hidden')) {
                onCategoryChange('calzone');
            } else if (mutation.target.id === 'calzone' && mutation.target.classList.contains('hidden')) {
                onCategoryChange('other');
            }
        });
    });

    const calzoneSection = document.getElementById('calzone');
    if (calzoneSection) {
        observer.observe(calzoneSection, { attributes: true, attributeFilter: ['class'] });
    }

    // Initial render
    renderAmgIngredients();

    // Check initial state
    if (window.location.hash === '#calzone') {
        onCategoryChange('calzone');
    }

});
