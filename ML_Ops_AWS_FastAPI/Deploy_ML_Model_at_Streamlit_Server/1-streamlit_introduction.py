## Streamlit Application Basics
# Full Streamlit Code Repository: https://github.com/laxmimerit/streamlit-tutorials
# Complete Streamlit YouTube Playlist: https://www.youtube.com/playlist?list=PLc2rvfiptPSSpZ99EnJbH5LjTJ_nOoSWW

# streamlit run 1-streamlit_introduction.py
# python -m streamlit run 1-streamlit_introduction.py

import streamlit as st
import time
from PIL import Image

st.title("Machine Learning Model Deployment at the Server!!!")

# header
st.header("Introduction: This is heading")

# subheading
st.subheader("This is subheader")

# text data
st.text("This is text")

# read input from the user
input_text = st.text_input("Type something", "type here...")
st.text(input_text)

input_text = st.text_area("Enter here", "this is large text area")

## markdown
st.markdown("This text is ___really important___.")
st.markdown("###### This is heading")
st.markdown("""1. First item
2. Second item
3. Third item
4. Fourth item""")

# Button
button = st.button("Click Me")
if button:
    st.text("I am clicked!")
    st.info("I am clicked!!! Snap me fast!!!")
    st.toast("I am disappear")
    st.warning("This warning")
    st.error("This is error")


# Image
st.image("https://images.pexels.com/photos/674010/pexels-photo-674010.jpeg?cs=srgb&dl=pexels-anjana-c-169994-674010.jpg", width=100)

img = Image.open("kgptalkie.png")
st.image(img, width=100)

# check box
flag = st.checkbox("Select me")
st.write(flag)
if flag:
    img = Image.open("kgptalkie.png")
    st.image(img, width=100)

# radio button
selection = st.radio("Choose your model", ["NLP", "Image", "Audio"])
st.write(selection)

# select box
selection = st.selectbox("Choose your model", ["NLP", "Image", "Audio"])
st.write(selection)

# multi select
selection = st.multiselect("Choose your model", ["NLP", "Image", "Audio"])
st.write(selection)


with st.spinner("Downloading... Please wait!"):
    st.write("download your model here")
    time.sleep(10)
    
# select numerical value from the given list
# TH = 0.5, large TH -> high precision, small TH -> high recall
st.slider("Set Threshold", 0, 100, step=10)
