# modify mod 12
- dockerfile
- app.py for image processor load
- requirements.txt

# store image processor with the model
image_processor = AutoImageProcessor.from_pretrained(local_path, use_fast=True, local_files_only=True)



# Install curl in dockerfile
RUN apt-get update && apt-get install -y curl

CMD-SHELL, curl -f http://localhost:5000 || exit 1

Allow S3 Access in ECSTaskExecution Roles


# API Request
```
import requests
import json

url = "http://app-lb-2030153789.us-east-1.elb.amazonaws.com/api/v1/pose_classifier"
headers = {
  'Content-Type': 'application/json'
}

payload = json.dumps({
  "url": [
    "https://images.pexels.com/photos/1755385/pexels-photo-1755385.jpeg"
  ],
  "user_id": "email@email.com"
})

for i in range(1000):
  response = requests.request("POST", url, headers=headers, data=payload)

print(response.text)

```