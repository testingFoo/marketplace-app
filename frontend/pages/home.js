export function HomePage() {
  return `
    <div class="grid">

      <div class="tile" onclick="navigate('uber')">🚗 Uber</div>
      <div class="tile" onclick="navigate('wallet')">💳 Wallet</div>
      <div class="tile" onclick="navigate('social')">👥 Social</div>
      <div class="tile" onclick="navigate('experience')">💼 Experience</div>
      <div class="tile" onclick="navigate('business')">🏢 Business</div>

      <div class="tile" onclick="navigate('shopping')">🛒 Shopping</div>
      <div class="tile" onclick="navigate('flights')">✈️ Flights</div>
      <div class="tile" onclick="navigate('hotels')">🏨 Hotels</div>
      <div class="tile" onclick="navigate('restaurants')">🍽 Restaurants</div>
      <div class="tile" onclick="navigate('rentals')">🚙 Rentals</div>

    </div>
  `;
}
