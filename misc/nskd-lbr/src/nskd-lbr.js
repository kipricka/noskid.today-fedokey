/**
 * NoSkid Certificate Library
 * A JavaScript library for working with NoSkid certificates
 *
 * @version 1.1.0
 * @author Douxx <douxx@douxx.tech>
 * @param {string} [options.apiUrl='https://check.noskid.today/'] - Logs debug messages to console
 * @param {boolean} [options.debug=false] - Logs debug messages to console
 * @param {boolean} [options.strictCheck=true] - Whether to validate local data against API response
 * @param {integer} [options.timeout=10000] - API request timeout in milliseconds
 * @param {boolean} [options.useLegacyAPI=false] - Whether to use the legacy API format
 * @param {function} [options.onLog=null] - Whether to validate local data against API response
 * @param {string} [options.loginEndpoint=''] - Login API endpoint for authentication
 * @param {function} [options.onLoginSuccess=null] - Callback function for successful login
 * @param {function} [options.onLoginFail=null] - Callback function for failed login
 */

class NskdLbr {
    constructor(options = {}) {
        this.apiUrl = options.apiUrl || 'https://check.noskid.today/';
        this.debug = options.debug || false;
        this.timeout = options.timeout || 10000;
        this.strictCheck = options.strictCheck !== undefined ? options.strictCheck : true;
        this.onLog = options.onLog || null;
        this.useLegacyAPI = options.useLegacyAPI || false;
        this.loginEndpoint = options.loginEndpoint || '';
        this.onLoginSuccess = options.onLoginSuccess || null;
        this.onLoginFail = options.onLoginFail || null;
        this.certificateData = null;
        this.verificationKey = null;
        this.localData = null;
        this.isValid = false;
        this.currentLoginModal = null;
    }

    /**
     * Logs messages with different levels
     * @param {string} message - The message to Log
     */
    nskdLbrLog(message, level = 'info') {
        if (this.debug) {
            const timestamp = new Date().toLocaleTimeString();
            const prefix = `[${timestamp}] NoSkid:`;

            switch (level) {
                case 'error':
                    console.error(prefix, message);
                    break;
                case 'warning':
                    console.warn(prefix, message);
                    break;
                case 'success':
                    console.log(`%c${prefix} ${message}`, 'color: green');
                    break;
                default:
                    console.log(prefix, message);
            }
        }

        if (this.onLog && typeof this.onLog === 'function') {
            this.onLog(message, level);
        }
    }

    /**
     * Show login modal (only available for webpages with loginEndpoint set)
     * @returns {Promise<Object>} Login result
     */
    async showLoginModal() {
        if (typeof window === 'undefined') {
            throw new Error('Login modal is only available in browser environments');
        }

        if (!this.loginEndpoint || this.loginEndpoint.trim() === '') {
            throw new Error('Login endpoint is not configured');
        }

        return new Promise((resolve, reject) => {
            this.createLoginModal(resolve, reject);
        });
    }

