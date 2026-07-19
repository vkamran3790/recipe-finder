let mealPlan = JSON.parse(localStorage.getItem("mealPlan")) || {};

const dropAreas = document.querySelectorAll(".drop-area");

function savePlan() {
    localStorage.setItem("mealPlan",JSON.stringify(mealPlan));
}

function renderPlan() {
    dropAreas.forEach(area => {
        let day = area.dataset.day;
        area.innerHTML = "";

        if (mealPlan[day]) {
            area.innerHTML = `
                <img src="${mealPlan[day].image}">
                <h4>${mealPlan[day].name}</h4>
                <button class="remove">Remove</button>
            `;

            let removeBtn = area.querySelector(".remove");
            removeBtn.addEventListener("click", (event) => {
                event.stopPropagation();
                delete mealPlan[day];
                savePlan();
                renderPlan();
            });
        }
    });
}

dropAreas.forEach(area => {
    area.addEventListener("click", () => {
        let currentRecipe = JSON.parse(localStorage.getItem("selectedRecipe"));

        if (!currentRecipe) {
            alert("Please select a recipe first!");
            return;
        }

        let day = area.dataset.day;
        mealPlan[day] = {
            name: currentRecipe.strMeal,
            image: currentRecipe.strMealThumb
        };
        savePlan();
        renderPlan();
    });
});

renderPlan();