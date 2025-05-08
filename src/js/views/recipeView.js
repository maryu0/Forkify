import view from './View';

import icons from 'url:../../img/icons.svg'; // Parcel 2
import fracty from 'fracty';
import View from './View';
import Chart from 'chart.js/auto';

class RecipeView extends View {
  _parentElement = document.querySelector('.recipe');
  _errorMessage = 'We could not find that recipe. Please try another one!';
  _message = '';

  addHandlerRender(handler) {
    ['hashchange', 'load'].forEach(ev => window.addEventListener(ev, handler));
  }

  _addControlHandler(handler, button) {
    this._parentElement.addEventListener('click', function (e) {
      const btn = e.target.closest(button);
      if (!btn) return;
      handler();
    });
  }

  addHandlerUpdateServings(handler) {
    this._parentElement.addEventListener('click', function (e) {
      const btn = e.target.closest('.btn--update-servings');
      if (!btn) return;
      console.log(btn);
      const updateTo = +btn.dataset.updateTo;
      handler(updateTo);
    });
  }

  addHandlerSchedule(handler) {
    this._addControlHandler(handler, '.btn--schedule');
  }

  addHandlerAddBookmark(handler) {
    this._addControlHandler(handler, '.btn--bookmark');
  }

  addHandlerAddToShop(handler) {
    this._parentElement.addEventListener('click', function (e) {
      const btn = e.target.closest('.btn__add--shop');
      if (!btn) return;

      const html = `
      <span>Added to list</span>
      <svg class="search__icon">
        <use href="${icons}#icon-check"></use>
      </svg>`;

      btn.setAttribute('disabled', 'disabled');
      btn.innerHTML = '';
      btn.insertAdjacentHTML('afterbegin', html);

      // Button will be enabled after 0.5 seconds
      setTimeout(function () {
        const html = `
        <span>Add to shopping list</span>
        <svg class="search__icon">
          <use href="${icons}#icon-plus-circle"></use>
        </svg>`;

        btn.removeAttribute('disabled');
        btn.innerHTML = '';
        btn.insertAdjacentHTML('afterbegin', html);
      }, 500);

      handler();
    });
  }

  _generateMarkup() {
    return `
      <figure class="recipe__fig">
        <img src="${this._data.image}" alt="${this._data.title}" class="recipe__img" />
        <h1 class="recipe__title">
          <span>${this._data.title}</span>
        </h1>
      </figure>
      <div class="recipe__details">
        <div class="recipe__info">
          <svg class="recipe__info-icon">
            <use href="${icons}#icon-clock"></use>
          </svg>
          <span class="recipe__info-data recipe__info-data--minutes">${this._data.cookingTime}</span>
          <span class="recipe__info-text">minutes</span>
        </div>
        <div class="recipe__info">
          <svg class="recipe__info-icon">
            <use href="${icons}#icon-users"></use>
          </svg>
          <span class="recipe__info-data recipe__info-data--people">${this._data.servings}</span>
          <span class="recipe__info-text">servings</span>

          <div class="recipe__info-buttons">
            <button class="btn--tiny btn--update-servings" data-update-to="${this._data.servings - 1}">
              <svg>
                <use href="${icons}#icon-minus-circle"></use>
              </svg>
            </button>
            <button class="btn--tiny btn--update-servings" data-update-to="${this._data.servings + 1}">
              <svg>
                <use href="${icons}#icon-plus-circle"></use>
              </svg>
            </button>
          </div>
        </div>

        <div class="recipe__user-generated ${this._data.key ? '' : 'hidden'}">
          <svg>
            <use href="${icons}#icon-user"></use>
          </svg>
        </div>
        <button class="btn--round btn--schedule">
          <svg>
            <use href="${icons}#icon-calendar${this._data.scheduled ? '-fill' : '-white'}"></use>
          </svg>
        </button>
        <button class="btn--round btn--bookmark">
          <svg>
            <use href="${icons}#icon-bookmark${this._data.bookmarked ? '-fill' : ''}"></use>
          </svg>
        </button>
      </div>

      <div class="recipe__ingredients">
        <h2 class="heading--2">Recipe ingredients</h2>
        <ul class="recipe__ingredient-list">
          ${this._data.ingredients.map(this._generateMarkupIngredient).join('')}
        </ul>
        <button class="btn--small recipe__btn btn__add--shop">
          <span>Add to shopping list</span>
          <svg class="search__icon">
            <use href="${icons}#icon-plus-circle"></use>
          </svg>
        </button>
      </div>

      ${this._generateMarkupNutrition()}

      <div class="recipe__directions">
        <h2 class="heading--2">How to cook it</h2>
        <p class="recipe__directions-text">
          This recipe was carefully designed and tested by
          <span class="recipe__publisher">${this._data.publisher}</span>. Please check out
          directions at their website.
        </p>
        <a class="btn--small recipe__btn" href="${this._data.sourceUrl}" target="_blank">
          <span>Directions</span>
          <svg class="search__icon">
            <use href="${icons}#icon-arrow-right"></use>
          </svg>
        </a>
      </div>
    `;
  }

  _generateMarkupIngredient(ing) {
    return `
      <li class="recipe__ingredient">
        <svg class="recipe__icon">
          <use href="${icons}#icon-check"></use>
        </svg>
        <div class="recipe__quantity">${
          ing.quantity ? fracty(ing.quantity).toString() : ''
        }</div>
        <div class="recipe__description">
          <span class="recipe__unit">${ing.unit}</span>
          ${ing.description}
        </div>
      </li>
    `;
  }

  _generateMarkupNutrition() {
    const { nutrition } = this._data;

    // If no nutrition or breakdown exists, return an empty string or fallback UI
    if (!nutrition || !nutrition.caloricBreakdown) {
      return `<div class="recipe__nutrition"><p>No nutrition data available.</p></div>`;
    }

    const { percentCarbs, percentFat, percentProtein } =
      nutrition.caloricBreakdown;

    return `
    <div class="recipe__nutrition">
      <h2 class="heading--2">Nutrition Data</h2>
      <div class="nutrition__data">
        <canvas id="nutrition_chart"></canvas>
        <div class="nutrition__quantity">
          <p class="calories__text">Calories:</p>
          <span class="calories__data">${nutrition.calories}</span>
          <hr>
          <p>Carbs: <span>${nutrition.carbs} - ${percentCarbs}%</span></p>
          <p>Fat: <span>${nutrition.fat} - ${percentFat}%</span></p>
          <p>Protein: <span>${nutrition.protein} - ${percentProtein}%</span></p>
        </div>
      </div>
    </div>`;
  }

  // putting all nutritional data into a chart
  generateNutritionChart(recipeNutrition) {
    const _canvas = document.getElementById('nutrition_chart');

    // Get rid of error reusing canvas
    if (Chart.getChart(_canvas)) Chart.getChart(_canvas).destroy();

    const chart = new Chart(_canvas, {
      type: 'doughnut',
      data: {
        labels: ['Carbs', 'Fat', 'Protein'],
        datasets: [
          {
            label: 'Nutrition Breakdown',
            data: [
              recipeNutrition.caloricBreakdown.percentCarbs,
              recipeNutrition.caloricBreakdown.percentFat,
              recipeNutrition.caloricBreakdown.percentProtein,
            ],
            backgroundColor: ['#d3c7c3', '#f48982', '#fbdb89'],
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
      },
    });
  }
}

export default new RecipeView();
