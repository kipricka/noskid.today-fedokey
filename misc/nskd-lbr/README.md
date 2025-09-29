# NoSkid Certificate Library

A modern JavaScript library for verifying NoSkid certificates.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Constructor Options](#constructor-options)
- [Methods](#methods)
- [Response Objects](#response-objects)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Browser Support](#browser-support)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Browser (CDN)

```html
<script src="https://lbr.noskid.today"></script>
```

### Node.js

```bash
npm install nskd-lbr
```

```js
import NskdLbr from 'nskd-lbr';
```

## Quick Start

```js
// Initialize the library
const noskid = new NskdLbr();

// Verify a certificate from file upload
const fileInput = document.getElementById('certificate-file');
fileInput.addEventListener('change', async (event) => {
    try {
        const result = await noskid.loadFromFile(event.target.files[0]);
        console.log('Verification result:', result);
        
        if (result.valid) {
            console.log(noskid.getFormattedDetails());
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
});
```

## Constructor Options

```js
const noskid = new NskdLbr({
    // Core options
    apiUrl: 'https://check.noskid.today/',  // Verification API endpoint
    debug: false,                           // Enable debug logging
    timeout: 10000,                         // Request timeout (ms)
    strictCheck: true,                      // Validate local vs API data
    useLegacyAPI: false,                   // Use legacy API format
    
    // Logging
    onLog: null                            // Custom logging function
});
```

### Option Details

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiUrl` | `string` | `'https://check.noskid.today/'` | NoSkid verification API endpoint |
| `debug` | `boolean` | `false` | Enable console debug messages |
| `timeout` | `number` | `10000` | API request timeout in milliseconds |
| `strictCheck` | `boolean` | `true` | Compare local certificate data with API response |
| `useLegacyAPI` | `boolean` | `false` | Use legacy API format (affects username/nickname field) |
| `onLog` | `function` | `null` | `(message, level) => {}` - Custom logging function |

## Methods

### Certificate Verification

#### `loadFromFile(file)`

Load and verify a certificate from a PNG file.

**Parameters:**
- `file` (`File`) - PNG certificate file from file input

**Returns:** `Promise<VerificationResult>`

**Example:**
```js
const result = await noskid.loadFromFile(file);
// Returns: { valid: true, message: "Certificate verified successfully", data: {...}, cached: false }
```

#### `verifyWithKey(key)`

Verify a certificate using a verification key directly.

**Parameters:**
- `key` (`string`) - 64-character hexadecimal verification key

**Returns:** `Promise<VerificationResult>`

**Example:**
```js
const result = await noskid.verifyWithKey('a1b2c3d4e5f6789...');
// Returns: { valid: true, message: "Certificate verified successfully", data: {...}, cached: false }
```

### Data Access

#### `getCertificateData()`

Get the current certificate data after successful verification.

**Returns:** `CertificateData | null`

**Example:**
```js
const certData = noskid.getCertificateData();
// Returns: { certificate_number: "12345", username: "john_doe", percentage: 95, ... }
```

#### `isValidCertificate()`

Check if the currently loaded certificate is valid.

**Returns:** `boolean`

#### `getFormattedDetails()`

Get a formatted string with certificate details.

**Returns:** `string`

**Example:**
```js
const details = noskid.getFormattedDetails();
console.log(details);
// Output:
// Certificate Details:
// - Certificate #: 12345
// - Username: john_doe
// - Percentage: 95%
// - Creation Date: 2024-01-15 14:30:25
// - Country: United States (US)
```

### Utility Methods

#### `reset()`

Reset all certificate data.

**Returns:** `void`

#### `nskdLbrLog(message, level)`

Log messages with different levels (when debug is enabled).

**Parameters:**
- `message` (`string`) - Message to log
- `level` (`string`) - Log level: `'info'`, `'error'`, `'warning'`, `'success'`

**Returns:** `void`

## Response Objects

### VerificationResult

```js
interface VerificationResult {
    valid: boolean;                    // Whether certificate is valid
    message: string;                   // Status message
    data?: CertificateData;           // Certificate data (if valid)
    cached?: boolean;                 // Whether result was cached
    strictCheck?: boolean;            // Whether strict checking was used
}
```

### CertificateData

```js
interface CertificateData {
    certificate_number: string;        // Certificate number
    username: string;                  // Username from API
    nickname?: string;                 // Nickname (if not using legacy API)
    percentage: number;                // NoSkid percentage
    country: string;                   // Country name
    countryCode: string;              // ISO country code
    creationDate: string;             // Certificate creation date
    key: string;                      // Verification key
    localUsername?: string;           // Username from local certificate
    localCreationDate?: string;       // Creation date from local certificate
}
```

## Examples

### Basic Certificate Verification

```js
const noskid = new NskdLbr({ debug: true });

// From file
document.getElementById('file-input').addEventListener('change', async (e) => {
    try {
        const result = await noskid.loadFromFile(e.target.files[0]);
        
        if (result.valid) {
            const certData = noskid.getCertificateData();
            console.log(`Certificate #${certData.certificate_number} is valid!`);
            console.log(`User: ${certData.username} (${certData.percentage}%)`);
        } else {
            console.log('Invalid certificate:', result.message);
        }
    } catch (error) {
        console.error('Verification failed:', error.message);
    }
});

// From verification key
const key = 'a1b2c3d4e5f6789abcdef...'; // 64-char hex string
try {
    const result = await noskid.verifyWithKey(key);
    console.log('Verification result:', result);
} catch (error) {
    console.error('Error:', error.message);
}
```

### Custom Configuration

```js
const noskid = new NskdLbr({
    apiUrl: 'https://custom-api.example.com/verify',
    timeout: 15000,
    strictCheck: false,
    useLegacyAPI: true,
    onLog: (message, level) => {
        // Send logs to analytics service
        analytics.track('noskid_log', { message, level });
        
        // Custom console formatting
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }
});
```

### Handling Different Error Cases

```js
try {
    const result = await noskid.loadFromFile(file);
    
    if (result.valid) {
        console.log('Certificate is valid');
    } else {
        // Handle different failure reasons
        if (result.strictCheck && result.message.includes('mismatch')) {
            console.log('Certificate data mismatch - try disabling strict check');
        } else {
            console.log('Certificate verification failed:', result.message);
        }
    }
} catch (error) {
    // Handle different error types
    if (error.message.includes('timeout')) {
        console.log('Request timed out - server may be slow');
    } else if (error.message.includes('PNG')) {
        console.log('Invalid file format - please upload a PNG certificate');
    } else if (error.message.includes('verification key')) {
        console.log('Invalid verification key format');
    } else {
        console.log('Unexpected error:', error.message);
    }
}
```

## Error Handling

The library provides detailed error messages for different failure scenarios:

### Common Errors

| Error Type | Cause | Solution |
|------------|-------|----------|
| `"No file provided"` | File input is empty | Check file selection |
| `"File must be a PNG image"` | Wrong file format | Upload a PNG certificate |
| `"No valid verification key found"` | Certificate missing key | Check certificate validity |
| `"Request timeout"` | Network/server issues | Check connection, increase timeout |
| `"Data mismatch"` | Local vs API data differs | Disable `strictCheck` or verify certificate |

### Best Practices

```js
// Always wrap in try-catch
try {
    const result = await noskid.loadFromFile(file);
    // Handle result
} catch (error) {
    // Handle error appropriately
    console.error('Certificate verification failed:', error.message);
}

// Check if certificate is loaded before accessing data
if (noskid.isValidCertificate()) {
    const data = noskid.getCertificateData();
    // Use certificate data
} else {
    console.log('No valid certificate loaded');
}

// Reset state when needed
noskid.reset(); // Clears all data
```

## Browser Support

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Features Used**: Fetch API, Promises, File API, TextDecoder
- **Polyfills**: May require polyfills for older browsers

### Required Browser APIs

- `fetch()` - for API requests
- `FileReader` - for reading certificate files
- `TextDecoder` - for PNG text extraction
- `AbortController` - for request timeouts

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This library is licensed under the NSDv1.0 License. See the [LICENSE](LICENSE) file for details.

---

**Need Help?** 
- Issues: [GitHub Issues](https://github.com/dpipstudio/noskid.today/issues)

<a align="center" href="https://github.com/douxxtech" target="_blank">
<img src="https://madeby.douxx.tech"></img>
</a>