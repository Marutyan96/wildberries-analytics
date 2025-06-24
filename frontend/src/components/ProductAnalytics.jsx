import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, 
  Slider, 
  Row, 
  Col, 
  Card, 
  Typography, 
  Space, 
  Spin,
  Badge,
  Progress,
  Statistic 
} from 'antd';
import { 
  Bar, 
  Line 
} from 'react-chartjs-2';
import { 
  ShoppingCartOutlined, 
  StarOutlined, 
  DollarOutlined,
  FilterOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { debounce } from 'lodash';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  Title as ChartTitle, 
  Tooltip, 
  Legend 
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend
);

const { Title, Text } = Typography;

const ProductAnalytics = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 100000,
    minRating: 0,
    minReviews: 0
  });
  const [sortedInfo, setSortedInfo] = useState({
    columnKey: 'name',
    order: 'ascend',
  });

  useEffect(() => {
    setIsMounted(true);
    fetchProducts();
    return () => setIsMounted(false);
  }, [filters]);

  const fetchProducts = async () => {
    if (!isMounted) return;
    
    setLoading(true);
    try {
      const params = {
        min_price: filters.minPrice,
        max_price: filters.maxPrice,
        min_rating: filters.minRating,
        min_reviews: filters.minReviews
      };
      
      const response = await axios.get('http://localhost:8000/api/products/', { 
        params,
        timeout: 5000 
      });
      
      if (isMounted) {
        setProducts(response.data || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  const handleFilterChange = debounce((newFilters) => {
    setFilters(newFilters);
  }, 500);

  const handleTableChange = (pagination, filters, sorter) => {
    setSortedInfo(sorter);
  };

  const columns = [
    {
      title: <span><ShoppingCartOutlined /> Название</span>,
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortOrder: sortedInfo.columnKey === 'name' && sortedInfo.order,
      width: 250,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: <span><DollarOutlined /> Цена</span>,
      dataIndex: 'price',
      key: 'price',
      sorter: (a, b) => a.price - b.price,
      sortOrder: sortedInfo.columnKey === 'price' && sortedInfo.order,
      render: (price) => (
        <Badge 
          count={`${price.toLocaleString('ru-RU')} ₽`} 
          style={{ backgroundColor: '#1890ff' }} 
        />
      ),
      width: 150,
    },
    {
      title: <span><DollarOutlined /> Со скидкой</span>,
      dataIndex: 'discounted_price',
      key: 'discounted_price',
      sorter: (a, b) => a.discounted_price - b.discounted_price,
      sortOrder: sortedInfo.columnKey === 'discounted_price' && sortedInfo.order,
      render: (price, record) => (
        <div>
          <Text delete={price !== record.price} type={price === record.price ? undefined : 'success'}>
            {price.toLocaleString('ru-RU')} ₽
          </Text>
          {price !== record.price && (
            <Progress 
              percent={Math.round((1 - price/record.price)*100)} 
              size="small" 
              status="active"
              showInfo={false}
            />
          )}
        </div>
      ),
      width: 150,
    },
    {
      title: <span><StarOutlined /> Рейтинг</span>,
      dataIndex: 'rating',
      key: 'rating',
      sorter: (a, b) => a.rating - b.rating,
      sortOrder: sortedInfo.columnKey === 'rating' && sortedInfo.order,
      render: (rating) => (
        <Progress
          percent={rating * 20}
          format={() => rating.toFixed(1)}
          strokeColor={rating > 4 ? '#52c41a' : rating > 3 ? '#faad14' : '#f5222d'}
          size="small"
        />
      ),
      width: 150,
    },
    {
      title: 'Отзывы',
      dataIndex: 'reviews_count',
      key: 'reviews_count',
      sorter: (a, b) => a.reviews_count - b.reviews_count,
      sortOrder: sortedInfo.columnKey === 'reviews_count' && sortedInfo.order,
      render: (count) => (
        <Text type={count > 100 ? 'success' : count > 50 ? 'warning' : 'secondary'}>
          {count}
        </Text>
      ),
      width: 100,
    },
  ];

  const { priceData, discountData, stats } = useMemo(() => {
    const stats = {
      total: products.length,
      avgPrice: products.reduce((sum, p) => sum + p.price, 0) / (products.length || 1),
      avgDiscount: products.reduce((sum, p) => sum + (p.price - p.discounted_price), 0) / (products.length || 1),
      avgRating: products.reduce((sum, p) => sum + p.rating, 0) / (products.length || 1),
    };

    const priceRanges = [0, 1000, 3000, 5000, 10000, Infinity];
    const priceCounts = new Array(priceRanges.length - 1).fill(0);

    products.forEach(p => {
      for (let i = 0; i < priceRanges.length - 1; i++) {
        if (p.price > priceRanges[i] && p.price <= priceRanges[i + 1]) {
          priceCounts[i]++;
          break;
        }
      }
    });

    const sampleProducts = products.slice(0, 15);
    const discountValues = sampleProducts.map(p => Math.round(p.price - p.discounted_price));

    return {
      stats,
      priceData: {
        labels: ['0-1k', '1k-3k', '3k-5k', '5k-10k', '10k+'],
        datasets: [{
          label: 'Количество товаров',
          data: priceCounts,
          backgroundColor: '#1890ff',
          borderRadius: 4,
        }]
      },
      discountData: {
        labels: sampleProducts.map(p => p.name.substring(0, 15) + (p.name.length > 15 ? '...' : '')),
        datasets: [{
          label: 'Размер скидки (₽)',
          data: discountValues,
          borderColor: '#ff4d4f',
          backgroundColor: 'rgba(255, 77, 79, 0.1)',
          tension: 0.3,
          fill: true,
        }]
      }
    };
  }, [products]);

  if (loading && products.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh'
      }}>
        <Spin size="large">
          <div style={{ marginTop: 16 }}>Загрузка данных...</div>
        </Spin>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card
          styles={{
            header: { borderBottom: 0 },
            body: { paddingBottom: 0 }
          }}
        >
          <Title level={2} style={{ marginBottom: 0 }}>
            📊 Wildberries Analytics
          </Title>
          <Text type="secondary">
            Анализ цен, рейтингов и отзывов в реальном времени
          </Text>
        </Card>

        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <StatisticCard
                title="Товаров"
                value={stats.total}
                icon={<ShoppingCartOutlined />}
                color="#1890ff"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <StatisticCard
                title="Средняя цена"
                value={Math.round(stats.avgPrice)}
                suffix="₽"
                icon={<DollarOutlined />}
                color="#52c41a"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <StatisticCard
                title="Средняя скидка"
                value={Math.round(stats.avgDiscount)}
                suffix="₽"
                icon={<DollarOutlined />}
                color="#722ed1"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <StatisticCard
                title="Средний рейтинг"
                value={stats.avgRating.toFixed(1)}
                icon={<StarOutlined />}
                color="#faad14"
              />
            </Card>
          </Col>
        </Row>

        <Card 
          title={<span><FilterOutlined /> Фильтры</span>}
          styles={{
            header: { borderBottom: 0 }
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <div>
                <Text strong>Диапазон цен</Text>
                <Slider
                  range
                  min={0}
                  max={100000}
                  step={100}
                  value={[filters.minPrice, filters.maxPrice]}
                  onChange={(value) => handleFilterChange({
                    ...filters,
                    minPrice: value[0],
                    maxPrice: value[1]
                  })}
                  tooltip={{ 
                    formatter: value => `${value.toLocaleString('ru-RU')} ₽`,
                    color: '#1890ff'
                  }}
                />
                <Text type="secondary">
                  {filters.minPrice.toLocaleString('ru-RU')} ₽ — {filters.maxPrice.toLocaleString('ru-RU')} ₽
                </Text>
              </div>
            </Col>
            
            <Col xs={24} md={8}>
              <div>
                <Text strong>Минимальный рейтинг</Text>
                <Slider
                  min={0}
                  max={5}
                  step={0.1}
                  value={filters.minRating}
                  onChange={(value) => handleFilterChange({...filters, minRating: value})}
                  tooltip={{ 
                    formatter: value => value.toFixed(1),
                    color: '#1890ff'
                  }}
                />
                <Text type="secondary">
                  От {filters.minRating.toFixed(1)} ★
                </Text>
              </div>
            </Col>
            
            <Col xs={24} md={8}>
              <div>
                <Text strong>Минимум отзывов</Text>
                <Slider
                  min={0}
                  max={1000}
                  step={10}
                  value={filters.minReviews}
                  onChange={(value) => handleFilterChange({...filters, minReviews: value})}
                  tooltip={{ 
                    color: '#1890ff'
                  }}
                />
                <Text type="secondary">
                  От {filters.minReviews} отзывов
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        <Card 
          title={`📋 Список товаров (${products.length})`}
          extra={
            <Text type="secondary">
              Обновлено: {new Date().toLocaleTimeString()}
            </Text>
          }
        >
          <Table
            columns={columns}
            dataSource={products}
            loading={loading}
            rowKey="id"
            onChange={handleTableChange}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              position: ['bottomRight'],
              showTotal: (total) => `Всего ${total} товаров`
            }}
            scroll={{ x: 800 }}
            size="middle"
          />
        </Card>

        <Card title="📈 Визуализация данных">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card 
                title="Распределение цен" 
                styles={{
                  header: { borderBottom: 0 },
                  body: { paddingTop: 0 }
                }}
              >
                <div style={{ height: 300 }}>
                  <Bar 
                    data={priceData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => `${ctx.raw} товаров (${ctx.parsed.x})`
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                          }
                        },
                        x: {
                          grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card 
                title="Зависимость скидки от рейтинга"
                styles={{
                  header: { borderBottom: 0 },
                  body: { paddingTop: 0 }
                }}
              >
                <div style={{ height: 300 }}>
                  <Line
                    data={discountData}
                    options={{
                      responsive: true,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: (ctx) => `${ctx.raw} ₽ скидка`
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                          }
                        },
                        x: {
                          grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
};

const StatisticCard = ({ title, value, suffix, icon, color }) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <div style={{ 
      backgroundColor: `${color}20`,
      borderRadius: '50%',
      width: 48,
      height: 48,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16
    }}>
      {React.cloneElement(icon, { 
        style: { 
          fontSize: 20,
          color 
        } 
      })}
    </div>
    <div>
      <Text type="secondary">{title}</Text>
      <Title level={3} style={{ margin: 0 }}>
        {value}{suffix && <small> {suffix}</small>}
      </Title>
    </div>
  </div>
);

export default ProductAnalytics;