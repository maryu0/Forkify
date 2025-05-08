import { LineController } from 'chart.js';
import { async } from 'regenerator-runtime';
import {
  API_URL,
  SPOONACULAR_API_URL,
  RES_PER_PAGE,
  MAX_SERVINGS,
  KEY,
  SPOONACULAR_API_KEY,
} from './config';
// import { getJSON, sendJSON } from './helpers';
import { AJAX } from './helper';

export const state = {
  recipe: {},
  search: {
    query: '',
    results: [],
    page: 1,
    // resultsPerPage: 10, // This looks like a magic no -> a no that appears to come out of nowhere--> so we set it in our configuration
    resultsPerPage: RES_PER_PAGE,
    results: [],
  },
  bookmarks: [],
  ingredientsList: [],
  schedules: [],
  events: [],
};

const createRecipeObject = function (data) {
  const { recipe } = data.data;
  return {
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.publisher,
    sourceUrl: recipe.source_url,
    image: recipe.image_url,
    servings: recipe.servings,
    cookingTime: recipe.cooking_time,
    ingredients: recipe.ingredients,
    ...(recipe.key && { key: recipe.key }),
  };
};

export const loadRecipe = async function (id) {
  try {
    // Fetching recipe data from API
    const data = await AJAX(`${API_URL}${id}?key=${KEY}`);
    state.recipe = createRecipeObject(data);

    // check if recipe is bookmarked
    if (state.bookmarks.some(bookmarks => bookmarks.id === id))
      state.recipe.bookmarked = true;
    else state.recipe.bookmarked = false;

    // check if recipe is scheduled
    if (state.schedules.some(schedules => schedules.id === id))
      state.recipe.scheduled = true;
    else state.recipe.scheduled = false;
  } catch (err) {
    // Temp error handling
    console.error(`${err}💥💥💥`);
    throw err;
  }
};

export const loadSearchResults = async function (query) {
  try {
    state.search.query = query;
    const data = await AJAX(`${API_URL}?search=${query}&key=${KEY}`);
    console.log(data);

    state.search.results = data.data.recipes.map(rec => {
      return {
        id: rec.id,
        title: rec.title,
        publisher: rec.publisher,
        image: rec.image_url,
        ...(rec.key && { key: rec.key }),
      };
    });
    state.search.page = 1;
  } catch (err) {
    console.error(`${err}💥💥💥`);
    throw err;
  }
};

export const getSearchResultsPage = function (page = state.search.page) {
  state.search.page = page;

  // Calculating start and end values for each page which contains only 10 results per page
  const start = (page - 1) * state.search.resultsPerPage;
  const end = page * state.search.resultsPerPage;

  return state.search.results.slice(start, end);
};

export const updateServings = function (newServings) {
  if (newServings < 1 || newServings > MAX_SERVINGS) return;

  state.recipe.ingredients.forEach(ing => {
    ing.quantity = (ing.quantity * newServings) / state.recipe.servings;
    // new quantity = old quantity * newServings / oldServings // 2 * 8 / 4 = 4
  });

  state.recipe.servings = newServings;
};

const persistBookmarks = function () {
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
};

const persistSchedules = function () {
  localStorage.setItem('schedules', JSON.stringify(state.schedules));
};

const persistIngredients = function () {
  localStorage.setItem(
    'ingredientsList',
    JSON.stringify(state.ingredientsList),
  );
};

export const addBookmark = function (recipe) {
  // Add bookmark
  state.bookmarks.push(recipe);

  // Mark current recipe as bookmarked
  if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;

  persistBookmarks();
};

export const deleteBookmark = function (id) {
  // Delete bookmark
  const index = state.bookmarks.findIndex(el => el.id === id);
  if (index !== -1) state.bookmarks.splice(index, 1);

  // Mark current recipe as NOT bookmarked
  if (id === state.recipe.id) state.recipe.bookmarked = false;

  persistBookmarks();
};

export const addSchedule = function (recipe) {
  state.schedules.push(recipe);

  if (recipe.id === state.recipe.id) state.recipe.scheduled = true;
  persistSchedules();
};

export const deleteSchedule = function (id) {
  const index = state.schedules.findIndex(el => el.id === id);

  state.schedules.splice(index, 1);

  if (id === state.recipe.id) state.recipe.scheduled = false;

  persistSchedules();
};

