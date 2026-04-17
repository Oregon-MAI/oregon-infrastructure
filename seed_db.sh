#!/bin/bash
python3 generate_seed.py

echo "Applying seed data to resource-service..."
docker compose exec -T postgres-resource-service psql -U postgres -d resource_service < seed_resources.sql

echo "Applying seed data to booking-service..."
docker compose exec -T booking-postgres psql -U postgres -d booking_service < seed_bookings.sql

echo "Done!"
