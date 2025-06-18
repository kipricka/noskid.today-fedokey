# API Differences - Quick Reference

## Endpoints
- **Legacy**: `https://noskid.today/api/checkcert/?key={key}`
- **Recommended**: `https://check.noskid.today/?key={key}`

## Key Changes
- **Caching**: Valid certs cached permanently, invalid for 24h
- **Username**: Now returns clean first word only (alphanumeric + underscore)
- **Nickname**: New field with original full username
- **Cached**: New field indicating if result is from cache

## Example Response Difference
```json
// Legacy
"username": "John Doe (Admin)"

// Recommended  
"username": "John",
"nickname": "John Doe (Admin)",
"cached": true
```