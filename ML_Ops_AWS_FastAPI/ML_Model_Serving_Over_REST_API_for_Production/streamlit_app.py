# python -m streamlit run streamlit_app.py
# python -m streamlit run streamlit_app.py --server.enableXsrfProtection false

import streamlit as st
import requests
from scripts import s3

# Define the API endpoint
API_URL = "http://127.0.0.1:8502/api/v1/"
headers = {
  'Content-Type': 'application/json'
}

st.title("ML Model Serving Over REST API")

model = st.selectbox("Select Model",
                     ["Sentiment Classifier", 
                      "Disaster Classifier", "Pose Classifier"])

if model=="Sentiment Classifier":
    text = st.text_area("Enter Your Movie Review")
    user_id = st.text_input("Enter user id", "udemy@kgptalkie.com")

    data = {"text": [text], "user_id": user_id}
    model_api = "sentiment_analysis"

elif model=="Disaster Classifier":
    text = st.text_area("Enter Your Tweet")
    user_id = st.text_input("Enter user id", "udemy@kgptalkie.com")

    data = {"text": [text], "user_id": user_id}
    model_api = "disaster_classifier"

elif model=="Pose Classifier":
    select_file = st.radio("Select the image source", ["Local", "URL"])

    if select_file=="URL":
        url = st.text_input("Enter Your Image Url")

    else:
        image = st.file_uploader("Upload the image", type=["jpg", "jpeg", "png"])
        file_name = "images/temp.jpg"

        if image is not None:
            with open(file_name, "wb") as f:
                f.write(image.read())

        url = s3.upload_image_to_s3(file_name)


    user_id = st.text_input("Enter user id", "udemy@kgptalkie.com")

    data = {"url": [url], "user_id": user_id}
    model_api = "pose_classifier"

if st.button("Predict"):
    with st.spinner("Predicting... Please wait!!!"):
        response = requests.post(API_URL+model_api, headers=headers,
                                 json=data)
        
        output = response.json()

    st.write(output)