    /**
     * Create and display the login modal
     * @private
     */
    createLoginModal(resolve, reject) {
    if (this.currentLoginModal) {
        this.closeLoginModal();
    }

    const overlay = document.createElement('div');
    overlay.id = 'noskid-login-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(139, 69, 19, 0.15);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(8px);
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    const modal = document.createElement('div');
    modal.id = 'noskid-login-modal';
    modal.style.cssText = `
        background: linear-gradient(135deg, #fcfaf5 0%, #f0ede0 100%);
        border: 2px solid #8b4513;
        border-radius: 16px;
        padding: 0;
        max-width: 480px;
        width: 95%;
        max-height: 95vh;
        overflow: hidden;
        box-shadow: 
            0 25px 50px -12px rgba(139, 69, 19, 0.25),
            0 0 0 1px rgba(139, 69, 19, 0.1),
            inset 0 1px 0 rgba(252, 250, 245, 0.9);
        transform: translateY(20px) scale(0.95);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes noskidModalSlideIn {
            from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        @keyframes noskidPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        @keyframes noskidShake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            75% { transform: translateX(4px); }
        }
        
        .noskid-modal-active {
            opacity: 1 !important;
        }
        
        .noskid-modal-active #noskid-login-modal {
            transform: translateY(0) scale(1) !important;
        }
        
        .noskid-header {
            background: linear-gradient(135deg, #f9f7f0 0%, #e8e5d8 100%);
            border-bottom: 1px solid #8b4513;
            padding: 24px;
            text-align: center;
            position: relative;
        }
        
        .noskid-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(139, 69, 19, 0.3), transparent);
        }
        
        .noskid-content {
            padding: 32px;
            overflow-y: auto;
            max-height: calc(95vh - 140px);
        }
        
        .noskid-title {
            margin: 0;
            color: #8b4513;
            font-size: 24px;
            font-family: 'Times New Roman', serif;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }
        
        .noskid-subtitle {
            margin: 8px 0 0 0;
            color: rgba(139, 69, 19, 0.7);
            font-size: 14px;
            font-family: system-ui, -apple-system, sans-serif;
        }
        
        .noskid-icon {
            width: 28px;
            height: 28px;
            background: #8b4513;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fcfaf5;
            font-size: 16px;
            box-shadow: 0 2px 4px rgba(139, 69, 19, 0.2);
        }
        
        .noskid-form-group {
            margin-bottom: 24px;
        }
        
        .noskid-label {
            display: block;
            margin-bottom: 8px;
            color: #8b4513;
            font-size: 14px;
            font-weight: 600;
            font-family: system-ui, -apple-system, sans-serif;
        }
        
        .noskid-cert-upload {
            border: 2px dashed rgba(139, 69, 19, 0.3);
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            background: linear-gradient(135deg, rgba(252, 250, 245, 0.5), rgba(240, 237, 224, 0.5));
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
            min-height: 120px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        
        .noskid-cert-upload:hover {
            border-color: #8b4513;
            background: linear-gradient(135deg, rgba(252, 250, 245, 0.8), rgba(240, 237, 224, 0.8));
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(139, 69, 19, 0.1);
        }
        
        .noskid-cert-upload.dragover {
            border-color: #8b4513;
            background: linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(139, 69, 19, 0.05));
            animation: noskidPulse 1s infinite;
        }
        
        .noskid-cert-upload.error {
            border-color: #dc2626;
            animation: noskidShake 0.5s ease-in-out;
        }
        
        .noskid-cert-upload.success {
            border-color: #059669;
            background: linear-gradient(135deg, rgba(5, 150, 105, 0.1), rgba(5, 150, 105, 0.05));
        }
        
        .noskid-upload-icon {
            width: 48px;
            height: 48px;
            margin-bottom: 12px;
            background: rgba(139, 69, 19, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #8b4513;
            font-size: 24px;
            transition: all 0.3s ease;
        }
        
        .noskid-cert-upload:hover .noskid-upload-icon {
            background: rgba(139, 69, 19, 0.2);
            transform: scale(1.1);
        }
        
        .noskid-upload-text {
            color: #8b4513;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .noskid-upload-hint {
            color: rgba(139, 69, 19, 0.6);
            font-size: 12px;
            line-height: 1.4;
        }
        
        .noskid-file-input {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
        }
        
        .noskid-input {
            width: 100%;
            padding: 16px;
            border: 2px solid rgba(139, 69, 19, 0.2);
            border-radius: 12px;
            font-size: 16px;
            box-sizing: border-box;
            background: rgba(252, 250, 245, 0.8);
            color: #8b4513;
            font-family: system-ui, -apple-system, sans-serif;
            transition: all 0.3s ease;
        }
        
        .noskid-input:focus {
            outline: none;
            border-color: #8b4513;
            box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.1);
            background: #fcfaf5;
        }
        
        .noskid-input::placeholder {
            color: rgba(139, 69, 19, 0.5);
        }
        
        .noskid-btn {
            background: linear-gradient(135deg, #8b4513 0%, #6d3410 100%);
            color: #fcfaf5;
            border: none;
            padding: 16px 32px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            font-family: system-ui, -apple-system, sans-serif;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(139, 69, 19, 0.2);
            position: relative;
            overflow: hidden;
        }
        
        .noskid-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s ease;
        }
        
        .noskid-btn:hover::before {
            left: 100%;
        }
        
        .noskid-btn:hover {
            background: linear-gradient(135deg, #6d3410 0%, #5a2b0d 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(139, 69, 19, 0.3);
        }
        
        .noskid-btn:active {
            transform: translateY(0);
        }
        
        .noskid-btn:disabled {
            background: rgba(139, 69, 19, 0.3);
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .noskid-btn:disabled::before {
            display: none;
        }
        
        .noskid-btn-secondary {
            background: linear-gradient(135deg, rgba(139, 69, 19, 0.1) 0%, rgba(139, 69, 19, 0.2) 100%);
            color: #8b4513;
            border: 2px solid rgba(139, 69, 19, 0.3);
            padding: 14px 30px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            font-family: system-ui, -apple-system, sans-serif;
            transition: all 0.3s ease;
        }
        
        .noskid-btn-secondary:hover {
            background: linear-gradient(135deg, rgba(139, 69, 19, 0.2) 0%, rgba(139, 69, 19, 0.3) 100%);
            border-color: #8b4513;
            transform: translateY(-2px);
        }
        
        .noskid-error {
            color: #dc2626;
            font-size: 14px;
            margin-top: 8px;
            padding: 12px;
            background: rgba(220, 38, 38, 0.1);
            border: 1px solid rgba(220, 38, 38, 0.2);
            border-radius: 8px;
            font-family: system-ui, -apple-system, sans-serif;
        }
        
        .noskid-success {
            color: #059669;
            font-size: 14px;
            margin-top: 8px;
            padding: 12px;
            background: rgba(5, 150, 105, 0.1);
            border: 1px solid rgba(5, 150, 105, 0.2);
            border-radius: 8px;
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .noskid-actions {
            display: flex;
            gap: 16px;
            justify-content: flex-end;
            margin-top: 32px;
        }
        
        .noskid-cert-info {
            background: rgba(139, 69, 19, 0.05);
            border: 1px solid rgba(139, 69, 19, 0.2);
            border-radius: 8px;
            padding: 16px;
            margin-top: 12px;
        }
        
        .noskid-cert-user {
            font-weight: 600;
            color: #8b4513;
            margin-bottom: 4px;
        }
        
        .noskid-cert-details {
            font-size: 12px;
            color: rgba(139, 69, 19, 0.7);
        }
        
        .noskid-paste-hint {
            margin-top: 8px;
            font-size: 11px;
            color: rgba(139, 69, 19, 0.5);
            text-align: center;
            font-style: italic;
        }
        
        @media (max-width: 600px) {
            .noskid-content {
                padding: 24px;
            }
            
            .noskid-header {
                padding: 20px;
            }
            
            .noskid-title {
                font-size: 20px;
            }
            
            .noskid-actions {
                flex-direction: column-reverse;
            }
            
            .noskid-btn,
            .noskid-btn-secondary {
                width: 100%;
                justify-content: center;
            }
        }
    `;
    document.head.appendChild(style);

    modal.innerHTML = `
        <div class="noskid-header">
            <h2 class="noskid-title">
                <div class="noskid-icon">🔐</div>
                Login with NoSkid
            </h2>
            <p class="noskid-subtitle">Upload your certificate and enter your password to authenticate</p>
        </div>
        
        <div class="noskid-content">
            <div class="noskid-form-group">
                <label class="noskid-label">Certificate File</label>
                <div class="noskid-cert-upload" id="noskid-cert-upload">
                    <div class="noskid-upload-icon">📄</div>
                    <div class="noskid-upload-text">Drop certificate here or click to browse</div>
                    <div class="noskid-upload-hint">
                        Supports .png files • Drag & drop • Paste from clipboard<br>
                        <kbd>Ctrl+V</kbd> to paste certificate
                    </div>
                    <input type="file" id="noskid-cert-file" accept=".png" class="noskid-file-input">
                </div>
                <div id="noskid-file-error" class="noskid-error" style="display: none;"></div>
                <div id="noskid-file-success" class="noskid-success" style="display: none;">
                    <span>✓</span>
                    <div id="noskid-cert-info"></div>
                </div>
            </div>
            
            <div class="noskid-form-group">
                <label class="noskid-label">Password</label>
                <input type="password" id="noskid-password" class="noskid-input" placeholder="Enter your password">
                <div id="noskid-password-error" class="noskid-error" style="display: none;"></div>
            </div>
            
            <div id="noskid-login-error" class="noskid-error" style="display: none;"></div>
            
            <div class="noskid-actions">
                <button id="noskid-cancel-btn" class="noskid-btn-secondary">Cancel</button>
                <button id="noskid-login-btn" class="noskid-btn" disabled>
                    <span>Login</span>
                </button>
            </div>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    this.currentLoginModal = overlay;

    requestAnimationFrame(() => {
        overlay.classList.add('noskid-modal-active');
    });

    const uploadArea = modal.querySelector('#noskid-cert-upload');
    const fileInput = modal.querySelector('#noskid-cert-file');
    const passwordInput = modal.querySelector('#noskid-password');
    const loginBtn = modal.querySelector('#noskid-login-btn');
    const cancelBtn = modal.querySelector('#noskid-cancel-btn');
    const fileError = modal.querySelector('#noskid-file-error');
    const fileSuccess = modal.querySelector('#noskid-file-success');
    const certInfo = modal.querySelector('#noskid-cert-info');
    const passwordError = modal.querySelector('#noskid-password-error');
    const loginError = modal.querySelector('#noskid-login-error');

    let certificateValid = false;
    let tempCertData = null;

    const processFile = async (file) => {
        fileError.style.display = 'none';
        fileSuccess.style.display = 'none';
        uploadArea.classList.remove('error', 'success');
        certificateValid = false;
        tempCertData = null;
        updateLoginButton();

        if (!file) return;

        try {
            this.nskdLbrLog('Processing certificate for login...', 'info');
            
            const tempInstance = new NskdLbr({
                apiUrl: this.apiUrl,
                debug: this.debug,
                timeout: this.timeout,
                strictCheck: this.strictCheck,
                useLegacyAPI: this.useLegacyAPI
            });

            const result = await tempInstance.loadFromFile(file);
            
            if (result.valid) {
                certificateValid = true;
                tempCertData = tempInstance.getCertificateData();
                
                certInfo.innerHTML = `
                    <div class="noskid-cert-user">${tempCertData.localUsername || 'Unknown User'}</div>
                    <div class="noskid-cert-details">
                        Certificate verified • ${(file.size / 1024).toFixed(1)} KB
                    </div>
                `;
                
                uploadArea.classList.add('success');
                uploadArea.querySelector('.noskid-upload-text').textContent = 'Certificate loaded successfully!';
                uploadArea.querySelector('.noskid-upload-icon').textContent = '✓';
                fileSuccess.style.display = 'block';
                
                this.nskdLbrLog('Certificate verified for login', 'success');
            } else {
                throw new Error(result.message || 'Certificate verification failed');
            }
        } catch (error) {
            uploadArea.classList.add('error');
            uploadArea.querySelector('.noskid-upload-text').textContent = 'Certificate verification failed';
            uploadArea.querySelector('.noskid-upload-icon').textContent = '❌';
            fileError.textContent = error.message;
            fileError.style.display = 'block';
            this.nskdLbrLog(`Certificate verification failed: ${error.message}`, 'error');
        }
        
        updateLoginButton();
    };

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        await processFile(file);
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        if (!uploadArea.contains(e.relatedTarget)) {
            uploadArea.classList.remove('dragover');
        }
    });

    uploadArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'image/png' || file.name.endsWith('.png')) {
                await processFile(file);
            } else {
                uploadArea.classList.add('error');
                fileError.textContent = 'Please drop a valid PNG certificate file';
                fileError.style.display = 'block';
            }
        }
    });

    document.addEventListener('paste', async (e) => {
        if (!overlay.classList.contains('noskid-modal-active')) return;
        
        const items = e.clipboardData.items;
        for (let item of items) {
            if (item.type === 'image/png') {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    await processFile(file);
                }
                break;
            }
        }
    });

    passwordInput.addEventListener('input', () => {
        passwordError.style.display = 'none';
        loginError.style.display = 'none';
        updateLoginButton();
    });

    const updateLoginButton = () => {
        const hasPassword = passwordInput.value.trim().length > 0;
        loginBtn.disabled = !certificateValid || !hasPassword;
        
        loginBtn.innerHTML = '<span>Login</span>';
    };

    loginBtn.addEventListener('click', async () => {
        const password = passwordInput.value.trim();
        
        if (!certificateValid || !tempCertData) {
            passwordError.textContent = 'Please upload a valid certificate first';
            passwordError.style.display = 'block';
            return;
        }

        if (!password) {
            passwordError.textContent = 'Please enter your password';
            passwordError.style.display = 'block';
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span>Logging in...</span>';
        loginError.style.display = 'none';

        try {
            const loginResult = await this.performLogin(tempCertData, password);
            
            if (loginResult.success) {
                this.nskdLbrLog('Login successful', 'success');
                
                this.certificateData = tempCertData;
                this.verificationKey = tempCertData.key;
                this.isValid = true;
                
                if (this.onLoginSuccess && typeof this.onLoginSuccess === 'function') {
                    this.onLoginSuccess(loginResult, tempCertData);
                }
                
                loginBtn.innerHTML = '<span>Success!</span>';
                setTimeout(() => {
                    this.closeLoginModal();
                    resolve({ success: true, data: tempCertData, response: loginResult });
                }, 800);
            } else {
                throw new Error(loginResult.message || 'Login failed');
            }
        } catch (error) {
            this.nskdLbrLog(`Login failed: ${error.message}`, 'error');
            loginError.textContent = error.message;
            loginError.style.display = 'block';
            
            if (this.onLoginFail && typeof this.onLoginFail === 'function') {
                this.onLoginFail(error, tempCertData);
            }
            
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span>Try Again</span>';
        }
    });

    cancelBtn.addEventListener('click', () => {
        this.nskdLbrLog('Login cancelled by user', 'info');
        this.closeLoginModal();
        reject(new Error('Login cancelled by user'));
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            this.nskdLbrLog('Login cancelled by clicking outside', 'info');
            this.closeLoginModal();
            reject(new Error('Login cancelled'));
        }
    });

    const escHandler = (e) => {
        if (e.key === 'Escape') {
            this.nskdLbrLog('Login cancelled by ESC key', 'info');
            this.closeLoginModal();
            document.removeEventListener('keydown', escHandler);
            reject(new Error('Login cancelled'));
        }
    };
    document.addEventListener('keydown', escHandler);

    if (certificateValid) {
        passwordInput.focus();
    }
}

    /**
     * Perform login API call
     * @private
     */
    async performLogin(certData, password) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(this.loginEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'NskdLbr/1.1.0'
                },
                body: JSON.stringify({
                    certificate: {
                        key: certData.key,
                        username: certData.localUsername,
                        nickname: certData.nickname,
                        certificate_number: certData.certificate_number,
                        percentage: certData.percentage,
                        country: certData.country,
                        countryCode: certData.countryCode,
                        creationDate: certData.creationDate
                    },
                    password: password
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result;

        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Login timeout - server took too long to respond');
            }
            throw new Error(`Login API error: ${error.message}`);
        }
    }

    /**
     * Close the login modal
     * @private
     */
    closeLoginModal() {
        if (this.currentLoginModal) {
            this.currentLoginModal.remove();
            this.currentLoginModal = null;
        }
    }

    /**
     * Load and verify a certificate from a PNG file
     * @param {File} file - The PNG certificate file
     * @returns {Promise<Object>} Verification result
     */
    async loadFromFile(file) {
        try {
            this.nskdLbrLog('Starting certificate verification process...', 'info');

            if (!file) {
                throw new Error('No file provided');
            }

            if (!file.name.toLowerCase().endsWith('.png')) {
                throw new Error('File must be a PNG image');
            }

            this.nskdLbrLog(`Processing certificate file: ${file.name}`, 'info');

            const arrayBuffer = await this.readFileAsArrayBuffer(file);

            const extractedText = await this.extractTextFromPng(arrayBuffer);
            if (!extractedText) {
                throw new Error('Could not extract verification data from file');
            }

            this.verificationKey = this.extractVerificationKey(extractedText);
            if (!this.verificationKey) {
                throw new Error('No valid verification key found in certificate');
            }

            this.nskdLbrLog('Successfully extracted verification key', 'success');

            this.localData = this.extractLocalData(extractedText);
            if (this.localData) {
                this.nskdLbrLog('Local certificate data extracted:', 'info');
                this.nskdLbrLog(`Username: ${this.localData.username}`, 'info');
                this.nskdLbrLog(`Creation Date: ${this.localData.creationDate}`, 'info');
            }

            const result = await this.verifyWithAPI();
            return result;

        } catch (error) {
            this.nskdLbrLog(`Error loading certificate: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Verify a certificate using a verification key directly
     * @param {string} key - The verification key (64-character hex string)
     * @returns {Promise<Object>} Verification result
     */
    async verifyWithKey(key) {
        try {
            if (!key || typeof key !== 'string') {
                throw new Error('Invalid verification key provided');
            }

            if (!/^[a-f0-9]{64}$/i.test(key)) {
                throw new Error('Verification key must be a 64-character hexadecimal string');
            }

            this.verificationKey = key.toLowerCase();
            this.nskdLbrLog(`Verifying certificate with key: ${this.verificationKey.substring(0, 16)}...`, 'info');

            const result = await this.verifyWithAPI();
            return result;

        } catch (error) {
            this.nskdLbrLog(`Error verifying certificate: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Get the current certificate data
     * @returns {Object|null} Certificate data or null if not loaded/verified
     */
    getCertificateData() {
        if (!this.certificateData) {
            return null;
        }

        return {
            ...this.certificateData,
            key: this.verificationKey,
            localUsername: this.localData ? this.localData.username : null,
            localCreationDate: this.localData ? this.localData.creationDate : null
        };
    }

    /**
     * Check if the certificate is valid
     * @returns {boolean} True if certificate is valid
     */
    isValidCertificate() {
        return this.isValid;
    }

    /**
     * Get formatted certificate details as a string
     * @returns {string} Formatted certificate details
     */
    getFormattedDetails() {
        if (!this.certificateData) {
            return 'No certificate data available';
        }

        const data = this.certificateData;
        const username = this.useLegacyAPI ? data.username : data.nickname || data.username;

        return `
Certificate Details:
- Certificate #: ${data.certificate_number}
- Username: ${username}
- Percentage: ${data.percentage}%
- Creation Date: ${data.creationDate}
- Country: ${data.country} (${data.countryCode})
        `.trim();
    }

    /**
     * Reset the certificate data
     */
    reset() {
        this.certificateData = null;
        this.verificationKey = null;
        this.localData = null;
        this.isValid = false;
        this.closeLoginModal();
        this.nskdLbrLog('Certificate data reset', 'info');
    }

    // Private methods

    /**
     * Read file as array buffer
     * @private
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Extract text from PNG tEXt chunk
     * @private
     */
    async extractTextFromPng(arrayBuffer) {
        try {
            const bytes = new Uint8Array(arrayBuffer);

            // Check PNG header
            if (!(bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47)) {
                throw new Error("Not a valid PNG file");
            }

            let pos = 8; // Skip PNG header
            let extractedText = null;

            while (pos < bytes.length - 12) {
                const length = (
                    (bytes[pos] << 24) |
                    (bytes[pos + 1] << 16) |
                    (bytes[pos + 2] << 8) |
                    (bytes[pos + 3])
                );

                const type = String.fromCharCode(
                    bytes[pos + 4],
                    bytes[pos + 5],
                    bytes[pos + 6],
                    bytes[pos + 7]
                );

                if (type === 'tEXt') {
                    const chunkData = bytes.slice(pos + 8, pos + 8 + length);
                    const text = new TextDecoder('utf-8').decode(chunkData);

                    const separatorIndex = text.indexOf('\0');
                    if (separatorIndex !== -1) {
                        const keyword = text.substring(0, separatorIndex);
                        const value = text.substring(separatorIndex + 1);

                        if (keyword === 'noskid-key') {
                            extractedText = value;
                            break;
                        }
                    }
                }
                pos += 8 + length + 4;
            }

            if (extractedText) {
                this.nskdLbrLog("Certificate data extracted successfully from PNG", 'success');
                return extractedText;
            } else {
                this.nskdLbrLog("No 'noskid-key' text chunk found in PNG", 'error');
                return null;
            }
        } catch (error) {
            this.nskdLbrLog(`Error extracting text from PNG: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Extract verification key from certificate text
     * @private
     */
    extractVerificationKey(text) {
        try {
            const keyPattern = /-*BEGIN NOSKID KEY-*\s*([a-f0-9]{64})/i;
            const match = text.match(keyPattern);
            return match ? match[1].toLowerCase() : null;
        } catch (error) {
            this.nskdLbrLog(`Error extracting verification key: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Extract local certificate data
     * @private
     */
    extractLocalData(text) {
        try {
            const keyPattern = /-----BEGIN NOSKID KEY-----\s*([a-f0-9]+)\s*([A-Za-z0-9+/=]+)\s*([A-Za-z0-9+/=]+)\s*-----END NOSKID KEY-----/;
            const match = text.match(keyPattern);

            if (!match) return null;

            const certInfoEncoded = match[2];
            const certInfoDecoded = atob(certInfoEncoded.replace(/=/g, ''));
            const usernameMatch = certInfoDecoded.match(/CERT-\d+-(.+)/);
            const username = usernameMatch ? usernameMatch[1] : null;

            const dateInfoEncoded = match[3];
            const dateInfoDecoded = atob(dateInfoEncoded.replace(/=/g, ''));
            const dateMatch = dateInfoDecoded.match(/CREATED-(.+)/);
            const creationDate = dateMatch ? dateMatch[1] : null;

            return { username, creationDate };
        } catch (error) {
            this.nskdLbrLog(`Error extracting local data: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Verify certificate with API
     * @private
     */
    async verifyWithAPI() {
        try {
            this.nskdLbrLog('Verifying certificate with server...', 'info');

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(
                `${this.apiUrl}?key=${encodeURIComponent(this.verificationKey)}`,
                {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'NskdLbr/1.1.0'
                    }
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const apiData = await response.json();

            if (!apiData.success) {
                this.isValid = false;
                this.nskdLbrLog(`Certificate verification failed: ${apiData.message}`, 'error');
                return {
                    valid: false,
                    message: apiData.message,
                    cached: apiData.cached || false
                };
            }

            // Compare local data with API data if available and strictCheck is enabled
            if (this.localData && this.strictCheck) {
                const apiUsername = this.useLegacyAPI ? apiData.data.username : (apiData.data.nickname || apiData.data.username);
                const validationResult = this.compareData(this.localData, { ...apiData.data, username: apiUsername });

                if (!validationResult.valid) {
                    this.isValid = false;
                    this.nskdLbrLog('Certificate data mismatch!', 'error');
                    this.nskdLbrLog(`Mismatch reason: ${validationResult.reason}`, 'error');
                    this.nskdLbrLog('Note: Strict checking is enabled. Set strictCheck to false to skip local data validation.', 'warning');
                    return {
                        valid: false,
                        message: `Data mismatch: ${validationResult.reason}`,
                        cached: apiData.cached || false,
                        strictCheck: true
                    };
                }
                this.nskdLbrLog('Local data validation passed', 'success');
            } else if (this.localData && !this.strictCheck) {
                this.nskdLbrLog('Strict checking disabled - skipping local data validation', 'warning');
            }

            this.isValid = true;
            this.certificateData = apiData.data;
            this.nskdLbrLog('Certificate is VALID!', 'success');

            return {
                valid: true,
                message: 'Certificate verified successfully',
                data: apiData.data,
                cached: apiData.cached || false,
                strictCheck: this.strictCheck
            };

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - server took too long to respond');
            }
            throw new Error(`API verification failed: ${error.message}`);
        }
    }

    /**
     * Compare local and API data
     * @private
     */
    compareData(localData, apiData) {
        if (!localData || !apiData) {
            return { valid: false, reason: 'Missing data for comparison' };
        }

        if (localData.username !== apiData.username) {
            return {
                valid: false,
                reason: `Username mismatch: Local=${localData.username}, API=${apiData.username}`
            };
        }

        const localDateMinutes = localData.creationDate.substring(0, 16);
        const apiDateMinutes = apiData.creationDate.substring(0, 16);

        if (localDateMinutes !== apiDateMinutes) {
            return {
                valid: false,
                reason: `Creation date mismatch: Local=${localDateMinutes}, API=${apiDateMinutes}`
            };
        }

        return { valid: true };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NskdLbr;
} else {
    window.NskdLbr = NskdLbr;
}