// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';
let currentTemplates = {};
let currentLocalTerms = {};

// Template mapping untuk konversi frontend ke backend
const TEMPLATE_MAP = {
    'product': 'product-description',
    'social': 'social-media',
    'article': 'blog-article',
    'ad': 'product-description'
};

// DOM Elements untuk Scarlet Nexus Theme
const generateBtn = document.getElementById('generate-btn');
const copyBtn = document.getElementById('copy-btn');
const improveBtn = document.getElementById('improve-btn');
const localizeBtn = document.getElementById('localize-btn');
const topicInput = document.getElementById('topic');
const toneSelect = document.getElementById('tone');
const detailsInput = document.getElementById('details');
const lengthSlider = document.getElementById('length');
const lengthValue = document.getElementById('length-value');
const outputContent = document.getElementById('output-content');
const wordCount = document.getElementById('word-count');
const templateButtons = document.querySelectorAll('.template-btn');
const localTermsContainer = document.getElementById('local-terms');

// New DOM Elements for Scarlet Nexus
const downloadBtn = document.getElementById('download-btn');
const shareBtn = document.getElementById('share-btn');
const clearBtn = document.getElementById('clear-btn');
const backendStatus = document.getElementById('backend-status');
const apiUrlElement = document.getElementById('api-url');
const metaTemplate = document.getElementById('meta-template');
const metaTone = document.getElementById('meta-tone');
const metaTime = document.getElementById('meta-time');
const metaMode = document.getElementById('meta-mode');

