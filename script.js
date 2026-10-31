
// ELEMENTOS HTML
const form = document.getElementById("transaction-form");
const typeInput = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const categoryInput = document.getElementById("category");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const transactionList = document.getElementById("transaction-list");
const filterInput = document.getElementById("filter");
const emptyMessage = document.getElementById("empty-message");

// FECHA ACTUAL
const today = new Date();
const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
).toISOString().split("T")[0];

dateInput.value = localDate;
dateInput.max = localDate;

// CARGAR DATOS GUARDADOS
let transactions = [];

try {
    transactions = JSON.parse(
        localStorage.getItem("moneyControlTransactions")
    ) || [];
} catch (error) {
    transactions = [];
}

// FORMATO DE DINERO
function formatMoney(value) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    }).format(value);
}

// GUARDAR MOVIMIENTOS
function saveTransactions() {
    localStorage.setItem(
        "moneyControlTransactions",
        JSON.stringify(transactions)
    );
}

// CALCULAR INGRESOS, GASTOS Y SALDO
function updateSummary() {

    const totalIncome = transactions
        .filter(item => item.type === "income")
        .reduce((total, item) => total + item.amount, 0);

    const totalExpense = transactions
        .filter(item => item.type === "expense")
        .reduce((total, item) => total + item.amount, 0);

    const balance = totalIncome - totalExpense;

    document.getElementById("income").textContent =
        formatMoney(totalIncome);

    document.getElementById("expense").textContent =
        formatMoney(totalExpense);

    document.getElementById("balance").textContent =
        formatMoney(balance);
}

// MOSTRAR MOVIMIENTOS
function renderTransactions() {

    transactionList.innerHTML = "";

    const filter = filterInput.value;

    const filteredTransactions = transactions
        .filter(item => filter === "all" || item.type === filter)
        .sort((a, b) => b.id - a.id);

    emptyMessage.style.display =
        filteredTransactions.length === 0 ? "block" : "none";

    filteredTransactions.forEach(item => {

        const row = document.createElement("tr");

        const description = document.createElement("td");
        description.textContent = item.description;

        const category = document.createElement("td");
        category.textContent = item.category;

        const date = document.createElement("td");
        date.textContent = item.date;

        const type = document.createElement("td");
        type.textContent =
            item.type === "income" ? "Ingreso" : "Gasto";

        type.className =
            item.type === "income" ? "income-text" : "expense-text";

        const amount = document.createElement("td");

        amount.textContent =
            (item.type === "income" ? "+ " : "- ") +
            formatMoney(item.amount);

        amount.className = type.className;

        const action = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Eliminar";
        deleteButton.className = "delete-button";
        deleteButton.dataset.id = item.id;

        action.appendChild(deleteButton);

        row.append(
            description,
            category,
            date,
            type,
            amount,
            action
        );

        transactionList.appendChild(row);
    });
}

// AGREGAR MOVIMIENTO
form.addEventListener("submit", function(event) {

    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const date = dateInput.value;

    if (
        !description ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !date ||
        date > localDate
    ) {
        alert("Por favor, introduce datos válidos.");
        return;
    }

    const transaction = {
        id: Date.now(),
        type: typeInput.value,
        description: description,
        category: categoryInput.value,
        amount: amount,
        date: date
    };

    transactions.push(transaction);

    saveTransactions();
    updateApp();

    form.reset();
    dateInput.value = localDate;
    dateInput.max = localDate;

});

// ELIMINAR MOVIMIENTOS
transactionList.addEventListener("click", function(event) {

    if (!event.target.classList.contains("delete-button")) {
        return;
    }

    const id = Number(event.target.dataset.id);

    if (!confirm("¿Deseas eliminar este movimiento?")) {
        return;
    }

    transactions = transactions.filter(item => item.id !== id);

    saveTransactions();
    updateApp();
});

// FILTRAR MOVIMIENTOS
filterInput.addEventListener("change", renderTransactions);

// CREAR GRAFICOS
let mainChart;
let categoryChart;

function updateCharts() {

    const totalIncome = transactions
        .filter(item => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0);

    const totalExpense = transactions
        .filter(item => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0);

    // GRAFICO DE INGRESOS Y GASTOS

    if (mainChart) {
        mainChart.destroy();
    }

    mainChart = new Chart(
        document.getElementById("mainChart"),
        {
            type: "bar",
            data: {
                labels: ["Ingresos", "Gastos"],
                datasets: [{
                    label: "Cantidad en dólares",
                    data: [totalIncome, totalExpense],
                    backgroundColor: ["#16a36a", "#dc5555"],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        }
    );

    // GASTOS POR CATEGORIA

    const expenses = transactions.filter(
        item => item.type === "expense"
    );

    const categories = {};

    expenses.forEach(item => {
        categories[item.category] =
            (categories[item.category] || 0) + item.amount;
    });

    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(
        document.getElementById("categoryChart"),
        {
            type: "doughnut",
            data: {
                labels: Object.keys(categories).length
                    ? Object.keys(categories)
                    : ["Sin gastos"],
                datasets: [{
                    data: Object.keys(categories).length
                        ? Object.values(categories)
                        : [1],
                    backgroundColor: [
                        "#3987d6",
                        "#16a36a",
                        "#f0ad4e",
                        "#dc5555",
                        "#9875d5",
                        "#42b8b0",
                        "#8794a8"
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        }
    );
}

// ACTUALIZAR TODA LA PAGINA
function updateApp() {
    updateSummary();
    renderTransactions();
    updateCharts();
}

// INICIAR APLICACION
updateApp();
