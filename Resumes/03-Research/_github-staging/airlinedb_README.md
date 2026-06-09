# AirlineDB Management System

> A DBMS project: airline booking management (flights, passengers, seat booking/cancellation)
> with a **Streamlit** front-end over **MySQL**.

## Features
- Book and cancel seats; manage flights, passengers, and bookings.
- Relational schema with foreign-key relationships (see [`dbmshackscript.sql`](dbmshackscript.sql)).
- Interactive Streamlit UI over a MySQL backend (PyMySQL).

## Setup
```bash
pip install streamlit pymysql
# 1) create the database + tables:
mysql -u root -p < dbmshackscript.sql
# 2) set your DB password (no secrets in code):
export MYSQL_PASSWORD='your-mysql-password'
# 3) run:
streamlit run app.py
```

## Stack
Python · Streamlit · MySQL · PyMySQL · SQL (schema design, joins, transactions)
