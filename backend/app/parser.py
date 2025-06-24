import requests
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Product, Base

def parse_wildberries(search_query):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.wildberries.ru/',
    }
    
    url = f'https://search.wb.ru/exactmatch/ru/common/v4/search?TestGroup=no_test&TestID=no_test&appType=1&curr=rub&dest=-1257786&query={search_query}&resultset=catalog&sort=popular&spp=30&suppressSpellcheck=false'
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        if response.status_code == 200:
            data = response.json()
            products = []
            
            for item in data.get('data', {}).get('products', [])[:50]:  # Берем первые 50 товаров
                products.append({
                    'name': item.get('name', 'Без названия'),
                    'price': float(item.get('priceU', 0)) / 100,
                    'discounted_price': float(item.get('salePriceU', 0)) / 100,
                    'rating': item.get('reviewRating', 0),
                    'reviews_count': item.get('feedbacks', 0),
                    'query': search_query
                })
            return products
        else:
            print(f"Ошибка HTTP: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"Ошибка при парсинге {search_query}: {str(e)}")
        return []

# ... остальной код без изменений ...

def save_to_db(products):
    engine = create_engine('sqlite:///wildberries.db')
    Base.metadata.create_all(engine)
    
    Session = sessionmaker(bind=engine)
    session = Session()
    
    for product in products:
        existing = session.query(Product).filter_by(name=product['name']).first()
        if not existing:
            new_product = Product(
                name=product['name'],
                price=product['price'],
                discounted_price=product['discounted_price'],
                rating=product['rating'],
                reviews_count=product['reviews_count'],
                query=product['query']
            )
            session.add(new_product)
    
    session.commit()
    session.close()

if __name__ == "__main__":
    queries = ["ноутбуки", "телефоны", "наушники"]  # Несколько запросов для теста
    for query in queries:
        products = parse_wildberries(query)
        if products:
            save_to_db(products)
            print(f"Добавлено {len(products)} товаров для запроса '{query}'")
        else:
            print(f"Не удалось получить товары для запроса '{query}'")