pricing = {
    "aws": {"cpu": 8, "ram": 1, "storage": 0.1},
    "azure": {"cpu": 9, "ram": 1.2, "storage": 0.12},
    "gcp": {"cpu": 7.5, "ram": 1.1, "storage": 0.11}
}

def calculate_cost(provider, cpu, ram, storage):
    p = pricing[provider]
    return round(cpu*p["cpu"] + ram*p["ram"] + storage*p["storage"], 2)
