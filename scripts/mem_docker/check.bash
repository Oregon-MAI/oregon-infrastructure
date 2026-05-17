#!/bin/bash
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}" | \
awk '
NR==1 {print; next}
{
    print
    # Извлекаем только число и единицу измерения
    split($2, a, /[A-Za-z]/)
    val = a[1]

    if ($2 ~ /GiB/) total += val * 1024
    else if ($2 ~ /MiB/) total += val
    else if ($2 ~ /KiB/) total += val / 1024
}
END {
    if (total >= 1024) printf "TOTAL\t\t\t\t\t%.2f GiB\t-\n", total/1024
    else printf "TOTAL\t\t\t\t\t%.1f MiB\t-\n", total
}'
