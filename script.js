// FAQ Modal Functions
function openFAQ() {
    document.getElementById("faq-modal").style.display = "block";
}

function closeFAQ() {
    document.getElementById("faq-modal").style.display = "none";
}

document.addEventListener("click", function (event) {
    let modal = document.getElementById("faq-modal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

// Existing JavaScript Code
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let editingIndex = null;
let expenseChart = null;

function addTransaction() {
    let description = document.getElementById("description").value.trim();
    let amount = parseFloat(document.getElementById("amount").value);
    let category = document.getElementById("category").value;
    let date = document.getElementById("date").value;

    if (!description || isNaN(amount) || !date) {
        alert("Please enter valid transaction details.");
        return;
    }

    let transaction = { description, amount, category, date };

    if (editingIndex !== null) {
        transactions[editingIndex] = transaction;
        editingIndex = null;
        document.getElementById("add-transaction-btn").textContent = "Add Transaction";
    } else {
        transactions.push(transaction);
    }

    localStorage.setItem("transactions", JSON.stringify(transactions));
    updateUI();
    clearForm();
}

function updateUI() {
    let balance = 0;
    let transactionList = document.getElementById("transactions");
    transactionList.innerHTML = "";

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    transactions.forEach((transaction, index) => {
        let li = document.createElement("li");
        li.innerHTML = `${transaction.description} - $${transaction.amount.toFixed(2)} (${transaction.category}, ${transaction.date})
            <button class="edit-btn" onclick="editTransaction(${index})">Edit</button>
            <button class="delete-btn" onclick="deleteTransaction(${index})">X</button>`;
        transactionList.appendChild(li);

        balance += transaction.category === "income" ? transaction.amount : -transaction.amount;
    });

    document.getElementById("balance").textContent = balance.toFixed(2);
}

function editTransaction(index) {
    let transaction = transactions[index];
    document.getElementById("description").value = transaction.description;
    document.getElementById("amount").value = transaction.amount;
    document.getElementById("category").value = transaction.category;
    document.getElementById("date").value = transaction.date;
    editingIndex = index;
    document.getElementById("add-transaction-btn").textContent = "Save Changes";
}

function deleteTransaction(index) {
    transactions.splice(index, 1);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    updateUI();
}

function clearForm() {
    document.getElementById("description").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("category").value = "income";
    document.getElementById("date").value = "";
    document.getElementById("add-transaction-btn").textContent = "Add Transaction";
}

function filterTransactions() {
    let query = document.getElementById("search").value.toLowerCase();
    let filtered = transactions.filter(t => t.description.toLowerCase().includes(query));
    document.getElementById("transactions").innerHTML = "";
    filtered.forEach(t => {
        let li = document.createElement("li");
        li.innerHTML = `${t.description} - $${t.amount.toFixed(2)} (${t.category}, ${t.date})`;
        document.getElementById("transactions").appendChild(li);
    });
}

function generateReport() {
    let categories = {};
    transactions.forEach(t => {
        if (t.category !== "income") {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        }
    });

    let labels = Object.keys(categories);
    let data = Object.values(categories);

    if (expenseChart) {
        expenseChart.destroy();
    }

    let ctx = document.getElementById("expenseChart").getContext("2d");
    expenseChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ["red", "blue", "green", "yellow"]
            }]
        }
    });

    document.getElementById("report").innerHTML = "Expense Summary Generated!";
}

function generateSummary(days, label) {
    let today = new Date("2025-03-08"); // Hardcoded for testing
    let pastDate = new Date(today);
    pastDate.setDate(today.getDate() - days);

    let dailyBalances = {};
    let labels = [];
    let data = [];

    let lastBalance = transactions
        .filter(t => new Date(t.date) < pastDate)
        .reduce((sum, t) => sum + (t.category === "income" ? t.amount : -t.amount), 0);

    for (let i = 0; i <= days; i++) {
        let date = new Date(pastDate);
        date.setDate(date.getDate() + i);
        let dateString = date.toISOString().split("T")[0];

        dailyBalances[dateString] = lastBalance;

        let dailyTransactions = transactions.filter(t => t.date === dateString);
        let dailyChange = dailyTransactions.reduce((sum, t) => sum + (t.category === "income" ? t.amount : -t.amount), 0);

        lastBalance += dailyChange;
        dailyBalances[dateString] = lastBalance;

        labels.push(dateString);
        data.push(dailyBalances[dateString]);
    }

    let finalBalance = lastBalance;
    document.getElementById("report").innerHTML = `${label} Summary: Final Balance $${finalBalance.toFixed(2)}`;

    renderBalanceGraph(labels, data);
}

function renderBalanceGraph(labels, data) {
    let ctx = document.getElementById("expenseChart").getContext("2d");

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Balance Over Time",
                data: data,
                borderColor: "blue",
                fill: false,
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: "Date" } },
                y: { title: { display: true, text: "Balance ($)" } }
            }
        }
    });
}

function generateWeeklySummary() {
    generateSummary(7, "Past 7 Days");
}

function generateMonthlySummary() {
    generateSummary(30, "Past 30 Days");
}

updateUI();