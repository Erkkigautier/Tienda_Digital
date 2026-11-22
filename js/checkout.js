/*
 * checkout.js — UrbanShop
 * Resumen del carrito y formulario de pago (venta.html).
 *
 * DEMO SIN COBRO: nada sale del navegador. Los campos de tarjeta no tienen atributo
 * "name", así que nunca se envían, y del número solo se guardan los últimos 4 dígitos.
 * Para conectar una pasarela real (Culqi, Mercado Pago, PayPal), reemplaza
 * simulatePayment() por la llamada a su SDK; los datos de tarjeta deben ir directo a
 * la pasarela, nunca a un servidor propio.
 *
 * Tarjeta de prueba que simula un rechazo: 4000 0000 0000 0002.
 */

(function () {
  "use strict";

  var shop = window.UrbanShop;
  var DECLINED_TEST_CARD = "4000000000000002";

  var form = document.getElementById("checkout-form");
  var linesBox = document.getElementById("cart-lines");
  var emptyBox = document.getElementById("cart-empty");
  var subtotalEl = document.getElementById("sum-subtotal");
  var shippingEl = document.getElementById("sum-shipping");
  var totalEl = document.getElementById("sum-total");
  var payButton = document.getElementById("pay-button");
  var formError = document.getElementById("form-error");

  var cardNumber = document.getElementById("card-number");
  var cardExpiry = document.getElementById("card-expiry");
  var cardCvv = document.getElementById("card-cvv");
  var cardBrand = document.getElementById("card-brand");
  var walletPhone = document.getElementById("wallet-phone");

  /* ---------- Resumen del carrito ---------- */

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    for (var key in attrs) node.setAttribute(key, attrs[key]);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderCart() {
    var t = shop.cartTotals();
    linesBox.textContent = "";

    t.lines.forEach(function (line) {
      var li = el("li", { "class": "cart-line" });
      li.appendChild(el("img", { src: line.product.img, alt: "", width: "56", height: "72" }));

      var info = el("div", { "class": "cart-line-info" });
      info.appendChild(el("strong", {}, line.product.name));
      info.appendChild(el("span", {}, "Talla " + line.size + " · " + shop.money(line.product.price)));

      var qtyId = "cant-" + line.id + "-" + line.size;
      var qtyRow = el("div", { "class": "cart-line-qty" });
      qtyRow.appendChild(el("label", { "for": qtyId }, "Cant."));
      var qty = el("input", { id: qtyId, type: "number", min: "1", max: "10", value: String(line.qty), inputmode: "numeric" });
      qty.addEventListener("change", function () {
        var n = parseInt(qty.value, 10);
        shop.setQty(line.id, line.size, isNaN(n) ? 1 : n);
        renderCart();
      });
      qtyRow.appendChild(qty);

      var remove = el("button", { type: "button", "class": "link-button" }, "Quitar");
      remove.addEventListener("click", function () {
        shop.removeFromCart(line.id, line.size);
        renderCart();
      });
      qtyRow.appendChild(remove);
      info.appendChild(qtyRow);

      li.appendChild(info);
      li.appendChild(el("span", { "class": "cart-line-total" }, shop.money(line.total)));
      linesBox.appendChild(li);
    });

    emptyBox.hidden = t.count > 0;
    subtotalEl.textContent = shop.money(t.subtotal);
    shippingEl.textContent = shop.money(t.shipping);
    totalEl.textContent = shop.money(t.total);
    payButton.textContent = t.count > 0 ? "Pagar " + shop.money(t.total) : "Carrito vacío";
    payButton.disabled = t.count === 0;
  }

  /* ---------- Métodos de pago ---------- */

  function activeMethod() {
    return form.querySelector('input[name="method"]:checked').value;
  }

  // Solo el panel elegido queda activo: un <fieldset disabled> no se valida ni se envía.
  function showMethod() {
    var method = activeMethod();
    var panels = form.querySelectorAll("[data-panel]");
    for (var i = 0; i < panels.length; i++) {
      var on = panels[i].getAttribute("data-panel") === method;
      panels[i].hidden = !on;
      panels[i].disabled = !on;
    }
    formError.textContent = "";
  }

  /* ---------- Tarjeta: formato y validación ---------- */

  function digits(value) {
    return value.replace(/\D/g, "");
  }

  function brandOf(num) {
    if (/^4/.test(num)) return "Visa";
    if (/^(5[1-5]|2[2-7])/.test(num)) return "Mastercard";
    if (/^3[47]/.test(num)) return "American Express";
    if (/^3(0[0-5]|[68])/.test(num)) return "Diners Club";
    return "";
  }

  // Algoritmo de Luhn: detecta números de tarjeta mal digitados
  function luhn(num) {
    var sum = 0;
    for (var i = 0; i < num.length; i++) {
      var d = parseInt(num.charAt(num.length - 1 - i), 10);
      if (i % 2 === 1) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
    }
    return num.length > 0 && sum % 10 === 0;
  }

  function checkCardNumber() {
    var num = digits(cardNumber.value);
    var brand = brandOf(num);
    var isAmex = brand === "American Express";

    // agrupa los dígitos: 4-6-5 en Amex, 4-4-4-4 en las demás
    var groups = isAmex ? num.slice(0, 15).match(/^(\d{0,4})(\d{0,6})(\d{0,5})/).slice(1) : num.slice(0, 16).match(/.{1,4}/g) || [];
    cardNumber.value = groups.filter(Boolean).join(" ");
    cardBrand.textContent = brand;
    cardCvv.maxLength = isAmex ? 4 : 3;
    if (cardCvv.value) checkCvv(); // re-valida el CVV si cambió la marca

    var expected = isAmex ? 15 : 16;
    var msg = "";
    if (num.length && !brand) msg = "Aceptamos Visa, Mastercard, American Express y Diners Club.";
    else if (num.length && num.length < expected) msg = "Faltan dígitos.";
    else if (num.length && !luhn(num.slice(0, expected))) msg = "El número de tarjeta no es válido. Revísalo.";
    cardNumber.setCustomValidity(msg);
  }

  function checkExpiry() {
    var d = digits(cardExpiry.value).slice(0, 4);
    cardExpiry.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;

    var msg = "";
    if (d.length === 4) {
      var month = parseInt(d.slice(0, 2), 10);
      var year = 2000 + parseInt(d.slice(2), 10);
      var now = new Date();
      if (month < 1 || month > 12) msg = "Mes inválido.";
      else if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) msg = "La tarjeta está vencida.";
    } else if (d.length) {
      msg = "Usa el formato MM/AA.";
    }
    cardExpiry.setCustomValidity(msg);
  }

  function checkCvv() {
    cardCvv.value = digits(cardCvv.value).slice(0, cardCvv.maxLength);
    cardCvv.setCustomValidity(cardCvv.value && cardCvv.value.length !== cardCvv.maxLength
      ? "El código tiene " + cardCvv.maxLength + " dígitos." : "");
  }

  function checkWalletPhone() {
    walletPhone.value = digits(walletPhone.value).slice(0, 9);
    walletPhone.setCustomValidity(walletPhone.value && !/^9\d{8}$/.test(walletPhone.value)
      ? "Ingresa un celular peruano de 9 dígitos que empiece con 9." : "");
  }

  /* ---------- Pago (simulado) ---------- */

  function methodLabel(method) {
    if (method === "card") {
      var num = digits(cardNumber.value);
      return brandOf(num) + " terminada en " + num.slice(-4);
    }
    if (method === "wallet") {
      var wallet = form.querySelector('input[name="wallet"]:checked').value;
      return wallet + " · celular terminado en " + walletPhone.value.slice(-3);
    }
    return "PayPal";
  }

  function simulatePayment(method) {
    // Demo: solo la tarjeta de prueba DECLINED_TEST_CARD es rechazada.
    if (method === "card" && digits(cardNumber.value) === DECLINED_TEST_CARD) {
      return { ok: false, reason: "El banco rechazó la tarjeta. Prueba con otra tarjeta u otro método de pago." };
    }
    return { ok: true };
  }

  function orderNumber() {
    return "US-" + Date.now().toString(36).toUpperCase();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    formError.textContent = "";

    var t = shop.cartTotals();
    if (t.count === 0) {
      formError.textContent = "Tu carrito está vacío.";
      return;
    }
    if (!form.reportValidity()) return;

    var method = activeMethod();
    var result = simulatePayment(method);
    var order = {
      number: orderNumber(),
      date: new Date().toISOString(),
      ok: result.ok,
      reason: result.reason || "",
      method: methodLabel(method),
      lines: t.lines.map(function (l) {
        return { name: l.product.name, size: l.size, qty: l.qty, total: l.total };
      }),
      subtotal: t.subtotal,
      shipping: t.shipping,
      total: t.total
    };
    shop.saveOrder(order);

    if (result.ok) {
      shop.clearCart();
      window.location.href = "confirmation.html";
    } else {
      window.location.href = "Error.html"; // el carrito se conserva para reintentar
    }
  });

  /* ---------- Inicio ---------- */

  var methodRadios = form.querySelectorAll('input[name="method"]');
  for (var i = 0; i < methodRadios.length; i++) methodRadios[i].addEventListener("change", showMethod);

  cardNumber.addEventListener("input", checkCardNumber);
  cardExpiry.addEventListener("input", checkExpiry);
  cardCvv.addEventListener("input", checkCvv);
  walletPhone.addEventListener("input", checkWalletPhone);

  showMethod();
  renderCart();
})();