// API Service
const apiService = {
    async generateContent(data) {
        console.log('📤 Sending generate request:', data);
        
        const activeTemplate = document.querySelector('.template-btn.active');
        let templateId = 'product';
        
        if (activeTemplate) {
            templateId = activeTemplate.dataset.template;
        }
        
        // Format data untuk backend
        const backendData = {
            template: TEMPLATE_MAP[templateId] || 'product-description',
            prompt: data.topic + (data.details ? '\n\n' + data.details : ''),
            tone: data.tone || 'casual',
            language: 'indonesia',
            length: data.length || 200
        };
        
        console.log('🔄 Converted to backend format:', backendData);
        
        const response = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(backendData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || `HTTP ${response.status}`);
        }
        
        return result;
    },

    async getTemplates() {
        const response = await fetch(`${API_BASE_URL}/templates`);
        if (!response.ok) throw new Error('Failed to fetch templates');
        return await response.json();
    },

    async getLocalTerms() {
        const response = await fetch(`${API_BASE_URL}/local-terms`);
        if (!response.ok) throw new Error('Failed to fetch local terms');
        return await response.json();
    },

    async improveContent(content) {
        const response = await fetch(`${API_BASE_URL}/improve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content })
        });
        
        if (!response.ok) throw new Error('Failed to improve content');
        return await response.json();
    },

    async localizeContent(content) {
        const response = await fetch(`${API_BASE_URL}/localize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content })
        });
        
        if (!response.ok) throw new Error('Failed to localize content');
        return await response.json();
    },

    async checkAPIStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/status`, { 
                timeout: 3000 
            });
            return response.ok;
        } catch (error) {
            console.log('API Status Check Failed:', error);
            return false;
        }
    },

    async getConfigInfo() {
        try {
            const response = await fetch(`${API_BASE_URL}/config/info`);
            if (!response.ok) throw new Error('Failed to fetch config');
            return await response.json();
        } catch (error) {
            console.error('Config info error:', error);
            return { success: false };
        }
    },

    async testAI() {
        try {
            const response = await fetch(`${API_BASE_URL}/test-ai`);
            if (!response.ok) throw new Error('Failed to test AI');
            return await response.json();
        } catch (error) {
            console.error('AI test error:', error);
            return { success: false, aiStatus: { realAIEnabled: false } };
        }
    }
};

// ==================== INITIALIZATION ====================

// Initialize Application
async function initApp() {
    console.log('🚀 Initializing Scarlet Nexus AI Assistant...');
    
    // Update API URL display
    if (apiUrlElement) {
        apiUrlElement.textContent = API_BASE_URL;
    }
    
    // Check API Status
    const isOnline = await apiService.checkAPIStatus();
    updateBackendStatus(isOnline);
    
    if (isOnline) {
        showNotification('✅ Backend terhubung! Scarlet Nexus aktif.', 'success', 3000);
        
        // Load server config
        await loadServerConfig();
        
        // Load templates and local terms
        await loadTemplates();
        await loadLocalTerms();
        
        // Set default template
        if (templateButtons.length > 0) {
            templateButtons[0].click();
        }
        
        // Test AI connection
        await testAIConnection();
    } else {
        showNotification('❌ Backend tidak terhubung. Pastikan server berjalan di port 3000.', 'error', 5000);
        console.error('Backend offline. Run: cd backend && npm start');
    }
    
    // Initialize UI
    initUI();
    
    // Setup new button listeners
    setupAdditionalButtons();
}

// Initialize UI Elements
function initUI() {
    // Update length display
    if (lengthSlider && lengthValue) {
        lengthSlider.addEventListener('input', function() {
            lengthValue.textContent = `${this.value} kata`;
        });
    }
    
    // Setup template buttons
    setupTemplateButtons();
    
    // Setup example prompts
    setupExamples();
}

// Setup Template Buttons
function setupTemplateButtons() {
    templateButtons.forEach(button => {
        button.addEventListener('click', function() {
            const template = this.dataset.template;
            
            // Update active state
            templateButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.borderColor = '#2a2a2a';
                btn.style.transform = 'translateY(0)';
            });
            
            this.classList.add('active');
            this.style.borderColor = '#e63946';
            this.style.transform = 'translateY(-5px)';
            
            // Set placeholder berdasarkan template
            const examples = {
                'product': 'Kaos Distro Lokal dengan Motif Batik Modern',
                'social': 'Promosi Kopi Kekinian dari Biji Lokal Nusantara',
                'article': 'Perkembangan Teknologi Startup di Indonesia 2024',
                'ad': 'Kursus Online Digital Marketing untuk Pemula UMKM'
            };
            
            const descriptions = {
                'product': 'Misal: bahan katun combed 30s, ukuran S-XXL, motif eksklusif, ready stock',
                'social': 'Misal: untuk Instagram Feed, target usia 18-30 tahun, tone casual & fun',
                'article': 'Misal: panjang 500 kata, fokus pada funding & market trend, bahasa semi-formal',
                'ad': 'Misal: durasi 1 bulan, harga promo, benefit lengkap, testimoni alumni'
            };
            
            if (topicInput) {
                topicInput.value = examples[template] || '';
            }
            
            if (detailsInput) {
                detailsInput.placeholder = descriptions[template] || 'Tambahkan detail spesifik...';
            }
            
            // Set tone default berdasarkan template
            if (toneSelect) {
                toneSelect.value = template === 'article' ? 'formal' : 'casual';
            }
            
            showNotification(`🎯 Template "${this.querySelector('.template-name').textContent}" dipilih`, 'info', 2000);
        });
    });
}

// Setup Example Prompts
function setupExamples() {
    const examplesBtn = document.createElement('button');
    examplesBtn.id = 'examples-btn';
    examplesBtn.innerHTML = '<i class="fas fa-lightbulb"></i> Contoh Prompt';
    examplesBtn.className = 'secondary-btn';
    examplesBtn.style.marginTop = '10px';
    
    examplesBtn.addEventListener('click', function() {
        const examples = [
            "Deskripsi kaos distro limited edition dengan motif batik modern",
            "Konten Instagram untuk promosi kopi single origin dari Toraja",
            "Artikel tentang perkembangan e-commerce di Indonesia pasca pandemi",
            "Iklan kursus online coding untuk pemula dengan garansi kerja",
            "Copywriting untuk produk skincare lokal dengan bahan alami",
            "Konten LinkedIn untuk personal branding di industri teknologi",
            "Deskripsi produk furniture kayu jati dengan desain minimalis",
            "Script video TikTok untuk edukasi finansial anak muda"
        ];
        
        const randomExample = examples[Math.floor(Math.random() * examples.length)];
        if (topicInput) {
            topicInput.value = randomExample;
        }
        showNotification('✨ Contoh prompt ditambahkan!', 'success', 2000);
    });
    
    if (topicInput && topicInput.parentNode) {
        topicInput.parentNode.appendChild(examplesBtn);
    }
}

// ==================== STATUS UPDATES ====================

// Update backend status in footer
function updateBackendStatus(isOnline) {
    if (backendStatus) {
        if (isOnline) {
            backendStatus.textContent = 'Online';
            backendStatus.className = 'status-online';
        } else {
            backendStatus.textContent = 'Offline';
            backendStatus.className = 'status-offline';
        }
    }
}

// Update AI Status in header
function updateAIStatusUI(config) {
    const aiStatusElement = document.querySelector('.ai-status .ai-indicator');
    if (aiStatusElement) {
        const isRealAI = config.features.realAI;
        aiStatusElement.className = `ai-indicator ${isRealAI ? 'ai-online' : 'ai-offline'}`;
        aiStatusElement.innerHTML = `
            <i class="fas fa-robot"></i> AI: ${isRealAI ? 'Real 🚀' : 'Simulasi ⚠️'}
        `;
    }
}

// Update Meta Information
function updateMetaInfo(data) {
    if (metaTemplate) {
        metaTemplate.textContent = data.template || '-';
    }
    
    if (metaTone) {
        metaTone.textContent = data.tone || '-';
    }
    
    if (metaTime) {
        metaTime.textContent = new Date().toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    if (metaMode) {
        metaMode.textContent = data.aiMode === 'real' ? 'AI Real' : 'Demo';
        metaMode.className = data.aiMode === 'real' ? 'badge-real' : 'badge-demo';
    }
}

// ==================== LOAD DATA ====================

// Load Server Config
async function loadServerConfig() {
    try {
        const result = await apiService.getConfigInfo();
        
        if (result.success) {
            const config = result.data;
            console.log('⚙️ Server Config:', config);
            
            // Update UI dengan status AI
            updateAIStatusUI(config);
        }
    } catch (error) {
        console.warn('Could not load server config:', error);
    }
}

// Test AI Connection
async function testAIConnection() {
    try {
        const result = await apiService.testAI();
        
        if (result.success) {
            console.log('🤖 AI Test Result:', result.aiStatus);
            
            if (result.aiStatus.realAIEnabled) {
                showNotification('✅ AI Real terhubung! Konten akan dibuat dengan AI canggih.', 'success', 4000);
            } else {
                showNotification('⚠️ Menggunakan AI simulasi. Untuk AI real, atur USE_REAL_AI=true di .env', 'info', 5000);
            }
        }
    } catch (error) {
        console.warn('AI Test failed:', error);
    }
}

// Load Templates
async function loadTemplates() {
    try {
        const result = await apiService.getTemplates();
        if (result.success) {
            currentTemplates = result.data.reduce((acc, template) => {
                acc[template.id] = template;
                return acc;
            }, {});
            
            console.log('📋 Templates loaded:', currentTemplates);
        }
    } catch (error) {
        console.error('Error loading templates:', error);
        showNotification('Gagal memuat template', 'error');
    }
}

// Load Local Terms
async function loadLocalTerms() {
    try {
        const result = await apiService.getLocalTerms();
        if (result.success) {
            currentLocalTerms = result.data;
            displayLocalTerms();
        }
    } catch (error) {
        console.error('Error loading local terms:', error);
        // Fallback ke terms lokal
        currentLocalTerms = {
            'istilah-nusantara': ['gawai', 'unggah', 'unduh', 'luring', 'daring']
        };
        displayLocalTerms();
    }
}

// Display Local Terms
function displayLocalTerms() {
    if (!currentLocalTerms || Object.keys(currentLocalTerms).length === 0) {
        if (localTermsContainer) {
            localTermsContainer.innerHTML = '<p class="no-terms">Klik untuk menambahkan istilah lokal...</p>';
        }
        return;
    }
    
    let allTerms = [];
    Object.values(currentLocalTerms).forEach(category => {
        allTerms = [...allTerms, ...category];
    });
    
    // Shuffle dan ambil 8-12 terms
    const shuffled = [...allTerms].sort(() => 0.5 - Math.random());
    const selectedTerms = shuffled.slice(0, Math.min(10, shuffled.length));
    
    if (localTermsContainer) {
        localTermsContainer.innerHTML = '';
        
        selectedTerms.forEach(term => {
            const badge = document.createElement('span');
            badge.className = 'term-badge';
            badge.textContent = term;
            badge.title = `Klik untuk menambahkan "${term}"`;
            
            badge.addEventListener('click', () => {
                if (detailsInput && detailsInput.value.includes(term)) {
                    showNotification(`"${term}" sudah ada dalam detail`, 'info', 2000);
                    return;
                }
                
                if (detailsInput) {
                    detailsInput.value += (detailsInput.value ? ', ' : '') + term;
                    detailsInput.focus();
                }
                
                // Highlight sementara
                badge.style.animation = 'pulse 0.5s';
                setTimeout(() => badge.style.animation = '', 500);
                
                showNotification(`"${term}" ditambahkan ke detail`, 'success', 2000);
            });
            
            localTermsContainer.appendChild(badge);
        });
    }
}

// ==================== MAIN ACTIONS ====================

// Generate Content
if (generateBtn) {
    generateBtn.addEventListener('click', async function() {
        const topic = topicInput ? topicInput.value.trim() : '';
        const tone = toneSelect ? toneSelect.value : 'casual';
        const details = detailsInput ? detailsInput.value.trim() : '';
        const length = lengthSlider ? parseInt(lengthSlider.value) : 200;
        
        if (!topic) {
            showNotification('❌ Mohon isi topik terlebih dahulu!', 'error');
            if (topicInput) {
                topicInput.focus();
                topicInput.style.borderColor = '#e63946';
                setTimeout(() => {
                    if (topicInput) topicInput.style.borderColor = '';
                }, 1000);
            }
            return;
        }
        
        // Tampilkan loading
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<span class="loading"></span> Membuat Konten...';
        generateBtn.disabled = true;
        
        // Reset output area dengan placeholder yang lebih menarik
        if (outputContent) {
            outputContent.innerHTML = `
                <div class="output-placeholder generating">
                    <div class="placeholder-icon">
                        <i class="fas fa-robot"></i>
                    </div>
                    <h3>🤖 AI Sedang Bekerja...</h3>
                    <p>Scarlet Nexus sedang membuat konten spesial untuk Anda. Harap tunggu sebentar!</p>
                    <div class="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            `;
        }
        
        if (wordCount) {
            wordCount.textContent = '0 kata';
        }
        
        try {
            console.log('🎯 Generating content with:', { topic, tone, details: details.length, length });
            
            const result = await apiService.generateContent({
                topic,
                tone,
                details,
                length
            });
            
            console.log('✅ Generate result:', result);
            
            if (result.success) {
                const data = result.data;
                
                // Update meta info
                updateMetaInfo(data);
                
                // Format konten dengan line breaks
                const formattedContent = data.content
                    .split('\n')
                    .map(line => line.trim() ? `<p>${line}</p>` : '<br>')
                    .join('');
                
                if (outputContent) {
                    outputContent.innerHTML = `
                        <div class="result-header">
                            <h3>🎉 Konten Berhasil Dibuat!</h3>
                            <span class="badge ${data.aiMode === 'real' ? 'badge-real' : 'badge-demo'}">
                                ${data.aiMode === 'real' ? 'AI Real' : 'Demo Mode'}
                            </span>
                        </div>
                        <div class="content-meta">
                            <span><i class="fas fa-tag"></i> ${data.template}</span>
                            <span><i class="fas fa-language"></i> ${data.language}</span>
                            <span><i class="fas fa-palette"></i> ${data.tone}</span>
                            <span><i class="fas fa-clock"></i> ${new Date(data.generatedAt).toLocaleTimeString('id-ID')}</span>
                        </div>
                        <div class="content-output">
                            ${formattedContent}
                        </div>
                        ${data.note ? `<div class="note"><i class="fas fa-info-circle"></i> ${data.note}</div>` : ''}
                    `;
                }
                
                // Update word count
                if (wordCount) {
                    const words = data.content.split(/\s+/).length;
                    wordCount.textContent = `${words} kata`;
                }
                
                // Update button dengan info AI
                generateBtn.innerHTML = `<i class="fas fa-${data.aiMode === 'real' ? 'bolt' : 'magic'}"></i> ${data.aiMode === 'real' ? 'Buat Lagi (AI Real)' : 'Buat Lagi (Demo)'}`;
                
                showNotification(`✅ Konten berhasil dibuat! (${data.content.split(/\s+/).length} kata, ${data.aiMode})`, 'success');
                
            } else {
                throw new Error(result.error || 'Gagal membuat konten');
            }
            
        } catch (error) {
            console.error('❌ Generate error:', error);
            
            if (outputContent) {
                outputContent.innerHTML = `
                    <div class="error-message">
                        <h3><i class="fas fa-exclamation-triangle"></i> Gagal Membuat Konten</h3>
                        <p>${error.message || 'Terjadi kesalahan yang tidak diketahui'}</p>
                        <p class="error-tips">
                            <strong>Tips:</strong><br>
                            1. Periksa koneksi ke backend<br>
                            2. Pastikan topik sudah diisi<br>
                            3. Coba dengan topik yang berbeda<br>
                            4. Restart server backend jika perlu
                        </p>
                    </div>
                `;
            }
            
            if (wordCount) {
                wordCount.textContent = '0 kata';
            }
            showNotification(`❌ ${error.message || 'Gagal membuat konten'}`, 'error');
            
        } finally {
            setTimeout(() => {
                generateBtn.disabled = false;
                generateBtn.innerHTML = originalText;
            }, 1000);
        }
    });
}

