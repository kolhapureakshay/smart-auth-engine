
const fs = require('fs');
const path = require('path');

const collection = {
    "info": {
        "_postman_id": "smart-auth-engine-collection",
        "name": "Smart Auth Engine Demo",
        "description": "Collection for testing Smart Auth Engine API endpoints. Variables like accessToken are updated automatically.",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "variable": [
        {
            "key": "baseUrl",
            "value": "http://localhost:3000",
            "type": "string"
        },
        {
            "key": "accessToken",
            "value": "",
            "type": "string"
        },
        {
            "key": "refreshToken",
            "value": "",
            "type": "string"
        },
        {
            "key": "sessionId",
            "value": "",
            "type": "string"
        }
    ],
    "item": [
        {
            "name": "1. Login (User)",
            "event": [
                {
                    "listen": "test",
                    "script": {
                        "exec": [
                            "var jsonData = pm.response.json();",
                            "if (jsonData.accessToken) {",
                            "    pm.collectionVariables.set('accessToken', jsonData.accessToken);",
                            "    console.log('Access Token updated');",
                            "}",
                            "if (jsonData.refreshToken) {",
                            "    pm.collectionVariables.set('refreshToken', jsonData.refreshToken);",
                            "    console.log('Refresh Token updated');",
                            "}",
                            "if (jsonData.session && jsonData.session.sessionId) {",
                            "    pm.collectionVariables.set('sessionId', jsonData.session.sessionId);",
                            "    console.log('Session ID updated');",
                            "}"
                        ],
                        "type": "text/javascript"
                    }
                }
            ],
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "body": {
                    "mode": "raw",
                    "raw": JSON.stringify({
                        "userId": "test-user-123"
                    }, null, 4)
                },
                "url": {
                    "raw": "{{baseUrl}}/login",
                    "host": ["{{baseUrl}}"],
                    "path": ["login"]
                }
            }
        },
        {
            "name": "2. Login (Admin)",
            "event": [
                {
                    "listen": "test",
                    "script": {
                        "exec": [
                            "var jsonData = pm.response.json();",
                            "if (jsonData.accessToken) {",
                            "    pm.collectionVariables.set('accessToken', jsonData.accessToken);",
                            "}",
                            "if (jsonData.refreshToken) {",
                            "    pm.collectionVariables.set('refreshToken', jsonData.refreshToken);",
                            "}",
                            "if (jsonData.session && jsonData.session.sessionId) {",
                            "    pm.collectionVariables.set('sessionId', jsonData.session.sessionId);",
                            "}"
                        ],
                        "type": "text/javascript"
                    }
                }
            ],
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "body": {
                    "mode": "raw",
                    "raw": JSON.stringify({
                        "userId": "admin-user",
                        "role": "admin"
                    }, null, 4)
                },
                "url": {
                    "raw": "{{baseUrl}}/login",
                    "host": ["{{baseUrl}}"],
                    "path": ["login"]
                }
            }
        },
        {
            "name": "3. Get Profile (Protected)",
            "request": {
                "auth": {
                    "type": "bearer",
                    "bearer": [
                        {
                            "key": "token",
                            "value": "{{accessToken}}",
                            "type": "string"
                        }
                    ]
                },
                "method": "GET",
                "url": {
                    "raw": "{{baseUrl}}/profile",
                    "host": ["{{baseUrl}}"],
                    "path": ["profile"]
                }
            }
        },
        {
            "name": "4. Get Admin Data (RBAC)",
            "request": {
                "auth": {
                    "type": "bearer",
                    "bearer": [
                        {
                            "key": "token",
                            "value": "{{accessToken}}",
                            "type": "string"
                        }
                    ]
                },
                "method": "GET",
                "url": {
                    "raw": "{{baseUrl}}/admin",
                    "host": ["{{baseUrl}}"],
                    "path": ["admin"]
                }
            }
        },
        {
            "name": "5. Refresh Token",
            "event": [
                {
                    "listen": "test",
                    "script": {
                        "exec": [
                            "var jsonData = pm.response.json();",
                            "if (jsonData.accessToken) {",
                            "    pm.collectionVariables.set('accessToken', jsonData.accessToken);",
                            "    console.log('New Access Token set');",
                            "}",
                            "if (jsonData.newRefreshToken) {",
                            "    pm.collectionVariables.set('refreshToken', jsonData.newRefreshToken);",
                            "    console.log('New Refresh Token set');",
                            "}"
                        ],
                        "type": "text/javascript"
                    }
                }
            ],
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "body": {
                    "mode": "raw",
                    "raw": JSON.stringify({
                        "refreshToken": "{{refreshToken}}"
                    }, null, 4)
                },
                "url": {
                    "raw": "{{baseUrl}}/refresh",
                    "host": ["{{baseUrl}}"],
                    "path": ["refresh"]
                }
            }
        },
        {
            "name": "6. Logout",
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "body": {
                    "mode": "raw",
                    "raw": JSON.stringify({
                        "sessionId": "{{sessionId}}"
                    }, null, 4)
                },
                "url": {
                    "raw": "{{baseUrl}}/logout",
                    "host": ["{{baseUrl}}"],
                    "path": ["logout"]
                }
            }
        }
    ]
};

const outputPath = path.resolve(__dirname, '../examples/postman/smart-auth.postman_collection.json');

fs.writeFileSync(outputPath, JSON.stringify(collection, null, 4));
console.log(`Posman collection generated at: ${outputPath}`);
