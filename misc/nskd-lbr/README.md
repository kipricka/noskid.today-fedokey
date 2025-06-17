# NoSkid Certificate Library

A JavaScript library for working with NoSkid certificates.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Browser

```html
<script src="https://lbr.noskid.today"></script>
```

### Node.js

```bash
npm install nskd-lbr
```

```js
const NskdLbr = require('nskd-lbr');
```

## Usage

### Basic Usage

```js
// Initialize the library
const nskd = new NskdLbr();

// Verify a certificate from a file
const fileInput = document.getElementById('certificate-file');
fileInput.addEventListener('change', async (event) => {
    try {
        const result = await nskd.loadFromFile(event.target.files[0]);
        if (result.valid) {
            console.log('Certificate is valid!');
            console.log(nskd.getFormattedDetails());
        } else {
            console.log('Certificate is invalid:', result.message);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
});

// Verify a certificate with a key
const verificationKey = 'a1b2c3d4e5f6...'; // 64-character hex string
nskd.verifyWithKey(verificationKey)
    .then(result => {
        if (result.valid) {
            console.log('Certificate is valid!');
        } else {
            console.log('Certificate is invalid:', result.message);
        }
    })
    .catch(error => {
        console.error('Error:', error.message);
    });
```

## API Reference

### Constructor

```javascript
new NskdLbr(options)
```

**Options:**

| Option | Type | Default | Description |
| - | - | - | - |
| `apiUrl` | string | `'https://check.noskid.today/'` | The API endpoint for certificate verification |
| `debug` | boolean | `false` | Enable debug logging |
| `timeout` | number | `10000` | Request timeout in milliseconds |
| `strictCheck` | boolean | `true` | Validate local data against API response |
| `onnskdLbrLog` | function | `null` | Custom logging function |

### Methods

| Method | Description | Returns |
| - | - | - |
| `loadFromFile(file)` | Load and verify a certificate from a PNG file | `Promise<Object>` Verification result |
| `verifyWithKey(key)` | Verify a certificate using a verification key | `Promise<Object>` Verification result |
| `getCertificateData()` | Get the current certificate data | `Object|null` Certificate data or null |
| `isValidCertificate()` | Check if the certificate is valid | `boolean` |
| `getFormattedDetails()` | Get formatted certificate details | `string` |
| `reset()` | Reset the certificate data | `void` |

### Logging

The library provides a logging method that can be used to track the verification process:

```js
nskd.nskdLbrLog(message, level);
```

**Levels:**

- `info` (default)
- `error`
- `warning`
- `success`

## Examples

### Custom Logging

```js
const nskd = new NskdLbr({
    onnskdLbrLog: (message, level) => {
        // Custom logging implementation
        console.log(`[Custom Log] [${level.toUpperCase()}] ${message}`);
    }
});
```

### Disabling Strict Check

```js
const nskd = new NskdLbr({
    strictCheck: false
});
```

## Configuration

The library can be configured with various options to suit your needs. The most important options are:

- `apiUrl`: The endpoint for the NoSkid verification API.
- `debug`: Enable or disable debug logging.
- `timeout`: Set the request timeout in milliseconds.
- `strictCheck`: Enable or disable strict validation of local data against API response.

## Error Handling

The library throws errors in case of issues during the verification process. It is recommended to wrap the library calls in try-catch blocks to handle these errors gracefully.

```javascript
try {
    const result = await nskd.loadFromFile(file);
    // Handle the result
} catch (error) {
    console.error('Verification failed:', error.message);
}
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on the GitHub repository.

## License

This library is licensed under the NSDv1.0 License. See the LICENSE file for more information.