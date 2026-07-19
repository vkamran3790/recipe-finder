const searchInput = document.querySelector("#searchInput");
const searchBtn = document.querySelector("#searchBtn");
const recipesContainer = document.querySelector(".recipes-container");
const errorBox = document.querySelector(".error");
const modal = document.querySelector(".modal");
const categoryFilter = document.querySelector("#categoryFilter");
const countryFilter = document.querySelector("#countryFilter");
const loadMoreBtn = document.querySelector("#loadMoreBtn");
const themeBtn = document.querySelector("#themeBtn");
const randomBtn = document.querySelector("#randomBtn");
const favoritesCount = document.querySelector("#favoritesCount");
const sortSelect = document.querySelector("#sortSelect");
const historyContainer = document.querySelector("#historyContainer");
const autocompleteBox = document.querySelector(".autocomplete-box");
const clearHistoryBtn = document.querySelector("#clearHistoryBtn");


let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

let recipes = [];
let currentRecipes = [];
let visibleCount = 6;
let itemsPerLoad = 6;
let searchTimeout;
let searchController;


async function getRecipes(foodName) {
    if (searchController) {
        searchController.abort();
    }

    searchController = new AbortController();

    try {
        let url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${foodName}`;

        showSkeleton();

        let response = await fetch(url, {
            signal: searchController.signal
        });

        let data = await response.json();

        if (!data.meals) {
            errorBox.style.display = "block";
            errorBox.textContent = "No recipes found!";

            return;
        }

        errorBox.style.display = "none";

        recipes = data.meals;
        selectedCategory = "";
        selectedCountry = "";

        categoryFilter.value = "";
        countryFilter.value = "";
        visibleCount = itemsPerLoad;
        currentRecipes = recipes;

        renderRecipes(currentRecipes);
        renderCategories();
        renderCountries();
    }

    catch (error) {

        if (error.name === "AbortError") {
            return;
        }

        errorBox.style.display = "block";
        errorBox.textContent = "Something went wrong!";

    }

    finally {
        hideSkeleton();
    }
}

async function getRandomRecipes() {

    try {
        let url = "https://www.themealdb.com/api/json/v1/1/random.php";

        showSkeleton();

        let response = await fetch(url);
        let data = await response.json();
        recipes = data.meals;
        currentRecipes = recipes;
        visibleCount = itemsPerLoad;
        renderRecipes(currentRecipes);
    }

    catch (error) {
        console.log(error);
        errorBox.style.display = "block";
        errorBox.textContent = "Something went wrong";
    }

    finally {
        hideSkeleton();
    }
}

searchInput.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {
        getRecipes(searchInput.value);
    }
});

searchBtn.addEventListener("click", () => {
    let foodName = searchInput.value;
    saveSearch(foodName);
    getRecipes(foodName);
});

searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {

        let value = searchInput.value.trim();

        if (value.length < 3) {
            recipesContainer.innerHTML = "";
            autocompleteBox.innerHTML = "";

            return;
        }
        getSuggestions(value);
    }, 500);
});

clearHistoryBtn.addEventListener("click", () => {
    searchHistory = [];
    localStorage.removeItem("searchHistory");
    renderSearchHistory();
});

categoryFilter.addEventListener("change", () => {
    selectedCategory = categoryFilter.value;
    applyFilters();
});

countryFilter.addEventListener("change", () => {
    selectedCountry = countryFilter.value;
    applyFilters();
});

sortSelect.addEventListener("change", () => {
    sortRecipes();
});

modal.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

loadMoreBtn.addEventListener("click", () => {
    visibleCount += itemsPerLoad;

    if (visibleCount >= currentRecipes.length) {
        visibleCount = currentRecipes.length;
    }

    renderRecipes(currentRecipes);
});

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    let isDark = document.body.classList.contains("dark");

    themeBtn.textContent = isDark
        ? "☀ Light Mode"
        : "🌙 Dark Mode";

    localStorage.setItem(
        "theme",
        isDark ? "dark" : "light"
    );
});

let saveTheme = localStorage.getItem("theme");

if (saveTheme === "dark") {
    document.body.classList.add("dark");
}

randomBtn.addEventListener("click", () => {
    getRandomRecipes();
});

document.addEventListener("click", (event) => {
    if (!event.target.closest(".search-wrapper")) {
        autocompleteBox.innerHTML = "";
        autocompleteBox.style.display = "none";
    }
});

function renderRecipes(data) {
    if (visibleCount >= data.length) {
        loadMoreBtn.style.display = "none";
    } else {
        loadMoreBtn.style.display = "block";
    }
    recipesContainer.innerHTML = "";

    let visibleRecipes = data.slice(0, visibleCount);
    visibleRecipes.forEach(recipe => {

        let card = document.createElement("div");
        card.classList.add("recipe-card");

        let image = document.createElement("img");
        image.src = recipe.strMealThumb;

        let title = document.createElement("h2");
        title.textContent = recipe.strMeal;

        let category = document.createElement("p");
        category.textContent = recipe.strCategory;

        let country = document.createElement("p");
        country.textContent = recipe.strArea;

        let detailsBtn = document.createElement("button");
        detailsBtn.textContent = "View Details";

        detailsBtn.addEventListener("click", () => {
            getRecipeDetails(recipe.idMeal);
        });

        let favoriteBtn = document.createElement("button");

        let isFavorite = favorites.some(
            favorite => favorite.idMeal === recipe.idMeal
        );

        favoriteBtn.textContent = isFavorite ? "❤️" : "🤍";

        favoriteBtn.addEventListener("click", () => {
            let exists = favorites.some(favorite => favorite.idMeal === recipe.idMeal);

            if (exists) {
                favorites = favorites.filter(favorite => favorite.idMeal !== recipe.idMeal);
            } else {
                favorites.push(recipe);
            }

            localStorage.setItem("favorites", JSON.stringify(favorites));
            renderRecipes(currentRecipes);
        });

        let plannerBtn = document.createElement("button");
        plannerBtn.textContent = "📅 Add To Planner";
        plannerBtn.addEventListener("click", () => {
            localStorage.setItem("selectedRecipe", JSON.stringify(recipe));
            alert("Recipe added to planner!");
        });
        card.append(
            image,
            title,
            category,
            country,
            detailsBtn,
            favoriteBtn,
            plannerBtn
        );
        recipesContainer.append(card);
    });
}

async function getRecipeDetails(id) {

    let url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
    let response = await fetch(url);
    let data = await response.json();

    if (!data.meals) {
        return;
    }

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

    let youtubeBtn = "";

    if (meal.strYoutube) {
        youtubeBtn = `
        <a class="youtube-btn href="${meal.strYoutube}" target="_blank">
            📺 Watch Tutorial
        </a>
    `;
    }

    modal.innerHTML = `
        <button class="close-btn">X</button>
        <h2>${meal.strMeal}</h2>
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        ${youtubeBtn}
        <h3>Ingredients</h3>
        <ul>${ingredientsHTML}</ul>
        <h3>Instructions</h3>
        <p>${meal.strInstructions}</p>
        `;

    const closeBtn = modal.querySelector(".close-btn");

    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    modal.style.display = "block";
}

function renderCategories() {
    categoryFilter.innerHTML = `<option value="">All Categories</option>`;

    let categories = recipes.map(recipe => recipe.strCategory);
    let uniqueCategories = [...new Set(categories)];

    uniqueCategories.forEach(category => {
        let option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryFilter.append(option);
    });
}

function renderCountries() {
    countryFilter.innerHTML = `<option value="">All Countries</option>`;

    let countries = recipes.map(recipe => recipe.strArea);
    let uniqueCountries = [...new Set(countries)];

    uniqueCountries.forEach(country => {
        let option = document.createElement("option");
        option.value = country;
        option.textContent = country;
        countryFilter.append(option);
    });
}

function updateFavoritesCount() {
    favoritesCount.textContent = `❤️ : ${favorites.length}`;
}

function applyFilters() {
    currentRecipes = recipes.filter(recipe => {
        let categoryMatch =
            selectedCategory === "" ||
            recipe.strCategory === selectedCategory;

        let countryMatch =
            selectedCountry === "" ||
            recipe.strArea === selectedCountry;

        return categoryMatch && countryMatch;
    });
    visibleCount = itemsPerLoad;
    renderRecipes(currentRecipes);
}

function sortRecipes() {
    let sortValue = sortSelect.value;
    if (sortValue === "az") {
        currentRecipes.sort((a, b) => {
            return a.strMeal.localeCompare(b.strMeal);
        });
    }
    else if (sortValue === "za") {
        currentRecipes.sort((a, b) => {
            return b.strMeal.localeCompare(a.strMeal);
        });
    }
    renderRecipes(currentRecipes);
}
updateFavoritesCount();

function saveSearch(foodName) {
    if (foodName.trim() === "") {
        return;
    }

    searchHistory = searchHistory.filter(
        item => item !== foodName
    );

    searchHistory.unshift(foodName);

    if (searchHistory.length > 5) {
        searchHistory.pop();
    }

    localStorage.setItem(
        "searchHistory",
        JSON.stringify(searchHistory)
    );

    renderSearchHistory();
}

function renderSearchHistory() {
    historyContainer.innerHTML = "";

    searchHistory.forEach(item => {
        let button = document.createElement("button");
        button.textContent = item;

        button.addEventListener("click", () => {
            searchInput.value = item;
            getRecipes(item);
        });

        historyContainer.append(button);
    });
}
renderSearchHistory();

function renderSuggestions(data) {
    autocompleteBox.innerHTML = "";
    data.forEach(recipe => {
        let suggestion = document.createElement("div");
        suggestion.classList.add("autocomplete-item");
        suggestion.textContent = recipe.strMeal;

        suggestion.addEventListener("click", () => {
            searchInput.value = recipe.strMeal;
            autocompleteBox.innerHTML = "";
            getRecipes(recipe.strMeal);
        });

        autocompleteBox.append(suggestion);
    });

    autocompleteBox.style.display = "block";
}

async function getSuggestions(value) {
    let url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${value}`;

    let response = await fetch(url);
    let data = await response.json();

    if (!data.meals) {
        autocompleteBox.style.display = "none";
        return;
    }

    renderSuggestions(data.meals.slice(0, 5));
}

function showSkeleton() {
    recipesContainer.innerHTML = "";
    for (let i = 0; i < 6; i++) {
        let skeleton = document.createElement("div");
        skeleton.classList.add("skeleton-card");
        skeleton.innerHTML = `
        <div class="skeleton-image"></div>
        <div class="skeleton-text large"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text small"></div>
        `;
        recipesContainer.append(skeleton);
    }
}

function hideSkeleton() {
    document.querySelectorAll(".skeleton-card")
        .forEach(item => item.remove());
}