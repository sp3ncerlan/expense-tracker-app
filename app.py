from flask import Flask, render_template, request, jsonify, session, url_for, redirect
from datetime import datetime
import sqlite3

app = Flask(__name__, template_folder="templates")

def init_db():
    connection = sqlite3.connect('expenses.db')
    cursor = connection.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS transactions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        description TEXT,
                        amount REAL,
                        date TEXT
                    )''')
    connection.commit()
    connection.close()

def calculate_total_monthly_spend():
    connection = sqlite3.connect('expenses.db')
    cursor = connection.cursor()
    cursor.execute("SELECT SUM(amount) FROM transactions WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')")
    total = cursor.fetchone()[0] or 0
    connection.close()
    return total

@app.route('/api/total-monthly-spend', methods=['GET'])
def get_total_monthly_spend():
    conn = sqlite3.connect('expenses.db')
    cursor = conn.cursor()
    cursor.execute("SELECT SUM(amount) FROM transactions WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')")
    total = cursor.fetchone()[0] or 0
    conn.close()
    return jsonify({"totalMonthlySpend": total})

@app.route('/')
def home():
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        if email == 'lansp329@gmail.com' and password == 'password':
            return redirect(url_for('dashboard'))
        else:
            return "Invalid credentials", 401

    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    transactions_response = get_transactions()
    transactions = transactions_response.get_json()
    total_spend = "{:.2f}".format(calculate_total_monthly_spend())

    current_month_transactions_response = get_current_month_transactions()
    current_month_transactions = current_month_transactions_response.get_json()
    
    return render_template('dashboard.html', transactions=transactions, totalMonthlySpend=total_spend)

@app.route('/transactions/current-month', methods=['GET'])
def get_current_month_transactions():
    # Get the current month and year
    current_year = datetime.now().strftime('%Y')
    current_month = datetime.now().strftime('%m')
    
    connection = sqlite3.connect('expenses.db')
    cursor = connection.cursor()
    cursor.execute("""
        SELECT id, description, amount, date 
        FROM transactions 
        WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ?
    """, (current_year, current_month))
    
    transactions = cursor.fetchall()
    connection.close()
  
    return jsonify([
        {"id": row[0], "description": row[1], "amount": row[2], "date": row[3]} 
        for row in transactions
    ])
    
@app.route('/all-transactions')
def all_transactions():
    return render_template('all-transactions.html')

@app.route('/transactions', methods=['GET'])
def get_transactions():
    connection = sqlite3.connect('expenses.db')
    cursor = connection.cursor()
    cursor.execute("SELECT id, description, amount, date FROM transactions")
    transactions = cursor.fetchall()
    connection.close()
    return jsonify([
        {"id": row[0], "description": row[1], "amount": row[2], "date": row[3]} 
        for row in transactions
    ])

@app.route('/transaction', methods=['POST'])
def add_transaction():
    data = request.json
    conn = sqlite3.connect('expenses.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO transactions (description, amount, date) VALUES (?, ?, ?)",
                   (data['description'], data['amount'], data['date']))
    conn.commit()
    conn.close()
    return jsonify({"message": "Transaction added!"}), 201

# Edit Transaction
@app.route('/transaction/<int:id>', methods=['PUT'])
def edit_transaction(id):
    data = request.json
    conn = sqlite3.connect('expenses.db')
    cursor = conn.cursor()
    cursor.execute("UPDATE transactions SET description = ?, amount = ?, date = ? WHERE id = ?",
                   (data['description'], data['amount'], data['date'], id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Transaction updated!"})

@app.route('/transaction/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    connection = sqlite3.connect('expenses.db')
    cursor = connection.cursor()
    cursor.execute("DELETE FROM transactions WHERE id = ?", (id,))
    connection.commit()
    connection.close()
    return jsonify({"message": "Transaction deleted!"})

@app.route('/help')
def help():
    return render_template('help.html')

# Initialize the database
init_db()

if __name__ == '__main__':
    app.run(debug=True)
