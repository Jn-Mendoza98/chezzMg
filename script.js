// Tailwind configuration and other custom JS
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: "#E62117",
        dark: "#111111",
        darker: "#0a0a0a",
        light: "#F8F8F8",
      },
      fontFamily: {
        sans: ["Montserrat", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
    },
  },
};

// Dynamic Menu Filtering
document.addEventListener("DOMContentLoaded", () => {
  const isMenuPage = window.location.pathname.includes("menu.html");
  const menuSections = document.querySelectorAll(".menu-section");
  const categoryLinks = document.querySelectorAll("a[data-category]");

  function filterCategory(category) {
    if (!isMenuPage || !menuSections.length) return;
    let found = false;
    menuSections.forEach((section) => {
      if (section.dataset.category === category || category === "all") {
        section.classList.remove("hidden");
        found = true;
      } else {
        section.classList.add("hidden");
      }
    });
    if (!found && category !== "all") {
      menuSections.forEach((sec) => sec.classList.remove("hidden"));
    }
  }

  categoryLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const category = link.getAttribute("data-category");
      if (isMenuPage) {
        e.preventDefault();
        window.history.pushState(null, null, `#${category}`);
        filterCategory(category);
      }
    });
  });

  if (isMenuPage) {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      filterCategory(hash);
    } else {
      filterCategory("all");
    }
    window.addEventListener("hashchange", () => {
      const newHash = window.location.hash.replace("#", "");
      filterCategory(newHash || "all");
    });
  }
});

