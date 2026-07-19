const recipesContainer = document.querySelector(".recipes-container");
const modal = document.querySelector(".modal");

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

function renderFavorites() {
    recipesContainer.innerHTML = "";

    if (favorites.length === 0) {
        recipesContainer.innerHTML = `
            <h2>No favorite recipes yet 🍔</h2>
        `;
        return;
    }

    favorites.forEach(recipe => {
        let card = document.createElement("div");

        card.classList.add("recipe-card");

        card.innerHTML = `
        <img src="${recipe.strMealThumb}">
        <h2>${recipe.strMeal}</h2>
        <p>${recipe.strCategory}</p>
        <p>${recipe.strArea}</p>
        <button class="remove-btn">Remove ❤️</button>
        <button class="details-btn">View Details</button>
        `;

        let detailsBtn = card.querySelector(".details-btn");

        detailsBtn.addEventListener("click", () => {
            getRecipeDetails(recipe.idMeal);
        });

        let removeBtn = card.querySelector(".remove-btn");

        removeBtn.addEventListener("click", () => {
            favorites = favorites.filter(item => {
                return item.idMeal !== recipe.idMeal;
            });

            localStorage.setItem(
                "favorites",
                JSON.stringify(favorites)
            );

            renderFavorites();

        });

        recipesContainer.append(card);
    });
}

renderFavorites();

async function getRecipeDetails(id) {

    let url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`;

    let response = await fetch(url);

    let data = await response.json();

    let meal = data.meals[0];

    let ingredients = [];

    for (let i = 1; i <= 20; i++) {

        let ingredient = meal[`strIngredient${i}`];

        if (ingredient && ingredient.trim() !== "") {
            ingredients.push(ingredient);
        }
    }

    let ingredientsHTML = ingredients
        .map(item => `<li>${item}</li>`)
        .join("");

    modal.innerHTML = `

    <button class="close-btn">X</button>

    <h2>${meal.strMeal}</h2>
    <img src="${meal.strMealThumb}">
    <h3>Ingredients</h3>
    <ul>${ingredientsHTML}</ul>
    <h3>Instructions</h3>
    <p>${meal.strInstructions}</p>
    `;

    modal.style.display = "block";

    let closeBtn = modal.querySelector(".close-btn");

    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });
}

modal.addEventListener("click", (event) => {

    if (event.target === modal) {
        modal.style.display = "none";
    }
});