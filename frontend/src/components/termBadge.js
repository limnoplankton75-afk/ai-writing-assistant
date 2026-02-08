// Component untuk Term Badge (istilah lokal)
export class TermBadge {
    constructor(term, category) {
        this.term = term;
        this.category = category;
        this.element = this.createElement();
    }

    createElement() {
        const badge = document.createElement('span');
        badge.className = 'term-badge';
        badge.dataset.category = this.category;
        badge.textContent = this.term;
        
        // Tooltip untuk kategori
        badge.title = `Kategori: ${this.category}`;
        
        return badge;
    }

    // Handler untuk klik badge
    onClick(callback) {
        this.element.addEventListener('click', () => {
            callback(this.term);
        });
    }

    // Getter untuk element DOM
    getElement() {
        return this.element;
    }

    // Update style badge berdasarkan kategori
    setCategoryStyle() {
        const categoryColors = {
            'food': '#FFEAA7',
            'fashion': '#FD79A8',
            'tech': '#74B9FF',
            'travel': '#55EFC4',
            'business': '#A29BFE'
        };

        const textColors = {
            'food': '#E17055',
            'fashion': '#D63031',
            'tech': '#0984E3',
            'travel': '#00B894',
            'business': '#6C5CE7'
        };

        if (categoryColors[this.category]) {
            this.element.style.backgroundColor = categoryColors[this.category];
            this.element.style.color = textColors[this.category];
            this.element.style.borderColor = textColors[this.category];
        }
    }

    // Static method untuk membuat multiple badges
    static createBadges(termsData, container, onTermClick) {
        container.innerHTML = '';
        
        // Flatten semua terms
        let allTerms = [];
        Object.entries(termsData).forEach(([category, terms]) => {
            terms.forEach(term => {
                allTerms.push({ term, category });
            });
        });
        
        // Acak urutan
        allTerms.sort(() => Math.random() - 0.5);
        
        // Ambil 12 terms pertama
        const selectedTerms = allTerms.slice(0, 12);
        
        // Buat badges
        selectedTerms.forEach(({ term, category }) => {
            const badge = new TermBadge(term, category);
            badge.setCategoryStyle();
            badge.onClick(onTermClick);
            container.appendChild(badge.getElement());
        });
    }

    // Static method untuk search terms
    static searchTerms(termsData, query) {
        const results = [];
        query = query.toLowerCase();
        
        Object.entries(termsData).forEach(([category, terms]) => {
            terms.forEach(term => {
                if (term.toLowerCase().includes(query)) {
                    results.push({ term, category });
                }
            });
        });
        
        return results;
    }
}

// Export juga fungsi utility
export const termUtils = {
    // Kategorikan terms berdasarkan pola
    categorizeTerm(term) {
        const patterns = {
            food: /\b(makan|minum|kuliner|cemilan|jajanan|kue|kopi|teh)\b/i,
            fashion: /\b(baju|pakaian|outfit|style|mode|aksesoris|sepatu|tas)\b/i,
            tech: /\b(gadget|teknologi|smartphone|laptop|aplikasi|digital|online)\b/i,
            travel: /\b(wisata|destinasi|travel|liburan|hotel|penginapan|tour)\b/i,
            business: /\b(bisnis|usaha|UMKM|modal|profit|pemasaran|strategi)\b/i
        };

        for (const [category, pattern] of Object.entries(patterns)) {
            if (pattern.test(term)) {
                return category;
            }
        }
        
        return 'general';
    },

    // Format term untuk display
    formatTerm(term) {
        return term
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    },

    // Generate suggestion berdasarkan term
    generateSuggestion(term, category) {
        const suggestions = {
            food: `Coba sertakan "${term}" dalam deskripsi kuliner untuk meningkatkan selera pembaca.`,
            fashion: `Gunakan "${term}" untuk membuat deskripsi produk fashion lebih menarik.`,
            tech: `Istilah "${term}" akan membuat konten teknologi terupdate dan relevan.`,
            travel: `"${term}" adalah keyword yang bagus untuk konten pariwisata Indonesia.`,
            business: `Sertakan "${term}" untuk menunjukkan keahlian di bidang bisnis lokal.`,
            general: `Tambahkan "${term}" untuk membuat konten lebih relate dengan pembaca.`
        };

        return suggestions[category] || suggestions.general;
    }
};

// Jika digunakan sebagai module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TermBadge, termUtils };
}