// Copy Content
if (copyBtn) {
    copyBtn.addEventListener('click', async function() {
        const text = outputContent ? outputContent.innerText : '';
        
        if (!text || text.includes('AI Sedang Bekerja') || text.includes('Gagal Membuat Konten') || text.includes('Konten Akan Muncul')) {
            showNotification('❌ Tidak ada konten untuk disalin!', 'error');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(text);
            
            const originalHTML = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i> Tersalin!';
            this.classList.add('success');
            
            showNotification('📋 Konten berhasil disalin ke clipboard!', 'success');
            
            setTimeout(() => {
                this.innerHTML = originalHTML;
                this.classList.remove('success');
            }, 2000);
            
        } catch (error) {
            showNotification('❌ Gagal menyalin ke clipboard', 'error');
        }
    });
}

// Improve Content
if (improveBtn) {
    improveBtn.addEventListener('click', async function() {
        const currentContent = outputContent ? outputContent.innerText : '';
        
        if (!currentContent || currentContent.includes('AI Sedang Bekerja') || 
            currentContent.includes('Gagal Membuat Konten') || 
            currentContent.includes('Konten Akan Muncul')) {
            showNotification('❌ Tidak ada konten untuk diperbaiki!', 'error');
            return;
        }
        
        const originalHTML = this.innerHTML;
        this.innerHTML = '<span class="loading dark"></span> Memperbaiki...';
        this.disabled = true;
        
        try {
            const result = await apiService.improveContent(currentContent);
            
            if (result.success) {
                if (outputContent) {
                    outputContent.innerHTML = `
                        <div class="result-header">
                            <h3>✨ Konten Telah Diperbaiki</h3>
                            <span class="badge badge-improved">Diperbaiki</span>
                        </div>
                        <div class="content-meta">
                            <span><i class="fas fa-check-circle"></i> ${result.data.changes.length} perbaikan</span>
                            <span><i class="fas fa-clock"></i> ${new Date(result.data.improvedAt).toLocaleTimeString('id-ID')}</span>
                        </div>
                        <div class="improvements">
                            <h4>Perbaikan yang dilakukan:</h4>
                            <ul>
                                ${result.data.changes.map(change => `<li>${change}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="content-output">
                            ${result.data.improved.split('\n').map(line => `<p>${line}</p>`).join('')}
                        </div>
                    `;
                }
                
                showNotification('✅ Konten berhasil diperbaiki!', 'success');
            } else {
                throw new Error(result.error || 'Gagal memperbaiki konten');
            }
            
        } catch (error) {
            console.error('Improve error:', error);
            showNotification(`❌ ${error.message || 'Gagal memperbaiki konten'}`, 'error');
            
        } finally {
            this.innerHTML = originalHTML;
            this.disabled = false;
        }
    });
}

// Localize Content
if (localizeBtn) {
    localizeBtn.addEventListener('click', async function() {
        const currentContent = outputContent ? outputContent.innerText : '';
        
        if (!currentContent || currentContent.includes('AI Sedang Bekerja') || 
            currentContent.includes('Gagal Membuat Konten') || 
            currentContent.includes('Konten Akan Muncul')) {
            showNotification('❌ Tidak ada konten untuk dilokalisasi!', 'error');
            return;
        }
        
        const originalHTML = this.innerHTML;
        this.innerHTML = '<span class="loading dark"></span> Melokalisasi...';
        this.disabled = true;
        
        try {
            const result = await apiService.localizeContent(currentContent);
            
            if (result.success) {
                const data = result.data;
                
                if (outputContent) {
                    outputContent.innerHTML = `
                        <div class="result-header">
                            <h3>🇮🇩 Konten Telah Dilokalisasi</h3>
                            <span class="badge badge-localized">Lokal</span>
                        </div>
                        <div class="content-meta">
                            <span><i class="fas fa-plus-circle"></i> Istilah: "${data.addedTerm}"</span>
                            <span><i class="fas fa-clock"></i> ${new Date(data.localizedAt).toLocaleTimeString('id-ID')}</span>
                        </div>
                        <div class="localization-info">
                            <p><i class="fas fa-info-circle"></i> ${data.note || 'Istilah lokal membuat konten lebih relatable'}</p>
                        </div>
                        <div class="content-output">
                            ${data.localized.split('\n').map(line => `<p>${line}</p>`).join('')}
                        </div>
                    `;
                }
                
                // Tambahkan term ke daftar lokal jika belum ada
                if (!Object.values(currentLocalTerms).flat().includes(data.addedTerm)) {
                    const firstCategory = Object.keys(currentLocalTerms)[0];
                    if (firstCategory) {
                        currentLocalTerms[firstCategory].push(data.addedTerm);
                        displayLocalTerms();
                    }
                }
                
                showNotification(`✅ "${data.addedTerm}" ditambahkan ke konten!`, 'success');
            } else {
                throw new Error(result.error || 'Gagal melokalisasi konten');
            }
            
        } catch (error) {
            console.error('Localize error:', error);
            showNotification(`❌ ${error.message || 'Gagal melokalisasi konten'}`, 'error');
            
        } finally {
            this.innerHTML = originalHTML;
            this.disabled = false;
        }
    });
}

// ==================== ADDITIONAL BUTTONS ====================

// Setup Additional Buttons
function setupAdditionalButtons() {
    // Download button
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            const text = outputContent ? outputContent.innerText : '';
            if (!text || text.includes('Konten Akan Muncul') || text.includes('AI Sedang Bekerja')) {
                showNotification('❌ Tidak ada konten untuk didownload!', 'error');
                return;
            }
            
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `scarlet-nexus-content-${new Date().getTime()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('✅ Konten berhasil didownload!', 'success');
        });
    }
    
    // Share button
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            const text = outputContent ? outputContent.innerText : '';
            if (!text || text.includes('Konten Akan Muncul') || text.includes('AI Sedang Bekerja')) {
                showNotification('❌ Tidak ada konten untuk dibagikan!', 'error');
                return;
            }
            
            if (navigator.share) {
                navigator.share({
                    title: 'Konten dari Scarlet Nexus AI',
                    text: text.substring(0, 100) + '...',
                    url: window.location.href
                }).then(() => {
                    showNotification('✅ Konten berhasil dibagikan!', 'success');
                }).catch(error => {
                    console.error('Share error:', error);
                    navigator.clipboard.writeText(text);
                    showNotification('✅ Konten disalin ke clipboard! Bisa dibagikan.', 'success');
                });
            } else {
                navigator.clipboard.writeText(text);
                showNotification('✅ Konten disalin ke clipboard! Bisa dibagikan.', 'success');
            }
        });
    }
    
    // Clear button
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (outputContent) {
                outputContent.innerHTML = `
                    <div class="output-placeholder">
                        <div class="placeholder-icon">
                            <i class="fas fa-robot"></i>
                        </div>
                        <h3>Konten Akan Muncul Di Sini</h3>
                        <p>Pilih template, isi instruksi, dan klik "Generate" untuk membuat konten AI-powered!</p>
                    </div>
                `;
            }
            if (wordCount) {
                wordCount.textContent = '0 kata';
            }
            showNotification('🧹 Output berhasil dibersihkan!', 'info');
        });
    }
}

