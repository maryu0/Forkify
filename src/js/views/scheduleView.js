import View from './View';
import previewView from './previewView';
import full from 'core-js/full';

// Importing Calendar
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';

class ScheduleView extends View {
  _parentElement = document.querySelector('.schedule__list');
  _errorMessage = 'No planned meals found!';
  _message = '';

  _containerEl = document.querySelector('.schedule-calendar-window');
  _overlay = document.querySelector('.overlay-schedule');
  _btnOpen = document.querySelector('.nav__btn--schedule-calender');
  _btnClose = document.querySelector('.btn--close-schedule');
  _calendarEl = document.getElementById('calendar');

  _btnClearList = document.querySelector('.schedules__btn__clear');

  constructor() {
    super();

    this._addHandlerShowWindow();
    this._addHandlerCloseWindow();
  }

  _generateMarkup() {
    return this._data
      .map(schedule => previewView.render(schedule, false))
      .join('');
  }

  addHandlerRender(handler) {
    window.addEventListener('load', handler);
  }

  addHandlerClearList(handler) {
    this._btnClearList.addEventListener('click', handler);
  }

  _toggleWindow() {
    this._overlay.classList.toggle('hidden');
    this._containerEl.classList.toggle('hidden');
  }

  _closeWindow() {
    this._overlay.classList.add('hidden');
    this._containerEl.classList.add('hidden');
  }

  _addHandlerShowWindow() {
    this._btnOpen.addEventListener('click', this._toggleWindow.bind(this));
  }

  _addHandlerCloseWindow() {
    this._btnClose.addEventListener('click', this._closeWindow.bind(this));
    this._overlay.addEventListener('click', this._closeWindow.bind(this));
  }

  // Rendering the calendar
  renderCalendar(
    onDropHandler,
    onEventChangeHandler,
    onRemoveEventHandler,
    storedEvents,
  ) {
    let draggable = new Draggable(this._containerEl, {
      itemSelector: '.draggable_el',
      eventData: function (eventEl) {
        return {
          title: eventEl.innerText,
        };
      },
    });

    let calendar = new Calendar(this._calendarEl, {
      plugins: [dayGridPlugin, listPlugin, interactionPlugin],
      timeZone: 'UTC',
      customButtons: {
        deleteAllEvents: {
          text: 'Delete All Events',
          click: function () {
            const events = calendar.getEvents();
            events.forEach(event => event.remove());

            onRemoveEventHandler('events');
          },
        },
      },
      initialView: 'dayGridWeek',
      headerToolbar: {
        left: 'prev, next today',
        center: 'title',
        right: 'dayGridWeek, listWeek',
      },
      footerToolbar: {
        right: 'deleteAllEvents',
      },

      businessHours: true,
      firstDay: 1,
      allDayContent: false,
      droppable: true,
      editable: true,
      eventDurationEditable: false,
      fixedMirrorParent: document.body,
      events: storedEvents,

      drop: function (info) {
        onDropHandler(info);
      },

      eventChange: function (info) {
        onEventChangeHandler(info);
      },

      eventReceive: function (info) {
        info.event.setExtendedProp(
          'url',
          `${info.draggedEl.children[0].attributes[1].value}`,
        );
      },

      eventClick: function (info) {
        window.open(
          `${window.location.origin}${info.event.extendedProps.url}`,
          '_self',
        );
      },
    });

    calendar.render();
  }
}

export default new ScheduleView();
