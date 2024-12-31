document.addEventListener('DOMContentLoaded', function() {
    const taskInput = document.getElementById('task-input');
    const modalTaskInput = document.getElementById('modal-task-input');
    const taskDay = document.getElementById('taskDay');
    const taskHour = document.getElementById('taskHour');
    const taskMinute = document.getElementById('taskMinute');
    const quickAddBtn = document.getElementById('quick-add-btn');
    const addTaskBtn = document.getElementById('add-task-button');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const taskList = document.getElementById('task-list');
    const themeToggle = document.getElementById('theme-toggle');
    const notificationContainer = document.getElementById('notificationContainer');
    const totalTasksElement = document.getElementById('total-tasks');
    const completedTasksElement = document.getElementById('completed-tasks');
    const pendingTasksElement = document.getElementById('pending-tasks');
    const currentDateElement = document.getElementById('current-date');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const taskModal = new bootstrap.Modal(document.getElementById('taskDetailsModal'));
    
    let currentFilter = 'all';
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // Initialize time selectors
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

    // Theme toggling
    themeToggle.addEventListener('click', () => {
        const html = document.documentElement;
        const isDark = html.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        const icon = themeToggle.querySelector('i');
        icon.className = newTheme === 'dark' ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
        localStorage.setItem('theme', newTheme);
    });

    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeIcon = themeToggle.querySelector('i');
    themeIcon.className = savedTheme === 'dark' ? 'bi bi-moon-fill' : 'bi bi-sun-fill';

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateTaskStats();
    }

    function updateTaskStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;
        
        totalTasksElement.textContent = total;
        completedTasksElement.textContent = completed;
        pendingTasksElement.textContent = pending;

        if (total === 0) {
            taskList.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-clipboard-check" style="font-size: 2rem; color: var(--text-secondary);"></i>
                    <p class="mt-2" style="color: var(--text-secondary);">No tasks yet. Add one to get started!</p>
                </div>
            `;
        }
    }

    function createNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <i class="bi ${type === 'success' ? 'bi-check-circle' : type === 'warning' ? 'bi-exclamation-circle' : 'bi-info-circle'}" 
               style="color: ${type === 'success' ? 'var(--success-color)' : type === 'warning' ? 'var(--warning-color)' : 'var(--primary-color)'}">
            </i>
            <span>${message}</span>
        `;

        notificationContainer.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
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

    function addTask(text, day = null, hour = null, minute = null) {
        if (!text.trim()) return;

        const task = {
            id: Date.now(),
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };

        if (day !== null && hour !== null && minute !== null) {
            task.datetime = getNextDayTime(day, hour, minute).toISOString();
        }

        tasks.unshift(task);
        saveTasks();
        renderTasks();
        createNotification('Task added successfully!', 'success');
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        createNotification('Task deleted');
    }

    function toggleTask(id) {
        const task = tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
            createNotification(`Task marked as ${task.completed ? 'completed' : 'pending'}`, 'success');
        }
    }

    function formatDateTime(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const isToday = date.toDateString() === today.toDateString();
        const isTomorrow = date.toDateString() === tomorrow.toDateString();

        const time = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });

        if (isToday) return `Today at ${time}`;
        if (isTomorrow) return `Tomorrow at ${time}`;

        return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    function renderTasks() {
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'completed') return task.completed;
            if (currentFilter === 'pending') return !task.completed;
            return true;
        });

        if (filteredTasks.length === 0) {
            taskList.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-clipboard-check" style="font-size: 2rem; color: var(--text-secondary);"></i>
                    <p class="mt-2" style="color: var(--text-secondary);">
                        ${currentFilter === 'all' 
                            ? 'No tasks yet. Add one to get started!' 
                            : `No ${currentFilter} tasks found.`}
                    </p>
                </div>
            `;
            return;
        }

        taskList.innerHTML = filteredTasks.map(task => `
            <div class="task-item" data-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'completed' : ''}" onclick="toggleTask(${task.id})">
                    <i class="bi ${task.completed ? 'bi-check-lg' : ''}"></i>
                </div>
                <div class="task-content">
                    <p class="task-text">${task.text}</p>
                    ${task.datetime ? `
                        <div class="task-time">
                            <i class="bi bi-clock me-1"></i>${formatDateTime(task.datetime)}
                        </div>
                    ` : ''}
                </div>
                <div class="task-actions">
                    <button class="task-btn" onclick="deleteTask(${task.id})" title="Delete task">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Event Listeners
    quickAddBtn.addEventListener('click', () => {
        const text = taskInput.value;
        if (text.trim()) {
            addTask(text);
            taskInput.value = '';
        }
    });

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const text = taskInput.value;
            if (text.trim()) {
                addTask(text);
                taskInput.value = '';
            }
        }
    });

    addTaskBtn.addEventListener('click', () => {
        const text = modalTaskInput.value;
        if (text.trim()) {
            addTask(text, taskDay.value, taskHour.value, taskMinute.value);
            modalTaskInput.value = '';
            taskModal.hide();
        }
    });

    clearCompletedBtn.addEventListener('click', () => {
        const completedCount = tasks.filter(task => task.completed).length;
        if (completedCount === 0) {
            createNotification('No completed tasks to clear', 'warning');
            return;
        }
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        createNotification('Completed tasks cleared');
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // Make functions available globally
    window.toggleTask = toggleTask;
    window.deleteTask = deleteTask;

    // Initial render
    renderTasks();
}); 