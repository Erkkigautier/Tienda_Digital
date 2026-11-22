/*
 * store.js — UrbanShop
 * Productos, carrito y utilidades compartidas por todas las páginas.
 *
 * TIENDA DEMO: los nombres y precios son de ejemplo y no se realiza ningún cobro.
 * El carrito vive en localStorage del navegador; el último pedido, en sessionStorage.
 */

(function () {
  "use strict";

  var SHIPPING = 10; // costo de envío fijo, en soles

  var PRODUCTS = [
    { id: "casaca-cortavientos", name: "Casaca cortavientos bicolor", category: "Casacas", price: 189,
      sizes: ["S", "M", "L", "XL"], img: "img/foto1.jpg", alt: "Casaca cortavientos negra con interior amarillo" },
    { id: "polo-grafico", name: "Polo gráfico oversize", category: "Polos", price: 69,
      sizes: ["S", "M", "L", "XL"], img: "img/foto2.jpg", alt: "Polo crema con estampado gráfico rojo y celeste" },
    { id: "polo-blanco", name: "Polo oversize blanco", category: "Polos", price: 59,
      sizes: ["S", "M", "L", "XL"], img: "img/foto3.jpg", alt: "Polo blanco oversize con texto en el cuello" },
    { id: "jogger-gris", name: "Jogger de felpa gris", category: "Joggers", price: 89,
      sizes: ["S", "M", "L", "XL"], img: "img/foto4.jpg", alt: "Jogger gris de felpa con puño en el tobillo" },
    { id: "pantalon-patchwork", name: "Pantalón cargo patchwork", category: "Pantalones", price: 149,
      sizes: ["28", "30", "32", "34"], img: "img/foto5.jpg", alt: "Pantalón ancho de paneles verde, marrón y beige" },
    { id: "casaca-acolchada", name: "Casaca acolchada roja", category: "Casacas", price: 219,
      sizes: ["S", "M", "L", "XL"], img: "img/foto6.jpg", alt: "Casaca acolchada roja con paneles negros" },
    { id: "polera-naranja", name: "Polera oversize naranja", category: "Poleras", price: 119,
      sizes: ["S", "M", "L", "XL"], img: "img/foto7.jpg", alt: "Polera naranja oversize con pantalón gris" },
    { id: "buzo-palo-rosa", name: "Buzo cortaviento palo rosa", category: "Buzos", price: 159,
      sizes: ["S", "M", "L", "XL"], img: "img/foto8.jpg", alt: "Conjunto de buzo cortaviento en palo rosa y beige" },
    { id: "bividi-estampado", name: "Bividí estampado", category: "Polos", price: 49,
      sizes: ["S", "M", "L", "XL"], img: "img/foto9.jpg", alt: "Bividí blanco con estampado verde, amarillo y rojo" }
  ];

  var CART_KEY = "urbanshop.cart";
  var ORDER_KEY = "urbanshop.lastOrder";
  var memoryCart = []; // respaldo si el navegador bloquea localStorage

  function findProduct(id) {
    for (var i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i].id === id) return PRODUCTS[i];
    }
    return null;
  }

  function money(n) {
    return "S/ " + n.toFixed(2);
  }

  function readCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var items = raw ? JSON.parse(raw) : [];
      // descarta líneas de productos que ya no existen o con datos inválidos
      return Array.isArray(items) ? items.filter(function (it) {
        var p = it && findProduct(it.id);
        return p && p.sizes.indexOf(it.size) !== -1 && it.qty >= 1;
      }) : [];
    } catch (e) {
      return memoryCart.slice();
    }
  }

  function writeCart(items) {
    memoryCart = items.slice();
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch (e) { /* sin almacenamiento: el carrito vive solo en esta página */ }
    updateCartCount();
  }

  function addToCart(id, size, qty) {
    var items = readCart();
    var line = items.filter(function (it) { return it.id === id && it.size === size; })[0];
    if (line) {
      line.qty = Math.min(line.qty + qty, 10);
    } else {
      items.push({ id: id, size: size, qty: qty });
    }
    writeCart(items);
  }

  function setQty(id, size, qty) {
    var items = readCart().map(function (it) {
      if (it.id === id && it.size === size) it.qty = Math.max(1, Math.min(qty, 10));
      return it;
    });
    writeCart(items);
  }

  function removeFromCart(id, size) {
    writeCart(readCart().filter(function (it) { return !(it.id === id && it.size === size); }));
  }

  function clearCart() {
    writeCart([]);
  }

  function cartLines() {
    return readCart().map(function (it) {
      var p = findProduct(it.id);
      return { id: it.id, size: it.size, qty: it.qty, product: p, total: p.price * it.qty };
    });
  }

  function cartTotals() {
    var lines = cartLines();
    var subtotal = lines.reduce(function (sum, l) { return sum + l.total; }, 0);
    var count = lines.reduce(function (sum, l) { return sum + l.qty; }, 0);
    var shipping = count > 0 ? SHIPPING : 0;
    return { lines: lines, count: count, subtotal: subtotal, shipping: shipping, total: subtotal + shipping };
  }

  function updateCartCount() {
    var count = cartTotals().count;
    var nodes = document.querySelectorAll("[data-cart-count]");
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = String(count);
  }

  function saveOrder(order) {
    try {
      sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
    } catch (e) { /* sin almacenamiento: la página de resultado muestra un mensaje genérico */ }
  }

  function readOrder() {
    try {
      var raw = sessionStorage.getItem(ORDER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  window.UrbanShop = {
    PRODUCTS: PRODUCTS,
    findProduct: findProduct,
    money: money,
    addToCart: addToCart,
    setQty: setQty,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    cartTotals: cartTotals,
    saveOrder: saveOrder,
    readOrder: readOrder
  };

  // Formulario de promociones: en la demo no se guarda ni se envía nada.
  function wireNewsletter() {
    var forms = document.querySelectorAll(".newsletter-form");
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener("submit", function (event) {
        event.preventDefault();
        var status = this.querySelector(".form-status");
        if (status) status.textContent = "Tienda demo: no guardamos tu correo, así que no recibirás mensajes.";
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    updateCartCount();
    wireNewsletter();
  });
})();
