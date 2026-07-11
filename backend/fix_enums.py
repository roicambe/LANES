import psycopg
conn = psycopg.connect('postgresql://postgres:postgres@localhost:5432/lanes')
cur = conn.cursor()
cur.execute("DROP TYPE IF EXISTS reportsource_enum CASCADE;")
cur.execute("DROP TYPE IF EXISTS reportseverity_enum CASCADE;")
cur.execute("DROP TYPE IF EXISTS reportstatus_enum CASCADE;")
cur.execute("DROP TYPE IF EXISTS interactiontype_enum CASCADE;")
conn.commit()
print("Dropped enums.")
