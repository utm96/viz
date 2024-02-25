import csv
import json

csv_file_path = 'data/My_Data.csv'
json_file_path = 'output_json_file.json'
job_file_path = 'data/job.csv'
json_file_path_output = 'data/data_new.json'

data = {'name':'root','children':[]}
data_temp = {}
data_job = dict()

with open(job_file_path, mode='r') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    print(csv_reader)
    for row in csv_reader:
        print(row)
        value = 0
        try:
            value = int(''.join(i for i in row['Text'] if i.isdigit()))
        except:
            pass
        name = row['ï»¿name']
        data_job[name] = value

with open(csv_file_path, mode='r') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    
    for row in csv_reader:
        row_data = {}
        row_data['name'] = row['Job titiles']
        row_data['value'] = row['Tasks']
        row_data['impact'] = int(row['AI Impact'].replace('%',''))
        row_data['workrate'] = row['AI_Workload_Ratio']
        # calculate percentage of automated Tasks and human tasks
        row_data['w_AI'] = round(int(row['Tasks'])/(1 + 1/float(row['AI_Workload_Ratio'])))
        row_data['w_human'] = int(row['Tasks']) - row_data['w_AI']
        # w_AI in percentage
        row_data['w_AI_percent'] = round(row_data['w_AI'] * 100 / int(row['Tasks']))
        # w_human in percentage
        row_data['w_human_percent'] = 100 - row_data['w_AI_percent']
        row_data['w_AI_all'] = round(5*row_data['w_AI_percent'] +  95*row_data['impact'])

        if(row['Job titiles'] in data_job):
            row_data['job_number'] = data_job[row['Job titiles']]
        else :
            row_data['job_number'] = '0 job'
             
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




with open(json_file_path_output, mode='w') as json_file:
    json.dump(data, json_file, indent=2)

print(f'Conversion completed. JSON file saved at {json_file_path_output}')

# find max_value of w_AI in the json file
max_value = 0
max_value_name = ''
for domain in data['children']:
    for job in domain['children']:
        if job['w_AI'] > max_value:
            max_value = job['w_AI']
            max_value_name = job['name']
print(f'Max value of w_AI is {max_value} for the job {max_value_name}')

# find min_value of w_AI in the json file
min_value = max_value
min_value_name = ''
for domain in data['children']:
    for job in domain['children']:
        if job['w_AI'] < min_value:
            min_value = job['w_AI']
            min_value_name = job['name']
print(f'Min value of w_AI is {min_value} for the job {min_value_name}')