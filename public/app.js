class SkinbookApp {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.routines = [];
        this.editingId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadRoutines();
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
        });

        document.getElementById('routineForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        document.getElementById('skinTypeFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('searchInput').addEventListener('input', () => this.applyFilters());
        document.getElementById('startBtn').addEventListener('click', () => this.switchView('routines'));
    }

    switchView(viewName) {
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        document.getElementById(`view-${viewName}`).classList.add('active');
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        if (viewName === 'routines') {
            this.loadRoutines();
        }
        if (viewName === 'create') {
            if (!this.editingId) {
                document.getElementById('routineForm').reset();
            }
        }
    }

    async loadRoutines() {
        try {
            const response = await fetch(`${this.apiUrl}/routines`);
            const result = await response.json();
            if (result.success) {
                this.routines = result.data;
                this.renderRoutines(this.routines);
            }
        } catch (error) {
            console.error('Load error:', error);
            this.showToast('Error loading routines', 'error');
        }
    }

    renderRoutines(routines) {
        const container = document.getElementById('routinesList');
        if (routines.length === 0) {
            container.innerHTML = '<p>No routines found</p>';
            return;
        }
        
        container.innerHTML = routines.map(r => `
            <div class="routine-card" style="position: relative;">
                <div style="font-size: 0.8em; color: #888; text-transform: uppercase; margin-bottom: 5px;">👤 Creator: ${r.creatorName || 'SkincareEnthusiast'}</div>
                <h3>${r.name}</h3>
                <p><strong>Skin Type:</strong> ${r.skinType}</p>
                <p><strong>Difficulty:</strong> ${'⭐'.repeat(r.difficulty || 3)}</p>
                <p>${r.description || 'No description'}</p>
                <button class="btn btn-primary" onclick="app.loadAndEdit(${r.id})">Edit</button>
                <button class="btn" onclick="app.deleteRoutine(${r.id})">Delete</button>
            </div>
        `).join('');
    }

    applyFilters() {
        const skinType = document.getElementById('skinTypeFilter').value;
        const search = document.getElementById('searchInput').value;

        let filtered = this.routines;

        if (skinType) {
            filtered = filtered.filter(r => r.skinType === skinType);
        }
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(r =>
                r.name.toLowerCase().includes(searchLower) ||
                (r.description && r.description.toLowerCase().includes(searchLower))
            );
        }

        this.renderRoutines(filtered);
    }

    loadAndEdit(id) {
        this.switchView('create');
        setTimeout(() => {
            this.editRoutine(id);
        }, 100);
    }

    async editRoutine(id) {
        try {
            const response = await fetch(`${this.apiUrl}/routines/${id}`);
            const result = await response.json();

            if (result.success && result.data) {
                const r = result.data;
                
                document.getElementById('routineName').value = r.name;
                document.getElementById('skinType').value = r.skinType;
                document.getElementById('category').value = r.category || '';
                document.getElementById('difficulty').value = r.difficulty || 3;
                document.getElementById('description').value = r.description || '';
                document.getElementById('steps').value = r.steps || '';

                this.editingId = id;
            }
        } catch (error) {
            console.error('Error:', error);
            this.showToast('Error loading routine', 'error');
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('routineName').value;
        const skinType = document.getElementById('skinType').value;
        const category = document.getElementById('category').value;
        const difficulty = parseInt(document.getElementById('difficulty').value) || 3;
        const description = document.getElementById('description').value;
        const steps = document.getElementById('steps').value;

        // Front-end input validation
        if (!name || name.trim() === '') {
            this.showToast('Name is required!', 'error');
            return;
        }
        if (name.trim().length < 3) {
            this.showToast('Name must be at least 3 characters long!', 'error');
            return;
        }
        if (name.length > 100) {
            this.showToast('Name must not exceed 100 characters!', 'error');
            return;
        }
        if (!skinType) {
            this.showToast('Skin type is required!', 'error');
            return;
        }
        if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) {
            this.showToast('Difficulty must be between 1 and 5!', 'error');
            return;
        }

        const formData = {
            name,
            skinType,
            category,
            difficulty,
            description,
            steps,
            userId: 1 // Default to 1 for database relationship
        };

        try {
            let response;
            
            if (this.editingId) {
                response = await fetch(`${this.apiUrl}/routines/${this.editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                response = await fetch(`${this.apiUrl}/routines`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }

            const result = await response.json();

            if (response.ok) {
                this.showToast(
                    this.editingId ? 'Routine updated!' : 'Routine created!',
                    'success'
                );
                document.getElementById('routineForm').reset();
                this.editingId = null;
                await this.loadRoutines();
                this.switchView('routines');
            } else {
                this.showToast(result.error || 'Error', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showToast('Error saving routine', 'error');
        }
    }

    async deleteRoutine(id) {
        if (!confirm('Delete this routine?')) return;

        try {
            const response = await fetch(`${this.apiUrl}/routines/${id}`, { 
                method: 'DELETE' 
            });
            
            if (response.ok) {
                this.showToast('Routine deleted!', 'success');
                await this.loadRoutines();
            }
        } catch (error) {
            console.error('Error:', error);
            this.showToast('Error deleting routine', 'error');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type === 'error' ? 'error' : ''}`;

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new SkinbookApp();
});