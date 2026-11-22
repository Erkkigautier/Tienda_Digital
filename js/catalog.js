/*
 * catalog.js — UrbanShop
 * Pinta el catálogo desde store.js, filtra por categoría y agrega al carrito.
 */

(function () {
  "use strict";

  var shop = window.UrbanShop;
  var grid = document.getElementById("product-grid");
  var filters = document.getElementById("category-filters");
  var status = document.getElementById("cart-status");

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    for (var key in attrs) node.setAttribute(key, attrs[key]);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderCard(p) {
    var card = el("article", { "class": "box-1", "data-category": p.category });

    var figure = el("figure");
    figure.appendChild(el("img", { loading: "lazy", src: p.img, alt: p.alt, width: "750", height: "1000" }));
    card.appendChild(figure);

    card.appendChild(el("h3", {}, p.name));
    var price = el("p");
    price.appendChild(el("small", {}, shop.money(p.price)));
    card.appendChild(price);

    var form = el("form", { "class": "add-form" });
    var selectId = "talla-" + p.id;
    form.appendChild(el("label", { "for": selectId }, "Talla"));
    var select = el("select", { id: selectId, name: "size", required: "" });
    p.sizes.forEach(function (s) { select.appendChild(el("option", { value: s }, s)); });
    form.appendChild(select);
    form.appendChild(el("button", { type: "submit", "class": "add-to-cart" }, "Agregar al carrito"));

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      shop.addToCart(p.id, select.value, 1);
      status.textContent = "";
      status.appendChild(document.createTextNode("Agregado: " + p.name + " (talla " + select.value + "). "));
      status.appendChild(el("a", { href: "venta.html" }, "Ir a pagar"));
    });

    card.appendChild(form);
    return card;
  }

  function renderFilters() {
    var categories = ["Todo"];
    shop.PRODUCTS.forEach(function (p) {
      if (categories.indexOf(p.category) === -1) categories.push(p.category);
    });

    categories.forEach(function (c, i) {
      var li = el("li");
      var btn = el("button", { type: "button", "aria-pressed": i === 0 ? "true" : "false", "data-filter": c }, c);
      btn.addEventListener("click", function () { applyFilter(c); });
      li.appendChild(btn);
      filters.appendChild(li);
    });
  }

  // El filtro activo vive en la URL (?categoria=Casacas): se puede compartir y el botón Atrás funciona.
  function applyFilter(category, fromUrl) {
    if (!fromUrl && window.history && history.replaceState) {
      var url = category === "Todo" ? "catalog.html" : "catalog.html?categoria=" + encodeURIComponent(category);
      try { history.replaceState(null, "", url); } catch (e) { /* file:// en algunos navegadores */ }
    }
    var buttons = filters.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-pressed", buttons[i].getAttribute("data-filter") === category ? "true" : "false");
    }
    var cards = grid.querySelectorAll(".box-1");
    for (var j = 0; j < cards.length; j++) {
      cards[j].hidden = category !== "Todo" && cards[j].getAttribute("data-category") !== category;
    }
  }

  shop.PRODUCTS.forEach(function (p) { grid.appendChild(renderCard(p)); });
  renderFilters();

  var requested = new URLSearchParams(window.location.search).get("categoria");
  var known = shop.PRODUCTS.some(function (p) { return p.category === requested; });
  if (known) applyFilter(requested, true);
})();
