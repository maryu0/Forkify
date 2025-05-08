import View from './View';
import icons from 'url:../../img/icons.svg'; // Parcel 2

class AddRecipeView extends View {
  _parentElement = document.querySelector('.upload');
  _message = 'Recipe was successfully uploaded :)';

  _window = document.querySelector('.add-recipe-window');
  _overlay = document.querySelector('.overlay');
  _btnOpen = document.querySelector('.nav__btn--add-recipe');
  _btnClose = document.querySelector('.btn--close-modal');

  constructor() {
    super();
    this._addHandlerShowWindow();
    this._addHandlerHideWindow();
  }

  toggleWindow() {
    this._overlay.classList.toggle('hidden');
    this._window.classList.toggle('hidden');
  }

  _addHandlerShowWindow() {
    this._btnOpen.addEventListener('click', this.toggleWindow.bind(this)); // bind(this) to make sure this keyword points to the class instance and not the DOM element where the event listener is attached to (btnOpen)
  }

  _addHandlerHideWindow() {
    this._btnClose.addEventListener('click', this.toggleWindow.bind(this));
    this._overlay.addEventListener('click', this.toggleWindow.bind(this));
  }

  addHandlerUpload(handler) {
    this._parentElement.addEventListener('submit', function (e) {
      e.preventDefault();
      const dataArr = [...new FormData(this)];
      // FormData is a built-in constructor function to read form data and create a new FormData object from it.
      // FormData returns an array of arrays with the form field names and values
      // ... is the spread operator to convert the array of arrays into an array of objects.
      const data = Object.fromEntries(dataArr); // Object.fromEntries converts an array of key-value pairs into an object.
      handler(data);
    });
  }

  _generateMarkup() {}
}

export default new AddRecipeView();