// ==================== UTILITIES ====================

// Notification System
function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(notif => notif.remove());
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }
    
    return notification;
}

function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    return icons[type] || 'fa-info-circle';
}

// ==================== DATA PERSISTENCE ====================

// Auto-save form data
setInterval(() => {
    const formData = {
        topic: topicInput ? topicInput.value : '',
        tone: toneSelect ? toneSelect.value : 'casual',
        details: detailsInput ? detailsInput.value : '',
        length: lengthSlider ? lengthSlider.value : 200,
        template: document.querySelector('.template-btn.active')?.dataset.template || 'product'
    };
    
    localStorage.setItem('scarletNexusForm', JSON.stringify(formData));
}, 3000);

// Load saved form data
window.addEventListener('load', () => {
    const saved = localStorage.getItem('scarletNexusForm');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            
            if (topicInput) topicInput.value = data.topic || '';
            if (toneSelect) toneSelect.value = data.tone || 'casual';
            if (detailsInput) detailsInput.value = data.details || '';
            
            if (lengthSlider) {
                lengthSlider.value = data.length || 200;
                if (lengthValue) {
                    lengthValue.textContent = `${data.length || 200} kata`;
                }
            }
            
            // Select template
            if (data.template) {
                const templateBtn = document.querySelector(`.template-btn[data-template="${data.template}"]`);
                if (templateBtn) {
                    // Trigger click event
                    templateBtn.click();
                }
            }
        } catch (e) {
            console.log('No saved form data');
        }
    }
});

