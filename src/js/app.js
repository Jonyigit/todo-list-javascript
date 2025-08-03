const todoForm = document.forms["todo-form"];
const todoInput = todoForm.querySelector("input");
const themeToggle = document.querySelector(".top-bar__btn");
const themeIcon = themeToggle.querySelector("img");
const todoList = document.querySelector(".todo-list");
const todoBody = document.querySelector(".todo-app__body");
const todoCopyright = document.querySelector(".todo-copyright");
const itemCount = document.querySelector(".todo-footer__count");
const bodyEl = document.body;

function setTheme() {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        bodyEl.classList.add("dark-mode");
        themeIcon.src = "./src/assets/icons/sun.svg";
        themeIcon.alt = "sun icon";
    }

    themeToggle.addEventListener("click", () => {
        const isDark = bodyEl.classList.toggle("dark-mode");
        themeIcon.src = isDark ? "./src/assets/icons/sun.svg" : "./src/assets/icons/moon.svg";
        themeIcon.alt = isDark ? "sun icon" : "moon icon";
        localStorage.setItem("theme", isDark ? "dark" : "light");
    });
}

function getTodosFromStorage() {
    return JSON.parse(localStorage.getItem("todos") || "[]");
}

function saveTodosToStorage(todos) {
    localStorage.setItem("todos", JSON.stringify(todos));
}

function handleAddTodo() {
    const todoText = todoInput.value.trim();
    if (!todoText) {
        showToast("Please fill in the blank", "./src/assets/images/warning.png");
        return;
    }

    const todos = getTodosFromStorage();

    const newTodo = {
        id: Date.now(),
        text: todoText,
        completed: false,
    };

    todos.unshift(newTodo);
    saveTodosToStorage(todos);
    renderTodos(todos);

    todoInput.value = "";
    showToast("New todo added!", "./src/assets/icons/favicon.svg");
}

function deleteTodo() {
    todoList.addEventListener("click", (e) => {
        const deleteBtn = e.target.closest(".todo-list__delete-btn");
        if (deleteBtn) {
            const item = deleteBtn.closest(".todo-list__item");
            const todoId = Number(item.dataset.id);
            const todos = getTodosFromStorage().filter((todo) => todo.id !== todoId);
            saveTodosToStorage(todos);
            renderTodos(todos);
            showToast("Todo was successfully deleted.");
        }
    });
}

function handleCheckboxToggle() {
    todoList.addEventListener("change", (e) => {
        if (e.target.type === "checkbox") {
            const item = e.target.closest(".todo-list__item");
            const todoId = Number(item.dataset.id);
            const todos = getTodosFromStorage().map((todo) => {
                if (todo.id === todoId) {
                    todo.completed = e.target.checked;
                }
                return todo;
            });
            saveTodosToStorage(todos);
            renderTodos(todos);
        }
    });
}

function getCurrentFilter() {
    return document.querySelector(".filter-btn.filter-btn--active")?.dataset.filter || "all";
}

function handleFilterChange(status) {
    const allTodos = document.querySelectorAll(".todo-list__item");

    allTodos.forEach((todo) => {
        const checkbox = todo.querySelector("input[type='checkbox']");
        const isCompleted = checkbox.checked;

        switch (status) {
            case "all":
                todo.style.display = "flex";
                break;
            case "active":
                todo.style.display = !isCompleted ? "flex" : "none";
                break;
            case "completed":
                todo.style.display = isCompleted ? "flex" : "none";
                break;
        }
    });
}

function filterTodos() {
    const filterBtns = document.querySelectorAll(".filter-btn");

    filterBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            filterBtns.forEach((b) => b.classList.remove("filter-btn--active"));
            btn.classList.add("filter-btn--active");

            handleFilterChange(btn.dataset.filter);
        });
    });
}

function clearCompletedTodos() {
    const todos = getTodosFromStorage().filter((todo) => !todo.completed);
    saveTodosToStorage(todos);
    renderTodos(todos);
    showToast("All completed todos removed");
}

function setupClearCompletedHandler() {
    const clearBtn = document.querySelector(".todo-footer__clear-completed");
    clearBtn.addEventListener("click", () => {
        clearCompletedTodos();
    });
}

function showToast(message, iconSrc = "./src/assets/icons/favicon.svg", duration = 3000) {
    const wrapper = document.getElementById("toasterWrapper");

    const toast = document.createElement("div");
    toast.className = "toaster";
    toast.innerHTML = `
        <div class="toaster-content">
            <img src="${iconSrc}" alt="toast icon" />
            <p>${message}</p>
        </div>
    `;

    wrapper.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("hide");
        toast.addEventListener("animationend", () => {
            toast.remove();
        });
    }, duration);
}

function addDragAndDropHandlers(item) {
    item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", item.dataset.id);
        item.classList.add("dragging");
    });

    item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
    });

    item.addEventListener("dragover", (e) => {
        e.preventDefault();
        const dragging = document.querySelector(".dragging");
        if (dragging && dragging !== item) {
            const bounding = item.getBoundingClientRect();
            const offset = e.clientY - bounding.top;
            const middle = bounding.height / 2;
            if (offset > middle) {
                item.after(dragging);
            } else {
                item.before(dragging);
            }
        }
    });

    item.addEventListener("drop", (e) => {
        e.preventDefault();
        updateTodoOrderFromDOM();
    });
}

function updateTodoOrderFromDOM() {
    const newOrder = Array.from(todoList.children).map((item) => Number(item.dataset.id));
    const todos = getTodosFromStorage();
    const sortedTodos = newOrder.map((id) => todos.find((todo) => todo.id === id));
    saveTodosToStorage(sortedTodos);
}

function renderTodos(todos) {
    todoList.innerHTML = "";

    todos.forEach((todo) => {
        const li = document.createElement("li");
        li.className = "todo-list__item";
        li.dataset.id = todo.id;
        li.setAttribute("draggable", "true");

        li.innerHTML = `
            <div class="todo-list__task">
                <input type="checkbox" ${todo.completed ? "checked" : ""} />
                <span>${todo.text}</span>
            </div>
            <button class="todo-list__delete-btn">
                <img src="./src/assets/icons/x-icon.svg" alt="x-icon" />
            </button>
        `;

        addDragAndDropHandlers(li);
        todoList.appendChild(li);
    });

    updateUI();
    handleFilterChange(getCurrentFilter());
}

function updateUI() {
    updateEmptyState();
    updateItemsLeftCount();
}

function updateEmptyState() {
    const hasTodos = todoList.children.length > 0;

    todoBody.style.display = hasTodos ? "block" : "none";
    todoCopyright.style.display = hasTodos ? "block" : "none";
}

function updateItemsLeftCount() {
    const todos = getTodosFromStorage();
    const itemsLeft = todos.filter((todo) => !todo.completed).length;
    itemCount.textContent = `${itemsLeft} ${itemsLeft === 1 ? "item" : "items"} left`;
}

function init() {
    setTheme();
    const todos = getTodosFromStorage();
    renderTodos(todos);
    deleteTodo();
    handleCheckboxToggle();
    filterTodos();
    setupClearCompletedHandler();

    todoForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleAddTodo();
    });
}

init();
