const products = [
  { id: 1, name: "Shoes", price: 50 },
  { id: 2, name: "Hat", price: 20 },
  { id: 3, name: "Jacket", price: 100 }
];

const cart = [];

const productsDiv = document.getElementById("products");
const cartList = document.getElementById("cart");

function renderProducts() {
  productsDiv.innerHTML = "";

  products.forEach(p => {
    const div = document.createElement("div");
    div.className = "product";

    div.innerHTML = `
      <h3>${p.name}</h3>
      <p>$${p.price}</p>
      <button onclick="addToCart(${p.id})">Add to cart</button>
    `;

    productsDiv.appendChild(div);
  });
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  cart.push(product);
  renderCart();
}

function renderCart() {
  cartList.innerHTML = "";

  cart.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.name} - $${item.price}`;
    cartList.appendChild(li);
  });
}

renderProducts();
