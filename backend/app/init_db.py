from sqlalchemy import create_engine
from .models import Base 

def init_db():
    engine = create_engine('sqlite:///wildberries.db')
    Base.metadata.create_all(engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    from . import models  
    init_db()