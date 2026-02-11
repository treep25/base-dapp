# Kafka, Микросервисы и Коммуникации — Полное Руководство 2025

---

## Содержание

1. [Kafka в крупных компаниях (Netflix, Uber)](#1-kafka-в-крупных-компаниях)
2. [Почему Kafka лучше](#2-почему-kafka-лучше)
3. [Масштабирование Kafka](#3-масштабирование-kafka)
4. [Проблемы HTTP/REST между сервисами](#4-проблемы-httprest-между-сервисами)
5. [Kubernetes vs Kafka — масштабируемость](#5-kubernetes-vs-kafka--масштабируемость)
6. [Виды коммуникации в микросервисах](#6-виды-коммуникации-в-микросервисах)
7. [gRPC — подробно с примерами](#7-grpc--подробно-с-примерами)
8. [Kafka vs RabbitMQ vs ActiveMQ](#8-kafka-vs-rabbitmq-vs-activemq)
9. [Amazon Kinesis](#9-amazon-kinesis)
10. [Экземпляры брокеров — масштабирование](#10-экземпляры-брокеров--масштабирование)
11. [Kafka для потокового анализа](#11-kafka-для-потокового-анализа)
12. [Телеметрия](#12-телеметрия)
13. [Быстрый отклик — gRPC, TCP, HTTP](#13-быстрый-отклик--grpc-tcp-http)
14. [Kafka: партиции, топики, брокеры, мультитенантность](#14-kafka-партиции-топики-брокеры-мультитенантность)
15. [ZooKeeper и Dead Letter Topic](#15-zookeeper-и-dead-letter-topic)
16. [RestTemplate — Best Practices 2025](#16-resttemplate--best-practices-2025)

---

## 1. Kafka в крупных компаниях

### Netflix

Netflix использует Kafka + MQTT для управления миллионами устройств:

- MQTT сообщения трансформируются в записи Kafka
- Ключом записи служит MQTT-топик для гарантии порядка по session ID устройства
- Используют **Alpakka-Kafka + Akka** вместо Spring KafkaListener из-за лучшей поддержки **back-pressure** и динамической адаптации к нагрузке
- Real-time телеметрия, стриминг логов, мониторинг миллионов потоков одновременно

### Uber

- Kafka — центральная шина событий для трекинга, гео-обновлений, маршрутизации
- Миллионы событий в секунду с минимальной задержкой
- **Tiered Storage** (KIP-405) — хранение старых сегментов в S3, горячие данные локально
- Event sourcing для финансовых транзакций, аудита

### LinkedIn (создатели Kafka)

- Обрабатывают **7+ триллионов сообщений в день**
- Центральная платформа для метрик, логов, change data capture

---

## 2. Почему Kafka лучше

### Ключевые преимущества

| Характеристика | Описание |
|----------------|----------|
| **Throughput** | Миллионы сообщений/сек благодаря sequential I/O, zero-copy, batching |
| **Retention & Replay** | Сообщения сохраняются по настроенному времени, можно читать с любого offset |
| **Горизонтальное масштабирование** | Добавление брокеров и партиций без даунтайма |
| **Отказоустойчивость** | Репликация партиций, автоматический failover лидеров |
| **Decoupling** | Producer и Consumer полностью независимы |
| **Ordering** | Гарантия порядка внутри партиции |

### Когда Kafka НЕ лучший выбор

- Требуется запрос-ответ с минимальной задержкой → gRPC/REST быстрее
- Сложная маршрутизация сообщений → RabbitMQ гибче
- Простой use-case с низкой нагрузкой → избыточная сложность
- Нет ресурсов на инфраструктуру → managed решения (Kinesis)

---

## 3. Масштабирование Kafka

### Горизонтальное масштабирование

```
Было:  [Broker 1] [Broker 2] [Broker 3]
              ↓
Стало: [Broker 1] [Broker 2] [Broker 3] [Broker 4] [Broker 5] [Broker 6]
```

**Что делается:**
- Добавление новых брокеров в кластер
- Увеличение числа партиций в топиках
- Перераспределение партиций между брокерами (rebalance)
- Репликация партиций на разные узлы

**Плюсы:**
- Линейный рост throughput
- Улучшенная отказоустойчивость
- Нет hardware-лимитов

**Минусы:**
- Overhead на метаданные и координацию
- Требует rebalancing при изменениях
- Сложнее мониторинг

### Вертикальное масштабирование

**Что делается:**
- Больше CPU cores
- Больше RAM
- Быстрые SSD/NVMe диски
- Увеличение network bandwidth

**Плюсы:**
- Быстрая реализация
- Не требует rebalancing

**Минусы:**
- Hardware лимиты
- Единая точка отказа
- Стоимость растёт нелинейно

### Рекомендации Confluent

```properties
# Оптимальные настройки для масштабирования
num.partitions=6                    # Начальное значение
default.replication.factor=3        # Минимум для production
min.insync.replicas=2               # Гарантия записи
acks=all                            # Надёжность

# Лимиты
# ~100-200 партиций на брокер для начала
# Максимум ~4000 партиций на брокер
```

---

## 4. Проблемы HTTP/REST между сервисами

### Почему HTTP/REST плохо подходит для inter-service коммуникации

```
┌─────────┐   HTTP/JSON   ┌─────────┐   HTTP/JSON   ┌─────────┐
│Service A│──────────────▶│Service B│──────────────▶│Service C│
└─────────┘               └─────────┘               └─────────┘
     ↑                         ↑                         ↑
     │                         │                         │
  Latency                   Latency                   Latency
  + Parsing                 + Parsing                 + Parsing
  + Serialization          + Serialization           = TOTAL: 3x overhead
```

### Основные проблемы

| Проблема | Описание |
|----------|----------|
| **Синхронность** | Caller блокируется, ждёт ответ. Если B упал → A зависает |
| **Cascading failures** | Один медленный сервис тормозит всю цепочку |
| **JSON overhead** | Текстовый формат, больше байт, медленный парсинг |
| **HTTP/1.1 limitations** | Head-of-line blocking, нет multiplexing |
| **Нет стриминга** | Каждый запрос = новое соединение (или keep-alive с ограничениями) |
| **Retry complexity** | Нужно самостоятельно реализовать retry, timeout, circuit breaker |

### RestTemplate — конкретные проблемы

```java
// ❌ Так делать в 2025 не надо
@Service
public class OrderService {
    private final RestTemplate restTemplate;
    
    public Order createOrder(OrderRequest request) {
        // Блокирующий вызов — поток занят пока ждём ответ
        User user = restTemplate.getForObject(
            "http://user-service/users/{id}", 
            User.class, 
            request.getUserId()
        );
        
        // Ещё один блокирующий вызов
        Inventory inventory = restTemplate.getForObject(
            "http://inventory-service/check/{productId}",
            Inventory.class,
            request.getProductId()
        );
        
        // При 100 concurrent requests = 100 заблокированных потоков
        // Thread pool exhaustion при 1000+ RPS
    }
}
```

---

## 5. Kubernetes vs Kafka — масштабируемость

**Это разные инструменты для разных задач. Они дополняют друг друга.**

| Аспект | Kubernetes | Kafka |
|--------|------------|-------|
| **Что масштабирует** | Контейнеры/поды с приложениями | Потоки данных/сообщений |
| **Тип масштабирования** | Compute (CPU/RAM) | Data (throughput/storage) |
| **Unit of scale** | Pod/Deployment | Partition/Broker |
| **Autoscaling** | HPA (Horizontal Pod Autoscaler) | Manual или через операторы |
| **State** | Stateless-first | Stateful by design |
| **Гарантии** | Нет гарантий доставки между подами | At-least-once, exactly-once семантика |

### Как они работают вместе

```
┌────────────────────────────────────────────────────────────┐
│                      Kubernetes Cluster                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Producer Pod │  │ Producer Pod │  │ Producer Pod │      │
│  │   (x3 HPA)   │  │   (x3 HPA)   │  │   (x3 HPA)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         ▼                 ▼                 ▼               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Kafka Cluster                     │   │
│  │   [Broker 1]   [Broker 2]   [Broker 3]              │   │
│  │   Partition 0   Partition 1  Partition 2             │   │
│  └─────────────────────────────────────────────────────┘   │
│         │                 │                 │               │
│         ▼                 ▼                 ▼               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Consumer Pod │  │ Consumer Pod │  │ Consumer Pod │      │
│  │   (x3 HPA)   │  │   (x3 HPA)   │  │   (x3 HPA)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────────────────────────────────────┘
```

- **K8s** масштабирует producers/consumers (поды)
- **Kafka** масштабирует throughput (партиции/брокеры)
- Оба нужны для полноценной масштабируемой системы

---

## 6. Виды коммуникации в микросервисах

### Обзор

```
                    ┌─────────────────────────────────────┐
                    │     Microservice Communication      │
                    └─────────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
    ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
    │   Synchronous   │     │  Asynchronous   │     │  Event-Driven   │
    │                 │     │                 │     │                 │
    │ • REST/HTTP     │     │ • Message Queue │     │ • Pub/Sub       │
    │ • gRPC          │     │ • Task Queue    │     │ • Event Store   │
    │ • GraphQL       │     │                 │     │ • CQRS          │
    └─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Сравнительная таблица

| Тип | Протокол/Инструмент | Latency | Coupling | Failure Handling | Use Case |
|-----|---------------------|---------|----------|------------------|----------|
| **Sync Request-Response** | REST, gRPC | Низкая | Высокий | Сложное | CRUD, Query |
| **Async Message Queue** | RabbitMQ, ActiveMQ | Средняя | Низкий | Retry, DLQ | Tasks, Jobs |
| **Event Streaming** | Kafka, Kinesis | Низкая-Средняя | Очень низкий | Replay | Analytics, Audit |
| **Pub/Sub** | Redis Pub/Sub, SNS | Очень низкая | Средний | Fire-and-forget | Notifications |

### Как выбрать

```
Нужен немедленный ответ?
├── Да → Критична latency < 10ms?
│         ├── Да → gRPC / TCP
│         └── Нет → REST / GraphQL
└── Нет → Нужна гарантия доставки?
          ├── Да → Нужен replay/audit?
          │         ├── Да → Kafka
          │         └── Нет → RabbitMQ
          └── Нет → Redis Pub/Sub / SNS
```

---

## 7. gRPC — подробно с примерами

### Что такое gRPC

- **g**oogle **R**emote **P**rocedure **C**all
- Работает поверх **HTTP/2**
- Использует **Protocol Buffers** (бинарная сериализация)
- Строгий контракт через `.proto` файлы

### Виды коммуникации в gRPC

```
┌────────────────────────────────────────────────────────────────┐
│                      gRPC Communication Patterns               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. UNARY (Request-Response)                                   │
│     Client ──────Request─────▶ Server                          │
│     Client ◀─────Response───── Server                          │
│                                                                │
│  2. SERVER STREAMING                                           │
│     Client ──────Request─────▶ Server                          │
│     Client ◀─────Stream[1]──── Server                          │
│     Client ◀─────Stream[2]──── Server                          │
│     Client ◀─────Stream[N]──── Server                          │
│                                                                │
│  3. CLIENT STREAMING                                           │
│     Client ──────Stream[1]───▶ Server                          │
│     Client ──────Stream[2]───▶ Server                          │
│     Client ──────Stream[N]───▶ Server                          │
│     Client ◀─────Response───── Server                          │
│                                                                │
│  4. BIDIRECTIONAL STREAMING                                    │
│     Client ◀─────Stream──────▶ Server                          │
│     (обе стороны отправляют независимо)                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Пример: Proto файл

```protobuf
// order_service.proto
syntax = "proto3";

package order;

option java_multiple_files = true;
option java_package = "com.example.grpc.order";

// Unary
service OrderService {
    // 1. Unary - простой запрос-ответ
    rpc CreateOrder(CreateOrderRequest) returns (OrderResponse);
    
    // 2. Server Streaming - получить все заказы пользователя потоком
    rpc GetUserOrders(GetUserOrdersRequest) returns (stream OrderResponse);
    
    // 3. Client Streaming - batch создание заказов
    rpc CreateBulkOrders(stream CreateOrderRequest) returns (BulkOrderResponse);
    
    // 4. Bidirectional - real-time order updates
    rpc OrderUpdates(stream OrderStatusRequest) returns (stream OrderStatusResponse);
}

message CreateOrderRequest {
    string user_id = 1;
    string product_id = 2;
    int32 quantity = 3;
}

message OrderResponse {
    string order_id = 1;
    string status = 2;
    int64 created_at = 3;
}

message GetUserOrdersRequest {
    string user_id = 1;
}

message BulkOrderResponse {
    int32 success_count = 1;
    int32 failed_count = 2;
}

message OrderStatusRequest {
    string order_id = 1;
}

message OrderStatusResponse {
    string order_id = 1;
    string status = 2;
    int64 updated_at = 3;
}
```

### Пример: Java Server

```java
@GrpcService
public class OrderGrpcService extends OrderServiceGrpc.OrderServiceImplBase {

    private final OrderRepository orderRepository;

    // 1. UNARY
    @Override
    public void createOrder(CreateOrderRequest request, 
                           StreamObserver<OrderResponse> responseObserver) {
        Order order = orderRepository.save(
            new Order(request.getUserId(), request.getProductId(), request.getQuantity())
        );
        
        OrderResponse response = OrderResponse.newBuilder()
            .setOrderId(order.getId())
            .setStatus("CREATED")
            .setCreatedAt(System.currentTimeMillis())
            .build();
        
        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    // 2. SERVER STREAMING
    @Override
    public void getUserOrders(GetUserOrdersRequest request,
                             StreamObserver<OrderResponse> responseObserver) {
        List<Order> orders = orderRepository.findByUserId(request.getUserId());
        
        for (Order order : orders) {
            OrderResponse response = OrderResponse.newBuilder()
                .setOrderId(order.getId())
                .setStatus(order.getStatus())
                .setCreatedAt(order.getCreatedAt())
                .build();
            
            responseObserver.onNext(response); // Отправляем каждый заказ по очереди
        }
        
        responseObserver.onCompleted();
    }

    // 3. CLIENT STREAMING
    @Override
    public StreamObserver<CreateOrderRequest> createBulkOrders(
            StreamObserver<BulkOrderResponse> responseObserver) {
        
        return new StreamObserver<>() {
            private int successCount = 0;
            private int failedCount = 0;

            @Override
            public void onNext(CreateOrderRequest request) {
                try {
                    orderRepository.save(new Order(
                        request.getUserId(), 
                        request.getProductId(), 
                        request.getQuantity()
                    ));
                    successCount++;
                } catch (Exception e) {
                    failedCount++;
                }
            }

            @Override
            public void onError(Throwable t) {
                // Handle error
            }

            @Override
            public void onCompleted() {
                responseObserver.onNext(BulkOrderResponse.newBuilder()
                    .setSuccessCount(successCount)
                    .setFailedCount(failedCount)
                    .build());
                responseObserver.onCompleted();
            }
        };
    }

    // 4. BIDIRECTIONAL STREAMING
    @Override
    public StreamObserver<OrderStatusRequest> orderUpdates(
            StreamObserver<OrderStatusResponse> responseObserver) {
        
        return new StreamObserver<>() {
            @Override
            public void onNext(OrderStatusRequest request) {
                // Клиент подписывается на обновления заказа
                Order order = orderRepository.findById(request.getOrderId());
                
                OrderStatusResponse response = OrderStatusResponse.newBuilder()
                    .setOrderId(order.getId())
                    .setStatus(order.getStatus())
                    .setUpdatedAt(order.getUpdatedAt())
                    .build();
                
                responseObserver.onNext(response);
            }

            @Override
            public void onError(Throwable t) {
                // Handle error
            }

            @Override
            public void onCompleted() {
                responseObserver.onCompleted();
            }
        };
    }
}
```

### Пример: Java Client

```java
@Service
public class OrderGrpcClient {

    private final OrderServiceGrpc.OrderServiceBlockingStub blockingStub;
    private final OrderServiceGrpc.OrderServiceStub asyncStub;

    public OrderGrpcClient(ManagedChannel channel) {
        this.blockingStub = OrderServiceGrpc.newBlockingStub(channel);
        this.asyncStub = OrderServiceGrpc.newStub(channel);
    }

    // 1. Unary call
    public OrderResponse createOrder(String userId, String productId, int quantity) {
        CreateOrderRequest request = CreateOrderRequest.newBuilder()
            .setUserId(userId)
            .setProductId(productId)
            .setQuantity(quantity)
            .build();
        
        return blockingStub.createOrder(request);
    }

    // 2. Server streaming
    public List<OrderResponse> getUserOrders(String userId) {
        GetUserOrdersRequest request = GetUserOrdersRequest.newBuilder()
            .setUserId(userId)
            .build();
        
        List<OrderResponse> orders = new ArrayList<>();
        Iterator<OrderResponse> iterator = blockingStub.getUserOrders(request);
        
        while (iterator.hasNext()) {
            orders.add(iterator.next());
        }
        
        return orders;
    }

    // 3. Client streaming
    public CompletableFuture<BulkOrderResponse> createBulkOrders(List<CreateOrderRequest> requests) {
        CompletableFuture<BulkOrderResponse> future = new CompletableFuture<>();
        
        StreamObserver<BulkOrderResponse> responseObserver = new StreamObserver<>() {
            @Override
            public void onNext(BulkOrderResponse response) {
                future.complete(response);
            }

            @Override
            public void onError(Throwable t) {
                future.completeExceptionally(t);
            }

            @Override
            public void onCompleted() {}
        };
        
        StreamObserver<CreateOrderRequest> requestObserver = 
            asyncStub.createBulkOrders(responseObserver);
        
        for (CreateOrderRequest request : requests) {
            requestObserver.onNext(request);
        }
        requestObserver.onCompleted();
        
        return future;
    }
}
```

### gRPC vs REST — Performance

| Метрика | REST (JSON) | gRPC (Protobuf) | Разница |
|---------|-------------|-----------------|---------|
| **Payload size** | 100 bytes | ~50 bytes | **2x меньше** |
| **Serialization** | ~1ms | ~0.1ms | **10x быстрее** |
| **Latency (small)** | ~5ms | ~2ms | **2.5x быстрее** |
| **Latency (large)** | ~50ms | ~15ms | **3x быстрее** |
| **Throughput** | ~10K RPS | ~50K RPS | **5x больше** |

---

## 8. Kafka vs RabbitMQ vs ActiveMQ

### Архитектурные различия

```
KAFKA (Log-based)
─────────────────
Topic: orders
┌─────────────────────────────────────────────────────────┐
│ Partition 0: [msg1][msg2][msg3][msg4][msg5]... ──────▶  │
│ Partition 1: [msg1][msg2][msg3][msg4]... ────────────▶  │
│ Partition 2: [msg1][msg2][msg3]... ──────────────────▶  │
└─────────────────────────────────────────────────────────┘
Consumers читают по offset, сообщения НЕ удаляются после прочтения

RABBITMQ (Queue-based)
──────────────────────
Exchange ──▶ Queue 1 ──▶ Consumer A (msg удаляется после ACK)
    │
    └────▶ Queue 2 ──▶ Consumer B (msg удаляется после ACK)

ACTIVEMQ (JMS-based)
────────────────────
Destination (Queue/Topic) ──▶ Consumer
Поддерживает оба паттерна: Point-to-Point и Pub/Sub
```

### Сравнение по характеристикам

| Характеристика | Kafka | RabbitMQ | ActiveMQ |
|----------------|-------|----------|----------|
| **Throughput** | Миллионы msg/sec | 10-50K msg/sec | 5-20K msg/sec |
| **Latency** | 5-15ms (batch) | <1ms (single) | 1-5ms |
| **Message Retention** | Дни/недели/месяцы | До ACK (удаляется) | До ACK |
| **Replay** | ✅ Да, по offset | ❌ Нет | ❌ Нет |
| **Ordering** | В пределах partition | В пределах queue | В пределах queue |
| **Routing** | Простой (topic/partition) | Сложный (exchanges, bindings) | Средний |
| **Protocol** | Kafka Protocol (TCP) | AMQP, MQTT, STOMP | JMS, AMQP, STOMP |
| **Clustering** | Native, built-in | Mirrored queues | Master-slave |

### Когда использовать что

```
                        ┌──────────────────────────┐
                        │   Выбор Message Broker   │
                        └────────────┬─────────────┘
                                     │
                    Нужен высокий throughput (>100K msg/s)?
                                     │
                    ┌────────────────┼────────────────┐
                    │ Да             │                │ Нет
                    ▼                │                ▼
               ┌────────┐            │      Нужна сложная маршрутизация?
               │ KAFKA  │            │                │
               └────────┘            │      ┌─────────┼─────────┐
                                     │      │ Да      │         │ Нет
                                     │      ▼         │         ▼
                                     │ ┌──────────┐   │    JMS required?
                                     │ │ RABBITMQ │   │         │
                                     │ └──────────┘   │    ┌────┼────┐
                                     │                │    │ Да │    │ Нет
                                     │                │    ▼    │    ▼
                                     │                │ ┌────────┐ ┌──────────┐
                                     │                │ │ACTIVEMQ│ │ RABBITMQ │
                                     │                │ └────────┘ └──────────┘
```

### Конкретные use-cases

| Use Case | Лучший выбор | Почему |
|----------|--------------|--------|
| Event Sourcing | Kafka | Хранение истории, replay |
| Log Aggregation | Kafka | High throughput, retention |
| Metrics Pipeline | Kafka | Streaming, aggregations |
| Task Queue (jobs) | RabbitMQ | Ack/Nack, TTL, priorities |
| Request/Reply pattern | RabbitMQ | Correlation ID, temp queues |
| IoT Message Routing | RabbitMQ | MQTT support, flexible routing |
| Legacy JMS Integration | ActiveMQ | JMS compliance |
| Financial Transactions | Kafka | Exactly-once, audit trail |

---

## 9. Amazon Kinesis

### Kinesis vs Kafka

| Аспект | Amazon Kinesis | Apache Kafka |
|--------|----------------|--------------|
| **Deployment** | Managed AWS service | Self-hosted / Managed (MSK, Confluent) |
| **Scaling** | По shards (auto-scaling доступен) | По partitions + brokers (manual) |
| **Retention** | 1-365 дней (default 24h) | Настраиваемый (дни/месяцы/годы) |
| **Throughput per shard** | 1 MB/s write, 2 MB/s read | Зависит от hardware, обычно выше |
| **Cost model** | Pay per shard-hour + PUT units | Infrastructure cost |
| **Ecosystem** | AWS native (Lambda, Firehose, Analytics) | Kafka Connect, Streams, ksqlDB |
| **Multi-cloud** | AWS only | Anywhere |

### Когда выбрать Kinesis

- Уже в AWS, нужна быстрая интеграция
- Не хочешь управлять инфраструктурой
- Небольшие/средние объёмы данных
- Интеграция с Lambda, Firehose, S3, Redshift

### Когда выбрать Kafka

- Multi-cloud или on-premise
- Огромные объёмы (миллионы msg/sec)
- Нужен полный контроль над конфигурацией
- Долгосрочное хранение (месяцы/годы)
- Сложные streaming pipelines (Kafka Streams, ksqlDB)

---

## 10. Экземпляры брокеров — масштабирование

### Нужно ли много экземпляров Kafka?

**Да, обязательно для production.**

```
Минимальная Production конфигурация:

┌─────────────────────────────────────────────────────────────┐
│                      Kafka Cluster                          │
│                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                 │
│  │Broker 1 │    │Broker 2 │    │Broker 3 │                 │
│  │(Leader) │    │(Replica)│    │(Replica)│                 │
│  │   P0    │    │   P0    │    │   P0    │   ← Partition 0 │
│  └─────────┘    └─────────┘    └─────────┘     replicated  │
│                                                             │
│  Replication Factor = 3                                     │
│  Min In-Sync Replicas = 2                                   │
└─────────────────────────────────────────────────────────────┘
```

### Рекомендации по количеству брокеров

| Нагрузка | Брокеров | Партиций на топик |
|----------|----------|-------------------|
| Dev/Test | 1-3 | 1-3 |
| Small Production | 3-5 | 3-6 |
| Medium Production | 5-10 | 6-12 |
| Large Production | 10-50+ | 12-100+ |

### Kafka НЕ "сама масштабируется"

- Нужно **вручную** добавлять брокеры
- Нужно **вручную** увеличивать партиции
- Нужен **rebalance** после изменений
- Для автоматизации: Kafka operators (Strimzi), Cruise Control

```yaml
# Strimzi Kafka Operator - auto-scaling example
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: production-cluster
spec:
  kafka:
    replicas: 6  # Количество брокеров
    config:
      num.partitions: 12
      default.replication.factor: 3
      min.insync.replicas: 2
```

---

## 11. Kafka для потокового анализа

### Архитектура Real-time Analytics

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  Data       │     │   Kafka     │     │  Stream         │
│  Sources    │────▶│   Topics    │────▶│  Processing     │
│             │     │             │     │                 │
│ • App Events│     │ • events    │     │ • Kafka Streams │
│ • Logs      │     │ • metrics   │     │ • Flink         │
│ • IoT       │     │ • clicks    │     │ • Spark         │
│ • DB CDC    │     │             │     │ • ksqlDB        │
└─────────────┘     └─────────────┘     └────────┬────────┘
                                                 │
                                                 ▼
                                    ┌─────────────────────┐
                                    │   Destinations      │
                                    │ • Elasticsearch     │
                                    │ • ClickHouse        │
                                    │ • Real-time dashboards│
                                    │ • Alerts            │
                                    └─────────────────────┘
```

### Kafka Streams — пример fraud detection

```java
@Configuration
@EnableKafkaStreams
public class FraudDetectionStream {

    @Bean
    public KStream<String, Transaction> fraudDetectionStream(StreamsBuilder builder) {
        
        KStream<String, Transaction> transactions = builder
            .stream("transactions", Consumed.with(Serdes.String(), transactionSerde));
        
        // Группируем по user_id, окно 5 минут
        KTable<Windowed<String>, Long> transactionCounts = transactions
            .groupByKey()
            .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
            .count();
        
        // Фильтруем подозрительную активность (>10 транзакций за 5 мин)
        KStream<String, String> suspiciousActivity = transactionCounts
            .toStream()
            .filter((windowedKey, count) -> count > 10)
            .map((windowedKey, count) -> 
                KeyValue.pair(
                    windowedKey.key(), 
                    "ALERT: User " + windowedKey.key() + " has " + count + " transactions"
                )
            );
        
        // Отправляем в топик алертов
        suspiciousActivity.to("fraud-alerts");
        
        return transactions;
    }
}
```

### ksqlDB — SQL над потоками

```sql
-- Создаём stream из топика
CREATE STREAM transactions (
    transaction_id VARCHAR,
    user_id VARCHAR,
    amount DECIMAL(10,2),
    timestamp BIGINT
) WITH (
    KAFKA_TOPIC='transactions',
    VALUE_FORMAT='JSON'
);

-- Real-time агрегация
CREATE TABLE user_spending AS
SELECT 
    user_id,
    SUM(amount) AS total_spent,
    COUNT(*) AS transaction_count
FROM transactions
WINDOW TUMBLING (SIZE 1 HOUR)
GROUP BY user_id;

-- Алерты на большие транзакции
CREATE STREAM large_transactions AS
SELECT * FROM transactions
WHERE amount > 10000;
```

---

## 12. Телеметрия

### Что это такое

**Телеметрия = Metrics + Logs + Traces**

```
┌─────────────────────────────────────────────────────────────┐
│                     OBSERVABILITY                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  METRICS              LOGS                TRACES            │
│  ────────             ────                ──────            │
│  • CPU usage          • Application logs  • Request path    │
│  • Memory             • Error logs        • Latency per hop │
│  • Request count      • Access logs       • Dependencies    │
│  • Latency (p50/p99)  • Audit logs        • Bottlenecks     │
│  • Error rate         • Debug info                          │
│                                                             │
│  Prometheus           ELK Stack           Jaeger/Zipkin     │
│  Grafana              Loki                OpenTelemetry     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### OpenTelemetry — современный стандарт

```java
// Spring Boot 3 + OpenTelemetry
@RestController
public class OrderController {

    private final Tracer tracer;
    private final Meter meter;

    @PostMapping("/orders")
    public Order createOrder(@RequestBody OrderRequest request) {
        // Автоматически создаётся span для HTTP запроса
        
        Span span = tracer.spanBuilder("process-order")
            .setAttribute("user.id", request.getUserId())
            .startSpan();
        
        try (Scope scope = span.makeCurrent()) {
            // Бизнес-логика
            Order order = orderService.create(request);
            
            // Custom metric
            meter.counterBuilder("orders.created")
                .setDescription("Number of orders created")
                .build()
                .add(1, Attributes.of(
                    AttributeKey.stringKey("status"), "success"
                ));
            
            return order;
        } finally {
            span.end();
        }
    }
}
```

```yaml
# application.yml
management:
  tracing:
    sampling:
      probability: 1.0
  otlp:
    tracing:
      endpoint: http://jaeger:4318/v1/traces
    metrics:
      endpoint: http://prometheus:9090/api/v1/otlp
```

---

## 13. Быстрый отклик — gRPC, TCP, HTTP

### Сравнение latency

```
Latency comparison (lower is better):

Raw TCP:        ████ ~0.5ms
gRPC (HTTP/2):  ████████ ~2ms
HTTP/2 + JSON:  ████████████ ~5ms
HTTP/1.1 + JSON:████████████████████ ~10ms
```

### Когда что использовать

| Протокол | Latency | Complexity | Use Case |
|----------|---------|------------|----------|
| **Raw TCP** | Минимальная (<1ms) | Высокая | Gaming, HFT, custom protocols |
| **gRPC** | Низкая (~2ms) | Средняя | Internal microservices |
| **HTTP/2** | Низкая-средняя (~5ms) | Низкая | Modern REST APIs |
| **HTTP/1.1** | Средняя (~10ms) | Очень низкая | Legacy, external APIs |

### Оптимизации для быстрого отклика

```java
// 1. Connection pooling
@Bean
public ManagedChannel grpcChannel() {
    return ManagedChannelBuilder.forAddress("service", 9090)
        .usePlaintext()
        .maxInboundMessageSize(10 * 1024 * 1024)
        .keepAliveTime(30, TimeUnit.SECONDS)
        .keepAliveWithoutCalls(true)
        .build();
}

// 2. Async/non-blocking
@Bean
public WebClient webClient() {
    return WebClient.builder()
        .clientConnector(new ReactorClientHttpConnector(
            HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000)
                .responseTimeout(Duration.ofSeconds(5))
                .keepAlive(true)
        ))
        .build();
}

// 3. Compression
@Bean
public OrderServiceGrpc.OrderServiceStub compressedStub(ManagedChannel channel) {
    return OrderServiceGrpc.newStub(channel)
        .withCompression("gzip");
}
```

---

## 14. Kafka: партиции, топики, брокеры, мультитенантность

### Архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                        KAFKA CLUSTER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BROKER 1              BROKER 2              BROKER 3           │
│  ─────────             ─────────             ─────────          │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐   │
│  │ orders-P0   │       │ orders-P0   │       │ orders-P1   │   │
│  │ (Leader)    │       │ (Replica)   │       │ (Leader)    │   │
│  └─────────────┘       └─────────────┘       └─────────────┘   │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐   │
│  │ orders-P1   │       │ orders-P2   │       │ orders-P2   │   │
│  │ (Replica)   │       │ (Leader)    │       │ (Replica)   │   │
│  └─────────────┘       └─────────────┘       └─────────────┘   │
│                                                                 │
│  Topic: orders                                                  │
│  Partitions: 3                                                  │
│  Replication Factor: 2                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Как определить количество партиций

```
Формула: Partitions = max(T/P, T/C)

Где:
T = Target throughput (msg/sec)
P = Producer throughput на 1 partition
C = Consumer throughput на 1 partition

Пример:
- Нужно: 100,000 msg/sec
- 1 producer пишет: 10,000 msg/sec в partition
- 1 consumer читает: 20,000 msg/sec из partition

Partitions = max(100,000/10,000, 100,000/20,000)
           = max(10, 5) = 10 партиций
```

### Настройки для разных сценариев

```properties
# High Throughput
num.partitions=24
batch.size=65536
linger.ms=10
compression.type=lz4

# Low Latency
num.partitions=12
batch.size=16384
linger.ms=0
acks=1

# High Durability
replication.factor=3
min.insync.replicas=2
acks=all
unclean.leader.election.enable=false
```

### Мультитенантность

```
Подходы к multi-tenancy:

1. TOPIC PER TENANT
   └── tenant-a-orders
   └── tenant-b-orders
   └── tenant-c-orders
   ✅ Полная изоляция
   ❌ Много топиков

2. PARTITION PER TENANT
   └── orders
       ├── P0 → tenant-a
       ├── P1 → tenant-b
       └── P2 → tenant-c
   ⚠️ Сложнее в управлении

3. PREFIX + ACL
   └── tenanta.orders
   └── tenantb.orders
   + ACL: tenanta.* → Team A
   + ACL: tenantb.* → Team B
   ✅ Гибкость + безопасность
```

### Конфигурация quotas

```properties
# server.properties
# Лимит на producer
quota.producer.default=10485760  # 10 MB/s

# Лимит на consumer
quota.consumer.default=20971520  # 20 MB/s

# Per-client limits (динамически через kafka-configs)
# kafka-configs.sh --alter --add-config 'producer_byte_rate=1048576,consumer_byte_rate=2097152' \
#   --entity-type clients --entity-name tenant-a
```

---

## 15. ZooKeeper и Dead Letter Topic

### ZooKeeper → KRaft миграция

**С Kafka 4.0 (март 2025) ZooKeeper полностью удалён!**

```
БЫЛО (до Kafka 3.x):
┌─────────────────┐     ┌─────────────────┐
│  Kafka Cluster  │────▶│  ZooKeeper      │
│                 │     │  Ensemble       │
│  Brokers        │     │  (3-5 nodes)    │
└─────────────────┘     └─────────────────┘

СТАЛО (Kafka 4.0+):
┌─────────────────────────────────────────┐
│            Kafka Cluster                 │
│  ┌─────────────┐  ┌─────────────┐       │
│  │ Controller  │  │ Controller  │       │
│  │ (Raft)      │  │ (Raft)      │       │
│  └─────────────┘  └─────────────┘       │
│  ┌─────────────┐  ┌─────────────┐       │
│  │ Broker      │  │ Broker      │  ...  │
│  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────┘
```

### Преимущества KRaft

- Нет отдельного ZooKeeper кластера
- Быстрее failover контроллера
- Меньше операционной сложности
- Лучше масштабируемость metadata

### Dead Letter Topic (DLT)

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│ Producer │────▶│ main-topic   │────▶│  Consumer    │
└──────────┘     └──────────────┘     └──────┬───────┘
                                             │
                                      Processing fails?
                                             │
                                    ┌────────┼────────┐
                                    │ Retry 1│ Retry 2│ Retry 3
                                    │        │        │
                                    │        │        ▼
                                    │        │  ┌───────────────┐
                                    │        │  │ Dead Letter   │
                                    │        │  │ Topic (DLT)   │
                                    │        │  └───────────────┘
```

### Spring Kafka — DLT конфигурация

```java
@Configuration
@EnableKafka
public class KafkaConfig {

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory(
            ConsumerFactory<String, String> consumerFactory,
            KafkaTemplate<String, String> kafkaTemplate) {
        
        ConcurrentKafkaListenerContainerFactory<String, String> factory = 
            new ConcurrentKafkaListenerContainerFactory<>();
        
        factory.setConsumerFactory(consumerFactory);
        
        // Dead Letter Topic с retry
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(
            new DeadLetterPublishingRecoverer(kafkaTemplate,
                (record, ex) -> new TopicPartition(
                    record.topic() + ".DLT",  // orders → orders.DLT
                    record.partition()
                )),
            new FixedBackOff(1000L, 3L)  // 3 retry с интервалом 1 сек
        );
        
        factory.setCommonErrorHandler(errorHandler);
        
        return factory;
    }
}

@Service
public class OrderConsumer {

    @KafkaListener(topics = "orders")
    public void consume(String message) {
        // Если здесь exception — после 3 retry пойдёт в orders.DLT
        processOrder(message);
    }
    
    @KafkaListener(topics = "orders.DLT")
    public void consumeDLT(String message) {
        // Обработка failed messages
        log.error("Failed to process order: {}", message);
        // Alert, manual review, etc.
    }
}
```

---

## 16. RestTemplate — Best Practices 2025

### RestTemplate устарел!

```java
// ❌ DEPRECATED - не использовать в новых проектах
RestTemplate restTemplate = new RestTemplate();
String result = restTemplate.getForObject(url, String.class);
```

### Современные альтернативы

#### 1. WebClient (Spring WebFlux) — рекомендуется

```java
@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient() {
        return WebClient.builder()
            .baseUrl("http://order-service")
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .clientConnector(new ReactorClientHttpConnector(
                HttpClient.create()
                    .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000)
                    .responseTimeout(Duration.ofSeconds(10))
                    .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(10))
                        .addHandlerLast(new WriteTimeoutHandler(10))
                    )
            ))
            .build();
    }
}

@Service
public class OrderClient {

    private final WebClient webClient;

    // Reactive (non-blocking)
    public Mono<Order> getOrderReactive(String orderId) {
        return webClient.get()
            .uri("/orders/{id}", orderId)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, 
                response -> Mono.error(new OrderNotFoundException(orderId)))
            .onStatus(HttpStatusCode::is5xxServerError,
                response -> Mono.error(new ServiceUnavailableException()))
            .bodyToMono(Order.class)
            .timeout(Duration.ofSeconds(5))
            .retryWhen(Retry.backoff(3, Duration.ofMillis(500)));
    }

    // Blocking (если нужно)
    public Order getOrderBlocking(String orderId) {
        return getOrderReactive(orderId).block();
    }
}
```

#### 2. RestClient (Spring 6.1+) — новый синхронный клиент

```java
@Configuration
public class RestClientConfig {

    @Bean
    public RestClient restClient() {
        return RestClient.builder()
            .baseUrl("http://order-service")
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .requestInterceptor((request, body, execution) -> {
                // Logging, metrics, tracing
                long start = System.currentTimeMillis();
                ClientHttpResponse response = execution.execute(request, body);
                log.info("Request to {} took {}ms", 
                    request.getURI(), System.currentTimeMillis() - start);
                return response;
            })
            .build();
    }
}

@Service
public class OrderClient {

    private final RestClient restClient;

    public Order getOrder(String orderId) {
        return restClient.get()
            .uri("/orders/{id}", orderId)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, 
                (request, response) -> {
                    throw new OrderNotFoundException(orderId);
                })
            .body(Order.class);
    }

    public Order createOrder(OrderRequest request) {
        return restClient.post()
            .uri("/orders")
            .body(request)
            .retrieve()
            .body(Order.class);
    }
}
```

#### 3. Declarative HTTP Client (Spring 6+)

```java
// Декларативный интерфейс — как Feign, но нативный Spring
@HttpExchange("/orders")
public interface OrderClient {

    @GetExchange("/{id}")
    Order getOrder(@PathVariable String id);

    @PostExchange
    Order createOrder(@RequestBody OrderRequest request);

    @GetExchange
    List<Order> getAllOrders(@RequestParam("status") String status);
}

@Configuration
public class HttpClientConfig {

    @Bean
    public OrderClient orderClient(RestClient.Builder builder) {
        RestClient restClient = builder.baseUrl("http://order-service").build();
        
        HttpServiceProxyFactory factory = HttpServiceProxyFactory
            .builderFor(RestClientAdapter.create(restClient))
            .build();
        
        return factory.createClient(OrderClient.class);
    }
}
```

### Обязательные практики

```java
@Configuration
public class ResilienceConfig {

    // Circuit Breaker
    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        return CircuitBreakerRegistry.of(CircuitBreakerConfig.custom()
            .failureRateThreshold(50)
            .waitDurationInOpenState(Duration.ofSeconds(30))
            .slidingWindowSize(10)
            .build());
    }

    // Retry
    @Bean
    public RetryRegistry retryRegistry() {
        return RetryRegistry.of(RetryConfig.custom()
            .maxAttempts(3)
            .waitDuration(Duration.ofMillis(500))
            .retryExceptions(IOException.class, TimeoutException.class)
            .build());
    }
}

@Service
public class ResilientOrderClient {

    private final WebClient webClient;
    private final CircuitBreaker circuitBreaker;
    private final Retry retry;

    public Mono<Order> getOrder(String orderId) {
        return webClient.get()
            .uri("/orders/{id}", orderId)
            .retrieve()
            .bodyToMono(Order.class)
            .transformDeferred(CircuitBreakerOperator.of(circuitBreaker))
            .transformDeferred(RetryOperator.of(retry))
            .timeout(Duration.ofSeconds(5));
    }
}
```

### Сравнение HTTP клиентов

| Клиент | Blocking | Reactive | Spring Version | Рекомендация |
|--------|----------|----------|----------------|--------------|
| RestTemplate | ✅ | ❌ | All | ❌ Deprecated |
| WebClient | ✅ (block) | ✅ | 5.0+ | ✅ Для reactive |
| RestClient | ✅ | ❌ | 6.1+ | ✅ Для blocking |
| @HttpExchange | ✅ | ✅ | 6.0+ | ✅ Декларативный |

---

## Итоговые рекомендации

### Коммуникация между сервисами

```
Внешний API (браузеры, мобильные)     → REST / GraphQL
Внутренние синхронные вызовы          → gRPC
Высокая нагрузка, события, аналитика  → Kafka
Задачи, очереди, сложный routing      → RabbitMQ
```

### HTTP клиенты в Java (2025+)

```
Новый проект с WebFlux              → WebClient
Новый проект без WebFlux            → RestClient
Декларативный стиль                 → @HttpExchange
Legacy проект                       → Мигрировать с RestTemplate
```

### Kafka конфигурация

```
Минимум брокеров (prod)             → 3-6
Replication factor                  → 3
Min in-sync replicas                → 2
Партиций на топик                   → По формуле throughput
ZooKeeper                           → Мигрировать на KRaft
```

