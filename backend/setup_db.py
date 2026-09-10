import psycopg2

def check_and_setup():
    conn = psycopg2.connect(host="localhost", port=5432, user="postgres", password="Teja@#12", dbname="postgres")
    conn.autocommit = True
    cur = conn.cursor()

    cur.execute("SELECT name, default_version, installed_version FROM pg_available_extensions WHERE name = 'vector';")
    extensions = cur.fetchall()
    print("vector extension in postgres:", extensions)

    cur.execute("SELECT datname FROM pg_database WHERE datname = 'doc_intelligence';")
    dbs = cur.fetchall()
    print("doc_intelligence db exists:", dbs)

    if not dbs:
        print("Creating doc_intelligence database...")
        cur.execute("CREATE DATABASE doc_intelligence;")
        print("Created doc_intelligence successfully.")
    else:
        print("doc_intelligence already exists.")

    conn.close()

    # Now test connecting to doc_intelligence and enabling vector
    conn2 = psycopg2.connect(host="localhost", port=5432, user="postgres", password="Teja@#12", dbname="doc_intelligence")
    conn2.autocommit = True
    cur2 = conn2.cursor()
    try:
        cur2.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        print("CREATE EXTENSION vector SUCCEEDED!")
    except Exception as e:
        print("CREATE EXTENSION vector FAILED:", e)
    conn2.close()

if __name__ == "__main__":
    check_and_setup()
