from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Product(Base):
    __tablename__ = 'products'
    
    id = Column(Integer, primary_key=True)
    name = Column(String)
    price = Column(Float)
    discounted_price = Column(Float)
    rating = Column(Float)
    reviews_count = Column(Integer)
    query = Column(String)  # для хранения поискового запроса/категории