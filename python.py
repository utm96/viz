import csv
import json

csv_file_path = 'data/My_Data.csv'
json_file_path = 'output_json_file.json'

data = {'name':'root','children':[]}
data_temp = {}
with open(csv_file_path, mode='r') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    
    for row in csv_reader:
        row_data = {}
        row_data['name'] = row['Job titiles']
        row_data['value'] = row['Tasks']
        row_data['impact'] = int(row['AI Impact'].replace('%',''))
        row_data['workrate'] = row['AI_Workload_Ratio']
        domain = row['Domain']
        if(domain in data_temp):
            data_temp[domain].append(row_data)
        else:
            data_temp[domain] = [row_data] 
        # del row['Domain']  # Remove Domain from the row, as it will be used as the parent key
        # data.setdefault(domain, []).append(row)
    for domain,child in data_temp.items():
        data_domain = {}
        data_domain['name'] = domain
        data_domain['children'] = child
        data['children'].append(data_domain)

with open(json_file_path, mode='w') as json_file:
    json.dump(data, json_file, indent=2)

print(f'Conversion completed. JSON file saved at {json_file_path}')