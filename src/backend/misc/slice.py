import json

# Load full Alpaca cleaned
with open("alpaca_data_cleaned.json", "r") as f:
    data = json.load(f)

# Take first 500 examples
mini_data = data[:500]
# next 200
eval_data = data[500:600]
pred_data = data[600:650]
print(len(data),'datadatadata')
print(len(data),'datadatadata')
print(len(data),'datadatadata')
print(len(data),'datadatadata')

# Save mini dataset
with open("mini_alpaca_500.json", "w") as f:
    json.dump(mini_data, f, indent=2)

# Save mini dataset
with open("mini_alpaca_100_eval.json", "w") as f:
    json.dump(eval_data, f, indent=2)

# Save mini dataset
with open("mini_alpaca_50_pred.json", "w") as f:
    json.dump(pred_data, f, indent=2)