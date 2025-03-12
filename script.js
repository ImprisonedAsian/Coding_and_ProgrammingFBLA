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

async function checkModelAccess() {
    try {
        const response = await fetch("https://api.openai.com/v1/models", {
            method: "GET",
            headers: {
                "Authorization": `Bearer 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`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Available Models:", data.data);

        // Check if gpt-3.5-turbo is in the list
        const hasAccess = data.data.some(model => model.id === "gpt-3.5-turbo");
        if (hasAccess) {
            console.log("Access to gpt-3.5-turbo: YES");
        } else {
            console.log("Access to gpt-3.5-turbo: NO");
        }
    } catch (error) {
        console.error("Error checking model access:", error);
    }
}

checkModelAccess();

// AI Chatbot Modal Functions
function openChatbot() {
    document.getElementById("chatbot-modal").style.display = "block";
}

function closeChatbot() {
    document.getElementById("chatbot-modal").style.display = "none";
}

document.addEventListener("click", function (event) {
    let modal = document.getElementById("chatbot-modal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

async function sendMessage() {
    let userInput = document.getElementById("chatbot-input").value;
    if (!userInput.trim()) return;

    let chatbox = document.getElementById("chatbot-messages");
    chatbox.innerHTML += `<div class='user-message'>${userInput}</div>`;
    document.getElementById("chatbot-input").value = "";

    // Show loading indicator
    chatbox.innerHTML += `<div class='ai-message' id="loading">Thinking...</div>`;
    chatbox.scrollTop = chatbox.scrollHeight;

    // Get the current balance and transactions
    let balance = parseFloat(document.getElementById("balance").textContent);
    let transactionsList = JSON.parse(localStorage.getItem("transactions")) || [];

    // Prepare the context for the AI
    let context = `
        You are a helpful financial assistant integrated into a personal finance tracker tool. 
        The user's current balance is $${balance.toFixed(2)}. 
        Here is a list of their recent transactions:
        ${transactionsList.map(t => `${t.description} - $${t.amount.toFixed(2)} (${t.category}, ${t.date})`).join("\n")}

        Your tasks are:
        1. Explain how to use the finance tracker tool (e.g., adding transactions, editing, deleting, generating reports).
        2. Analyze the user's transactions and provide feedback on their spending habits.
        3. Offer suggestions to improve their financial health based on their current balance and transactions.

        The user has asked: "${userInput}"
    `;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer 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`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: context }, // Provide context to the AI
                    { role: "user", content: userInput }  // User's input
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        let aiMessage = data.choices[0].message.content;

        // Remove loading indicator and show AI response
        document.getElementById("loading").remove();
        chatbox.innerHTML += `<div class='ai-message'>${aiMessage}</div>`;
        chatbox.scrollTop = chatbox.scrollHeight;
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("loading").remove();
        chatbox.innerHTML += `<div class='ai-message'>Error: Unable to get a response from the AI.</div>`;
    }
}


// Existing JavaScript Code
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let editingIndex = null;
let expenseChart = null;

function getLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Set the max date to today
document.getElementById("date").max = getLocalDate();

// Restrict amount input to numbers and 2 decimal places
document.getElementById("amount").addEventListener("input", function (e) {
    let value = e.target.value;

    // Remove any non-numeric characters except for a single decimal point
    value = value.replace(/[^0-9.]/g, "");

    // Ensure only one decimal point
    let decimalIndex = value.indexOf(".");
    if (decimalIndex !== -1) {
        value = value.slice(0, decimalIndex + 1) + value.slice(decimalIndex + 1).replace(/\./g, "");
    }

    // Restrict to 2 decimal places
    if (decimalIndex !== -1) {
        let decimalPlaces = value.length - decimalIndex - 1;
        if (decimalPlaces > 2) {
            value = value.slice(0, decimalIndex + 3);
        }
    }

    // Update the input value
    e.target.value = value;
});

// Restrict amount input to 2 decimal places
document.getElementById("amount").addEventListener("input", function (e) {
    let value = e.target.value;
    let decimalIndex = value.indexOf(".");

    // If there's a decimal point, restrict to 2 decimal places
    if (decimalIndex !== -1) {
        let decimalPlaces = value.length - decimalIndex - 1;
        if (decimalPlaces > 2) {
            e.target.value = value.slice(0, decimalIndex + 3); // Truncate to 2 decimal places
        }
    }
});

function addTransaction() {
    let description = document.getElementById("description").value.trim();
    let amount = parseFloat(document.getElementById("amount").value);
    let category = document.getElementById("category").value;
    let date = document.getElementById("date").value;

    // Validate the date
    let today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
    if (date > today) {
        alert("Date cannot be in the future. Please enter a valid date.");
        return;
    }

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

    // Regenerate the currently displayed summary if applicable
    if (currentSummary === "weekly") {
        generateWeeklySummary();
    } else if (currentSummary === "monthly") {
        generateMonthlySummary();
    }
    else if (currentSummary === "report"){
        generateReport();
    }
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

    // Clear the search box
    document.getElementById("search").value = "";
    filterTransactions(); // Re-filter to show all transactions
}

function deleteTransaction(index) {
    transactions.splice(index, 1);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    updateUI();

    // Update the correct summary or report when deleting a transaction
    if (currentSummary === "weekly") {
        generateWeeklySummary();
    } else if (currentSummary === "monthly") {
        generateMonthlySummary();
    } else if (currentSummary === "report") {
        generateReport(); // Regenerate the pie chart when on the report view
    }
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
    let filtered = transactions.filter(t => 
        t.description.toLowerCase().includes(query) || // Search by description
        t.category.toLowerCase().includes(query) ||   // Search by category
        t.date.includes(query)                        // Search by date
    );

    document.getElementById("transactions").innerHTML = "";
    filtered.forEach(t => {
        let li = document.createElement("li");
        li.innerHTML = `${t.description} - $${t.amount.toFixed(2)} (${t.category}, ${t.date})
            <button class="edit-btn" onclick="editTransaction(${transactions.indexOf(t)})">Edit</button>
            <button class="delete-btn" onclick="deleteTransaction(${transactions.indexOf(t)})">X</button>`;
        document.getElementById("transactions").appendChild(li);
    });
}

let currentSummary = null; // Tracks the currently displayed summary ("weekly" or "monthly")

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

    })
    document.getElementById("report").innerHTML = "Expense Summary Generated!";
currentSummary = "report";
}

function generateSummary(days, label) {
    let today = new Date(); // Use the actual current date
    let pastDate = new Date(today);
    pastDate.setDate(today.getDate() - days);

    let dailyBalances = {};
    let cumulativeExpenses = 0; // Track cumulative expenses
    let cumulativeIncome = 0; // Track cumulative income
    let cumulativeFood = 0; // Track cumulative food expenses
    let cumulativeEntertainment = 0; // Track cumulative entertainment expenses
    let cumulativeTransport = 0; // Track cumulative transport expenses
    let cumulativeOther = 0; // Track cumulative other expenses
    let labels = [];
    let balanceData = [];
    let expensesData = []; // Data for the cumulative expenses line
    let incomeData = []; // Data for the cumulative income line
    let foodData = []; // Data for the cumulative food expenses line
    let entertainmentData = []; // Data for the cumulative entertainment expenses line
    let transportData = []; // Data for the cumulative transport expenses line
    let otherData = []; // Data for the cumulative other expenses line

    // Initialize lastBalance with transactions before the pastDate
    let lastBalance = transactions
        .filter(t => new Date(t.date) < pastDate)
        .reduce((sum, t) => sum + (t.category === "income" ? t.amount : -t.amount), 0);

    // Process each day in the range
    for (let i = 0; i < days; i++) {
        let date = new Date(pastDate);
        date.setDate(date.getDate() + i);
        let dateString = date.toISOString().split("T")[0];

        // Initialize the balance for this day with the last balance
        dailyBalances[dateString] = lastBalance;

        // Apply transactions for the current day
        let dailyTransactions = transactions.filter(t => t.date === dateString);
        let dailyChange = dailyTransactions.reduce((sum, t) => sum + (t.category === "income" ? t.amount : -t.amount), 0);

        // Update the balance for this day after processing transactions
        lastBalance += dailyChange;
        dailyBalances[dateString] = lastBalance;

        // Calculate daily expenses and add to cumulative total
        let dailyExpense = dailyTransactions
            .filter(t => t.category !== "income") // Exclude income
            .reduce((sum, t) => sum + t.amount, 0);
        cumulativeExpenses += dailyExpense; // Add to cumulative total

        // Calculate daily income and add to cumulative total
        let dailyIncome = dailyTransactions
            .filter(t => t.category === "income") // Include only income
            .reduce((sum, t) => sum + t.amount, 0);
        cumulativeIncome += dailyIncome; // Add to cumulative total

        // Calculate daily food expenses and add to cumulative total
        let dailyFood = dailyTransactions
            .filter(t => t.category === "food") // Include only food
            .reduce((sum, t) => sum + t.amount, 0);
        cumulativeFood += dailyFood; // Add to cumulative total

        // Calculate daily entertainment expenses and add to cumulative total
        let dailyEntertainment = dailyTransactions
            .filter(t => t.category === "entertainment") // Include only entertainment
            .reduce((sum, t) => sum + t.amount, 0);
        cumulativeEntertainment += dailyEntertainment; // Add to cumulative total

        // Calculate daily transport expenses and add to cumulative total
        let dailyTransport = dailyTransactions
            .filter(t => t.category === "transport") // Include only transport
            .reduce((sum, t) => sum + t.amount, 0);
        cumulativeTransport += dailyTransport; // Add to cumulative total

        // Calculate daily other expenses and add to cumulative total
        let dailyOther = dailyTransactions
            .filter(t => t.category === "other") // Include only other
            .reduce((sum, t) => sum + t.amount, 0);
        cumulativeOther += dailyOther; // Add to cumulative total

        // Push the date, balance, cumulative expenses, income, and category totals to the graph data
        labels.push(dateString);
        balanceData.push(dailyBalances[dateString]);
        expensesData.push(cumulativeExpenses);
        incomeData.push(cumulativeIncome);
        foodData.push(cumulativeFood);
        entertainmentData.push(cumulativeEntertainment);
        transportData.push(cumulativeTransport);
        otherData.push(cumulativeOther);
    }

    // Final balance
    let finalBalance = lastBalance;
    document.getElementById("report").innerHTML = `${label} Summary: Final Balance $${finalBalance.toFixed(2)}`;

    // Call to render the graph with all datasets
    renderBalanceGraph(labels, balanceData, expensesData, incomeData, foodData, entertainmentData, transportData, otherData);
}

function renderBalanceGraph(labels, balanceData, expensesData, incomeData, foodData, entertainmentData, transportData, otherData) {
    let ctx = document.getElementById("expenseChart").getContext("2d");

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Balance Over Time",
                    data: balanceData,
                    borderColor: "blue",
                    fill: false,
                },
                {
                    label: "Expenses Over Time",
                    data: expensesData,
                    borderColor: "red",
                    fill: false,
                },
                {
                    label: "Income Over Time",
                    data: incomeData,
                    borderColor: "green",
                    fill: false,
                },
                {
                    label: "Food Over Time",
                    data: foodData,
                    borderColor: "orange",
                    fill: false,
                },
                {
                    label: "Entertainment Over Time",
                    data: entertainmentData,
                    borderColor: "purple",
                    fill: false,
                },
                {
                    label: "Transport Over Time",
                    data: transportData,
                    borderColor: "brown",
                    fill: false,
                },
                {
                    label: "Other Over Time",
                    data: otherData,
                    borderColor: "gray",
                    fill: false,
                },
            ],
        },
        options: {
            scales: {
                x: { title: { display: true, text: "Date" } },
                y: { title: { display: true, text: "Amount ($)" } },
            },
        },
    });
}

function generateWeeklySummary() {
    generateSummary(7, "Past 7 Days");
    currentSummary = "weekly"; // Set the current summary to weekly
}

function generateMonthlySummary() {
    generateSummary(30, "Past 30 Days");
    currentSummary = "monthly"; // Set the current summary to monthly
}
function exportToCSV() {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Description,Amount,Category,Date\n"; // Header row

    // Add each transaction as a row
    transactions.forEach(transaction => {
        csvContent += `${transaction.description},${transaction.amount},${transaction.category},${transaction.date}\n`;
    });

    // Create a downloadable link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);

    // Trigger the download
    link.click();
    document.body.removeChild(link);
}
updateUI();