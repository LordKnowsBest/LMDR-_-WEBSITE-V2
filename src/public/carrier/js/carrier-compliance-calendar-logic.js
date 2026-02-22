var ComplianceCalendarLogic = (function () {
  'use strict';

  var currentDate = new Date();
  var events = [];
  var stats = { overdue: 0, dueSoon: 0, upcoming: 0, score: 0 };
  var dataReceived = false;
  var DATA_TIMEOUT_MS = 5000;

  var calendarGrid, currentMonthLabel, priorityList, complianceScore, scoreBar, modal;

  function cacheDOM() {
    calendarGrid = document.getElementById('calendarGrid');
    currentMonthLabel = document.getElementById('currentMonthLabel');
    priorityList = document.getElementById('priorityList');
    complianceScore = document.getElementById('complianceScore');
    scoreBar = document.getElementById('scoreBar');
    modal = document.getElementById('addEventModal');
  }

  function render() {
    renderHeader();
    renderStats();
    renderCalendar();
    renderPriorityList();
  }

  function renderHeader() {
    var options = { month: 'long', year: 'numeric' };
    currentMonthLabel.textContent = currentDate.toLocaleDateString('en-US', options);
  }

  function renderStats() {
    document.getElementById('statOverdue').textContent = stats.overdue;
    document.getElementById('statDueSoon').textContent = stats.dueSoon;
    document.getElementById('statUpcoming').textContent = stats.upcoming;
    var score = stats.score || 0;
    complianceScore.textContent = score + '%';
    scoreBar.style.width = score + '%';
    var color = 'bg-green-500';
    var label = 'Excellent Standing';
    if (score < 70) { color = 'bg-red-500'; label = 'Action Required'; }
    else if (score < 90) { color = 'bg-yellow-500'; label = 'Good Standing'; }
    scoreBar.className = 'h-2.5 rounded-full ' + color;
    document.getElementById('scoreLabel').textContent = label;
  }

  function renderCalendar() {
    calendarGrid.innerHTML = '';
    var year = currentDate.getFullYear();
    var month = currentDate.getMonth();
    var firstDay = new Date(year, month, 1);
    var lastDay = new Date(year, month + 1, 0);
    var daysInMonth = lastDay.getDate();
    var startingDay = firstDay.getDay();

    for (var i = 0; i < startingDay; i++) {
      var cell = document.createElement('div');
      cell.className = 'calendar-cell bg-gray-50 text-gray-300';
      calendarGrid.appendChild(cell);
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var dayCell = document.createElement('div');
      dayCell.className = 'calendar-cell hover:bg-blue-50 transition-colors';
      var dateNum = document.createElement('div');
      dateNum.className = 'text-xs font-bold text-slate-500 mb-1';
      dateNum.textContent = day;
      var today = new Date();
      if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
        dateNum.className = 'text-xs font-bold text-white bg-lmdr-blue rounded-full w-5 h-5 flex items-center justify-center mb-1';
      }
      dayCell.appendChild(dateNum);

      var dayEvents = events.filter(function (e) {
        if (!e.due_date) return false;
        var d = new Date(e.due_date);
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
      });

      dayEvents.forEach(function (evt) {
        var pill = document.createElement('div');
        var statusClass = 'bg-gray-100 text-gray-600 border-l-2 border-gray-400';
        if (evt.status === 'overdue') statusClass = 'event-overdue';
        else if (evt.status === 'due_soon') statusClass = 'event-due-soon';
        else if (evt.status === 'upcoming') statusClass = 'event-upcoming';
        else if (evt.status === 'completed') statusClass = 'event-completed';
        pill.className = 'event-pill ' + statusClass;
        pill.textContent = evt.title;
        pill.title = evt.title + ' (' + evt.status + ')';
        pill.onclick = function (e) { e.stopPropagation(); viewEvent(evt._id); };
        dayCell.appendChild(pill);
      });

      calendarGrid.appendChild(dayCell);
    }
  }

  function renderPriorityList() {
    priorityList.innerHTML = '';
    var critical = events
      .filter(function (e) { return e.status === 'overdue' || e.status === 'due_soon'; })
      .sort(function (a, b) { return new Date(a.due_date) - new Date(b.due_date); });

    if (critical.length === 0) {
      priorityList.innerHTML = '<div class="text-center py-4 text-slate-400 text-sm">No urgent items. Great job!</div>';
      return;
    }

    critical.slice(0, 5).forEach(function (evt) {
      var div = document.createElement('div');
      div.className = 'p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer flex justify-between items-center';
      var icon = 'fa-circle-exclamation';
      var color = 'text-red-500';
      if (evt.status === 'due_soon') { icon = 'fa-clock'; color = 'text-yellow-500'; }
      var date = new Date(evt.due_date).toLocaleDateString();
      div.innerHTML = '<div class="flex items-center gap-3 overflow-hidden"><i class="fa-solid ' + icon + ' ' + color + '"></i><div class="truncate"><div class="text-sm font-semibold text-slate-800 truncate">' + evt.title + '</div><div class="text-xs text-slate-500">Due: ' + date + '</div></div></div><i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>';
      div.onclick = function () { viewEvent(evt._id); };
      priorityList.appendChild(div);
    });
  }

  function refreshData() {
    var start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    var end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    ComplianceCalendarBridge.sendToVelo('getComplianceData', {
      start: start.toISOString(),
      end: end.toISOString()
    });
  }

  function openAddEventModal() {
    document.getElementById('addEventForm').reset();
    document.getElementById('dueDate').valueAsDate = new Date();
    modal.classList.add('active');
    modal.querySelector('div').classList.remove('scale-95');
    modal.querySelector('div').classList.add('scale-100');
  }

  function closeAddEventModal() {
    modal.classList.remove('active');
    modal.querySelector('div').classList.add('scale-95');
    modal.querySelector('div').classList.remove('scale-100');
  }

  function viewEvent(id) {
    console.log('View event:', id);
    alert('View Event Details: ' + id);
  }

  function showEmptyState() {
    if (dataReceived) return;
    events = [];
    stats = { overdue: 0, dueSoon: 0, upcoming: 0, score: 0 };
    render();
    priorityList.innerHTML = '<div class="flex flex-col items-center justify-center py-10 text-slate-400"><i class="fa-solid fa-calendar-check text-4xl mb-4 text-slate-300"></i><p class="font-medium text-slate-500">No compliance events yet</p><p class="text-sm mt-1">Data will appear once your compliance profile is configured</p></div>';
  }

  function init() {
    cacheDOM();

    ComplianceCalendarBridge.listen({
      setComplianceData: function (data) {
        dataReceived = true;
        events = data.events || [];
        stats = data.summary || stats;
        stats.score = data.score || 0;
        render();
      },
      eventCreated: function () {
        refreshData();
        closeAddEventModal();
      }
    });

    document.getElementById('prevMonthBtn').addEventListener('click', function () {
      currentDate.setMonth(currentDate.getMonth() - 1);
      refreshData();
    });

    document.getElementById('nextMonthBtn').addEventListener('click', function () {
      currentDate.setMonth(currentDate.getMonth() + 1);
      refreshData();
    });

    document.getElementById('addEventForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var formData = new FormData(e.target);
      var data = Object.fromEntries(formData.entries());
      if (data.recurrence && data.recurrence !== 'none') {
        var days = 0;
        if (data.recurrence === 'annual') days = 365;
        if (data.recurrence === 'biennial') days = 730;
        if (data.recurrence === 'quarterly') days = 90;
        data.recurrence = { type: data.recurrence, interval_days: days };
        data.auto_renew = true;
      } else {
        delete data.recurrence;
        data.auto_renew = false;
      }
      ComplianceCalendarBridge.sendToVelo('createComplianceEvent', data);
    });

    refreshData();
    setTimeout(showEmptyState, DATA_TIMEOUT_MS);
    ComplianceCalendarBridge.notifyReady();
  }

  function exposeGlobals() {
    window.refreshData = refreshData;
    window.openAddEventModal = openAddEventModal;
    window.closeAddEventModal = closeAddEventModal;
    window.viewEvent = viewEvent;
  }

  return {
    init: init,
    exposeGlobals: exposeGlobals
  };
})();
