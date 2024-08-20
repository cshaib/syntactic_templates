import os
import pandas as pd

data_directory = 'data/'







# Convert each CSV file to JSON
for csv_file in csv_files:
    # Read the CSV file into a pandas DataFrame
    df = pd.read_csv(os.path.join(csv_directory, csv_file))
    
    # Convert the DataFrame to JSON
    json_data = df.to_json(orient='records')
    
    # Specify the output JSON file path
    json_file = os.path.splitext(csv_file)[0] + '.jsonl'
    df.to_json(json_file, orient='records')
    # json_path = os.path.join(csv_directory, json_file)
    
    # # Write the JSON data to the output file
    # with open(json_path, 'w') as f:
    #     f.write(json_data)