// ==================== START APPLICATION ====================

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Additional CSS for dynamic elements
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    /* Loading dots animation */
    .loading-dots {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 20px;
    }
    
    .loading-dots span {
        width: 10px;
        height: 10px;
        background: var(--scarlet-primary);
        border-radius: 50%;
        animation: loadingDots 1.4s infinite ease-in-out both;
    }
    
    .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
    .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes loadingDots {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
    }
    
    /* Generating state */
    .generating .placeholder-icon {
        animation: pulse 2s infinite;
    }
    
    /* Secondary button for examples */
    .secondary-btn {
        background: rgba(230, 57, 70, 0.1);
        border: 2px solid var(--scarlet-primary);
        color: var(--scarlet-light);
        padding: 10px 20px;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s;
        width: 100%;
        justify-content: center;
        margin-top: 15px;
    }
    
    .secondary-btn:hover {
        background: var(--scarlet-primary);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(230, 57, 70, 0.3);
    }
    
    /* Success state for copy button */
    button.success {
        background: linear-gradient(135deg, #06d6a0 0%, #0cb48a 100%) !important;
        color: white !important;
        border-color: #06d6a0 !important;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .secondary-btn {
            padding: 12px;
            font-size: 0.9rem;
        }
        
        .output-placeholder {
            padding: 2rem !important;
        }
        
        .output-placeholder h3 {
            font-size: 1.3rem;
        }
    }
`;
document.head.appendChild(additionalStyles);