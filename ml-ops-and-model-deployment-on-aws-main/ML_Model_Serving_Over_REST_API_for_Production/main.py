from typing import Union

from fastapi import FastAPI
from fastapi import Request

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World!!!"}
    # return "This is string"


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


@app.get("/get_sentiment/{text}")
def get_sentiment(text: str, user_id: Union[str, None] = None):
    return {"text": text, 
            "sentiment": "positive", 
            "user_id": user_id}

@app.get("/get_sentiment_v2/{text}/{ip}")
def get_sentiment_v2(text: str, ip: str, user_id: Union[str, None] = None):
    return {"ip": ip,
            "text": text, 
            "sentiment": "positive", 
            "user_id": user_id}

@app.post("/get_twitter_sentiment")
def get_twitter_sentiment(text: str, ip: str, user_id: Union[str, None] = None):
    return {"ip": ip,
            "text": text, 
            "sentiment": "normal", 
            "user_id": user_id}


@app.post("/get_twitter_sentiment_v2")
async def get_twitter_sentiment_v2(request: Request):
    data = await request.json()

    text:str = data.get('text')
    ip = data.get('ip')
    user_id = data.get('user_id')

    return {"ip": ip,
            "text": text, 
            "sentiment": "normal", 
            "user_id": user_id}





