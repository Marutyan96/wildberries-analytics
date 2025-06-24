from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, and_
from sqlalchemy.orm import sessionmaker
from .models import Product, Base

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Разрешить фронтенд
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = create_engine('sqlite:///wildberries.db')
Session = sessionmaker(bind=engine)

@app.get("/api/products/")
def get_products(
    min_price: float = Query(None, description="Минимальная цена"),
    max_price: float = Query(None, description="Максимальная цена"),
    min_rating: float = Query(None, description="Минимальный рейтинг"),
    min_reviews: int = Query(None, description="Минимальное количество отзывов")
):
    session = Session()
    query = session.query(Product)
    
    filters = []
    if min_price is not None:
        filters.append(Product.price >= min_price)
    if max_price is not None:
        filters.append(Product.price <= max_price)
    if min_rating is not None:
        filters.append(Product.rating >= min_rating)
    if min_reviews is not None:
        filters.append(Product.reviews_count >= min_reviews)
    
    if filters:
        query = query.filter(and_(*filters))
    
    products = query.all()
    session.close()
    
    return [
        {
            "id": p.id,
            "name": p.name,
            "price": p.price,
            "discounted_price": p.discounted_price,
            "rating": p.rating,
            "reviews_count": p.reviews_count
        }
        for p in products
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)