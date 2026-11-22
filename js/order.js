/*
 * order.js — UrbanShop
 * Muestra el resultado del último pedido en confirmation.html y Error.html.
 * Si no hay pedido guardado (p. ej. se abrió la página directo), deja el mensaje genérico.
 */

(function () {
  "use strict";

  var shop = window.UrbanShop;
  var order = shop.readOrder();
  var box = document.getElementById("order-details");
  if (!order || !box) return;

  function row(label, value) {
    var li = document.createElement("li");
    var a = document.createElement("span");
    var b = document.createElement("span");
    a.textContent = label;
    b.textContent = value;
    li.appendChild(a);
    li.appendChild(b);
    return li;
  }

  var list = document.createElement("ul");
  list.className = "receipt";

  if (order.ok) {
    list.appendChild(row("Pedido", order.number));
    order.lines.forEach(function (l) {
      list.appendChild(row(l.qty + " × " + l.name + " (" + l.size + ")", shop.money(l.total)));
    });
    list.appendChild(row("Envío", shop.money(order.shipping)));
    list.appendChild(row("Total", shop.money(order.total)));
    list.appendChild(row("Pago", order.method));
  } else {
    list.appendChild(row("Motivo", order.reason));
    list.appendChild(row("Pago", order.method));
    list.appendChild(row("Total", shop.money(order.total)));
  }

  box.appendChild(list);
  box.hidden = false;
})();
