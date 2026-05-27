import datetime
import random

# IDs
perfect_ids = [1, 2]
other_ids = [3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17]

start_date = datetime.date(2025, 12, 1)
end_date = datetime.date(2025, 12, 31)

def get_weekdays(start, end):
    days = []
    current = start
    while current <= end:
        if current.weekday() < 5: # Monday is 0, Sunday is 6
            days.append(current)
        current += datetime.timedelta(days=1)
    return days

weekdays = get_weekdays(start_date, end_date)

# Group by month to drop 4-5 days per month
from collections import defaultdict
days_by_month = defaultdict(list)
for d in weekdays:
    days_by_month[d.month].append(d)

sql_statements = []
sql_statements.append("USE payroll_management_system;")
sql_statements.append("DELETE FROM attendance WHERE date >= '2025-12-01' AND date <= '2025-12-31';")

for emp_id in perfect_ids:
    for day in weekdays:
        time_str = f"{day.strftime('%Y-%m-%d')} 09:00:00"
        sql_statements.append(f"INSERT INTO attendance (employee_id, date, time, status) "
                              f"VALUES ({emp_id}, '{day}', '{time_str}', 'PRESENT');")

for emp_id in other_ids:
    for month, m_days in days_by_month.items():
        # Pick 4 random days to be absent
        absent_days = set(random.sample(m_days, 4))
        for day in m_days:
            if day not in absent_days:
                time_str = f"{day.strftime('%Y-%m-%d')} 09:05:00"
                sql_statements.append(f"INSERT INTO attendance (employee_id, date, time, status) "
                                      f"VALUES ({emp_id}, '{day}', '{time_str}', 'PRESENT');")

with open('seed_attendance.sql', 'w') as f:
    f.write("\n".join(sql_statements))
