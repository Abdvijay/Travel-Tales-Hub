import os

class Config:
    SECRET_KEY = "your_secret_key"
    SQLALCHEMY_DATABASE_URI = "sqlite:///travel_tales.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False