// Cart Logic, Animations & Invoice Modal
document.addEventListener("DOMContentLoaded", () => {
  let cart = [];

  // Load from localStorage
  const savedCart = localStorage.getItem("chezMaggyCart");
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch (e) {
      console.error("Error parsing cart from localStorage", e);
    }
  }

  const cartCounter = document.getElementById("cart-counter");
  const cartButton = document.getElementById("cart-button");
  const addToCartBtns = document.querySelectorAll(".add-to-cart-btn");

  function getTotalQuantity() {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }

  function saveCart() {
    localStorage.setItem("chezMaggyCart", JSON.stringify(cart));
  }

  function updateCartCounter(animate = false) {
    if (!cartCounter) return;
    const totalItems = getTotalQuantity();
    if (totalItems > 0) {
      cartCounter.textContent = totalItems;
      cartCounter.classList.remove("hidden");
      if (animate) {
        cartCounter.classList.remove("cart-bounce");
        void cartCounter.offsetWidth;
        cartCounter.classList.add("cart-bounce");
      }
    } else {
      cartCounter.classList.add("hidden");
    }
  }

  function animateFlyingImage(sourceImgElement) {
    if (!sourceImgElement || !cartButton) return;
    const flyingImg = sourceImgElement.cloneNode(true);
    flyingImg.classList.add("flying-img");
    const imgRect = sourceImgElement.getBoundingClientRect();

    flyingImg.style.width = `${imgRect.width}px`;
    flyingImg.style.height = `${imgRect.height}px`;
    flyingImg.style.top = `${imgRect.top}px`;
    flyingImg.style.left = `${imgRect.left}px`;
    flyingImg.style.margin = "0";

    document.body.appendChild(flyingImg);
    const cartRect = cartButton.getBoundingClientRect();

    const targetTop = cartRect.top + cartRect.height / 2 - 20;
    const targetLeft = cartRect.left + cartRect.width / 2 - 20;

    requestAnimationFrame(() => {
      flyingImg.style.top = `${targetTop}px`;
      flyingImg.style.left = `${targetLeft}px`;
      flyingImg.style.width = "40px";
      flyingImg.style.height = "40px";
      flyingImg.style.opacity = "0.2";
    });

    setTimeout(() => {
      flyingImg.remove();
    }, 600);
  }

  updateCartCounter(false);

  addToCartBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const productCard = btn.closest(".product-card");
      if (productCard) {
        const img = productCard.querySelector("img");
        const title =
          productCard.querySelector("h4")?.textContent || "Producto";
        const priceText =
          productCard.querySelector(".text-primary.font-bold")?.textContent ||
          "S/ 0.00";

        const priceMatch = priceText.match(/[\d.]+/);
        const priceVal = priceMatch ? parseFloat(priceMatch[0]) : 0;

        const existingItem = cart.find((item) => item.title === title);
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          cart.push({
            title: title,
            price: priceVal,
            quantity: 1,
            imgUrl: img ? img.src : "",
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
    let modal = document.getElementById("invoice-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "invoice-modal";
      modal.className =
        "fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 hidden opacity-0 transition-opacity duration-300";

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

      document
        .getElementById("close-modal")
        .addEventListener("click", closeInvoice);
      document
        .getElementById("cancel-order")
        .addEventListener("click", closeInvoice);

      document
        .getElementById("checkout-order")
        .addEventListener("click", () => {
          if (cart.length === 0) return;

          let orderText =
            "¡Hola! Quiero realizar un pedido de los siguientes productos:%0A%0A";
          let total = 0;

          cart.forEach((item) => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            orderText += `- ${item.quantity}x ${item.title} (S/ ${item.price.toFixed(2)})%0A`;
          });

          orderText += `%0A*TOTAL: S/ ${total.toFixed(2)}*`;

          // Número de WhatsApp (reemplazar por el correcto)
          const whatsappNumber = "51999999999";
          const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${orderText}`;

          window.open(whatsappUrl, "_blank");

          cart = [];
          saveCart();
          updateCartCounter(false);
          closeInvoice();
        });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeInvoice();
      });
    }
    return modal;
  }

  function openInvoice() {
    const modal = createInvoiceModal();
    const itemsContainer = document.getElementById("invoice-items");
    const totalContainer = document.getElementById("invoice-total");

    itemsContainer.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
      itemsContainer.innerHTML =
        '<p class="text-gray-500 text-center py-4 italic">Tu carrito está vacío.</p>';
    } else {
      cart.forEach((item) => {
        const subtotal = item.price * item.quantity;
        total += subtotal;

        itemsContainer.innerHTML += `
                    <div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded bg-gray-200 overflow-hidden flex-shrink-0 hidden sm:block">
                                ${item.imgUrl ? `<img src="${item.imgUrl}" class="w-full h-full object-cover">` : ""}
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

    modal.classList.remove("hidden");
    setTimeout(() => {
      modal.classList.remove("opacity-0");
      modal.querySelector(".transform").classList.remove("scale-95");
    }, 10);
  }

  function closeInvoice() {
    const modal = document.getElementById("invoice-modal");
    if (modal) {
      modal.classList.add("opacity-0");
      modal.querySelector(".transform").classList.add("scale-95");
      setTimeout(() => {
        modal.classList.add("hidden");
      }, 300);
    }
  }

  if (cartButton) {
    cartButton.addEventListener("click", (e) => {
      e.preventDefault();
      openInvoice();
    });
  }

  // Calzone Configurator Logic
  const calzoneTabs = document.querySelectorAll(".calzone-tab");
  const calzoneContents = document.querySelectorAll(".calzone-content");
  const calzoneTabIndicator = document.getElementById("calzone-tab-indicator");
  const calzoneMainImg = document.getElementById("calzone-main-img");
  const calzoneSummaryTitle = document.getElementById("calzone-summary-title");
  const calzoneSummaryDetails = document.getElementById(
    "calzone-summary-details",
  );
  const calzoneSummaryPrice = document.getElementById("calzone-summary-price");
  const addCalzoneBtn = document.getElementById("add-calzone-btn");
  const calzoneStickyFooter = document.getElementById("calzone-sticky-footer");

  const calzoneData = {
    tradicional: {
      title: "Calzone Tradicional",
      details: "Clásico",
      price: 25.9,
      img: "IM/CAL.jpg",
    },
    vegetariano: {
      title: "Calzone Vegetariano",
      details: "Champiñones, pimientos, cebolla, aceitunas",
      price: 25.9,
      img: "IM/CAL.jpg",
    },
    amigusto: {
      title: "Calzone A Mi Gusto",
      details: "Ningún ingrediente seleccionado",
      price: 25.9,
      img: "IM/CAL.jpg",
    },
  };

  let currentCalzoneType = "tradicional";
  let selectedIngredients = [];
  const maxIngredients = 6;

  // Inject A Mi Gusto Ingredients
  const amgIngredientsGrid = document.getElementById("amg-ingredients-grid");
  const amgCounter = document.getElementById("amg-counter");
  const availableIngredients = [
    "Queso Extra",
    "Jamón",
    "Pepperoni",
    "Salchicha",
    "Tocino",
    "Pollo",
    "Champiñones",
    "Cebolla",
    "Pimientos",
    "Aceitunas",
    "Piña",
    "Tomate",
  ];

  if (amgIngredientsGrid) {
    availableIngredients.forEach((ing) => {
      const label = document.createElement("label");
      label.className =
        "flex items-center gap-3 p-3 lg:p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-primary transition group";
      label.innerHTML = `
                <input type="checkbox" name="amg-ingredient" value="${ing}" class="text-primary focus:ring-primary rounded h-4 w-4 lg:h-5 lg:w-5 ingredient-checkbox">
                <span class="text-gray-700 text-sm lg:text-base font-medium group-hover:text-primary transition">${ing}</span>
            `;
      amgIngredientsGrid.appendChild(label);
    });
  }

  const ingredientCheckboxes = document.querySelectorAll(
    ".ingredient-checkbox",
  );
  const vegOliveRadios = document.querySelectorAll(
    'input[name="veg-aceitunas"]',
  );
  let selectedVegOlives = "Ninguna";

  if (vegOliveRadios.length > 0) {
    vegOliveRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        if (e.target.checked) {
          selectedVegOlives = e.target.value;
          updateCalzoneSummary();
        }
      });
    });
  }

  if (calzoneTabs.length > 0) {
    calzoneTabs.forEach((tab, index) => {
      tab.addEventListener("click", () => {
        // Remove active class from all
        calzoneTabs.forEach((t) => {
          t.classList.remove("active", "text-gray-800");
          t.classList.add("text-gray-500");
        });

        // Add active class to clicked
        tab.classList.add("active", "text-gray-800");
        tab.classList.remove("text-gray-500");

        // Move indicator
        if (calzoneTabIndicator) {
          calzoneTabIndicator.style.transform = `translateX(${index * 100}%)`;
        }

        // Hide all contents
        calzoneContents.forEach((content) => content.classList.add("hidden"));

        // Show selected content
        const targetId = tab.getAttribute("data-target");
        const targetContent = document.getElementById(
          `calzone-content-${targetId}`,
        );
        if (targetContent) {
          targetContent.classList.remove("hidden");
        }

        currentCalzoneType = targetId;
        updateCalzoneSummary();
      });
    });

    if (ingredientCheckboxes.length > 0) {
      ingredientCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", (e) => {
          if (e.target.checked) {
            if (selectedIngredients.length >= maxIngredients) {
              e.target.checked = false;
              alert(
                `Puedes seleccionar un máximo de ${maxIngredients} ingredientes.`,
              );
              return;
            }
            selectedIngredients.push(e.target.value);
          } else {
            selectedIngredients = selectedIngredients.filter(
              (item) => item !== e.target.value,
            );
          }
          if (amgCounter) {
            amgCounter.textContent = `${selectedIngredients.length}/${maxIngredients}`;
          }
          updateCalzoneSummary();
        });
      });
    }

    function updateCalzoneSummary() {
      const data = calzoneData[currentCalzoneType];

      if (calzoneSummaryTitle) calzoneSummaryTitle.textContent = data.title;
      if (calzoneSummaryPrice)
        calzoneSummaryPrice.textContent = `S/ ${data.price.toFixed(2)}`;
      if (calzoneMainImg) calzoneMainImg.src = data.img;

      if (currentCalzoneType === "amigusto") {
        if (selectedIngredients.length === 0) {
          if (calzoneSummaryDetails)
            calzoneSummaryDetails.textContent =
              "Ningún ingrediente seleccionado";
        } else {
          if (calzoneSummaryDetails)
            calzoneSummaryDetails.textContent = selectedIngredients.join(", ");
        }
      } else if (currentCalzoneType === "vegetariano") {
        let detailsText = data.details;
        if (selectedVegOlives !== "Ninguna") {
          detailsText += ` + Aceitunas ${selectedVegOlives}`;
        }
        if (calzoneSummaryDetails)
          calzoneSummaryDetails.textContent = detailsText;
      } else {
        if (calzoneSummaryDetails)
          calzoneSummaryDetails.textContent = data.details;
      }
    }

    // Add to cart for Calzone
    if (addCalzoneBtn) {
      addCalzoneBtn.addEventListener("click", (e) => {
        e.preventDefault();

        if (
          currentCalzoneType === "amigusto" &&
          selectedIngredients.length === 0
        ) {
          alert(
            "Por favor selecciona al menos un ingrediente para tu Calzone A Mi Gusto.",
          );
          return;
        }

        const data = calzoneData[currentCalzoneType];
        let title = data.title;
        if (currentCalzoneType === "amigusto") {
          title += ` (${selectedIngredients.join(", ")})`;
        } else if (
          currentCalzoneType === "vegetariano" &&
          selectedVegOlives !== "Ninguna"
        ) {
          title += ` (+ Aceitunas ${selectedVegOlives})`;
        }

        const existingItem = cart.find((item) => item.title === title);
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          cart.push({
            title: title,
            price: data.price,
            quantity: 1,
            imgUrl: data.img,
          });
        }

        saveCart();
        animateFlyingImage(calzoneMainImg);
        setTimeout(() => {
          updateCartCounter(true);
        }, 500);

        alert(`${title} añadido al carrito.`);
      });
    }

    // Ensure footer visibility when scrolling in calzone section (Mobile)
    const calzoneSection = document.getElementById("calzone");
    if (calzoneSection && calzoneStickyFooter) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // On desktop, it should always be visible (handled by CSS).
            // We only toggle hidden on mobile (innerWidth < 1024).
            // In Tailwind: lg:relative lg:shadow-none lg:bg-transparent lg:border-none lg:p-0 mt-4 lg:mt-8 hidden
            // Since it has "hidden", it's hidden by default on all screens. We need to toggle it on mobile when visible, and on desktop always show it.
            // Wait, if it has "hidden lg:flex" in html it would be better, but we don't have lg:flex in HTML.
            // So we must toggle 'hidden' class based on visibility and screen size.
            if (window.innerWidth >= 1024) {
              calzoneStickyFooter.classList.remove("hidden");
            } else {
              if (entry.isIntersecting) {
                calzoneStickyFooter.classList.remove("hidden");
              } else {
                calzoneStickyFooter.classList.add("hidden");
              }
            }
          });
        },
        { threshold: 0.1 },
      );

      observer.observe(calzoneSection);

      // Also listen to resize to handle orientation changes or window resizes
      window.addEventListener("resize", () => {
        const rect = calzoneSection.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
        if (window.innerWidth >= 1024) {
          calzoneStickyFooter.classList.remove("hidden");
        } else {
          if (isVisible) {
            calzoneStickyFooter.classList.remove("hidden");
          } else {
            calzoneStickyFooter.classList.add("hidden");
          }
        }
      });

      // Initial check for desktop
      if (window.innerWidth >= 1024) {
        calzoneStickyFooter.classList.remove("hidden");
      }
    }
  }
});
