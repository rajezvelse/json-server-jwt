# JSON API server with JWT authentication

A light weight, ready to run json rest api for front-end developers who need a quick back-end for prototyping and mocking .

![banner](./banner.png)

## Build and start server

```bash
git clone

cd json-server-jwt

docker build -f .docker/Dockerfile -t json-jwt:api .

docker run -dti --name="json-api" -p "3000:3000" json-jwt:api
```

The server will be running in port 3000. 

To view the server running, open [http://localhost:3000](http://localhost:3000)

Demo user : admin / admin

### Authentication
Request:
```bash
curl -XPOST -H "Content-Type: application/json" -d '{"email": "admin@example.com", "password": "admin"}' http://localhost:3000/api-token-auth 
```
Response:
```json
{
    "auth": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNTMwMjU5MzE3LCJleHAiOjE1MzAzNDU3MTd9.z_mknTvzY_hl4ulxNSEvn6MqHLrlcyALvsyih1oJGyA",
    "user": {
        "id": 1,
        "username": "admin",
        "password": "admin",
        "email": "admin@example.com"
    }
}
```

### Token refresh
Request:
```bash
curl -XGET -H "Content-Type: application/json"  -H "Authorization: Barear eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNTMwMjU5MzE3LCJleHAiOjE1MzAzNDU3MTd9.z_mknTvzY_hl4ulxNSEvn6MqHLrlcyALvsyih1oJGyA" http://localhost:3000/api-token-refresh 
```
Response:
```json
{
    "auth": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNTMwMjU5ODEzLCJleHAiOjE1MzAzNDYyMTN9.vL_WvjzLDT2rCmIWJJh6lQGSyhPfEFuaqQeG6s31zzY",
    "user": {
        "id": 1,
        "username": "admin",
        "password": "admin",
        "email": "admin@example.com"
    }
}
```

### Password reset
Request:
```bash
curl -XPOST -H "Content-Type: application/json" -d '{"email": "admin@example.com"}' http://localhost:3000/api-password-reset
```
Response:
```json
{
    "token": "gCYjYn1Fy2VtflPPM9dY"
}
```

### Password reset verify
Request:
```bash
curl -XPOST -H "Content-Type: application/json" -d '{"token": "gCYjYn1Fy2VtflPPM9dY"}' http://localhost:3000/api-password-reset-verify
```
Response:
```json
OK
```

### Password reset confirm
Request:
```bash
curl -XPOST -H "Content-Type: application/json" -d '{"token": "gCYjYn1Fy2VtflPPM9dY", "new_password": "admin123"}' http://localhost:3000/api-password-reset-confirm
```
Response:
```json
Password reset success
```

### Change password
Request:
```bash
curl -XPOST -H "Content-Type: application/json"  -H "Authorization: Barear eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNTMwMjU5MzE3LCJleHAiOjE1MzAzNDU3MTd9.z_mknTvzY_hl4ulxNSEvn6MqHLrlcyALvsyih1oJGyA" -d '{"password": "admin123", "new_password": "admin"}' http://localhost:3000/users/change-password 
```
Response:
```json
Password changed
```

### Access routes
Request:
```bash
curl -XGET -H "Content-Type: application/json" -H "Authorization: Barear eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNTMwMjU5MzE3LCJleHAiOjE1MzAzNDU3MTd9.z_mknTvzY_hl4ulxNSEvn6MqHLrlcyALvsyih1oJGyA" http://localhost:3000/users
```
Response:
```json
[
  {
    "id": 1,
    "username": "admin",
    "password": "admin",
    "email": "admin@example.com"
  }
]
```

### [View full documentation](https://github.com/typicode/json-server/blob/master/README.md)

## Source

[https://github.com/typicode/json-server](https://github.com/typicode/json-server)