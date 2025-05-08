import * as model from './model.js';
import { MODAL_CLOSE_SEC } from './config.js';
import recipeView from './views/recipeView.js';
import searchView from './views/searchView.js';
import resultsView from './views/resultsView.js';
import paginationView from './views/paginationView.js';
import bookmarksView from './views/bookmarksView.js';
import addRecipeView from './views/addRecipeView.js';
import shoppingListView from './views/shoppingListView.js';
import scheduleView from './views/scheduleView.js';

import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { async } from 'regenerator-runtime';

if (module.hot) {
  module.hot.accept();
}

const controlRecipes = async function () {
  try {
    const id = window.location.hash.slice(1);

    if (!id) return;
    recipeView.renderSpinner();

    //1) Update results view to mark selected search result
    resultsView.update(model.getSearchResultsPage());

    //2) Updating bookmarks view
    bookmarksView.update(model.state.bookmarks);

    //3) Loading recipes
    await model.loadRecipe(id);

    //4) Updating schedule view
    scheduleView.update(model.state.schedules);

    //5) Getting nutritional data of the recipe
    await model.recipeNutritionData(model.state.recipe.title.split(' ')[0]);

    //6) Rendering recipe
    recipeView.render(model.state.recipe);

    //7) Rendering chart
    try {
      recipeView.generateNutritionChart(model.state.recipe.nutrition);
    } catch (error) {
      console.log(error);
    }
  } catch (err) {
    recipeView.renderError();
    console.error(err);
  }
};

const controlSearchResults = async function () {
  try {
    resultsView.renderSpinner();

    //1) Get search query
    const query = searchView.getQuery();
    if (!query) return;

    //2) Load search results
    await model.loadSearchResults(query);

    //3) Render results
    resultsView.render(model.getSearchResultsPage());

    //4) Render initial Pagination buttons
    paginationView.render(model.state.search);
  } catch (err) {
    console.log(err);
    resultsView.renderError();
  }
};

const controlPagination = function (goToPage) {
  // 1) Render NEW results
  resultsView.render(model.getSearchResultsPage(goToPage));

  //2) Render NEW pagination buttons
  paginationView.render(model.state.search);
};

const controlServings = function (newServings) {
  // Update the recipe servings (in state)
  model.updateServings(newServings);

  // Update the recipe view
  recipeView.update(model.state.recipe);
};

const controlAddBookmark = function () {
  //1) Add/Remove bookmarks
  if (!model.state.recipe.bookmarked) model.addBookmark(model.state.recipe);
  else model.deleteBookmark(model.state.recipe.id);

  // 2) Update recipe view
  recipeView.update(model.state.recipe);

  // 3) Render bookmarks
  bookmarksView.render(model.state.bookmarks);
};

const controlBookmarksStorage = function () {
  bookmarksView.render(model.state.bookmarks);
};

const controlSchedules = function () {
  if (!model.state.recipe.scheduled) model.addSchedule(model.state.recipe);
  else model.deleteSchedule(model.state.recipe.id);

  recipeView.update(model.state.recipe);
  scheduleView.render(model.state.schedules);
};

const controlClearScheduleList = function () {
  scheduleView.renderError();
  model.clearAllSchedules();
};

const controlSchedulesStorage = function () {
  scheduleView.render(model.state.schedules);
};

const controlCalendarDrop = function (event) {
  const eventID = event.draggedEl.children[0].attributes[1].value.slice(1);

  model.addEvent(event);
  event.draggedEl.parentNode.removeChild(event.draggedEl);

  model.deleteSchedule(eventID);

  // Saving the event to local storage
  model.controlLocalStorage(model.state.events, 'events');
};

const controlEventChange = function (event) {
  model.updateEvent(event);
};

const controlAddRecipe = async function (newRecipe) {
  try {
    // Show loading spinner
    addRecipeView.renderSpinner();

    // Upload new recipe data
    await model.uploadRecipe(newRecipe);

    // Render recipe
    recipeView.render(model.state.recipe);

    // Success message
    addRecipeView.renderMessage();

    // Render bookmark view
    bookmarksView.render(model.state.bookmarks);

    // Change ID in URL
    window.history.pushState(null, '', `#${model.state.recipe.id}`);

    // Close form window
    setTimeout(function () {
      addRecipeView.toggleWindow();
    }, MODAL_CLOSE_SEC * 1000);
  } catch (err) {
    addRecipeView.renderError(err.message);
  }
};

const controlShopList = function () {
  model.addIngredients(model.state.recipe.ingredients);
  shoppingListView.render(model.state.ingredientsList);
};

const deleteShopListElement = function (index, length) {
  model.deleteIngredient(index);

  if (length === 0) shoppingListView.renderMessage();
};

const deleteAllShopList = function () {
  model.deleteIngredient(0, model.state.ingredientsList.length);

  shoppingListView.renderMessage();
};

const controlIngredientStorage = function () {
  shoppingListView.render(model.state.ingredientsList);

  shoppingListView.addHandlerClearList(deleteAllShopList);
};

const removeLocalStorageItem = function (item) {
  model.removeStorage(item);
};

const controlCalendarEventsStorage = function () {
  scheduleView.renderCalendar(
    controlCalendarDrop,
    controlEventChange,
    removeLocalStorageItem,
    model.state.events,
  );
};

const init = function () {
  bookmarksView.addHandlerRender(controlRecipes);
  recipeView.addHandlerRender(controlRecipes);
  recipeView.addHandlerUpdateServings(controlServings);
  recipeView.addHandlerAddBookmark(controlAddBookmark);
  recipeView.addHandlerSchedule(controlSchedules);
  searchView.addHandlerSearch(controlSearchResults);
  paginationView.addHandlerClick(controlPagination);
  addRecipeView.addHandlerUpload(controlAddRecipe);
  recipeView.addHandlerAddToShop(controlShopList);
  shoppingListView.addHandlerDeleteIngredient(deleteShopListElement);
  shoppingListView.addHandlerRender(controlIngredientStorage);
  scheduleView.addHandlerRender(controlSchedulesStorage);
  scheduleView.addHandlerRender(controlCalendarEventsStorage);
  scheduleView.addHandlerClearList(controlClearScheduleList);
};
init();
