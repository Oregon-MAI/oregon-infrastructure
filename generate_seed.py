import datetime
import random
import uuid


def generate_data():
    resource_sqls = []
    booking_sqls = []

    users_count = 100
    meeting_rooms_count = 50
    workspaces_count = 100
    devices_count = 50
    bookings_count = 1000

    user_ids = [str(uuid.uuid4()) for _ in range(users_count)]
    resources = []

    # Meeting rooms
    for i in range(meeting_rooms_count):
        res_id = str(uuid.uuid4())
        name = f"Meeting Room {i + 1}"
        loc = f"Floor {random.randint(1, 5)}"
        resources.append((res_id, name, "meeting_room", loc))

        resource_sqls.append(
            f"INSERT INTO resources (uuid, name, type, location, status) VALUES ('{res_id}', '{name}', 'meeting_room', '{loc}', 'available');"
        )
        resource_sqls.append(
            f"INSERT INTO meeting_rooms (resource_uuid, capacity, has_projector, has_whiteboard) VALUES ('{res_id}', {random.randint(5, 20)}, {str(random.choice([True, False])).lower()}, {str(random.choice([True, False])).lower()});"
        )

    # Workspaces
    for i in range(workspaces_count):
        res_id = str(uuid.uuid4())
        name = f"Workspace {i + 1}"
        loc = f"Floor {random.randint(1, 5)}"
        resources.append((res_id, name, "workspace", loc))

        resource_sqls.append(
            f"INSERT INTO resources (uuid, name, type, location, status) VALUES ('{res_id}', '{name}', 'workspace', '{loc}', 'available');"
        )
        resource_sqls.append(
            f"INSERT INTO workspaces (resource_uuid, has_monitor) VALUES ('{res_id}', {str(random.choice([True, False])).lower()});"
        )

    # Devices
    for i in range(devices_count):
        res_id = str(uuid.uuid4())
        name = f"Device {i + 1}"
        loc = "Storage"
        resources.append((res_id, name, "device", loc))

        resource_sqls.append(
            f"INSERT INTO resources (uuid, name, type, location, status) VALUES ('{res_id}', '{name}', 'device', '{loc}', 'available');"
        )
        resource_sqls.append(
            f"INSERT INTO devices (resource_uuid, device_type, serial_number, model) VALUES ('{res_id}', 'Laptop', 'SN-{random.randint(1000, 99999)}', 'Model X');"
        )

    # Bookings
    now = datetime.datetime.now(datetime.timezone.utc)
    for _ in range(bookings_count):
        book_id = str(uuid.uuid4())
        res = random.choice(resources)
        user_id = random.choice(user_ids)

        start_time = now + datetime.timedelta(
            days=random.randint(0, 10), hours=random.randint(0, 5)
        )
        end_time = start_time + datetime.timedelta(hours=random.randint(1, 4))

        status = random.choice(["confirmed", "canceled"])

        booking_sqls.append(
            f"INSERT INTO bookings (booking_id, resource_id, user_id, resource_name, resource_location, resource_type, starts_at, ends_at, status) VALUES ('{book_id}', '{res[0]}', '{user_id}', '{res[1]}', '{res[3]}', '{res[2]}', '{start_time.isoformat()}', '{end_time.isoformat()}', '{status}');"
        )

    with open("seed_resources.sql", "w") as f:
        f.write("\n".join(resource_sqls))

    with open("seed_bookings.sql", "w") as f:
        f.write("\n".join(booking_sqls))


if __name__ == "__main__":
    generate_data()
