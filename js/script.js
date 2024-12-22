document.addEventListener('DOMContentLoaded', function() {
    const taskInput = document.getElementById('task-input');
    const taskDay = document.getElementById('taskDay');
    const taskHour = document.getElementById('taskHour');
    const taskMinute = document.getElementById('taskMinute');
    const addBtn = document.getElementById('add-task-button');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const clearAllBtn = document.getElementById('clear-all');
    const taskList = document.getElementById('task-list');
    const themeToggle = document.getElementById('theme-toggle');
    const notificationContainer = document.getElementById('notificationContainer');
    const progressBar = document.getElementById('progress-bar');
    const totalTasksElement = document.getElementById('total-tasks');
    const completedTasksElement = document.getElementById('completed-tasks');
    const currentDateElement = document.getElementById('current-date');
    const proTitle = document.getElementById('pro-badge');
    const upgradeBtn = document.getElementById('upgrade-btn');
    const MAX_FREE_TASKS = 5;
    const isPro = localStorage.getItem('isPro') === 'true';

    for (let i = 0; i < 24; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i.toString().padStart(2, '0');
        taskHour.appendChild(option);
    }

    for (let i = 0; i < 60; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i.toString().padStart(2, '0');
        taskMinute.appendChild(option);
    }

    function updateDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateElement.textContent = new Date().toLocaleDateString('en-US', options);
    }
    updateDate();

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    themeToggle.addEventListener('click', () => {
        const html = document.documentElement;
        const isDark = html.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        const icon = themeToggle.querySelector('i');
        icon.className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
        localStorage.setItem('theme', newTheme);
    });

    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeIcon = themeToggle.querySelector('i');
    themeIcon.className = savedTheme === 'dark' ? 'bi bi-moon-fill' : 'bi bi-sun-fill';

    function updateProStatus() {
        if (isPro) {
            proTitle.classList.remove('d-none');
            upgradeBtn.classList.add('d-none');
            document.title = 'Task Manager Pro';
        } else {
            proTitle.classList.add('d-none');
            upgradeBtn.classList.remove('d-none');
            document.title = 'Task Manager';
        }
        checkTaskLimit();
    }

    function checkTaskLimit() {
        const taskLimitWarning = document.getElementById('task-limit-warning');
        if (!isPro && tasks.length >= MAX_FREE_TASKS) {
            taskLimitWarning.classList.remove('d-none');
            taskInput.disabled = true;
            addBtn.disabled = true;
            taskDay.disabled = true;
            taskHour.disabled = true;
            taskMinute.disabled = true;
        } else {
            taskLimitWarning.classList.add('d-none');
            taskInput.disabled = false;
            addBtn.disabled = false;
            taskDay.disabled = false;
            taskHour.disabled = false;
            taskMinute.disabled = false;
        }
    }

    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'upgrade.html';
        });
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateTaskStats();
        updateProgress();
        checkTaskLimit();
    }

    function updateTaskStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        totalTasksElement.textContent = total;
        completedTasksElement.textContent = completed;
    }

    function updateProgress() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('aria-valuenow', percentage);
    }

    function createNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="bi ${type === 'info' ? 'bi-info-circle' : 'bi-bell'}"></i>
            <span>${message}</span>
        `;

        notificationContainer.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    function getNextDayTime(day, hour, minute) {
        const now = new Date();
        const targetDay = parseInt(day);
        const targetHour = parseInt(hour);
        const targetMinute = parseInt(minute);
        
        let resultDate = new Date();
        resultDate.setHours(targetHour, targetMinute, 0);

        if (now.getDay() > targetDay || 
            (now.getDay() === targetDay && 
             (now.getHours() > targetHour || 
              (now.getHours() === targetHour && now.getMinutes() >= targetMinute)))) {
            resultDate.setDate(resultDate.getDate() + (7 - now.getDay() + targetDay));
        } else {
            resultDate.setDate(resultDate.getDate() + (targetDay - now.getDay()));
        }

        return resultDate;
    }

    function checkTaskReminders() {
        const now = new Date();
        tasks.forEach(task => {
            if (!task.notified && !task.completed) {
                const taskDateTime = new Date(task.datetime);
                const timeDiff = taskDateTime.getTime() - now.getTime();
                
                if (timeDiff > 0 && timeDiff <= 300000) {
                    createNotification(`Reminder: "${task.text}" is due in 5 minutes!`, 'warning');
                    task.notified = true;
                    saveTasks();
                }
            }
        });
    }

    setInterval(checkTaskReminders, 60000);

    function addTask(text, day, hour, minute) {
        if (!isPro && tasks.length >= MAX_FREE_TASKS) {
            createNotification('Free version is limited to 5 tasks. Please upgrade to Pro!', 'warning');
            return;
        }

        const datetime = getNextDayTime(day, hour, minute);
        
        const task = {
            id: Date.now(),
            text,
            day,
            hour,
            minute,
            datetime: datetime.toISOString(),
            completed: false,
            notified: false
        };

        tasks.unshift(task);
        saveTasks();
        renderTasks();
        createNotification('Task added successfully!');
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        createNotification('Task deleted!');
    }

    function toggleTask(id) {
        const task = tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
            createNotification(`Task marked as ${task.completed ? 'completed' : 'pending'}`);
        }
    }

    function getDayName(dayNumber) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayNumber];
    }

    function renderTasks() {
        taskList.innerHTML = '';
        
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `list-group-item task-item d-flex align-items-center ${task.completed ? 'completed' : ''}`;
            
            const taskTime = `${getDayName(task.day)} at ${task.hour.toString().padStart(2, '0')}:${task.minute.toString().padStart(2, '0')}`;

            li.innerHTML = `
                <div class="task-text">${task.text}</div>
                <div class="task-date me-2">${taskTime}</div>
                <div class="task-actions">
                    <button class="btn btn-outline-success complete-task btn-sm" title="Toggle Complete">
                        <i class="bi ${task.completed ? 'bi-check-circle-fill' : 'bi-check-circle'}"></i>
                    </button>
                    <button class="btn btn-outline-danger delete-task btn-sm" title="Delete Task">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;

            const completeButton = li.querySelector('.complete-task');
            const deleteButton = li.querySelector('.delete-task');

            completeButton.addEventListener('click', () => toggleTask(task.id));
            deleteButton.addEventListener('click', () => deleteTask(task.id));

            taskList.appendChild(li);
        });

        updateTaskStats();
        updateProgress();
    }

    addBtn.addEventListener('click', function() {
        const text = taskInput.value.trim();
        const now = new Date();
        const day = taskDay.value || now.getDay().toString(); 
        const hour = taskHour.value || now.getHours().toString();
        const minute = taskMinute.value || now.getMinutes().toString();

        if (text) {
            addTask(text, day, hour, minute);
            taskInput.value = '';
            taskDay.selectedIndex = 0;
            taskHour.selectedIndex = 0;
            taskMinute.selectedIndex = 0;
        } else {
            createNotification('Please enter a task!', 'warning');
        }
    });

    clearCompletedBtn.addEventListener('click', function() {
        if (tasks.some(task => task.completed)) {
            if (confirm('Are you sure you want to clear all completed tasks?')) {
                tasks = tasks.filter(task => !task.completed);
                saveTasks();
                renderTasks();
                createNotification('Completed tasks cleared!');
            }
        }
    });

    clearAllBtn.addEventListener('click', function() {
        if (tasks.length > 0) {
            if (confirm('Are you sure you want to clear all tasks?')) {
                tasks = [];
                saveTasks();
                renderTasks();
                createNotification('All tasks cleared!');
            }
        }
    });
    // Initial checks
    updateProStatus();
    checkTaskLimit();
    renderTasks();
}); 