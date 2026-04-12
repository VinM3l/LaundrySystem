from flask import Flask, g, render_template, request, jsonify, send_file
import os
import sqlite3
from datetime import datetime
import pandas as pd
from io import BytesIO

app = Flask(__name__, template_folder='template')
DATABASE = 'laundry.db'

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db

def init_db():
    db = get_db()
    db.execute('''CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        weekday TEXT,
        in_charge TEXT,
        customer_name TEXT,
        weight_kilo REAL,
        rush INTEGER,
        num_loads INTEGER,
        machine_used TEXT,
        per_load REAL,
        other_notes TEXT,
        half REAL,
        pay REAL,
        income REAL,
        date_fully_paid TEXT,
        extra_amount REAL,
        paid INTEGER,
        created_at TEXT
    )''')
    db.commit()

# initialize DB on first run
if not os.path.exists(DATABASE):
    with app.app_context():
        init_db()

# ---------- Routes ----------

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/add', methods=['POST'])
def add_receipt():
    payload = request.get_json()
    # expected keys - we do minimal validation
    fields = [
        'date','weekday','in_charge','customer_name','weight_kilo','rush','num_loads',
        'machine_used','per_load','other_notes','half','pay','income','date_fully_paid','extra_amount','paid'
    ]
    vals = [payload.get(k) for k in fields]
    vals.append(datetime.utcnow().isoformat()) # created_at
    placeholders = ','.join('?' for _ in range(len(fields)+1))
    sql = f"INSERT INTO receipts ({','.join(fields)},created_at) VALUES ({placeholders})"
    db = get_db()
    db.execute(sql, vals)    
    db.commit()
    return jsonify({'status':'ok'})

@app.route('/api/list')
def list_receipts():
    db = get_db()
    cur = db.execute('SELECT * FROM receipts ORDER BY id DESC')
    rows = [dict(r) for r in cur.fetchall()]
    return jsonify(rows)

@app.route('/api/mark_paid', methods=['POST'])
def mark_paid():
    payload  = request.get_json()
    id       = payload.get('id')
    date_paid = payload.get('date_paid', '')
    db = get_db()
    db.execute('UPDATE receipts SET paid=1, date_fully_paid=? WHERE id=?', (date_paid, id))
    db.commit()
    return jsonify({'status': 'ok'})

@app.route('/api/delete', methods=['POST'])
def delete_receipt():
    payload = request.get_json()
    id      = payload.get('id')
    db = get_db()
    db.execute('DELETE FROM receipts WHERE id=?', (id,))
    db.commit()
    return jsonify({'status': 'ok'})

@app.route('/export')
def export_xlsx():
    # Load SQLite table into pandas and return as excel in-memory
    db = get_db()
    df = pd.read_sql_query('SELECT * FROM receipts ORDER BY id DESC', db)
    # convert rush/paid from 0/1 to yes/no for readability
    if 'rush' in df.columns:
        df['rush'] = df['rush'].map({1:'Yes',0:'No'}).fillna(df['rush'])
    if 'paid' in df.columns:
        df['paid'] = df['paid'].map({1:'Paid',0:'Unpaid'}).fillna(df['paid'])

    # write to BytesIO
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Receipts')
    output.seek(0)

    now = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'receipts_{now}.xlsx'

    return send_file(
        output,
        download_name=filename,
        as_attachment=True,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