export const addIngredients = function (ingredients) {
  ingredients.forEach(ing => {
    const existingElement = state.ingredientsList.find(
      el => el.description === ing.description,
    );

    if (existingElement) {
      existingElement.quantity += ing.quantity;
    } else state.ingredientsList.push({ ...ing });
  });

  // Saving to local storage
  persistIngredients();
};

export const deleteIngredient = function (index, lastIndex = 1) {
  state.ingredientsList.splice(index, lastIndex);

  persistIngredients();
};

// Adding new event to 'state' when dropping on calendar
export const addEvent = function (event) {
  const eventID = Date.now().toString();
  const eventHash = eventID.draggedEl.children[0].attributes[1].value;

  state.event.push({
    title: eventID.draggedEl.innerText.trim(),
    id: eventID,
    start: event.start,
    extendedProps: {
      url: eventHash,
    },
  });
};

// updating event when position on calendar is changed
export const updateEvent = function (event) {
  const eventID = event.event.id;
  const index = state.events.findIndex(ev => ev.id === eventID);

  if (index < 0) return;

  const changedEvent = {
    title: event.event.title,
    id: eventID,
    start: event.event.start.toISOString().spilt('T')[0],
  };

  state.events[index] = changedEvent;

  // Saving to local storage
  controlLocalStorage(state.events, 'events');
};

// Remove schedules from calendar
export const clearAllSchedules = function () {
  state.schedules = [];

  persistSchedules();
};

export const getEvents = function () {
  return state.events;
};

export const uploadRecipe = async function (newRecipe) {
  try {
    const ingredients = Object.entries(newRecipe)
      .filter(entry => {
        return (
          entry[0].startsWith('ingredient') &&
          (entry[0].includes('_quantity') ||
            entry[0].includes('_unit') ||
            entry[0].includes('_description')) &&
          entry[1] !== ''
        );
      })
      .reduce((acc, key) => {
        const match = key[0].match(
          /ingredient(-\d+)(_quantity|_unit|_description)/,
        );

        const index = match[1].replace('-', '') - 1;
        const type = match[2].replace('_', '');

        if (!acc[index])
          acc[index] = { quantity: null, unit: '', description: '' };

        acc[index][type] = key[1];

        return acc;
      }, []);

    const recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      publisher: newRecipe.publisher,
      cooking_time: +newRecipe.cookingTime,
      servings: +newRecipe.servings,
      ingredients,
    };

    const data = await AJAX(`${API_URL}?key=${KEY}`, recipe);
    state.recipe = createRecipeObject(data);
    addBookmark(state.recipe);
  } catch (err) {
    throw err;
  }
};

export const recipeNutritionData = async function (query) {
  try {
    // getting recipe id
    const recipeID = await AJAX(
      `${SPOONACULAR_API_URL}recipes/complexSearch?query=${query}&number=1&includeNutrition=true&apiKey=${SPOONACULAR_API_KEY}`,
    );

    const id = recipeID.results[0].id;

    const productData = await AJAX(
      `${SPOONACULAR_API_URL}recipes/${id}/nutritionWidget.json?apiKey=${SPOONACULAR_API_KEY}`,
    );

    const nutritionData = {
      calories: productData.calories,
      carbs: productData.carbs,
      fat: productData.fat,
      protein: productData.protein,
      caloricBreakdown: {
        percentCarbs: productData.caloricBreakdown.percentCarbs,
        percentFat: productData.caloricBreakdown.percentFat,
        percentProtein: productData.caloricBreakdown.percentProtein,
      },
    };

    state.recipe.nutrition = nutritionData;
  } catch (err) {
    console.log(err.message);
  }
};

export const controlLocalStorage = function (path, storageItem) {
  if (!path) return;
  localStorage.setItem(storageItem, JSON.stringify(path));
};

export const removeStorage = function (item) {
  localStorage.removeItem(item);
};

const init = function () {
  const storageBookmarks = localStorage.getItem('bookmarks');
  const storageIngredients = localStorage.getItem('ingredients');
  const storageSchedules = localStorage.getItem('schedules');
  const storageEvents = localStorage.getItem('events');

  if (storageBookmarks) state.bookmarks = JSON.parse(storageBookmarks);
  if (storageIngredients)
    state.ingredientsList = JSON.parse(storageIngredients);
  if (storageSchedules) state.schedules = JSON.parse(storageSchedules);
  if (storageEvents) state.events = JSON.parse(storageEvents);
};

init();
