function openAddExpenseForm() {
    document.getElementById('addExpenseForm').style.display = 'block';
}

function closeAddExpenseForm() {
    document.getElementById('addExpenseForm').style.display = 'none';
}

function loadCurrentMonthTransactions() {
    fetch('/transactions/current-month')
        .then(response => response.json())
        .then(data => {
            const transactionContainer = document.getElementById('currentMonthTransactions');
            transactionContainer.innerHTML = ''; // Clear previous transactions

            if (data.length === 0) {
                transactionContainer.innerHTML = '<p>No transactions for this month.</p>';
            } else {
                data.forEach(transaction => {
                    // Create a container for each transaction
                    const transactionDiv = document.createElement('div');
                    transactionDiv.classList.add('transaction');

                    // Add transaction details
                    transactionDiv.innerHTML = `
                        <div>
                            <strong>${transaction.description}</strong> - ${transaction.date}
                        </div>
                        <div class="transaction-amount">$${transaction.amount.toFixed(2)}</div>
                    `;

                    // Create the Edit button
                    const editButton = document.createElement('button');
                    editButton.textContent = 'Edit';
                    editButton.onclick = () => editTransaction(transaction.id, transaction.description, transaction.amount, transaction.date);

                    // Create the Delete button
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.onclick = () => deleteTransaction(transaction.id);

                    // Append buttons to transaction div
                    const buttonContainer = document.createElement('div');
                    buttonContainer.classList.add('transaction-buttons');
                    buttonContainer.appendChild(editButton);
                    buttonContainer.appendChild(deleteButton);

                    // Add buttons to transaction div
                    transactionDiv.appendChild(buttonContainer);

                    // Add the transaction to the container
                    transactionContainer.appendChild(transactionDiv);
                });
            }
        })
        .catch(error => console.error('Error loading current month transactions:', error));
}

function updateMonthlySpend() {
    fetch('/api/total-monthly-spend')
    .then(response => response.json())
    .then(data => {
        document.querySelector('.monthly-spend').textContent = `$${data.totalMonthlySpend.toFixed(2)}`;
    })
    .catch(error => console.error('Error updating monthly spend:', error));
}


function totalMonthlySpend() {
    fetch('/transactions')
    .then(response => response.json())
    .then(data => {
        const currentMonth = new Date().getMonth();
        const total = data
            .filter(transaction => new Date(transaction.date).getMonth() === currentMonth)
            .reduce((sum, transaction) => sum + transaction.amount, 0);
        return total;
    })
    .catch(error => {
        console.error('Error:', error);
        return 0;
    });
}

function addTransaction() {
    const description = document.getElementById('description').value;
    const amount = document.getElementById('amount').value;
    const date = document.getElementById('date').value;

    if (!description || !amount || !date) {
        alert("Please fill in all fields before submitting!");
        return;
    }

    fetch('/transaction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            description: description,
            amount: parseFloat(amount),
            date: date
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        updateMonthlySpend();
        loadCurrentMonthTransactions();
        document.getElementById('expenseForm').reset();
        closeAddExpenseForm();
    })
    .catch(error => console.error('Error:', error));
}

function editTransaction(id, description, amount, date) {
    console.log("Edit function called with:", id, description, amount, date);

    document.getElementById('editTransactionId').value = id || '';
    document.getElementById('editDescription').value = description || '';
    document.getElementById('editAmount').value = amount || '';
    document.getElementById('editDate').value = date || '';

    document.getElementById('editExpenseForm').style.display = 'block';
}


function closeEditExpenseForm() {
    document.getElementById('editExpenseForm').style.display = 'none';
}

function submitEditTransaction() {
    const id = document.getElementById('editTransactionId').value;
    const description = document.getElementById('editDescription').value.trim();
    const amount = parseFloat(document.getElementById('editAmount').value.trim());
    const date = document.getElementById('editDate').value.trim();

    if (!description || isNaN(amount) || amount <= 0 || !date) {
        alert("Please fill in all fields correctly.");
        return;
    }

    fetch(`/transaction/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            description: description,
            amount: amount,
            date: date
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        loadCurrentMonthTransactions();
        closeEditExpenseForm();
    })
    .catch(error => console.error('Error updating transaction:', error));
}

function deleteTransaction(id) {
    if (confirm("Are you sure you want to delete this transaction?")) {
        fetch(`/transaction/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadCurrentMonthTransactions();
            updateMonthlySpend();
        })
        .catch(error => console.error('Error:', error));
    }
}

function openEditBudgetForm() {
    document.getElementById('editBudgetForm').style.display = 'block';
}

function closeEditBudgetForm() {
    document.getElementById('editBudgetForm').style.display = 'none';
}

function saveBudget() {
    const newBudget = document.getElementById('newBudgetAmount').value;

    if (newBudget) {
        document.getElementById('budgetAmount').textContent = parseFloat(newBudget).toFixed(2);
        closeEditBudgetForm();
    } else {
        alert("Please enter a valid budget amount.");
    }
}

function loadTransactions() {
    fetch('/transactions')
        .then(response => response.json())
        .then(data => {
            const transactionContainer = document.querySelector('.left');
            let transactionsHTML = '';

            data.forEach(transaction => {
                transactionsHTML += `
                    <div class="transaction">
                        <div>
                            <strong>${transaction.description}</strong><br>
                        </div>
                        <div class="transaction-date">
                            ${transaction.date}
                        </div>
                        <div class="transaction-amount">$${transaction.amount.toFixed(2)}</div>
                        <div class="transaction-buttons">
                            <button onclick="editTransaction(${transaction.id})">Edit</button>
                            <button onclick="deleteTransaction(${transaction.id})">Delete</button>
                        </div>
                    </div>
                `;
            });

            transactionContainer.innerHTML = `
            <div class="header">
                <p>Welcome to your Dashboard, <strong>Spencer</strong></p>
                <div>
                    <a href="/dashboard">Dashboard</a>
                    <a href="/help">Help</a>
                </div>
            </div>
            <h2 class="current-month">This Month's Transactions</h2>
            <p class="current-date">${new Date().toLocaleDateString()}</p>
            <div id="currentMonthTransactions">

            </div>
            <p class="see-all-transactions"><a href="/all-transactions">See All Transactions</a></p>
            `;
        })
        .catch(error => console.error('Error:', error));
}

document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
    updateMonthlySpend();
    loadCurrentMonthTransactions();
});
